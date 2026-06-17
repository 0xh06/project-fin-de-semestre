'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'

interface FlashcardReviewCardProps {
  front: string
  back: string
  currentIndex: number
  totalCards: number
  onReview: (quality: number) => void
  disabled?: boolean
}

export function FlashcardReviewCard({
  front,
  back,
  currentIndex,
  totalCards,
  onReview,
  disabled = false
}: FlashcardReviewCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleReview = (quality: number) => {
    onReview(quality)
    setIsFlipped(false)
    
    // Show confetti if this is the last card
    if (currentIndex === totalCards - 1) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  const progress = ((currentIndex + 1) / totalCards) * 100

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Carte {currentIndex + 1} / {totalCards}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Card with 3D Flip Animation */}
      <div className="perspective-1000">
        <div
          className={`relative w-full h-80 transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front Side */}
          <div
            className={`absolute inset-0 backface-hidden bg-card border-2 border-primary/20 rounded-xl p-8 flex items-center justify-center shadow-lg ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            <p className="text-xl font-semibold text-center">{front}</p>
          </div>

          {/* Back Side */}
          <div
            className={`absolute inset-0 backface-hidden bg-primary/10 border-2 border-primary/20 rounded-xl p-8 flex items-center justify-center shadow-lg ${
              isFlipped ? '' : 'rotate-y-180'
            }`}
          >
            <p className="text-xl text-center">{back}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isFlipped ? (
        <Button
          onClick={() => setIsFlipped(true)}
          disabled={disabled}
          className="w-full mt-6 h-12 text-lg"
          size="lg"
        >
          Voir la réponse
        </Button>
      ) : (
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="destructive"
              onClick={() => handleReview(0)}
              disabled={disabled}
              className="h-12"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Oublié
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleReview(2)}
              disabled={disabled}
              className="h-12"
            >
              Difficile
            </Button>
            <Button
              variant="default"
              onClick={() => handleReview(4)}
              disabled={disabled}
              className="h-12"
            >
              Bien
            </Button>
            <Button
              variant="default"
              onClick={() => handleReview(5)}
              disabled={disabled}
              className="h-12 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Facile
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs text-center text-muted-foreground">
            <span>0</span>
            <span>2</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {showConfetti && (
        <div className="mt-6 text-center">
          <p className="text-2xl font-bold text-green-600 mb-2">🎉 Révision terminée !</p>
          <p className="text-muted-foreground">Vous avez révisé {totalCards} cartes</p>
        </div>
      )}
    </div>
  )
}
