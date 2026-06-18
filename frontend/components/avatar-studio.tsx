'use client'

import { Button } from '@/components/ui/button'
import {
  avatarAccessories,
  avatarBackgrounds,
  avatarHairColors,
  avatarHairStyles,
  avatarMoods,
  avatarOutfitColors,
  avatarOutfits,
  avatarPresets,
  avatarSkinTones,
  createRandomAvatar,
  getAvatarBackgroundTheme,
  getAvatarRank,
  normalizeAvatarConfig,
} from '@/lib/avatar'
import { cn } from '@/lib/utils'
import type { AvatarConfig } from '@/types'
import { Crown, Glasses, Headphones, Shuffle, Sparkles, Lock } from 'lucide-react'
import type { ReactNode } from 'react'

interface AvatarFigureProps {
  avatar?: Partial<AvatarConfig> | null
  className?: string
}

interface AvatarStudioProps {
  value?: Partial<AvatarConfig> | null
  onChange: (nextAvatar: AvatarConfig) => void
  userName?: string
  level?: number
}

function AvatarAccessoryIcon({ accessory }: { accessory: AvatarConfig['accessory'] }) {
  if (accessory === 'glasses') return <Glasses className="h-4 w-4" />
  if (accessory === 'headset') return <Headphones className="h-4 w-4" />
  if (accessory === 'crown') return <Crown className="h-4 w-4" />
  return <Sparkles className="h-4 w-4" />
}

function AvatarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground/80">{title}</p>
      {children}
    </div>
  )
}

function ChoiceChip({
  active,
  onClick,
  disabled = false,
  minLevel,
  children,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  minLevel?: number
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'relative rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 overflow-hidden flex items-center justify-center gap-1.5',
        active
          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(99,102,241,0.22)]'
          : disabled
            ? 'border-border/20 bg-secondary/10 text-muted-foreground/40 cursor-not-allowed opacity-60'
            : 'border-border/40 bg-secondary/20 text-muted-foreground hover:border-border hover:bg-secondary/40 hover:text-foreground'
      )}
    >
      {disabled && minLevel && (
        <Lock className="h-3 w-3 text-muted-foreground/60" />
      )}
      <span>{children}</span>
      {disabled && minLevel && (
        <span className="absolute bottom-0 right-0 rounded-tl-md bg-secondary/80 px-1 py-[1px] text-[8px] font-bold">
          Nv.{minLevel}
        </span>
      )}
    </button>
  )
}

function ColorChip({
  color,
  active,
  onClick,
}: {
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-10 w-10 rounded-xl border-2 transition-all duration-200',
        active ? 'border-white shadow-[0_0_0_3px_rgba(99,102,241,0.4)]' : 'border-white/10 hover:scale-105'
      )}
      style={{ backgroundColor: color }}
      aria-label={`Couleur ${color}`}
    />
  )
}

