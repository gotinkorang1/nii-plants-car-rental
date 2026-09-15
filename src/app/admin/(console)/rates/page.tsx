import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ClassRateForm } from "@/components/admin/rates/class-rate-form";
import { ModelRateForm } from "@/components/admin/rates/model-rate-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/require-role";
import { RATES_MANAGE_ROLES } from "@/lib/availability/permissions";
import {
  updateClassDailyRatesAction,
  updateModelCatalogueRatesAction,
} from "@/lib/rates/admin-actions";
import {
  countRateRelatedCatalog,
  listClassRates,
  listModelCatalogueRates,
} from "@/lib/rates/queries";
import { getSiteSettings } from "@/lib/settings/get-site-settings";

export default async function AdminRatesPage() {
  await requireRole(RATES_MANAGE_ROLES);
  const [classes, models, related, settings] = await Promise.all([
    listClassRates(),
    listModelCatalogueRates(),
    countRateRelatedCatalog(),
    getSiteSettings(),
  ]);
  const unsetGhs = classes.filter((item) => item.defaultDailyRate === 0).length;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Daily rates"
        description="Ghana cedi daily rates and refundable deposits live on the vehicle class and are what Paystack charges. Published USD bands match the old shop catalogue (Accra metro vs outside Accra) and are display-only."
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Reservation share</CardTitle>
              <CardDescription>Taken at booking, before pickup</CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-3">
              <p className="text-3xl font-medium tabular-nums">
                {settings.reservationPaymentPercent}%
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/settings/site">Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Active extras</CardTitle>
              <CardDescription>Once or per chargeable day</CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-3">
              <p className="text-3xl font-medium tabular-nums">{related.extras}</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/rates/extras">Extras</Link>
              </Button>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Active promotions</CardTitle>
              <CardDescription>One code per quote</CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-3">
              <p className="text-3xl font-medium tabular-nums">
                {related.promotions}
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/rates/promotions">Promotions</Link>
              </Button>
            </CardContent>
          </Card>
        </li>
        <li>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Classes without GHS</CardTitle>
              <CardDescription>Cannot take a Paystack reservation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-medium tabular-nums">{unsetGhs}</p>
            </CardContent>
          </Card>
        </li>
      </ul>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-medium">Class booking rates</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Models inherit this GHS daily rate. Do not convert USD at a guessed
            FX rate here — enter the live Ghana cedi tariff finance has approved.
            USD from/to is the public catalogue band only.
          </p>
        </div>
        {classes.length === 0 ? (
          <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
            No vehicle classes yet. Create classes under Fleet, then return here
            to set GHS and USD.
          </p>
        ) : (
          <div className="space-y-3">
            {classes.map((item) => (
              <ClassRateForm
                key={item.id}
                item={item}
                action={updateClassDailyRatesAction.bind(null, item.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-medium">Model catalogue USD</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Override the class USD band when a published model should show a
            different Accra / outside-Accra range. Booking still uses the class
            GHS rate.
          </p>
        </div>
        {models.length === 0 ? (
          <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
            No vehicle models yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Class GHS / day</TableHead>
                <TableHead>Published USD</TableHead>
                <TableHead>Model USD override</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((item) => (
                <ModelRateForm
                  key={item.id}
                  item={item}
                  action={updateModelCatalogueRatesAction.bind(null, item.id)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
