import { marketingImages, type MarketingImage } from "@/lib/content/marketing-images";

export type GalleryAlbum = {
  id: string;
  title: string;
  body: string;
  images: MarketingImage[];
};

export const GALLERY_ALBUMS: GalleryAlbum[] = [
  {
    id: "hire-in-accra",
    title: "Self-drive and days on the road",
    body: "Saloons, SUVs and 4x4s hired from Accra for use inside Ghana. You book a model or similar; staff assign the car.",
    images: [
      marketingImages.selfDrive,
      marketingImages.driving,
      marketingImages.keys,
      marketingImages.friends,
    ],
  },
  {
    id: "chauffeur-airport",
    title: "Chauffeur and Kotoka",
    body: "A driven car for meetings and visitors, and meet-and-greet at Kotoka International Airport until 23:00 by arrangement.",
    images: [
      marketingImages.chauffeur,
      marketingImages.chauffeurWelcome,
      marketingImages.airport,
      marketingImages.cabin,
      marketingImages.arrival,
    ],
  },
  {
    id: "handover",
    title: "Handover in Dansoman",
    body: "Keys, documents, and a roadworthy car at Plantsville. The office is open Monday to Saturday, 09:00 to 17:00.",
    images: [
      marketingImages.valet,
      marketingImages.workshop,
      marketingImages.office,
      marketingImages.portrait,
    ],
  },
  {
    id: "corporate-events",
    title: "Work, visitors, and groups",
    body: "Company travel, longer assignments, and group vans quoted by the Accra team. Coasters and Hiace vans go out with a driver.",
    images: [
      marketingImages.corporate,
      marketingImages.executiveSuv,
      marketingImages.longTerm,
      marketingImages.events,
    ],
  },
];

export const GALLERY_IMAGES = GALLERY_ALBUMS.flatMap((album) =>
  album.images.map((image) => ({ ...image, albumId: album.id, albumTitle: album.title })),
);
