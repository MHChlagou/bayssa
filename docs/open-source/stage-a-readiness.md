# Stage A release-readiness report

Prepared on 2026-11-22. Stage A is the public build that carries only content with documented redistribution rights: supplications from the Quran, and the tasbih as a plain counter.

Read this together with the product decision you sent the same day: Nafissa is a duas and adhkar app, not a Quran reader. Section 8 says what that means for Stage A.

## Update, later the same day

After this report was written you set the product focus and approved several changes. The rehearsal export was rebuilt and re-verified. What changed:

- The export no longer contains the complete Quran text. It carries an extract of the 63 ayahs in use (the 62 that hold the supplications, and the basmala), with Tanzil's notice at the top. No exported or built file contains more than those 63 ayahs.
- Tafsir explanations were removed from the product, so there are none to exclude.
- The dedication band is on every screen, and the dedication card is in settings.
- The export is now 134 files and about 3 MB.
- The scan searches for 891 restricted texts and finds none, in the source and in the build.
- In the export: 66 unit tests pass, 49 smoke checks pass in three engines with 2 skipped by design, and Lighthouse is 100 on all four categories on mobile.
- The origin of the hadith reference data is now marked as not established. This does not affect Stage A, which contains no hadith.

The numbers in sections 3 to 5 below are from the first rehearsal. `stage-a-inventory.md` and `stage-a-contents.md` were regenerated and are current.

You have also said that Nafissa is a duas and adhkar app and must not look like a Quran reader. Stage A contains only the Quranic category, so whether to publish it in this form remains your decision.

## Verdict

Technically, Stage A is ready: a rehearsal export was built, tested and scanned from nothing but its own files, and passed every check.

It is not ready to publish. Four things block it, in section 8: no code licence is in force because the copyright holder is not settled, several documents in the export still describe the full application, the content has had no review by anyone qualified, and a public app containing only Quran passages may not be what you want Nafissa to look like.

Nothing was published. No repository was created, nothing was pushed, and the rehearsal export is a plain directory in the session scratch folder with no git history.

## 1. Exact contents of the 47-entry public build

The full list, with the Arabic text of every entry, is in `stage-a-contents.md`. It is generated from the dataset inside the export.

| Measure | Value |
|---|---|
| Entries | 47, all Quran passages |
| Collections | 5: المغفرة والرحمة (10), الهداية والثبات (10), الأهل والذرية (8), العلم والتيسير والشكر (7), النجاة والحفظ (12) |
| Ayahs touched | 62, from 25 surahs |
| Entries that are an excerpt of an ayah | 41. The supplication is cut from inside the ayah, with no word altered |
| Entries that are whole ayahs | 6 |
| Words of Quran text | 636, under 1% of the Quran |
| Hadith entries | 0 |
| Explanations (tafsir) | 0 |
| Tasbih presets | 0. The tasbih is a plain counter, as you decided |
| Source of every entry | `tanzil-uthmani`, marked `cleared` |
| Scholarly review | `not-reviewed` for all 47 |

What the app offers in this build: home, the duas screen with the five collections, a reader with repetition counter, tasbih counter, favorites, search, settings. The adhkar screen says the section is not available in this build.

Two points for your judgment:

- Which ayahs count as supplications, where each excerpt begins and ends, and the five thematic groups were chosen by the engineer. For example, 40:7-9 is the supplication of the angels for the believers, and 21:87 starts at لا إله إلا أنت. Nobody qualified has checked these choices. `stage-a-contents.md` is laid out so they can be read one by one.
- The repetition counter appears on Quranic entries with a count of one, as a "done" mark.

## 2. Tanzil licensing and attribution compliance

Tanzil's terms, from the notice in its text file and its licence page: Creative Commons Attribution 3.0. Verbatim copies only. The text may be used in any website or application if the source is clearly indicated with a link to tanzil.net. The notice must be included in verbatim copies and reproduced appropriately in files derived from or containing a substantial portion of the text.

