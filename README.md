# World History Timeline Explorer

A lightweight website that overlays representative historical polities on a world map and lets users scrub a timeline from **5500 BC to today** in **25-year increments**.

## Features

- Interactive world map (Leaflet + OpenStreetMap)
- Timeline slider from -5500 to 2025 with 25-year step granularity
- Dynamic map overlays showing selected historical polities for the chosen year
- Clickable polities that load Wikipedia-backed summaries for:
  - Politics
  - Economy
  - Demographics
  - Culture

## Run locally

Because this app fetches data from the Wikipedia API, run it from a local web server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Notes

- The first version uses a curated set of representative polities and approximate geographic bounding polygons.
- Wikipedia data is fetched dynamically via client-side API calls, so category snippets can vary based on search results.
- This structure is intentionally simple so that a richer historical dataset can be plugged in later.
