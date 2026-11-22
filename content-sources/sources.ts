// Registry of every source that religious content, references or explanations
// come from, with what is known about the right to redistribute it.
//
// Each entry in the dataset names its sources by id (see `Provenance` in
// src/content/schema.ts). The public build publishes only what this registry
// marks `cleared`, so changing a status here is a publishing decision and
// must be backed by the evidence it cites.
import type { ContentSource, SourceId } from '../src/content/schema.ts'

export const SOURCES: Record<SourceId, ContentSource> = {
  'tanzil-uthmani': {
    id: 'tanzil-uthmani',
    title: 'Tanzil Quran Text (Uthmani), version 1.1',
    rightsHolder: 'Tanzil Project',
    obtainedFrom: 'https://tanzil.net',
    terms: 'Creative Commons Attribution 3.0, with Tanzil\'s terms of use',
    redistribution: 'cleared',
    commercialUse: 'permitted',
    modification: 'not-permitted',
    attribution: 'Name the Tanzil Project with a link to tanzil.net, and keep the copyright notice in the text files.',
    evidence: 'docs/pre-release/licensing.md, section 3',
  },
  'hisn-al-muslim': {
    id: 'hisn-al-muslim',
    title: 'حصن المسلم من أذكار الكتاب والسنة',
    rightsHolder: 'Sa\'id ibn Ali ibn Wahf al-Qahtani and his heirs',
    obtainedFrom: 'https://www.hisnmuslim.com (third-party transcription)',
    terms: 'Rights reserved. The author permits free distribution of the complete, unaltered book carrying the notice "وقف لله تعالى".',
    redistribution: 'not-established',
    commercialUse: 'not-permitted',
    modification: 'not-permitted',
    attribution: 'Name the book and its author.',
    evidence: 'docs/pre-release/licensing.md, section 1',
    pendingAction: 'Written permission requested from the author\'s foundation.',
  },
  'tafsir-muyassar-tanzil': {
    id: 'tafsir-muyassar-tanzil',
    title: 'التفسير الميسر, copy distributed by the Tanzil Project (ar.muyassar)',
    rightsHolder: 'King Fahd Complex for the Printing of the Holy Quran',
    obtainedFrom: 'https://tanzil.net/trans/',
    terms: 'All rights reserved by the publisher. Tanzil offers it for non-commercial use only.',
    redistribution: 'not-established',
    commercialUse: 'needs-permission',
    modification: 'unknown',
    attribution: 'Name the work and its publisher.',
    evidence: 'docs/pre-release/licensing.md, section 2',
    pendingAction: 'Replace with the QuranEnc.com copy once its version and terms are confirmed.',
  },
  'hadith-api': {
    id: 'hadith-api',
    title: 'fawazahmed0/hadith-api, Arabic editions of the six collections',
    rightsHolder: 'Classical texts. Dataset dedicated to the public domain.',
    obtainedFrom: 'https://github.com/fawazahmed0/hadith-api',
    terms: 'The Unlicense',
    redistribution: 'cleared',
    commercialUse: 'permitted',
    modification: 'permitted',
    attribution: 'Not required. Credited in the project.',
    evidence: 'docs/pre-release/licensing.md, section 3',
  },
}
