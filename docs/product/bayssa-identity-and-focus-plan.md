# Bayssa: identity, product focus and tracking

Implementation plan, prepared on 2026-11-22.

Status, same day: sections 1 and 2 were approved and are implemented in the private repository, with these decisions: a gold crescent only, the supplication on a card in settings only, no personal detail about the name anywhere, the tafsir explanations removed, and no complete Quran text in the public export. Section 3 is not decided: see `hadith-source-comparison.md`. Section 4 has moved to `daily-tracking-architecture.md`. No Islamic text or reference was changed.

## 1. The tribute

Bayssa is the name of your late grandmother, and the app is dedicated to her. The plan treats the tribute as part of the app's frame, present before any content, and never styled like a notice or an advertisement.

### What will be built

A slim band at the very top of the app, above the header on phones and across the full width above the sidebar and content on desktop.

- Text: «ترحّموا عليها», repeated along a continuous line, each repetition separated by a small gold ornament.
- Ornament: a crescent, drawn from the same shape as the app icon, so the band and the icon belong together. A heart is the alternative. I recommend the crescent alone: it reads as remembrance, where a heart can read as decoration.
- Colours: the deep emerald of the home screen's hero, text in ivory, ornaments and a hairline lower border in the soft gold already used across the app. The same in light and dark themes, so the band is the one constant on every screen.
- Typography: Amiri, the face used for supplications, at a modest size. No bold, no outline, no glow.
- Height: about 34 px on phones, 38 px on desktop.
- Movement: one unbroken horizontal drift, slow enough to read at a glance, about 60 seconds for the line to pass. Linear, with no easing, bounce or pause. It moves only by transform, which costs no layout work and does not touch the battery in any way that matters.
- Reduced motion: when the device asks for less motion the line does not move. The phrase is shown once, centred, with an ornament on each side.

### The secondary line

«اللهم ارحمها واغفر لها وأسكنها فسيح جناتك»

Three places it could go. I recommend the first two together.

1. A dedication card at the top of the settings screen, titled "إهداء": the supplication, set in Amiri, with nothing else on the card.
2. In the band, as every fourth item of the moving line, so it passes now and then without making the band wordy.
3. Under the band as a second fixed line. I advise against this: it doubles the height taken from every screen.

Both phrases are your words. They will be used exactly as you wrote them, and they are kept apart from the verified content dataset: they are a dedication, not a sourced entry, and the app will not attach a reference or a verification label to them.

### Where it appears

On every screen, as part of the frame: home, adhkar, duas, reader, tasbih, favorites, search, settings. It scrolls away with the page on long reading screens and is there again at the top of the next screen. Keeping it pinned while reading is possible, but it would sit over the supplications on a small phone, and I recommend against it. Tell me if you want it pinned.

It is included in the prerendered home screen, so it is there from the first paint, and in the public build.

### Accessibility and care

- Screen readers hear the phrase once, not once per repetition. The repeated copies are hidden from assistive technology.
- Accessibility guidelines ask that content which moves for more than five seconds can be paused. The band will stop when touched or hovered, and when focused by keyboard. This is in addition to the reduced-motion behaviour.
- The band is not a link and not a button. It announces nothing and asks for nothing.
- Performance is checked again after it is added: no layout shift, and the home screen's first paint unchanged.

### Questions for you

1. Crescent only, or crescent and heart?
2. The secondary line: dedication card and occasional appearance in the band, as recommended?
3. Should the app say whose name Bayssa is? For example a line on the dedication card: "Bayssa اسم جدتي رحمها الله". It is personal, so nothing of the kind will be written in the app, the README or the repository description unless you ask for it.

## 2. Product focus: duas and adhkar, not a Quran reader

### Review of the current application

There is no Quran reader in Bayssa today. There is no page that shows a surah, no surah list, no reading position, no memorisation feature. What exists that involves the Quran:

| What | Where | Fits the focus? |
|---|---|---|
| Supplications from the Quran as a dua category: 5 collections, 47 entries, each an individual supplication with surah and ayah | Duas screen, "قرآنية" tab | Yes. This is the category you describe |
| Quran passages recited as adhkar: Ayat al-Kursi, the last three surahs, the last two ayahs of al-Baqarah, and Al Imran 190-200 on waking | Inside the morning, evening, after-prayer, sleep and waking adhkar | Yes. They are adhkar. Al Imran 190-200 is the longest, eleven ayahs shown in full |
| The explanation of an ayah (التفسير الميسر) behind a "المعنى" disclosure | Reader cards for Quran entries | Open question. See below |
| The ayah-number ornament and the basmala line before a whole surah | Reader | Presentation only. Keep |
| A repetition counter and a daily progress bar on every collection, including the Quranic ones | Reader | It tracks completing a supplication, not reading the Quran. Keep, unless you would rather Quranic collections had no counter |
| The complete Tanzil text, two files, 2.1 MB | `content-sources/quran/`, used only to check each passage at build time. Never shipped in the app | Open question. See below |

