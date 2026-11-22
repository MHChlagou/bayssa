# Performance optimization report

Measured on 2026-11-22 with Lighthouse 13.6.0 against the production build served locally under `/nafissa/`, headless Chromium 159, default simulated throttling (slow 4G, 4x CPU slowdown). These are lab numbers from one machine, not field data.

## Result

| Page | Profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| Home, before | mobile | 91 | 100 | 100 | 100 | 0.8 s | 3.4 s | 70 ms | 0 |
| Home, after, run 1 | mobile | 100 | 100 | 100 | 100 | 0.8 s | 0.8 s | 0 ms | 0 |
| Home, after, run 2 | mobile | 100 | 100 | 100 | 100 | 0.8 s | 0.8 s | 10 ms | 0 |
| Home, after, run 3 | mobile | 100 | 100 | 100 | 100 | 0.8 s | 0.8 s | 10 ms | 0 |
| Home, after | desktop | 100 | 100 | 100 | 100 | 0.2 s | 0.7 s | 0 ms | 0 |
| Tasbih opened directly (`#/tasbih`) | mobile | 89 | 100 | 100 | 100 | 0.8 s | 3.8 s | 10 ms | 0 |

The target (95 or more on performance, 100 on the other three) is met for the home screen. It is not met for a page opened directly by a deep link, which still waits for JavaScript. See "Future optimization".

## What was wrong

The page showed nothing until about 200 kB of compressed JavaScript had downloaded and run. On a slow connection that put the largest paint at 3.4 s.

## What changed

1. Static shell. At build time a Vite plugin renders the home screen to HTML with React's server renderer and places it inside `#root`. The first paint no longer waits for JavaScript. The shell is part of `index.html`, so the service worker precaches it and offline starts are just as fast.
2. Hydration instead of replacement. The app adopts the shell's elements when it starts. An earlier attempt that replaced the shell scored 94, because the browser counted the replaced heading as a new largest paint at 3.1 s.
3. Matching first render. For hydration to work the app's first render must equal the shell exactly. Anything that depends on the day or on saved data (dates, the suggested wird, daily picks, counts, progress, the user's digit style) is left out of the shell and of the first render, then filled in immediately after. `useSyncExternalStore` drives this, which is the mechanism React provides for it.
4. Animation library off the first load. The navigation indicator, page transition, home entrance and toast now use CSS. Motion (46 kB compressed) loads only with the pages that use it. First-load JavaScript went from 203 kB to about 155 kB compressed.
5. Font preload for the two fonts the first screen uses.
6. Duplicate search text removed from hadith entries (about 2 kB).

## A change you should know about

Decision on 2026-11-22: the new order is kept.

On the home screen the two quick cards (tasbih, favorites) now sit above the two daily cards (dhikr of the day, dua of the day). The daily picks depend on the date, so they cannot be in the static shell. With the old order they were on a phone's first screen and became the largest paint once JavaScript arrived. With the new order everything on a phone's first screen is static. The effect of reverting only this was not measured separately. If you prefer the old order, expect the mobile score to fall back to about 94.

## Future optimization: pages opened by a deep link

- Pages opened directly by a deep link (a bookmark, a manifest shortcut, a shared link) are not prerendered. The shell is hidden on those routes so the home screen does not flash, and the page appears when JavaScript is ready: LCP 3.8 s in the lab. That run was taken before the shell-hiding tweak and was not repeated after it.
- Prerendering every route would fix that, but hash routes cannot be distinguished by the server, so it would need path-based routing with a GitHub Pages 404 fallback. That is a routing change and was left alone.
- Repeat visits are served from the service worker cache and are not affected by any of this.

This is recorded as future work. The current implementation is kept as it is.

## Safeguards

- Offline behaviour is unchanged: the same precache covers the same files, and the offline tests pass in Chromium, Firefox and WebKit.
- A test loads the home screen in every browser profile and fails on any console error or warning, which is how a hydration mismatch would show up.
- A test with JavaScript disabled checks that the greeting and working links are present in the static HTML.
- If hydration ever fails in the field, React re-renders the page and the app logs a warning. The app keeps working.
