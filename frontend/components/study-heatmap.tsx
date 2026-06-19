'use client'

import { Flame, Calendar } from 'lucide-react'

interface StudyHeatmapProps {
  data: number[] // Array of 30 days, each representing study minutes
  currentStreak: number
  longestStreak: number
}

export function StudyHeatmap({ data, currentStreak, longestStreak }: StudyHeatmapProps) {
  // Calculate intensity levels (0-4) based on study minutes
  const getIntensity = (minutes: number) => {
    if (minutes === 0) return 0
    if (minutes < 15) return 1
    if (minutes < 30) return 2
    if (minutes < 60) return 3
    return 4
  }

  // Get color class based on intensity
  const getColorClass = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-secondary'
      case 1: return 'bg-green-200 dark:bg-green-900'
      case 2: return 'bg-green-300 dark:bg-green-800'
      case 3: return 'bg-green-400 dark:bg-green-700'
      case 4: return 'bg-green-500 dark:bg-green-600'
      default: return 'bg-secondary'
    }
  }

  // Generate day labels (last 30 days)
  const getDayLabel = (index: number) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - index))
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // Calculate total study time
  const totalStudyTime = data.reduce((sum, minutes) => sum + minutes, 0)
  const averageStudyTime = totalStudyTime / data.length

  // Get streak color
  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'text-muted-foreground'
    if (streak < 7) return 'text-orange-400'
    if (streak < 14) return 'text-orange-500'
    if (streak < 30) return 'text-orange-600'
    return 'text-orange-700'
  }

  return (
    <div className="w-full">
      {/* Streak Display */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${currentStreak > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-secondary'}`}>
            <Flame className={`h-6 w-6 ${getStreakColor(currentStreak)}`} />
          </div>
          <div>
            <div className="text-2xl font-bold">{currentStreak} jours</div>
            <div className="text-sm text-muted-foreground">Streak actuel</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{longestStreak} jours</div>
          <div className="text-sm text-muted-foreground">Record</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>30 derniers jours</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-6 gap-2">
          {data.map((minutes, index) => {
            const intensity = getIntensity(minutes)
            const dayLabel = getDayLabel(index)
            
            return (
              <div
                key={index}
                className="group relative"
                title={`${dayLabel}: ${minutes} min`}
              >
                <div
                  className={`h-10 w-full rounded-md ${getColorClass(intensity)} transition-all hover:scale-110 cursor-pointer`}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  <div className="font-medium">{dayLabel}</div>
                  <div>{minutes} min d'étude</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Moins</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-3 w-3 rounded-sm ${getColorClass(level)}`}
              />
            ))}
          </div>
          <span>Plus</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold">{totalStudyTime} min</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{Math.round(averageStudyTime)} min</div>
            <div className="text-xs text-muted-foreground">Moyenne/jour</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{data.filter(m => m > 0).length}</div>
            <div className="text-xs text-muted-foreground">Jours actifs</div>
          </div>
        </div>
      </div>
    </div>
  )
}
