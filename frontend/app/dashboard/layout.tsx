'use client'

import { Sidebar } from '@/components/sidebar'
import { useEffect, useState } from 'react'
import { gamificationApi } from '@/lib/api'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [stats, setStats] = useState({
    xp: 0,
    level: 0,
    xpToNext: 0,
    streak: 0,
  })

  useEffect(() => {
    // Load user stats
    gamificationApi.getDashboard()
      .then(data => setStats({
        xp: data.xp_total,
        level: data.level,
        xpToNext: data.xp_to_next_level,
        streak: data.streak_days,
      }))
      .catch(console.error)
  }, [])

  return (
    <div className="flex h-screen">
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