| Requirement | Status | Evidence |
|---|---|---|
| Text unchanged | Met | Every build compares each passage with the Tanzil file and fails on any difference. The exported Tanzil file is byte-identical to the downloaded one. |
| Notice kept in copies | Met | The copyright and licence lines are present in all three exported Tanzil files. |
| Source clearly indicated | Met | Sources screen in the app, both READMEs, `THIRD_PARTY_CONTENT.md`, and a new `content/README.md` that carries the notice beside the dataset. |
| Link to tanzil.net | Met | The app's sources screen has a link to tanzil.net. A test checks it. |
| Notice in derived files | Met as far as it applies | The dataset holds under 1% of the text, which is not a substantial portion. The notice is reproduced in `content/README.md` all the same. |
| Not covered by the code licence | Met in structure | The content notice and `THIRD_PARTY_CONTENT.md` say so. The code licence itself is not active yet. |

One interpretation to be aware of: 41 entries are excerpts from inside an ayah. Tanzil's terms speak of verbatim copies and of not changing the text. An excerpt alters no word, and quoting part of an ayah is ordinary practice, so I read it as compliant. It is my reading, not Tanzil's statement. Asking Tanzil would settle it.

The export also contains the two complete Tanzil text files (2.1 MB) as the reference the build checks against. They are not part of the app. See section 8 on whether you want the full text in the repository at all.

## 3. Complete public-export file inventory

The complete list of 131 files, with size and checksum, is in `stage-a-inventory.md`.

| Area | Files |
|---|---|
| Application source (`src/`) | 57 |
| Public assets: icons, launch images, link preview (`public/`) | 28 |
| Root: configuration, READMEs, contribution guide, content notice | 13 |
| Documentation: six screenshots, social preview, licensing report (`docs/`) | 8 |
| Scripts (`scripts/`) | 8 |
| Content sources: curation, source registry, sources README, three Tanzil files | 6 |
| Dataset and its notice, generated in the export (`content/`) | 5 |
| GitHub: workflow and issue forms | 4 |
| Smoke tests | 1 |
| Icon artwork (`assets/`) | 1 |
| Total | 131 |

Not exported: the private dataset, the footnoted transcription of the book, every audit report that quotes source text, all of `docs/open-source/`, the full end-to-end suite, the audit and tafsir comparison scripts, the download script and `todo.md`.

How the export is made: `scripts/export-public.ts` copies only files that git tracks and that its allow-list names, adjusts five npm scripts, and regenerates the dataset inside the export. It refuses to run on uncommitted changes unless told it is a rehearsal. This rehearsal used that flag, because the export script and the fixes found while testing it are not committed yet.

## 4. Restricted content is absent

| Where | Check | Result |
|---|---|---|
| Export source, 96 text files | Search for 940 restricted texts: every supplication, note and placement note from Hisn al-Muslim in the private dataset, every tafsir explanation, and every item and footnote of the full transcription of the book | None found |
| Export build output, 23 files | The same search | None found |
| Control | The same search over the private dataset and reports | Finds them, as it must. The scan is not passing by being blind |
| Dataset inside the export | Schema and scope | 47 entries, all `quran`, one source, scope `cleared` |
| Git history | The export directory has no `.git` | Clean by construction |

The scan earned its place: on its first run it flagged two things in the export's source. Both were false positives (the scan matching its own search pattern, and two explanatory notes written for this project being treated as the book's text), and both are fixed.

Limits of this check, stated plainly:

- Git history is clean because there is none. I did not create a repository, so a first commit made from this directory has not been demonstrated. The private history does contain restricted content and must never be pushed to the public repository.
- 28 restricted texts are shorter than 12 characters (a two-word dhikr, for instance) and are not searched for, because such phrases occur in the Quran and in ordinary Arabic.
- The search is for exact text. It would not catch a paraphrase or a re-typed phrase. Three places hold a few words of well-known supplications that were typed, not copied from the book: test data in the search tests, unvocalized phrases in `curation.ts` used to locate tasbih presets, and interface copy that names the book.
- `curation.ts` lists which chapter numbers of Hisn al-Muslim feed which collection. It contains no text from the book, but it does reflect part of the book's arrangement. I left it in the export and flag it for your decision.
- Images are not scanned. The screenshots were taken from the full application.

## 5. Independent build instructions

Verified in the rehearsal export, in a directory that contained no private file:

```
npm ci
npm run content:validate   # dataset schema, and Quran text against the Tanzil file
npm run lint
npm run typecheck
npm test                   # 62 unit tests
npm run build              # writes dist/
npm run check:public       # confirms the bundle's scope
npx playwright install chromium firefox webkit
npm run test:e2e           # 46 smoke checks pass, 2 skipped by design
```

