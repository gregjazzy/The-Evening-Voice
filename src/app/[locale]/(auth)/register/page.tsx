'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations, useLocale } from '@/lib/i18n/context'
import { useAuthStore, type UserRole } from '@/store/useAuthStore'
import { 
  Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  User, Users, Heart, Check
} from 'lucide-react'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { cn } from '@/lib/utils'

// Avatars disponibles
const avatars = ['🦋', '🌙', '⭐', '🦄', '🌸', '🐱', '🐰', '🦊', '🐼', '🦉']

export default function RegisterPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const locale = useLocale()
  
  const { signUp, isLoading, user } = useAuthStore()
  
  const [step, setStep] = useState(1) // 1: rôle, 2: infos, 3: avatar, 4: confirmation email
  const [role, setRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      router.push(`/${locale}`)
    }
  }, [user, router, locale])

  const handleNext = () => {
    setError(null)
    
    if (step === 1 && !role) {
      setError(t('errors.selectRole'))
      return
    }
    
    if (step === 2) {
      if (!email || !password) {
        setError(t('errors.fillAllFields'))
        return
      }
      if (password.length < 6) {
        setError(t('errors.passwordTooShort'))
        return
      }
      if (password !== confirmPassword) {
        setError(t('errors.passwordMismatch'))
        return
      }
    }
    
    setStep(step + 1)
  }

  const handleBack = () => {
    setError(null)
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    setError(null)

    if (!role || !email || !password) {
      setError(t('errors.fillAllFields'))
      return
    }

    // Le prénom sera demandé dans la séquence de bienvenue
    // On utilise un nom temporaire basé sur l'email
    const tempName = email.split('@')[0] || 'Ami'
    
    const { error: signUpError } = await signUp(email, password, tempName, role)
    
    if (signUpError) {
      setError(signUpError)
    } else {
      // Afficher l'écran de confirmation email
      setEmailSent(true)
      setStep(4)
    }
  }

  const roles = [
    { id: 'child' as UserRole, label: t('iAmChild'), icon: <Heart className="w-8 h-8" />, color: 'from-pink-500 to-rose-600' },
    { id: 'mentor' as UserRole, label: t('iAmMentor'), icon: <User className="w-8 h-8" />, color: 'from-aurora-500 to-aurora-700' },
    { id: 'parent' as UserRole, label: t('iAmParent'), icon: <Users className="w-8 h-8" />, color: 'from-blue-500 to-indigo-600' },
  ]

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

        {/* Indicateur d'étape - caché à l'étape 4 */}
        {step < 4 && (
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              className={cn(
                'w-3 h-3 rounded-full transition-colors',
                step >= s ? 'bg-aurora-500' : 'bg-aurora-800'
              )}
              animate={step === s ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, repeat: step === s ? Infinity : 0, repeatDelay: 1 }}
            />
          ))}
        </div>
        )}

        <AnimatePresence mode="wait">
          {/* Étape 1: Choix du rôle */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-display text-white text-center mb-6">
                {t('selectRole')}
              </h2>
              
              {roles.map((r) => (
                <motion.button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    'w-full p-4 rounded-2xl flex items-center gap-4 transition-all border-2',
                    role === r.id
                      ? `bg-gradient-to-r ${r.color} border-white/30`
                      : 'bg-aurora-900/30 border-aurora-700/30 hover:border-aurora-500/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center',
                    role === r.id ? 'bg-white/20' : 'bg-aurora-800/50'
                  )}>
                    {r.icon}
                  </div>
                  <span className="text-lg font-semibold text-white">{r.label}</span>
                  {role === r.id && (
                    <Check className="w-6 h-6 text-white ml-auto" />
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Étape 2: Informations */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Email */}
              <div>
                <label className="block text-aurora-300 text-sm font-semibold mb-2">
                  {role === 'child' ? t('parentEmail') : t('email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aurora-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field w-full pl-11"
                    placeholder="parent@magic.com"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-aurora-300 text-sm font-semibold mb-2">
                  {t('createPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aurora-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field w-full pl-11 pr-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-aurora-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmer mot de passe */}
              <div>
                <label className="block text-aurora-300 text-sm font-semibold mb-2">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aurora-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field w-full pl-11"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Étape 3: Avatar */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-display text-white text-center">
                {t('chooseAvatar')}
              </h2>
              
              <div className="grid grid-cols-5 gap-3">
                {avatars.map((avatar) => (
                  <motion.button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all border-2',
                      selectedAvatar === avatar
                        ? 'bg-aurora-500/30 border-aurora-400 scale-110'
                        : 'bg-aurora-900/30 border-aurora-700/30 hover:border-aurora-500/50'
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {avatar}
                  </motion.button>
                ))}
              </div>

              {/* Résumé */}
              <div className="glass-card p-4 rounded-xl">
                <p className="text-aurora-200 text-sm">
                  {t('accountWillBeCreated')}{' '}
                  <span className="text-aurora-400">{roles.find(r => r.id === role)?.label}</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Étape 4: Confirmation email envoyé */}
          {step === 4 && emailSent && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <motion.div
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(34, 197, 94, 0.3)',
                    '0 0 40px rgba(34, 197, 94, 0.5)',
                    '0 0 20px rgba(34, 197, 94, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Mail className="w-10 h-10 text-white" />
              </motion.div>
              
              <div>
                <h2 className="text-2xl font-display text-white mb-2">
                  {locale === 'fr' ? 'Vérifie ta boîte mail !' : locale === 'en' ? 'Check your email!' : 'Проверь почту!'}
                </h2>
                <p className="text-aurora-200">
                  {locale === 'fr' 
                    ? `Un email de confirmation a été envoyé à` 
                    : locale === 'en' 
                    ? `A confirmation email has been sent to`
                    : `Письмо с подтверждением отправлено на`}
                </p>
                <p className="text-aurora-400 font-semibold mt-1">{email}</p>
              </div>

              <div className="glass-card p-4 rounded-xl text-left">
                <p className="text-aurora-200 text-sm">
                  {locale === 'fr' 
                    ? '📧 Clique sur le lien dans l\'email pour activer ton compte, puis reviens ici pour te connecter !'
                    : locale === 'en'
                    ? '📧 Click the link in the email to activate your account, then come back here to log in!'
                    : '📧 Нажми на ссылку в письме, чтобы активировать аккаунт, затем вернись сюда для входа!'}
                </p>
              </div>

              <Link
                href={`/${locale}/login`}
                className="btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
                {locale === 'fr' ? 'Aller à la connexion' : locale === 'en' ? 'Go to login' : 'Перейти к входу'}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Erreur */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation - caché à l'étape 4 */}
        {step < 4 && (
        <div className="mt-8 flex gap-4">
          {step > 1 && (
            <motion.button
              type="button"
              onClick={handleBack}
              className="btn-secondary flex items-center gap-2 px-4 py-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="w-5 h-5" />
              {tCommon('back')}
            </motion.button>
          )}
          
          {step < 3 ? (
            <motion.button
              type="button"
              onClick={handleNext}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tCommon('next')}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
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
          )}
        </div>
        )}

        {/* Lien de connexion - caché à l'étape 4 */}
        {step < 4 && (
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
        )}
      </motion.div>
    </div>
  )
}

