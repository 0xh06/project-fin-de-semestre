'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileText, BrainCircuit, Star, Flame, Clock } from 'lucide-react'
import { gamificationApi } from '@/lib/api'
import { DashboardStats } from '@/types'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    gamificationApi.getDashboard()
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load dashboard:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-full">Chargement...</div>
  }

  if (!stats) {
    return <div className="flex items-center justify-center h-full">Erreur de chargement</div>
  }

  const xpProgress = (stats.xp_total / (stats.xp_total + stats.xp_to_next_level)) * 100

  return (
    <div className="p-8">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP Total</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.xp_total}</div>
            <p className="text-xs text-muted-foreground">Niveau {stats.level}</p>
            <Progress value={xpProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak_days} jours</div>
            <p className="text-xs text-muted-foreground">Record: {stats.longest_streak} jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documents_count}</div>
            <p className="text-xs text-muted-foreground">Documents importés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flashcards_mastered}/{stats.flashcards_total}</div>
            <p className="text-xs text-muted-foreground">Maîtrisées</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly XP Chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>XP cette semaine</CardTitle>
          <CardDescription>Activité des 7 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-40 gap-2">
            {stats.weekly_xp.map((xp, index) => {
              const maxXP = Math.max(...stats.weekly_xp, 1)
              const height = (xp / maxXP) * 100
              const days = ['Auj', 'Hier', 'J-3', 'J-4', 'J-5', 'J-6', 'J-7']
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-primary rounded-t transition-all"
                    style={{ height: `${height}%`, minHeight: xp > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-muted-foreground mt-2">{days[index]}</span>
                  <span className="text-xs font-medium">{xp}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="mb-4 text-xl font-semibold">Actions rapides</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/documents">
            <Button className="w-full h-24 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Importer un document</span>
            </Button>
          </Link>
          <Link href="/flashcards">
            <Button className="w-full h-24 flex-col gap-2" variant="secondary">
              <BrainCircuit className="h-6 w-6" />
              <span>Réviser les flashcards</span>
            </Button>
          </Link>
          <Link href="/quiz">
            <Button className="w-full h-24 flex-col gap-2" variant="outline">
              <Star className="h-6 w-6" />
              <span>Lancer un quiz</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Study Time */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Temps d'étude
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.study_time_minutes} min</div>
          <p className="text-sm text-muted-foreground">Temps total d'étude</p>
        </CardContent>
      </Card>
    </div>
  )
}
