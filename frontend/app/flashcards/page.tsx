'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BrainCircuit, RotateCcw, CheckCircle, Flame, Sparkles } from 'lucide-react'
import { flashcardsApi, gamificationApi } from '@/lib/api'
import { recordFlashcardReview, recordStudyTime } from '@/lib/progress'
import { Flashcard } from '@/types'

// Mock data fallback
const MOCK_FLASHCARDS: Flashcard[] = [
  { id: 1, deck_id: 1, front: "Qu'est-ce que le 'Spaced Repetition System' (SRS) ?", back: "Une méthode d'apprentissage basée sur des révisions à intervalles réguliers et croissants, optimisée pour combattre la courbe d'oubli d'Ebbinghaus.", next_review: new Date().toISOString(), interval_days: 0, repetitions: 0, difficulty: 2 },
  { id: 2, deck_id: 1, front: "Quel est l'avantage principal du Glassmorphism en UI design ?", back: "Il crée de la profondeur et une hiérarchie visuelle subtile grâce à un effet de verre dépoli (flou d'arrière-plan), rendant l'interface moderne sans surcharger l'utilisateur.", next_review: new Date().toISOString(), interval_days: 0, repetitions: 0, difficulty: 2 },
  { id: 3, deck_id: 2, front: "Comment fonctionne l'effet d'éviction en économie ?", back: "L'État emprunte massivement, ce qui fait monter les taux d'intérêt, décourageant ainsi l'investissement privé.", next_review: new Date().toISOString(), interval_days: 0, repetitions: 0, difficulty: 2 },
]

