'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  BrainCircuit, 
  FileText, 
  MessageSquare, 
  Flame, 
  Map, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Compass, 
  Award, 
  ChevronRight,
  CheckCircle2,
  Lock
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token) {
      setIsLoggedIn(true)
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (_) {}
      }
    }
  }, [])

  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden font-sans relative">
      {/* Background gradients/glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-1/3 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-slate-900 bg-slate-950/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-all duration-300">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300 group-hover:text-white transition-colors duration-300">
              SmartStudy <span className="text-indigo-400">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors duration-200">Fonctionnalités</a>
            <a href="#preview" className="hover:text-white transition-colors duration-200">Aperçu</a>
            <a href="#benefits" className="hover:text-white transition-colors duration-200">Avantages</a>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400 hidden sm:inline">
                  Bonjour, <span className="font-semibold text-slate-200">{user?.name || 'Étudiant'}</span>
                </span>
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all duration-300 hover:scale-[1.02] flex items-center gap-2">
                    Tableau de bord
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <span className="text-sm font-medium text-slate-400 hover:text-white px-3 py-2 cursor-pointer transition-colors duration-200">
                    Connexion
                  </span>
                </Link>
                <Link href="/register">
                  <Button className="bg-white hover:bg-slate-100 text-slate-900 font-semibold px-4 transition-all duration-300 hover:scale-[1.02]">
                    S'inscrire
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Propulsé par l'Intelligence Artificielle de pointe</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400">
          Révisez plus intelligemment,<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Mémorisez plus rapidement.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl font-light leading-relaxed">
          SmartStudy AI transforme vos cours, PDF et documents en fiches de révision dynamiques, quiz personnalisés et cartes mentales pour maximiser votre réussite scolaire.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
          {isLoggedIn ? (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 hover:scale-[1.03] transition-all duration-300 px-8 py-6 rounded-xl flex items-center justify-center gap-2">
                Retour au tableau de bord
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 hover:scale-[1.03] transition-all duration-300 px-8 py-6 rounded-xl flex items-center justify-center gap-2">
                  Commencer gratuitement
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 px-8 py-6 rounded-xl hover:scale-[1.03] transition-all duration-300">
                  Démo gratuite
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Feature quick stats */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12 border-t border-slate-900 pt-10 w-full max-w-4xl text-center">
          <div>
            <p className="text-3xl font-extrabold text-white">98%</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">D'étudiants satisfaits</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">10x</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Gains de temps de révision</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">+2.4</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Points sur la moyenne générale</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">24/7</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Tuteur IA disponible</p>
          </div>
        </div>
      </section>

      {/* App Mockup / Preview Section */}
      <section id="preview" className="py-16 px-6 max-w-6xl mx-auto relative">
        <div className="relative rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur p-4 sm:p-6 shadow-2xl shadow-indigo-950/50">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          {/* Header style */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-slate-500 font-mono ml-2">https://app.smartstudy.ai/dashboard</span>
            </div>
            <div className="flex gap-2">
              <span className="w-16 h-2 bg-slate-900 rounded-full" />
              <span className="w-8 h-2 bg-indigo-950 rounded-full" />
            </div>
          </div>

          {/* Grid Layout Mockup */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Sidebar Mockup */}
            <div className="md:col-span-1 border-r border-slate-900 pr-6 hidden md:flex flex-col gap-4">
              <div className="flex items-center gap-2 p-2 bg-indigo-950/30 border border-indigo-900/30 rounded-lg text-indigo-300 text-sm font-semibold">
                <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                <span>Streak : 7 Jours ! 🔥</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Navigation</span>
                <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-md text-white text-sm font-medium">
                  <BrainCircuit className="h-4 w-4 text-indigo-400" />
                  <span>Tableau de bord</span>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-slate-900/30 rounded-md text-slate-400 hover:text-white text-sm transition-all duration-200">
                  <FileText className="h-4 w-4" />
                  <span>Mes Documents</span>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-slate-900/30 rounded-md text-slate-400 hover:text-white text-sm transition-all duration-200">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat IA</span>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-slate-900/30 rounded-md text-slate-400 hover:text-white text-sm transition-all duration-200">
                  <Map className="h-4 w-4" />
                  <span>Mindmaps</span>
                </div>
              </div>
              <div className="mt-auto border-t border-slate-900 pt-4">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                  <span>Niveau 4</span>
                  <span>1450 / 2000 XP</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[72%]" />
                </div>
              </div>
            </div>

            {/* Content Mockup */}
            <div className="md:col-span-2 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Bonjour ! Prêt pour la session d'aujourd'hui ?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Optimisons votre mémoire de travail avec l'IA.</p>
                </div>
                <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded">Progression : 82%</span>
              </div>

              {/* Cards Mockup */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl flex flex-col justify-between h-32">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] text-green-400 font-semibold px-1.5 py-0.5 rounded bg-green-500/10">Prêt</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Fiches d'Anatomie</h4>
                    <p className="text-[11px] text-slate-400 mt-1">24 cartes dues à réviser aujourd'hui.</p>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl flex flex-col justify-between h-32">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] text-indigo-400 font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10">Nouveau</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Cours_Microeconomie.pdf</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Analysé. 10 flashcards & mindmap générées.</p>
                  </div>
                </div>
              </div>

              {/* Chat AI mock screen */}
              <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">Assistant SmartStudy AI</span>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="self-end bg-indigo-600/30 text-indigo-100 rounded-lg px-3 py-2 max-w-[85%]">
                    Explique-moi l'effet d'éviction en macroéconomie en 2 phrases simples.
                  </div>
                  <div className="self-start bg-slate-900/80 text-slate-300 rounded-lg px-3 py-2 max-w-[85%] border border-slate-800">
                    L'effet d'éviction se produit lorsque l'État augmente ses dépenses en empruntant sur les marchés, ce qui fait grimper les taux d'intérêt. Cela décourage ainsi les investissements privés et la consommation, qui se trouvent « évincés ».
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tout ce dont vous avez besoin pour réussir
          </h2>
          <p className="mt-4 text-slate-400 font-light text-base">
            SmartStudy AI rassemble les meilleures techniques de mémorisation active dans une interface unifiée.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <Card className="bg-slate-900/30 border-slate-900/80 hover:border-slate-800/80 transition-all duration-300 group hover:-translate-y-1">
            <CardContent className="p-8 flex flex-col gap-5">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Analyse de Documents</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  Glissez vos fichiers PDF, images de cours ou notes de cours. L'IA extrait les points clés, concepts obscurs et formule des explications simples.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="bg-slate-900/30 border-slate-900/80 hover:border-slate-800/80 transition-all duration-300 group hover:-translate-y-1">
            <CardContent className="p-8 flex flex-col gap-5">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Répétition Espacée</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  Consultez des flashcards créées automatiquement. Notre algorithme optimise les intervalles de révision selon la méthode Leitner pour une mémorisation à long terme.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="bg-slate-900/30 border-slate-900/80 hover:border-slate-800/80 transition-all duration-300 group hover:-translate-y-1">
            <CardContent className="p-8 flex flex-col gap-5">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Compagnon de Chat IA</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  Discutez avec une intelligence artificielle contextuelle qui connaît par cœur vos cours importés. Posez des questions, demandez des analogies ou des exemples concrets.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="bg-slate-900/30 border-slate-900/80 hover:border-slate-800/80 transition-all duration-300 group hover:-translate-y-1">
            <CardContent className="p-8 flex flex-col gap-5">
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                <Map className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Cartes Mentales (Mindmaps)</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  Visualisez les liens conceptuels de vos cours sous forme de cartes d'idées interactives. Parfait pour les profils d'apprentissage visuels.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card className="bg-slate-900/30 border-slate-900/80 hover:border-slate-800/80 transition-all duration-300 group hover:-translate-y-1">
            <CardContent className="p-8 flex flex-col gap-5">
              <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Suivi & Gamification</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  Progressez dans les niveaux d'XP, gagnez des badges d'études exclusifs et maintenez votre série quotidienne de révisions pour créer des habitudes d'apprentissage solides.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="bg-slate-900/30 border-slate-900/80 hover:border-slate-800/80 transition-all duration-300 group hover:-translate-y-1">
            <CardContent className="p-8 flex flex-col gap-5">
              <div className="p-3 bg-pink-500/10 text-pink-400 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Quiz Générés Automatiquement</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  Testez vos connaissances en fin de cours grâce à des QCM et des questions ouvertes rédigés par l'IA d'après votre propre programme d'études.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-6 bg-slate-900/20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold mb-6">
              <Zap className="h-3.5 w-3.5" />
              <span>Pourquoi SmartStudy AI ?</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ne travaillez pas plus dur.<br />Travaillez plus intelligemment.
            </h2>
            <p className="mt-4 text-slate-400 font-light leading-relaxed">
              La plupart des étudiants passent 80% de leur temps à faire des fiches et seulement 20% à mémoriser. SmartStudy AI inverse la tendance : laissez l'intelligence artificielle faire la synthèse et concentrez-vous sur ce qui compte vraiment.
            </p>

            <ul className="mt-8 flex flex-col gap-4">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300 font-light">Génération instantanée de résumés structurés d'après n'importe quel PDF ou cours manuscrit.</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300 font-light">Spaced Repetition System (SRS) basé sur les sciences cognitives pour ne plus oublier la veille des examens.</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300 font-light">Des statistiques détaillées pour identifier précisément vos points forts et faibles.</span>
              </li>
            </ul>
          </div>

          <div className="relative flex justify-center">
            {/* Ambient shadow behind floating panels */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />
              
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-400" />
                Derniers Badges Débloqués
              </h4>
              
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex gap-4 p-3 bg-slate-900/60 rounded-xl border border-slate-900/60">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <h5 className="text-sm font-bold text-white">Série Héroïque</h5>
                    <p className="text-xs text-slate-400">7 jours d'activité consécutifs.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-3 bg-slate-900/60 rounded-xl border border-slate-900/60">
                  <span className="text-2xl">📚</span>
                  <div>
                    <h5 className="text-sm font-bold text-white">Bibliothécaire</h5>
                    <p className="text-xs text-slate-400">10 documents importés et analysés.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-3 bg-slate-900/60 rounded-xl border border-slate-900/60">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <h5 className="text-sm font-bold text-white">Grand Maître</h5>
                    <p className="text-xs text-slate-400">100 flashcards maîtrisées.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center max-w-5xl mx-auto relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md my-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Prêt à transformer vos résultats ?
        </h2>
        <p className="mt-4 text-slate-400 font-light max-w-xl mx-auto text-base">
          Rejoignez des milliers d'étudiants qui utilisent déjà SmartStudy AI pour réviser sereinement et briller à leurs examens.
        </p>

        <div className="mt-8 flex justify-center">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 hover:scale-[1.03] transition-all duration-300 px-8 py-6 rounded-xl flex items-center justify-center gap-2">
                Accéder au Tableau de bord
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 hover:scale-[1.03] transition-all duration-300 px-8 py-6 rounded-xl flex items-center justify-center gap-2">
                Créer mon compte gratuit
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-indigo-500" />
            <span className="font-semibold text-slate-400">SmartStudy AI</span>
          </div>
          <p>© {new Date().getFullYear()} SmartStudy AI. Tous droits réservés.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">CGU</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
