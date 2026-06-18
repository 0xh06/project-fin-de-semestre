'use client'

import { useState, useEffect } from 'react'
import { AvatarStudio } from '@/components/avatar-studio'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, User, Key, Palette, Bell, LogOut, CheckCircle2, AlertCircle, Database, Wifi, Sparkles } from 'lucide-react'
import { defaultAvatar, normalizeAvatarConfig } from '@/lib/avatar'
import { authApi } from '@/lib/api'
import { getSupabaseConfig, saveSupabaseConfig, supabaseAuth, isSupabaseConfigured } from '@/lib/supabase'
import { getProgress } from '@/lib/progress'
import { getStoredUser, setStoredUser } from '@/lib/user-storage'
import { User as UserType } from '@/types'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [supabaseTesting, setSupabaseTesting] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [supabaseMessage, setSupabaseMessage] = useState('')

  // Form states
  const [username, setUsername] = useState('Étudiant')
  const [email, setEmail] = useState('user@smartstudy.ai')
  const [apiKey, setApiKey] = useState('')
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('')
  const [theme, setTheme] = useState('dark')
  const [notifications, setNotifications] = useState(true)
  const [avatar, setAvatar] = useState(defaultAvatar)
  const [avatarLevel, setAvatarLevel] = useState(1)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const storedUser = getStoredUser()

    if (storedUser) {
      setUser(storedUser)
      if (storedUser.username) setUsername(storedUser.username)
      if (storedUser.email) setEmail(storedUser.email)
      setAvatar(normalizeAvatarConfig(storedUser.avatar))
    }

    // Load saved Gemini key and Supabase config from localStorage/env
    const savedKey = localStorage.getItem('gemini_api_key')
    if (savedKey) setApiKey(savedKey)
    setAvatarLevel(getProgress().level)

    const supabase = getSupabaseConfig()
    if (supabase) {
      setSupabaseUrl(supabase.url)
      setSupabaseAnonKey(supabase.anonKey)
      setSupabaseStatus('ok')
      setSupabaseMessage('Configuration Supabase détectée.')
    }

    try {
      const userData = await authApi.getCurrentUser()
      const nextUser = {
        ...userData,
        avatar: normalizeAvatarConfig(storedUser?.avatar ?? userData.avatar),
      }

      setUser(nextUser)
      if (nextUser.username) setUsername(nextUser.username)
      if (nextUser.email) setEmail(nextUser.email)
      setAvatar(normalizeAvatarConfig(nextUser.avatar))
      setStoredUser(nextUser)
    } catch {
      if (storedUser) {
        setUser(storedUser)
        if (storedUser.username) setUsername(storedUser.username)
        if (storedUser.email) setEmail(storedUser.email)
        setAvatar(normalizeAvatarConfig(storedUser.avatar))
      } else {
        const fallbackUser = {
          id: 1,
          email: 'user@smartstudy.ai',
          username: 'Étudiant',
          created_at: new Date().toISOString(),
          avatar: defaultAvatar,
        }

        setUser(fallbackUser)
        setAvatar(defaultAvatar)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      await new Promise(resolve => setTimeout(resolve, 600))

      const nextUser = {
        ...(user ?? {
          id: 1,
          email,
          username,
          created_at: new Date().toISOString(),
        }),
        username,
        email,
        avatar: normalizeAvatarConfig(avatar),
      }

      setUser(nextUser)
      setStoredUser(nextUser)

      // Try to save to backend or Supabase
      try {
        await authApi.updateProfile(nextUser)
      } catch (err: any) {
        // If backend fails but we have Supabase configured, update Supabase metadata
        if (err?.code === 'api_unreachable' && isSupabaseConfigured()) {
          try {
            await supabaseAuth.updateUserMetadata({ 
              username: nextUser.username,
              avatar: nextUser.avatar
            })
          } catch (supaErr) {
            console.warn('Supabase metadata update failed', supaErr)
          }
        }
      }

      // Save Gemini API key
      if (apiKey.trim()) {
        localStorage.setItem('gemini_api_key', apiKey.trim())
      } else {
        localStorage.removeItem('gemini_api_key')
      }

      // Save Supabase public config (anon key only, never service_role)
      saveSupabaseConfig(supabaseUrl, supabaseAnonKey)
      setSupabaseStatus(supabaseUrl.trim() && supabaseAnonKey.trim() ? 'ok' : 'idle')
      setSupabaseMessage(supabaseUrl.trim() && supabaseAnonKey.trim() ? 'Configuration Supabase sauvegardée.' : '')

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleTestSupabase = async () => {
    setSupabaseTesting(true)
    setSupabaseStatus('idle')
    setSupabaseMessage('')
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey)

    try {
      await supabaseAuth.testConnection()
      setSupabaseStatus('ok')
      setSupabaseMessage('Connexion Supabase réussie. Auth Supabase active si le backend est offline.')
    } catch (err: any) {
      setSupabaseStatus('error')
      setSupabaseMessage(err?.message || 'Connexion Supabase impossible.')
    } finally {
      setSupabaseTesting(false)
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

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
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

        <Card className="glass border-border/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="border-b border-border/30 bg-secondary/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Studio d'identité
            </CardTitle>
            <CardDescription>
              Crée ton avatar, applique un preset et personnalise ton style comme dans un vrai studio.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <AvatarStudio
              value={avatar}
              onChange={setAvatar}
              userName={username || user?.username || 'CodeMaster'}
              level={avatarLevel}
            />
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
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gemini API Key</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="h-11 bg-secondary/30 border-border/40 focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-xl font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {apiKey ? '✅ Clé sauvegardée — le Chat IA utilisera Gemini directement, même sans serveur backend.' : 'Ajoutez votre clé Gemini pour activer le Chat IA sans serveur. Obtenez-la sur aistudio.google.com.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Supabase Section */}
        <Card className="glass border-border/50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="border-b border-border/30 bg-secondary/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-cyan-400" />
              Supabase
            </CardTitle>
            <CardDescription>
              Connexion directe si le backend C n'est pas disponible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project URL</label>
              <Input
                value={supabaseUrl}
                onChange={(e) => {
                  setSupabaseUrl(e.target.value)
                  setSupabaseStatus('idle')
                  setSupabaseMessage('')
                }}
                placeholder="https://xxxxx.supabase.co"
                className="h-11 bg-secondary/30 border-border/40 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Anon public key</label>
              <Input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => {
                  setSupabaseAnonKey(e.target.value)
                  setSupabaseStatus('idle')
                  setSupabaseMessage('')
                }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="h-11 bg-secondary/30 border-border/40 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Utilise uniquement la clé <span className="font-semibold text-cyan-400">anon public</span>. Ne mets jamais la clé <span className="font-semibold text-red-400">service_role</span> dans le frontend.
              </p>
            </div>

            {supabaseMessage && (
              <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                supabaseStatus === 'ok'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : supabaseStatus === 'error'
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-border/40 bg-secondary/20 text-muted-foreground'
              }`}>
                {supabaseStatus === 'ok' ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                <span>{supabaseMessage}</span>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleTestSupabase}
              disabled={supabaseTesting || !supabaseUrl.trim() || !supabaseAnonKey.trim()}
              className="w-full h-11 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 gap-2"
            >
              {supabaseTesting ? (
                <div className="h-4 w-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              Tester Supabase
            </Button>
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
