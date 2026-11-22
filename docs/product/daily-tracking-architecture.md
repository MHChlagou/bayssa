# Daily tracking: architecture proposal

Revised on 2026-11-22. This is a proposal. Nothing in it is implemented, and it stays deferred until you approve it.

## Purpose

Let a person see their own daily practice of adhkar and duas, keep a steady habit, and look back over past days. Everything stays on the device.

Tone is part of the design. The screens show what was done and nothing else: no points, badges, rankings, or messages about missed days.

## What exists to build on

| Piece | What it does today |
|---|---|
| `progress` store | Repetition counts per item for the current day. Cleared when the date changes |
| `tasbih` store | A count per dhikr and a lifetime total |
| Collections | Stable ids and item lists |
| `src/domain/progress` | Pure functions for today's counts |
| `localStore` | One validated, versioned record per store in `localStorage`, shared between tabs |
| Service worker | The whole app is available offline |

Today's progress is discarded at the change of date. Tracking keeps a small summary of each day before that happens.

## Data model

One new store, `history`.

```ts
type DayRecord = {
  day: string                        // the practice day, YYYY-MM-DD
  collections: Record<string, { done: number; total: number }>
  tasbih: number                     // counts made that day
}

type History = {
  days: DayRecord[]                  // newest first
  months: Record<string, { activeDays: number; completeDays: number; tasbih: number }>
  wird: string[]                     // collection ids that make a complete day
  dayStartsAtHour: number            // see "When a day begins"
}
```

- Only counts are stored: how many items of a collection were completed, out of how many. Never which words were read or when.
- Daily records are kept for about 400 days. Older days are folded into the monthly totals, so the record never grows without limit. A year of daily records is a few tens of kilobytes, far below any storage limit.
- `total` is stored with each day because collections can change between versions. A past day is judged against what the collection held that day.
- Records are keyed by collection id. An id that a build does not know is ignored when displaying and kept when saving, so a history survives moving between builds with different content.

## The one change to existing behaviour

`progress` remains the detailed record of the current day. At the change of day, its summary is appended to `history`, then the counts are cleared, in that order. If the app was closed for several days, the summary is written for the last day that has counts and the days in between stay empty.

This rollover lives in one pure function and is called from one place, at start-up and when the app returns to the foreground.

## Logic

A new module, `src/domain/tracking/`, with no React and no storage, like the other domain modules:

- `closeDay(progress, history, now)`: the rollover.
- `dayCompletion(record, wird)`: the share of the chosen wird that was completed.
- `currentStreak` and `longestStreak`: consecutive days on which the wird was completed. Whether a partly completed day keeps a streak is a setting of the function, decided in design, not hidden in the code.
- `weekSummary` and `monthSummary`.
- `practiceDay(now, dayStartsAtHour)`: which day a moment belongs to.

Every function takes the date as an argument, so month ends, year ends and clock changes are tested with fixed dates.

## When a day begins

Midnight is the simplest boundary, but someone who reads the evening adhkar at half past midnight would see them counted on the wrong day. A boundary tied to sunset would need prayer times, which the app does not have and which you have not asked for.

Proposal: a fixed hour at which the day turns, 03:00 by default, changeable in settings. It needs no location and no network.

Days are keyed by the local date at the moment of counting and are never rewritten, so travel and daylight-saving changes cannot corrupt past records. A day may be shorter or longer once, and that is accepted.

## Screens

- Home: the hero already shows the suggested wird with a ring. It would add today's completion and the current streak in the same quiet style.
- A "متابعة" screen: a month calendar with one mark per day (empty, partly done, complete), the last seven days as bars, and current and longest streak.
- Settings: choose which collections make up the daily wird, set the hour the day turns, export and import.

The calendar is a new destination. With five tabs already in the bottom bar, I would reach it from the home screen and the settings screen and leave the bar as it is.

## Offline operation

Nothing in tracking touches the network. It reads and writes local storage and works exactly as the rest of the app does offline. There is no account, no server and therefore no synchronisation between devices.

## Durability and recovery

A habit record is the kind of data a person would not want to lose, so this section states what the platforms actually guarantee.

### Safari and WebKit: verified against WebKit's documentation

