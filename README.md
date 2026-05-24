# Waqt

A stopwatch, countdown timer, and clock app built with React + Vite.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Features

- **Clock** — Live clock with 12/24h toggle
- **Stopwatch** — Start/pause/reset with lap recording
- **Timer** — Countdown with custom input, lofi background audio, and alert on finish

## Folder Structure

```
src/
├── App.jsx                 # Root layout and tab navigation
├── index.css               # Global CSS variables and resets
└── components/
    ├── Clock.jsx           # Live clock display
    ├── Stopwatch.jsx       # Stopwatch logic + lap list
    ├── Timer.jsx           # Countdown logic, input, audio
    ├── Controls.jsx        # Shared play/pause/reset/lap buttons
    ├── TimeDisplay.jsx     # Renders time using FlipDigit
    └── FlipDigit.jsx       # Single animated digit (slide transition)

public/
├── beep.mp3                # Timer start + finish alert
├── lofi.mp3                # Background audio during countdown
└── favicon.svg
```

## Notes

- Time is tracked using `Date.now()` deltas — no drift on throttled tabs.
- Click the time display while paused to edit the timer input.
- Timer accepts `MM:SS` or raw digits like `0500`.
