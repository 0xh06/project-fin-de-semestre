'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function FloatingBackButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Ne pas afficher le bouton de retour sur le dashboard, l'accueil ou les pages d'authentification
  if (
    pathname === '/' ||
    pathname === '/dashboard' ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/callback')
  ) {
    return null
  }

  return (
    <div className="fixed top-6 left-6 z-50 animate-fade-in">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className={cn(
          "gap-2 bg-card/80 backdrop-blur-md border-border/50 shadow-lg shadow-black/20",
          "hover:bg-secondary hover:text-foreground hover:scale-105 transition-all duration-200",
          "text-muted-foreground font-medium"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>
    </div>
  )
}
