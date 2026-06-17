'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, FileText, X, Loader2, Sparkles } from 'lucide-react'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  tokens: number
  timestamp: Date
}

interface Document {
  id: number
  title: string
}

interface ChatInterfaceProps {
  onSendMessage?: (message: string, documentIds?: number[]) => Promise<{ content: string; tokens: number }>
  onClearHistory?: () => void
  documents?: Document[]
}

export function ChatInterface({ 
  onSendMessage, 
  onClearHistory, 
  documents = [] 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedDocs, setSelectedDocs] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const toggleDocument = (docId: number) => {
    setSelectedDocs(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput('')
    setLoading(true)
    setStreamingContent('')

    // Add user message
    const newMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      tokens: 0,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newMessage])

    try {
      if (onSendMessage) {
        // Simulate streaming
        const response = await onSendMessage(userMessage, selectedDocs)
        
        // Simulate streaming effect
        let streamedText = ''
        const words = response.content.split(' ')
        for (let i = 0; i < words.length; i++) {
          streamedText += (i > 0 ? ' ' : '') + words[i]
          setStreamingContent(streamedText)
          await new Promise(resolve => setTimeout(resolve, 30))
        }

        // Add assistant message
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.content,
          tokens: response.tokens,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, assistantMessage])
        setStreamingContent('')

        // Generate follow-up suggestions
        generateSuggestions(userMessage, response.content)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSuggestions = (userMessage: string, assistantResponse: string) => {
    // Simple suggestion generation based on context
    const baseSuggestions = [
      'Peux-tu développer ce point?',
      'Donne-moi un exemple concret',
      'Quelles sont les implications?',
      'Résume en quelques mots',
    ]
    setSuggestions(baseSuggestions.slice(0, 3))
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const handleClearHistory = () => {
    setMessages([])
    setSuggestions([])
    onClearHistory?.()
  }

  const totalTokens = messages.reduce((sum, msg) => sum + msg.tokens, 0)

  return (
    <div className="flex h-full gap-4">
      {/* Document Selector Sidebar */}
      <div className="w-64 flex flex-col">
        <h3 className="font-semibold mb-3 text-sm">Documents contextuels</h3>
        <div className="flex-1 space-y-2 overflow-auto">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => toggleDocument(doc.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedDocs.includes(doc.id)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-secondary border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium line-clamp-2">{doc.title}</span>
                {selectedDocs.includes(doc.id) && (
                  <X className="h-3 w-3 flex-shrink-0 ml-2" />
                )}
              </div>
            </button>
          ))}
        </div>
        {selectedDocs.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {selectedDocs.length} document(s) sélectionné(s)
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Sparkles className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium mb-2">Commencez une conversation</p>
              <p className="text-sm">Sélectionnez des documents pour un contexte spécifique</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
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
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {msg.timestamp.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {msg.tokens > 0 && (
                        <span className="text-xs opacity-70 ml-2">
                          {msg.tokens} tokens
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming indicator */}
              {loading && streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-lg p-4 max-w-[70%]">
                    <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                    <div className="flex space-x-1 mt-2">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {loading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-lg p-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && !loading && (
          <div className="px-4 py-2 border-t">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="whitespace-nowrap"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Posez une question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || loading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Token indicator */}
          <div className="flex items-center justify-between mt-2">
            {selectedDocs.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>{selectedDocs.length} document(s) en contexte</span>
              </div>
            )}
            {totalTokens > 0 && (
              <div className="text-xs text-muted-foreground">
                Total tokens: {totalTokens}
              </div>
            )}
          </div>
        </div>

        {/* Clear history button */}
        {messages.length > 0 && (
          <div className="px-4 pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="w-full"
            >
              Effacer l'historique
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
