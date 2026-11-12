# Venn

Venn is a social planning app that helps friends compare their availability, find the best times to play together, and coordinate game sessions with ease.

## Features

- Weekly availability calendar with 30-minute time slots
- Select, deselect, and assign confidence levels to available times
- Best-overall-time recommendations
- Search for overlap with specific friends
- Sample friend profiles and availability for testing
- Schedule, Play together, Friends, and Settings tabs
- Light and dark mode
- Custom accent colors
- Privacy and sharing preview controls
- Responsive desktop and mobile layouts

## Current status

Venn currently uses demo friend data and saves preferences locally in the browser. Accounts, Google sign-in, and cross-device synchronization are planned for a future Supabase integration.

## Local development

The current version is a buildless static site. Serve the `dist` directory with any local web server. For example:

```bash
python -m http.server 8765 --directory dist
```

Then open [http://127.0.0.1:8765](http://127.0.0.1:8765).

## Project structure

- `dist/index.html` — application markup and tab layout
- `dist/style.css` — shared visual design system
- `dist/workspace.css` — responsive navigation and page layout
- `dist/calendar.js` — availability calendar behavior
- `dist/night-engine.js` — overlap and recommendation logic
- `dist/night-ui.js` — friend matching and privacy controls
- `dist/workspace.js` — tab routing and responsive navigation

## Roadmap

- Supabase email and Google authentication
- Persistent user accounts and friend connections
- Cross-device availability syncing
- Notifications and session reminders
- Live friend availability updates
