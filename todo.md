# Project: Muslim Daily – A Complete Islamic Duas & Adhkar Application

## 1. Project Vision

Build a modern, elegant, and fully responsive Islamic application dedicated to Muslims worldwide.

The application should serve as a comprehensive daily companion, providing Muslims with access to essential Duas (supplications), Adhkar (remembrance of Allah), Quranic supplications, and authentic Islamic invocations that every Muslim should know and practice in their daily life.

The goal is to create a beautiful, intuitive, and spiritually inspiring experience that encourages users to maintain their daily Islamic practices.

This should not look like a traditional or outdated religious application. It should have the quality, polish, and user experience of a modern premium mobile application.

## 2. Target Platforms & Deployment

The application must support:

- **Mobile:** Fully responsive design optimized for smartphones.
- **Desktop:** Optimized experience for larger screens.
- **PWA (Progressive Web App):** Installable on Android, iOS (where supported), Windows, and macOS.
- **Offline support:** Users must be able to access all downloaded or cached Duas and Adhkar without an internet connection.
- **Hosting:** GitHub Pages.
- **Deployment:** Fully compatible with GitHub Pages static hosting, including correct routing, asset paths, and production builds.

The application must be installable as a PWA, with its own application icon, splash screen, manifest, and service worker.

## 3. Language & RTL Support

For the initial release:

- Support Arabic language ONLY.
- Arabic must be the default and exclusive interface language.
- Full RTL (Right-to-Left) layout across the entire application.
- Use beautiful, readable Arabic typography.
- Ensure proper Arabic text rendering on all screen sizes.
- Design the application with future multilingual support in mind, without implementing additional languages yet.

## 4. Main Application Features

Organize Islamic content into clear categories.

### A. Daily Adhkar (الأذكار اليومية)

Include:

- Morning Adhkar (أذكار الصباح).
- Evening Adhkar (أذكار المساء).
- Adhkar after prayers (أذكار بعد الصلاة).
- Before sleeping (أذكار النوم).
- After waking up (أذكار الاستيقاظ).
- General remembrance (الذكر المطلق).

### B. Essential Duas (الأدعية اليومية)

Include authentic supplications for everyday situations:

- Before and after eating.
- Entering and leaving the house.
- Entering and leaving the mosque.
- Before and after using the bathroom.
- Before traveling.
- When wearing clothes.
- When entering and leaving the car.
- When experiencing anxiety or sadness.
- When facing difficulties.
- When seeking forgiveness.
- When thanking Allah.
- Duas for protection and well-being.

### C. Quranic Duas (أدعية من القرآن الكريم)

Create a dedicated section containing supplications directly extracted from the Holy Quran.

For each Dua, display:
- Arabic text.
- Surah name.
- Ayah reference.
- Optional explanation of its meaning in Arabic.

### D. Prophetic Duas (الأدعية النبوية)

A dedicated collection of authentic supplications reported from Prophet Muhammad ﷺ.

For each Dua, include:
- Arabic text.
- Source and reference.
- Authenticity grading where available.
- Recommended repetition count, when established.

### E. Tasbih Counter (المسبحة الإلكترونية)

Build an interactive digital Tasbih featuring:
- Large, elegant counter.
- Reset functionality.
- Haptic feedback where supported.
- Common Dhikr shortcuts.
- Customizable repetition targets.
- Progress visualization.

### F. Favorites (المفضلة)

Allow users to:
- Save favorite Duas and Adhkar.
- Access saved content quickly.
- Organize favorites by category.
- Persist favorites locally.

### G. Search (البحث)

Provide a fast search experience supporting Arabic text and allowing users to search across all Duas and Adhkar.

## 5. UI/UX & Visual Identity

This is one of the most important aspects of the project.

Create a premium, modern Islamic visual identity inspired by the atmosphere of the Holy Quran.

### Design direction

Use a sophisticated color palette inspired by Islamic architecture, nature, and traditional Quran manuscripts:

- Deep emerald green.
- Dark forest green.
- Soft ivory / cream.
- Warm beige.
- Subtle gold accents.
- Optional dark mode with elegant dark green tones.

Avoid excessive decoration, overly bright colors, or an outdated Islamic application aesthetic.

### Visual elements

Consider:
- Subtle Islamic geometric patterns.
- Elegant Arabic calligraphy-inspired details.
- Beautiful typography.
- Soft gradients.
- Rounded cards.
- Premium iconography.
- Generous spacing and clean layouts.

