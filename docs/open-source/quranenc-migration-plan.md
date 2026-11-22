# التفسير الميسر: migration plan to the QuranEnc.com copy

Withdrawn on 2026-11-22: tafsir explanations were removed from the product, so no migration will take place. Kept as the record of the investigation.

Prepared on 2026-11-22. Nothing in the dataset or the app has been changed. This plan needs your approval of the exact change before any step that touches content.

## 1. Licensing evidence

Source page: https://quranenc.com/ar/browse/arabic_moyassar , titled "اللغة العربية · التفسير الميسر", retrieved 2026-11-22. The developer page https://quranenc.com/en/home/api carries the same terms in English.

Terms as published, Arabic:

> يتاح تنزيل محتوى الترجمات وإعادة نشره، بالشروط والضوابط التالية: 1. عدم التعديل أو الإضافة أو الحذف على المحتوى. 2. الإشارة بوضوح للناشر وللمصدر (QuranEnc.com). 3. ذكر رقم الإصدار عند إعادة نشر الترجمة. 4. إبقاء معلومات نسخة الترجمة الموجودة داخل المستند. 5. إفادة المصدر (QuranEnc.com) بأي ملاحظة على الترجمة. 6. تطوير الترجمات وفق النسخ الجديدة الصادرة من المصدر (QuranEnc.com). 7. عدم تضمين إعلانات لا تليق بترجمات معاني القرآن الكريم عند العرض.

English, from the developer page:

> Contents of the translations can be downloaded and re-published, with the following terms and conditions: 1. No modification, addition, or deletion of the content. 2. Clearly referring to the publisher and the source (QuranEnc.com). 3. Mentioning the version number when re-publishing the translation. 4. Keeping the transcript information inside the document. 5. Notifying the source (QuranEnc.com) of any note on the translation. 6. Updating the translation according to the latest version issued from the source (QuranEnc.com). 7. Inappropriate advertisements must not be included when displaying translations of the meanings of the Noble Quran.

The text is served per ayah by the public API, for example `https://quranenc.com/api/v1/translation/aya/arabic_moyassar/2/255`, which returns `id`, `sura`, `aya`, `arabic_text`, `translation` and `footnotes`.

## 2. What could and could not be verified

| Point | Finding |
|---|---|
| Redistribution | Verified. The terms say the content may be downloaded and re-published, on seven conditions. Nothing limits this to non-commercial use, apart from the advertising condition. |
| Version number | Not identified. The API listings (`/api/v1/translations/list` and `/api/translations/list`, 76 entries each) carry a version for every translation they list, but the Arabic tafsir is not in either list. Its browse page shows no version in its HTML, and its download page answered 503. Condition 3 cannot be met until the version is known. |
| Publisher named by QuranEnc | Not verified. The page title names the work. I did not find the publisher line in the page's HTML. The work itself is published by the King Fahd Complex. |
| Whether the terms, written for "translations", apply to this Arabic tafsir | Likely, since the terms appear on its own page, but it is not stated in so many words. |
| Whether showing single ayahs counts as "deletion" | Open. See section 4. |

Because of the first two open rows, the plan starts with a question to QuranEnc, not with a download.

## 3. Attribution required

From conditions 2, 3 and 4, wherever the text is re-published:

- name the publisher and QuranEnc.com as the source;
- state the version number;
- keep the version information with the text.

Proposed wording on each card that shows a meaning, replacing today's line: "التفسير الميسر · [الناشر كما يذكره المصدر] · عن موقع QuranEnc.com، الإصدار [رقم]". The same line goes in the app's sources screen, `THIRD_PARTY_CONTENT.md`, `NOTICE` and both READMEs. The version is stored in the dataset beside each meaning, so it travels with the text.

## 4. Do the intended excerpts and presentation comply?

How the app uses the tafsir today, which the migration would keep:

- 49 of the 51 Quran entries carry a meaning, covering 64 ayahs.
- For each ayah the whole explanation is shown, unedited, behind a "المعنى" disclosure. Nothing is trimmed, merged or reworded.
- 41 of those entries display only part of an ayah (the supplication inside it) while the meaning shown is the explanation of the whole ayah.
- No advertising anywhere in the app.

