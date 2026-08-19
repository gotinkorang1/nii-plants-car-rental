import { truncateMetaDescription } from "@/lib/content/seo";
import { COPY } from "@/lib/content/copy";

/** Confirmed public facts from the live site, AmCham Ghana, Graphic/GTA, JoyOnline, Daily Guide, BFT, GNBCC, and Ghana hire practice. */

const plantsville = {
  latitude: 5.5448458,
  longitude: -0.2680674,
} as const;

export const COMPANY = {
  legalName: "Nii Plants Car Rentals Co. Ltd",
  brandName: "Nii Plants Car Rentals",
  tagline: "Your key to mobility",
  foundedDate: "2007-10-22",
  foundedYear: 2007,
  streetAddress: "Plantsville, Poultry Farm Avenue, Akokor Foto",
  addressLocality: "Dansoman",
  addressRegion: "Greater Accra",
  addressCountry: "GH",
  postalBox: "P.O. Box MP 2390, Mamprobi, Accra",
  latitude: plantsville.latitude,
  longitude: plantsville.longitude,
  mapsUrl: "https://goo.gl/maps/xNq7jWiCySyC6f2z5",
  telephone: "+233593835941",
  telephoneDisplay: "+233 59 383 5941",
  officeTelephoneDisplay: "+233 30 244 1805",
  email: "info@niiplantsghana.com",
  openingHours: "Mo-Sa 09:00-17:00",
  openingHoursDisplay: "Monday–Saturday 09:00–17:00; Sunday closed",
  airportHoursNote: "Kotoka collections by arrangement until 23:00",
  areaServed: "Ghana",
  award:
    "Ghana Tourism Authority National Tourism Awards 2024, Car Rentals (Greater Accra)",
  sameAs: [
    "https://web.facebook.com/niiplants/",
    "https://www.linkedin.com/company/nii-plants-car-rental/",
  ],
} as const;

export const AWARDS = [
  {
    year: 2022,
    dateLabel: "3 November 2022",
    name: "Best Car Rental Service Provider of the Year",
    issuer: "Ghana National Tourism Awards",
  },
  {
    year: 2024,
    dateLabel: "October 2024",
    name: "Car Rental Service of the Year",
    issuer: "Greater Accra Regional Tourism Awards, Ghana Tourism Authority",
  },
  {
    year: 2024,
    dateLabel: "25 October 2024",
    name: "Car Rentals, Greater Accra",
    issuer: "Ghana Tourism Authority National Tourism Awards",
    venue: "Osu Castle Gardens, Accra",
  },
] as const;

export const MEMBERSHIPS = [
  {
    name: "Ghana Netherlands Business & Culture Council",
    short: "GNBCC",
    status: "Member",
    detail: "Nii Plants Group is listed as a member.",
  },
  {
    name: "American Chamber of Commerce Ghana",
    short: "AmCham Ghana",
    status: "Profiled",
    detail:
      "Published a company profile on 4 February 2021 and covered the Plantsville opening on 1 October 2021.",
  },
  {
    name: "Canada Ghana Chamber of Commerce",
    short: "Canada Ghana Chamber",
    status: "Featured",
    detail:
      "Featured Nii Plants at an in-house presentation in May 2022. That is a speaking appearance, not a membership claim.",
  },
] as const;

export const GROUP_OUTFITS = [
  {
    name: "Nii Plants Car Rentals",
    detail:
      "This site. Self-drive and chauffeur car hire in Ghana since 2007.",
  },
  {
    name: "NiiPlants Logistics",
    detail:
      "Haulage from 2020. Trucks, cargo, and earth-moving are booked there, not here.",
    href: "https://niiplantslogistics.com/",
  },
  {
    name: "Puffs Ghana Limited",
    detail: "Restaurant established in 2020; puffs (bofrot) and sit-down dining.",
  },
  {
    name: "Plantsville Residences",
    detail:
      "Five furnished apartments at the Dansoman campus for visiting hire clients. Booked with staff, not as part of a self-drive checkout.",
  },
] as const;

export const MANAGEMENT = {
  managingDirector: {
    name: "Theophilus Ayitey-Adjin",
    role: "Managing Director and Chief Executive",
    credentials:
      "M.Sc. Coastal Engineering (University of Kiel), B.Sc. Geodetic Engineering (KNUST), certificate in project management",
    industryRole:
      "Vice President, Car Rentals Association of Ghana (CRAG), inducted 17 August 2023",
    amchamNote:
      "AmCham Ghana’s February 2021 company profile names him Managing Director and Chief Executive, and records that he established Nii Plants.",
  },
  deputyManagingDirector: {
    name: "Mary Ayitey-Adjin",
    role: "Deputy Managing Director and co-owner",
    credentials:
      "Member, Chartered Institute of Bankers (Ghana); B.A. Humanities (University of Ghana); MBA Finance (Paris Graduate School)",
  },
  team: [
    {
      name: "Theo Ayitey-Adjin",
      role: "Chief Executive Officer",
      photo: "theo",
    },
    {
      name: "Emmanuel Nelson",
      role: "Operations Manager",
      photo: "emma",
    },
    {
      name: "Daniel Awotwe-Pratt",
      role: "Finance Manager",
      photo: "daniel",
    },
    {
      name: "Kingdom Kededor Avisseh",
      role: "Executive Assistant",
      photo: "kingdom",
    },
  ],
} as const;

