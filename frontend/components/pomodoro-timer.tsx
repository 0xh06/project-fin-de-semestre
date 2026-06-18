'use client'

import { useState, useEffect, useCallback } from 'react'
import { Timer, Play, Pause, RotateCcw, X } from 'lucide-react'
import { recordStudyTime } from '@/lib/progress'

type Phase = 'work' | 'break' | 'longbreak'

const PHASES: Record<Phase, { label: string; duration: number; color: string }> = {
  work:      { label: 'Travail',       duration: 25 * 60, color: 'text-primary' },
  break:     { label: 'Pause',         duration:  5 * 60, color: 'text-emerald-400' },
  longbreak: { label: 'Grande pause',  duration: 15 * 60, color: 'text-amber-400' },
}

export function PomodoroTimer() {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('work')
  const [timeLeft, setTimeLeft] = useState(PHASES.work.duration)
  const [running, setRunning] = useState(false)
  const [cycles, setCycles] = useState(0)

  const current = PHASES[phase]
  const total = current.duration
  const percent = ((total - timeLeft) / total) * 100
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')

  const nextPhase = useCallback((finishedCycles: number) => {
    if (phase === 'work') {
      // Record 25 min of study time
      recordStudyTime(25)
      const newCycles = finishedCycles + 1
      setCycles(newCycles)
      if (newCycles % 4 === 0) {
        setPhase('longbreak')
        setTimeLeft(PHASES.longbreak.duration)
      } else {
        setPhase('break')
        setTimeLeft(PHASES.break.duration)
      }
    } else {
      setPhase('work')
      setTimeLeft(PHASES.work.duration)
    }
    setRunning(false)
  }, [phase])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          nextPhase(cycles)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, nextPhase, cycles])

  const reset = () => {
    setRunning(false)
    setTimeLeft(current.duration)
  }

  const switchPhase = (p: Phase) => {
    setRunning(false)
    setPhase(p)
    setTimeLeft(PHASES[p].duration)
  }

  // Circumference of circle SVG
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - percent / 100)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/30 hover:scale-105 transition-all duration-200"
        title="Timer Pomodoro"
      >
        <Timer className="h-4 w-4" />
        {running ? `${mins}:${secs}` : 'Pomodoro'}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-72 glass rounded-2xl border border-border/50 shadow-2xl shadow-black/30 animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm">Timer Pomodoro</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Phase tabs */}
          <div className="flex gap-1 px-4 pt-4">
            {(Object.keys(PHASES) as Phase[]).map(p => (
              <button
                key={p}
                onClick={() => switchPhase(p)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                  phase === p
                    ? 'gradient-primary text-white shadow-sm'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {p === 'work' ? '🎯 Travail' : p === 'break' ? '☕ Pause' : '🌿 Long'}
              </button>
            ))}
          </div>

          {/* Circular timer */}
          <div className="flex flex-col items-center py-6">
            <div className="relative w-36 h-36">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                {/* Track */}
                <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(217.2 32.6% 14%)" strokeWidth="6" />
                {/* Progress */}
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke="url(#pomo-grad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="pomo-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(217.2 91.2% 59.8%)" />
                    <stop offset="100%" stopColor="hsl(250 70% 56%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black font-mono ${current.color}`}>
                  {mins}:{secs}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  {current.label}
                </span>
              </div>
            </div>

            {/* Cycles */}
            <div className="flex gap-1.5 mt-3">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                    i < (cycles % 4) ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{cycles} cycle{cycles !== 1 ? 's' : ''} terminé{cycles !== 1 ? 's' : ''}</p>
          </div>

          {/* Controls */}
          <div className="flex gap-3 px-5 pb-5 justify-center">
            <button
              onClick={reset}
              className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setRunning(r => !r)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-white font-semibold text-sm shadow-md shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
              {running ? 'Pause' : 'Démarrer'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
