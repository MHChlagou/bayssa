# Candidate sources for hadith wording: comparison and licensing findings

Prepared on 2026-11-22 for your approval. Nothing has been migrated. No Arabic wording, reference or grading in the dataset was changed, and no new religious content was published. The datasets examined here sit in the uncommitted cache and are not part of the repository.

## Why this matters

Every supplication and dhikr in Nafissa currently takes its wording from حصن المسلم, whose redistribution for this use is not established. A public duas and adhkar app needs wording from a source that may be redistributed. This document compares the candidates. It does not propose a migration.

A caution that runs through the whole document: the words of a hadith are not anyone's property, but a particular edition is more than the words. Its vocalization, punctuation, numbering, section headings, gradings, explanations and the database as a compiled work can each carry rights of their own. A repository's licence file covers what its author had the right to license, and no more.

## Summary

| Candidate | Origin documented | Edition and version | Redistribution terms | Usable today |
|---|---|---|---|---|
| HadeethEnc.com, Arabic | Yes, by its publisher | Version 1.8.0, updated 2026-10-14, 3,582 hadiths | Explicit: may be downloaded and re-published on seven conditions | The only candidate with terms that clearly allow it |
| `fawazahmed0/hadith-api` | No | No edition stated. Last commit 2026-06-03 | The Unlicense on the repository. Rights in the underlying edition are not shown | Not established |
| `AhmedBaset/hadith-json` | Yes: scraped from sunnah.com | No version. Last push 2026-03-28 | No licence | No |
| sunnah.com | It is the publisher of its own edition | Not examined | Not retrieved: the site refuses automated requests | Unknown |
| `mhashim6/Open-Hadith-Data` | Not stated in its README | No version. Last push 2022-07-30 | GitHub reports no recognised licence | No |
| dorar.net | Publisher of its own encyclopedia | Not examined | Not retrieved: the site refuses automated requests | Unknown |

## 1. HadeethEnc.com (موسوعة الأحاديث النبوية)

Origin. A project that selects frequently cited authentic hadiths, explains them and translates them. Its site names its sources as "صحيح البخاري، صحيح مسلم، كتب السنن الأربعة، وغيرها من مصادر أهل السنة المعتمدة". It belongs to the same family of projects as QuranEnc.com and publishes under the same terms.

Edition and version. The Arabic download carries this header: "Translated Prophetic Hadiths, Language: العربية, Source: https://hadeethenc.com/ar, Last update: 2026-10-14 (v1.8.0)", with an address for checking updates and the line "PLEASE DON'T REMOVE THIS IMPORTANT INFORMATION!". 3,582 hadiths.

Redistribution terms, as published on its home page:

> يتاح تنزيل محتوى الترجمات وإعادة نشره، بالشروط والضوابط التالية: 1. عدم التعديل أو الإضافة أو الحذف على المحتوى. 2. الإشارة بوضوح للناشر وللمصدر (HadeethEnc.com). 3. ذكر رقم الإصدار عند إعادة نشر الترجمة. 4. إبقاء معلومات نسخة الترجمة الموجودة داخل المستند. 5. إفادة المصدر (HadeethEnc.com) بأي ملاحظة على الترجمة. 6. تطوير الترجمات وفق النسخ الجديدة الصادرة من المصدر (HadeethEnc.com). 7. عدم تضمين إعلانات لا تليق بمحتوى الأحاديث النبوية وترجماتها عند العرض.

The site says that downloading the files implies agreement to these terms.

Attribution required. The publisher and HadeethEnc.com, the version number, and the version information kept with the text.

What a record contains. The hadith with its narrator's introduction and the Prophet's words in quotation marks, fully vocalized. A grade, for example "صحيح", "حسن", "صحيح لغيره", sometimes with a note naming who graded it. A takhrij line, for example "متفق عليه" or "رواه أبو داود والترمذي وأحمد". A plain-language explanation, word meanings and benefits. A list of printed references with volume and page.

References. The takhrij names collections but usually gives no hadith number in the form the app shows today. The detailed reference field cites printed editions by volume and page.

Open questions about its terms, which only HadeethEnc can answer:

- The terms speak of "translations". Whether they cover the Arabic text and the gradings is implied by their place on the Arabic download, not stated.
- Condition 1 forbids modification, addition and deletion. Nafissa would show only the supplication inside a hadith, without the narrator's introduction and without the explanation. Whether cutting out the supplication counts as deletion is the same question as for QuranEnc, and it matters more here because the cut is inside a record, not between records.
- The terms do not mention commercial use.

## 2. `fawazahmed0/hadith-api`

Origin. Not documented. The README lists no source for the texts. Its own catalogue file gives every Arabic edition the author "Unknown" and an empty source field. The acknowledgements thank "all the open source projects and dawah/Islamic organizations" without naming any.

Evidence about where it comes from. I compared its Sunan Abi Dawud with the one in `hadith-json`, which states that it was scraped from sunnah.com. Matching records by number, 904 of 5,272 have identical text, character for character, and those 904 are the ones where the two numberings line up. Where the numbering agrees, the text is the same. That points to a common origin, most likely sunnah.com, though it does not prove it.

Edition and version. None stated. The repository is versioned only by its git history.

Redistribution terms. The repository carries the Unlicense, a public-domain dedication by the repository's author. That dedication can only cover what he was entitled to dedicate. If the text was taken from sunnah.com, the vocalized edition, its numbering and the compiled gradings would be sunnah.com's to license, and I could not retrieve sunnah.com's terms.

