'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BrainCircuit, RotateCcw, CheckCircle, XCircle } from 'lucide-react'
import { flashcardsApi, gamificationApi } from '@/lib/api'
import { Flashcard } from '@/types'

export default function FlashcardsPage() {
  const [dueCards, setDueCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [stats, setStats] = useState({ mastered: 0, total: 0, due_today: 0 })

  useEffect(() => {
    loadDueCards()
    loadStats()
  }, [])

  const loadDueCards = async () => {
    try {
      const cards = await flashcardsApi.getDueToday()
      setDueCards(cards)
    } catch (err) {
      console.error('Failed to load due cards:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await flashcardsApi.getStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const handleReview = async (quality: number) => {
    if (currentIndex >= dueCards.length) return

    setReviewing(true)
    try {
      await flashcardsApi.review({ card_id: dueCards[currentIndex].id, quality })
      await gamificationApi.addXp(5, 'Flashcard révisée')
      
      // Move to next card
      if (currentIndex < dueCards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
      } else {
        // All cards reviewed
        setCurrentIndex(dueCards.length)
      }
      
      loadStats()
    } catch (err) {
      console.error('Review failed:', err)
    } finally {
      setReviewing(false)
    }
  }

  const currentCard = dueCards[currentIndex]

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  if (dueCards.length === 0) {
    return (
      <div className="p-8">
        <h1 className="mb-8 text-3xl font-bold">Flashcards</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucune flashcard à réviser aujourd'hui</p>
            <div className="text-sm text-muted-foreground">
              {stats.mastered}/{stats.total} cartes maîtrisées
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentIndex >= dueCards.length) {
    return (
      <div className="p-8">
        <h1 className="mb-8 text-3xl font-bold">Flashcards</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold mb-2">Révision terminée!</p>
            <p className="text-muted-foreground mb-4">Vous avez révisé {dueCards.length} cartes</p>
            <Button onClick={() => { setCurrentIndex(0); loadDueCards() }}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Recommencer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Flashcards</h1>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} / {dueCards.length} • {stats.due_today} à réviser
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardDescription>
            Évaluez votre réponse: 0 (oublié) à 5 (parfait)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="p-6 bg-secondary rounded-lg">
            <p className="text-lg font-semibold">{currentCard.front}</p>
          </div>

          {/* Answer */}
          {showAnswer ? (
            <div className="p-6 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-lg">{currentCard.back}</p>
            </div>
          ) : (
            <Button onClick={() => setShowAnswer(true)} className="w-full" size="lg">
              Voir la réponse
            </Button>
          )}

          {/* Rating Buttons */}
          {showAnswer && (
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map((quality) => (
                <Button
                  key={quality}
                  variant={quality < 3 ? 'destructive' : quality === 3 ? 'secondary' : 'default'}
                  onClick={() => handleReview(quality)}
                  disabled={reviewing}
                >
                  {quality}
                </Button>
              ))}
            </div>
          )}

          {/* Quality descriptions */}
          {showAnswer && (
            <div className="grid grid-cols-6 gap-2 text-xs text-center text-muted-foreground">
              <span>Oublié</span>
              <span>Difficile</span>
              <span>Hésitant</span>
              <span>Bon</span>
              <span>Facile</span>
              <span>Parfait</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        {stats.mastered}/{stats.total} cartes maîtrisées
      </div>
    </div>
  )
}
