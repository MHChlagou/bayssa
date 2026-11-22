# Public repository: clean-history plan

Prepared on 2026-11-22. Nothing here has been run. The current repository and its three commits are not touched by any step.

## Goal

A public repository whose every commit, from the first, contains only code and content with confirmed redistribution rights. The private repository keeps the full development history.

## Why not publish the existing history

Commit `0154e54` contains `content/dataset`, the audit reports that quote every entry, and the footnoted transcription of the whole book. Git keeps every version of every file, so deleting those files in a later commit would still publish them. Rewriting the history would change the commits you asked to preserve. A second repository with its own history avoids both.

## Two repositories

| | Private repository (today's) | Public repository (new) |
|---|---|---|
| History | Full, unchanged | Starts fresh with one commit |
| Content | Everything | Only what the matrix marks clear |
| Role | Where work happens | A published export |
| Remote name | `private` | `public` |

## What goes into the public tree

An allow-list, not a block-list: a file is published only if it is named. Anything new is private until someone adds it deliberately.

Included:

- `src/`, `scripts/`, `tests/`, `public/`, `assets/`, `index.html`, configuration files, `package.json`, `package-lock.json`, `.gitignore`, `.github/`
- `README.md`, `README.ar.md`, `CONTRIBUTING.md`, `THIRD_PARTY_CONTENT.md`, `LICENSE`, `NOTICE`
- `content-sources/README.md`, `content-sources/curation.ts`, `content-sources/quran/tanzil-uthmani.txt`, `tanzil-simple-clean.txt`, `tanzil-quran-data.js`
- `docs/screenshots/`, `docs/social-preview.png`
- `docs/pre-release/` reports that quote no source text: `licensing.md`, `performance.md`, `cross-browser.md`, `dependencies.md`, `launch-checklist.md`, `github-presentation.md`
- a public dataset, generated for the export (next section)

Excluded until rights are confirmed:

- `content/dataset/` as it stands
- `content-sources/hisn-footnotes/`
- `docs/pre-release/content-audit.md`, `source-coverage.md`, `footnote-review-list.md`
- `docs/open-source/` (working papers, including the permission request)
- `todo.md`

## The public dataset

The app needs a dataset to build. Three stages, depending on what has been cleared:

| Stage | Dataset in the public repository | What the public app shows |
|---|---|---|
| A. Before any permission | Quran entries only (Tanzil), without tafsir | The five Quranic collections, the tasbih without presets, favorites, search. No adhkar, no prophetic duas |
| B. After the QuranEnc migration | Stage A plus the tafsir meanings | The same, with meanings |
| C. After written permission for Hisn al-Muslim | The full published dataset, under the terms granted | The complete app |

Stage A needs code that tolerates empty sections: today the home screen and tests assume the morning and evening collections exist. That is a code change, not a content change, and it is listed below as work to approve.

Honest assessment: a stage A app is a Quranic duas reader with a tasbih. It demonstrates the code but is not the product. Publishing the code at stage A and the app at stage C is a reasonable reading of "controlled".

## Export procedure

One script, `scripts/export-public.sh`, to be written and reviewed before first use. It never runs inside the private working tree's git.

1. Start from a clean checkout of the private repository at a tagged commit.
2. Copy only the allow-listed paths into an empty directory outside the repository.
3. Generate the public dataset for the current stage into that directory.
4. Run the gates below. Stop on any failure.
5. In the export directory only: `git init`, one commit, for example `feat: initial public release`, with no reference to private commit hashes.
6. Show the file list and wait for your confirmation.
7. Only then, by your hand: create the public repository and push.

## Gates before every public push

Automated, and all must pass:

1. Text leak scan. Take every text and note segment of every hadith record in the private dataset, and the author's footnotes. None may appear anywhere in the export, including documentation and test files. This is the same check that proved the six held entries absent from the build.
2. Tafsir scan, until stage B: no tafsir meaning from the private dataset appears in the export.
3. Allow-list check: no file outside the list.
4. History check: the export repository has no commit from the private repository.
5. `LICENSE`, `NOTICE` and `THIRD_PARTY_CONTENT.md` present, and the `NOTICE` has no bracketed placeholder left for content that is included.
6. Secret and personal-data scan.
7. Install, lint, type check, unit tests, build and end-to-end tests pass on the export itself, from a fresh `npm ci`.
8. The built `dist/` passes the text leak scan too.

Manual: you read the file list and the diff against the previous export.

## Keeping the two in step afterwards

Recommended: the private repository stays the source of truth, and each public release is a new export added as one commit on top of the previous public commit. Public history is then one commit per release, which is less detailed than normal development history but cannot leak.

Contributions from outside arrive as pull requests on the public repository. They are reviewed there, then applied to the private repository by patch, and appear in the next export.

When stage C is reached and nothing private remains, the simpler option opens up: develop in the public repository directly and keep the private one as an archive.

## What is already in place

| Piece | Where | Status |
|---|---|---|
| Provenance on every entry, and one registry of sources with their redistribution status | `src/content/schema.ts`, `content-sources/sources.ts`, report in `docs/pre-release/provenance.md` | Done |
| Public content build that keeps only cleared material | `node scripts/build-content.ts --rights=cleared`, or `CONTENT_RIGHTS=cleared` | Done. Today it yields 47 Quran entries in 5 collections, with no explanations and no tasbih presets |
| Dataset regenerated from public inputs only | `node scripts/import-content.ts --quran-only` | Done. It needs the committed Tanzil files and `curation.ts`, no download, and produces the same 47 entries as the filter above |
| Public build with a leak scan | `npm run build:public` | Done. The scan looks for 360 restricted texts in the built files and found none |
| App tolerates sections with no content | Library, tasbih, home and settings screens | Done. The adhkar screen says the section is not available in this build, and the tasbih works as a plain counter |
| Smoke tests of the public build | `npm run test:public` | Done. 42 checks pass across Chromium, Firefox and WebKit profiles |
| Licence texts shipped with the site | `dist/licenses.txt` | Done |
| Deployment gate | `.github/workflows/ci.yml` | Done, not yet run on GitHub |

Stages A, B and C need no separate switch. The public build follows the registry: when a source's status changes to `cleared`, with its evidence, the next public build includes it.

## Work still needed, for your approval

| Item | Kind | Touches Islamic content |
|---|---|---|
| `scripts/export-public.sh` with the allow-list and the gates | New script | No |
| A test suite for the public repository. The main end-to-end suite assumes the full content, so the public repository would carry the smoke tests and the unit tests | Test organisation | No |
| Activate `LICENSE`, `NOTICE` and per-directory content notices | Files | No |
| Tasbih presets for the public build. The current presets are cut from Hisn al-Muslim items. Cutting the same short phrases from the Quran text would be a new selection of content | Content decision | Yes, needs your approval |

## The public repository that already exists

`github.com/MHChlagou/bayssa` is public and empty. It suits the role of the public repository in this plan. Nothing has been pushed to it and it has not been added as a remote. The first push to it must be the export described above, never the private history.

## Risks

- Human error: pushing the private history to the public remote. Mitigations: differently named remotes, a `pre-push` hook in the private repository that refuses any remote not named `private`, and the public push done only from the export directory.
- A leak through a file type the scan does not read, such as an image. Screenshots are taken from the stage build, so they show only what is cleared.
- Stage A may read as an unfinished product. The README for the public repository should say what is included and why.
