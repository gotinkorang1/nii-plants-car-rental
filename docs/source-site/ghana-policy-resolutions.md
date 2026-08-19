# Ghana policy resolutions — live-site conflicts

Decided 18 August 2026 for the rebuild. These close the contradictions on the old site (now at email.niiplantsghana.com) using Ghana law, Ghana Tourism Authority (GTA) car-rental rules, DVLA/NIC practice, and the master spec. They do **not** invent GHS prices, deposit amounts, or unconfirmed phone numbers.

**Status:** approved for public copy and product rules, except items marked *unset until finance/ops enter a figure*.

Sources used:

- Road Traffic Act, 2004 (Act 683) and DVLA licence classes
- Motor Vehicles (Third Party Insurance) Act, 1958; NIC motor insurance practice
- Tourism Act, 2011 (Act 817); [GTA car-rental mandatory requirements](https://visitghana.com/wp-content/uploads/2026/03/Car-rental.pdf)
- Electronic Transactions Act, 2008 (Act 772) — dated services are not treated as a 7-day cooling-off hire
- Data Protection Act, 2012 (Act 843)
- Nii Plants published FAQ, T&Cs, and shop (crawled 18 Aug 2026)
- `PROJECT_SPEC.md` (GHS, 24-hour self-drive days, enquiry-only chauffeur/group)

---

## Decision table

| # | Conflict | Resolution | Why (Ghana standard) |
| --- | --- | --- | --- |
| 1 | Cancel 48h (FAQ) vs 24h (T&Cs) | **48 hours free cancel**; fee inside 48h; no-show forfeits the reservation | Customer-facing FAQ + Accra market (e.g. 48h full refund, then stepped fees). T&Cs were harsher and contradicted “no hidden fees”. |
| 2 | Age 25 (FAQ) vs 18 (shop gate) | **Self-drive renter and extra driver: 25+** with a full licence. 18 is only legal driving age / ID check, not hire eligibility | DVLA Class B starts at 18; Ghana hire firms commonly set 21–25. Nii Plants already published 25. The shop “18” was a WooCommerce age wall. |
| 3 | Hours 09:00–23:00 vs 09:00–17:00 | **Office: Mon–Sat 09:00–17:00, Sunday closed.** Airport/after-hours pickup **by arrangement until 23:00**. Roadside **24/7 by phone** | GTA requires a staffed front office, not a 23:00 walk-in desk. 17:00 is office hours; 23:00 matches airport arrivals; 24/7 is emergency, not the Dansoman counter. |
| 4 | Five phone numbers | **Primary: office +233 30 244 1805 and mobile +233 59 383 5941.** Email **info@niiplantsghana.com**. Keep +233 55 255 7324 as secondary mobile only. Do not publish logistics or theme numbers | Those two numbers appear on Contact and T&Cs. Logistics number is the sister company. `+233 30 232 9755` and `luxe@example.com` look like leftover theme chrome. |
| 5 | Hyundai Accord vs Honda Accord | **Honda Accord** (luxury sedan). No Hyundai Accord exists | Product title error; body copy already says Honda. |
| 6 | Extra form cars (Tucson Luxury, VB Land Cruiser, Hyundai H1) | **Not on public fleet.** Available only as an enquiry / “or similar” until ops adds them in admin | GTA and the spec: publish only licensed, priced, available units. Do not invent rates. |
| 7 | Price ranges | **Lower USD figure = Accra metro self-drive / day. Upper figure = outside Accra / day.** Chauffeur and long-term stay on enquiry | Shop attribute is In Accra / Outside Accra. Spec: only self-drive is auto-bookable. |
| 8 | GHS, deposits, hourly | **Public currency GHS (no FX guess).** Deposit amount **unset** until finance. Hourly is **not** Version 1 self-drive | Spec stores pesewas. Converting old USD at a guessed rate would invent prices. Ghana consumers should see GHS. |
| 9 | Trucks / earth-moving / cargo | **Off the car-rental site.** Point haulage to NiiPlants Logistics | GTA car-rental vs logistics. Cargo/earth-moving is the 2020 logistics subsidiary. |
| 10 | 15% off, unlimited km, 24/7 | **15% is a promo, not a standing promise.** Mileage: **included within Ghana** (no invented km cap). **24/7 = phone/roadside**, not 24-hour office | Removing advertised unlimited km would hide a fee. Inventing “150 km/day” would also invent a charge. Promo banners belong in CMS promotions. |

---

## 1. Cancellation and refunds

**Public rule (FAQ, Help, Terms — same wording):**

1. Cancel **48 hours or more** before scheduled pickup: full refund of the reservation payment, minus any confirmed payment-processor fee.
2. Cancel **inside 48 hours**: a cancellation fee applies (staff-applied in Version 1; typically the reservation payment or one chargeable day — finance sets the figure later).
3. **No-show** (no notice): reservation payment is forfeited.
4. After pickup, unused days are not automatically refunded; staff handles early return.

Do not offer Electronic Transactions Act 7-day cooling-off on a dated vehicle hire. That right is for generic e-services, not a reserved car for a specific slot.

Staff still process cancellations in Version 1 (`PROJECT_SPEC.md`). The website must not auto-refund.

---

## 2. Who may drive (self-drive)

| Rule | Decision |
| --- | --- |
| Minimum age | **25 years** for the lead renter and every extra driver |
| Licence | **Full** licence, not a learner permit, held at pickup. Ghana Card residents: DVLA licence of the right class. Visitors: national licence; International Driving Permit strongly recommended |
| ID | Ghana Card **or** passport |
| Payment instrument | Card or other accepted method for reservation and the refundable security deposit |
| Extra driver | Allowed if they meet the same age, licence, and ID rules and are named on the agreement |
| Chauffeur / airport / group | Customer is a passenger. No customer driving age. Company drivers follow GTA rules (literate, uniformed, valid licence, police report) |

Class B covers private cars, SUVs, and typical saloons. **Toyota Coaster (30 seats) and Toyota Hiace** stay **enquiry / chauffeur**, not online self-drive — commercial passenger vehicles and GTA driver standards.

Pickup still checks photo ID. That check is **not** an 18+ rental policy.

---

## 3. Rental day length (old T&Cs vs new platform)

The old site said “a day is 10 hours, not 24.” That is Ghana **chauffeur duty-day** practice, not self-drive.

| Product | Chargeable day | Bookable in V1? |
| --- | --- | --- |
| Self-drive | **24 hours** (`ceil(hours / 24)`), minimum 24 hours | Yes |
| Chauffeur, airport, events | **10-hour duty day**, overtime by enquiry | Enquiry only |
| Long-term / corporate | Manual quote | Enquiry only |

Use Ghana only. No land-border crossing.

---

## 4. Opening hours and support

- **Plantsville office:** Monday–Saturday **09:00–17:00**; Sunday closed.
- **Airport pickup/drop-off:** by booking, including evenings **until 23:00**.
- **After-hours / breakdown:** call the published mobile; do not claim a 24-hour walk-in office.
- Hotel desks (Alisa North Ridge, Best Western Plus Takoradi): mention as pickup points only if ops confirms they still operate.

---

## 5. Contact to publish

**Publish**

- Office: +233 30 244 1805
- Call centre / mobile: +233 59 383 5941
- Email: info@niiplantsghana.com
- Address: Plantsville, Poultry Farm Avenue, Akokor Foto, Dansoman, Accra
- Map: https://goo.gl/maps/xNq7jWiCySyC6f2z5
- Facebook: https://web.facebook.com/niiplants/
- LinkedIn: https://www.linkedin.com/company/nii-plants-car-rental/

**Secondary (do not lead with these)**

- +233 55 255 7324 — extra mobile; use as WhatsApp only if ops confirms
- rental@niiplantsghana.com — bookings alias if they still read it

**Do not publish**

- +233 30 232 9755 (theme header)
- +233 24 345 2283 (logistics)
- luxe@example.com
- (012) 345 6789 and +9123 4567 890
- Instagram URL that is a single post, not a profile
- Theme “pricing packages” $200–$350/day

---

## 6. Fleet and prices

**Public catalogue (13 models from the shop).** Correct the Accord to **Honda Accord**.

Treat USD cards as **reference tourist rates from August 2026**, not as GHS:

- Accra self-drive daily = **low** end of the range (or the single price).
- Outside Accra daily = **high** end.
- Kia Pegas / Hyundai Accent: **USD 65 / day** Accra (no range published).

**Do not invent a new FX rate.** Seed/dev booking floors use the documented `USD_GHS_BOOKING_RATE` in `src/lib/money/usd.ts` (Bank of Ghana selling rate about GH¢11 per USD on 18 August 2026) times the published USD floor, stored as pesewas on the vehicle class. Public cards show that Ghana cedi class rate when it is greater than zero; USD bands stay a catalogue reference. Finance should still confirm live tariffs in `/admin/rates`. Van/coach online self-drive stays quote-on-request (`defaultDailyRate` 0).

**Not on /fleet until added in admin:** Hyundai Tucson Luxury, VB Land Cruiser, Hyundai H1, pickups, cargo trucks, earth-moving.

**Not on the car-rental catalogue:** NiiPlants Logistics haulage; Puffs/Pluff; Plantsville apartments (link as sister services on About only).

**GTA operational notes (ops, not public prices):** vehicles should be roadworthy, insured, tracked, first-aid equipped; GTA targets fleet **not older than eight years**. Several listed model years (Prado 2016, Tucson/Pajero 2018) may already fail that — ops should replace or keep them off the tourist-facing grid.

---

## 7. Insurance, deposit, mileage, discounts

**Insurance (public language):** Hire includes the operator’s motor cover required to put the vehicle on a Ghana road (NIC-regulated; third-party is the legal minimum). Nii Plants’ FAQ said basic cover is included and extra cover is optional. Do **not** invent excess amounts. At pickup, staff records the refundable security deposit (Version 1). Renter remains liable for excess, traffic fines, and damage outside policy.

**Deposit:** Required for self-drive. Amount **unset** on the website until finance configures it per class. Help page: “A refundable security deposit is taken at pickup; the amount depends on the vehicle.”

**Mileage:** **Included for use inside Ghana** on a standard self-drive day. No invented daily kilometre cap. Abuse (off-road, racing, towing, border) is chargeable as now in the T&Cs.

**15% off:** Not a permanent policy. Use a dated CMS promotion when marketing confirms it.

**Pay at pickup / pay reservation:** Fits the spec (configurable reservation percent, default 25% in development).

---

## 8. Documents at pickup (Help / Requirements)

Show this checklist, not the old 18+ modal:

1. Renter aged 25 or over  
2. Full driving licence  
3. Ghana Card or passport  
4. Reservation payment complete  
5. Security deposit (amount shown at booking once configured)  
6. Named extra drivers with the same documents  

Foreign visitors: passport + home licence; IDP recommended.

---

## 9. Copy the new site must not repeat

- Theme lorem ipsum, fake phones, fake package prices  
- FAQ vs Terms mismatches (now unified)  
- “Hyundai Accord”  
- “A rental day is 10 hours” on **self-drive** pages  
- Standing “Get 15% off”  
- 24/7 office hours  
- WordPress default privacy text — replace with an Act 843 policy before launch  
- Unverified counters (“years of experience”, “satisfied clients”)  

---

## 10. Still unset (do not guess)

- Live GHS tariffs if finance changes them after seed (`USD_GHS_BOOKING_RATE` floors are a documented starting point, not a locked public price list)
- Outside-Accra GHS add-on as a separate published figure
- Security-deposit pesewas **on public pages** (class deposits may exist in admin/seed for quotes; do not invent a public GH₵ amount)
- Cancellation-fee pesewas inside 48 hours (copy states a fee applies; staff apply it until finance sets a figure)
- Whether +233 55 255 7324 is WhatsApp
- Whether hotel desks still operate
- Whether 2016–2018 units remain on the public grid after GTA age review
- Permission to show third-party client logos beyond files already in `public/images/clientele`

Public fleet cards show the class Ghana cedi booking rate when `defaultDailyRate` is greater than zero; otherwise “quote on request”. Do not show GH₵0.00.

---

## 11. Third-party corrections (copy and SEO)

Compared 18 August 2026 against AmCham Ghana (4 Feb 2021 company profile), Graphic Online / GTA National Tourism Awards (25 Oct 2024), and stale directories (SeekGhana, GoAfrica).

| Fact | Use on the new site | Do not use |
| --- | --- | --- |
| Incorporation | **22 Oct 2007**, commence **23 Oct 2007**, Companies Code **Act 179** | AmCham’s “Act 169” (typo) |
| HQ | **Plantsville, Poultry Farm Avenue, Dansoman** | Sakaman Junction / 242 Old Winneba Road as current address |
| Postal | **P.O. Box MP 2390, Mamprobi, Accra** | Invented Ghana Post GPS |
| Leadership | Theo MD/CEO; Kiel M.Sc. / KNUST B.Sc. (AmCham 2021); **CRAG Vice President** from 17 Aug 2023 (BFT). Mary: CIB Ghana, UG, MBA Paris; **Deputy Managing Director** and 50% owner | 2021 marketing/accounts names as current staff |
| Award | **GTA National 2022** Best Car Rental Service Provider (3 Nov; JoyOnline, Daily Guide). **Greater Accra Regional 2024** Car Rental Service of the Year. **GTA National 25 Oct 2024**, Car Rentals (Greater Accra), Osu Castle Gardens | “Best in Ghana” as a standing slogan; invented review counts |
| Chambers | **GNBCC member**. **AmCham Ghana** profiled 2021. Canada Ghana Chamber presentation May 2022 | GNBCC spotlight phones 024 345 8322 / 059 396 2111 |
| HQ campus | Plantsville opened **1 Oct 2021** (AmCham); five furnished apartments for visiting clients (JoyOnline) | Sakaman Junction / 242 Old Winneba Road as current address |
| Hotel desks | Alisa North Ridge and Best Western Plus Takoradi reported as branches (Modern Ghana) | Treat that article’s “24-hour customer service” as a walk-in desk |
| Chauffeur | **3-hour minimum**, **10-hour duty day** (AmCham packages) | 10-hour day on **self-drive** |
| Long-term | Daily / weekly / monthly / multi-year **quoted by staff**; option-to-buy only as an enquiry | Automated monthly GHS grid |
| Phones | Lead with **030 244 1805** and **059 383 5941** | 024 345 2283 (logistics), 027 533 4888, 030 703 3458 as headline numbers |
| Company papers (internal background) | Vision, mission, God factor / professionalism / keys to success; hire windows (daily 1–6, weekly 1–3, monthly 1–11, 1–5 years + option to buy); chauffeur 3h / 10h; roadside by phone; Theo founded with own capital; Mary finance counsel; extra client names Latex Foam and PMI in **copy only** | Act **169** (Companies Code is Act **179**); Sakaman / 030 703 3458 / 024 345 2283 / 027 533 4888 / theo@ / hotmail as current contact; Abigail Otsiman and Jacob Akoto Brown as **current** team; earth-moving or trucks on this car-rental site; airline ticketing as a shop SKU; “24-hour office” |
| Concierge | Kotoka meet-and-greet, visiting staff/client cars, quoted executive support | Publish airline ticketing or temporary office space as bookable products |

Public titles should name **Accra**, **Ghana**, **self-drive**, **chauffeur**, or **Kotoka** where that is the page intent. Do not keyword-stuff, invent GHS rates, or list Sakaman as the current office.
)
