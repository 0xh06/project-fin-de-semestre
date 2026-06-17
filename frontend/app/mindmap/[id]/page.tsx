'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Network, Download, RefreshCw } from 'lucide-react'
import { mindmapApi, documentsApi } from '@/lib/api'
import { MindMap, Document } from '@/types'

export default function MindmapPage() {
  const params = useParams()
  const id = parseInt(params.id as string)
  
  const [mindmap, setMindmap] = useState<MindMap | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadMindmap()
    loadDocuments()
  }, [id])

  const loadMindmap = async () => {
    setLoading(true)
    try {
      const data = await mindmapApi.getById(id)
      setMindmap(data)
    } catch (err) {
      console.error('Failed to load mindmap:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    try {
      const docs = await documentsApi.list()
      setDocuments(docs)
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
  }

  const generateMindmap = async (documentId: number) => {
    setGenerating(true)
    try {
      const newMindmap = await mindmapApi.generate(documentId)
      setMindmap(newMindmap)
    } catch (err) {
      console.error('Failed to generate mindmap:', err)
    } finally {
      setGenerating(false)
    }
  }

  const saveMindmap = async () => {
    if (!mindmap) return
    
    try {
      const saved = await mindmapApi.save(mindmap)
      setMindmap(saved)
    } catch (err) {
      console.error('Failed to save mindmap:', err)
    }
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mind Map</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMindmap} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={saveMindmap} disabled={!mindmap}>
            <Download className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {!mindmap ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Générer une Mind Map
            </CardTitle>
            <CardDescription>
              Sélectionnez un document pour générer une mind map automatiquement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {documents.map((doc) => (
                <Button
                  key={doc.id}
                  variant="outline"
                  onClick={() => generateMindmap(doc.id)}
                  disabled={generating}
                  className="justify-start"
                >
                  {doc.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{mindmap.title}</CardTitle>
              <CardDescription>
                {mindmap.nodes.length} nœuds • {mindmap.edges.length} relations
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Mind Map Visualization */}
          <Card className="h-[600px]">
            <CardContent className="h-full p-0 relative">
              <div className="absolute inset-0 flex items-center justify-center bg-secondary/10">
                <div className="text-center">
                  <Network className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Visualisation de la mind map
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Intégration avec React Flow ou D3.js requise
                  </p>
                </div>
              </div>

              {/* Sample visualization placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {mindmap.nodes.map((node) => (
                    <div
                      key={node.id}
                      className="absolute p-3 rounded-lg border-2 shadow-md cursor-pointer hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: node.color,
                        borderColor: node.color,
                        left: `${(node.id * 10) % 80 + 10}%`,
                        top: `${(node.id * 15) % 60 + 20}%`,
                      }}
                    >
                      <p className="text-sm font-medium text-white drop-shadow">
                        {node.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nodes List */}
          <Card>
            <CardHeader>
              <CardTitle>Nœuds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {mindmap.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="p-3 rounded-lg border"
                    style={{ borderColor: node.color }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: node.color }}
                      />
                      <span className="text-sm font-medium">ID: {node.id}</span>
                    </div>
                    <p className="text-sm">{node.label}</p>
                    {node.parent_id > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Parent: {node.parent_id}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edges List */}
          <Card>
            <CardHeader>
              <CardTitle>Relations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mindmap.edges.map((edge, index) => (
                  <div key={index} className="p-3 rounded-lg border bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {edge.from_id} → {edge.to_id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {edge.relation_label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
