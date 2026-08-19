export type MarketingImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const marketingImages = {
  keys: {
    src: "/images/keys.webp",
    alt: "A customer holding car keys beside a Nii Plants hire car in Accra",
    width: 1600,
    height: 2400,
  },
  executiveBanner: {
    src: "/images/executive-banner.webp",
    alt: "A passenger in a chauffeur-driven car in Ghana",
    width: 2048,
    height: 734,
  },
  ogDefault: {
    src: "/images/og-default.jpg",
    alt: "Nii Plants Car Rentals — chauffeur and self-drive hire in Accra",
    width: 1200,
    height: 630,
  },
  selfDrive: {
    src: "/images/self-drive.webp",
    alt: "A driver at the wheel of a self-drive hire car, checking over her shoulder",
    width: 1600,
    height: 1065,
  },
  chauffeur: {
    src: "/images/chauffeur.webp",
    alt: "A Nii Plants chauffeur waiting beside a black hire car",
    width: 1600,
    height: 1007,
  },
  chauffeurWelcome: {
    src: "/images/chauffeur-welcome.webp",
    alt: "A chauffeur holding the door open for a passenger",
    width: 1600,
    height: 1067,
  },
  airport: {
    src: "/images/airport.webp",
    alt: "A traveller loading a suitcase into the boot of a hire car",
    width: 1600,
    height: 900,
  },
  longTerm: {
    src: "/images/long-term.webp",
    alt: "A professional working from a hire car during a longer assignment in Ghana",
    width: 1600,
    height: 2400,
  },
  events: {
    src: "/images/events.webp",
    alt: "Friends travelling together in a group hire car",
    width: 1600,
    height: 1065,
  },
  friends: {
    src: "/images/friends.webp",
    alt: "A group of friends on a day out in an Accra hire car",
    width: 1600,
    height: 1065,
  },
  corporate: {
    src: "/images/corporate.webp",
    alt: "A business traveller using a Nii Plants car in Accra",
    width: 1600,
    height: 1067,
  },
  office: {
    src: "/images/office.webp",
    alt: "Staff at work arranging car hire from the Accra office",
    width: 1600,
    height: 2400,
  },
  executiveSuv: {
    src: "/images/executive-suv.webp",
    alt: "An executive passenger in the leather cabin of an SUV",
    width: 1600,
    height: 1065,
  },
  valet: {
    src: "/images/valet.webp",
    alt: "Keys handed over at vehicle pickup",
    width: 1600,
    height: 2400,
  },
  arrival: {
    src: "/images/arrival.webp",
    alt: "A passenger stepping out of a chauffeur car after arrival",
    width: 1600,
    height: 1067,
  },
  driving: {
    src: "/images/driving.webp",
    alt: "A professional driver at the wheel of a Nii Plants car",
    width: 1600,
    height: 1068,
  },
  cabin: {
    src: "/images/cabin.webp",
    alt: "A passenger seated in the cabin of a chauffeur-driven car",
    width: 1600,
    height: 1067,
  },
  workshop: {
    src: "/images/workshop.webp",
    alt: "A technician checking a hire car before it goes out",
    width: 1600,
    height: 1066,
  },
  portrait: {
    src: "/images/portrait.webp",
    alt: "A customer with a Nii Plants hire car",
    width: 1600,
    height: 1066,
  },
  phone: {
    src: "/images/phone.webp",
    alt: "A customer calling Nii Plants from a hire car",
    width: 1600,
    height: 1067,
  },
  theo: {
    src: "/images/team/theo.webp",
    alt: "Theophilus Ayitey-Adjin, Managing Director and Chief Executive of Nii Plants Car Rentals",
    width: 800,
    height: 1160,
  },
  emma: {
    src: "/images/team/emma.webp",
    alt: "Emmanuel Nelson, Operations Manager at Nii Plants Car Rentals",
    width: 800,
    height: 1160,
  },
  daniel: {
    src: "/images/team/daniel.webp",
    alt: "Daniel Awotwe-Pratt, Finance Manager at Nii Plants Car Rentals",
    width: 800,
    height: 1200,
  },
  kingdom: {
    src: "/images/team/kingdom.webp",
    alt: "Kingdom Kededor Avisseh, Executive Assistant at Nii Plants Car Rentals",
    width: 800,
    height: 1160,
  },
} as const satisfies Record<string, MarketingImage>;

export type MarketingImageId = keyof typeof marketingImages;
