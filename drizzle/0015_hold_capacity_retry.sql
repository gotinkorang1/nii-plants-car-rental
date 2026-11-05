-- Make create_vehicle_hold saturate capacity under concurrency.
--
-- The slot acquisition uses FOR UPDATE ... SKIP LOCKED, which never oversells
-- (two callers can't lock the same slot) but can *under*-fill under a burst of
-- concurrent requests: a caller may find every free slot momentarily row-locked
-- by other in-flight holds and give up, even though a slot would become free an
-- instant later. That made "N concurrent requests against N free slots" settle
-- at N-1 sometimes instead of N (a spurious VEHICLE_UNAVAILABLE).
--
-- Fix: wrap the acquisition in a bounded retry. If SKIP LOCKED returns nothing,
-- check whether any eligible slot exists at all (ignoring locks). If none, the
-- model/location is genuinely full -> raise immediately. If one exists but is
-- transiently locked, wait briefly for the competing hold to commit, then retry.
-- SKIP LOCKED is kept on every attempt, so the no-oversell guarantee is intact.
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
  free_slot_exists boolean;
  attempt integer := 0;
  max_attempts constant integer := 10;
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

  UPDATE public.vehicle_allocations
  SET status = 'expired'
  WHERE status = 'hold'
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  hold_expires := now() + make_interval(mins => p_hold_minutes);

  LOOP
    attempt := attempt + 1;

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
    FOR UPDATE OF slot SKIP LOCKED;

    EXIT WHEN candidate_slot_id IS NOT NULL;

    -- No unlocked free slot this pass. Is any eligible slot free at all
    -- (ignoring row locks held by concurrent holds)?
    SELECT EXISTS (
      SELECT 1
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
    )
    INTO free_slot_exists;

    -- Genuinely full, or retries exhausted: report unavailable.
    IF NOT free_slot_exists OR attempt >= max_attempts THEN
      RAISE EXCEPTION 'VEHICLE_UNAVAILABLE' USING ERRCODE = 'P0001';
    END IF;

    -- A free slot exists but is locked by an in-flight hold; let it commit, then retry.
    PERFORM pg_sleep(0.02);
  END LOOP;

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
