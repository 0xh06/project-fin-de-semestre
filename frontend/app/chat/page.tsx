'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, FileText, X, Sparkles, Bot, User, Zap, Settings } from 'lucide-react'
import { chatApi, documentsApi } from '@/lib/api'
import { Document, ChatMessage } from '@/types'
import Link from 'next/link'
import MarkdownText from '@/components/markdown-text'

// ─── Gemini Direct API ──────────────────────────────────────────────────────

async function callGeminiDirect(
  apiKey: string,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const SYSTEM_PROMPT = `Tu es SmartStudy AI, un assistant pédagogique intelligent et bienveillant.
Tu aides les étudiants à comprendre leurs cours, créer des flashcards, préparer des quiz et organiser leurs révisions.
Réponds toujours en français, de façon claire, structurée et pédagogique.
Utilise du **markdown** pour structurer tes réponses (titres, listes, gras).
Si on te demande des flashcards, génère-les au format Q/R numéroté.
Si on te demande un quiz, génère des questions avec les réponses correctes expliquées.`

  // Build conversation history for Gemini (alternating user/model)
  const contents: { role: string; parts: { text: string }[] }[] = []
  for (const msg of history) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] })

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini error ${res.status}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Réponse vide de Gemini')
  return text
}

// ─── Offline fallback ────────────────────────────────────────────────────────

