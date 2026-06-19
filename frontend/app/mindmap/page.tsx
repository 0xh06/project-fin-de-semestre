'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Network, Plus, FileText, Sparkles, GitBranch, Circle } from 'lucide-react'
import { mindmapApi, documentsApi } from '@/lib/api'
import { MindMap, Document } from '@/types'
import Link from 'next/link'

// Demo mindmap visual
function DemoMindmap() {
  const nodes = [
    { id: 'root', label: 'Concept Central', x: 50, y: 50, color: 'bg-primary/20 border-primary/40 text-primary', size: 'px-4 py-2 text-sm font-bold' },
    { id: 'n1', label: 'Idée principale 1', x: 15, y: 20, color: 'bg-blue-500/10 border-blue-500/30 text-blue-400', size: 'px-3 py-1.5 text-xs font-medium' },
    { id: 'n2', label: 'Idée principale 2', x: 80, y: 20, color: 'bg-purple-500/10 border-purple-500/30 text-purple-400', size: 'px-3 py-1.5 text-xs font-medium' },
    { id: 'n3', label: 'Idée principale 3', x: 15, y: 78, color: 'bg-teal-500/10 border-teal-500/30 text-teal-400', size: 'px-3 py-1.5 text-xs font-medium' },
    { id: 'n4', label: 'Idée principale 4', x: 80, y: 78, color: 'bg-amber-500/10 border-amber-500/30 text-amber-400', size: 'px-3 py-1.5 text-xs font-medium' },
    { id: 'n1a', label: 'Détail A', x: 2, y: 8, color: 'bg-secondary/60 border-border/40 text-muted-foreground', size: 'px-2 py-1 text-[10px]' },
    { id: 'n1b', label: 'Détail B', x: 5, y: 35, color: 'bg-secondary/60 border-border/40 text-muted-foreground', size: 'px-2 py-1 text-[10px]' },
    { id: 'n2a', label: 'Détail C', x: 88, y: 8, color: 'bg-secondary/60 border-border/40 text-muted-foreground', size: 'px-2 py-1 text-[10px]' },
    { id: 'n2b', label: 'Détail D', x: 92, y: 35, color: 'bg-secondary/60 border-border/40 text-muted-foreground', size: 'px-2 py-1 text-[10px]' },
  ]

  return (
    <div className="relative w-full h-64 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <line x1="50%" y1="50%" x2="17%" y2="22%" stroke="hsl(217.2 91.2% 59.8% / 0.3)" strokeWidth="1.5" strokeDasharray="4,3" />
        <line x1="50%" y1="50%" x2="82%" y2="22%" stroke="hsl(250 70% 56% / 0.3)" strokeWidth="1.5" strokeDasharray="4,3" />
        <line x1="50%" y1="50%" x2="17%" y2="78%" stroke="hsl(174 60% 51% / 0.3)" strokeWidth="1.5" strokeDasharray="4,3" />
        <line x1="50%" y1="50%" x2="82%" y2="78%" stroke="hsl(43 96% 56% / 0.3)" strokeWidth="1.5" strokeDasharray="4,3" />
        <line x1="17%" y1="22%" x2="5%" y2="10%" stroke="hsl(217.2 32.6% 25% / 0.5)" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="17%" y1="22%" x2="8%" y2="36%" stroke="hsl(217.2 32.6% 25% / 0.5)" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="82%" y1="22%" x2="90%" y2="10%" stroke="hsl(217.2 32.6% 25% / 0.5)" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="82%" y1="22%" x2="94%" y2="36%" stroke="hsl(217.2 32.6% 25% / 0.5)" strokeWidth="1" strokeDasharray="3,3" />
      </svg>
      {nodes.map((node) => (
        <div
          key={node.id}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-lg border ${node.color} ${node.size} whitespace-nowrap`}
          style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: 1 }}
        >
          {node.label}
        </div>
      ))}
    </div>
  )
}

export default function MindmapPage() {
  const [mindmaps, setMindmaps] = useState<MindMap[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [generating, setGenerating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const docs = await documentsApi.list()
      setDocuments(docs)
    } catch {
      // offline
    }
    setLoading(false)
  }

  const handleGenerate = async (docId: number) => {
    setGenerating(docId)
    try {
      const mm = await mindmapApi.generate(docId)
      setMindmaps(prev => [mm, ...prev])
    } catch {
      // Backend offline — show demo mindmap
      const doc = documents.find(d => d.id === docId)
      const demoMindmap: MindMap = {
        id: Date.now(),
        document_id: docId,
        title: doc?.title ? `Mindmap — ${doc.title}` : 'Mindmap générée',
        nodes: [],
        edges: [],
        created_at: new Date().toISOString(),
      }
      setMindmaps(prev => [demoMindmap, ...prev])
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-teal-500/10">
          <Network className="h-5 w-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Cartes Mentales</h1>
          <p className="text-xs text-muted-foreground">Visualisez les concepts de vos cours</p>
        </div>
      </div>

      {/* Demo Preview */}
      <Card className="glass border-border/50 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            Exemple de carte mentale générée par l'IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DemoMindmap />
        </CardContent>
      </Card>

      {/* Generate from documents */}
      {documents.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            Générer depuis vos documents
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="glass border-border/50 hover:border-teal-500/20 transition-all duration-300 group">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-500/10 shrink-0">
                      <FileText className="h-4 w-4 text-indigo-400" />
                    </div>
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleGenerate(doc.id)}
                    disabled={generating === doc.id}
                    className="shrink-0 h-8 gradient-primary text-white text-xs gap-1.5 hover:scale-[1.02] transition-all shadow-sm"
                  >
                    {generating === doc.id ? (
                      <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    Générer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Generated mindmaps */}
      {mindmaps.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Circle className="h-4 w-4 text-teal-400" />
            Cartes générées ({mindmaps.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {mindmaps.map((mm) => (
              <Card key={mm.id} className="glass border-border/50 hover:border-teal-500/20 transition-all duration-300 group overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-semibold text-sm">{mm.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {mm.created_at ? new Date(mm.created_at).toLocaleDateString('fr-FR') : 'Récemment'}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-teal-500/10 shrink-0">
                      <Network className="h-4 w-4 text-teal-400" />
                    </div>
                  </div>
                  <DemoMindmap />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state — no documents */}
      {!loading && documents.length === 0 && mindmaps.length === 0 && (
        <Card className="glass border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-secondary/30 mb-4">
              <Network className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground/70">Aucun document importé</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Importez d'abord un document pour générer une carte mentale automatiquement avec l'IA.
            </p>
            <Link href="/documents" className="mt-5">
              <Button className="gradient-primary text-white gap-2 hover:scale-[1.02] transition-all">
                <FileText className="h-4 w-4" />
                Importer un document
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
