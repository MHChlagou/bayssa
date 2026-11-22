// Editorial decisions for the content import. This file never contains
// supplication text: every recited word is cut from the reference sources.
import type { Excerpt } from '../scripts/lib/quran.ts'

export type QuranSpec = { ref: string } & Excerpt

/** Quran passages quoted inside Hisn al-Muslim items, in order of appearance. */
export const hisnQuranRefs: Record<number, QuranSpec[]> = {
  4: [{ ref: '3:190-200' }],
  50: [{ ref: '23:14', from: 'فتبارك' }],
  70: [{ ref: '112' }, { ref: '113' }, { ref: '114' }],
  71: [{ ref: '2:255' }],
  75: [{ ref: '2:255' }],
  76: [{ ref: '112' }, { ref: '113' }, { ref: '114' }],
  99: [{ ref: '112' }, { ref: '113' }, { ref: '114' }],
  100: [{ ref: '2:255' }],
  101: [{ ref: '2:285-286' }],
  135: [{ ref: '57:3' }],
  206: [{ ref: '43:13-14', from: 'سبحان' }],
  207: [{ ref: '43:13-14', from: 'سبحان' }],
  235: [{ ref: '2:201', from: 'ربنا' }],
}

/** Items whose `((…))` parts are instructions, not recited text. */
export const hisnInstructionItems = new Set([99])

/** Items whose unwrapped leading text is recited (index of the raw piece). */
export const hisnRawAsText: Record<number, number[]> = { 207: [0] }

/** Short items need topic keywords to pin the narration that carries them. */
export const hisnMatchKeywords: Record<number, string[]> = {
  11: ['الغايط'],
  33: ['ركوعه'],
  41: ['سجوده'],
  91: ['مايه مره'],
  172: ['المطر'],
  198: ['معروف'],
}

/**
 * Items whose wording the automatic matcher could not align, where an editor
 * compared the candidate narration by hand. The importer still requires that
 * at least 85% of the item's distinct words occur in the named narration.
 */
export const hisnReviewedMatches: Record<number, { collection: 'abudawud' | 'tirmidhi'; number: string; reason: string }> = {
  206: {
    collection: 'abudawud',
    number: '2602',
    reason: 'the narration gives the repeated phrases as "three times" while the book writes them out',
  },
}

/**
 * Narrations that must never be offered as the reference of an item, because
 * a person read them and found they are about something else.
 */
export const hisnExcludedReferences: Record<number, { collection: 'bukhari' | 'muslim' | 'abudawud' | 'tirmidhi' | 'nasai' | 'ibnmajah'; number: string; reason: string }[]> = {
  87: [{ collection: 'bukhari', number: '93', reason: 'A different narration: Umar says "رضينا بالله ربا" on another occasion.' }],
  166: [
    { collection: 'abudawud', number: '2160', reason: 'The supplication for marriage or buying a servant, which only shares the phrase.' },
    { collection: 'ibnmajah', number: '2252', reason: 'The same supplication for buying a servant or a camel, offered by the matcher once Abu Dawud 2160 was excluded.' },
    { collection: 'ibnmajah', number: '1918', reason: 'The same supplication for marriage, a servant or a mount.' },
  ],
}

/**
 * Items kept out of production by a decision of the project owner, whatever
 * the automatic matcher says. The record and its wording stay in the dataset
 * unchanged. An item leaves this list only by another explicit decision.
 */
