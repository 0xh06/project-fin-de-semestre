'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Upload, BrainCircuit, Trash2 } from 'lucide-react'
import { documentsApi } from '@/lib/api'
import { Document } from '@/types'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const docs = await documentsApi.list()
      setDocuments(docs)
    } catch (err) {
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    try {
      await documentsApi.upload(file)
      setFile(null)
      loadDocuments()
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyze = async (id: number) => {
    try {
      await documentsApi.analyze(id)
      loadDocuments()
    } catch (err) {
      console.error('Analysis failed:', err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await documentsApi.delete(id)
      loadDocuments()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="p-8">
      <h1 className="mb-8 text-3xl font-bold">Documents</h1>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer un document
          </CardTitle>
          <CardDescription>
            Importez des PDF ou fichiers texte pour l'analyse IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex-1"
            />
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? 'Importation...' : 'Importer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="grid gap-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun document importé</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{doc.title}</CardTitle>
                    <CardDescription>
                      Importé le {new Date(doc.imported_at).toLocaleDateString('fr-FR')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {doc.summary_ai ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Résumé IA</h4>
                      <p className="text-sm text-muted-foreground">{doc.summary_ai}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAnalyze(doc.id)}
                        disabled={uploading}
                      >
                        <BrainCircuit className="h-4 w-4 mr-2" />
                        Réanalyser
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleAnalyze(doc.id)}
                    disabled={uploading}
                  >
                    <BrainCircuit className="h-4 w-4 mr-2" />
                    Analyser avec l'IA
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