My earlier report said Safari on iPhone can clear a site's storage after a week unless the app is installed. I checked that against WebKit's own pages. It is accurate in substance, and the precise statements are these.

From WebKit's Tracking Prevention documentation:

> ITP deletes all cookies created in JavaScript and all other script-writeable storage after 7 days of no user interaction with the website. The latter storage forms are: IndexedDB, LocalStorage, Media keys, SessionStorage, Service Worker registrations and cache.

and, under "Home Screen Web Application Domain Exempt From ITP":

> The first-party domain of home screen web applications is exempt from ITP's 7-day cap on all script-writeable storage, i.e. ITP always skips that domain in its website data removal algorithm. In addition, the website data of home screen web applications is kept isolated from Safari.

From the WebKit blog post that introduced the cap (March 2020), the cap applies "after seven days of Safari use without user interaction on the site".

From the WebKit blog post "Updates to Storage Policy" (2023): data can also be evicted when storage is under pressure or the overall quota is exceeded, least recently used first. By default every origin is in "best-effort" mode, and "an origin can request persistent mode using the Storage API".

What follows for Bayssa:

1. The seven days are days on which Safari is used, not calendar days, and the clock restarts whenever the person interacts with the site. A daily user in Safari is not affected. Someone who stops for more than a week of Safari use can lose everything stored, including the offline copy of the app.
2. An app added to the Home Screen is exempt from that cap.
3. Storage of the Home Screen app is separate from Safari's. Favorites, counts and history made in Safari do not appear in the installed app. This affects favorites and the tasbih today, before tracking exists.
4. The cap covers the service worker cache too, so the same event that would erase a history also removes the offline app.

I verified the documentation, not the behaviour on a device. Point 3 in particular should be confirmed on an iPhone.

### What the design does about it

- Export and import. A single file holding history, favorites, tasbih counts and preferences, with a format version. Import validates the file with the same parsers the stores use, shows what it contains, and asks before replacing anything. This is the recovery path for a cleared browser, and the way to move from Safari to the installed app or to a new phone.
- Persistent storage is requested, as the app already does. Browsers may decline, and the request is not a guarantee.
- The app can tell the person, once and plainly, that installing it to the Home Screen keeps their record safer on iPhone, and when the last export was made. No repeated prompts.
- A history that fails validation is never silently discarded: the app keeps the raw value aside and says that the record could not be read, so an export of it remains possible.

## Reminders

Not proposed. A web app cannot reliably notify at a set time while it is closed, least of all on iPhone, and promising reminders that sometimes fail would do more harm than offering none. If you want them later, they need a design of their own.

## Privacy

Unchanged: nothing leaves the device. The export file is created on the device and goes only where the person puts it. The file contains practice counts, which some people would consider private, so the export screen says what the file holds.

## Fit with the rest of the project

- Public and private builds: the history is keyed by collection id and tolerates unknown ids, so it works in a build with fewer collections.
- The dedication band and the dua focus are unaffected.
- No religious content is involved. Tracking counts completions of what already exists.

## Tests

- Unit: rollover across midnight, the configured hour, month and year ends, a gap of several days, daylight-saving changes, streaks with and without partial days, folding into monthly totals, unknown collection ids.
- Storage: validation, corrupt data, migration from a store without history, export and import round trip, import of a damaged file.
- End to end: count today, move the clock to the next day, see yesterday recorded and today empty, in every browser profile. Export, clear storage, import, and see the record restored.

## Size and order of work

About the size of the favorites and tasbih features together. A sensible order:

1. Export and import of what exists today (favorites, tasbih, preferences). Done on 2026-11-22: see `backup-format.md`. Tracking's history would join the same file under a new format version.
2. The history store, the rollover and the domain functions, with tests, and no screen.
3. The home screen additions.
4. The calendar screen and the wird setting.

## Decisions needed before building

1. The hour at which the day turns: 03:00 by default, with a setting?
2. Does a partly completed day keep a streak, or only a complete one?
3. Which collections form the default wird: morning and evening adhkar?
4. Should step 1, export and import, go ahead before the rest of tracking, since it protects data people already have?

Sources: [WebKit Tracking Prevention](https://webkit.org/tracking-prevention/), [Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/), [Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/).
