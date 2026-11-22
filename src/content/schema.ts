export type VerificationStatus = 'verified' | 'needs-review'

/**
 * How the wording was tied to its source. Every method is mechanical: a script
 * compared letters. None of them is a scholar's review.
 */
export type MatchMethod =
  | 'quran-exact'
  | 'exact'
  | 'approximate'
  | 'bracketed'
  | 'combined'
  | 'evening-wording'
  | 'editor-reviewed'

export type Verification = {
  status: VerificationStatus
  method?: MatchMethod
  checkedAgainst: string[]
  checkedOn: string
  note?: string
}

export type SourceId = 'tanzil-uthmani' | 'hisn-al-muslim' | 'hadith-api'

/** Whether the right to redistribute a source in a public repository and app is documented. */
export type RedistributionStatus = 'cleared' | 'not-established'

export type UsePermission = 'permitted' | 'not-permitted' | 'needs-permission' | 'unknown'

export type ContentSource = {
  id: SourceId
  title: string
  rightsHolder: string
  obtainedFrom: string
  terms: string
  redistribution: RedistributionStatus
  commercialUse: UsePermission
  modification: UsePermission
  attribution: string
  /** Where the statements behind this record are quoted. */
  evidence: string
  pendingAction?: string
}

/**
 * Scholarly review is separate from every mechanical check. It changes only
 * when a named, qualified person has read the entry.
 */
export type ScholarlyReview =
  | { status: 'not-reviewed' }
  | { status: 'reviewed'; by: string; on: string }

/**
 * Where each part of an entry comes from. Nafissa shows supplications and their
 * references only: it carries no explanation or commentary of the Quran.
 * Rights are looked up in the source registry.
 */
export type Provenance = {
  /** Source of the recited wording. */
  text: SourceId
  /** Source of the collection name, hadith number and grading. */
  reference?: SourceId
  scholarlyReview: ScholarlyReview
}

export type QuranSegment = {
  type: 'quran'
  surah: number
  ayah: number
  /** Exact Tanzil Uthmani text. Never normalized, never edited. */
  text: string
  /** True when the text is a contiguous excerpt of the ayah, not the whole ayah. */
  isPartial?: boolean
}

export type TextSegment = { type: 'text'; text: string }

/** An instruction or remark from the source book, shown between the recited parts. */
export type NoteSegment = { type: 'note'; text: string }

export type Segment = QuranSegment | TextSegment | NoteSegment

export type HadithCollectionId = 'bukhari' | 'muslim' | 'abudawud' | 'tirmidhi' | 'nasai' | 'ibnmajah'

export type Grade = 'sahih' | 'hasan' | 'daif'

export type HadithSource = {
  collection: HadithCollectionId
  number: string
  grading?: { grade: Grade; label: string; by?: string }
}

export type HisnRef = { chapter: number; item: number }

type EntryBase = {
  id: string
  segments: Segment[]
  provenance: Provenance
  verification: Verification
}

export type QuranEntry = EntryBase & {
  kind: 'quran'
  segments: QuranSegment[]
  /**
   * The same ayahs in plain spelling, used only to build the search index.
   * Uthmani spelling does not match what people type. Never displayed.
   */
  searchText: string
}

export type HadithEntry = EntryBase & {
  kind: 'hadith'
  hisn: HisnRef
  sources: HadithSource[]
}

export type Entry = QuranEntry | HadithEntry

export type SectionId = 'adhkar' | 'daily-duas' | 'quranic' | 'prophetic'

export type CollectionItem = {
  entryId: string
  repeat: number
  /** Remark from the source book that applies to this placement only. */
  note?: string
  hisn?: HisnRef
}

export type Collection = {
  id: string
  section: SectionId
  title: string
  subtitle?: string
  icon: string
  items: CollectionItem[]
}

export type TasbihPreset = {
  id: string
  /** A contiguous excerpt of the referenced entry's text. */
  text: string
  entryId: string
  defaultTarget: number
}

export type Surah = { number: number; name: string }

/** `full` holds everything verified. `cleared` holds only what may be redistributed publicly. */
export type BundleScope = 'full' | 'cleared'

export type ContentBundle = {
  generatedOn: string
  scope: BundleScope
  sources: ContentSource[]
  basmala: string
  surahs: Surah[]
  entries: Entry[]
  collections: Collection[]
  tasbihPresets: TasbihPreset[]
}
