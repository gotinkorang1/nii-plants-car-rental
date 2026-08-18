import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicFleetFilters } from "@/lib/fleet/filters";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function FleetFilters({
  classes,
  filters,
}: {
  classes: { name: string; slug: string }[];
  filters: PublicFleetFilters;
}) {
  return (
    <form
      method="get"
      className="grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-border sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="class">Vehicle class</Label>
        <select
          id="class"
          name="class"
          defaultValue={filters.classSlug ?? ""}
          className={selectClassName}
        >
          <option value="">All classes</option>
          {classes.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="seats">Minimum seats</Label>
        <Input
          id="seats"
          name="seats"
          type="number"
          min={1}
          max={20}
          defaultValue={filters.minSeats ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="transmission">Transmission</Label>
        <select
          id="transmission"
          name="transmission"
          defaultValue={filters.transmission ?? ""}
          className={selectClassName}
        >
          <option value="">Any</option>
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="maxPrice">Max daily rate (GHS)</Label>
        <Input
          id="maxPrice"
          name="maxPrice"
          inputMode="decimal"
          defaultValue={filters.maxPriceGhs ?? ""}
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full">
          Filter fleet
        </Button>
      </div>
    </form>
  );
}
