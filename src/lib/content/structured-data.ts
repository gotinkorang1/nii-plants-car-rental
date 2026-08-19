import { AWARDS, COMPANY } from "@/lib/content/company";
import { publicEnv } from "@/lib/env";

function siteUrl(path = "/"): string | undefined {
  const base = publicEnv.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) {
    return undefined;
  }
  if (path === "/") {
    return `${base}/`;
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function autoRentalJsonLd(input?: {
  telephone?: string;
  email?: string;
  description?: string;
}): Record<string, unknown> {
  const url = siteUrl("/");
  return {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name: COMPANY.brandName,
    legalName: COMPANY.legalName,
    url,
    logo: siteUrl("/brand/nii-plants-logo.png"),
    image: siteUrl("/brand/nii-plants-logo.png"),
    telephone: input?.telephone || COMPANY.telephoneDisplay,
    email: input?.email || COMPANY.email,
    description:
      input?.description ||
      "Self-drive and chauffeur car rental in Accra and across Ghana, with Kotoka airport pickup.",
    foundingDate: COMPANY.foundedDate,
    award: AWARDS.map(
      (item) => `${item.issuer}: ${item.name} (${item.year})`,
    ),
    memberOf: [
      {
        "@type": "Organization",
        name: "Ghana Netherlands Business & Culture Council",
      },
      {
        "@type": "Organization",
        name: "American Chamber of Commerce Ghana",
      },
    ],
    areaServed: { "@type": "Country", name: COMPANY.areaServed },
    geo: {
      "@type": "GeoCoordinates",
      latitude: COMPANY.latitude,
      longitude: COMPANY.longitude,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.streetAddress,
      addressLocality: COMPANY.addressLocality,
      addressRegion: COMPANY.addressRegion,
      addressCountry: COMPANY.addressCountry,
      postOfficeBoxNumber: "MP 2390",
    },
    hasMap: COMPANY.mapsUrl,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "09:00",
      closes: "17:00",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: COMPANY.telephoneDisplay,
      contactType: "customer service",
      areaServed: "GH",
      availableLanguage: ["en"],
    },
    sameAs: COMPANY.sameAs,
  };
}

export function faqPageJsonLd(
  items: { question: string; answer: string }[],
): Record<string, unknown> | null {
  if (items.length === 0) {
    return null;
  }
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(
  crumbs: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: siteUrl(crumb.path),
    })),
  };
}

export function itemListJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: siteUrl(item.path),
    })),
  };
}

export function carJsonLd(input: {
  name: string;
  make: string;
  description: string;
  seats: number;
  transmission: string;
  fuelType: string;
  slug: string;
  imageUrl?: string;
  dailyRatePesewas: number;
  usdDailyRateFrom?: number | null;
  usdDailyRateTo?: number | null;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: input.name,
    brand: { "@type": "Brand", name: input.make },
    description: input.description,
    vehicleSeatingCapacity: input.seats,
    vehicleTransmission: input.transmission,
    fuelType: input.fuelType,
    url: siteUrl(`/fleet/${input.slug}`),
  };
  if (input.imageUrl) {
    data.image = input.imageUrl;
  }
  if (input.usdDailyRateFrom) {
    const to = input.usdDailyRateTo ?? input.usdDailyRateFrom;
    data.offers =
      to > input.usdDailyRateFrom
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "USD",
            lowPrice: input.usdDailyRateFrom,
            highPrice: to,
            availability: "https://schema.org/InStock",
          }
        : {
            "@type": "Offer",
            priceCurrency: "USD",
            price: String(input.usdDailyRateFrom),
            availability: "https://schema.org/InStock",
          };
  } else if (input.dailyRatePesewas > 0) {
    data.offers = {
      "@type": "Offer",
      priceCurrency: "GHS",
      price: (input.dailyRatePesewas / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    };
  }
  return data;
}
