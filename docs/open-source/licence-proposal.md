# Apache-2.0 LICENSE and NOTICE proposal

Prepared on 2026-11-22 for review. The two files are in `docs/open-source/proposed/` and are not active: the repository root has no `LICENSE`, and both READMEs still say no licence has been granted.

## The files

| File | Content | Check made |
|---|---|---|
| `proposed/LICENSE` | The Apache License 2.0, downloaded from https://www.apache.org/licenses/LICENSE-2.0.txt | Unmodified: 11,358 bytes, ends with "END OF TERMS AND CONDITIONS" and the standard appendix. The licence text must never be edited. |
| `proposed/NOTICE` | Project copyright line, what the licence does not cover, and third-party attributions | Copyright lines copied from the licence files of the installed packages. See below. |

## Copyright attribution

"Copyright 2026 Bayssa contributors". You approved "Copyright 2026 Muslim Daily contributors" before the app was renamed. I carried the rename into the line. Confirm this is what you want.

Two things to know about that wording:

- "Contributors" names no legal person. That is common in open-source projects and is fine for a licence grant. If you ever need to enforce the licence or re-license, the rights sit with whoever actually wrote each part, which today is you. Keeping the git history is what proves authorship.
- All code so far was produced in this working session at your direction. The attribution names the project, not a tool, in line with your rule against AI attribution. Whether AI-assisted code is protected by copyright varies by country and is unsettled. It does not prevent you from publishing under Apache-2.0, but it could limit how far the licence can be enforced. This is a legal question I cannot settle.

## Third-party notices checked

Each line was read from the package's own licence file in `node_modules`.

| Component | Version | Licence | Copyright line in its licence file |
|---|---|---|---|
| react, react-dom, scheduler | 19.3.1, 0.28.0 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. |
| react-router | 8.5.2 | MIT | Copyright (c) React Training LLC 2015-2019, Copyright (c) Remix Software Inc. 2020-2021 (further lines follow in the file) |
| motion, motion-dom, motion-utils | 14.14.0 | MIT | Copyright (c) 2024 Motion B.V. |
| framer-motion | 14.14.0 | MIT | Copyright (c) 2018 Framer B.V. |
| lucide-react | 1.77.0 | ISC | Copyright (c) 2026 Lucide Icons and Contributors |
| workbox-window | 7.4.1 | MIT | Copyright 2018 Google LLC |
| Amiri (via @fontsource/amiri) | 5.3.0 | OFL-1.1 | Copyright 2010-2022 The Amiri Project Authors |
| Readex Pro (via @fontsource-variable/readex-pro) | 5.3.0 | OFL-1.1 | Copyright 2019 The Readex Pro Project Authors |

All of these are compatible with shipping inside an Apache-2.0 project.

## Licence texts in the built site (implemented)

The deployed site redistributes the two fonts and the minified libraries, and their licences ask that the licence text travel with them. The build now writes `dist/licenses.txt` with the full licence text of each of the 12 bundled packages, read from the installed packages. The build fails if it bundles a package that is not on the list, so the file cannot fall out of date silently. The settings screen links to it, it is cached for offline use, and a test checks it in every browser profile.

The file opens by saying that it does not concern the religious content, which is not software and is not covered by any licence in it.

## Keeping content out of the code licence

A `NOTICE` file informs, but the clearest signal is structural. Proposed when the licence is activated:

1. `LICENSE` and `NOTICE` at the root, as proposed.
2. `THIRD_PARTY_CONTENT.md` at the root, updated from the matrix in `third-party-content-matrix.md`.
3. A short `README.md` inside `content/` and inside `content-sources/` stating that the directory is third-party content, is not under Apache-2.0, and listing each source's terms.
4. The licence section of both READMEs rewritten to say: code under Apache-2.0, content excluded, with links to the three files above.
5. The `license` field in `package.json` set to `Apache-2.0`, which describes the package's code.

## What I recommend you decide

- Approve the two proposed files as they are, or give corrections.
- Activation should wait until the content questions are settled for whichever repository is being published, so the `NOTICE` can state real terms in place of its two bracketed placeholders.
