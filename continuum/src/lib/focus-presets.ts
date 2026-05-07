export type BgType = 'image' | 'video'
export type SoundType = 'file' | 'stream' // stream = майбутня монетизація

export interface BackgroundPreset {
  id: string
  labelKey: string   // ключ для i18n
  type: BgType
  src: string        // local path under /public
  thumbnail: string  // same or smaller version
}

export interface SoundPreset {
  id: string
  labelKey: string
  icon: string
  type: SoundType
  src: string | null // null = файл ще не додано
  isPremium?: boolean // для майбутнього преміуму
}

// All backgrounds now served from /public/backgrounds/
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'forest',
    labelKey: 'forest',
    type: 'image',
    src: '/backgrounds/forest.jpg',
    thumbnail: '/backgrounds/forest.jpg',
  },
  {
    id: 'rain',
    labelKey: 'rain',
    type: 'image',
    src: '/backgrounds/rain.jpg',
    thumbnail: '/backgrounds/rain.jpg',
  },
  {
    id: 'ocean',
    labelKey: 'ocean',
    type: 'image',
    src: '/backgrounds/ocean.jpg',
    thumbnail: '/backgrounds/ocean.jpg',
  },
  {
    id: 'cafe',
    labelKey: 'cafe',
    type: 'image',
    src: '/backgrounds/cafe.jpg',
    thumbnail: '/backgrounds/cafe.jpg',
  },
  {
    id: 'fireplace',
    labelKey: 'fireplace',
    type: 'image',
    src: '/backgrounds/fireplace.jpg',
    thumbnail: '/backgrounds/fireplace.jpg',
  },
  {
    id: 'underwater',
    labelKey: 'underwater',
    type: 'image',
    src: '/backgrounds/underwater.jpg',
    thumbnail: '/backgrounds/underwater.jpg',
  },
  {
    id: 'whitenoise',
    labelKey: 'whitenoise',
    type: 'image',
    src: '/backgrounds/whitenoise.jpg',
    thumbnail: '/backgrounds/whitenoise.jpg',
  },
]

// Maps sound ID → matching background ID.
// 'none' keeps the current background (no auto-switch).
export const SOUND_TO_BG: Record<string, string> = {
  rain:       'rain',
  forest:     'forest',
  cafe:       'cafe',
  fireplace:  'fireplace',
  ocean:      'ocean',
  underwater: 'underwater',
  whitenoise: 'whitenoise',
}

// Файли звуків
export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'none',
    labelKey: 'none',
    icon: '🔇',
    type: 'file',
    src: null,
  },
  {
    id: 'rain',
    labelKey: 'rain',
    icon: '🌧️',
    type: 'file',
    src: '/sounds/rain.mp3',
  },
  {
    id: 'forest',
    labelKey: 'forest',
    icon: '🌲',
    type: 'file',
    src: '/sounds/forest.mp3',
  },
  {
    id: 'cafe',
    labelKey: 'cafe',
    icon: '☕',
    type: 'file',
    src: '/sounds/cafe.mp3',
  },
  {
    id: 'fireplace',
    labelKey: 'fireplace',
    icon: '🔥',
    type: 'file',
    src: '/sounds/fireplace.mp3',
  },
  {
    id: 'ocean',
    labelKey: 'ocean',
    icon: '🌊',
    type: 'file',
    src: '/sounds/ocean.mp3',
  },
  {
    id: 'underwater',
    labelKey: 'underwater',
    icon: '💧',
    type: 'file',
    src: '/sounds/underwater.mp3',
  },
  {
    id: 'whitenoise',
    labelKey: 'whitenoise',
    icon: '〰️',
    type: 'file',
    src: '/sounds/whitenoise.mp3',
  },
]

export const DEFAULT_WORK_MINUTES = 25
export const DEFAULT_BREAK_MINUTES = 5