### Animations & Interactions

The application should feel alive and fluid.

Implement:
- Smooth page transitions.
- Elegant card animations.
- Subtle hover effects.
- Animated counters.
- Smooth scrolling.
- Micro-interactions when completing Dhikr repetitions.
- Beautiful loading and empty states.
- Smooth navigation transitions.

Animations must remain lightweight and performant, especially on mobile devices.

Respect the user's reduced-motion accessibility preference.

## 6. Main Navigation

Create a simple and intuitive navigation structure.

Suggested sections:

1. الرئيسية – Home
2. الأذكار – Adhkar
3. الأدعية – Duas
4. المسبحة – Tasbih
5. المفضلة – Favorites

On mobile, use an elegant bottom navigation bar.

On desktop, use a sidebar or an appropriately adapted navigation layout.

## 7. Home Dashboard

The home screen should provide a welcoming overview of the user's daily Islamic practices.

Include:

- Beautiful Islamic greeting.
- Current Hijri date, if available.
- Quick access to morning and evening Adhkar.
- Daily Dhikr recommendation.
- Daily Dua.
- Quick Tasbih access.
- Recently viewed content.
- Favorites shortcut.

The dashboard should feel calm, welcoming, and spiritually inspiring rather than crowded.

## 8. Content Accuracy & Islamic Authenticity

This requirement is critical.

The application must prioritize authentic Islamic sources.

Content should be sourced from reliable references, including:

- The Holy Quran.
- Sahih Al-Bukhari.
- Sahih Muslim.
- Sunan Abu Dawud.
- Jami' At-Tirmidhi.
- Sunan An-Nasa'i.
- Sunan Ibn Majah.
- Hisn al-Muslim (حصن المسلم).

Requirements:

- Never invent or generate religious supplications.
- Preserve the original Arabic wording.
- Include references for every Dua and Dhikr whenever possible.
- Include authenticity grading where applicable.
- Clearly distinguish Quranic verses from prophetic narrations.
- Do not present disputed or weak narrations as unquestionably authentic.
- Verify repetition counts against reliable sources.
- Keep religious content separate from application code using structured data files (JSON or equivalent).

If a reference or authenticity cannot be verified, flag it for review instead of presenting it as verified.

## 9. Technical Architecture

Choose a modern, maintainable frontend architecture.

Preferred technologies:
- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- Framer Motion or Motion for animations.
- Lucide icons.
- PWA tooling compatible with Vite.

Technical requirements:
- Component-based architecture.
- Reusable UI components.
- Clean project structure.
- Well-organized Arabic content datasets.
- LocalStorage or IndexedDB for persistence.
- Offline-first architecture.
- Optimized production build.
- SEO and social sharing metadata.
- Accessibility best practices.
- Excellent Lighthouse performance.

Avoid unnecessary backend infrastructure. The initial version should work entirely as a static application hosted on GitHub Pages.

## 10. PWA & Offline Experience

Implement a complete PWA experience:

- Web App Manifest.
- Service Worker.
- Application icons.
- Installability.
- Offline caching.
- Cached Islamic content.
- Offline access to favorites.
- Persistent Tasbih progress.
- Reliable application updates.

The application must remain functional when the user has no internet connection after the initial content has been cached.

## 11. Development Approach

Before implementation:

1. Analyze the requirements.
2. Propose a clean architecture.
3. Define the project folder structure.
4. Establish the visual design system.
5. Define the Islamic content data schema.
6. Identify the PWA and GitHub Pages deployment requirements.

Then implement the application progressively.

Prioritize:
1. Premium UI/UX.
2. Correct and authentic Islamic content.
3. Mobile-first responsiveness.
4. PWA and offline functionality.
5. Performance and maintainability.

Do not build everything into one large component. Keep the application modular and easy to extend.

## 12. Expected Deliverable

Deliver a complete, production-ready application that:

- Looks and feels like a premium Islamic mobile application.
- Works perfectly on desktop and mobile.
- Supports Arabic and full RTL.
- Is installable as a PWA.
- Works offline.
- Contains a comprehensive collection of authentic Duas and Adhkar.
- Can be deployed directly to GitHub Pages.
- Has a clean, scalable architecture.

**Important:** Do not settle for a basic prototype or generic dashboard. Pay particular attention to the visual quality, Arabic typography, animations, navigation, and overall user experience.

Build something that Muslims would genuinely enjoy opening every single day.