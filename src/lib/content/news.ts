import { marketingImages, type MarketingImage } from "@/lib/content/marketing-images";

export type NewsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  dateLabel: string;
  image: MarketingImage;
  paragraphs: string[];
  bodyImages?: MarketingImage[];
};

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: "gta-tourism-awards-car-rental",
    title: "Ghana Tourism Authority names Nii Plants in car-rental awards",
    excerpt:
      "National recognition in 2022, then Greater Accra and national car-rental titles in 2024 at Osu Castle Gardens.",
    date: "2024-10-25",
    dateLabel: "25 October 2024",
    image: marketingImages.gtaAwardsHandshake,
    bodyImages: [
      marketingImages.gtaAwardsTrophy,
      marketingImages.gtaAwardsGroup,
      marketingImages.gtaAwardsCertificate,
    ],
    paragraphs: [
      "Nii Plants Car Rentals is a Ghanaian-owned hire company in Accra. The Ghana Tourism Authority has twice named the company in its car-rental awards. Those titles belong to the ceremonies. We do not use “best in Ghana” as a standing slogan.",
      "On 3 November 2022 the Ghana National Tourism Awards named Nii Plants Best Car Rental Service Provider of the Year. JoyOnline and Daily Guide reported the citation: a fleet for travel in and outside Accra, and professional drivers.",
      "In October 2024 the Greater Accra Regional Tourism Awards named the company Car Rental Service of the Year. On 25 October 2024, at Osu Castle Gardens, the Ghana Tourism Authority National Tourism Awards named Nii Plants winner of Car Rentals (Greater Accra).",
      "Hire remains what it has been since 2007: self-drive from Plantsville in Dansoman, chauffeur days with a 10-hour duty window, and Kotoka pickup by arrangement until 23:00. Cars stay inside Ghana.",
    ],
  },
  {
    slug: "accra-and-takoradi-hotel-desks",
    title: "Pickup at Alisa North Ridge and in Takoradi",
    excerpt:
      "Besides Plantsville and Kotoka, collect at Alisa Hotel, North Ridge, in Accra, or at Best Western Plus Atlantic Hotel in Takoradi.",
    date: "2023-01-01",
    dateLabel: "2023",
    image: marketingImages.alisaHotelNorthRidge,
    bodyImages: [
      marketingImages.alisaHotelNorthRidge,
      marketingImages.hotelDeskNight,
      marketingImages.hotelBuffet,
      marketingImages.hotelPool,
    ],
    paragraphs: [
      "Nii Plants still runs hire from Plantsville, Poultry Farm Avenue, Akokor Foto, Dansoman. That is the staffed office: Monday to Saturday, 09:00 to 17:00; Sunday closed.",
      "Guests and corporates in Accra can also collect at Alisa Hotel, North Ridge. For the Western and Western North regions, pickup can be arranged at Best Western Plus Atlantic Hotel, Takoradi.",
      "These are pickup points, not 24-hour walk-in desks. After-hours support is by phone. Airport collections at Kotoka International Airport run until 23:00 by arrangement.",
      "Self-drive stays a 24-hour day. Chauffeur hire is a 10-hour duty day. Book a published model or similar online, or ask the Accra team about a driven car.",
    ],
  },
  {
    slug: "plantsville-dansoman-office",
    title: "Plantsville opens in Dansoman",
    excerpt:
      "On 1 October 2021 Nii Plants moved the hire desk to Plantsville: offices, a front counter, and furnished apartments for visiting clients.",
    date: "2021-10-01",
    dateLabel: "1 October 2021",
    image: marketingImages.plantsvilleLounge,
    bodyImages: [
      marketingImages.plantsvilleLounge,
      marketingImages.plantsvilleCrescentLounge,
      marketingImages.plantsvilleWaitingRoom,
    ],
    paragraphs: [
      "Nii Plants Car Rentals Co. Ltd was incorporated on 22 October 2007 and commenced business the next day. Hire first ran from Sakaman Junction on the Odorkor–Mallam Highway.",
      "On 1 October 2021 the company opened Plantsville in Dansoman. AmCham Ghana covered the opening. The complex holds the car-rental office, workspace, and five furnished one- and two-bed apartments for visiting hire clients.",
      "Apartments are booked with staff. They are not part of a self-drive checkout. The restaurant on campus is a sister service. Trucks and earth-moving sit with NiiPlants Logistics, not this car-rental site.",
      "Postal mail still goes to P.O. Box MP 2390, Mamprobi, Accra. Collect keys at Plantsville, at Kotoka, or at a listed hotel desk.",
    ],
  },
];

export function getNewsArticle(slug: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find((article) => article.slug === slug);
}
