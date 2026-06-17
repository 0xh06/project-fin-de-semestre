'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  BrainCircuit, 
  MessageSquare, 
  Network, 
  Settings,
  Flame,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
}

export function Sidebar({ xp, level, xpToNext, streak }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <BrainCircuit className="mr-2 h-6 w-6 text-primary" />
        <span className="text-xl font-bold">SmartStudy AI</span>
      </div>

      {/* XP Progress */}
      <div className="border-b p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">Niveau {level}</span>
          <span className="text-muted-foreground">{xp} XP</span>
        </div>
        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${(xp / (xp + xpToNext)) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Flame className="h-4 w-4 text-orange-500" />
          <span>{streak} jours de suite</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname?.startsWith(item.href)
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-primary text-primary-foreground'
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">U</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Utilisateur</p>
            <p className="text-xs text-muted-foreground">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
