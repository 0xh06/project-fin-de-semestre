'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, FileText, X, Sparkles, Bot, User } from 'lucide-react'
import { chatApi, documentsApi } from '@/lib/api'
import { Document, ChatMessage } from '@/types'

export default function ChatPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocs, setSelectedDocs] = useState<number[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadDocuments()
    loadHistory()
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
    } catch {
      // Simulate a response when backend is offline
      const mockMsg: ChatMessage = {
        id: Date.now() + 1,
        session_id: 0,
        role: 'assistant',
        content: 'Je suis l\'assistant SmartStudy AI. Le serveur backend n\'est pas disponible actuellement, mais une fois connecté, je pourrai analyser vos documents, répondre à vos questions de cours et vous aider dans vos révisions ! 🧠',
        tokens: 0,
        created_at: new Date().toISOString(),
      }
      setTimeout(() => {
        setMessages(prev => [...prev, mockMsg])
      }, 800)
    } finally {
      setLoading(false)
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
            <p className="text-xs text-muted-foreground">Votre tuteur intelligent personnel</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={clearHistory}
          disabled={loadingHistory || messages.length === 0}
          className="text-xs h-8 border-border/50 hover:bg-destructive/10 hover:text-red-400 hover:border-red-500/30 transition-all"
        >
          Effacer l'historique
        </Button>
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
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