Requirements: Node 24 or later, and network access for `npm ci` and the browser download only. No private dataset, no restricted download, no source outside the repository.

The dataset can be rebuilt from the repository's own files with `npm run content:import`. In the rehearsal the rebuilt files were identical to the exported ones. One caveat: each entry carries the date it was checked, so a rebuild on another day differs in that date and in nothing else.

Lighthouse on the rehearsal build, lab conditions: 100 for performance, accessibility, best practices and SEO, on mobile (two runs) and desktop. LCP 0.8 s on mobile, no layout shift. A shift of 0.09 seen in the first run came from the static shell reserving space for cards Stage A does not have, and is fixed.

## 6. PWA installation and offline validation

Automated, on the rehearsal build:

| Check | Engines | Result |
|---|---|---|
| Manifest fields, icons reachable, 20 iOS launch images declared, licence file present | Chromium, Firefox, WebKit | Pass |
| Chrome's installability report | Chromium | No errors |
| Works with the network off after the first visit, including a deep link | Chromium, Firefox, WebKit | Pass |
| No third-party request | Chromium, Firefox, WebKit | Pass |
| Starts with no console error or warning | Chromium, Firefox, WebKit | Pass |
| Tasbih count and favorites survive a reload | Chromium, Firefox, WebKit | Pass |
| Accessibility, six screens | Chromium, Firefox, WebKit | No violation |

Not done: installation on a real phone, a real offline start from a home-screen icon, and the service worker update flow on the Stage A build. The update flow is tested on the full build in three engines, and the code is the same.

## 7. GitHub Pages deployment instructions

For the day you decide to publish. Nothing here has been done.

1. Make the release export from a committed state: `node scripts/export-public.ts <empty directory>`. Run the commands of section 5 inside it.
2. In that directory only: `git init -b main`, add everything, one commit.
3. Add `github.com/MHChlagou/nafissa` as the remote of that directory and push. Never add it as a remote of the private repository.
4. On GitHub, Settings, Pages: set the source to "GitHub Actions".
5. Settings, Secrets and variables, Actions, Variables: add `DEPLOY_PAGES` with the value `true`.
6. Run the workflow from the Actions tab, or push again. It verifies, builds and deploys.
7. The site appears at `https://mhchlagou.github.io/nafissa/`. The path `/nafissa/` is already set in the build.
8. Then follow section 8 of `docs/pre-release/launch-checklist.md` for post-deployment checks.

The workflow has never run on GitHub. Expect to fix something on the first run.

## 8. Remaining blockers

Legal:

1. No code licence is in force. You approved Apache-2.0 but asked that the copyright holder not be recorded until ownership is clarified. A public repository without a licence is not open source: by default nobody may reuse it. This blocks an open-source release, though not a public one.
2. No qualified review of the content: the selection, the excerpt boundaries and the grouping in section 1.
3. The excerpt interpretation of Tanzil's terms in section 2, which is low risk and could be settled by asking Tanzil.
4. Your decision on `curation.ts` in section 4.

Documents in the export that describe the full application and must be rewritten for Stage A before publishing: `README.md`, `README.ar.md`, `THIRD_PARTY_CONTENT.md`, `content-sources/README.md`, `CONTRIBUTING.md` in places, and the six screenshots. As exported today they would promise adhkar and prophetic duas that the public build does not contain.

Technical:

1. The export script, the scan fixes and the Stage A layout fix are uncommitted. A release export needs them committed.
2. The GitHub workflow and its deployment gate have never run.
3. No real-device test.
4. The public repository would carry 46 smoke checks, not the 270 of the private suite.

Product direction, new today:

1. You have said Nafissa must not be a Quran reader, and that supplications from the Quran are one category among duas and adhkar. Stage A contains only that one category. It shows them as individual supplications with references, which matches what you described, but a visitor would see an app made entirely of Quran passages. Whether Stage A should be published at all in that form is now your call.
2. The export includes the complete Quran text as reference files. The app does not show it, but if "no full Quran text" should hold for the repository too, the reference can be reduced to the 62 ayahs in use.
3. The tribute banner is not in this build.

These are taken up in `docs/product/nafissa-identity-and-focus-plan.md`.