export default function FlashcardsPage() {
  const [dueCards, setDueCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [stats, setStats] = useState({ mastered: 98, total: 142, due_today: 0 })
  const sessionStartRef = useRef<number>(Date.now())

  useEffect(() => {
    loadDueCards()
    loadStats()
  }, [])

  const loadDueCards = async () => {
    try {
      const cards = await flashcardsApi.getDueToday()
      if (cards && cards.length > 0) {
        setDueCards(cards)
      } else {
        // Fallback to mock cards if none are due (for demo purposes)
        setDueCards(MOCK_FLASHCARDS)
        setStats(prev => ({ ...prev, due_today: MOCK_FLASHCARDS.length }))
      }
    } catch {
      // Offline fallback
      setDueCards(MOCK_FLASHCARDS)
      setStats(prev => ({ ...prev, due_today: MOCK_FLASHCARDS.length }))
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await flashcardsApi.getStats()
      setStats(data)
    } catch {
      // Offline fallback already has mock stats
    }
  }

  const handleReview = async (quality: number) => {
    if (currentIndex >= dueCards.length) return

    setReviewing(true)
    try {
      await flashcardsApi.review({ card_id: dueCards[currentIndex].id, quality })
      await gamificationApi.addXp(5, 'Flashcard révisée')
    } catch {
      await new Promise(r => setTimeout(r, 300))
    } finally {
      // Always record progress locally
      recordFlashcardReview(quality)
      // When finishing the last card, record study session time
      if (currentIndex >= dueCards.length - 1) {
        const minutesSpent = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000))
        recordStudyTime(minutesSpent)
      }
      setReviewing(false)
      if (currentIndex < dueCards.length - 1) {
        setShowAnswer(false)
        setTimeout(() => setCurrentIndex(currentIndex + 1), 150)
      } else {
        setCurrentIndex(dueCards.length)
      }
      loadStats()
    }
  }

  const currentCard = dueCards[currentIndex]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (dueCards.length === 0 || currentIndex >= dueCards.length) {
    return (
      <div className="p-6 lg:p-8 h-full flex flex-col items-center justify-center animate-fade-in">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <Card className="glass border-border/50 max-w-md w-full text-center relative overflow-hidden z-10 shadow-2xl shadow-emerald-500/10">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
          <CardContent className="pt-12 pb-10 flex flex-col items-center">
            <div className="p-4 rounded-full bg-emerald-500/10 mb-6">
              <CheckCircle className="h-16 w-16 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Session terminée !</h2>
            <p className="text-muted-foreground mb-8">
              Excellente session. Vous avez révisé <span className="font-semibold text-emerald-400">{dueCards.length}</span> cartes aujourd'hui.
            </p>

            <div className="flex items-center gap-6 mb-8 text-sm bg-secondary/50 px-6 py-3 rounded-2xl border border-border/30">
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold gradient-text">+{dueCards.length * 5}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">XP Gagnés</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-emerald-400">{stats.mastered}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Maîtrisées</span>
              </div>
            </div>

            <Button onClick={() => { setCurrentIndex(0); loadDueCards(); setShowAnswer(false); }} className="gradient-primary text-white hover:scale-[1.02] transition-transform gap-2">
              <RotateCcw className="h-4 w-4" />
              Revoir les cartes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const qualityConfig = [
    { label: 'Oublié', color: 'bg-red-500 hover:bg-red-600', textColor: 'text-red-400' },
    { label: 'Difficile', color: 'bg-orange-500 hover:bg-orange-600', textColor: 'text-orange-400' },
    { label: 'Hésitant', color: 'bg-amber-500 hover:bg-amber-600', textColor: 'text-amber-400' },
    { label: 'Bon', color: 'bg-indigo-500 hover:bg-indigo-600', textColor: 'text-indigo-400' },
    { label: 'Facile', color: 'bg-emerald-500 hover:bg-emerald-600', textColor: 'text-emerald-400' },
    { label: 'Parfait', color: 'bg-teal-500 hover:bg-teal-600', textColor: 'text-teal-400' },
  ]

  return (
    <div className="p-6 lg:p-8 flex flex-col h-full animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10">
            <BrainCircuit className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Révisions SRS</h1>
            <p className="text-xs text-muted-foreground">Méthode de répétition espacée</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-full border border-border/50">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold text-foreground/90">
            {currentIndex + 1} <span className="text-muted-foreground">/ {dueCards.length}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full relative perspective-1000">

        {/* Glow behind the card */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full blur-[100px] transition-colors duration-1000 -z-10 ${
          showAnswer ? 'bg-indigo-500/10' : 'bg-primary/10'
        }`} />

        {/* 3D Flip Container */}
        <div
          className="relative w-full h-[400px] transition-all duration-500 preserve-3d cursor-pointer"
          style={{ transform: showAnswer ? 'rotateX(180deg)' : 'rotateX(0deg)' }}
          onClick={() => !showAnswer && setShowAnswer(true)}
        >
          {/* Front of card (Question) */}
          <div className="absolute inset-0 backface-hidden">
            <Card className="w-full h-full glass border-border/50 shadow-xl flex flex-col hover:border-primary/30 transition-colors group">
              <CardHeader className="text-center pb-0 pt-8 shrink-0">
                <CardDescription className="uppercase tracking-widest text-xs font-semibold text-primary mb-2 flex justify-center items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Question
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center p-8 sm:p-12 text-center">
                <p className="text-2xl sm:text-3xl font-bold leading-tight group-hover:scale-[1.02] transition-transform duration-300">
                  {currentCard.front}
                </p>
              </CardContent>
              <div className="pb-8 text-center text-sm text-muted-foreground animate-pulse">
                Cliquez pour révéler la réponse
              </div>
            </Card>
          </div>

          {/* Back of card (Answer) */}
          <div
            className="absolute inset-0 backface-hidden"
            style={{ transform: 'rotateX(180deg)' }}
          >
            <Card className="w-full h-full bg-secondary/80 backdrop-blur-xl border-indigo-500/30 shadow-2xl shadow-indigo-500/10 flex flex-col">
              <CardHeader className="text-center pb-0 pt-8 shrink-0">
                <CardDescription className="uppercase tracking-widest text-xs font-semibold text-indigo-400 mb-2">
                  Réponse
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center p-8 sm:p-12 text-center">
                <p className="text-xl sm:text-2xl font-medium leading-relaxed text-indigo-50">
                  {currentCard.back}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rating Actions */}
        <div className={`mt-10 w-full transition-all duration-500 transform ${
          showAnswer ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}>
          <div className="text-center text-sm text-muted-foreground mb-4">
            Comment évaluez-vous votre mémorisation ?
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {qualityConfig.map((config, index) => (
              <Button
                key={index}
                className={`h-auto py-3 px-2 flex flex-col gap-1.5 shadow-lg border-transparent transition-transform hover:scale-105 active:scale-95 text-white ${config.color}`}
                onClick={(e) => { e.stopPropagation(); handleReview(index); }}
                disabled={reviewing}
              >
                <span className="text-lg font-bold">{index}</span>
                <span className="text-[10px] uppercase font-semibold tracking-wide opacity-90">{config.label}</span>
              </Button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