| Condition | Assessment |
|---|---|
| 1. No modification, addition or deletion | Each ayah's text would be stored and shown exactly as served. The open question is selection: the app takes 64 ayahs out of 6,236. QuranEnc's own API serves single ayahs, which suggests per-ayah use is intended, but that is my reading. Confirm it with QuranEnc. |
| 2. Publisher and source | Met by the attribution above. |
| 3. Version number | Blocked until the version is known. |
| 4. Version information kept with the text | Met by storing it in the dataset and the bundle. |
| 5. Report remarks to QuranEnc | A process point. Add it to `CONTRIBUTING.md`: content corrections about the tafsir are forwarded, never applied locally. |
| 6. Update to new versions | A maintenance duty. Add a release-checklist line to compare the stored version with the current one. |
| 7. No unsuitable advertising | Met. The app has none. |

Presentation note for your judgment: a card that shows part of an ayah with the explanation of the whole ayah is faithful to the source, but a reader may expect the explanation of the excerpt only. The disclosure could say "معنى الآية كاملة". That is interface copy, not tafsir text.

## 5. How the text differs from the copy in use

The full comparison is in `quranenc-comparison.md`, generated by `node scripts/compare-tafsir.ts`. It quotes both copies for all 64 ayahs.

| Comparison | Ayahs |
|---|---|
| Identical character for character | 9 |
| Same words, different vocalization or punctuation | 38 |
| Different wording | 17 |

The 17 are not all trivial. They fall into four kinds:

- The honorific after the Prophet's name is present in the current copy and absent in QuranEnc's: 2:201, 2:285, 2:286, 3:16, 3:53, 3:193.
- Spelling or word form: 2:255 (السماوات and السموات), 60:5 (تسلط and تسليط), 25:74 (يقتدى and يقتدي, with one added word), and 23:97 and 23:98, where the listed word looks the same in both copies and differs in a character I could not tell apart by eye.
- A word added in QuranEnc's copy: 23:29, 29:30.
- Rewording that changes the phrasing of the explanation: 2:128, 46:15, 59:10 and 66:8.

So the QuranEnc copy is a different revision of the work, and the migration replaces explanation text that readers see. The last group in particular should be read by you before approval.

## 6. Migration steps

Steps 1 to 3 change nothing in the repository.

1. Write to QuranEnc through its contact page. The message is drafted in `quranenc-message.md`, in Arabic and English, for you to send. It asks for the version number of "اللغة العربية · التفسير الميسر", the publisher line to use, confirmation that the published terms cover it, and confirmation that showing individual ayahs in full in a free app and a public repository is within condition 1.
2. Done: the full side-by-side comparison is in `quranenc-comparison.md`.
3. You approve the exact change: the 64 texts, the attribution wording and the disclosure label.

After approval:

4. `scripts/fetch-sources.ts`: download the needed ayahs from the QuranEnc API into `content-sources/quran/quranenc-arabic-moyassar.json`, with the version and retrieval date in the file. The terms allow this file to be committed.
5. `src/content/schema.ts`: `meaning` gains `version`. The build schema requires it.
6. `scripts/import-content.ts`: read meanings from the new file. Remove the Tanzil tafsir input.
7. `scripts/build-content.ts`: fail the build if a meaning differs from the source file by one character, the same guarantee the Quran text has.
8. Attribution: card line, sources screen, `THIRD_PARTY_CONTENT.md`, `NOTICE`, READMEs.
9. Remove `content-sources/quran/tanzil-ar-muyassar.txt` from `.gitignore` and from the fetch script.
10. Re-run import, validation, unit and end-to-end tests, and the audit.
11. Record the decision and the version in the audit report.

Rollback is a revert of one commit. The current text stays in the private history.

## 7. Fallbacks

- If QuranEnc does not answer, or the version cannot be established: keep the tafsir out of the public repository and out of the public build, or remove the optional meaning disclosure.
- If the answer limits use to whole surahs or whole documents: the same.

## 8. Decision needed

Both are ready for you: the message to send (`quranenc-message.md`) and the comparison to read (`quranenc-comparison.md`). Nothing else moves until QuranEnc has answered and you have approved the exact change.
