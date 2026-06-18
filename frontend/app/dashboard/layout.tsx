'use client'

import { Sidebar } from '@/components/sidebar'
import { PomodoroTimer } from '@/components/pomodoro-timer'
import { useEffect, useState } from 'react'
import { gamificationApi } from '@/lib/api'
import { getProgress } from '@/lib/progress'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [stats, setStats] = useState({ xp: 0, level: 1, xpToNext: 500, streak: 0 })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-card/80 backdrop-blur-xl border-b border-border/50">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="font-bold text-sm">SmartStudy AI</span>
        </div>
        {children}
      </main>
      <PomodoroTimer />
    </div>
  )
}
