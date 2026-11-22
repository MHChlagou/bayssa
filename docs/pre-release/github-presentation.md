# GitHub presentation

Prepared on 2026-11-22. Nothing here has been applied: no repository exists yet.

## Repository description

English (fits GitHub's 350-character limit):

> Nafissa: an Arabic, offline-first PWA for daily adhkar and duas with a tasbih counter. Every supplication is shown with its source. No accounts, no tracking.

Arabic alternative:

> Nafissa: تطبيق ويب عربي للأذكار والأدعية اليومية مع مسبحة إلكترونية. يعمل دون اتصال، بلا حسابات ولا تتبّع، مع ذكر مصدر كل دعاء.

Website field: the GitHub Pages address once deployed.

## Topics

`islam` `muslim` `quran` `dua` `adhkar` `azkar` `dhikr` `tasbih` `hisn-al-muslim` `arabic` `rtl` `pwa` `offline-first` `react` `typescript` `vite` `tailwindcss` `github-pages`

GitHub allows up to 20 topics. These are 18.

## Files prepared

| Item | File |
|---|---|
| English README | `README.md` |
| Arabic README | `README.ar.md` |
| Screenshots, phone and desktop, light and dark | `docs/screenshots/` (6 images, captured from the production build) |
| Social preview, 1280 x 640 | `docs/social-preview.png`. Upload it by hand under Settings, General, Social preview. GitHub does not read it from the repository. |
| Link preview used by the deployed site | `public/og-image.png`, already wired into the page |
| Contribution guidelines | `CONTRIBUTING.md` |
| Issue forms | `.github/ISSUE_TEMPLATE/bug_report.yml`, `content_correction.yml`, with blank issues turned off |
| Third-party content notice | `THIRD_PARTY_CONTENT.md` |

## Settings to apply when the repository is created

- Pages: source "GitHub Actions".
- Create labels `bug` and `content`, which the issue forms use.
- Turn on private vulnerability reporting.
- Protect `main`: require the workflow to pass before merging.
- Leave Discussions off until there is someone to answer them.

## Not prepared, and why

- `LICENSE`: the licence and the copyright holder's name are your decision. The recommendation is in `licensing.md`.
- `SECURITY.md` and a code of conduct: not requested. Both are short to add.
- Badges in the README: they would point at a workflow that has never run.