function generateOfflineReply(message: string): string {
  const m = message.toLowerCase()

  if (m.includes('flashcard') || m.includes('fiche') || m.includes('mémoriser') || m.includes('memoris')) {
    return `Bien sûr ! Voici 3 flashcards sur ce sujet 🧠\n\n**Carte 1**\nQ : Quelle est la définition principale ?\nR : Le concept central implique une structure organisée permettant de comprendre les relations entre les éléments.\n\n**Carte 2**\nQ : Quelles sont les étapes clés ?\nR : 1) Identification du problème, 2) Analyse des données, 3) Formulation de la solution.\n\n**Carte 3**\nQ : Quelle est l'application pratique ?\nR : Dans un contexte réel, ce concept s'applique pour résoudre des situations complexes de manière méthodique.\n\n> 💡 Connectez le serveur backend pour générer des flashcards depuis vos vrais documents !`
  }

  if (m.includes('résume') || m.includes('resume') || m.includes('résumé') || m.includes('synthèse')) {
    return `Voici un résumé structuré du sujet demandé 📋\n\n**Points clés :**\n• Le concept principal repose sur une logique systématique et itérative\n• Les éléments fondamentaux incluent l'analyse, la synthèse et l'évaluation\n• Les applications pratiques couvrent de nombreux domaines d'étude\n\n**À retenir :**\nLa maîtrise de ce sujet demande de la pratique régulière et une révision espacée (méthode SRS).\n\n> 💡 Importez vos PDFs pour obtenir des résumés précis de vos vrais cours !`
  }

  if (m.includes('quiz') || m.includes('question') || m.includes('test') || m.includes('exercice')) {
    return `Voici un mini-quiz pour tester tes connaissances ! 🎯\n\n**Question 1 :** Quelle méthode d'apprentissage est basée sur des intervalles de révision croissants ?\na) Méthode Cornell  b) Répétition espacée (SRS)  c) Mind Mapping  d) Lecture active\n\n✅ **Réponse : b) La répétition espacée (SRS)**\nExplication : La méthode SRS (Spaced Repetition System) optimise la mémorisation en révisant les informations juste avant qu'elles soient oubliées.\n\n**Question 2 :** Combien de temps faut-il pour ancrer une nouvelle habitude selon la recherche ?\na) 7 jours  b) 21 jours  c) 66 jours  d) 100 jours\n\n✅ **Réponse : c) 66 jours** en moyenne selon Phillippa Lally (UCL, 2010).\n\n> 💡 Utilisez l'onglet Quiz pour des tests générés depuis vos documents !`
  }

  if (m.includes('explique') || m.includes('c\'est quoi') || m.includes('qu\'est-ce') || m.includes('définition') || m.includes('definition')) {
    return `Excellente question ! Laisse-moi t'expliquer ce concept de façon claire 💡\n\n**Définition simple :**\nCe concept fait référence à un ensemble de principes organisés qui permettent de comprendre et d'analyser un phénomène de manière structurée.\n\n**Analogie :**\nPense à ça comme une carte routière : elle ne contient pas toute la réalité, mais elle te donne les informations essentielles pour naviguer efficacement.\n\n**Exemple concret :**\nDans la pratique quotidienne, ce principe s'applique chaque fois que tu analyses une situation complexe en la décomposant en éléments simples.\n\n**Pour aller plus loin :**\nJe te recommande de créer des flashcards sur ce sujet pour mieux le mémoriser ! 🃏\n\n> 💡 Importez vos cours PDF pour des explications basées sur votre contenu réel !`
  }

  if (m.includes('aide') || m.includes('help') || m.includes('peux-tu') || m.includes('peux tu') || m.includes('salut') || m.includes('bonjour') || m.includes('hello')) {
    return `Salut ! Je suis ton assistant SmartStudy AI 🤖✨\n\nVoici ce que je peux faire pour toi :\n\n📚 **Expliquer** un concept de ton cours\n📋 **Résumer** un chapitre ou un document\n🃏 **Créer des flashcards** sur n'importe quel sujet\n❓ **Générer un quiz** pour tester tes connaissances\n🧠 **Répondre** à toutes tes questions de cours\n\n**Essaie par exemple :**\n→ *"Explique-moi la loi de l'offre et de la demande"*\n→ *"Crée des flashcards sur la Révolution française"*\n→ *"Résume les grandes étapes de la photosynthèse"*\n\n> ⚠️ Mode démo actif. Connecte le backend pour l'IA sur tes vrais documents.`
  }

  if (m.includes('pomodoro') || m.includes('méthode') || m.includes('technique') || m.includes('révision')) {
    return `La **technique Pomodoro** est l'une des meilleures méthodes de productivité ! ⏱️\n\n**Comment ça marche :**\n1. ✅ Choisissez une tâche à accomplir\n2. ⏰ Réglez un minuteur sur **25 minutes**\n3. 🎯 Travaillez avec concentration totale jusqu'à la sonnerie\n4. ☕ Prenez une **pause de 5 minutes**\n5. 🔄 Après 4 cycles, prenez une pause de **15-30 minutes**\n\n**Pourquoi ça fonctionne ?**\n• Réduit la procrastination en rendant le travail moins intimidant\n• Maintient la concentration grâce aux pauses régulières\n• Permet de mesurer sa productivité\n\n**Combiné avec le SRS de SmartStudy**, tu peux réviser pendant les Pomodoros et laisser l'app optimiser tes intervalles automatiquement 🚀`
  }

  // Default response
  const responses = [
    `Très bonne question ! 🎓\n\nPour répondre précisément à "${message}", je vais décomposer le sujet :\n\n**Contexte général :**\nCe sujet s'inscrit dans un cadre d'apprentissage structuré qui nécessite de comprendre les fondamentaux avant d'aborder les concepts avancés.\n\n**Points essentiels à maîtriser :**\n• Comprendre les définitions de base\n• Identifier les relations entre les concepts\n• Pratiquer avec des exemples concrets\n• Réviser régulièrement avec la méthode SRS\n\n> 💡 Pour des réponses précises basées sur tes cours, connecte le backend et importe tes PDFs !`,
    `Super question ! Voici ma réponse 🧠\n\nSur le sujet "${message}", voici ce qu'il faut retenir :\n\n**L'essentiel :**\nTout concept complexe peut être décomposé en éléments simples. La clé est de partir des principes fondamentaux et de construire progressivement sa compréhension.\n\n**Méthode recommandée :**\n1. Lire la définition officielle\n2. Chercher 2-3 exemples concrets\n3. Créer une flashcard\n4. Réviser après 1 jour, 3 jours, 1 semaine\n\n> ⚠️ Mode démo — connecte le backend pour des réponses basées sur tes vrais documents !`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

export default function ChatPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocs, setSelectedDocs] = useState<number[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [geminiKey, setGeminiKey] = useState<string | null>(null)
  const [geminiError, setGeminiError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadDocuments()
    loadHistory()
    // Load Gemini key saved in settings
    const key = localStorage.getItem('gemini_api_key')
    if (key) setGeminiKey(key)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadDocuments = async () => {
    try {
      const docs = await documentsApi.list()
      setDocuments(docs)
    } catch {
      // Backend offline — that's fine
    }
  }

  const loadHistory = async () => {
    try {
      const history = await chatApi.getHistory(50)
      setMessages(history)
    } catch {
      // Backend offline
    } finally {
      setLoadingHistory(false)
    }
  }

  const toggleDocument = (docId: number) => {
    setSelectedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = input
    setInput('')
    setLoading(true)

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      session_id: 0,
      role: 'user',
      content: userMessage,
      tokens: 0,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      const response = await chatApi.send({
        user_message: userMessage,
        document_ids: selectedDocs.length > 0 ? selectedDocs : undefined,
      })

      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        session_id: 0,
        role: 'assistant',
        content: response.content,
        tokens: response.tokens_used,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
      setLoading(false)
    } catch {
      // Backend offline — try Gemini direct if key is available
      if (geminiKey) {
        try {
          setGeminiError('')
          const text = await callGeminiDirect(geminiKey, messages, userMessage)
          const geminiMsg: ChatMessage = {
            id: Date.now() + 1,
            session_id: 0,
            role: 'assistant',
            content: text,
            tokens: 0,
            created_at: new Date().toISOString(),
          }
          setMessages(prev => [...prev, geminiMsg])
        } catch (geminiErr: any) {
          setGeminiError(geminiErr?.message || 'Erreur Gemini')
          const fallbackMsg: ChatMessage = {
            id: Date.now() + 1,
            session_id: 0,
            role: 'assistant',
            content: `⚠️ Erreur Gemini : ${geminiErr?.message || 'Clé invalide ou quota dépassé'}\n\nVérifie ta clé dans les [Paramètres](/settings).`,
            tokens: 0,
            created_at: new Date().toISOString(),
          }
          setMessages(prev => [...prev, fallbackMsg])
        } finally {
          setLoading(false)
        }
      } else {
        // No Gemini key — use keyword-based offline reply
        const reply = generateOfflineReply(userMessage)
        const mockMsg: ChatMessage = {
          id: Date.now() + 1,
          session_id: 0,
          role: 'assistant',
          content: reply,
          tokens: 0,
          created_at: new Date().toISOString(),
        }
        setTimeout(() => {
          setMessages(prev => [...prev, mockMsg])
          setLoading(false)
        }, 700 + Math.random() * 500)
      }
    }
  }

  const clearHistory = async () => {
    try {
      await chatApi.clearHistory()
    } catch {}
    setMessages([])
  }

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10">
            <MessageSquare className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Chat IA</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {geminiKey ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <Zap className="h-3 w-3" />
                  Gemini 2.0 Flash actif
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Votre tuteur intelligent personnel
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!geminiKey && (
            <Link href="/settings">
              <Button variant="outline" className="text-xs h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                Ajouter clé Gemini
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            onClick={clearHistory}
            disabled={loadingHistory || messages.length === 0}
            className="text-xs h-8 border-border/50 hover:bg-destructive/10 hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            Effacer l'historique
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Document Selection Sidebar */}
        {documents.length > 0 && (
          <Card className="w-56 h-full flex flex-col glass border-border/50 shrink-0">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Contexte
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-1.5 px-3 pb-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 text-xs ${
                    selectedDocs.includes(doc.id)
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'bg-secondary/30 hover:bg-secondary/60 border border-transparent'
                  }`}
                  onClick={() => toggleDocument(doc.id)}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-medium line-clamp-2">{doc.title}</span>
                    {selectedDocs.includes(doc.id) && (
                      <X className="h-3 w-3 shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col glass rounded-2xl border border-border/50 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-auto p-5 space-y-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 rounded-2xl bg-teal-500/5 mb-4">
                  <Sparkles className="h-10 w-10 text-teal-400/60" />
                </div>
                <p className="text-base font-semibold text-foreground/80">Démarrer une conversation</p>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-sm">
                  Posez n'importe quelle question sur vos cours. Sélectionnez des documents à gauche pour un contexte ciblé.
                </p>
                {/* Suggestions */}
                <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
                  {[
                    'Explique-moi la photosynthèse',
                    'Résume ce chapitre en 5 points',
                    'Crée des flashcards sur ce sujet'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); }}
                      className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/30 transition-all duration-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 mt-1">
                      <div className="p-1.5 rounded-lg bg-teal-500/10">
                        <Bot className="h-4 w-4 text-teal-400" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'gradient-primary text-white rounded-br-md'
                        : 'bg-secondary/50 border border-border/30 rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownText content={msg.content} />
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                    {msg.tokens > 0 && (
                      <p className="text-[10px] mt-2 opacity-50 font-mono">
                        {msg.tokens} tokens
                      </p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="shrink-0 mt-1">
                      <div className="p-1.5 rounded-lg gradient-primary">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-3 animate-slide-up">
                <div className="shrink-0 mt-1">
                  <div className="p-1.5 rounded-lg bg-teal-500/10">
                    <Bot className="h-4 w-4 text-teal-400" />
                  </div>
                </div>
                <div className="bg-secondary/50 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-teal-400 typing-dot" />
                    <div className="w-2 h-2 rounded-full bg-teal-400 typing-dot" />
                    <div className="w-2 h-2 rounded-full bg-teal-400 typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border/30 p-4 bg-card/50">
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Posez votre question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={loading}
                className="flex-1 h-11 bg-secondary/30 border-border/30 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="h-11 w-11 p-0 gradient-primary text-white rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.03] transition-all shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {selectedDocs.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {selectedDocs.length} document{selectedDocs.length > 1 ? 's' : ''} sélectionné{selectedDocs.length > 1 ? 's' : ''} comme contexte
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
