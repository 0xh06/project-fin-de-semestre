'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, User, Key, Palette, Bell, LogOut, CheckCircle2, AlertCircle } from 'lucide-react'
import { authApi } from '@/lib/api'
import { User as UserType } from '@/types'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Form states
  const [username, setUsername] = useState('Étudiant')
  const [email, setEmail] = useState('user@smartstudy.ai')
  const [apiKey, setApiKey] = useState('')
  const [theme, setTheme] = useState('dark')
  const [notifications, setNotifications] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const userData = await authApi.getCurrentUser()
      setUser(userData)
      if (userData.username) setUsername(userData.username)
      if (userData.email) setEmail(userData.email)
    } catch {
      // Offline fallback: load from localStorage
      const stored = localStorage.getItem('user')
      if (stored) {
        try {
          const u = JSON.parse(stored)
          setUser(u)
          if (u.username) setUsername(u.username)
          if (u.email) setEmail(u.email)
        } catch {}
      } else {
        setUser({ id: 1, email: 'user@smartstudy.ai', username: 'Étudiant', created_at: new Date().toISOString() })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Update local storage if needed
      const stored = localStorage.getItem('user')
      if (stored) {
        try {
          const u = JSON.parse(stored)
          u.username = username
          localStorage.setItem('user', JSON.stringify(u))
        } catch {}
      }
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto animate-fade-in relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Paramètres</h1>
            <p className="text-sm text-muted-foreground">Gérez votre compte et vos préférences</p>
          </div>
        </div>

        {/* Profile Section */}
        <Card className="glass border-border/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="border-b border-border/30 bg-secondary/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-blue-400" />
              Profil Utilisateur
            </CardTitle>
            <CardDescription>
              Informations publiques de votre compte SmartStudy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom d'utilisateur</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="votre_pseudo"
                  className="h-11 bg-secondary/30 border-border/40 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adresse Email</label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="h-11 bg-secondary/10 border-border/20 text-muted-foreground cursor-not-allowed rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  Contactez le support pour modifier votre email
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="glass border-border/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="border-b border-border/30 bg-secondary/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-purple-400" />
              Apparence
            </CardTitle>
            <CardDescription>
              Personnalisez l'interface de l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Thème Global</label>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      theme === t ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-border/40 bg-secondary/30 hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full border-4 shadow-inner ${
                      t === 'light' ? 'bg-white border-slate-200' : t === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-gradient-to-br from-white to-slate-900 border-slate-400'
                    }`} />
                    <span className="text-sm font-semibold capitalize">{t === 'system' ? 'Système' : t === 'light' ? 'Clair' : 'Sombre'}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Section */}
        <Card className="glass border-border/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="border-b border-border/30 bg-secondary/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5 text-emerald-400" />
              Intelligence Artificielle
            </CardTitle>
            <CardDescription>
              Configuration des modèles IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gemini API Key (Optionnel)</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="h-11 bg-secondary/30 border-border/40 focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-xl font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Laissez vide pour utiliser l'IA par défaut du serveur SmartStudy. Ajoutez votre clé pour un accès sans limites.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="glass border-border/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="border-b border-border/30 bg-secondary/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-amber-400" />
              Notifications
            </CardTitle>
            <CardDescription>
              Gérez vos rappels d'étude
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-secondary/20">
              <div>
                <p className="font-semibold">Rappels de Révision (SRS)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Recevez une notification push quand vous avez des flashcards à réviser
                </p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                  notifications ? 'bg-amber-500' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-12">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full sm:w-auto h-11 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors gap-2"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            {saveSuccess && (
              <span className="text-sm font-medium text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="h-4 w-4" />
                Sauvegardé
              </span>
            )}
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full sm:w-auto h-11 px-8 gradient-primary text-white font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
