export type BgType = 'image' | 'video'
export type SoundType = 'file' | 'stream' // stream = майбутня монетизація

export interface BackgroundPreset {
  id: string
  labelKey: string   // ключ для i18n
  type: BgType
  src: string        // URL або /backgrounds/...
  thumbnail: string  // URL прев'ю
}

export interface SoundPreset {
  id: string
  labelKey: string
  icon: string
  type: SoundType
  src: string | null // null = файл ще не додано
  isPremium?: boolean // для майбутнього преміуму
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'forest',
    labelKey: 'forest',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=60&fit=crop',
  },
  {
    id: 'mountain',
    labelKey: 'mountain',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=60&fit=crop',
  },
  {
    id: 'rain',
    labelKey: 'rain',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1477601263568-180e2c6d046e?w=1920&q=80&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1477601263568-180e2c6d046e?w=400&q=60&fit=crop',
  },
  {
    id: 'library',
    labelKey: 'library',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=80&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=60&fit=crop',
  },
  {
    id: 'space',
    labelKey: 'space',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=60&fit=crop',
  },
]

// Файли звуків: додай у /public/sounds/
// Безкоштовні джерела: https://pixabay.com/sound-effects/ або https://freesound.org
// Рекомендовані пошукові запити: "rain ambience", "coffee shop ambience",
// "forest birds", "fireplace crackling", "white noise"
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
    id: 'whitenoise',
    labelKey: 'whitenoise',
    icon: '〰️',
    type: 'file',
    src: '/sounds/whitenoise.mp3',
  },
]

export const DEFAULT_WORK_MINUTES = 25
export const DEFAULT_BREAK_MINUTES = 5
