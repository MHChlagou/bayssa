# Backup file format

Bayssa can save what a person has stored on a device to a file, and read such a file back. Everything happens on the device: nothing is uploaded, and the feature works offline.

## What the file is for

- Keeping a copy of favorites and tasbih counters.
- Moving them to another phone or computer.
- Moving them between the browser and the app installed on the home screen. On iPhone these two keep separate storage, so an app added to the home screen starts empty even if the same site was used in Safari. Exporting in one and importing in the other is the way across. This follows WebKit's documentation and has not been confirmed on a device.

## Format, version 1

A UTF-8 JSON file named `bayssa-backup-YYYY-MM-DD.json`.

```json
{
  "format": "bayssa-backup",
  "version": 1,
  "exportedAt": "2026-11-22T10:00:00.000Z",
  "appVersion": "0.1.0",
  "data": {
    "favorites": [{ "id": "h-79", "addedAt": 1795000000000 }],
    "tasbih": {
      "activeId": "subhan-allah",
      "counters": { "subhan-allah": { "count": 12, "target": 33, "completedRounds": 2 } },
      "lifetimeTotal": 78
    },
    "progress": { "day": "2026-11-22", "counts": { "morning#0": 1 } },
    "prefs": { "theme": "system", "numerals": "arab", "textScaleIndex": 1, "hijriOffsetDays": 0, "isHapticsEnabled": true }
  }
}
```

| Field | Meaning |
|---|---|
| `format` | Always `bayssa-backup`. A file without it is not a backup |
| `version` | The format version, a whole number. This document describes 1 |
| `exportedAt` | When the file was made, ISO 8601 |
| `appVersion` | The app version that made it. Informational |
| `data.favorites` | Saved entries: entry id and the time it was saved, in milliseconds |
| `data.tasbih` | The selected dhikr, a counter per dhikr, and the lifetime total |
| `data.progress` | Repetition counts in the adhkar readers for one calendar day |
| `data.prefs` | Theme, digit style, text size, Hijri adjustment, haptics |

The file holds no supplication text and nothing that identifies a person. It does hold practice counts, which some people consider private.

## Reading a file

A file is refused, with nothing changed on the device, when:

- it is larger than 1,000,000 characters;
- it is not JSON;
- it is JSON but not a Bayssa backup;
- its version is not one this app supports, whether older or newer;
- any section is missing or of the wrong type, or any single value is invalid, such as a negative count, a fractional count, an empty id or an unknown theme.

A bad value refuses the whole file. Nothing is imported in part, and nothing is silently dropped. The one tolerance is a favorite listed twice in the same file: one copy is kept.

## Importing

A valid file opens a preview first. The preview says how many favorites would be added, how many are already saved, how many refer to entries this version of the app does not contain, and what would happen to each counter. Nothing is written until the person confirms, and cancelling leaves the device as it was.

The merge follows two rules.

1. Nothing on the device is removed or lowered.
2. Importing the same file twice gives the same result as importing it once.

| Data | Rule |
|---|---|
| Favorites | Union. An entry already saved keeps its place and its date. New ones are added |
| A counter that exists only in the file | Added as it is |
| A counter that exists on both sides | The larger count and the larger number of completed rounds are kept. The target on the device is kept |
| Lifetime total | The larger of the two |
| Selected dhikr | Kept from the device, unless none is selected |
| Reading progress | Applied only if the file was made on the same calendar day, taking the larger count per item |
| Preferences | Left alone, unless the person ticks the option in the preview. Then the file's preferences replace the device's |
| Favorites for entries this version does not contain | Kept in storage and not shown, so they reappear if the entry returns |

Keeping the larger count, and not the sum, is deliberate. A sum would double the counts whenever a file is imported twice. The cost is that counts made separately on two devices are not added together.

## Two ways to move the data

- A file: "تصدير ملف" saves it, and "استيراد من ملف" reads it.
- Text: "نسخ البيانات" copies the same content to the clipboard, and "لصق البيانات" accepts it. This is for cases where saving or opening a file is awkward, as it can be in an app running from the home screen. Whether file download works in an installed app on iPhone has not been tested on a device.

## Changing the format later

A change that older versions of the app could misread gets a new version number. The app refuses versions it does not know and says that the app needs updating, so an old app never guesses at a new file. A newer app can add a reader for old versions.

When daily tracking is built, its history would join `data` under a new version, with version 1 files still accepted.
