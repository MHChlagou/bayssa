# Licensing report

Status on 2026-11-22. This is an engineer's reading of the published terms, not legal advice.

## Content that ships in the app

| Content | Source | Stated terms | Status |
|---|---|---|---|
| Quran text, Uthmani | Tanzil Project, version 1.1, tanzil.net | Creative Commons Attribution 3.0, with the project's own terms: verbatim copies only, no changes to the text, keep the copyright notice with the file, credit Tanzil with a link | Complied with. The text is copied byte for byte and checked on every build. The notice stays in `content-sources/quran/tanzil-uthmani.txt`. The settings screen credits Tanzil by name and address. |
| Quran text, plain spelling | Tanzil Project | Same | Used only as a search key. Never displayed. |
| Surah names | Tanzil metadata | Creative Commons Attribution 3.0 | Complied with by the same credit. |
| Meaning of ayahs | التفسير الميسر, King Fahd Quran Complex, as distributed by Tanzil (`ar.muyassar`) | The downloaded file carries no licence text. Tanzil's translations page sets the conditions, which I did not retrieve. | Open. Confirm the terms on tanzil.net/trans before launch. The app credits the work on every card that shows it. Removing it is a one-line change in the importer if the terms do not fit. |
| Supplication text | حصن المسلم by Sa'id ibn Ali ibn Wahf al-Qahtani, transcription published by the hisnmuslim.com API | None stated by the API | Open. This is the main unresolved item. The book is widely redistributed, but that is not a licence. Ask the publisher or the author's foundation for written permission before a public launch. |
| Hadith references and gradings | `fawazahmed0/hadith-api` | The Unlicense (public domain dedication) | Clear. Only collection names, numbers and grading labels reach the app, not the dataset's text. |
| Fonts | Amiri 5.3.0 and Readex Pro 5.3.0, via Fontsource | SIL Open Font License 1.1 | Clear. Self-hosting is permitted. The licence text must travel with the font files if they are redistributed on their own. |
| Code libraries | React, React DOM, React Router, Motion (MIT), Lucide (ISC) | Permissive | Clear. |

## Sources used for checking only

| Source | Use | Stated terms | Status |
|---|---|---|---|
| `asellam/HisnElMuslim` | A second transcription of Hisn al-Muslim that keeps the author's footnotes. Used by the audit to compare references, counts and wording. | MIT, copyright 2021 Abdellah Sellam | Committed in `content-sources/hisn-footnotes/` with its licence file. Not shipped in the app. The MIT grant covers the transcription work, it cannot grant rights in the book itself, so the open item above applies here too. |
| `AhmedBaset/hadith-json` | Musnad Ahmad (partial), Muwatta Malik, Sunan ad-Darimi, al-Adab al-Mufrad, Riyad as-Salihin, Mishkat al-Masabih, Bulugh al-Maram. Used only to see whether hidden wordings can be located. | No licence file. The data is scraped from sunnah.com. | Kept in the uncommitted cache only. Nothing from it is committed or shipped. Without a licence it cannot be redistributed, and it should not become a build dependency. |
| sunnah.com, dorar.net | Would be the natural second sources | Both refuse automated requests | Not used. |

## Sources that would be needed to publish more entries

The author's footnotes for the 71 hidden entries cite these works outside the six books. No openly licensed, machine-readable edition was found for any of them.

| Work | Hidden entries citing it | What was found |
|---|---|---|
| Musnad Ahmad | 11 | One dataset with 1,374 narrations out of roughly 27,000, no licence, no gradings |
| Amal al-Yawm wal-Layla by Ibn as-Sunni | 10 | Nothing |
| al-Mustadrak by al-Hakim | 7 | Nothing |
| Sahih Ibn Hibban | 3 | Nothing |
| al-Adab al-Mufrad | cited by several footnotes | Present in the unlicensed dataset, no gradings |
| at-Tabarani, al-Bayhaqi, Abd ar-Razzaq, al-Baghawi, Muwatta, ad-Darimi | 1 each | Muwatta and ad-Darimi are in the unlicensed dataset, no gradings |

## What the repository contains

Committed: the Tanzil files with their notice, the MIT-licensed footnoted transcription with its licence, and the curated dataset `content/dataset`. Not committed: the raw hisnmuslim.com download, the tafsir file, and both hadith caches. The curated dataset necessarily carries Hisn al-Muslim wording and tafsir excerpts, so publishing the repository raises the same two open questions as publishing the app.

## Open items before launch

1. Written permission, or a clear published licence, for the text of Hisn al-Muslim.
2. The redistribution terms of التفسير الميسر.
3. A decision on whether the project itself should carry a licence file. None exists yet.
