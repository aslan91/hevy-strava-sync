# Hevy to Strava Strength Sync

A Tampermonkey userscript to sync workout logs (sets, reps, and weights) from **Hevy** to already existing **Strava** activities in-place.

This tool is designed for athletes who track heart rate and biometrics via a sports watch (e.g., Garmin) while simultaneously logging their exercise-by-exercise workout details on Hevy, and want to combine them natively on Strava without deleting the existing activity.

## Features

- **In-place updates** — updates the Strava activity with your workout log without deleting it, preserving all heart rate streams, Garmin training effect, GPS data, comments, and kudos.
- **One-click synchronization** — adds a native-looking "Sync Hevy Sets" button directly to the Strava activity page.
- **Automatic Matching** — automatically finds the matching Hevy workout by scanning workouts completed within a $\pm$3-hour window of the Strava activity's start time.
- **CSRF & Cookie Auth** — runs entirely in the browser context, using your logged-in session cookies and reading the meta CSRF token.
- **Secure Key Storage** — stores your Hevy API key locally and securely using Tampermonkey's private sandbox storage.

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) extension for your web browser (Chrome, Firefox, Safari, Edge).
2. Click on the Tampermonkey icon, open the **Dashboard**, and create a new script.
3. Copy the entire contents of [hevy-strava-sync.user.js](./hevy-strava-sync.user.js) and paste it into the editor.
4. Save the script (Ctrl+S).

## Setup & Configuration

1. Generate your Hevy developer API key by visiting your Hevy settings page: [https://hevy.com/settings?developer](https://hevy.com/settings?developer) (requires a **Hevy Pro** subscription).
2. Go to any weight training activity page on Strava (e.g., `https://www.strava.com/activities/123456789`).
3. Click the new **Sync Hevy Sets** button.
4. Paste your Hevy API Key when prompted. The script will remember this key for future syncs.
