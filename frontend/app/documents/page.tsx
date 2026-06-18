'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Upload, BrainCircuit, Trash2, File, CheckCircle2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { documentsApi } from '@/lib/api'
import { recordDocumentUpload } from '@/lib/progress'
import { Document } from '@/types'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const docs = await documentsApi.list()
      setDocuments(docs)
    } catch {
      // Show empty state when backend is offline
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      await documentsApi.upload(file)
      recordDocumentUpload()
      setFile(null)
      loadDocuments()
    } catch {
      // Backend offline — still record locally
      recordDocumentUpload()
      setFile(null)
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyze = async (id: number) => {
    try {
      await documentsApi.analyze(id)
      loadDocuments()
    } catch {
      console.error('Analysis failed')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await documentsApi.delete(id)
      loadDocuments()
    } catch {
      console.error('Delete failed')
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) setFile(droppedFile)
  }, [])

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-500/10">
          <FileText className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Documents</h1>
          <p className="text-xs text-muted-foreground">Importez et analysez vos cours avec l'IA</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : file
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-border/50 hover:border-border glass'
        }`}
        onClick={() => {
          if (!file) {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.pdf,.txt,.md,.docx'
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement
              if (target.files?.[0]) setFile(target.files[0])
            }
            input.click()
          }
        }}
      >
        {file ? (
          <div className="flex flex-col items-center gap-3 animate-scale-in">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(file.size / 1024).toFixed(1)} Ko • Prêt à importer
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={(e) => { e.stopPropagation(); handleUpload() }}
                disabled={uploading}
                className="gradient-primary text-white shadow-md shadow-primary/20 hover:scale-[1.02] transition-all gap-2"
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importation...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importer
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="border-border/50"
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-xl transition-colors duration-300 ${isDragging ? 'bg-primary/10' : 'bg-secondary/50'}`}>
              <Upload className={`h-8 w-8 transition-colors duration-300 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-semibold text-sm">Glissez-déposez votre document ici</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                ou cliquez pour parcourir • PDF, TXT, MD, DOCX
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      {documents.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-secondary/30 border-border/30 focus:border-primary/50 rounded-xl text-sm"
          />
        </div>
      )}

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card className="glass border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-secondary/30 mb-4">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground/70">
              {searchQuery ? 'Aucun résultat' : 'Aucun document'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? 'Essayez un autre terme de recherche' : 'Importez votre premier document pour commencer'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc, idx) => (
            <Card
              key={doc.id}
              className="glass border-border/50 hover:border-indigo-500/20 transition-all duration-300 group animate-slide-up overflow-hidden"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-bold truncate">{doc.title}</CardTitle>
                    <CardDescription className="text-[11px] mt-1">
                      Importé le {new Date(doc.imported_at).toLocaleDateString('fr-FR')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.id)}
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {doc.summary_ai ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{doc.summary_ai}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                        ✓ Analysé
                      </span>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleAnalyze(doc.id)}
                    className="w-full gradient-primary text-white text-xs h-8 gap-1.5 shadow-sm hover:scale-[1.02] transition-all"
                  >
                    <BrainCircuit className="h-3.5 w-3.5" />
                    Analyser avec l'IA
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
