# Rye - Eye Rest Reminder

macOS app that reminds you to rest your eyes every 30 minutes with a 30-second full-screen countdown.

## Installation

```bash
brew install blchelle/tap/rye
```

## Development Setup

```bash
npm install
npm run build:web
```

## Run

```bash
npm start
```

## Build macOS App

```bash
npm run build
```

The app will be in `dist/` folder.

## How It Works

- Triggers at every 30-minute mark (e.g., 7:00, 7:30, 8:00)
- Shows full-screen modal with 30-second countdown
- Cannot be dismissed until countdown completes
- Automatically closes after 30 seconds
