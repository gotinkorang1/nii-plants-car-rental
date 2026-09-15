import { BookingAccessForm } from "@/components/booking/booking-access-form";
import { DeskPanel } from "@/components/marketing/desk-panel";
import { PageEyebrow } from "@/components/marketing/page-intro";

type PageProps = {
  searchParams: Promise<{ reference?: string }>;
};

export default async function BookingAccessPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <PageEyebrow>Retrieve booking</PageEyebrow>
      <h1 className="mt-2 font-heading text-4xl tracking-tight">Access your booking</h1>
      <p className="mt-3 text-muted-foreground">
        Enter your booking reference and email. If the details match our records, a
        verification code will be sent to the booking email.
      </p>
      <DeskPanel className="mt-8">
        <BookingAccessForm defaultReference={params.reference} />
      </DeskPanel>
    </main>
  );
}