So the change is mostly one of emphasis and wording, plus three decisions.

### Decisions

1. The tafsir disclosure. An explanation under an ayah is a step toward Quran study. Its licensing is also unresolved, and its replacement text differs in places. Removing it would end that licensing question and keep the app on duas. I recommend removing it. If you keep it, the QuranEnc work continues as planned, including your review of the four rewordings (2:128, 46:15, 59:10, 66:8).
2. The complete Quran text in the repository. The app never shows it. If "no full Quran text" should hold for the repository as well, the reference can be cut down to the 62 ayahs in use, in a file that keeps Tanzil's notice, and the build check works the same. Cutting it down is the cleaner reading of your instruction.
3. Order and wording. Put adhkar and everyday duas first everywhere, and present the Quranic category as "أدعية من القرآن" among the others, never first and never alone. The description, READMEs and link preview text would say "duas and adhkar" and stop describing the Quran text check as a headline feature.

### What stays

Everything on your list is already in the app, in the private build: morning and evening adhkar, after-prayer, sleep and waking adhkar, everyday duas by situation, prophetic duas, forgiveness and protection, and the tasbih. Nothing needs removing for the focus. The published content stays at 205 entries, with the six held entries and the review list unchanged.

### Components and code affected

| Area | Change |
|---|---|
| `AppFrame` | The tribute band joins the frame |
| New `TributeBand` component and its styles | The band |
| `SettingsPage` | Dedication card. Tafsir source line removed if decision 1 is yes |
| `DhikrCard`, `schema`, importer, build script | Only if the tafsir disclosure is removed |
| `content-sources/quran/`, `scripts/lib/quran.ts` | Only if the reference text is reduced |
| Interface copy, manifest description, READMEs, link preview | Wording to "duas and adhkar" |
| Static shell and tests | Updated for the band |

No supplication, ayah or reference changes in any of these.

## 3. The public release under this focus

### What the Quran-only build depends on

Stage A exists because of rights, not design: the Tanzil Quran text is the only religious text in the project with documented redistribution rights. Everything in your primary list (adhkar, daily and prophetic duas) currently comes from Hisn al-Muslim, whose permission has not been requested yet. The public build follows `content-sources/sources.ts`: it includes a source when that file marks it cleared.

So a public Bayssa that matches your focus needs cleared adhkar and duas. A public app with only the Quranic category would be the opposite of the product you describe.

### Recommendation

Do not publish Stage A as the app. Keep the machinery, which is built and tested, and change what feeds it.

There are two ways to get cleared adhkar and duas, and they can run together.

1. Permission for Hisn al-Muslim. Your letter is drafted. If it is granted, the source is marked cleared and the public build becomes the full app, with no further engineering.
2. Wording taken from the hadith collections themselves. The dataset of the six books is released into the public domain (the Unlicense). For 120 published entries the supplication is found word for word inside a narration there, and for 34 more the narration's own wording is available. The app could show the narration's wording, cut from that dataset, with its collection and number.

The second route does not depend on anyone's reply, and it also answers an audit finding: the app would show the wording of the source it cites. But it changes what users read:

- vocalization and spelling would follow the collections' edition, not the book's;
- the 34 approximate entries would change by a few words to the narration's wording;
- the author's notes, such as the evening form of a morning dhikr and the stated counts, could not be shown. Counts and occasions would need a source of their own;
- the selection and its grouping would still follow a book in copyright, which a lawyer should weigh.

That is a change to Islamic content, so it needs your explicit approval, a side-by-side comparison of every entry like the one made for the tafsir, and a new audit. I am proposing it, not starting it.

### Suggested stages, replacing A, B and C

| Stage | Public content | Depends on |
|---|---|---|
| Private (now) | Everything, with the tribute band and the focus changes | Your approval of this plan |
| Public 1 | Adhkar and duas that are cleared, with the Quranic category among them, tasbih, tribute | Either route above, your approval of the content, a code licence, Stage A's remaining blockers |
| Public 2 | Tracking | Section 4 |

## 4. Daily tracking

Moved to `daily-tracking-architecture.md`, revised and still deferred.

## 5. What I need from you

1. The three tribute questions in section 1.
2. Tafsir disclosure: remove, or keep and continue with QuranEnc?
3. Complete Quran text in the repository: reduce to the ayahs in use, or keep as the reference?
4. Public release: agree not to publish the Quran-only build, and tell me whether to prepare the comparison for sourcing wording from the hadith collections.
5. Approval to implement sections 1 and 2 in the private repository.
6. The uncommitted work from the Stage A rehearsal (export script, scan fixes, one layout fix, the reports): commit it, as a fifth local commit?