export const PAGE_SEO = {
  home: {
    title: "Car Rental Accra, Ghana | Self-Drive, Chauffeur & Kotoka Pickup",
    description: COPY.heroSubheadline,
  },
  fleet: {
    title: "Car Hire Fleet in Accra: Saloons, SUVs, 4x4s and Coaches",
    description:
      "Browse Nii Plants car hire in Accra. Compact and mid-size saloons, SUVs, Land Cruiser Prado, Hiace vans and a 30-seater Coaster. Book a model or similar.",
  },
  services: {
    title: "Car Hire Services in Ghana | Self-Drive, Chauffeur, Airport",
    description: COPY.servicesIntro,
  },
  selfDrive: {
    title: "Self-Drive Car Rental in Accra and Ghana",
    description:
      "Hire a car and drive yourself in Ghana. 24-hour rental days, drivers 25+, Ghana Card or passport, and use inside Ghana only. Pickup in Dansoman or at Kotoka.",
  },
  chauffeur: {
    title: "Chauffeur Service in Accra",
    description:
      "Book a professional driver with a Nii Plants sedan, SUV or 4x4. Daily chauffeur hire is a 10-hour duty day. Ideal for meetings, visitors and intercity trips.",
  },
  airport: {
    title: "Kotoka Airport Car Hire and Transfers",
    description:
      "Airport pickup and drop-off at Kotoka International Airport. Meet-and-greet, evening collections until 23:00, or collect a self-drive car after your flight.",
  },
  longTerm: {
    title: "Long-Term Car Rental in Ghana",
    description:
      "Keep a Nii Plants car for weeks, months or longer assignments in Accra and across Ghana. Staff quote weekly and monthly self-drive or chauffeur packages.",
  },
  events: {
    title: "Wedding and Event Car Hire in Accra",
    description:
      "Cars, Hiace vans and a 30-seater Coaster for weddings, conferences and group travel in Ghana. Chauffeur-led and quoted by the Nii Plants operations team.",
  },
  corporate: {
    title: "Corporate Car Rental in Accra",
    description:
      "Company travel, visiting staff and client cars in Accra since 2007. GTA award-winning hire, Kotoka meet-and-greet, and hotel desks in Accra and Takoradi.",
  },
  about: {
    title: "About Nii Plants | Accra Car Rental Since 2007",
    description:
      "Ghanaian-owned Accra car hire since 2007. GTA awards in 2022 and 2024. Plantsville HQ in Dansoman. GNBCC member; profiled by AmCham Ghana.",
  },
  contact: {
    title: "Contact Nii Plants in Dansoman, Accra",
    description:
      "Call +233 59 383 5941, office +233 30 244 1805, or email info@niiplantsghana.com. Plantsville, Dansoman. Monday–Saturday 09:00–17:00. Kotoka pickup by arrangement.",
  },
  help: {
    title: "Car Rental Help in Ghana",
    description:
      "Age 25+, full licence, Ghana Card or passport, 48-hour free cancellation, and Ghana-only use. How Nii Plants self-drive and chauffeur hire works.",
  },
  requirements: {
    title: "Licence, Age and Deposit Rules",
    description:
      "Self-drive with Nii Plants: 25 or older, full driving licence, Ghana Card or passport, 24-hour minimum, refundable deposit at pickup. Cars stay in Ghana.",
  },
  faqs: {
    title: "Booking, Insurance and Cancellation FAQs",
    description:
      "Answers on Nii Plants booking, payments, Kotoka pickup, insurance, extra drivers, and free cancellation 48 hours before pickup.",
  },
  news: {
    title: "News | Accra Car Rental Awards, Plantsville, Hotel Desks",
    description:
      "Nii Plants news: GTA car-rental awards in 2022 and 2024, the Plantsville office in Dansoman, and pickup at Alisa North Ridge and in Takoradi.",
  },
  gallery: {
    title: "Photo Gallery | Car Hire in Accra and Ghana",
    description:
      "Photos of Nii Plants self-drive, chauffeur cars, Kotoka handover, and the Plantsville desk in Dansoman, Accra.",
  },
} as const;

export function vehicleSeoTitle(make: string, model: string): string {
  return `${make} ${model} Hire Accra | Car Rental Ghana`;
}

export function vehicleSeoDescription(input: {
  make: string;
  modelName: string;
  className: string;
  description: string;
  seats: number;
}): string {
  const lead =
    input.description.trim() ||
    `Hire a ${input.make} ${input.modelName} (${input.className}, ${input.seats} seats) from Nii Plants in Accra.`;
  const suffix = " Self-drive or chauffeur car rental in Ghana; model or similar.";
  const combined = lead.endsWith(".") ? `${lead}${suffix}` : `${lead}.${suffix}`;
  return truncateMetaDescription(combined) ?? combined;
}
