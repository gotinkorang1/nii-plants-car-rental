import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { getVehicleOperationalHistory } from "@/lib/operations/queries";
import { listFutureBlockingAllocations } from "@/lib/availability/manual-block";

type History = Awaited<ReturnType<typeof getVehicleOperationalHistory>>;
type FutureBlock = Awaited<ReturnType<typeof listFutureBlockingAllocations>>[number];

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  }).format(value);
}

type Props = {
  history: History;
  futureBlocks: FutureBlock[];
};

export function VehicleOperationalHistory({ history, futureBlocks }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Maintenance history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.maintenance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No maintenance records yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {history.maintenance.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/maintenance/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="text-muted-foreground capitalize">
                      {item.maintenanceType.replaceAll("_", " ")} · {item.status}
                    </p>
                  </div>
                  <span className="shrink-0 text-muted-foreground">
                    {formatDate(item.startAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent inspections</CardTitle>
        </CardHeader>
        <CardContent>
          {history.inspections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed inspections yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {history.inspections.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize">
                      {item.inspectionType} · {item.bookingReference}
                    </p>
                    <p className="text-muted-foreground">
                      {item.odometer !== null ? `${item.odometer.toLocaleString()} km` : "—"}
                      {item.fuelLevel ? ` · ${item.fuelLevel.replaceAll("_", " ")}` : ""}
                      {item.generalCondition
                        ? ` · ${item.generalCondition.replaceAll("_", " ")}`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-muted-foreground">
                    {formatDate(item.completedAt)}
                    {item.photoCount > 0 ? ` · ${item.photoCount} photos` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent rentals</CardTitle>
        </CardHeader>
        <CardContent>
          {history.rentals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rental history yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {history.rentals.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/bookings/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {item.reference}
                    </Link>
                    <p className="capitalize text-muted-foreground">{item.status}</p>
                  </div>
                  <span className="shrink-0 text-muted-foreground">
                    {formatDate(item.checkedOutAt ?? item.pickupAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Future availability blocks</CardTitle>
        </CardHeader>
        <CardContent>
          {futureBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming blocks scheduled.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {futureBlocks.map((block) => (
                <li key={block.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize">
                      {block.allocationType.replaceAll("_", " ")}
                    </p>
                    <p className="text-muted-foreground">{block.reason ?? "Scheduled block"}</p>
                  </div>
                  <span className="shrink-0 text-muted-foreground">
                    {formatDate(block.startAt)} – {formatDate(block.endAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
