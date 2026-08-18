import { cancelManualBlockAction } from "@/lib/availability/admin-actions";
import type { StaffVehicleOccupancy } from "@/lib/availability/staff-occupancy";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";

export function OccupancyTable({
  rows,
  canManage,
}: {
  rows: StaffVehicleOccupancy[];
  canManage: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Internal code</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Current status</TableHead>
          <TableHead>Occupancy</TableHead>
          <TableHead>Overlapping records</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.vehicleId}>
            <TableCell className="font-medium">{row.internalCode}</TableCell>
            <TableCell>
              {row.make} {row.model}
            </TableCell>
            <TableCell className="capitalize">{row.status}</TableCell>
            <TableCell>{row.occupancy}</TableCell>
            <TableCell>
              {row.allocations.length === 0 ? (
                <span className="text-muted-foreground">None in range</span>
              ) : (
                <ul className="space-y-2 text-xs">
                  {row.allocations.map((allocation) => (
                    <li key={allocation.id} className="flex flex-col gap-1">
                      <span>
                        {allocation.allocationType} · {allocation.status} ·{" "}
                        {utcToAccraDateInput(allocation.startAt)}{" "}
                        {utcToAccraTimeInput(allocation.startAt)} →{" "}
                        {utcToAccraDateInput(allocation.endAt)}{" "}
                        {utcToAccraTimeInput(allocation.endAt)}
                      </span>
                      {allocation.reason ? (
                        <span className="text-muted-foreground">{allocation.reason}</span>
                      ) : null}
                      {canManage &&
                      ["manual_block", "maintenance"].includes(allocation.allocationType) &&
                      allocation.status === "confirmed" ? (
                        <form action={cancelManualBlockAction.bind(null, allocation.id)}>
                          <Button type="submit" size="sm" variant="outline">
                            Unblock
                          </Button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
