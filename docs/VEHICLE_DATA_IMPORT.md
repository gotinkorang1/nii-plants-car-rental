# Vehicle data import (CarDatabase)

An admin-only productivity feature. Staff search a vehicle database while
creating a fleet model, and the returned specifications pre-fill the form.

Nothing about booking, availability, allocation, pricing, Paystack, enquiries or
operations depends on it. Once a model is saved, the Nii Plants database is
authoritative and public pages read only from Supabase.

## Provider

| | |
| --- | --- |
| Provider | [CarDatabase](https://cardatabase.dev) |
| Base URL | `https://cardatabase.dev/api/v1` (override with `CARDATABASE_BASE_URL`) |
| Auth | `X-API-Key` request header; keys begin `cd_` |
| Search | `GET /models?search=<query>&limit=…` |
| Detail | `GET /models/{brand_slug}/{model_code}` and its `/specs` companion |
| Image bytes | `GET /images/{public_id}/file` |

The OpenAPI description is published at `https://cardatabase.dev/swagger/swagger.json`.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `CARDATABASE_API_KEY` | no | Server-only key. Without it the lookup UI is hidden and manual model creation is unaffected. |
| `CARDATABASE_BASE_URL` | no | Override the API origin. Image URLs are only accepted on this origin. |
| `CARDATABASE_IMAGE_IMPORT_ENABLED` | no | Set to `1` to allow copying provider images into Supabase Storage. See "Image rights" below. |
| `CARDATABASE_MOCK` | no | Serve fixture vehicles instead of calling the provider. Refused in production by `src/lib/env/guards.ts`. |

The key is never exposed through a `NEXT_PUBLIC_*` variable and never reaches
the browser. `tests/integration/vehicle-data-access.test.ts` asserts both.

## Image rights

**CarDatabase publishes no terms covering redistribution or storage of its
imagery.** Nothing on the site or in the OpenAPI description grants the right to
copy images into another system, so no such right is assumed.

Two consequences:

1. Copying images into Supabase Storage is off unless an operator sets
   `CARDATABASE_IMAGE_IMPORT_ENABLED=1`, which is the operator asserting they
   have confirmed those rights with the provider. When it is unset, the gallery
   still previews images so staff can identify the right vehicle, but nothing is
   persisted.
2. Hotlinking is impossible regardless: image URLs require the API key, so a
   public page could never load one directly. Provider images are proxied
   through `GET /api/admin/vehicle-data/image`, which is staff-only.

Staff-uploaded photographs of the actual rental vehicles are unaffected and are
preferred on public pages.

## Flow

1. Staff type in the lookup on `/admin/fleet/models/new`. Input is debounced at
   300 ms with a 2-character minimum, and each new keystroke aborts the request
   in flight so a slow earlier response cannot overwrite newer results.
2. `GET /api/admin/vehicle-data/search?q=…` validates the query, rate-limits per
   staff member, and returns normalized suggestions only.
3. Selecting a suggestion calls
   `GET /api/admin/vehicle-data/vehicle/[...providerId]`, which returns the
   normalized fields, an image list of proxy URLs, and any similar models
   already in the catalogue.
4. The form fields populate and remain fully editable. Business fields —
   vehicle class, daily rate, deposit, published, featured, description,
   luggage — are never touched by an import.
5. On save, provenance is recorded (`external_provider`, `external_vehicle_id`,
   `external_imported_at`) and any selected images are copied into storage.

## Units

Stored in fixed units, encoded in the column name: `power_kw`, `torque_nm`,
`length_mm`, `width_mm`, `height_mm`, `wheelbase_mm`, `battery_capacity_kwh`,
`usable_battery_kwh`, `ev_range_km`, `ac_charging_kw`, `dc_charging_kw`,
`engine_displacement_l`, `fuel_economy_l_per_100km`. Horsepower is derived for
display only. A value the provider omits stays `NULL`; nothing is guessed.

## Custom specifications

`vehicle_models.custom_fields` is a JSONB array of
`{ label, value, showPublicly }`, order preserved. Only rows with
`showPublicly: true` reach `PublicVehicleModel.customSpecs`; the raw column is
rejected by `assertNoInternalVehicleFields`.

## Caching and quota

Search and detail responses are cached in-process with a short TTL, and each
staff member is rate-limited per endpoint so a fast typist cannot storm the
provider. Structured logs: `vehicle_data_search`, `vehicle_data_fetch`,
`vehicle_data_rate_limit`, `vehicle_data_failure`. The API key is never logged.

## Deferred

Re-importing over an existing model is **not** implemented. The edit page shows
provenance and lets staff unlink the record, but there is no
"update from CarDatabase" action. Adding one requires a field-by-field
comparison that staff approve before anything is overwritten; silently
refreshing would destroy local corrections.
