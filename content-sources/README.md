# Content sources, licensing and verification

This folder holds the reference texts the content dataset is built from, and the editorial
choices applied to them. Nothing in the app is typed by hand: every recited word is cut from
one of the sources below by `scripts/import-content.ts`.

## Sources

| Content | Source | File | Terms |
|---|---|---|---|
| Quran text (Uthmani) | Tanzil Project, version 1.1, https://tanzil.net | `quran/tanzil-uthmani.txt` | Creative Commons Attribution 3.0. Verbatim copies only, changing the text is not allowed, and the copyright notice in the file must stay with it. The app credits Tanzil in its settings screen. |
| Quran text (simple, unvocalized) | Tanzil Project | `quran/tanzil-simple-clean.txt` | Same terms. Used only to build the search index and to cross-check quotations. Never displayed. |
| Surah names | Tanzil Project metadata | `quran/tanzil-quran-data.js` | Creative Commons Attribution 3.0. |
| Meaning of ayahs | التفسير الميسر, King Fahd Quran Complex, distributed by Tanzil (`ar.muyassar`) | `quran/tanzil-ar-muyassar.txt` | Distributed by Tanzil for non-commercial use with attribution. Confirm the terms on https://tanzil.net/trans/ before any commercial use. |
| Adhkar and supplications | حصن المسلم by Sa'id ibn Ali ibn Wahf al-Qahtani, as published by the hisnmuslim.com API | `hisn/` | The API publishes the book freely but states no licence. Confirm redistribution rights with the publisher before a public launch. |
| Hadith collections (wording, numbers, gradings) | `fawazahmed0/hadith-api` on GitHub, Arabic editions of the six books | `cache/hadith/` (not committed, about 40 MB) | Released into the public domain (Unlicense). |

| Hisn al-Muslim with the author's footnotes | `asellam/HisnElMuslim` on GitHub | `hisn-footnotes/` | MIT. A second transcription, used only by the audit to compare references, counts and wording. Not shipped. |
| Collections outside the six books | `AhmedBaset/hadith-json` on GitHub | `cache/extra/` (not committed) | No licence. Used only by the coverage investigation. Never committed or shipped. |

sunnah.com and dorar.net refuse automated requests, so they are not used.

## How an entry becomes "verified"

Quran entries are verified when their text equals the Tanzil Uthmani text of the referenced
ayahs character for character (or is a contiguous run of words of the ayah, marked as an
excerpt). `scripts/build-content.ts` repeats this check on every build and fails the build on
any difference.

Hadith entries are verified when all of the following hold:

1. The wording from Hisn al-Muslim is found in at least one of the six books: Sahih
   al-Bukhari, Sahih Muslim, Sunan Abi Dawud, Jami' at-Tirmidhi, Sunan an-Nasa'i, Sunan Ibn
   Majah. Texts are compared on their letters only (vocalization and punctuation ignored).
   The match is either exact or at least 90% of the words in order.
2. The matched narration has a citable number in the dataset.
3. The repetition count is stated in the book's own wording. The API's numeric field alone is
   not trusted: it disagrees with the text in five items.
4. The item's delimiters parse cleanly, so recited text and instructions are not confused.

Four fallbacks exist, and each is recorded in the entry's `verification.note`:

- Words the book puts in square brackets are additions from another narration. If the wording
  matches once they are set aside, the entry is verified and the app shows a note saying so.
- If the book joins several narrations, each part must be found on its own.
- For chapter 27, a morning wording may be matched through its evening form.
- `hisnReviewedMatches` in `curation.ts` lists items an editor compared by hand because the
  narration is phrased differently (one item today). The importer still requires 85% of the
  item's distinct words to occur in the named narration.

Production builds publish an entry only when it is verified and either sits in Bukhari or
Muslim, or carries a sahih or hasan grading attributed to a named scholar in the dataset
(al-Albani first, then Shu'ayb al-Arna'ut, then Zubair Ali Za'i). Gradings are never inferred.
Everything else stays in `content/dataset/` with status `needs-review` and its reason, and is
left out of the shipped bundle. Preview hidden entries locally with
`node scripts/build-content.ts --include-unverified`.

## Editorial holds

`hisnHeldForReview` in `curation.ts` lists items kept out of production by a decision of the project owner, whatever the matcher says. `hisnExcludedReferences` lists narrations that a person read and found to be about something else, so they are never offered as a reference again. Held records stay in `content/dataset` with their wording unchanged, and each decision is printed in `docs/pre-release/content-audit.md`.

## What is committed

The Tanzil Quran files, the footnoted transcription (MIT) and the curated dataset in `content/dataset` are in the repository. The raw hisnmuslim.com download (`hisn/`) and the tafsir file are not, because their redistribution terms are not confirmed: `npm run content:fetch` downloads them. The curated dataset still contains supplication text from Hisn al-Muslim and tafsir excerpts, since the app cannot be built without them, so the open licensing items apply to the repository as well as to the app.

## Limits

This is mechanical text matching, not a scholarly review. It does not check that the context
of a narration (when or why it is said) matches the chapter it appears under, and it relies on
the gradings recorded in a third-party dataset. A person with knowledge of hadith should
review the published dataset before a public launch.

## Audit

`npm run content:audit` writes `docs/pre-release/content-audit.md` (every published entry with its source, matching method, cross-checks and a recommended action) and `docs/pre-release/source-coverage.md` (every hidden entry with the source the author cites). The audit only reads. It found that wording-only matching can pick a narration about a different occasion, so a reference shown in the app is a candidate until a person confirms it.

## Updating content

```
npm run content:fetch     # download the sources (needs network)
npm run content:import    # rebuild content/dataset and print the verification report
npm run content:build     # validate and write the app bundle
npm run content:audit     # regenerate the audit reports
```
