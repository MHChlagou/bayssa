import { CircleDot, HandHeart, Heart, House, Sparkles, type LucideIcon } from 'lucide-react'
import { t } from '../i18n/t.ts'

export type NavItem = { to: string; label: string; icon: LucideIcon; isExact?: boolean }

// The single list of top-level destinations. A future feature (prayer times,
// Qibla) is added here and in router.tsx, and both navigation layouts pick it up.
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: t.nav.home, icon: House, isExact: true },
  { to: '/adhkar', label: t.nav.adhkar, icon: Sparkles },
  { to: '/duas', label: t.nav.duas, icon: HandHeart },
  { to: '/tasbih', label: t.nav.tasbih, icon: CircleDot },
  { to: '/favorites', label: t.nav.favorites, icon: Heart },
]
