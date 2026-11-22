# Dependency security report

`npm audit` on 2026-11-22. The project has 18 production packages and 619 development packages installed.

## The four advisories

| Package | Advisory | Why it is flagged | Direct | In production |
|---|---|---|---|---|
| glob 11.1.0 | GHSA-3g3m-2fjr-6pw4: cancelling a glob with an AbortSignal does not stop the filesystem walk. Affects 9.0.0 to 14.0.1. | The vulnerable code itself | No | No |
| minimatch 10.2.6 | GHSA-g3hv-75wg-m249: a crafted pattern can cause excessive work. Affects 7.0.0 up to but not including 11.0.1. | The vulnerable code itself | No | No |
| workbox-build 7.4.1 | none of its own | Depends on the glob above | No | No |
| vite-plugin-pwa 2.0.0 | none of its own | Depends on workbox-build | Yes, as a development dependency | No |

All four are rated moderate. They are one chain: vite-plugin-pwa uses workbox-build, which uses glob, which uses minimatch.

## Exposure

`npm audit --omit=dev` reports 0 vulnerabilities. None of these packages is in the JavaScript sent to users.

The chain runs only on the build machine, when the service worker's file list is generated. The glob patterns come from `vite.config.ts`, not from user input, and no AbortSignal is used. Neither advisory is reachable in this project. The practical risk was already negligible.

## Fix applied

A single override in `package.json`:

```json
"overrides": { "workbox-build": { "glob": "^14.0.6" } }
```

This moves glob to 14.0.6, which brings minimatch 11.0.9. `npm audit` now reports 0 vulnerabilities.

## Confirmation that nothing broke

- workbox-build calls one glob function, `globSync(pattern, { cwd, follow, ignore })`, which is unchanged in glob 14.
- The generated service worker precache list was compared before and after: same 34 files, same revision hashes, byte for byte.
- Lint, type check, 58 unit tests and the full end-to-end suite pass with the override in place.
- glob 14 requires Node 18, 20 or 22 and later. The project requires Node 24.

## Caveat

The override puts glob outside the range workbox-build declares (`^11.0.1`). It is safe for the one function used today. Remove the override when workbox-build publishes a release that depends on a patched glob, and re-run the precache comparison if workbox-build is upgraded while the override is still there.

## What was not done, and why

- `npm audit fix --force` proposes downgrading vite-plugin-pwa to 1.1.0. That version does not support Vite 8, so it would break the build. Rejected.
- No other package was updated.

## Other dependency changes in this milestone

- `sharp` 0.35.5 added as a direct development dependency. It was already installed through the icon generator. It renders the iOS launch images.
- Playwright now also downloads Firefox and WebKit. No new npm package.
