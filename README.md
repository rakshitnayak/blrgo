# Namma Metro Journey Planner

A full-stack Bengaluru Metro journey planner built with Java, Spring Boot,
React, and TypeScript.

## Current milestone

The first vertical slice includes:

- a Spring Boot API that loads the complete operational network from JSON;
- station search and network endpoints;
- interchange-aware routing using Dijkstra's algorithm;
- searchable station pickers and station-by-station guidance;
- an interactive MapLibre/OpenStreetMap layer with route highlighting;
- all 88 physical stations across the Purple, Green, Yellow, and currently
  operational Pink Line section.

The app is an independent, unofficial journey planner. Fares and intermediate
times should be confirmed with BMRCL before travel.

## Project layout

```text
backend/   Spring Boot API and routing engine
frontend/  React, TypeScript, Vite, and SVG map
```

## Run locally

Requirements: Java 21+, Maven 3.9+, Node.js 20+, and npm.

```sh
cd backend
mvn spring-boot:run
```

In another terminal:

```sh
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` to Spring Boot on port 8080.

## API

```http
GET /api/network
GET /api/stations?query=majestic
GET /api/routes?from=whitefield&to=silk-institute
```

## Suggested learning path

1. Read `network.json` to understand the domain data and line geometry.
2. Read `RouteService.java` to see how Dijkstra's algorithm traverses it.
3. Run `RouteServiceTest.java` and add another route case.
4. Open `App.tsx` to see how the UI calls the API.
5. Add one station and connection end-to-end.

## Map and transit data

- Map renderer: MapLibre GL JS (open source)
- Basemap: OpenStreetMap, © OpenStreetMap contributors
- Purple, Green, and Yellow network: the ODbL-licensed community BMRCL GTFS
  feed by Vonter, derived from BMRCL timetables and OpenStreetMap
- Pink Line operational section: station order and opening status verified on
  14 November 2026; coordinates are attributed to OpenStreetMap contributors

The public OpenStreetMap raster endpoint is appropriate for local development
and low-volume evaluation subject to its tile usage policy. Configure a
production tile provider or self-hosted tiles before a high-traffic launch.
