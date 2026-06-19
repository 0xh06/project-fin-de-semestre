'use client'

import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Star, Zap, Trophy, Flame } from 'lucide-react'

interface XPProgressBarProps {
  currentXP: number
  level: number
  xpToNextLevel: number
  xpGain?: number
  onXPAnimationComplete?: () => void
}

export function XPProgressBar({
  currentXP,
  level,
  xpToNextLevel,
  xpGain = 0,
  onXPAnimationComplete
}: XPProgressBarProps) {
  const [displayXP, setDisplayXP] = useState(currentXP)
  const [displayLevel, setDisplayLevel] = useState(level)
  const [showXPAnimation, setShowXPAnimation] = useState(false)
  const [animatedXP, setAnimatedXP] = useState(0)

  useEffect(() => {
    if (xpGain > 0) {
      setShowXPAnimation(true)
      setAnimatedXP(xpGain)
      
      // Animate XP gain
      let progress = 0
      const animationInterval = setInterval(() => {
        progress += 1
        if (progress >= 20) {
          clearInterval(animationInterval)
          setTimeout(() => {
            setShowXPAnimation(false)
            setAnimatedXP(0)
            onXPAnimationComplete?.()
          }, 1000)
        }
      }, 50)
    }
  }, [xpGain, onXPAnimationComplete])

  useEffect(() => {
    // Animate current XP when it changes
    const diff = currentXP - displayXP
    if (Math.abs(diff) > 0) {
      const steps = 20
      const increment = diff / steps
      let step = 0
      
      const interval = setInterval(() => {
        step++
        setDisplayXP(prev => prev + increment)
        if (step >= steps) {
          clearInterval(interval)
          setDisplayXP(currentXP)
        }
      }, 30)
    }
  }, [currentXP, displayXP])

  useEffect(() => {
    setDisplayLevel(level)
  }, [level])

  const progressPercentage = (currentXP / (currentXP + xpToNextLevel)) * 100

  const getLevelIcon = (lvl: number) => {
    if (lvl < 5) return <Star className="h-4 w-4" />
    if (lvl < 10) return <Zap className="h-4 w-4" />
    if (lvl < 20) return <Flame className="h-4 w-4" />
    return <Trophy className="h-4 w-4" />
  }

  const getLevelColor = (lvl: number) => {
    if (lvl < 5) return 'text-yellow-500'
    if (lvl < 10) return 'text-blue-500'
    if (lvl < 20) return 'text-orange-500'
    return 'text-purple-500'
  }

  return (
    <div className="relative">
      {/* XP Gain Animation */}
      {showXPAnimation && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg animate-bounce">
            +{animatedXP} XP
          </div>
        </div>
      )}

      {/* Level Badge */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground ${getLevelColor(displayLevel)}`}>
          {getLevelIcon(displayLevel)}
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">Niveau {displayLevel}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(displayXP)} XP
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {xpToNextLevel} XP jusqu'au niveau suivant
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(displayXP)} XP</span>
          <span>{Math.round(displayXP + xpToNextLevel)} XP</span>
        </div>
      </div>

      {/* Level Up Animation */}
      {xpGain > 0 && displayLevel > level && (
        <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20 animate-pulse">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">Niveau supérieur atteint!</span>
          </div>
        </div>
      )}
    </div>
  )
}
