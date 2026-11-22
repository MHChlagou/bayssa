# Contributing

Thank you for your interest in Bayssa. Contributions are welcome, within a few rules that protect the accuracy of the content.

نرحب بالمساهمات، مع قواعد قليلة تحفظ دقة المحتوى. يمكنك الكتابة بالعربية أو بالإنجليزية.

## Rules for religious content

1. Never type, paste or generate supplication or Quran text. Every recited word reaches the app from a reference source through `scripts/import-content.ts`. This applies to tests as well: expected Quran text is read from the Tanzil file.
2. Never edit `content/dataset/` by hand. It is produced by the import script. Change `content-sources/curation.ts` and run the import.
3. Do not relax a verification rule to make an entry appear. An entry that cannot be tied to a source stays hidden.
4. Entries held from production (`hisnHeldForReview`) return only by a decision of the project owner.
5. To report a mistake in the content, open a "Content correction" issue and name your source. A correction is checked against the source before anything changes.
6. Nobody on this project certifies content. Mechanical checks are described as mechanical, and no text or message may say the content is scholar-approved.

## Getting started

Node 24 or later.

```
npm install
npm run dev
```

Before opening a pull request:

```
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

If you changed anything under `content-sources/`, also run `npm run content:fetch`, `npm run content:import` and `npm run content:audit`, and include the regenerated reports.

## Code

- TypeScript in strict mode. No `any`, no non-null assertions.
- Domain logic in `src/domain/` stays free of React and of storage.
- Data read from `localStorage` is validated before use.
- Interface copy lives in `src/i18n/ar.ts`. Layout uses logical properties so another language can be added later.
- Keep changes small and focused, with tests for new behaviour.
- No analytics, tracking, accounts or third-party requests.

## Commits

`type(scope): message`, with type one of feat, fix, refactor, test, docs, chore. Subject under 72 characters.

## Licensing of contributions

The licensing of the code and of the third-party content is described in `docs/pre-release/licensing.md` and `THIRD_PARTY_CONTENT.md`. Do not add content from a source whose redistribution terms you cannot show.
