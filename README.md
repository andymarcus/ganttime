# Timezone Gantt

A single-page web app that visualizes working hours across multiple timezones as a Gantt chart, helping distributed teams find the best time to meet.

![HTML](https://img.shields.io/badge/HTML-vanilla-orange) ![JS](https://img.shields.io/badge/JS-vanilla-yellow) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Gantt Chart** — Horizontal bars show work hours, free time, and sleep for each timezone at a glance
- **Add Any Timezone** — Search from all IANA timezones with fuzzy matching
- **Ideal Meeting Finder** — Automatically computes the best overlapping window where everyone is in work hours, or the best compromise when there's no perfect overlap
- **Google Calendar Integration** — Click any hour on the chart to open a pre-filled Google Calendar event with timezone details
- **Interactive World Map** — Leaflet-powered map with day/night terminator overlay showing real-time sunlight and shadow
- **Hover Tooltips** — Mouse over the chart to see the corresponding time across all zones
- **Persistent** — Timezone selections are saved to localStorage

## Tech Stack

- Vanilla HTML / CSS / JS — no build step
- [Leaflet](https://leafletjs.com/) — interactive map with CartoDB light tiles
- [Lucide Icons](https://lucide.dev/) — icon font
- [Inter](https://rsms.me/inter/) — typeface

## Getting Started

Just open `index.html` in a browser:

```bash
open index.html
```

Or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How It Works

1. **Add timezones** using the search box in the header
2. **Read the chart** — each row shows a timezone with colored bars:
   - Solid colored bars = work hours (9am–5pm)
   - Outlined bars = free time (7am–9am, 5pm–10pm)
   - Hatched bars = sleep (10pm–7am)
3. **Check the banner** — it shows the ideal meeting window across all your timezones
4. **Hover** over the chart to compare times across all zones
5. **Click** any hour to create a Google Calendar event
6. **Scroll down** to see the world map with day/night shading and markers for each timezone

## License

MIT
