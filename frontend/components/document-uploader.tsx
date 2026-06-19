'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

interface DocumentUploaderProps {
  onUploadComplete?: (file: File, summary: string) => void
  onError?: (error: string) => void
}

export function DocumentUploader({ onUploadComplete, onError }: DocumentUploaderProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (state !== 'idle') return

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      const validFile = droppedFiles.find(f => 
        f.type === 'application/pdf' || f.type === 'text/plain'
      )
      if (validFile) {
        setFile(validFile)
        startUpload(validFile)
      } else {
        setError('Format de fichier non supporté. Utilisez PDF ou TXT.')
        setState('error')
      }
    }
  }, [state])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && state === 'idle') {
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain') {
        setFile(selectedFile)
        startUpload(selectedFile)
      } else {
        setError('Format de fichier non supporté. Utilisez PDF ou TXT.')
        setState('error')
      }
    }
  }

  const startUpload = async (fileToUpload: File) => {
    setState('uploading')
    setUploadProgress(0)
    setError('')

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval)
          startAnalysis(fileToUpload)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const startAnalysis = async (fileToUpload: File) => {
    setState('analyzing')
    setAnalysisProgress(0)

    // Simulate analysis progress
    const analysisInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(analysisInterval)
          // Generate a sample summary
          const sampleSummary = `Ce document "${fileToUpload.name}" a été analysé avec succès. Il contient plusieurs sections importantes sur le sujet traité. Les points clés incluent les concepts fondamentaux, les exemples pratiques et les applications potentielles.`
          setSummary(sampleSummary)
          setState('done')
          onUploadComplete?.(fileToUpload, sampleSummary)
          return 100
        }
        return prev + 5
      })
    }, 300)
  }

  const reset = () => {
    setState('idle')
    setFile(null)
    setUploadProgress(0)
    setAnalysisProgress(0)
    setSummary('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
          state === 'idle' 
            ? 'border-primary/30 hover:border-primary hover:bg-primary/5 cursor-pointer'
            : 'border-muted bg-muted/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => state === 'idle' && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileSelect}
          className="hidden"
          disabled={state !== 'idle'}
        />

        {/* Idle State */}
        {state === 'idle' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Glissez-déposez votre fichier ici
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-muted-foreground">
              Formats supportés: PDF, TXT (max 10MB)
            </p>
          </div>
        )}

        {/* Uploading State */}
        {state === 'uploading' && file && (
          <div className="py-12">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="text-center font-medium mb-2">Téléchargement en cours...</p>
            <p className="text-center text-sm text-muted-foreground mb-4">
              {file.name} ({formatFileSize(file.size)})
            </p>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              {uploadProgress}%
            </p>
          </div>
        )}

        {/* Analyzing State */}
        {state === 'analyzing' && file && (
          <div className="py-12">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="text-center font-medium mb-2">Analyse IA en cours...</p>
            <p className="text-center text-sm text-muted-foreground mb-4">
              Génération du résumé et extraction des concepts clés
            </p>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              {analysisProgress}%
            </p>
          </div>
        )}

        {/* Done State */}
        {state === 'done' && file && (
          <div className="py-8">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <p className="text-center font-semibold mb-2">Document traité avec succès!</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{file.name}</span>
            </div>
            
            {summary && (
              <div className="mt-6 p-4 bg-secondary rounded-lg">
                <h4 className="font-semibold mb-2">Résumé IA</h4>
                <p className="text-sm text-muted-foreground">{summary}</p>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <Button onClick={reset} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Charger un autre document
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="py-12">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <p className="text-center font-semibold mb-2">Erreur</p>
            <p className="text-center text-sm text-muted-foreground mb-4">{error}</p>
            <div className="flex justify-center">
              <Button onClick={reset} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
