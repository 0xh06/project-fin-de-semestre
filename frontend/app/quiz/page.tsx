'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star, Play, CheckCircle2, XCircle, Trophy, BookOpen, Target, ArrowRight } from 'lucide-react'
import { quizApi, documentsApi, gamificationApi } from '@/lib/api'
import { Document, QuizSession, QuizQuestion } from '@/types'

const MOCK_QUESTION: QuizQuestion = {
  id: 1,
  session_id: 1,
  question_type: 'multiple_choice',
  question_text: 'Quelle est la principale caractéristique de la méthode de travail "Pomodoro" ?',
  options: ['Travailler 2 heures sans pause', 'Alterner 25 minutes de travail et 5 minutes de pause', 'Travailler la nuit uniquement', 'Faire plusieurs tâches en même temps'],
  correct_answer: 'Alterner 25 minutes de travail et 5 minutes de pause',
  explanation: 'La technique Pomodoro se base sur des cycles de 25 minutes de travail concentré suivies de 5 minutes de pause pour maximiser la productivité.',
}

export default function QuizPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocs, setSelectedDocs] = useState<number[]>([])
  const [mode, setMode] = useState<'multiple_choice' | 'true_false' | 'open_ended'>('multiple_choice')
  const [difficulty, setDifficulty] = useState<'auto' | 'easy' | 'medium' | 'hard'>('auto')
  const [questionCount, setQuestionCount] = useState(10)
  
  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ is_correct: boolean; explanation?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [finished, setFinished] = useState(false)
  const [finalReport, setFinalReport] = useState<{ score: number; weak_topics: string[]; recommendations: string[] } | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const docs = await documentsApi.list()
      if (docs && docs.length > 0) {
        setDocuments(docs)
      } else {
        // Mock fallback
        setDocuments([{ id: 1, title: 'Introduction au Droit.pdf', content: '', imported_at: new Date().toISOString() }])
      }
    } catch {
      setDocuments([{ id: 1, title: 'Mock Document.pdf', content: '', imported_at: new Date().toISOString() }])
    }
  }

  const toggleDocument = (docId: number) => {
    setSelectedDocs(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  const startQuiz = async () => {
    if (selectedDocs.length === 0) return
    
    setLoading(true)
    try {
      const newSession = await quizApi.createSession({
        document_ids: selectedDocs,
        mode,
        difficulty,
        question_count: questionCount,
      })
      setSession(newSession)
      setCurrentIndex(0)
      loadQuestion(newSession.id, 0)
    } catch {
      // Mock fallback
      setTimeout(() => {
        setSession({ id: 1, user_id: 1, mode, difficulty, score: 0, created_at: new Date().toISOString() })
        setCurrentIndex(0)
        setCurrentQuestion(MOCK_QUESTION)
        setLoading(false)
      }, 600)
    }
  }

  const loadQuestion = async (sessionId: number, index: number) => {
    setLoading(true)
    try {
      const question = await quizApi.getQuestion(sessionId, index)
      setCurrentQuestion(question)
      setUserAnswer('')
      setSubmitted(false)
      setResult(null)
    } catch {
      // Offline fallback already loaded a mock question
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!session || !currentQuestion) return
    
    setLoading(true)
    try {
      const response = await quizApi.submitAnswer({
        session_id: session.id,
        question_index: currentIndex,
        answer: userAnswer,
      })
      setResult(response)
      setSubmitted(true)
    } catch {
      // Mock logic
      setTimeout(() => {
        const isCorrect = userAnswer === MOCK_QUESTION.correct_answer
        setResult({ is_correct: isCorrect, explanation: MOCK_QUESTION.explanation })
        setSubmitted(true)
        setLoading(false)
      }, 400)
    }
  }

  const nextQuestion = () => {
    if (!session) return
    
    if (currentIndex < questionCount - 1) {
      setCurrentIndex(currentIndex + 1)
      loadQuestion(session.id, currentIndex + 1)
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      const report = await quizApi.finishSession(session.id)
      setFinalReport(report)
      setFinished(true)
      await gamificationApi.addXp(10 + (report.score * 2), 'Quiz complété')
    } catch {
      setTimeout(() => {
        setFinalReport({
          score: 0.85,
          weak_topics: ['Gestion du temps', 'Méthodologie'],
          recommendations: ['Révisez les techniques de concentration', 'Entraînez-vous sur des cas pratiques']
        })
        setFinished(true)
        setLoading(false)
      }, 500)
    }
  }

  // Final Report View
  if (finished && finalReport) {
    const scorePercent = Math.round(finalReport.score * 100)
    const isSuccess = scorePercent >= 70

    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center h-full animate-fade-in">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none ${
          isSuccess ? 'bg-amber-500/10' : 'bg-primary/10'
        }`} />
        
        <Card className="glass border-border/50 max-w-2xl w-full relative z-10 shadow-2xl">
          <CardHeader className="text-center pt-10 pb-6">
            <div className={`mx-auto p-4 rounded-full mb-4 w-fit ${isSuccess ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
              <Trophy className={`h-12 w-12 ${isSuccess ? 'text-amber-400' : 'text-primary'}`} />
            </div>
            <CardTitle className="text-3xl font-extrabold mb-2">Quiz Terminé</CardTitle>
            <div className="text-5xl font-black gradient-text my-4">{scorePercent}%</div>
            <CardDescription className="text-base">Score Final</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-10">
            <div className="grid sm:grid-cols-2 gap-6">
              {finalReport.weak_topics.length > 0 && (
                <div className="bg-secondary/40 rounded-2xl p-5 border border-border/30">
                  <h3 className="font-bold text-sm text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Points à travailler
                  </h3>
                  <ul className="space-y-2">
                    {finalReport.weak_topics.map((topic, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-red-400/50 mt-0.5">•</span>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {finalReport.recommendations.length > 0 && (
                <div className="bg-secondary/40 rounded-2xl p-5 border border-border/30">
                  <h3 className="font-bold text-sm text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Recommandations
                  </h3>
                  <ul className="space-y-2">
                    {finalReport.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary/50 mt-0.5">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Button onClick={() => { setSession(null); setFinished(false); setFinalReport(null); }} className="w-full h-12 gradient-primary text-white text-base shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
              Créer un nouveau quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active Quiz View
  if (session && currentQuestion) {
    const progress = ((currentIndex) / questionCount) * 100

    return (
      <div className="p-6 lg:p-8 flex flex-col h-full animate-fade-in max-w-4xl mx-auto w-full">
        {/* Progress header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <h1 className="text-xl font-bold">Question {currentIndex + 1} <span className="text-muted-foreground font-medium text-lg">/ {questionCount}</span></h1>
            </div>
            <div className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border/50 uppercase tracking-wider">
              {mode === 'multiple_choice' ? 'QCM' : mode} • {difficulty}
            </div>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="glass border-border/50 shadow-xl flex-1 flex flex-col">
          <CardHeader className="pt-8 pb-6 px-8 shrink-0">
            <CardTitle className="text-2xl leading-relaxed font-semibold">
              {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8 flex-1 flex flex-col">
            <div className="flex-1 space-y-4">
              {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                <div className="grid gap-3">
                  {currentQuestion.options.map((option, i) => {
                    const isSelected = userAnswer === option
                    let buttonStyle = isSelected ? 'border-primary bg-primary/10 text-primary' : 'bg-secondary/40 border-border/40 hover:bg-secondary hover:border-border/80'
                    
                    if (submitted && result) {
                      if (option === currentQuestion.correct_answer) {
                        buttonStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      } else if (isSelected && !result.is_correct) {
                        buttonStyle = 'border-red-500 bg-red-500/10 text-red-400 opacity-50'
                      } else {
                        buttonStyle = 'opacity-50 cursor-not-allowed bg-secondary/20 border-border/20'
                      }
                    }

                    return (
                      <button
                        key={i}
                        className={`text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium ${buttonStyle}`}
                        onClick={() => !submitted && setUserAnswer(option)}
                        disabled={submitted}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold border ${
                            isSelected && !submitted ? 'bg-primary text-white border-primary' : 
                            submitted && option === currentQuestion.correct_answer ? 'bg-emerald-500 text-white border-emerald-500' :
                            'border-muted-foreground/30 text-muted-foreground'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          {option}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Add True/False and Open Ended similarly if needed */}

              {/* Feedback Alert */}
              <div className={`mt-6 overflow-hidden transition-all duration-500 ${submitted ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                {result && (
                  <div className={`p-5 rounded-2xl border ${
                    result.is_correct 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-50' 
                      : 'bg-red-500/10 border-red-500/20 text-red-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      {result.is_correct ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className={`text-lg font-bold mb-1 ${result.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                          {result.is_correct ? 'Excellente réponse !' : 'Oups, ce n\'est pas tout à fait ça.'}
                        </h4>
                        {result.explanation && (
                          <p className="text-sm opacity-90 leading-relaxed">{result.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-border/30 flex justify-end">
              {!submitted ? (
                <Button 
                  onClick={submitAnswer} 
                  disabled={!userAnswer || loading} 
                  className="h-11 px-8 gradient-primary text-white shadow-md hover:scale-[1.02] transition-transform gap-2"
                >
                  {loading ? 'Vérification...' : 'Valider'}
                </Button>
              ) : (
                <Button 
                  onClick={nextQuestion} 
                  disabled={loading} 
                  className="h-11 px-8 gradient-primary text-white shadow-md hover:scale-[1.02] transition-transform gap-2"
                >
                  {currentIndex < questionCount - 1 ? 'Question suivante' : 'Voir les résultats'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Setup Quiz View
  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <Star className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Lancer un Quiz</h1>
          <p className="text-xs text-muted-foreground">Générez un quiz sur-mesure d'après vos cours</p>
        </div>
      </div>

      <Card className="glass border-border/50 shadow-xl">
        <CardContent className="p-8 space-y-10">
          
          {/* Documents */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">1</div>
              <h3 className="font-bold text-lg">Choisissez la source</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 pl-8">
              {documents.map((doc) => {
                const isSelected = selectedDocs.includes(doc.id)
                return (
                  <button
                    key={doc.id}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 text-sm ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-border/40 bg-secondary/30 hover:bg-secondary'
                    }`}
                    onClick={() => toggleDocument(doc.id)}
                  >
                    <div className="font-semibold text-foreground truncate">{doc.title}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mode */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">2</div>
              <h3 className="font-bold text-lg">Format des questions</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 pl-8">
              {(['multiple_choice', 'true_false', 'open_ended'] as const).map((m) => {
                const isSelected = mode === m
                return (
                  <button
                    key={m}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                      isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 bg-secondary/30 hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setMode(m)}
                  >
                    {m === 'multiple_choice' ? 'QCM' : m === 'true_false' ? 'Vrai/Faux' : 'Réponse libre'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">3</div>
              <h3 className="font-bold text-lg">Difficulté de l'IA</h3>
            </div>
            <div className="grid grid-cols-4 gap-3 pl-8">
              {(['auto', 'easy', 'medium', 'hard'] as const).map((d) => {
                const isSelected = difficulty === d
                return (
                  <button
                    key={d}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                      isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 bg-secondary/30 hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d === 'auto' ? 'Auto' : d === 'easy' ? 'Facile' : d === 'medium' ? 'Moyen' : 'Difficile'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Count */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">4</div>
              <h3 className="font-bold text-lg">Nombre de questions</h3>
            </div>
            <div className="pl-8 max-w-[200px]">
              <Input
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                className="h-12 text-lg font-semibold bg-secondary/30 border-border/40"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border/30">
            <Button
              onClick={startQuiz}
              disabled={selectedDocs.length === 0 || loading}
              className="w-full h-14 text-lg font-bold gradient-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all gap-3 rounded-xl"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="h-5 w-5 fill-white" />
              )}
              Générer et Commencer
            </Button>
            {selectedDocs.length === 0 && (
              <p className="text-center text-sm text-red-400 mt-3 font-medium">Veuillez sélectionner au moins un document pour générer le quiz.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
