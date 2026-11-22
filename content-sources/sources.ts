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
  'hadith-api': {
    id: 'hadith-api',
    title: 'fawazahmed0/hadith-api, Arabic editions of the six collections',
    rightsHolder: 'Not documented. The dataset names no source for its texts, numbering or gradings.',
    obtainedFrom: 'https://github.com/fawazahmed0/hadith-api',
    terms: 'The Unlicense on the repository. It cannot grant rights in an edition the repository author did not own.',
    redistribution: 'not-established',
    commercialUse: 'unknown',
    modification: 'unknown',
    attribution: 'Not required by the repository. Credited in the project.',
    evidence: 'docs/product/hadith-source-comparison.md, section 2',
    pendingAction: 'Establish the origin of the edition, or take references and gradings from a source with stated terms.',
  },
}
