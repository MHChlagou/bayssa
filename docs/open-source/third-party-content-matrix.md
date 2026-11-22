# Third-party content licensing matrix

Updated on 2026-11-22 after your decisions. This replaces the table in `THIRD_PARTY_CONTENT.md` once approved. Evidence for each row is in `docs/pre-release/licensing.md` and `quranenc-migration-plan.md`.

## Where this lives in the code

The redistribution status of each source is recorded once, in `content-sources/sources.ts`. Every entry names its sources, and the public build publishes only what that file marks `cleared`. This document explains the reasoning. The file is what the build obeys. `docs/pre-release/provenance.md` lists every published entry against it.

## Matrix

| Material | Rights holder | Terms found | Commercial use | Modification | Attribution | Public repository | Status | Decision |
|---|---|---|---|---|---|---|---|---|
| Application code, artwork, documentation | Nafissa contributors | Apache-2.0 (approved, not yet activated) | Yes | Yes | Keep notices | Yes | Clear | Apache-2.0 |
| Quran text, Uthmani and plain, and surah names | Tanzil Project | Creative Commons Attribution 3.0 plus Tanzil's terms | Not restricted for the Quran text | No: verbatim only | Required, with a link to tanzil.net and the notice kept in the files | Yes | Clear, with one gap: the in-app credit is text, not a link | Keep |
| Supplication wording, notes and arrangement from حصن المسلم | Sa'id ibn Ali ibn Wahf al-Qahtani and his heirs | Rights reserved. Free distribution of the complete, unaltered book with the notice "وقف لله تعالى" | No | No | By keeping the work intact, plus the waqf notice | Not addressed | Not established for a selection | Request written permission. Private until granted. |
| Full transcription of حصن المسلم with footnotes (`content-sources/hisn-footnotes/`) | Same author. Transcription by Abdellah Sellam, MIT for the transcription only | Same as above for the text | No | No | As above | Not addressed | Not established | Keep private. Exclude from any public history. |
| التفسير الميسر, copy from Tanzil (removed from the product on 2026-11-22) | King Fahd Complex | All rights reserved. Via Tanzil: non-commercial use, other uses need the publisher | Needs permission | Not addressed | Expected | Not granted | Not established | Replace, see next row |
| التفسير الميسر, copy from QuranEnc.com (not pursued: explanations removed) | King Fahd Complex, distributed by QuranEnc.com | May be downloaded and re-published on seven conditions | Not restricted, apart from no unsuitable advertising | No | Required: publisher, QuranEnc.com and version number | Yes, on the conditions | Usable in principle. Version number not yet identified, and per-ayah use to be confirmed | Investigate, then migrate after approval |
| Hadith collection names, numbers, grading labels | Taken from `fawazahmed0/hadith-api`, which names no source for its edition | The Unlicense on the repository only | Unknown | Unknown | Not required by the repository | Not established | Not established since 2026-11-22. See `docs/product/hadith-source-comparison.md` | Clarify the origin, or use a source with stated terms |
| Hadith text of the six books (`content-sources/cache/hadith/`) | Classical texts. Dataset under the Unlicense | The Unlicense | Yes | Yes | Not required | Not committed | Clear, used for checking only | Stays uncommitted (40 MB) |
| Extra collections (`content-sources/cache/extra/`) | Scraped from sunnah.com by `AhmedBaset/hadith-json` | No licence | Unknown | Unknown | Unknown | No | Not established | Never committed. Investigation only |
| Raw hisnmuslim.com download (`content-sources/hisn/`) | The author, through a third-party site | None stated | No | No | Unknown | No | Not established | Never committed |
| Amiri and Readex Pro | Their project authors | SIL Open Font License 1.1 | Yes, but not sold on their own | Yes, with renaming rules | Keep the licence with the fonts | Yes | Clear. Licence text not yet shipped in `dist/` | Add `dist/licenses.txt` |
| React, React Router, Motion, Lucide, Workbox | Their authors | MIT and ISC | Yes | Yes | Keep the notices | Yes | Clear. Notices not yet shipped in `dist/` | Add `dist/licenses.txt` |

## Where the unresolved material sits in the current private repository

| Path | What it holds | In a public repository? |
|---|---|---|
| `content/dataset/entries.json` | 231 records with Hisn al-Muslim wording and notes, 49 tafsir excerpts, 51 Quran entries | Only the Quran entries, until permissions arrive |
| `content/dataset/tasbih-presets.json` | 10 short dhikr phrases cut from Hisn al-Muslim items | Not until permission. They are a few words each, but they come from the same source |
| `content/dataset/collections.json` | Titles written for this project, and item lists that mirror parts of the book's chapters | Titles yes. Item lists follow the entries |
| `docs/pre-release/content-audit.md`, `source-coverage.md`, `footnote-review-list.md` | Quote every entry in full, and the author's footnotes | No |
| `content-sources/hisn-footnotes/` | The whole book | No |
| `src/domain/search/*.test.ts` | A few words of well-known supplications typed as test data | Yes. They are not taken from the book |
| Screenshots | Interface and Quran text | Yes |

## Still to do on this matrix

- Fill the Hisn al-Muslim row with the exact wording of the permission, if granted.
- Fill the QuranEnc row with the version number and publisher line.
- Done: the Tanzil credit in the sources screen is now a link to tanzil.net.
