'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Star, Play, CheckCircle, XCircle } from 'lucide-react'
import { quizApi, documentsApi, gamificationApi } from '@/lib/api'
import { Document, QuizSession, QuizQuestion } from '@/types'

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
      setDocuments(docs)
    } catch (err) {
      console.error('Failed to load documents:', err)
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
    } catch (err) {
      console.error('Failed to create session:', err)
    } finally {
      setLoading(false)
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
    } catch (err) {
      console.error('Failed to load question:', err)
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
    } catch (err) {
      console.error('Failed to submit answer:', err)
    } finally {
      setLoading(false)
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
    } catch (err) {
      console.error('Failed to finish quiz:', err)
    } finally {
      setLoading(false)
    }
  }

  if (finished && finalReport) {
    return (
      <div className="p-8">
        <h1 className="mb-8 text-3xl font-bold">Quiz Terminé</h1>
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl">{Math.round(finalReport.score * 100)}%</CardTitle>
            <CardDescription>Score final</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {finalReport.weak_topics.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Sujets à améliorer</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {finalReport.weak_topics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
            {finalReport.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Recommandations</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {finalReport.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button onClick={() => { setSession(null); setFinished(false); setFinalReport(null); }} className="w-full">
              Nouveau Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (session && currentQuestion) {
    return (
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Quiz</h1>
          <div className="text-sm text-muted-foreground">
            Question {currentIndex + 1} / {questionCount}
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">{currentQuestion.question_text}</CardTitle>
            <CardDescription>
              Mode: {mode} • Difficulté: {difficulty}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, i) => (
                  <Button
                    key={i}
                    variant={userAnswer === option ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => !submitted && setUserAnswer(option)}
                    disabled={submitted}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            {currentQuestion.question_type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={userAnswer === 'Vrai' ? 'default' : 'outline'}
                  onClick={() => !submitted && setUserAnswer('Vrai')}
                  disabled={submitted}
                >
                  Vrai
                </Button>
                <Button
                  variant={userAnswer === 'Faux' ? 'default' : 'outline'}
                  onClick={() => !submitted && setUserAnswer('Faux')}
                  disabled={submitted}
                >
                  Faux
                </Button>
              </div>
            )}

            {currentQuestion.question_type === 'open_ended' && (
              <Input
                placeholder="Votre réponse..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={submitted}
              />
            )}

            {submitted && result && (
              <div className={`p-4 rounded-lg ${result.is_correct ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.is_correct ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-semibold">
                    {result.is_correct ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                {result.explanation && (
                  <p className="text-sm text-muted-foreground">{result.explanation}</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {!submitted ? (
                <Button onClick={submitAnswer} disabled={!userAnswer || loading} className="flex-1">
                  {loading ? 'Soumission...' : 'Soumettre'}
                </Button>
              ) : (
                <Button onClick={nextQuestion} disabled={loading} className="flex-1">
                  {currentIndex < questionCount - 1 ? 'Question suivante' : 'Terminer le quiz'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="mb-8 text-3xl font-bold">Quiz</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Configuration du Quiz
          </CardTitle>
          <CardDescription>
            Sélectionnez les documents et configurez le quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Selection */}
          <div>
            <h3 className="font-semibold mb-3">Documents</h3>
            <div className="grid gap-2">
              {documents.map((doc) => (
                <Button
                  key={doc.id}
                  variant={selectedDocs.includes(doc.id) ? 'default' : 'outline'}
                  onClick={() => toggleDocument(doc.id)}
                  className="justify-start"
                >
                  {doc.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <h3 className="font-semibold mb-3">Mode</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['multiple_choice', 'true_false', 'open_ended'] as const).map((m) => (
                <Button
                  key={m}
                  variant={mode === m ? 'default' : 'outline'}
                  onClick={() => setMode(m)}
                >
                  {m === 'multiple_choice' ? 'QCM' : m === 'true_false' ? 'Vrai/Faux' : 'Réponse libre'}
                </Button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <h3 className="font-semibold mb-3">Difficulté</h3>
            <div className="grid grid-cols-4 gap-2">
              {(['auto', 'easy', 'medium', 'hard'] as const).map((d) => (
                <Button
                  key={d}
                  variant={difficulty === d ? 'default' : 'outline'}
                  onClick={() => setDifficulty(d)}
                >
                  {d === 'auto' ? 'Auto' : d === 'easy' ? 'Facile' : d === 'medium' ? 'Moyen' : 'Difficile'}
                </Button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <h3 className="font-semibold mb-3">Nombre de questions</h3>
            <Input
              type="number"
              min={1}
              max={50}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
            />
          </div>

          <Button
            onClick={startQuiz}
            disabled={selectedDocs.length === 0 || loading}
            className="w-full"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {loading ? 'Création...' : 'Commencer le Quiz'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
