-- Fix ambiguous column reference in create_vehicle_hold().
-- The RETURNING clause referenced `inventory_slot_id` and `vehicle_id` unqualified,
-- which collide with the function's RETURNS TABLE output columns of the same name
-- (PL/pgSQL raises 42702 "column reference is ambiguous"). Qualifying the RETURNING
-- columns with the target table resolves the ambiguity. Body is otherwise identical
-- to the definition in 0013_capacity_based_inventory.sql.
-- CREATE OR REPLACE preserves the existing REVOKE/GRANT privileges.
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

  UPDATE public.vehicle_allocations
  SET status = 'expired'
  WHERE status = 'hold' AND expires_at IS NOT NULL AND expires_at <= now();

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
  FOR UPDATE OF slot SKIP LOCKED;

  IF candidate_slot_id IS NULL THEN
    RAISE EXCEPTION 'VEHICLE_UNAVAILABLE' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.vehicle_allocations (
    inventory_slot_id, vehicle_id, quote_id, allocation_type, status,
    start_at, end_at, expires_at, created_by
  ) VALUES (
    candidate_slot_id, NULL, p_quote_id, 'booking', 'hold',
    p_pickup_at, p_return_at, hold_expires, p_created_by
  )
  RETURNING
    vehicle_allocations.id,
    vehicle_allocations.inventory_slot_id,
    vehicle_allocations.vehicle_id
  INTO allocation_id, inventory_slot_id, vehicle_id;

  RETURN NEXT;
END;
$$;
