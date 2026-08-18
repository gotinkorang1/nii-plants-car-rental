import { BookingAccessForm } from "@/components/booking/booking-access-form";

type PageProps = {
  searchParams: Promise<{ reference?: string }>;
};

export default async function BookingAccessPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Retrieve booking
      </p>
      <h1 className="mt-2 font-heading text-4xl tracking-tight">Access your booking</h1>
      <p className="mt-3 text-muted-foreground">
        Enter your booking reference and email. If the details match our records, a
        verification code will be sent to the booking email.
      </p>
      <div className="mt-8 rounded-2xl bg-card p-5 ring-1 ring-border">
        <BookingAccessForm defaultReference={params.reference} />
      </div>
    </main>
  );
}
