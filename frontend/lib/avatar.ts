import type {
  AvatarAccessory,
  AvatarBackground,
  AvatarConfig,
  AvatarHairStyle,
  AvatarMood,
  AvatarOutfit,
} from '@/types'

type SwatchOption = {
  value: string
  label: string
}

type ChoiceOption<T extends string> = {
  value: T
  label: string
  minLevel?: number
}

export const USER_UPDATED_EVENT = 'smartstudy:user-updated'

export const avatarSkinTones: SwatchOption[] = [
  { value: '#F7E2C7', label: 'Porcelaine' },
  { value: '#E9C89F', label: 'Miel clair' },
  { value: '#C98A4B', label: 'Ambre' },
  { value: '#8F5A2B', label: 'Ébène chaud' },
]

export const avatarHairColors: SwatchOption[] = [
  { value: '#F04F92', label: 'Rose néon' },
  { value: '#273469', label: 'Bleu nuit' },
  { value: '#7B4B3A', label: 'Châtain' },
  { value: '#E1B12C', label: 'Blond' },
  { value: '#E0523A', label: 'Corail' },
  { value: '#2D9CDB', label: 'Azur' },
  { value: '#8E55D8', label: 'Violet' },
  { value: '#27AE60', label: 'Vert' },
  { value: '#F5F5F5', label: 'Glacier' },
]

export const avatarOutfitColors: SwatchOption[] = [
  { value: '#647DB0', label: 'Bleu acier' },
  { value: '#F05A4A', label: 'Corail' },
  { value: '#37C978', label: 'Émeraude' },
  { value: '#F4C542', label: 'Or' },
  { value: '#B36AE2', label: 'Lavande' },
  { value: '#111111', label: 'Noir' },
  { value: '#F6F7FB', label: 'Blanc' },
]

export const avatarHairStyles: ChoiceOption<AvatarHairStyle>[] = [
  { value: 'short', label: 'Short' },
  { value: 'long', label: 'Long' },
  { value: 'spiky', label: 'Spiky' },
  { value: 'fluffy', label: 'Fluffy' },
  { value: 'bun', label: 'Bun' },
]

export const avatarMoods: ChoiceOption<AvatarMood>[] = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'happy', label: 'Happy' },
  { value: 'cool', label: 'Cool' },
  { value: 'surprised', label: 'Surprised' },
  { value: 'thinking', label: 'Thinking' },
  { value: 'wink', label: 'Wink' },
]

export const avatarOutfits: ChoiceOption<AvatarOutfit>[] = [
  { value: 'tshirt', label: 'T-Shirt', minLevel: 1 },
  { value: 'hoodie', label: 'Hoodie', minLevel: 1 },
  { value: 'shirt', label: 'Shirt', minLevel: 3 },
  { value: 'overalls', label: 'Overalls', minLevel: 5 },
  { value: 'trench', label: 'Trench', minLevel: 10 },
]

export const avatarAccessories: ChoiceOption<AvatarAccessory>[] = [
  { value: 'none', label: 'Minimal', minLevel: 1 },
  { value: 'glasses', label: 'Lunettes', minLevel: 2 },
  { value: 'headset', label: 'Headset', minLevel: 5 },
  { value: 'visor', label: 'Visor', minLevel: 8 },
  { value: 'crown', label: 'Couronne', minLevel: 15 },
]

export const avatarBackgrounds: ChoiceOption<AvatarBackground>[] = [
  { value: 'nebula', label: 'Nébuleuse', minLevel: 1 },
  { value: 'sunset', label: 'Sunset', minLevel: 3 },
  { value: 'midnight', label: 'Midnight', minLevel: 5 },
  { value: 'matrix', label: 'Matrix', minLevel: 10 },
]

export const defaultAvatar: AvatarConfig = {
  skinTone: avatarSkinTones[0].value,
  hairColor: avatarHairColors[0].value,
  hairStyle: 'fluffy',
  mood: 'neutral',
  outfit: 'overalls',
  outfitColor: avatarOutfitColors[0].value,
  accessory: 'none',
  background: 'nebula',
}

