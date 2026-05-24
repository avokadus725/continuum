/* Shared cover palette for collections.
   Keep the keys in sync with the `cover` column in the DB. */

export type CoverKey =
  | 'default'
  | 'blue'
  | 'green'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'slate'

export interface CoverPalette {
  tint: string  // background of the cover band
  deep: string  // accent dot / strong colour
  soft: string  // not currently used but available for future use
}

export const COVERS: Record<CoverKey, CoverPalette> = {
  default: { tint: '#EFECE3', deep: '#717784', soft: '#D8D4C8' },
  blue:    { tint: '#E8F0F9', deep: '#005CAB', soft: '#C9DDEF' },
  green:   { tint: '#E2F2EB', deep: '#0F8A6A', soft: '#BFE0CF' },
  amber:   { tint: '#F5EBD8', deep: '#9C7B3A', soft: '#E5D2A3' },
  rose:    { tint: '#F5E4E4', deep: '#B14545', soft: '#E5C0C0' },
  violet:  { tint: '#E9E3F2', deep: '#5E4AB1', soft: '#CFC4E5' },
  slate:   { tint: '#E7EAEF', deep: '#445166', soft: '#C5CCD7' },
}

export const COVER_KEYS: CoverKey[] = ['default', 'blue', 'green', 'amber', 'rose', 'violet', 'slate']

export const DEFAULT_EMOJI = '📚'
export const EMOJI_PICKER: string[] = [
  '📚','🧮','📐','🌐','🛠','🎨','🧠','💡','🔬','📝','⚛','🎯',
  '✏','📊','💻','🎓','📖','🗂','🧬','⚙','🔢','📓','🎬','🌍',
]
