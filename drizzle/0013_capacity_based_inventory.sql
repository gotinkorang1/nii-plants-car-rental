-- Reserve capacity slots per exact vehicle model and office pickup location.
INSERT INTO public.locations (name, slug, type, address, active)
VALUES
  ('Alisa Hotel - Ridge', 'alisa-hotel-ridge', 'branch', 'Alisa Hotel, North Ridge, Accra', true),
  ('Alisa Hotel - Tema', 'alisa-hotel-tema', 'branch', 'Alisa Hotel, Tema, Ghana', true),
  ('Head office - Dansoman', 'head-office-dansoman', 'branch', 'Plantsville, Poultry Farm Avenue, Akokor Foto, Dansoman, Accra', true)
ON CONFLICT (slug) DO UPDATE SET
  name = excluded.name,
  type = excluded.type,
  address = excluded.address,
  active = true;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.vehicle_inventory_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  vehicle_model_id uuid NOT NULL REFERENCES public.vehicle_models(id) ON DELETE CASCADE,
  pickup_location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  slot_number integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT vehicle_inventory_slots_slot_number_range CHECK (slot_number BETWEEN 1 AND 10)
);
--> statement-breakpoint
ALTER TABLE public.vehicle_inventory_slots ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_inventory_slots_model_location_slot_uidx
  ON public.vehicle_inventory_slots (vehicle_model_id, pickup_location_id, slot_number);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vehicle_inventory_slots_model_location_idx
  ON public.vehicle_inventory_slots (vehicle_model_id, pickup_location_id);
--> statement-breakpoint
ALTER TABLE public.vehicle_allocations
  ADD COLUMN IF NOT EXISTS inventory_slot_id uuid REFERENCES public.vehicle_inventory_slots(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE public.vehicle_allocations
  ALTER COLUMN vehicle_id DROP NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vehicle_allocations_inventory_slot_idx
  ON public.vehicle_allocations (inventory_slot_id);
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE public.vehicle_allocations
  DROP CONSTRAINT IF EXISTS vehicle_allocations_inventory_slot_no_overlap_excl;
--> statement-breakpoint
ALTER TABLE public.vehicle_allocations
  ADD CONSTRAINT vehicle_allocations_inventory_slot_no_overlap_excl
  EXCLUDE USING gist (
    inventory_slot_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (inventory_slot_id IS NOT NULL AND status IN ('hold', 'confirmed', 'ready', 'checked_out'));
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.provision_vehicle_inventory_slots_for_model()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.vehicle_inventory_slots (vehicle_model_id, pickup_location_id, slot_number)
  SELECT NEW.id, l.id, slots.slot_number
  FROM public.locations AS l
  CROSS JOIN generate_series(1, 10) AS slots(slot_number)
  WHERE l.slug IN ('alisa-hotel-ridge', 'alisa-hotel-tema', 'head-office-dansoman')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vehicle_models_provision_inventory_slots ON public.vehicle_models;
--> statement-breakpoint
CREATE TRIGGER vehicle_models_provision_inventory_slots
AFTER INSERT ON public.vehicle_models
FOR EACH ROW EXECUTE FUNCTION public.provision_vehicle_inventory_slots_for_model();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.provision_vehicle_inventory_slots_for_location()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IN ('alisa-hotel-ridge', 'alisa-hotel-tema', 'head-office-dansoman') THEN
    INSERT INTO public.vehicle_inventory_slots (vehicle_model_id, pickup_location_id, slot_number)
    SELECT m.id, NEW.id, slots.slot_number
    FROM public.vehicle_models AS m
    CROSS JOIN generate_series(1, 10) AS slots(slot_number)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS locations_provision_inventory_slots ON public.locations;
--> statement-breakpoint
CREATE TRIGGER locations_provision_inventory_slots
AFTER INSERT ON public.locations
FOR EACH ROW EXECUTE FUNCTION public.provision_vehicle_inventory_slots_for_location();
--> statement-breakpoint
INSERT INTO public.vehicle_inventory_slots (vehicle_model_id, pickup_location_id, slot_number)
SELECT m.id, l.id, slots.slot_number
FROM public.vehicle_models AS m
CROSS JOIN public.locations AS l
CROSS JOIN generate_series(1, 10) AS slots(slot_number)
WHERE l.slug IN ('alisa-hotel-ridge', 'alisa-hotel-tema', 'head-office-dansoman')
ON CONFLICT DO NOTHING;
--> statement-breakpoint
DROP FUNCTION IF EXISTS public.create_vehicle_hold(uuid, uuid, timestamptz, timestamptz, uuid, integer, uuid);
--> statement-breakpoint
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
  RETURNING id, inventory_slot_id, vehicle_id
  INTO allocation_id, inventory_slot_id, vehicle_id;

  RETURN NEXT;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.create_vehicle_hold(uuid, uuid, timestamptz, timestamptz, uuid, integer, uuid) FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.create_vehicle_hold(uuid, uuid, timestamptz, timestamptz, uuid, integer, uuid) TO service_role;
