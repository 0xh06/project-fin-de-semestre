'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  BrainCircuit,
  MessageSquare,
  Network,
  Settings,
  Flame,
  Star,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/flashcards', label: 'Flashcards', icon: BrainCircuit },
  { href: '/quiz', label: 'Quiz', icon: Star },
  { href: '/chat', label: 'Chat IA', icon: MessageSquare },
  { href: '/mindmap', label: 'Mind Maps', icon: Network },
  { href: '/settings', label: 'Paramètres', icon: Settings },
]

interface SidebarProps {
  xp: number
  level: number
  xpToNext: number
  streak: number
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ xp, level, xpToNext, streak, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [userName, setUserName] = useState('Étudiant')
  const [userEmail, setUserEmail] = useState('user@smartstudy.ai')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        if (u.username) setUserName(u.username)
        if (u.email) setUserEmail(u.email)
      } catch {}
    }
  }, [])

  const xpPercent = xpToNext > 0 ? Math.min((xp / (xp + xpToNext)) * 100, 100) : 0
  const initials = userName.slice(0, 2).toUpperCase()

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={cn(
          'relative flex h-full flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 ease-in-out',
          // Desktop: always visible, collapsible
          'hidden md:flex',
          collapsed ? 'md:w-[72px]' : 'md:w-64',
          // Mobile: overlay when open
          mobileOpen && 'fixed inset-y-0 left-0 z-40 flex w-72'
        )}
      >
      {/* Subtle gradient overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md hover:bg-accent hover:text-foreground transition-colors duration-200"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-border/50 px-4 h-16 shrink-0',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="p-1.5 rounded-lg gradient-primary shadow-md shadow-primary/20">
          <BrainCircuit className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight animate-fade-in">
            Smart<span className="gradient-text">Study</span>
          </span>
        )}
      </div>

      {/* XP & Streak card */}
      <div className={cn(
        'border-b border-border/50 shrink-0',
        collapsed ? 'p-2' : 'p-4'
      )}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="hsl(217.2 32.6% 14%)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="url(#xp-gradient)"
                  strokeWidth="3"
                  strokeDasharray={`${xpPercent}, 100`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="xp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(217.2 91.2% 59.8%)" />
                    <stop offset="100%" stopColor="hsl(250 70% 56%)" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">{level}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-bold text-orange-400">{streak}</span>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Niveau</span>
                <span className="text-sm font-bold gradient-text">{level}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{xp} / {xp + xpToNext} XP</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full gradient-primary transition-all duration-700 ease-out"
                style={{ width: `${xpPercent}%` }}
              />
              <div
                className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
              <span className="text-sm font-semibold text-orange-400">{streak} jour{streak !== 1 ? 's' : ''} de suite</span>
              {streak >= 7 && <span className="text-xs">🔥</span>}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        'flex-1 overflow-y-auto py-3',
        collapsed ? 'px-2' : 'px-3'
      )}>
        <div className="space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon
            const isActive = pathname?.startsWith(item.href)

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    collapsed ? 'justify-center' : 'gap-3',
                    isActive
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                  style={{
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg gradient-primary opacity-[0.12]" />
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full gradient-primary" />
                  )}

                  <Icon className={cn(
                    'relative z-10 h-[18px] w-[18px] shrink-0 transition-transform duration-200',
                    isActive ? 'text-primary' : 'group-hover:scale-110'
                  )} />

                  {!collapsed && (
                    <span className="relative z-10 animate-fade-in">{item.label}</span>
                  )}

                  {/* Tooltip for collapsed mode */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-md bg-card border border-border text-xs font-medium text-foreground opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className={cn(
        'border-t border-border/50 shrink-0',
        collapsed ? 'p-2' : 'p-3'
      )}>
        <div className={cn(
          'flex items-center rounded-lg p-2 hover:bg-accent/50 transition-colors duration-200 cursor-pointer',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-white text-xs font-bold shadow-md shadow-primary/20">
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-semibold truncate">{userName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
            </div>
          )}
        </div>
      </div>
      </aside>
    </>
  )
}
