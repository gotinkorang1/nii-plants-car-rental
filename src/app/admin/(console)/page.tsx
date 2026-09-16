import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/require-staff";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { canViewEnquiries } from "@/lib/enquiries/permissions";
import {
  formatEnquiryAge,
  getEnquiriesDashboard,
} from "@/lib/enquiries/queries";
import { enquiryServiceLabel, enquiryStatusLabel } from "@/lib/enquiries/status";
import { canViewOperations } from "@/lib/operations/permissions";
import { getOperationsDashboard } from "@/lib/operations/queries";

export default async function AdminDashboardPage() {
  const staff = await requireStaff();
  const showOperations = canViewOperations(staff.role);
  const showEnquiries = canViewEnquiries(staff.role);
  const dashboard = showOperations
    ? await getOperationsDashboard()
    : {
        todayPickups: 0,
        todayReturns: 0,
        vehiclesRented: 0,
        vehiclesMaintenance: 0,
        attentionCount: 0,
        outstandingBalanceCount: 0,
        pickups: [],
        returns: [],
      };
  const enquiriesDashboard = showEnquiries
    ? await getEnquiriesDashboard()
    : {
        newCount: 0,
        awaitingResponseCount: 0,
        quotedCount: 0,
        followUpCount: 0,
        priority: [],
      };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Operational overview for rentals, enquiries, fleet status, and balances needing
          attention.
        </p>
      </header>

      {showEnquiries ? (
        <section aria-label="Enquiry overview">
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="New enquiries" value={enquiriesDashboard.newCount} href="/admin/enquiries?status=new" />
            <StatCard
              title="Awaiting response"
              value={enquiriesDashboard.awaitingResponseCount}
              href="/admin/enquiries"
            />
            <StatCard
              title="Quoted enquiries"
              value={enquiriesDashboard.quotedCount}
              href="/admin/enquiries?status=quoted"
            />
            <StatCard
              title="Needing follow-up"
              value={enquiriesDashboard.followUpCount}
              href="/admin/enquiries"
            />
          </ul>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>New / unassigned enquiries</CardTitle>
            </CardHeader>
            <CardContent>
              {enquiriesDashboard.priority.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open unassigned enquiries.</p>
              ) : (
                <ul className="space-y-3">
                  {enquiriesDashboard.priority.map((item) => (
                    <li key={String(item.id)} className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium">{String(item.reference)}</p>
                          <p className="mt-1 text-muted-foreground">
                            {String(item.firstName)} {String(item.lastName)} ·{" "}
                            {enquiryServiceLabel(item.serviceType as import("@/lib/enquiries/status").EnquiryServiceType)}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {formatEnquiryAge(item.createdAt as Date)} ·{" "}
                            {enquiryStatusLabel(item.status as import("@/lib/enquiries/status").EnquiryStatus)}
                          </p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="shrink-0">
                          <Link href={`/admin/enquiries/${item.id}`}>Open</Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {showOperations ? (
        <>
          <section aria-label="Today's operations">
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard title="Today's pickups" value={dashboard.todayPickups} href="/admin/bookings" />
              <StatCard title="Today's returns" value={dashboard.todayReturns} href="/admin/operations/rentals" />
              <StatCard title="Vehicles rented" value={dashboard.vehiclesRented} href="/admin/operations/rentals" />
              <StatCard title="In maintenance" value={dashboard.vehiclesMaintenance} href="/admin/maintenance" />
              <StatCard title="Bookings needing attention" value={dashboard.attentionCount} href="/admin/bookings" />
              <StatCard
                title="Outstanding balances"
                value={dashboard.outstandingBalanceCount}
                href="/admin/bookings"
              />
            </ul>
          </section>

          <section className="grid gap-4 lg:grid-cols-2" aria-label="Upcoming work">
            <WorkList
              title="Today's pickups"
              empty="No confirmed or ready pickups scheduled for today."
              items={dashboard.pickups.map((item) => ({
                id: String(item.id),
                primary: String(item.reference),
                secondary: `${item.firstName} ${item.lastName} · ${item.make} ${item.model}`,
                meta: `${utcToAccraDateInput(item.pickupAt as Date)} ${utcToAccraTimeInput(item.pickupAt as Date)}`,
                href: `/admin/bookings/${item.id}/pickup`,
              }))}
            />
            <WorkList
              title="Returns due"
              empty="No checked-out rentals due back today or earlier."
              items={dashboard.returns.map((item) => ({
                id: String(item.id),
                primary: String(item.reference),
                secondary: `${item.firstName} ${item.lastName} · ${item.make} ${item.model}`,
                meta: `${utcToAccraDateInput(item.returnAt as Date)} ${utcToAccraTimeInput(item.returnAt as Date)}`,
                href: `/admin/bookings/${item.id}/return`,
                overdue: Boolean(item.overdue),
              }))}
            />
          </section>
        </>
      ) : (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          Operational metrics are hidden for your role.
        </p>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <li>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{value === 1 ? "1 item" : `${value} items`}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end justify-between gap-4">
          <p className="text-3xl font-medium tabular-nums">{value}</p>
          <Button asChild variant="outline" size="sm">
            <Link href={href}>View</Link>
          </Button>
        </CardContent>
      </Card>
    </li>
  );
}

function WorkList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{
    id: string;
    primary: string;
    secondary: string;
    meta: string;
    href: string;
    overdue?: boolean;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{item.primary}</p>
                    <p className="mt-1 text-muted-foreground">{item.secondary}</p>
                    <p className="mt-1 text-muted-foreground">{item.meta}</p>
                    {item.overdue ? (
                      <p className="mt-1 text-destructive">Overdue return</p>
                    ) : null}
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href={item.href}>Open</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