export const hisnHeldForReview: Record<number, { decidedOn: string; decidedBy: string; decision: string; reason: string }> = {
  87: {
    decidedOn: '2026-11-22', decidedBy: 'project owner', decision: 'Hide immediately',
    reason: 'The reference shown was wrong (Sahih al-Bukhari 93 is a different narration). Needs a correct reference established independently.',
  },
  32: {
    decidedOn: '2026-11-22', decidedBy: 'project owner', decision: 'Hide immediately',
    reason: 'About 41% of the words are bracketed additions that were never matched to a narration.',
  },
  166: {
    decidedOn: '2026-11-22', decidedBy: 'project owner', decision: 'Keep hidden pending further verification',
    reason: 'Abu Dawud 2160 was a wrong attribution and is excluded from consideration. Do not publish without an independently established correct reference.',
  },
  206: {
    decidedOn: '2026-11-22', decidedBy: 'project owner', decision: 'Keep hidden pending further verification',
    reason: 'Riding supplication. Wording and repetition need independent review: the match was approved by hand by an engineer.',
  },
  20: {
    decidedOn: '2026-11-22', decidedBy: 'project owner', decision: 'Keep hidden pending further verification',
    reason: 'Joins two narrations with linking words that were not matched. Needs individual review.',
  },
  77: {
    decidedOn: '2026-11-22', decidedBy: 'project owner', decision: 'Keep hidden pending further verification',
    reason: 'The morning wording was matched only through its evening form. Needs individual review.',
  },
}

export type CollectionSpec = {
  id: string
  section: 'adhkar' | 'daily-duas' | 'quranic' | 'prophetic'
  title: string
  subtitle?: string
  icon: string
  chapters?: { chapter: number; except?: number[] }[]
  quran?: QuranSpec[]
}

