# Licensing report

Investigated on 2026-11-22. This is an engineer's reading of published statements, with the source of each statement given. It is not legal advice.

## Summary

| Material | Can it be redistributed in a public repository as the project uses it today? |
|---|---|
| Application source code | Yes, once you choose a licence. It is your own work. |
| Quran text (Tanzil) | Yes, under Tanzil's stated terms, which the project meets. |
| Hadith references and gradings | Yes. |
| Fonts and code libraries | Yes. |
| Supplication text taken from Hisn al-Muslim | Not established. The author's stated permission does not clearly cover what the project does. |
| التفسير الميسر excerpts taken from Tanzil | Not established for a public repository. A source with explicit redistribution terms exists and is proposed below. |

The two existing commits contain both unresolved items (`content/dataset`, the audit reports that quote the text, and `content-sources/hisn-footnotes`). Pushing those commits publishes that material.

## 1. Hisn al-Muslim

### Original source and publisher

- Work: حصن المسلم من أذكار الكتاب والسنة.
- Author and copyright holder: Sa'id ibn Ali ibn Wahf al-Qahtani (1951 to 2018). The rights page of the 42nd edition (Ramadan 1436, July 2015) carries the copyright line "© سعيد بن علي بن وهف القحطاني" with a King Fahd National Library deposit number.
- The author's official site is binwahaf.com. Its footer reads "جميع الحقوق محفوظة © 2026".
- hisnmuslim.com, where the project's text came from, is a third-party site that offers a JSON API under a "للمطورين API" link. It is not the author or the publisher.

### Copyright and licence statements found

1. The book's own rights page, read from two scans of the 42nd edition on archive.org (`7sn-muslem` and `a1544n`). The scans are OCR text and partly garbled, but both agree on this passage, which follows the rights-reserved heading:

   > إلا لمن أراد طبعه، وتوزيعه مجاناً، بدون حذف، أو إضافة، أو تغيير، فله ذلك وجزاه الله خيراً، بشرط أن يُكتب على الغلاف الخارجي: وقف لله تعالى

   In English: rights are reserved, except that whoever wishes to print it and distribute it free of charge, without omission, addition or change, may do so, on condition that the outer cover carries the words "وقف لله تعالى" (an endowment for God).
2. binwahaf.com: "جميع الحقوق محفوظة". No licence page or permission procedure was found on the pages retrieved.
3. hisnmuslim.com: no copyright, licence or terms statement on its home page. Its `/api` page refused the request.
4. Arabic Wikisource lists the author's works under its "أعمال محمية" (protected works) template, meaning it treats them as still in copyright.
5. The MIT licence on `asellam/HisnElMuslim` and similar GitHub transcriptions covers the transcriber's own work. A transcriber cannot grant rights in the book.

### What the permission covers

| Question | Answer from the documentation |
|---|---|
| Non-commercial redistribution | Permitted for the book printed and given away free, complete and unchanged, with the waqf notice on the cover. |
| Commercial redistribution | Not permitted. The grant is limited to free distribution. |
| Attribution | The grant requires the work to stay unchanged, which keeps the author's name on it, and requires the waqf notice. |
| Modification | Not permitted: "بدون حذف، أو إضافة، أو تغيير". |
| Public GitHub repository | Not addressed. The grant speaks of printing and free distribution. A complete, unaltered digital copy given away free is close to its spirit. A selection is not. |

### Conclusion

Redistribution rights for the project's present use are not established.

The project does not distribute the book. It takes 154 of the book's items, removes the footnotes, splits items into recited text and notes, regroups them under its own headings and hides the rest. Each of those steps is an omission or a change, which the author's permission excludes. An open-source code licence would also allow commercial reuse, which the permission excludes.

Two points limit how far the author's rights reach, and a lawyer should weigh them. The words of the Prophet's supplications and the Quran are not the author's creation. What the author owns is his selection and arrangement, his headings, his footnotes and his own notes, such as the bracketed evening variants and the instructions between phrases. The project's dataset does include those notes and his combined wordings.

`content-sources/hisn-footnotes/hisn-with-references.json` is a full transcription of the book with its footnotes. I committed it in the first commit on the strength of its MIT file. On this closer reading the author's rights page governs it, not the transcriber's licence. It is complete and unaltered text given away free, which is the use the author allows, but it lacks the waqf notice and sits under an MIT file that claims more than the transcriber can grant.

### Ways forward

1. Ask for permission. Write to the author's foundation through binwahaf.com, describe the app (free, no ads, selection of items with references, open source), and ask for written permission to include the selection in the app and in a public repository. This is the route that keeps the content as it is.
2. Replace the source of the wording. `fawazahmed0/hadith-api` is released under the Unlicense and holds the vocalized text of the six collections. For the 120 exact matches the supplication is word for word inside a narration there, and for the 34 approximate matches the narration's own wording is available. The app would show the narration's wording cut from that dataset, with no notes from Hisn al-Muslim. This changes displayed Islamic content (vocalization, a few words, the notes) and needs your explicit approval and a new audit. It also leaves the question of whether the project's selection follows the book's arrangement too closely.
3. Publish the code without the content. Keep `content/dataset` and the text-bearing reports out of the public repository until route 1 or 2 is complete.

