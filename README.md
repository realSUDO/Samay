# Samay

A dark, minimal time app — clock, stopwatch, and countdown timer — built with React + Vite.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Features

**Clock**
- Live local clock with large Bebas Neue display
- 12h / 24h toggle
- World clock pins — search and add any IANA timezone, remove on hover

**Stopwatch**
- Centisecond precision (30ms refresh)
- Lap recording with split + total columns
- Best lap highlighted green, slowest highlighted red

**Timer**
- Quick presets: 5m · 10m · 25m · 45m · 60m
- SVG progress ring that drains as time counts down, turns red on finish
- Click the time display to set a custom duration (MM:SS)
- Lofi background audio while running, beep on finish

**App**
- Sidebar navigation with keyboard shortcuts — press `1`, `2`, `3` to switch tabs
- Dark theme with subtle noise grain
- Responsive: sidebar collapses to a top bar on small screens

## Folder Structure

```
src/
├── App.jsx                 # Root layout, sidebar nav, keyboard shortcuts
├── index.css               # Design tokens, global reset, grain overlay
└── components/
    ├── Clock.jsx           # Live clock + world clock pins
    ├── Stopwatch.jsx       # Stopwatch with centiseconds + lap analysis
    ├── Timer.jsx           # Countdown with presets, progress ring, audio
    ├── Controls.jsx        # Play/pause/reset/lap buttons
    ├── TimeDisplay.jsx     # Animated digit display (FlipDigit groups)
    └── FlipDigit.jsx       # Single digit with slide-up animation

public/
├── beep.mp3                # Timer start + finish alert
├── lofi.mp3                # Background audio during countdown
└── favicon.svg
```

## Notes

- Time tracked via `Date.now()` deltas — no drift on throttled tabs.
- Timer uses plain text inside the progress ring (not animated digits) to guarantee it always fits.
- FlipDigit animation: 140ms slide-out, 160ms slide-in, queues rapid changes without dropping frames.
