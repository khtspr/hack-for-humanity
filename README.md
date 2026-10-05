# HomeMatch 🏠

> **Find a home based on where your life happens – not just where you think you should live.**

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A522.18-339933?logo=nodedotjs&logoColor=white)
![Status](https://img.shields.io/badge/status-hackathon%20prototype-yellow)

HomeMatch is a commute-based housing search for **Dublin**. Instead of asking *"Where do you want to live?"*, it asks **"Where do you need to go?"** – then ranks homes by how well they fit your budget, your commute, your public transport options and your lifestyle, and **explains why** each one was recommended.

Built for the **Hack for Humanity – Local Track** hackathon. 📑 **[View the pitch deck (PDF)](docs/HomeMatch-presentation.pdf)**

<!-- TODO: add a screenshot or demo GIF here, e.g. ![HomeMatch results](docs/screenshot.png) -->

---

## The problem

Property sites make you pick an area first, then filter by price and bedrooms. But most people don't need one specific neighbourhood – they need to reach work, school, family and childcare easily and affordably, with or without a car.

Because people instinctively search as central as possible, demand concentrates in a few areas and **prices rise disproportionately**, while well-connected homes further out go unseen.

The result: **a suitable home often exists somewhere you never thought to look**, because it appears "too far" on a map even though it sits next to a tram stop, or a home that looks close has no useful transport at all.

## The solution

|  | Traditional search | HomeMatch |
|---|---|---|
| Starting point | Area → Properties | **Your destinations → Properties** |
| Distance | Straight-line / map distance | **Real door-to-door commute time** by your chosen modes |
| Results | Strict filters (hide anything that misses) | **Match Score** that surfaces good trade-offs |
| Transparency | A list | **"Why we recommended this"** – strengths and trade-offs |

> *Example: a €1,800/month apartment that isn't walkable to your office but is beside a Luas stop and needs no car can outrank a closer one with poor connections.*

## Who it's for

Renters and buyers new to a city, students, young professionals, families, people changing jobs, people without cars, and hybrid workers – including households with **several people going to several places**.

---

## Features

- **Multi-destination preferences** – add workplaces, university, school, family, etc., each with a type, visits per week and importance (low / medium / high).
- **Transport modes** – car, train, bus, bike, walk.
- **Match Score (0–100)** per property, with sub-scores for affordability, commute, transport, property fit and lifestyle.
- **Transparent, no-AI scoring** – a simple weighted algorithm you can inspect; no wasteful use of AI.
- **Smart categories** – *Best overall*, *Best value*, *Best commute*, *Worth considering*.
- **Plain-language explanations** – strengths, trade-offs and how far each result is over/under budget or commute limit.
- **Interactive map** (Leaflet + OpenStreetMap) next to ranked property cards.
- **Property detail page** with per-destination commutes and nearby kindergartens, schools and grocery stores (within 1 km).
- **Real data** – Dublin rental listings from Daft.ie, NTA GTFS stops/lines, OpenStreetMap routing.
- **Polished "Night Line" dark UI** – scroll-scrubbed Luas-door hero, pixel-art DART loading screen and a few hidden easter eggs (see [`docs/whimsy.md`](docs/whimsy.md)).

## How the Match Score works

Every property is scored rather than hard-filtered:

| Component | Weight |
|---|---|
| Affordability | 35% |
| Commute (weighted by destination importance × visits/week) | 30% |
| Transport connectivity (from GTFS stop/line data) | 15% |
| Property requirements (type, bedrooms, …) | 10% |
| Lifestyle (nearby amenities) | 10% |

### Commute estimates

For each destination, HomeMatch builds candidate journeys for the modes you picked and times each leg on OpenStreetMap:

- **Walk / cycle:** OSM foot/bike route.
- **Drive:** OSM car route × 1.4 (OSRM assumes empty roads) + 5 min parking.
- **Bus / Luas:** walk to a stop + half the peak headway + OSM road time × 1.6 (bus) / 1.3 (Luas) + walk from the stop.
- **DART / rail** and **journeys needing a change** are shown as *estimates*.

The first search for a new set of destinations takes ~10 s (requests are spaced out for the shared OSRM server); repeats are served from cache.

---

## App overview

| Route | Purpose |
|---|---|
| `/` | Landing page with the Luas-door hero |
| `/preferences` | Budget, bedrooms, max commute, transport modes, destinations |
| `/results` | Ranked property cards + map |
| `/properties/[id]` | Property detail, "why it matches", commutes, amenities |
| `POST /api/match` | Takes preferences, returns ranked `MatchResult[]` (validated, JSON-only, 16 KB cap) |
| `GET /api/amenities/[propertyId]` | Precomputed nearby amenities |

## Tech stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Map & UI:** Leaflet / react-leaflet, framer-motion, lucide-react, plain CSS design tokens
- **Backend:** Next.js route handlers – no separate server or database
- **Security:** strict CSP and security headers in `next.config.mjs`, input validation in `lib/validate.ts`

### Data sources

| Data | Source | When |
|---|---|---|
| Listings (11 Dublin rentals + 2 sample purchase listings) | Daft.ie – coordinates, rooms, facilities in `lib/data.ts` | static |
| Stops and which lines serve them | [NTA GTFS timetable](https://www.transportforireland.ie/transitData/Data/GTFS_Realtime.zip) → `data/generated/transit.json` | build time |
| Journey times | [OSRM](https://routing.openstreetmap.de) `table` service, batched + cached | request time |
| Kindergartens, schools, groceries | OpenStreetMap Overpass → `data/generated/amenities.json` | build time |
| Destination coordinates | OpenStreetMap Nominatim (1 req/s, cached) | request time |
| Map tiles | OpenStreetMap via Leaflet | browser |

---

## Getting started

Requires **Node ≥ 22.18** (the data scripts import `lib/data.ts` using Node's built-in TypeScript support). **No API keys needed.**

```bash
npm install
npm run dev        # http://localhost:3000
```

The generated data in `data/generated/` is committed, so the app runs straight away.

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | Lint the project |
| `npm run prepare-data` | Refresh GTFS transit data (~1 min) and OSM amenities (a few min) |
| `npm run build:transit` / `npm run build:amenities` | Run either data step on its own |

## Project structure

```
app/            Pages and API routes (landing, preferences, results, properties, /api/*)
components/     Map, header/footer, commutes panel, UI + whimsy components
lib/            Matching engine (matching.ts), listings (data.ts), validation,
                transit/ (OSRM routing, GTFS connectivity, geocoding)
data/generated/ Prebuilt transit and amenity data
scripts/        build-transit.mjs, fetch-amenities.mjs
docs/           design-system.md ("Night Line"), whimsy.md
public/hero/    Hero imagery
```

## Roadmap

- Real-time listings through integration with property platforms like Daft.ie
- Environmental impact – reward the benefit of not needing a car when evaluating a property
- Additional factors: local safety, air quality and environmental information (with sparing, sustainable use of AI)
- Hybrid-working schedules and per-user weight customisation
- Healthcare and accessibility requirements
- Commute cost, car ownership and parking cost comparison
- Saved searches, alerts and side-by-side comparison

## Impact

Better search won't solve housing supply, but it can improve **housing discovery**. HomeMatch does the transport analysis for you, so people can find well-connected homes in areas they hadn't considered – without researching every district of the city.

**HomeMatch is Skyscanner for housing.** *Don't search neighbourhoods. Search for the home that fits your life.*

## Team

Built by **Alper Ergüne**, **Guillermo Garcia** and **Kacper Kotwica** for the Hack for Humanity Local Track.

## License

No license has been specified yet. <!-- TODO: add a LICENSE file (e.g. MIT) -->
