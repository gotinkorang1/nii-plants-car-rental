/** Organisations listed with logos on the previous Management page.
 * Names only — no invented partnerships or testimonials. */

export type ClientLogo = {
  name: string;
  src: string;
  width: number;
  height: number;
};

export const CLIENTS = [
  { name: "ABB", src: "/images/clientele/abb.svg", width: 176, height: 70 },
  { name: "Zenith", src: "/images/clientele/zenith.svg", width: 200, height: 64 },
  { name: "Vitol", src: "/images/clientele/vitol.svg", width: 160, height: 64 },
  { name: "USAID", src: "/images/clientele/usaid.svg", width: 160, height: 64 },
  {
    name: "University of Ghana",
    src: "/images/clientele/university-of-ghana.svg",
    width: 200,
    height: 72,
  },
  {
    name: "Saladin Ghana",
    src: "/images/clientele/saladin-ghana.svg",
    width: 200,
    height: 64,
  },
  {
    name: "Promasidor",
    src: "/images/clientele/promasidor.svg",
    width: 200,
    height: 64,
  },
  { name: "Oloam", src: "/images/clientele/oloam.svg", width: 160, height: 64 },
  { name: "MTN", src: "/images/clientele/mtn.svg", width: 140, height: 64 },
  { name: "FAO", src: "/images/clientele/fao.svg", width: 140, height: 64 },
  { name: "DEME", src: "/images/clientele/deme.svg", width: 160, height: 64 },
  { name: "Bosch", src: "/images/clientele/bosch.svg", width: 160, height: 64 },
] as const satisfies readonly ClientLogo[];
