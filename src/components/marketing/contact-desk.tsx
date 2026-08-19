import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { COMPANY } from "@/lib/content/company";
import {
  mailHref,
  telHref,
  whatsappHref,
  type PublicContact,
} from "@/lib/settings/public-contact";
import { cn } from "@/lib/utils";

export function ContactDesk({ contact }: { contact: PublicContact }) {
  const cards = [
    contact.phone
      ? {
          key: "call-centre",
          href: telHref(contact.phone),
          icon: Phone,
          label: "Call centre",
          value: contact.phone,
        }
      : null,
    {
      key: "office",
      href: telHref(COMPANY.officeTelephoneDisplay),
      icon: Phone,
      label: "Office",
      value: COMPANY.officeTelephoneDisplay,
    },
    contact.whatsapp
      ? {
          key: "whatsapp",
          href: whatsappHref(contact.whatsapp),
          icon: MessageCircle,
          label: "WhatsApp",
          value: "Chat on WhatsApp",
        }
      : null,
    contact.email
      ? {
          key: "email",
          href: mailHref(contact.email),
          icon: Mail,
          label: "Email",
          value: contact.email,
        }
      : null,
    {
      key: "hours",
      href: undefined,
      icon: Clock,
      label: "Hours",
      value: COMPANY.openingHoursDisplay,
    },
    contact.address
      ? {
          key: "address",
          href: undefined,
          icon: MapPin,
          label: "Plantsville",
          value: contact.address,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        const className = cn(
          "flex h-full items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border",
          card.href &&
            "transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(24,26,24,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        );

        const body = (
          <>
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-xs font-medium tracking-[0.14em] text-primary uppercase">
                {card.label}
              </span>
              <span className="mt-1 block text-sm">{card.value}</span>
            </span>
          </>
        );

        return (
          <li key={card.key}>
            {card.href ? (
              <a href={card.href} className={className}>
                {body}
              </a>
            ) : (
              <div className={className}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
