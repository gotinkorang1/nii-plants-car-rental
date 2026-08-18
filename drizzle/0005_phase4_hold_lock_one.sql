-- Lock one eligible vehicle at a time. The previous FOR UPDATE cursor locked
-- every candidate in the class until commit, so concurrent holds could not
-- use remaining capacity.
CREATE OR REPLACE FUNCTION public.create_vehicle_hold(
  p_vehicle_class_id uuid,
  p_vehicle_model_id uuid,
  p_pickup_at timestamp with time zone,
  p_return_at timestamp with time zone,
  p_quote_id uuid,
  p_hold_minutes integer,
  p_created_by uuid DEFAULT NULL
)
RETURNS TABLE(allocation_id uuid, vehicle_id uuid)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate_id uuid;
  hold_expires timestamp with time zone;
  tried uuid[] := '{}';
BEGIN
  IF p_pickup_at IS NULL OR p_return_at IS NULL OR p_pickup_at >= p_return_at THEN
    RAISE EXCEPTION 'INVALID_TIME_RANGE'
      USING ERRCODE = '22023';
  END IF;

  IF p_vehicle_class_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_VEHICLE_CLASS'
      USING ERRCODE = '22023';
  END IF;

  IF p_quote_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_QUOTE'
      USING ERRCODE = '22023';
  END IF;

  IF p_hold_minutes IS NULL OR p_hold_minutes < 1 THEN
    RAISE EXCEPTION 'INVALID_HOLD_DURATION'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.vehicle_allocations
  SET status = 'expired'
  WHERE status = 'hold'
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  hold_expires := now() + make_interval(mins => p_hold_minutes);

  LOOP
    SELECT v.id
    INTO candidate_id
    FROM public.vehicles AS v
    WHERE v.status = 'available'
      AND v.vehicle_class_id = p_vehicle_class_id
      AND NOT (v.id = ANY (tried))
    ORDER BY
      CASE
        WHEN p_vehicle_model_id IS NOT NULL AND v.vehicle_model_id = p_vehicle_model_id THEN 0
        ELSE 1
      END,
      v.created_at,
      v.id
    FOR UPDATE OF v SKIP LOCKED
    LIMIT 1;

    EXIT WHEN candidate_id IS NULL;

    BEGIN
      INSERT INTO public.vehicle_allocations (
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
        candidate_id,
        p_quote_id,
        'booking',
        'hold',
        p_pickup_at,
        p_return_at,
        hold_expires,
        p_created_by
      )
      RETURNING
        public.vehicle_allocations.id,
        public.vehicle_allocations.vehicle_id
      INTO
        allocation_id,
        vehicle_id;

      RETURN NEXT;
      RETURN;
    EXCEPTION
      WHEN exclusion_violation THEN
        tried := array_append(tried, candidate_id);
    END;
  END LOOP;

  RAISE EXCEPTION 'VEHICLE_UNAVAILABLE'
    USING ERRCODE = 'P0001';
END;
$$;
