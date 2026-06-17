'use client'

import { Sidebar } from '@/components/sidebar'
import { useEffect, useState } from 'react'
import { gamificationApi } from '@/lib/api'

const MOCK_STATS = {
  xp: 1450,
  level: 4,
  xpToNext: 550,
  streak: 7,
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [stats, setStats] = useState(MOCK_STATS)

  useEffect(() => {
    gamificationApi.getDashboard()
      .then(data => setStats({
        xp: data.xp_total,
        level: data.level,
        xpToNext: data.xp_to_next_level,
        streak: data.streak_days,
      }))
      .catch(() => {
        // Keep mock data when backend is offline
        console.log('Using mock dashboard stats (backend offline)')
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
