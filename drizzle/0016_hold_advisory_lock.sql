-- Make create_vehicle_hold deterministic under concurrency with an advisory lock.
--
-- The SKIP LOCKED acquisition (0014) plus bounded retry (0015) reduced but did
-- not eliminate under-fill under a burst of concurrent holds: a caller could
-- still exhaust its retry window while a free slot stayed briefly locked by a
-- competing hold, yielding N-1 of N (the flaky "expected 9 to be 10").
--
-- Serialize hold creation per (model, location) with a transaction-scoped
-- advisory lock. Holds for the same model+location now run one at a time, so
-- slot selection sees a stable, committed picture and fills every free slot in
-- order with no race; holds for different model/location use different lock
-- keys and still run concurrently. The critical section is a single slot pick +
-- insert, so the serialization cost is negligible. SKIP LOCKED and the retry
-- loop are no longer needed and are removed.
CREATE OR REPLACE FUNCTION public.create_vehicle_hold(
  p_vehicle_model_id uuid,
  p_pickup_location_id uuid,
  p_pickup_at timestamptz,
  p_return_at timestamptz,
  p_quote_id uuid,
  p_hold_minutes integer,
  p_created_by uuid DEFAULT NULL
)
RETURNS TABLE(allocation_id uuid, inventory_slot_id uuid, vehicle_id uuid)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate_slot_id uuid;
  hold_expires timestamptz;
BEGIN
  IF p_vehicle_model_id IS NULL OR p_pickup_location_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INVENTORY_SELECTION' USING ERRCODE = '22023';
  END IF;
  IF p_pickup_at IS NULL OR p_return_at IS NULL OR p_pickup_at >= p_return_at THEN
    RAISE EXCEPTION 'INVALID_TIME_RANGE' USING ERRCODE = '22023';
  END IF;
  IF p_quote_id IS NULL OR p_hold_minutes IS NULL OR p_hold_minutes < 1 THEN
    RAISE EXCEPTION 'INVALID_HOLD_INPUT' USING ERRCODE = '22023';
  END IF;

  -- Serialize concurrent holds for this model+location. Released at transaction end.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_vehicle_model_id::text || ':' || p_pickup_location_id::text, 0)
  );

  UPDATE public.vehicle_allocations
  SET status = 'expired'
  WHERE status = 'hold'
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  hold_expires := now() + make_interval(mins => p_hold_minutes);

  SELECT slot.id
  INTO candidate_slot_id
  FROM public.vehicle_inventory_slots AS slot
  WHERE slot.vehicle_model_id = p_vehicle_model_id
    AND slot.pickup_location_id = p_pickup_location_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.vehicle_allocations AS allocation
      WHERE allocation.inventory_slot_id = slot.id
        AND allocation.start_at < p_return_at
        AND allocation.end_at > p_pickup_at
        AND (
          allocation.status IN ('confirmed', 'ready', 'checked_out')
          OR (allocation.status = 'hold' AND allocation.expires_at > now())
        )
    )
  ORDER BY slot.slot_number
  LIMIT 1
  FOR UPDATE OF slot;

  IF candidate_slot_id IS NULL THEN
    RAISE EXCEPTION 'VEHICLE_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.vehicle_allocations (
    inventory_slot_id,
    vehicle_id,
    quote_id,
    allocation_type,
    status,
    start_at,
    end_at,
    expires_at,
    created_by
  )
  VALUES (
    candidate_slot_id,
    NULL,
    p_quote_id,
    'booking',
    'hold',
    p_pickup_at,
    p_return_at,
    hold_expires,
    p_created_by
  )
  RETURNING
    vehicle_allocations.id,
    vehicle_allocations.inventory_slot_id,
    vehicle_allocations.vehicle_id
  INTO allocation_id, inventory_slot_id, vehicle_id;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.create_vehicle_hold(uuid, uuid, timestamptz, timestamptz, uuid, integer, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_vehicle_hold(uuid, uuid, timestamptz, timestamptz, uuid, integer, uuid)
  TO service_role;
