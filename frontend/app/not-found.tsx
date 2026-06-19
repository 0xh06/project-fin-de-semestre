import Link from 'next/link'
import { BrainCircuit, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="text-center max-w-md animate-scale-in relative z-10">
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/25">
          <BrainCircuit className="h-8 w-8 text-white" />
        </div>

        {/* 404 number */}
        <div className="text-[120px] font-black leading-none gradient-text select-none mb-2">
          404
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">
          Page introuvable
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Cette page n'existe pas ou a été déplacée.<br />
          Retournez au tableau de bord pour continuer vos révisions.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button className="w-full sm:w-auto gradient-primary text-white shadow-md shadow-primary/20 hover:scale-[1.02] transition-all gap-2">
              <Home className="h-4 w-4" />
              Tableau de bord
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto border-border/50 hover:bg-accent gap-2">
              <ArrowLeft className="h-4 w-4" />
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
