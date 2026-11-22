import { createElement, type ReactElement } from 'react'
import {
  BookOpen, Box, Car, CircleDot, CloudRain, Compass, Droplets, HandHeart, Heart, House, Landmark, Leaf, Moon,
  MoonStar, Mountain, Plane, Shield, Shirt, Sparkles, Sun, Sunrise, Sunset, Users, Utensils, type LucideIcon,
} from 'lucide-react'

const COLLECTION_ICONS: Record<string, LucideIcon> = {
  sunrise: Sunrise, sunset: Sunset, prayer: HandHeart, moon: MoonStar, sun: Sun, beads: CircleDot, food: Utensils,
  home: House, mosque: Landmark, water: Droplets, clothes: Shirt, car: Car, travel: Plane, heart: Heart,
  mountain: Mountain, leaf: Leaf, sparkles: Sparkles, shield: Shield, compass: Compass, people: Users,
  book: BookOpen, rain: CloudRain, crescent: Moon, kaaba: Box,
}

type CollectionIconProps = { name: string; className?: string; strokeWidth?: number }

export function CollectionIcon({ name, className, strokeWidth = 1.6 }: CollectionIconProps): ReactElement {
  return createElement(COLLECTION_ICONS[name] ?? Sparkles, { className, strokeWidth, 'aria-hidden': true })
}
