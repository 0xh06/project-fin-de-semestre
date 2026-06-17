'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, FileText, X } from 'lucide-react'
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
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
  }

  const loadHistory = async () => {
    try {
      const history = await chatApi.getHistory(50)
      setMessages(history)
    } catch (err) {
      console.error('Failed to load history:', err)
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

    // Add user message to UI immediately
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
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessages(prev => [...prev.slice(0, -1)]) // Remove temp message on error
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    try {
      await chatApi.clearHistory()
      setMessages([])
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chat IA</h1>
        <Button variant="outline" onClick={clearHistory} disabled={loadingHistory}>
          Effacer l'historique
        </Button>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Document Selection Sidebar */}
        <Card className="w-64 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              Sélectionnez pour contexte
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedDocs.includes(doc.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-secondary'
                }`}
                onClick={() => toggleDocument(doc.id)}
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium line-clamp-2">{doc.title}</span>
                  {selectedDocs.includes(doc.id) && (
                    <X className="h-4 w-4 flex-shrink-0 ml-2" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col h-full">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {loadingHistory ? (
                <div className="text-center text-muted-foreground">Chargement...</div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4" />
                  <p>Commencez une conversation avec l'IA</p>
                  <p className="text-sm">Sélectionnez des documents pour un contexte spécifique</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.tokens > 0 && (
                        <p className="text-xs mt-2 opacity-70">
                          {msg.tokens} tokens
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Posez une question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={loading}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!input.trim() || loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {selectedDocs.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedDocs.length} document(s) sélectionné(s)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
