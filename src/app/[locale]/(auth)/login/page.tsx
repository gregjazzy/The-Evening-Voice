'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations, useLocale } from '@/lib/i18n/context'
import { useAuthStore } from '@/store/useAuthStore'
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, Wand2 } from 'lucide-react'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export default function LoginPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || `/${locale}`
  
  const { signIn, isLoading, user } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      router.push(redirect)
    }
  }, [user, router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError(t('errors.fillAllFields'))
      return
    }

    const { error: signInError } = await signIn(email, password)
    
    if (signInError) {
      setError(signInError)
    } else {
      router.push(redirect)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Image de fond avec overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/auth-background.png)' }}
      />
      
      {/* Animation de lueur oscillante sur la lanterne */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: '25%',
          right: '18%',
          width: '250px',
          height: '300px',
          background: 'radial-gradient(ellipse at center, rgba(255, 180, 50, 0.4) 0%, rgba(255, 150, 30, 0.2) 30%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          opacity: [0.6, 1, 0.7, 0.9, 0.6],
          scale: [1, 1.1, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Halo secondaire plus subtil */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: '20%',
          right: '15%',
          width: '350px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(255, 200, 100, 0.15) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }}
        animate={{
          opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
          scale: [1, 1.15, 1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />
      
      {/* Overlay sombre pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/60 to-gray-950/40" />
      {/* Effet de vignette subtil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Sélecteur de langue */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <motion.div
        className="glass-card p-8 rounded-3xl shadow-2xl max-w-md w-full border border-aurora-700/50 relative z-10"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo & Titre */}
        <div className="text-center mb-8">
          <motion.div
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-aurora-500 to-aurora-700 flex items-center justify-center magic-glow"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(233, 121, 249, 0.3)',
                '0 0 40px rgba(233, 121, 249, 0.5)',
                '0 0 20px rgba(233, 121, 249, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-display text-white mb-2">
            {tCommon('appName')}
          </h1>
          <p className="text-aurora-200">
            {t('enterMagicWorld')}
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-aurora-300 text-sm font-semibold mb-2">
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aurora-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full pl-11"
                placeholder="email@magic.com"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-aurora-300 text-sm font-semibold mb-2">
              {t('password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aurora-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full pl-11 pr-11"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-aurora-400 hover:text-aurora-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Erreur */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton de connexion */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                {t('loginButton')}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        {/* Lien mot de passe oublié */}
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-aurora-300 hover:text-aurora-200 text-sm transition-colors"
          >
            {t('forgotPassword')}
          </button>
        </div>

        {/* Séparateur */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-aurora-700/50" />
          <span className="text-aurora-400 text-sm">{tCommon('or')}</span>
          <div className="flex-1 h-px bg-aurora-700/50" />
        </div>

        {/* Connexion avec code magique (pour les enfants) */}
        <motion.button
          type="button"
          className="btn-secondary w-full flex items-center justify-center gap-2 py-3"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Wand2 className="w-5 h-5" />
          {t('enterMagicCode')}
        </motion.button>

        {/* Lien d'inscription */}
        <div className="mt-6 text-center">
          <p className="text-aurora-300">
            {t('noAccount')}{' '}
            <Link
              href={`/${locale}/register`}
              className="text-aurora-400 hover:text-aurora-300 font-semibold transition-colors"
            >
              {t('createAccount')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

