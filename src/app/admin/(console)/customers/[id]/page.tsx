import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/require-role";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { customerStatusLabel } from "@/lib/bookings/status";
import { CUSTOMER_VIEW_ROLES } from "@/lib/customers/permissions";
import { getAdminCustomer } from "@/lib/customers/queries";
import { formatGhs } from "@/lib/money";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  await requireRole(CUSTOMER_VIEW_ROLES);
  const { id } = await params;
  const detail = await getAdminCustomer(id);
  if (!detail) {
    notFound();
  }

  const { customer, hires, summary } = detail;
  const latestHire = hires[0] ?? null;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        description={`${customer.email} · first recorded ${utcToAccraDateInput(customer.createdAt)}`}
      />

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="font-heading text-xl">
          Contact
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Item label="Email" value={customer.email} />
          <Item label="Phone" value={customer.phone} />
          <Item
            label="Account"
            value={customer.guest ? "Guest hire (no login required)" : "Account linked"}
          />
          <Item
            label="Outstanding hire balances"
            value={formatGhs(summary.outstandingBalance)}
          />
        </dl>
        <div className="mt-4">
          <Badge variant={customer.guest ? "outline" : "secondary"}>
            {customer.guest ? "Guest" : "Account linked"}
          </Badge>
        </div>
      </section>

      {latestHire ? (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="licence-heading">
          <h2 id="licence-heading" className="font-heading text-xl">
            Latest hire licence
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Driving licence is stored on each booking, not as a separate customer profile field.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Item label="Driver age" value={String(latestHire.driverAge)} />
            <Item label="Licence country" value={latestHire.licenceCountry} />
            <Item
              label="Licence number"
              value={latestHire.licenceNumber ?? "Not provided"}
            />
            <Item label="Booking" value={latestHire.reference} />
          </dl>
        </section>
      ) : null}

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="history-heading">
        <h2 id="history-heading" className="font-heading text-xl">
          Hire history
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {summary.bookingCount === 0
            ? "This customer has no bookings yet."
            : `${summary.bookingCount} booking${summary.bookingCount === 1 ? "" : "s"} on file. Amounts are in Ghana cedis.`}
        </p>
        {hires.length === 0 ? null : (
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rental total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hires.map((hire) => (
                  <TableRow key={hire.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/bookings/${hire.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {hire.reference}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {hire.make} {hire.model}
                      <div className="text-muted-foreground">{hire.className}</div>
                    </TableCell>
                    <TableCell>
                      {utcToAccraDateInput(hire.pickupAt)} {utcToAccraTimeInput(hire.pickupAt)}
                    </TableCell>
                    <TableCell>
                      {utcToAccraDateInput(hire.returnAt)} {utcToAccraTimeInput(hire.returnAt)}
                    </TableCell>
                    <TableCell>{customerStatusLabel(hire.status)}</TableCell>
                    <TableCell>{formatGhs(hire.rentalTotal)}</TableCell>
                    <TableCell>{formatGhs(hire.amountPaid)}</TableCell>
                    <TableCell>{formatGhs(hire.remainingBalance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/admin/customers">Back to customers</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
