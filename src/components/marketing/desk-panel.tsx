import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DeskPanel({
  children,
  className,
  bodyClassName,
}: {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-2xl py-0 text-base shadow-none ring-border",
        className,
      )}
    >
      <span className="block h-0.5 bg-accent" aria-hidden />
      <CardContent className={cn("p-5 sm:p-6", bodyClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