## 2. التفسير الميسر

### Original source and publisher

- Work: التفسير الميسر, written by a committee of scholars and published by the King Fahd Complex for the Printing of the Holy Quran, Madinah.
- The Complex's site, qurancomplex.gov.sa, carries "جميع الحقوق محفوظة لمجمع الملك فهد لطباعة المصحف الشريف © 2026".
- The project's copy came from the Tanzil Project's translations page, identifier `ar.muyassar`. The downloaded file names King Fahad Quran Complex as the translator and Tanzil.net as the source, and contains no licence text.

### Copyright and licence statements found

1. Tanzil translations page, "Terms of Use": "The translations provided at this page are for non-commercial purposes only. If used otherwise, you need to obtain necessary permission from the translator or the publisher." It also requires a link back to that page when more than three of its translations are used, and says that redistributing its list of translations on another website is not allowed without Tanzil's permission.
2. Tanzil FAQ: its resources "are available for non-commercial purposes".
3. King Fahd Complex: all rights reserved. No developer licence for the tafsir was found. Its site lists a content embedding service, whose terms I did not find.
4. QuranEnc.com publishes the same work as "اللغة العربية · التفسير الميسر" with explicit terms: "يتاح تنزيل محتوى الترجمات وإعادة نشره" on seven conditions: no modification, addition or deletion; clear reference to the publisher and to QuranEnc.com; state the version number; keep the version information inside the document; report any remark on the text to QuranEnc; update to newer versions as they are issued; no unsuitable advertising alongside it.

### What the terms cover

| Question | Via Tanzil | Via QuranEnc.com |
|---|---|---|
| Non-commercial use | Permitted | Permitted |
| Commercial use | Needs the publisher's permission | Not restricted in the stated terms, apart from the advertising condition |
| Attribution | Expected, link back in some cases | Required: publisher and QuranEnc.com, with version number |
| Modification | Not addressed | Not permitted |
| Redistribution in a public repository | Not granted. The terms speak of use, and restrict redistributing the collection | Permitted: "download and re-publish", on the conditions above |

### Conclusion

For the copy the project holds, redistribution in a public repository is not established. Tanzil allows non-commercial use and sends other uses to the publisher, and the publisher reserves all rights.

### Proposed replacement

Take the same tafsir from QuranEnc.com, whose terms explicitly allow re-publishing. The project already shows whole ayah explanations unchanged, which fits the no-modification condition. It would need to record the QuranEnc version number, name QuranEnc.com and the Complex in the app and the repository, and keep the text separate from the code licence because of the no-modification condition. The wording may differ slightly between the two editions, so this is a content change that needs your approval, followed by a rebuild of the dataset.

The alternative with no licensing question is to remove the optional "meaning" disclosure from Quranic entries.

## 3. Material with settled terms

| Material | Source | Terms | Notes |
|---|---|---|---|
| Quran text, Uthmani and plain | Tanzil Project 1.1 | Creative Commons Attribution 3.0, with the project's terms: verbatim copies only, source clearly indicated with a link to tanzil.net, and the copyright notice kept in copies and reproduced in files that contain a substantial portion | The files keep their notice and the text is checked byte for byte. One gap: the app names Tanzil.net in its sources screen as text, not as a link. Making it a link is on the launch checklist. |
| Surah names | Tanzil metadata | Creative Commons Attribution 3.0 | |
| Hadith numbers and grading labels | `fawazahmed0/hadith-api` | The Unlicense | Only numbers and grading labels reach the app. |
| Fonts | Amiri, Readex Pro | SIL Open Font License 1.1 | Bundled by the build from npm packages. |
| Libraries | React, React Router, Motion (MIT), Lucide (ISC) | Permissive | |

## 4. Recommended licensing structure

Keep three things apart.

1. Application source code (`src/` except `src/content/generated`, `scripts/`, `tests/`, configuration, the icon and the documentation you wrote). Recommended licence: Apache License 2.0. It is permissive, widely understood, and its `NOTICE` file is the standard place to state what the licence does not cover. MIT would also work for the code. If you would rather that copies stay open, including against closed commercial repackaging, GPL-3.0 is the alternative. I have not added a licence file: the choice and the copyright holder's name are yours.
2. Third-party content (`content/dataset`, `content-sources/`, and the reports that quote it). Not covered by the code licence. Each source keeps its own terms, listed in `THIRD_PARTY_CONTENT.md`, which is prepared in this milestone.
3. Fonts and libraries, under their own licences.

The README states this separation in both languages, so the code licence cannot be read as a claim over the Quran text or the supplications.

## 5. Sources consulted

- Rights page of the 42nd edition: https://archive.org/details/7sn-muslem and https://archive.org/details/a1544n
- Author's site: https://binwahaf.com/
- https://www.hisnmuslim.com/
- Arabic Wikisource author page for سعيد بن علي بن وهف القحطاني
- https://tanzil.net/trans/ , https://tanzil.net/docs/text_license , https://tanzil.net/docs/faq
- https://qurancomplex.gov.sa/
- https://quranenc.com/ar/browse/arabic_moyassar
- https://github.com/fawazahmed0/hadith-api , https://github.com/asellam/HisnElMuslim
