'use client'

import { Sidebar } from '@/components/sidebar'
import { useEffect, useState } from 'react'
import { gamificationApi } from '@/lib/api'
import { getProgress } from '@/lib/progress'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [stats, setStats] = useState({ xp: 0, level: 1, xpToNext: 500, streak: 0 })

  useEffect(() => {
    // Load from localStorage immediately (no flicker)
    const local = getProgress()
    setStats({
      xp: local.xp_total,
      level: local.level,
      xpToNext: local.xp_to_next_level,
      streak: local.streak_days,
    })

    // Then try API
    gamificationApi.getDashboard()
      .then(data => setStats({
        xp: data.xp_total,
        level: data.level,
        xpToNext: data.xp_to_next_level,
        streak: data.streak_days,
      }))
      .catch(() => {
        // Keep local progress (already set above)
      })
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        xp={stats.xp}
        level={stats.level}
        xpToNext={stats.xpToNext}
        streak={stats.streak}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
