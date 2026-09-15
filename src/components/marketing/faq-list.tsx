"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

export function FaqList({
  items,
}: {
  items: { id: string; question: string; answer: string }[];
}) {
  if (items.length === 0) {
    return (
      <Card className="rounded-2xl py-0 text-base shadow-none ring-border">
        <CardContent className="p-6 text-sm text-muted-foreground">
          No published FAQs yet. Staff can add them in the website CMS.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative gap-0 overflow-hidden rounded-2xl py-0 text-base shadow-none ring-border">
      <span className="absolute inset-x-0 top-0 z-10 h-0.5 bg-accent" aria-hidden />
      <Accordion type="single" collapsible className="px-2 pt-1 pb-1">
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id} className="px-3">
            <AccordionTrigger
              className="py-4 text-base font-medium hover:text-primary hover:no-underline"
            >
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>{item.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}
