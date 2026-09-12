import { COMPANY } from "@/lib/content/company";
import { COPY } from "@/lib/content/copy";

export const LEGAL_UPDATED_LABEL = "19 August 2026";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export const PRIVACY_INTRO =
  "This notice explains how Nii Plants Car Rentals Co. Ltd collects and uses personal data when you hire a car, send an enquiry, or use this website. It follows Ghana's Data Protection Act, 2012 (Act 843).";

export const TERMS_INTRO =
  "These hire terms apply when you book self-drive online, send an enquiry, or collect a car from Nii Plants in Accra. A signed rental agreement at pickup still governs the days you have the vehicle. Where that agreement and this page differ on a live hire, the signed agreement and the Ghana cedi quote you accepted apply.";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "who",
    title: "Who holds your data",
    paragraphs: [
      `${COMPANY.legalName} (“Nii Plants”, “we”) is the data controller for this website and for Accra car hire. Our office is ${COMPANY.streetAddress}, ${COMPANY.addressLocality}, Accra. Postal mail: ${COMPANY.postalBox}.`,
      `Email ${COMPANY.email}. Office ${COMPANY.officeTelephoneDisplay}. Mobile ${COMPANY.telephoneDisplay}. We have not named a separate data-protection officer on this page; write to the same desk and mark the message “data protection”.`,
    ],
  },
  {
    id: "what",
    title: "What we collect",
    paragraphs: [
      "When you request a quote or book, we collect your name, email, phone, driver age, licence country, and optional licence number and notes. Enquiries may include a route, flight number, or group size.",
      "At pickup we check a full driving licence and a Ghana Card or passport for every named driver. Staff may keep copies or notes needed for the hire, insurance, and traffic fines.",
      "Payments on this site go through Paystack. We store payment references and status. We do not ask you to type a full card number into our own forms.",
      "The website sets cookies and similar storage that are needed to keep a booking session, staff login, and security. We do not run a separate advertising pixel on these pages.",
    ],
  },
  {
    id: "why",
    title: "Why we use it",
    paragraphs: [
      "We use the data to quote and confirm hire, take a reservation payment, hand over a car, recover fines or damage, answer support, and keep accounts and audit records required of a Ghana company.",
      "We do not sell your details as a marketing list. We do not invent public review scores from your name.",
    ],
  },
  {
    id: "share",
    title: "Who else sees it",
    paragraphs: [
      "Staff at Plantsville see bookings and enquiries they need for the job. Paystack processes card and mobile money payments under its own terms.",
      "The website and database run on cloud hosts. Some processing may take place outside Ghana. We use those providers to operate hire, not to sell lists.",
      "We may share what the law or a court requires, or what an insurer, the police, or DVLA need after an incident involving a Nii Plants car.",
    ],
  },
  {
    id: "keep",
    title: "How long we keep it",
    paragraphs: [
      "We keep hire, payment, and ID records for as long as the rental, accounting, insurance, and legal claims reasonably require. We have not published a single deletion calendar on this site.",
      "You may ask us to correct data or to delete it where Act 843 allows. We may retain what we still need for a live booking, a payment dispute, or a legal duty.",
    ],
  },
  {
    id: "rights",
    title: "Your rights in Ghana",
    paragraphs: [
      "You may ask what personal data we hold about you and ask us to correct it. Write to the email above. We may need to confirm it is you before we reply.",
      "If you are not satisfied, you may complain to the Data Protection Commission of Ghana. This notice does not replace Act 843.",
    ],
  },
  {
    id: "children",
    title: "Age",
    paragraphs: [
      "Self-drive renters and extra drivers must be 25 or older. This website is not aimed at children. We do not knowingly take a hire booking from anyone under 25.",
    ],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "parties",
    title: "Who you hire from",
    paragraphs: [
      `${COMPANY.legalName} hires cars from Plantsville, Dansoman, Accra, and from published pickup points. Sister companies (logistics, restaurant, residences) are not this car-rental contract.`,
    ],
  },
  {
    id: "booking",
    title: "Bookings and enquiries",
    paragraphs: [
      "You book a published model or similar, not a registration plate. Staff assign the physical car at handover.",
      "Self-drive can start online when a quote is available. Chauffeur, Kotoka transfer, long-term, events, and group vans are arranged with staff. An enquiry or website form is not a confirmed booking until staff confirm it.",
      "Prices and reservation payments on this site are in Ghana cedis. Old-shop US dollar cards are a catalogue reference only.",
    ],
  },
  {
    id: "days",
    title: "Hire days",
    paragraphs: [
      "Self-drive is charged in 24-hour days, with a minimum of 24 hours. A chauffeur or airport duty day is 10 hours. Short chauffeur jobs start at three hours. Overtime and intercity trips are quoted by staff.",
      "Do not treat a chauffeur 10-hour day as the self-drive rule.",
    ],
  },
  {
    id: "drivers",
    title: "Who may drive",
    paragraphs: [
      COPY.requirementsIntro,
      "Only drivers named on the rental agreement may drive. Toyota Hiace vans and the 30-seater Coaster go out with a company driver, not as online self-drive.",
    ],
  },
  {
    id: "ghana",
    title: "Use inside Ghana",
    paragraphs: [
      "Hire stays inside Ghana. Crossing a land border is not permitted. Off-road use, racing, and towing are outside a standard self-drive day.",
    ],
  },
  {
    id: "pay",
    title: "Payment, deposit, and insurance",
    paragraphs: [
      "A reservation payment is due when you book self-drive. The share of the rental total is shown on the rental requirements page. The remaining balance is due before pickup.",
      "A refundable security deposit is taken at pickup. The amount depends on the vehicle class. We do not publish a Ghana cedi deposit figure on this website until finance sets it.",
      COPY.insurance,
    ],
  },
  {
    id: "cancel",
    title: "Cancellation",
    paragraphs: [COPY.cancellation],
  },
  {
    id: "car",
    title: "The car",
    paragraphs: [
      COPY.mileage,
      "Return the car to the agreed place, in the agreed condition, with the agreed fuel. You remain responsible for traffic fines and for damage outside the insurance cover. Tell us promptly about accidents or breakdowns.",
      COPY.hours,
    ],
  },
  {
    id: "site",
    title: "This website",
    paragraphs: [
      "We try to keep the catalogue and hours accurate. Fleet, rates, and desk hours can change. If a page and a confirmed quote disagree, the quote you accepted in Ghana cedis applies.",
      "Ghana law governs these terms. Disputes are handled in Ghana, with Accra as the usual venue unless a court says otherwise.",
    ],
  },
];
