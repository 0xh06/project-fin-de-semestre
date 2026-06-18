'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  BrainCircuit,
  Star,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  Trophy,
  Sparkles,
  Zap,
  MessageSquare
} from 'lucide-react'
import { gamificationApi } from '@/lib/api'
import { getProgress, getDayIndex } from '@/lib/progress'
import { DashboardStats } from '@/types'
import Link from 'next/link'

function progressToDashboardStats(p: ReturnType<typeof getProgress>): DashboardStats {
  return {
    user_id: 1,
    xp_total: p.xp_total,
    level: p.level,
    xp_to_next_level: p.xp_to_next_level,
    streak_days: p.streak_days,
    longest_streak: p.longest_streak,
    documents_count: p.documents_count,
    flashcards_total: p.flashcards_total,
    flashcards_mastered: p.flashcards_mastered,
    quizzes_completed: p.quizzes_completed,
    perfect_quizzes: p.perfect_quizzes,
    study_time_minutes: p.study_time_minutes,
    weekly_xp: p.weekly_xp,
    badges_count: p.badges_count,
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Bonjour')
  const [userName, setUserName] = useState('Étudiant')
  const [todayIdx, setTodayIdx] = useState(6)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Bonjour')
    else if (hour < 18) setGreeting('Bon après-midi')
    else setGreeting('Bonsoir')

    setTodayIdx(getDayIndex())

    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        if (u.username) setUserName(u.username)
      } catch {}
    }

    gamificationApi.getDashboard()
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => {
        // Backend offline — use real local progress
        setStats(progressToDashboardStats(getProgress()))
        setLoading(false)
      })
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  const xpProgress = (stats.xp_total / (stats.xp_total + stats.xp_to_next_level)) * 100
  const flashcardProgress = stats.flashcards_total > 0
    ? (stats.flashcards_mastered / stats.flashcards_total) * 100
    : 0
  const maxWeeklyXP = Math.max(...stats.weekly_xp, 1)
  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Hero Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {stats.streak_days > 0
              ? `Votre série de ${stats.streak_days} jour${stats.streak_days > 1 ? 's' : ''} est en feu ! Continuez ainsi.`
              : 'Commencez votre session pour démarrer votre série.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/flashcards">
            <Button className="gradient-primary text-white shadow-md shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200 gap-2">
              <Zap className="h-4 w-4" />
              Réviser maintenant
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* XP Card */}
        <Card className="glass border-border/50 hover:border-primary/20 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">XP Total</CardTitle>
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Star className="h-3.5 w-3.5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold gradient-text">{stats.xp_total.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={xpProgress} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground font-mono">Nv. {stats.level}</span>
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="glass border-border/50 hover:border-orange-500/20 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/10 transition-colors duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Streak</CardTitle>
            <div className="p-1.5 rounded-lg bg-orange-500/10">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-orange-400">{stats.streak_days} <span className="text-base font-normal text-muted-foreground">jours</span></div>
            <p className="text-[11px] text-muted-foreground mt-1">Record : {stats.longest_streak} jours 🏆</p>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card className="glass border-border/50 hover:border-indigo-500/20 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documents</CardTitle>
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-indigo-400">{stats.documents_count}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Documents analysés par l'IA</p>
          </CardContent>
        </Card>

        {/* Flashcards Card */}
        <Card className="glass border-border/50 hover:border-emerald-500/20 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flashcards</CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <BrainCircuit className="h-3.5 w-3.5 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-400">
              {stats.flashcards_mastered}<span className="text-base font-normal text-muted-foreground">/{stats.flashcards_total}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={flashcardProgress} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground font-mono">{Math.round(flashcardProgress)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly XP Chart */}
        <Card className="lg:col-span-2 glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Activité de la semaine
              </CardTitle>
              <CardDescription className="text-xs">XP gagnés par jour</CardDescription>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              {stats.weekly_xp.reduce((a, b) => a + b, 0)} XP total
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-44 gap-2 pt-4">
              {stats.weekly_xp.map((xp, index) => {
                const height = (xp / maxWeeklyXP) * 100
                const isToday = index === todayIdx
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                      {xp > 0 ? xp : ''}
                    </span>
                    <div className="w-full relative">
                      <div
                        className={`w-full rounded-t-md transition-all duration-700 ease-out ${
                          isToday
                            ? 'gradient-primary shadow-md shadow-primary/20'
                            : xp > 0 ? 'bg-primary/30 hover:bg-primary/50' : 'bg-secondary hover:bg-primary/20'
                        }`}
                        style={{
                          height: `${Math.max(height, 4)}px`,
                          minHeight: xp > 0 ? '8px' : '3px',
                        }}
                      />
                    </div>
                    <span className={`text-[10px] mt-2 font-medium ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                      {dayLabels[index]}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Study Time & Quick Actions */}
        <div className="space-y-4">
          <Card className="glass border-border/50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                Temps d'étude
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-purple-400">
                {Math.floor(stats.study_time_minutes / 60)}<span className="text-lg font-normal text-muted-foreground">h</span>
                {' '}{stats.study_time_minutes % 60}<span className="text-lg font-normal text-muted-foreground">min</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Temps total d'apprentissage</p>
              {stats.quizzes_completed > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs text-muted-foreground">
                    {stats.quizzes_completed} quiz • {stats.perfect_quizzes} parfait{stats.perfect_quizzes > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/documents" className="block">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-all duration-200 group cursor-pointer">
                  <div className="p-1.5 rounded-md bg-indigo-500/10">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium flex-1">Importer un document</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
              <Link href="/quiz" className="block">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-all duration-200 group cursor-pointer">
                  <div className="p-1.5 rounded-md bg-amber-500/10">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <span className="text-sm font-medium flex-1">Lancer un quiz</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
              <Link href="/chat" className="block">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-all duration-200 group cursor-pointer">
                  <div className="p-1.5 rounded-md bg-teal-500/10">
                    <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
                  </div>
                  <span className="text-sm font-medium flex-1">Discuter avec l'IA</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
