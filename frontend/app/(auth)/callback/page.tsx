'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BrainCircuit } from 'lucide-react'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams?.get('token')
    const name = searchParams?.get('name')

    if (token) {
      localStorage.setItem('token', token)
      
      const user = {
        id: Math.floor(Math.random() * 1000), // En prod, l'ID viendra du token ou d'une requête /me
        username: name || 'Utilisateur OAuth',
        email: 'oauth@smartstudy.ai'
      }
      
      localStorage.setItem('user', JSON.stringify(user))
      
      // Redirection après succès
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } else {
      // Pas de token = erreur
      setTimeout(() => {
        router.push('/login?error=oauth_failed')
      }, 2000)
    }
  }, [router, searchParams])

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="text-center animate-pulse">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-xl shadow-primary/30">
          <BrainCircuit className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Authentification en cours...</h1>
        <p className="text-muted-foreground">Veuillez patienter pendant que nous préparons votre espace.</p>
        <div className="mt-8 flex justify-center">
          <div className="h-6 w-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    </div>
  )
}