export const avatarPresets: Array<{
  id: string
  name: string
  subtitle: string
  config: AvatarConfig
}> = [
  {
    id: 'cyber-punk',
    name: 'Cyber Punk',
    subtitle: 'Look néon futuriste',
    config: {
      skinTone: avatarSkinTones[1].value,
      hairColor: avatarHairColors[0].value,
      hairStyle: 'spiky',
      mood: 'cool',
      outfit: 'hoodie',
      outfitColor: avatarOutfitColors[1].value,
      accessory: 'visor',
      background: 'midnight',
    },
  },
  {
    id: 'grand-sage',
    name: 'Grand Sage',
    subtitle: 'Calme et concentré',
    config: {
      skinTone: avatarSkinTones[0].value,
      hairColor: avatarHairColors[8].value,
      hairStyle: 'long',
      mood: 'thinking',
      outfit: 'trench',
      outfitColor: avatarOutfitColors[4].value,
      accessory: 'glasses',
      background: 'sunset',
    },
  },
  {
    id: 'ace-dev',
    name: 'Ace Dev',
    subtitle: 'Builder du quotidien',
    config: {
      skinTone: avatarSkinTones[2].value,
      hairColor: avatarHairColors[5].value,
      hairStyle: 'short',
      mood: 'happy',
      outfit: 'tshirt',
      outfitColor: avatarOutfitColors[2].value,
      accessory: 'headset',
      background: 'matrix',
    },
  },
  {
    id: 'royal-expert',
    name: 'Royal Expert',
    subtitle: 'Prestige débloqué',
    config: {
      skinTone: avatarSkinTones[1].value,
      hairColor: avatarHairColors[3].value,
      hairStyle: 'bun',
      mood: 'neutral',
      outfit: 'shirt',
      outfitColor: avatarOutfitColors[3].value,
      accessory: 'crown',
      background: 'nebula',
    },
  },
]

const validHairStyles = new Set(avatarHairStyles.map((item) => item.value))
const validMoods = new Set(avatarMoods.map((item) => item.value))
const validOutfits = new Set(avatarOutfits.map((item) => item.value))
const validAccessories = new Set(avatarAccessories.map((item) => item.value))
const validBackgrounds = new Set(avatarBackgrounds.map((item) => item.value))
const validSkinTones = new Set(avatarSkinTones.map((item) => item.value))
const validHairColors = new Set(avatarHairColors.map((item) => item.value))
const validOutfitColors = new Set(avatarOutfitColors.map((item) => item.value))

function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

export function normalizeAvatarConfig(config?: Partial<AvatarConfig> | null): AvatarConfig {
  const merged = { ...defaultAvatar, ...config }

  return {
    skinTone: validSkinTones.has(merged.skinTone) ? merged.skinTone : defaultAvatar.skinTone,
    hairColor: validHairColors.has(merged.hairColor) ? merged.hairColor : defaultAvatar.hairColor,
    hairStyle: validHairStyles.has(merged.hairStyle) ? merged.hairStyle : defaultAvatar.hairStyle,
    mood: validMoods.has(merged.mood) ? merged.mood : defaultAvatar.mood,
    outfit: validOutfits.has(merged.outfit) ? merged.outfit : defaultAvatar.outfit,
    outfitColor: validOutfitColors.has(merged.outfitColor) ? merged.outfitColor : defaultAvatar.outfitColor,
    accessory: validAccessories.has(merged.accessory) ? merged.accessory : defaultAvatar.accessory,
    background: validBackgrounds.has(merged.background) ? merged.background : defaultAvatar.background,
  }
}

export function createRandomAvatar(): AvatarConfig {
  return normalizeAvatarConfig({
    skinTone: pickRandom(avatarSkinTones).value,
    hairColor: pickRandom(avatarHairColors).value,
    hairStyle: pickRandom(avatarHairStyles).value,
    mood: pickRandom(avatarMoods).value,
    outfit: pickRandom(avatarOutfits).value,
    outfitColor: pickRandom(avatarOutfitColors).value,
    accessory: pickRandom(avatarAccessories).value,
    background: pickRandom(avatarBackgrounds).value,
  })
}

export function getAvatarRank(level: number) {
  if (level >= 25) return 'Légende'
  if (level >= 15) return 'Maître'
  if (level >= 8) return 'Expert'
  if (level >= 4) return 'Adepte'
  return 'Novice'
}

export function getAvatarBackgroundTheme(background: AvatarBackground) {
  switch (background) {
    case 'midnight':
      return {
        gradient: 'from-slate-950 via-slate-900 to-indigo-950',
        accent: 'bg-indigo-500/20',
      }
    case 'sunset':
      return {
        gradient: 'from-[#2d1636] via-[#4d2f63] to-[#8e4f42]',
        accent: 'bg-orange-400/20',
      }
    case 'matrix':
      return {
        gradient: 'from-[#07140d] via-[#0d2618] to-[#143820]',
        accent: 'bg-emerald-400/20',
      }
    case 'nebula':
    default:
      return {
        gradient: 'from-[#130d1f] via-[#1d1433] to-[#2f1d4f]',
        accent: 'bg-fuchsia-400/20',
      }
  }
}
