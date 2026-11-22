# Launch checklist

Status on 2026-11-22. "Done" means verified in this repository. Everything else is open.

## 1. Content and licensing

- [ ] Blocking: written permission for the selection from حصن المسلم, or the wording re-sourced from a licensed dataset with your approval. See `licensing.md`.
- [ ] Blocking: التفسير الميسر re-sourced from QuranEnc.com under its stated terms, or permission from the King Fahd Complex, or the "meaning" disclosure removed.
- [ ] Decide what happens to `content-sources/hisn-footnotes/`, which is the whole book under a transcriber's MIT file.
- [ ] Decide how the two existing commits are published, since they contain the unresolved material.
- [ ] Choose the code licence and add `LICENSE` (and `NOTICE` if Apache-2.0).
- [ ] Make the Tanzil credit in the sources screen a link to tanzil.net, as Tanzil's terms ask.
- [ ] A qualified scholar reads the 205 published entries. Until then the disclaimer stays.
- [ ] Review the 16 entries in `footnote-review-list.md` one by one.
- [ ] Decide on the 6 held entries after independent verification.
- [x] Quran text identical to the Tanzil file, checked on every build.
- [x] Held and unverified entries absent from the production build, enforced by a test.
- [x] The app and both READMEs state that no scholar has reviewed the content.

## 2. Security

- [x] `npm audit`: 0 advisories, production and development.
- [x] No secrets, tokens or personal data in the repository (scanned before each commit).
- [x] No third-party requests at runtime, enforced by a test.
- [x] Data read from `localStorage` is validated before use.
- [x] Download script validates remote ids and confines its writes.
- [ ] Turn on private vulnerability reporting and Dependabot alerts when the repository exists.
- [ ] Protect `main`.
- [ ] Remove the `glob` override in `package.json` once workbox-build depends on a patched version.

## 3. Build and tests

- [x] Lint and strict TypeScript clean.
- [x] 60 unit tests pass.
- [x] 270 end-to-end checks: 265 pass, 5 skipped by design, across Chromium, Firefox and WebKit profiles.
- [x] Accessibility: axe reports no WCAG 2.1 A or AA violation on nine screens, light and dark.
- [x] Lighthouse, home screen: 100 on all four categories, mobile and desktop (lab).
- [ ] Open: the Firefox offline test failed in 2 of 5 early full runs and has passed since. Cause unknown.
- [ ] Future: pages opened by a deep link are not prerendered (performance 89 in the lab).
- [ ] First run of the GitHub Actions workflow. It has never run.

## 4. PWA installation

- [x] Manifest valid, Chrome reports no installability errors.
- [x] Icons (192, 512, maskable, Apple touch) and 20 iOS launch images generated and declared.
- [ ] Install on an Android phone from Chrome. Check icon shape, name and splash.
- [ ] Add to Home Screen on an iPhone. Check icon, launch image, status bar and safe areas.
- [ ] Install on desktop Chrome or Edge.

## 5. Offline functionality

- [x] Every screen works offline after the first visit, in three engines.
- [x] Cold start offline on a deep link.
- [x] Recovery when the connection returns.
- [x] Update flow: a new version waits for consent, then takes over.
- [ ] Repeat on a real phone in airplane mode, from the installed icon.
- [ ] Publish a small update after launch and confirm the prompt appears on an installed phone.

## 6. Real-device testing

None of this has been done. Automated tests ran on browser engines on a Linux desktop.

- [ ] iPhone, Safari and installed: all five tabs, reader counter, tasbih to completion, favorites, search with Arabic keyboard, settings.
- [ ] Android, Chrome and installed: the same pass, plus vibration on count and on completion.
- [ ] iPhone: confirm there is no haptic feedback and nothing breaks (iOS has no vibration API).
- [ ] Share an entry to a messaging app on both systems. Check the Arabic text and the source line.
- [ ] Compare a long Quran passage on screen with a printed mushaf, on both systems.
- [ ] Largest text size and dark mode on a small phone.
- [ ] iPhone: leave the non-installed site unused for more than seven days and check whether favorites survive.
- [ ] A screen reader pass: VoiceOver and TalkBack.

## 7. GitHub Pages deployment

- [ ] Create the repository as private first.
- [ ] Settings, Pages: source "GitHub Actions".
- [ ] Confirm the repository name is `muslim-daily`, or change `BASE_PATH`.
- [ ] Push `main` and watch the first workflow run to the end.
- [ ] Apply the description, topics and social preview from `github-presentation.md`.
- [ ] Make the repository public only when section 1 has no blocking item left.

## 8. Post-deployment validation

- [ ] Open the live address in a private window. The home screen appears before scripts load.
- [ ] Open a deep link, for example `#/adhkar/morning`, directly.
- [ ] DevTools, Application: service worker active, manifest without warnings.
- [ ] Network tab: no request leaves the site's own origin.
- [ ] Go offline and reload.
- [ ] Run Lighthouse against the live address, mobile and desktop.
- [ ] Paste the address into a link preview checker. The image and title appear, with an absolute image URL.
- [ ] View source: the canonical link and `og:url` carry the live address.
- [ ] Install from the live address on one Android and one iPhone.
- [ ] Open one content correction issue as a test of the form.
