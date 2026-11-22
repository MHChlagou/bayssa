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
  meaning?: { text: string; source: string }
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

export type ContentBundle = {
  generatedOn: string
  basmala: string
  surahs: Surah[]
  entries: Entry[]
  collections: Collection[]
  tasbihPresets: TasbihPreset[]
}
