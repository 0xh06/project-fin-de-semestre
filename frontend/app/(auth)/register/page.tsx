'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api'
import { BrainCircuit, ArrowRight, Eye, EyeOff, CheckCircle2, Github } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500']
  const strengthLabels = ['', 'Faible', 'Moyen', 'Fort']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authApi.register({ email, username, password })
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erreur d\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to home */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <BrainCircuit className="h-5 w-5 text-primary" />
        <span className="font-semibold">SmartStudy AI</span>
      </Link>

      <div className="w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/25">
            <BrainCircuit className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Créez votre compte</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Rejoignez des milliers d'étudiants qui révisent intelligemment
          </p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="reg-username" className="text-sm font-semibold text-foreground/80">
                Nom d'utilisateur
              </label>
              <Input
                id="reg-username"
                type="text"
                placeholder="votre_pseudo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="reg-email" className="text-sm font-semibold text-foreground/80">
                Adresse email
              </label>
              <Input
                id="reg-email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="reg-password" className="text-sm font-semibold text-foreground/80">
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="space-y-1.5 animate-slide-up">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-secondary'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[10px] font-medium ${
                    passwordStrength === 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    Sécurité : {strengthLabels[passwordStrength]}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 animate-slide-up">
                <span className="text-red-400">⚠</span>
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 gradient-primary text-white font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.01] transition-all duration-200 gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Création du compte...
                </div>
              ) : (
                <>
                  S'inscrire gratuitement
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card/50 backdrop-blur-xl px-2 text-muted-foreground">Ou s'inscrire avec</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = 'https://github.com/login/oauth/authorize?client_id=VOTRE_GITHUB_CLIENT_ID'}
              className="h-11 bg-secondary/30 border-border/50 hover:bg-secondary hover:text-foreground transition-all gap-2"
            >
              <Github className="h-4 w-4" />
              GitHub
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=VOTRE_GOOGLE_CLIENT_ID&redirect_uri=http://localhost:8080/api/auth/google/callback&response_type=code&scope=email%20profile'}
              className="h-11 bg-secondary/30 border-border/50 hover:bg-secondary hover:text-foreground transition-all gap-2"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
              </svg>
              Google
            </Button>
          </div>

          {/* Benefits list */}
          <div className="mt-6 pt-5 border-t border-border/30 space-y-2.5">
            {['Flashcards illimitées', 'Chat IA contextuel', 'Quiz adaptatifs'].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 text-center">
            <span className="text-sm text-muted-foreground">Déjà un compte ? </span>
            <Link href="/login" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