export function AvatarFigure({ avatar, className }: AvatarFigureProps) {
  const config = normalizeAvatarConfig(avatar)
  const backgroundTheme = getAvatarBackgroundTheme(config.background)
  const faceShadow = 'rgba(17, 24, 39, 0.18)'
  const stroke = 'rgba(15, 23, 42, 0.45)'

  const renderHair = () => {
    switch (config.hairStyle) {
      case 'short':
        return (
          <>
            <path d="M42 43c0-14 8-24 19-24s19 10 19 24v6H42z" fill={config.hairColor} />
            <path d="M42 44c5-7 12-10 18-10 8 0 14 2 20 10" fill="none" stroke={stroke} strokeWidth="2" />
          </>
        )
      case 'long':
        return (
          <>
            <path d="M39 44c0-17 9-27 21-27s21 10 21 27v19H39z" fill={config.hairColor} />
            <path d="M45 78V43m30 35V43" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
          </>
        )
      case 'spiky':
        return (
          <>
            <path d="M38 44l7-15 7 8 8-13 7 11 8-9 7 18v5H38z" fill={config.hairColor} />
            <path d="M42 45h36" stroke={stroke} strokeWidth="2" />
          </>
        )
      case 'bun':
        return (
          <>
            <circle cx="60" cy="20" r="9" fill={config.hairColor} />
            <path d="M40 44c0-16 8-25 20-25s20 9 20 25v4H40z" fill={config.hairColor} />
          </>
        )
      case 'fluffy':
      default:
        return (
          <>
            <path d="M39 47c0-14 8-24 21-24 5 0 9 1 13 4l5 4c2 2 3 5 3 8v8H39z" fill={config.hairColor} />
            <circle cx="46" cy="35" r="7" fill={config.hairColor} />
            <circle cx="57" cy="28" r="8" fill={config.hairColor} />
            <circle cx="69" cy="29" r="8" fill={config.hairColor} />
            <circle cx="76" cy="36" r="6" fill={config.hairColor} />
          </>
        )
    }
  }

  const renderEyes = () => {
    switch (config.mood) {
      case 'happy':
        return (
          <>
            <path d="M49 49c2 3 6 3 8 0" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" className="animate-blink origin-center" />
            <path d="M63 49c2 3 6 3 8 0" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" className="animate-blink origin-center" />
          </>
        )
      case 'cool':
        return (
          <>
            <rect x="47" y="47" width="11" height="6" rx="3" fill="#111827" />
            <rect x="62" y="47" width="11" height="6" rx="3" fill="#111827" />
          </>
        )
      case 'surprised':
        return (
          <>
            <circle cx="53" cy="50" r="3.5" fill="#111827" />
            <circle cx="67" cy="50" r="3.5" fill="#111827" />
          </>
        )
      case 'thinking':
        return (
          <>
            <path d="M47 49c3-2 7-2 10 0" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M63 49c3-2 7-2 10 0" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )
      case 'wink':
        return (
          <>
            <circle cx="53" cy="50" r="2.8" fill="#111827" />
            <path d="M63 50h8" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )
      case 'neutral':
      default:
        return (
          <>
            <circle cx="53" cy="50" r="2.4" fill="#111827" className="animate-blink origin-center" />
            <circle cx="67" cy="50" r="2.4" fill="#111827" className="animate-blink origin-center" />
          </>
        )
    }
  }

  const renderMouth = () => {
    switch (config.mood) {
      case 'happy':
        return <path d="M52 61c3 4 13 4 16 0" fill="none" stroke="#8F3B2E" strokeWidth="2.8" strokeLinecap="round" />
      case 'surprised':
        return <circle cx="60" cy="61" r="3.5" fill="#8F3B2E" />
      case 'thinking':
        return <path d="M54 61c4-1 8-1 12 0" fill="none" stroke="#8F3B2E" strokeWidth="2.3" strokeLinecap="round" />
      case 'wink':
        return <path d="M55 62c3 1 8 1 10-1" fill="none" stroke="#8F3B2E" strokeWidth="2.3" strokeLinecap="round" />
      case 'cool':
        return <path d="M54 61h12" fill="none" stroke="#8F3B2E" strokeWidth="2.4" strokeLinecap="round" />
      case 'neutral':
      default:
        return <path d="M55 61h10" fill="none" stroke="#8F3B2E" strokeWidth="2.2" strokeLinecap="round" />
    }
  }

  const renderOutfit = () => {
    switch (config.outfit) {
      case 'hoodie':
        return (
          <>
            <path d="M34 110c2-16 14-26 26-26s24 10 26 26H34z" fill={config.outfitColor} />
            <path d="M45 88c3-5 9-9 15-9s12 4 15 9l-8 9H53z" fill="rgba(255,255,255,0.16)" />
            <path d="M56 90l4 16 4-16" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          </>
        )
      case 'shirt':
        return (
          <>
            <path d="M36 110c3-15 13-24 24-24 12 0 22 9 24 24H36z" fill={config.outfitColor} />
            <path d="M49 86h22l-4 9H53z" fill="#F8FAFC" />
          </>
        )
      case 'overalls':
        return (
          <>
            <path d="M37 110c3-15 12-24 23-24 11 0 20 9 23 24H37z" fill="#3E4F6D" />
            <path d="M46 87h28v23H46z" fill={config.outfitColor} />
            <path d="M49 87l-4 17M71 87l4 17" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
            <circle cx="54" cy="98" r="1.8" fill="#E2E8F0" />
            <circle cx="66" cy="98" r="1.8" fill="#E2E8F0" />
          </>
        )
      case 'trench':
        return (
          <>
            <path d="M35 110c4-16 14-25 25-25 11 0 21 9 25 25H35z" fill={config.outfitColor} />
            <path d="M46 87l14 8 14-8-6 18H52z" fill="rgba(255,255,255,0.18)" />
          </>
        )
      case 'tshirt':
      default:
        return (
          <>
            <path d="M34 110c4-15 13-24 26-24s22 9 26 24H34z" fill={config.outfitColor} />
            <path d="M47 87h26" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round" />
          </>
        )
    }
  }

  const renderAccessory = () => {
    switch (config.accessory) {
      case 'glasses':
        return (
          <>
            <rect x="45" y="45" width="12" height="9" rx="3" fill="none" stroke="#D6E4FF" strokeWidth="2.2" />
            <rect x="63" y="45" width="12" height="9" rx="3" fill="none" stroke="#D6E4FF" strokeWidth="2.2" />
            <path d="M57 49h6" stroke="#D6E4FF" strokeWidth="2" />
          </>
        )
      case 'headset':
        return (
          <>
            <path d="M44 45c0-11 7-18 16-18s16 7 16 18" fill="none" stroke="#CBD5E1" strokeWidth="3" />
            <rect x="40" y="49" width="5" height="11" rx="2.5" fill="#CBD5E1" />
            <rect x="75" y="49" width="5" height="11" rx="2.5" fill="#CBD5E1" />
          </>
        )
      case 'crown':
        return (
          <>
            <path d="M43 31l7 6 10-11 10 11 7-6 3 11H40z" fill="#F4C542" />
            <circle cx="50" cy="37" r="2" fill="#FDE68A" />
            <circle cx="60" cy="29" r="2.2" fill="#FDE68A" />
            <circle cx="70" cy="37" r="2" fill="#FDE68A" />
          </>
        )
      case 'visor':
        return (
          <>
            <path d="M44 44c5-5 12-8 16-8 7 0 13 2 17 8l-3 7H47z" fill="#60A5FA" fillOpacity="0.85" />
            <path d="M47 51h27" stroke="#DBEAFE" strokeWidth="1.8" strokeLinecap="round" />
          </>
        )
      case 'none':
      default:
        return null
    }
  }

  return (
    <div className={cn('relative overflow-hidden rounded-[28px] border border-white/10 bg-card/30 shadow-2xl', className)}>
      <div className={cn('absolute inset-0 bg-gradient-to-br', backgroundTheme.gradient)} />
      <div className={cn('absolute inset-3 rounded-[22px] border border-white/5', backgroundTheme.accent)} />
      {/* Rendu des effets d'arrière-plan avec animation optionnelle */}
      <div className={cn("absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_44%)]", config.background === 'matrix' ? 'animate-pulse' : '')} />
      <svg viewBox="0 0 120 140" className="relative z-10 h-full w-full animate-float">
        <ellipse cx="60" cy="118" rx="26" ry="8" fill="rgba(15,23,42,0.28)" />
        <path d="M55 70h10v14H55z" fill={config.skinTone} />
        {renderOutfit()}
        <circle cx="40" cy="51" r="4.5" fill={config.skinTone} opacity="0.95" />
        <circle cx="80" cy="51" r="4.5" fill={config.skinTone} opacity="0.95" />
        <circle cx="60" cy="50" r="21" fill={config.skinTone} />
        <ellipse cx="60" cy="57" rx="15" ry="10" fill={faceShadow} opacity="0.07" />
        {renderHair()}
        {renderAccessory()}
        {renderEyes()}
        {renderMouth()}
      </svg>
    </div>
  )
}

export function AvatarStudio({ value, onChange, userName = 'CodeMaster', level = 1 }: AvatarStudioProps) {
  const avatar = normalizeAvatarConfig(value)

  const updateAvatar = (patch: Partial<AvatarConfig>) => {
    onChange(normalizeAvatarConfig({ ...avatar, ...patch }))
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="rounded-[28px] border border-border/40 bg-card/40 p-4 shadow-xl shadow-primary/5">
          <AvatarFigure avatar={avatar} className="mx-auto aspect-[6/7] w-full max-w-[220px]" />
          <div className="mt-4 rounded-2xl border border-white/5 bg-black/10 p-3">
            <p className="text-center text-lg font-bold">{userName}</p>
            <p className="text-center text-xs uppercase tracking-[0.24em] text-primary/80">Avatar {getAvatarRank(level)}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange(createRandomAvatar())}
              className="mt-4 w-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Générer un style
            </Button>
          </div>
        </div>

        <div className="rounded-[24px] border border-border/40 bg-card/30 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Styles prédéfinis
          </div>
          <div className="grid gap-2">
            {avatarPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(preset.config)}
                className="rounded-2xl border border-border/40 bg-secondary/20 px-3 py-3 text-left transition-all hover:border-primary/30 hover:bg-secondary/40"
              >
                <div className="text-sm font-semibold">{preset.name}</div>
                <div className="text-xs text-muted-foreground">{preset.subtitle}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6 rounded-[28px] border border-border/40 bg-card/35 p-5 shadow-xl shadow-primary/5">
        <div className="flex flex-col gap-3 border-b border-border/30 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight">Personnalisation</h3>
            <p className="text-sm text-muted-foreground">Configure ton identité numérique et vois l’aperçu en direct.</p>
          </div>
          <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Sauvegarde locale
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <AvatarSection title="Teint de peau">
            <div className="flex flex-wrap gap-3">
              {avatarSkinTones.map((tone) => (
                <ColorChip
                  key={tone.value}
                  color={tone.value}
                  active={avatar.skinTone === tone.value}
                  onClick={() => updateAvatar({ skinTone: tone.value })}
                />
              ))}
            </div>
          </AvatarSection>

          <AvatarSection title="Couleur capillaire">
            <div className="flex flex-wrap gap-3">
              {avatarHairColors.map((tone) => (
                <ColorChip
                  key={tone.value}
                  color={tone.value}
                  active={avatar.hairColor === tone.value}
                  onClick={() => updateAvatar({ hairColor: tone.value })}
                />
              ))}
            </div>
          </AvatarSection>

          <AvatarSection title="Coupe de cheveux">
            <div className="flex flex-wrap gap-2">
              {avatarHairStyles.map((style) => (
                <ChoiceChip
                  key={style.value}
                  active={avatar.hairStyle === style.value}
                  onClick={() => updateAvatar({ hairStyle: style.value })}
                >
                  {style.label}
                </ChoiceChip>
              ))}
            </div>
          </AvatarSection>

          <AvatarSection title="Humeur">
            <div className="flex flex-wrap gap-2">
              {avatarMoods.map((mood) => (
                <ChoiceChip
                  key={mood.value}
                  active={avatar.mood === mood.value}
                  onClick={() => updateAvatar({ mood: mood.value })}
                >
                  {mood.label}
                </ChoiceChip>
              ))}
            </div>
          </AvatarSection>

          <AvatarSection title="Vêtements">
            <div className="flex flex-wrap gap-2">
              {avatarOutfits.map((outfit) => (
                <ChoiceChip
                  key={outfit.value}
                  active={avatar.outfit === outfit.value}
                  onClick={() => updateAvatar({ outfit: outfit.value })}
                >
                  {outfit.label}
                </ChoiceChip>
              ))}
            </div>
          </AvatarSection>

          <AvatarSection title="Couleur tenue">
            <div className="flex flex-wrap gap-3">
              {avatarOutfitColors.map((tone) => (
                <ColorChip
                  key={tone.value}
                  color={tone.value}
                  active={avatar.outfitColor === tone.value}
                  onClick={() => updateAvatar({ outfitColor: tone.value })}
                />
              ))}
            </div>
          </AvatarSection>

          <AvatarSection title="Fond d’avatar">
            <div className="flex flex-wrap gap-2">
              {avatarBackgrounds.map((background) => (
                <ChoiceChip
                  key={background.value}
                  active={avatar.background === background.value}
                  onClick={() => updateAvatar({ background: background.value })}
                >
                  {background.label}
                </ChoiceChip>
              ))}
            </div>
          </AvatarSection>

          <AvatarSection title="Items de prestige">
            <div className="flex flex-wrap gap-2">
              {avatarAccessories.map((item) => (
                <ChoiceChip
                  key={item.value}
                  active={avatar.accessory === item.value}
                  onClick={() => updateAvatar({ accessory: item.value })}
                  disabled={level < (item.minLevel || 1)}
                  minLevel={item.minLevel}
                >
                  <span className="inline-flex items-center gap-2">
                    <AvatarAccessoryIcon accessory={item.value} />
                    {item.label}
                  </span>
                </ChoiceChip>
              ))}
            </div>
          </AvatarSection>
        </div>
      </div>
    </div>
  )
}
