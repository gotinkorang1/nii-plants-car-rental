import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  hasActivePublicFleetFilters,
  type PublicFleetFilters,
} from "@/lib/fleet/filters";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const chipClassName =
  "rounded-full px-3 py-1.5 text-sm ring-1 transition-colors duration-200";

export function FleetFilters({
  classes,
  filters,
}: {
  classes: { name: string; slug: string }[];
  filters: PublicFleetFilters;
}) {
  const filtered = hasActivePublicFleetFilters(filters);

  return (
    <div className="sticky top-16 z-30 -mx-4 space-y-4 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
      {classes.length > 0 && classes.length <= 10 ? (
        <nav aria-label="Vehicle classes">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href="/fleet"
                className={cn(
                  chipClassName,
                  !filters.classSlug
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-card text-muted-foreground ring-border hover:text-foreground",
                )}
              >
                All classes
              </Link>
            </li>
            {classes.map((item) => {
              const current = filters.classSlug === item.slug;
              return (
                <li key={item.slug}>
                  <Link
                    href={`/fleet?class=${encodeURIComponent(item.slug)}`}
                    className={cn(
                      chipClassName,
                      current
                        ? "bg-primary text-primary-foreground ring-primary"
                        : "bg-card text-muted-foreground ring-border hover:text-foreground",
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <form
        method="get"
        className="grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-border sm:grid-cols-2 lg:grid-cols-5 sm:p-5"
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
            className="h-11"
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
            className="h-11"
            defaultValue={filters.maxPriceGhs ?? ""}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" size="lg" className="w-full">
            Filter fleet
          </Button>
        </div>
      </form>
      {filtered ? (
        <p className="text-sm">
          <Link href="/fleet" className="text-primary hover:underline">
            Clear filters
          </Link>
        </p>
      ) : null}
    </div>
  );
}
