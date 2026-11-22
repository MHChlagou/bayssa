# Cross-browser testing report

Run on 2026-11-22 on Linux (WSL2) with Playwright 1.65 against the production build.

## What kind of testing this is

Everything below is automated testing of browser engines on a desktop machine. No real phone, tablet or Mac was used, and nothing was installed to a home screen by hand.

| Profile in the test run | What it really is | What it is not |
|---|---|---|
| android-chrome | Chromium 159 with a Pixel 7 screen size, touch and user agent | Chrome on an Android phone |
| desktop-chrome | Chromium 159 | Google Chrome with its own media and install UI |
| desktop-firefox | Firefox 159 | |
| desktop-safari | Playwright's WebKit 27.2 build for Linux | Safari on macOS |
| mobile-safari | The same WebKit build with an iPhone 14 screen size and user agent | Safari on iOS |

WebKit on Linux shares Safari's layout and JavaScript engine, but not its font stack, storage policies, share sheet or home-screen behaviour.

## Result

270 checks in the last full run: 265 passed, 5 skipped, 0 failed.

| Area | How it is tested | Profiles |
|---|---|---|
| RTL rendering | Computed direction, heading on the right of the column, first navigation item on the right, no sideways overflow on four screens | all five |
| Arabic fonts | Amiri applied to supplications and Readex Pro to the interface, both loaded, no failed font faces, also offline | all five |
| Quran text integrity | The ayah shown equals the Tanzil file character for character | all five |
| localStorage persistence | Favorites, tasbih counts, reading progress, theme and Hijri adjustment survive a reload | all five |
| Offline | Every screen with the network off, a cold start on a deep link, recovery when the network returns | all five |
| Service worker update | A second build is published while a page is open. The update prompt appears, the old version keeps running until accepted, then the new version loads | desktop Chromium, Firefox, WebKit |
| Installability | Manifest fields, icons reachable, 20 iOS launch images declared. Chrome's own installability report returns no errors | all five, Chrome report on Chromium only |
| Haptic feedback | With a stand-in for the vibration API: one pulse per count, a pattern on completion, silence when switched off, and no error when the API is missing | all five |
| Sharing | With a stand-in for the share API: text and source are passed, a cancelled share is not reported as an error, the button is hidden when the API is missing. Copy to clipboard confirmed | all five |
| First load | The prerendered home screen is adopted with no console error or warning, works with JavaScript off, and a deep link opens its own screen | all five |
| Accessibility | axe, WCAG 2.1 A and AA, nine screens in light and dark | all five |

The 5 skips are deliberate: Chrome's installability report does not exist in Firefox or WebKit (3), and the update test runs once per engine, so the two phone-sized profiles leave it to their desktop counterparts (2).

## One unresolved intermittent failure

"Every screen works with no network after the first visit" failed on desktop-firefox in 2 of 5 full parallel runs. It passed in the other 3, in every run of Firefox on its own, and in 255 repetitions of the offline and feature tests under heavier load. I did not capture the error and do not know the cause. CI retries a failed test once, which would hide it, so it is recorded here.

## What automation could not establish

- Haptics. The vibration API was replaced by a stand-in, so no test proves a phone vibrates. Safari on iOS does not offer the vibration API at all, so there is no haptic feedback on iPhone. That is a platform limit, and the app degrades silently.
- Sharing. The share sheet was a stand-in. Real share sheets on iOS and Android were not opened.
- Installation. No install prompt was accepted and nothing was added to a home screen. On iOS installation is a manual "Add to Home Screen" with no prompt.
- iOS launch images. They are generated and declared for 20 screen sizes, but whether iOS shows them can only be seen on a device.
- Storage lifetime on iOS. WebKit is documented to clear script-written storage for sites not used for seven days unless the site is installed to the home screen. Not tested here. If it applies, favorites and counts of a non-installed Safari user could be lost after a week away.
- Arabic text shaping with system fonts. The bundled fonts were verified. Fallback rendering if a font fails to load was not.
- Real network conditions, battery saver modes and old devices.

## Suggested device pass before launch

1. iPhone, Safari: open, Add to Home Screen, launch from the icon, check the launch image, status bar and safe areas.
2. iPhone, installed: airplane mode, open each tab, count on the tasbih, favorite an entry, relaunch.
3. iPhone: share an entry to Notes and to a messaging app, check the Arabic and the source line.
4. Android, Chrome: accept the install prompt, check the icon shape on the launcher, run the same offline pass, feel the vibration on count and on completion.
5. Either phone: leave the installed app for a day, publish a small update, reopen and check the update prompt.
6. Mac, Safari and Firefox: read a long Quran passage and compare diacritics against a printed mushaf.
