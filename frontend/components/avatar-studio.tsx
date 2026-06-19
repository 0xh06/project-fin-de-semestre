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
  const faceColor = config.skinTone
  const hairColor = config.hairColor
  const outfitColor = config.outfitColor

  return (
    <div className={cn('relative overflow-hidden rounded-[28px] border border-white/10 bg-card/30 shadow-2xl', className)}>
      <div className={cn('absolute inset-0 bg-gradient-to-br', backgroundTheme.gradient)} />
      <div className={cn('absolute inset-3 rounded-[22px] border border-white/5', backgroundTheme.accent)} />
      <div className={cn('absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_44%)]', config.background === 'matrix' ? 'animate-pulse' : '')} />
      <svg viewBox="0 0 120 160" className="relative z-10 h-full w-full" shapeRendering="crispEdges">
        <rect x="0" y="0" width="120" height="160" fill="transparent" />
        <rect x="34" y="112" width="52" height="8" rx="4" fill="rgba(15,23,42,0.28)" />

        {/* Body */}
        <rect x="42" y="90" width="36" height="28" fill={outfitColor} />
        <rect x="38" y="96" width="8" height="20" fill={outfitColor} />
        <rect x="74" y="96" width="8" height="20" fill={outfitColor} />
        <rect x="48" y="82" width="24" height="16" fill={outfitColor} />
        {config.outfit === 'overalls' && (
          <>
            <rect x="48" y="82" width="8" height="16" fill="#3E4F6D" />
            <rect x="56" y="82" width="8" height="16" fill="#3E4F6D" />
            <rect x="64" y="82" width="8" height="16" fill="#3E4F6D" />
            <rect x="51" y="88" width="6" height="6" fill="#E2E8F0" />
            <rect x="63" y="88" width="6" height="6" fill="#E2E8F0" />
          </>
        )}

        {/* Head */}
        <rect x="42" y="46" width="36" height="34" fill={faceColor} />
        <rect x="42" y="80" width="36" height="6" fill={faceColor} />

        {/* Hair */}
        {config.hairStyle === 'short' && (
          <>
            <rect x="38" y="36" width="44" height="16" fill={hairColor} />
            <rect x="42" y="52" width="36" height="8" fill={hairColor} />
          </>
        )}
        {config.hairStyle === 'long' && (
          <>
            <rect x="38" y="34" width="44" height="20" fill={hairColor} />
            <rect x="34" y="54" width="10" height="24" fill={hairColor} />
            <rect x="76" y="54" width="10" height="24" fill={hairColor} />
          </>
        )}
        {config.hairStyle === 'spiky' && (
          <>
            <rect x="38" y="34" width="44" height="10" fill={hairColor} />
            <rect x="42" y="44" width="6" height="10" fill={hairColor} />
            <rect x="56" y="40" width="8" height="14" fill={hairColor} />
            <rect x="68" y="44" width="6" height="10" fill={hairColor} />
          </>
        )}
        {config.hairStyle === 'bun' && (
          <>
            <rect x="42" y="28" width="36" height="14" fill={hairColor} />
            <rect x="48" y="18" width="24" height="16" fill={hairColor} />
          </>
        )}
        {config.hairStyle === 'fluffy' && (
          <>
            <rect x="38" y="30" width="44" height="18" fill={hairColor} />
            <rect x="34" y="46" width="10" height="16" fill={hairColor} />
            <rect x="76" y="46" width="10" height="16" fill={hairColor} />
          </>
        )}

        {/* Eyes and expressions */}
        <rect x="50" y="58" width="6" height="6" fill="#111827" />
        <rect x="64" y="58" width="6" height="6" fill="#111827" />
        {config.mood === 'wink' && <rect x="64" y="60" width="8" height="2" fill="#111827" />}
        {config.mood === 'surprised' && <rect x="58" y="66" width="4" height="4" fill="#8F3B2E" />}

        {/* Mouth */}
        {config.mood === 'happy' && <rect x="54" y="68" width="12" height="3" fill="#8F3B2E" />}
        {(config.mood === 'neutral' || config.mood === 'cool' || config.mood === 'thinking') && <rect x="56" y="68" width="8" height="2" fill="#8F3B2E" />}

        {/* Accessories */}
        {config.accessory === 'glasses' && (
          <>
            <rect x="46" y="56" width="10" height="8" fill="none" stroke="#D6E4FF" strokeWidth="2" />
            <rect x="64" y="56" width="10" height="8" fill="none" stroke="#D6E4FF" strokeWidth="2" />
            <rect x="56" y="59" width="8" height="2" fill="#D6E4FF" />
          </>
        )}

        {config.accessory === 'headset' && (
          <>
            <rect x="42" y="56" width="8" height="14" fill="#CBD5E1" />
            <rect x="70" y="56" width="8" height="14" fill="#CBD5E1" />
            <rect x="48" y="50" width="24" height="6" fill="none" stroke="#CBD5E1" strokeWidth="2" />
          </>
        )}

        {config.accessory === 'crown' && (
          <>
            <rect x="48" y="30" width="8" height="6" fill="#F4C542" />
            <rect x="56" y="26" width="8" height="8" fill="#F4C542" />
            <rect x="64" y="30" width="8" height="6" fill="#F4C542" />
          </>
        )}

        {config.accessory === 'visor' && <rect x="44" y="46" width="32" height="10" fill="#60A5FA" opacity="0.9" />}
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