export const collections: CollectionSpec[] = [
  { id: 'morning', section: 'adhkar', title: 'أذكار الصباح', icon: 'sunrise', chapters: [{ chapter: 27, except: [97] }] },
  { id: 'evening', section: 'adhkar', title: 'أذكار المساء', icon: 'sunset', chapters: [{ chapter: 27, except: [93, 94, 95, 96] }] },
  { id: 'after-prayer', section: 'adhkar', title: 'أذكار بعد الصلاة', icon: 'prayer', chapters: [{ chapter: 25 }] },
  { id: 'sleep', section: 'adhkar', title: 'أذكار النوم', icon: 'moon', chapters: [{ chapter: 28 }] },
  { id: 'waking', section: 'adhkar', title: 'أذكار الاستيقاظ', icon: 'sun', chapters: [{ chapter: 1 }] },
  { id: 'general', section: 'adhkar', title: 'الذكر المطلق', subtitle: 'التسبيح والتحميد والتهليل والتكبير', icon: 'beads', chapters: [{ chapter: 130 }, { chapter: 131 }, { chapter: 107 }] },

  { id: 'food', section: 'daily-duas', title: 'الطعام والشراب', icon: 'food', chapters: [{ chapter: 69 }, { chapter: 70 }, { chapter: 71 }, { chapter: 73 }] },
  { id: 'home', section: 'daily-duas', title: 'دخول المنزل والخروج منه', icon: 'home', chapters: [{ chapter: 11 }, { chapter: 10 }] },
  { id: 'mosque', section: 'daily-duas', title: 'المسجد', icon: 'mosque', chapters: [{ chapter: 12 }, { chapter: 13 }, { chapter: 14 }] },
  { id: 'bathroom', section: 'daily-duas', title: 'الخلاء والوضوء', icon: 'water', chapters: [{ chapter: 6 }, { chapter: 7 }, { chapter: 8 }, { chapter: 9 }] },
  { id: 'clothes', section: 'daily-duas', title: 'اللباس', icon: 'clothes', chapters: [{ chapter: 2 }, { chapter: 3 }, { chapter: 4 }, { chapter: 5 }] },
  { id: 'riding', section: 'daily-duas', title: 'الركوب', subtitle: 'عند ركوب السيارة وغيرها', icon: 'car', chapters: [{ chapter: 95 }, { chapter: 99 }] },
  { id: 'travel', section: 'daily-duas', title: 'السفر', icon: 'travel', chapters: [{ chapter: 96 }, { chapter: 97 }, { chapter: 100 }, { chapter: 101 }, { chapter: 102 }, { chapter: 103 }, { chapter: 104 }, { chapter: 105 }] },
  { id: 'anxiety', section: 'daily-duas', title: 'الهم والحزن', icon: 'heart', chapters: [{ chapter: 34 }] },
  { id: 'hardship', section: 'daily-duas', title: 'الكرب والشدائد', icon: 'mountain', chapters: [{ chapter: 35 }, { chapter: 43 }, { chapter: 46 }, { chapter: 53 }] },
  { id: 'forgiveness', section: 'daily-duas', title: 'الاستغفار والتوبة', icon: 'leaf', chapters: [{ chapter: 129 }, { chapter: 44 }] },
  { id: 'gratitude', section: 'daily-duas', title: 'الشكر والحمد', icon: 'sparkles', chapters: [{ chapter: 106 }, { chapter: 123 }, { chapter: 122 }] },
  { id: 'protection', section: 'daily-duas', title: 'الحفظ والعافية', icon: 'shield', chapters: [{ chapter: 48 }, { chapter: 126 }, { chapter: 128 }, { chapter: 124 }, { chapter: 39 }, { chapter: 45 }] },

  { id: 'salah', section: 'prophetic', title: 'أدعية الصلاة', icon: 'prayer', chapters: [16, 17, 18, 19, 20, 22, 23, 24].map((chapter) => ({ chapter })) },
  { id: 'istikhara-witr', section: 'prophetic', title: 'الاستخارة والوتر', icon: 'compass', chapters: [26, 32, 33].map((chapter) => ({ chapter })) },
  { id: 'night', section: 'prophetic', title: 'الليل والرؤيا', icon: 'moon', chapters: [29, 30, 31].map((chapter) => ({ chapter })) },
  { id: 'sick', section: 'prophetic', title: 'المرض والجنائز', icon: 'heart', chapters: [49, 51, 54, 55, 56, 57, 58, 59, 60].map((chapter) => ({ chapter })) },
  { id: 'weather', section: 'prophetic', title: 'الريح والمطر والهلال', icon: 'rain', chapters: [61, 62, 63, 64, 65, 66, 67].map((chapter) => ({ chapter })) },
  { id: 'fasting', section: 'prophetic', title: 'الصيام', icon: 'crescent', chapters: [68, 74, 75].map((chapter) => ({ chapter })) },
  { id: 'social', section: 'prophetic', title: 'المجالس والمعاملة', icon: 'people', chapters: [77, 79, 82, 83, 84, 85, 86, 87, 89, 90, 91, 93, 108].map((chapter) => ({ chapter })) },
  { id: 'faith-debt', section: 'prophetic', title: 'الإيمان وقضاء الدَّين', icon: 'shield', chapters: [36, 37, 38, 40, 41, 42, 92, 94].map((chapter) => ({ chapter })) },
  { id: 'hajj', section: 'prophetic', title: 'الحج والعمرة', icon: 'kaaba', chapters: [115, 116, 117, 118, 119, 121].map((chapter) => ({ chapter })) },

  {
    id: 'q-forgiveness', section: 'quranic', title: 'المغفرة والرحمة', icon: 'leaf',
    quran: [
      { ref: '2:286', from: 'ربنا' }, { ref: '3:16', from: 'ربنا' }, { ref: '3:147', from: 'ربنا' },
      { ref: '7:23', from: 'ربنا' }, { ref: '23:109', from: 'ربنا' }, { ref: '23:118', from: 'رب' },
      { ref: '28:16', from: 'رب', to: 'لي' }, { ref: '59:10', from: 'ربنا' }, { ref: '11:47', from: 'رب' },
      { ref: '21:87', from: 'لا' },
    ],
  },
  {
    id: 'q-guidance', section: 'quranic', title: 'الهداية والثبات', icon: 'compass',
    quran: [
      { ref: '3:8' }, { ref: '2:250', from: 'ربنا' }, { ref: '7:126', from: 'ربنا', fromOccurrence: 2 },
      { ref: '18:10', from: 'ربنا' }, { ref: '3:53' }, { ref: '60:4-5', from: 'ربنا' },
      { ref: '66:8', from: 'ربنا' }, { ref: '10:85-86', from: 'ربنا' }, { ref: '7:89', from: 'ربنا', fromOccurrence: 3 },
      { ref: '2:127-128', from: 'ربنا' },
    ],
  },
  {
    id: 'q-family', section: 'quranic', title: 'الأهل والذرية', icon: 'people',
    quran: [
      { ref: '25:74', from: 'ربنا' }, { ref: '14:40-41' }, { ref: '3:38', from: 'رب' }, { ref: '21:89', from: 'رب' },
      { ref: '37:100' }, { ref: '46:15', from: 'رب' }, { ref: '17:24', from: 'رب' }, { ref: '71:28' },
    ],
  },
  {
    id: 'q-knowledge', section: 'quranic', title: 'العلم والتيسير والشكر', icon: 'book',
    quran: [
      { ref: '20:25-28', from: 'رب' }, { ref: '20:114', from: 'رب' }, { ref: '27:19', from: 'رب' },
      { ref: '26:83-85' }, { ref: '17:80', from: 'رب' }, { ref: '23:29', from: 'رب' }, { ref: '28:24', from: 'رب' },
    ],
  },
  {
    id: 'q-rescue', section: 'quranic', title: 'النجاة والحفظ', icon: 'shield',
    quran: [
      { ref: '2:201', from: 'ربنا' }, { ref: '3:191-194', from: 'ربنا' }, { ref: '25:65', from: 'ربنا' },
      { ref: '21:83', from: 'اني' }, { ref: '23:97-98', from: 'رب' }, { ref: '28:21', from: 'رب' },
      { ref: '29:30', from: 'رب' }, { ref: '7:47', from: 'ربنا' }, { ref: '12:101', from: 'فاطر' },
      { ref: '66:11', from: 'رب' }, { ref: '40:7-9', from: 'ربنا' }, { ref: '5:83', from: 'ربنا' },
    ],
  },
]

