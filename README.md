<div align="center">

<img src="public/pwa-192x192.png" alt="" width="96" height="96">

# Muslim Daily · المسلم اليومي

An Arabic, offline-first web app for daily adhkar and duas, with a tasbih counter.

[العربية](README.ar.md) · English

</div>

> [!IMPORTANT]
> The content of this app has been checked by software against its sources. It has not been reviewed by a qualified Islamic scholar, and the app is not a certified religious reference. See [Religious disclaimer](#religious-disclaimer).

## Overview

Muslim Daily is a progressive web app, in Arabic and laid out right to left, that puts the daily remembrances and supplications a Muslim uses most in one calm, fast place. It installs to a phone's home screen, works with no connection, and keeps everything on the device. There are no accounts, no ads and no tracking.

It is a static site with no server, built to be hosted on GitHub Pages.

## Features

- Daily adhkar: morning, evening, after prayer, sleep, waking and general remembrance, with a repetition counter and daily progress for each.
- Everyday duas grouped by situation, supplications from the Quran with surah and ayah, and prophetic supplications with collection, hadith number and attributed grading.
- Tasbih counter with presets, custom targets, rounds, a completion animation and optional haptic feedback. A count is never cleared without being asked.
- Favorites, saved on the device and grouped by section.
- Arabic search that ignores vocalization and tolerates common spelling variants.
- Home screen with the Hijri date (adjustable by up to two days for local moon sighting), a suggested wird for the time of day, and a dhikr and dua of the day.
- Light and dark themes, adjustable text size for supplications, Eastern or Western digits.
- Installable, fully offline after the first visit, with updates that wait for your consent.

## Screenshots

| Home | Reader | Tasbih | Dark mode |
|---|---|---|---|
| <img src="docs/screenshots/mobile-home.png" width="200" alt="Home screen on a phone"> | <img src="docs/screenshots/mobile-reader.png" width="200" alt="Morning adhkar reader"> | <img src="docs/screenshots/mobile-tasbih.png" width="200" alt="Tasbih counter"> | <img src="docs/screenshots/mobile-duas-dark.png" width="200" alt="Quranic duas in dark mode"> |

| Desktop | Desktop, dark |
|---|---|
| <img src="docs/screenshots/desktop-home.png" width="420" alt="Home screen on a desktop"> | <img src="docs/screenshots/desktop-reader-dark.png" width="420" alt="Reader on a desktop in dark mode"> |

## Installation

To use the app, open the deployed site and add it to your home screen:

- Android, Chrome: open the menu and choose "Install app".
- iPhone and iPad, Safari: tap Share, then "Add to Home Screen".
- Desktop Chrome or Edge: use the install icon in the address bar.

After the first visit the app opens and works without a connection.

## Local development

Requires Node 24 or later.

```
git clone https://github.com/<your-username>/muslim-daily.git
cd muslim-daily
npm install
npm run dev
```

The app is served at `http://localhost:5173/muslim-daily/`.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, strict |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests against the production build in Chromium, Firefox and WebKit. Run `npx playwright install chromium firefox webkit` once first. |
| `npm run content:validate` | Checks the content dataset, including the Quran text character for character |
| `npm run content:audit` | Regenerates the content audit reports (needs `npm run content:fetch` first) |

## Build

```
npm run build
npm run preview
```

The build validates the content, type-checks, prerenders the home screen to static HTML and writes the site and its service worker to `dist/`.

## Deployment to GitHub Pages

1. Create a repository named `muslim-daily`. For another name, change `BASE_PATH` in `vite.config.ts`.
2. In the repository settings, under Pages, set the source to "GitHub Actions".
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` validates the content, runs every test, builds and deploys.

The site is published at `https://<your-username>.github.io/muslim-daily/`. The workflow passes that address to the build so link previews use absolute URLs.

## PWA and offline

- Every file the app needs, including the content and the fonts, is cached on the first visit. The app makes no network request after that and none to any third party at any time.
- Routing uses the URL hash, so any screen can be opened directly and offline on a static host.
- When a new version is published the app shows a prompt and keeps running the old version until you accept, so a dhikr in progress is never interrupted.
- Favorites, tasbih counts, progress and preferences are stored in the browser's local storage.

## Technology

React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router (hash routing), Motion, Lucide icons, vite-plugin-pwa with Workbox, Vitest and Playwright. Fonts: Amiri for Quran and supplications, Readex Pro for the interface, both self-hosted.

## Content sourcing and verification

No religious text in this project is typed by hand. A script cuts every recited word from a reference source.

- Quran: the Uthmani text of the [Tanzil Project](https://tanzil.net), version 1.1, shown unchanged. Every build compares each Quran passage with the Tanzil file character for character and fails on any difference.
- Supplications: taken from حصن المسلم by Sa'id ibn Ali ibn Wahf al-Qahtani, then compared by script with the Arabic text of the six hadith collections (al-Bukhari, Muslim, Abu Dawud, at-Tirmidhi, an-Nasa'i, Ibn Majah).
- An entry is published only if its wording is found in one of those collections under a citable number, its repetition count is stated in the source text, and it is in al-Bukhari or Muslim or carries a sahih or hasan grading attributed to a named scholar.
- Text match is reported as exact (the wording is found as it is) or approximate (at least 90% of the words in order). Approximate entries are labelled on their cards.
- Entries that fail a check stay in the repository and out of the app. Entries can also be held by a recorded editorial decision.

Current figures: 205 entries published (51 Quran passages, 120 exact matches, 34 approximate matches) and 77 hidden.

The full method, its known weaknesses and the audit of every published entry are in [`content-sources/README.md`](content-sources/README.md) and [`docs/pre-release/content-audit.md`](docs/pre-release/content-audit.md).

## Religious disclaimer

- The verification described above is mechanical. A program compared letters. It is not a ruling on authenticity and it is not a scholar's review.
- No qualified Islamic scholar has reviewed this content. The app is not certified, endorsed or approved by any scholar or religious body.
- Matching by wording can attach a supplication to a narration about a different occasion. The audit found and removed such cases, and others may remain. A hadith number shown in the app may be one of several candidates.
- Gradings are quoted from a third-party dataset, with the name of the scholar they are attributed to. They are not the project's own judgment.
- For rulings, and wherever accuracy matters to you, consult a qualified scholar and the original books.
- If you find a mistake, please open a content correction issue and name your source.

## Privacy

The app has no accounts, no analytics, no advertising and no cookies. It sends nothing about you anywhere. Favorites, counts and preferences stay in your browser's storage on your device and are lost if you clear that storage. The app loads no resource from any third party.

## Licence

No licence has been granted for this repository yet. The intended structure keeps two things apart:

- the application source code, to be released under an open-source licence chosen by the project owner;
- third-party content (Quran text, supplication text, tafsir excerpts, fonts), which stays under its own holders' terms and is not covered by the code licence. See [`THIRD_PARTY_CONTENT.md`](THIRD_PARTY_CONTENT.md).

Two content permissions are still being sought. See [`docs/pre-release/licensing.md`](docs/pre-release/licensing.md).

## Credits

- [Tanzil Project](https://tanzil.net) for the verified Quran text.
- Shaykh Sa'id ibn Ali ibn Wahf al-Qahtani, may Allah have mercy on him, author of حصن المسلم.
- King Fahd Complex for the Printing of the Holy Quran, publisher of التفسير الميسر.
- [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api) for the open hadith dataset used for references and gradings.
- Khaled Hosny and the Amiri project, and the Readex Pro authors, for the fonts.
- The authors of the open-source libraries listed above.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Corrections to content are especially welcome and follow a stricter process than code.
