# Timezone Gantt

A web app that visualizes working hours across multiple timezones as a Gantt chart, helping distributed teams find the best time to meet.

![HTML](https://img.shields.io/badge/HTML-vanilla-orange) ![JS](https://img.shields.io/badge/JS-vanilla-yellow) ![Node](https://img.shields.io/badge/Node.js-Express-green) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Gantt Chart** — Horizontal bars show work hours, free time, and sleep for each timezone at a glance
- **Add Any Timezone** — Search from all IANA timezones with fuzzy matching
- **Ideal Meeting Finder** — Automatically computes the best overlapping window where everyone is in work hours, or the best compromise when there's no perfect overlap
- **Google Calendar Integration** — Click any hour on the chart to open a pre-filled Google Calendar event with timezone details
- **Interactive World Map** — Leaflet-powered map with day/night terminator overlay showing real-time sunlight and shadow
- **Hover Tooltips** — Mouse over the chart to see the corresponding time across all zones
- **User Accounts** — Register and log in to save your timezone lists to the server. Falls back to localStorage when not logged in.

## Tech Stack

**Frontend:**
- Vanilla HTML / CSS / JS — no build step
- [Leaflet](https://leafletjs.com/) — interactive map with CartoDB light tiles
- [Lucide Icons](https://lucide.dev/) — icon font
- [Inter](https://rsms.me/inter/) — typeface

**Backend:**
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- SQLite via Node's built-in `node:sqlite` module
- JWT authentication with HTTP-only cookies
- bcrypt password hashing

## Getting Started

```bash
# Install dependencies
npm install

# Copy and edit the env file
cp .env.example .env

# Start the server
npm start
```

Then visit [http://localhost:3000](http://localhost:3000).

For development with auto-reload:

```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `COOKIE_SECRET` | Secret for signing cookies |
| `JWT_SECRET` | Secret for signing JWT tokens |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/register` | No | Create account |
| POST | `/api/login` | No | Log in |
| POST | `/api/logout` | Yes | Log out |
| GET | `/api/me` | Yes | Get current user |
| GET | `/api/timezones` | Yes | Get saved timezones |
| PUT | `/api/timezones` | Yes | Save timezones |

## How It Works

1. **Add timezones** using the search box in the header
2. **Read the chart** — each row shows a timezone with colored bars:
   - Solid colored bars = work hours (9am-5pm)
   - Outlined bars = free time (7am-9am, 5pm-10pm)
   - Hatched bars = sleep (10pm-7am)
3. **Check the banner** — it shows the ideal meeting window across all your timezones
4. **Hover** over the chart to compare times across all zones
5. **Click** any hour to create a Google Calendar event
6. **Scroll down** to see the world map with day/night shading and markers for each timezone
7. **Sign in** to save your timezone list across sessions and devices

## Testing

```bash
npm test
```

Runs 39 tests covering auth, timezone CRUD, middleware, and full integration flows using Node's built-in test runner.

## License

MIT