/** Hisn chapter 27 wording differs between morning and evening by these words only. */
export const eveningSubstitutions: [string, string][] = [
  ['اصبحنا', 'امسينا'], ['اصبح', 'امسي'], ['اصبحت', 'امسيت'], ['اليوم', 'الليله'],
  ['بعده', 'بعدها'], ['النشور', 'المصير'], ['هذا', 'هذه'], ['فتحه', 'فتحها'], ['نصره', 'نصرها'],
  ['نوره', 'نورها'], ['بركته', 'بركتها'], ['هداه', 'هداها'], ['فيه', 'فيها'],
]

/**
 * Tasbih shortcuts. `phrase` only locates the words: the displayed text is the
 * vocalized run of words cut from the Hisn al-Muslim item.
 */
export const tasbihPresetSpecs: { id: string; hisnItem: number; phrase: string; defaultTarget: number }[] = [
  { id: 'subhan-allah', hisnItem: 257, phrase: 'سبحان الله', defaultTarget: 33 },
  { id: 'alhamdulillah', hisnItem: 188, phrase: 'الحمد لله', defaultTarget: 33 },
  { id: 'allahu-akbar', hisnItem: 207, phrase: 'الله أكبر', defaultTarget: 33 },
  { id: 'la-ilaha-illa-allah', hisnItem: 93, phrase: 'لا إله إلا الله', defaultTarget: 100 },
  { id: 'subhan-allah-wa-bihamdih', hisnItem: 91, phrase: 'سبحان الله وبحمده', defaultTarget: 100 },
  { id: 'subhan-allah-al-azim', hisnItem: 256, phrase: 'سبحان الله وبحمده سبحان الله العظيم', defaultTarget: 100 },
  { id: 'astaghfirullah', hisnItem: 96, phrase: 'أستغفر الله وأتوب إليه', defaultTarget: 100 },
  { id: 'hawqala', hisnItem: 260, phrase: 'لا حول ولا قوة إلا بالله', defaultTarget: 33 },
  { id: 'baqiyat', hisnItem: 257, phrase: 'سبحان الله والحمد لله ولا إله إلا الله والله أكبر', defaultTarget: 33 },
  { id: 'tahlil', hisnItem: 92, phrase: 'لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير', defaultTarget: 100 },
]