Attribution. None required by the Unlicense.

What a record contains. The full narration with its chain of narrators, vocalized. Two numbers per hadith. Gradings attributed to named scholars for the four Sunan (al-Albani, Shu'ayb al-Arna'ut, Zubair Ali Za'i and others), none for al-Bukhari and Muslim. No explanations.

Its role in Nafissa today. It is the source of every collection name, hadith number and grading the app shows. The registry had marked it "cleared" on the strength of the Unlicense. In light of this finding I have changed that status to "not established". Nothing in the public build depends on it, since the public build contains no hadith.

## 3. `AhmedBaset/hadith-json`

Origin: stated in its README as scraped from sunnah.com, 50,884 hadiths from 17 books. It notes that most of Musnad Ahmad is missing. No licence file, so no permission to redistribute. No gradings. Useful only for locating a wording, which is how the audit used it.

## 4. Sources I could not examine

- sunnah.com and dorar.net refuse automated requests, so I could not read their terms. Both are primary candidates for references and gradings, and both would need to be asked directly.
- `mhashim6/Open-Hadith-Data` describes nine books with and without diacritics, gives no source and has no recognised licence.

## 5. Differences in Arabic wording and vocalization

Measured against the wording Nafissa shows today. "Letters" means the consonants and long vowels. "Marks" means the vocalization.

### Coverage

Of the 231 hadith records in the dataset, 210 have four words or more and were tested.

| | Published (149 tested) | Hidden (61 tested) |
|---|---|---|
| Wording found in HadeethEnc, exactly | 74 | 1 |
| Found with 90% or more of the words in order | 23 | 5 |
| Not found | 52 | 55 |

`hadith-api` holds the wording of all 154 published entries by construction, since that is how they were verified: 120 exactly and 34 approximately.

So HadeethEnc covers about half of what is published today, and almost none of what is hidden.

### Vocalization, for wordings found exactly

| Compared with the current text | Words compared | Same letters | Same letters and marks | Entries identical in every mark |
|---|---|---|---|---|
| HadeethEnc | 913, in 75 entries | 913 (100%) | 498 (55%) | 8 of 75 |
| `hadith-api` | 1,544, in 115 entries | 1,528 (99%) | 1,370 (89%) | 42 of 115 |

What the differences look like, from the cases I read:

- HadeethEnc writes the name of Allah as اللهُ where the current text writes اللَّهُ, places a sukun where the current text leaves it out, and writes لَا where the current text has لاَ. These are conventions of vocalization, not different readings.
- `hadith-api` writes شَىْءٌ where the current text writes شَيْءٌ, and الأَرْضِ where the current text writes الْأَرْضِ.
- HadeethEnc punctuates more heavily, with commas inside phrases and quotation marks around the Prophet's words.

In both candidates the letters agree. A migration would change how nearly every entry is vocalized on screen without changing a word of it. For the 34 approximate entries a migration would also change words, to the narration's own.

### Annotations

| | Current text | HadeethEnc | `hadith-api` |
|---|---|---|---|
| The supplication on its own, ready to recite | Yes | No: inside a narration, in quotation marks | No: inside a narration with its chain |
| The author's notes: evening form, stated counts, bracketed additions | Yes | No | No |
| Occasion (morning, sleep, travel) | From the book's chapters | Sometimes in the narration, otherwise in the explanation | Sometimes in the narration |
| Grading | From `hadith-api` | Its own, per hadith | Attributed to named scholars, Sunan only |
| Hadith number as the app shows it | From `hadith-api` | Usually absent: volume and page instead | Yes |

The notes are what makes a list of supplications usable as daily adhkar: which wording is for the evening, how many times, on which occasion. Neither candidate supplies them in a form that could be shown. They would have to come from the narrations themselves, entry by entry, which is editorial work that needs someone qualified.

## 6. What this means

1. There is one source with explicit redistribution terms, HadeethEnc. It covers about half of the published entries, and using it as intended means showing whole narrations with attribution, not extracted supplications.
2. The source the app relies on for references and gradings, `hadith-api`, has no documented origin. Its licence file does not settle the rights in the edition it reproduces.
3. No candidate replaces the book's arrangement and notes. Permission from the author's foundation remains the only route that keeps the adhkar as they are.
4. Any migration would change the vocalization of nearly every entry, and the words of 34.

## 7. Questions before any migration is proposed

1. Drafted on 2026-11-22 in `hadeethenc-message.md`, in English and Arabic, for you to send. Original question: shall I draft a message to HadeethEnc, asking whether its terms cover the Arabic text and gradings, whether showing the supplication from within a hadith with full attribution is permitted, and whether commercial reuse by others is allowed?
2. Do you want sunnah.com asked directly about its terms for references and gradings, since the app's reference data most likely traces back to it?
3. If HadeethEnc's answer is favourable, would you accept entries shown as the narration (narrator's introduction and the Prophet's words), with the supplication highlighted, in place of the bare supplication?

## Sources consulted

- https://hadeethenc.com/ar/home (terms, sources, statistics) and its Arabic download, version 1.8.0
- https://hadeethenc.com/api-docs/ and `https://hadeethenc.com/api/v1/hadeeths/one/`
- https://github.com/fawazahmed0/hadith-api (README, catalogue file, licence)
- https://github.com/AhmedBaset/hadith-json (README)
- https://github.com/mhashim6/Open-Hadith-Data (README, licence metadata)
