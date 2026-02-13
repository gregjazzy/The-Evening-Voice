'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations, useLocale } from '@/lib/i18n/context'
import { useAuthStore } from '@/store/useAuthStore'
import { Sparkles, Lock, Eye, EyeOff, User } from 'lucide-react'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()

  const { signUp, isLoading, user } = useAuthStore()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      router.push(`/${locale}`)
    }
  }, [user, router, locale])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()

    if (!trimmedFirst || !trimmedLast || !password) {
      setError(t('errors.fillAllFields'))
      return
    }

    if (password.length < 6) {
      setError(t('errors.passwordTooShort'))
      return
    }

    // Générer un email invisible : prenom-nom-uuid6@lavoixdusoir.app
    const slug = `${trimmedFirst}-${trimmedLast}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const uuid6 = crypto.randomUUID().slice(0, 6)
    const email = `${slug}-${uuid6}@lavoixdusoir.app`
    const fullName = `${trimmedFirst} ${trimmedLast}`

    const { error: signUpError } = await signUp(email, password, fullName, 'child')

    if (signUpError) {
      setError(signUpError)
    } else {
      router.push(`/${locale}`)
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
            {t('createAccount')}
          </h1>
          <p className="text-aurora-200">
            {t('enterMagicWorld')}
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prénom */}
          <div>
            <label htmlFor="firstName" className="block text-aurora-300 text-sm font-semibold mb-2">
              {t('firstName')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aurora-400" />
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-field w-full" style={{ paddingLeft: '2.75rem' }}
                placeholder={t('firstNamePlaceholder')}
                autoComplete="given-name"
              />
            </div>
          </div>

          {/* Nom */}
          <div>
            <label htmlFor="lastName" className="block text-aurora-300 text-sm font-semibold mb-2">
              {t('lastName')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aurora-400" />
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-field w-full" style={{ paddingLeft: '2.75rem' }}
                placeholder={t('lastNamePlaceholder')}
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-aurora-300 text-sm font-semibold mb-2">
              {t('createPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aurora-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full pr-11" style={{ paddingLeft: '2.75rem' }}
                placeholder="••••••••"
                autoComplete="new-password"
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

          {/* Bouton d'inscription */}
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
                {t('registerButton')}
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        {/* Lien de connexion */}
        <div className="mt-6 text-center">
          <p className="text-aurora-300">
            {t('hasAccount')}{' '}
            <Link
              href={`/${locale}/login`}
              className="text-aurora-400 hover:text-aurora-300 font-semibold transition-colors"
            >
              {t('login')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
