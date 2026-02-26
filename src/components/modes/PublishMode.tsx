'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Printer,
  Package,
  Palette,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  Image as ImageIcon,
  FileText,
  Loader2,
  Download,
  ShoppingCart,
  ShoppingBag,
  Gift,
  ArrowLeft,
  Book,
  Ruler,
  DollarSign,
  Lock,
  Info,
  Trash2,
  Coffee,
  Frame,
  Mail,
  Plus,
  Minus,
  Mic,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useStudioStore } from '@/store/useStudioStore'
import { useAuthStore } from '@/store/useAuthStore'
import {
  usePublishStore,
  BOOK_FORMATS,
  findBookFormat,
  COVER_TYPES,
  GELATO_PAPER_OPTIONS,
  GELATO_LAMINATION_OPTIONS,
  type PublishStep,
  type BookFormat,
  type BookFormatConfig,
} from '@/store/usePublishStore'
import { exportToPDF } from '@/lib/export/pdf'
import { usePdfExport } from '@/hooks/usePdfExport'
import { ModeIntroModal, useFirstVisit } from '@/components/ui/ModeIntroModal'
import { useTranslations, useLocale } from '@/lib/i18n/context'
import { cn, getThumbnailUrl } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { CREDIT_PACKS, NARRATION_CREDIT_PACKS, calculateBookPrice, DERIVATIVE_PRICES } from '@/lib/stripe-config'
import { DERIVATIVE_PRODUCTS, getDerivativeProduct, getDerivativeDisplayName, type DerivativeProductType } from '@/lib/gelato'
import type { CartItem } from '@/store/usePublishStore'

// ============================================================================
// COMPOSANT : Page d'accueil Boutique
// ============================================================================

// ---- Mockup produit (V1 : gradient + icône + overlay illustration) ----

function ProductMockup({ type, illustrationUrl }: {
  type: 'book' | 'mug' | 'poster' | 'cards' | 'coloring-book'
  illustrationUrl?: string
}) {
  const gradients: Record<string, string> = {
    book: 'from-emerald-900/40 to-emerald-800/20',
    mug: 'from-amber-900/40 to-amber-800/20',
    poster: 'from-sky-900/40 to-sky-800/20',
    cards: 'from-pink-900/40 to-pink-800/20',
    'coloring-book': 'from-violet-900/40 to-violet-800/20',
  }

  const overlayZones: Record<string, React.CSSProperties> = {
    book: { top: '10%', left: '15%', width: '70%', height: '80%' },
    mug: { top: '20%', left: '25%', width: '50%', height: '55%' },
    poster: { top: '8%', left: '12%', width: '76%', height: '84%' },
    cards: { top: '15%', left: '10%', width: '35%', height: '70%' },
    'coloring-book': { top: '10%', left: '15%', width: '70%', height: '80%' },
  }

  const icons: Record<string, typeof BookOpen> = {
    book: BookOpen,
    mug: Coffee,
    poster: Frame,
    cards: Mail,
    'coloring-book': Palette,
  }

  const Icon = icons[type]

  return (
    <div className={cn('relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br', gradients[type])}>
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <Icon className="w-16 h-16 text-white" />
      </div>
      {illustrationUrl && (
        <img
          src={getThumbnailUrl(illustrationUrl, 400)}
          alt=""
          style={overlayZones[type]}
          className="absolute object-cover rounded-lg opacity-90 shadow-lg"
        />
      )}
    </div>
  )
}

// ---- Page d'accueil Boutique (Apple Store style) ----

function ShopHome() {
  const t = useTranslations('publish')
  const locale = useLocale()
  const { setCurrentStep, setShopFlow, setSelectedDerivativeType } = usePublishStore()
  const { stories } = useAppStore()
  const { profile } = useAuthStore()
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null)

  // Get first illustration from any story for mockup previews
  const firstIllustrationUrl = (() => {
    for (const story of stories) {
      const illustrations = getStoryIllustrations(story)
      if (illustrations.length > 0) return illustrations[0].url
    }
    return undefined
  })()

  const creditBalance = (profile as any)?.credit_balance ?? 0
  const narrationBalance = (profile as any)?.narration_credit_balance ?? 0

  const handleBuyStudioCredits = async () => {
    setIsRedirecting('studio')
    try {
      const pack = CREDIT_PACKS[0]
      const response = await fetch('/api/stripe/checkout/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: pack.id }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Erreur')
      }
    } catch (error) {
      console.error('Erreur Stripe checkout credits:', error)
      setIsRedirecting(null)
    }
  }

  const handleBuyNarrationCredits = async (packId: string) => {
    setIsRedirecting(packId)
    try {
      const response = await fetch('/api/stripe/checkout/narration-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Erreur')
      }
    } catch (error) {
      console.error('Erreur Stripe checkout narration:', error)
      setIsRedirecting(null)
    }
  }

  const derivativeProducts: { type: DerivativeProductType; icon: typeof Coffee; name: string; description: string; price: number }[] = DERIVATIVE_PRODUCTS.map(p => ({
    type: p.type,
    icon: { Coffee, Frame, Mail, Palette }[p.icon as 'Coffee' | 'Frame' | 'Mail' | 'Palette'] || Gift,
    name: locale === 'en' ? p.nameEn : locale === 'ru' ? p.nameRu : p.nameFr,
    description: locale === 'en' ? p.descriptionEn : locale === 'ru' ? p.descriptionRu : p.descriptionFr,
    price: p.sellingPriceCents,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto space-y-10"
    >
      {/* ──── A. Hero Banner ──── */}
      <div className="text-center py-8 rounded-2xl bg-gradient-to-br from-aurora-500/10 via-dream-500/5 to-transparent">
        <h2 className="text-4xl font-display text-white mb-2">
          {t('shop.hero.title')}
        </h2>
        <p className="text-midnight-300 text-lg">
          {t('shop.hero.subtitle')}
        </p>
      </div>

      {/* ──── B. Section Livre ──── */}
      <section>
        <motion.div
          className="glass-card p-6 md:p-8 relative group overflow-hidden"
          whileHover={{ y: -3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="order-2 md:order-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white">
                  {t('shop.bookSection.title')}
                </h3>
              </div>
              <p className="text-midnight-300 mb-4 leading-relaxed">
                {t('shop.bookSection.description')}
              </p>
              <p className="text-sm text-emerald-400 font-medium mb-6">
                {t('shop.bookSection.priceFrom')}
              </p>
              <motion.button
                onClick={() => {
                  setShopFlow('book')
                  setCurrentStep('select-story')
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-400 hover:to-teal-500 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <BookOpen className="w-5 h-5" />
                {t('shop.bookSection.cta')}
              </motion.button>
            </div>
            <div className="order-1 md:order-2">
              <ProductMockup type="book" illustrationUrl={firstIllustrationUrl} />
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity ring-1 ring-emerald-500/30 pointer-events-none" />
        </motion.div>
      </section>

      {/* ──── C. Section Cadeaux ──── */}
      <section>
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-white">
            {t('shop.giftsSection.title')}
          </h3>
          <p className="text-midnight-400 text-sm mt-1">
            {t('shop.giftsSection.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {derivativeProducts.map((product) => {
            const Icon = product.icon
            return (
              <motion.button
                key={product.type}
                onClick={() => {
                  setShopFlow('derivatives')
                  setSelectedDerivativeType(product.type)
                  setCurrentStep('select-story')
                }}
                className="glass-card overflow-hidden text-left group relative"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
              >
                <ProductMockup type={product.type} illustrationUrl={firstIllustrationUrl} />
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-white mb-1">{product.name}</h4>
                  <p className="text-xs text-midnight-400 mb-2 line-clamp-2">{product.description}</p>
                  <p className="text-sm font-bold text-aurora-400">{(product.price / 100).toFixed(2)}€</p>
                </div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity ring-1 ring-aurora-500/30 pointer-events-none" />
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* ──── D. Section Crédits IA ──── */}
      <section>
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-white">
            {t('shop.creditsSection.title')}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Studio Credits */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">{t('shop.creditsSection.studioTitle')}</h4>
                <p className="text-xs text-midnight-400">{t('shop.creditsSection.studioDesc')}</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-white">{CREDIT_PACKS[0].credits} {t('creditsShop.credits')}</span>
              <span className="text-xl font-bold text-aurora-400">{(CREDIT_PACKS[0].price / 100).toFixed(2)}€</span>
            </div>
            {profile && (
              <p className="text-xs text-midnight-400 mb-4">
                {t('shop.creditsSection.yourBalance')} : <span className="text-violet-400 font-medium">{creditBalance}</span>
              </p>
            )}
            <motion.button
              onClick={handleBuyStudioCredits}
              disabled={isRedirecting === 'studio'}
              className={cn(
                'w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-400 hover:to-purple-500',
                isRedirecting === 'studio' && 'opacity-50 cursor-not-allowed'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {isRedirecting === 'studio' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('shop.creditsSection.buy')}
                </>
              )}
            </motion.button>
          </div>

          {/* Narration Credits */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-aurora-500/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-aurora-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">{t('shop.creditsSection.narrationTitle')}</h4>
                <p className="text-xs text-midnight-400">{t('shop.creditsSection.narrationDesc')}</p>
              </div>
            </div>
            {profile && (
              <p className="text-xs text-midnight-400 mb-3">
                {t('shop.creditsSection.yourBalance')} : <span className="text-aurora-400 font-medium">{narrationBalance.toLocaleString()} {t('shop.creditsSection.chars')}</span>
              </p>
            )}
            <div className="space-y-2">
              {NARRATION_CREDIT_PACKS.map((pack) => (
                <motion.button
                  key={pack.id}
                  onClick={() => handleBuyNarrationCredits(pack.id)}
                  disabled={isRedirecting === pack.id}
                  className={cn(
                    'w-full py-2.5 px-4 rounded-xl transition-all flex items-center justify-between',
                    'bg-white/5 border border-white/10 hover:border-aurora-500/40 hover:bg-aurora-500/5',
                    isRedirecting === pack.id && 'opacity-50 cursor-not-allowed'
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-sm text-white font-medium">
                    {locale === 'en' ? pack.labelEn : pack.label}
                  </span>
                  <span className="text-sm font-bold text-aurora-400 flex items-center gap-1.5">
                    {isRedirecting === pack.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      `${(pack.price / 100).toFixed(2)}€`
                    )}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  )
}

// ============================================================================
// COMPOSANT : Étapes de navigation
// ============================================================================

const STEP_IDS: { id: PublishStep; labelKey: string; icon: React.ReactNode }[] = [
  { id: 'select-story', labelKey: 'steps.story', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'choose-format', labelKey: 'steps.options', icon: <Ruler className="w-4 h-4" /> },
  { id: 'quality-check', labelKey: 'steps.quality', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'order', labelKey: 'steps.order', icon: <ShoppingCart className="w-4 h-4" /> },
]

function StepIndicator({ currentStep }: { currentStep: PublishStep }) {
  const t = useTranslations('publish')
  const currentIndex = STEP_IDS.findIndex(s => s.id === currentStep)

  if (currentStep === 'shop-home' || currentStep === 'credits') return null

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {STEP_IDS.map((step, index) => {
        const isActive = step.id === currentStep
        const isPast = index < currentIndex
        const isFuture = index > currentIndex
        
        return (
          <div key={step.id} className="flex items-center">
            <motion.div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-full transition-all',
                isActive && 'bg-aurora-600 text-white',
                isPast && 'bg-aurora-600/20 text-aurora-400',
                isFuture && 'bg-midnight-800/50 text-midnight-500'
              )}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {isPast ? <Check className="w-4 h-4" /> : step.icon}
              <span className="text-sm font-medium hidden md:inline">{t(step.labelKey)}</span>
            </motion.div>
            
            {index < STEP_IDS.length - 1 && (
              <div className={cn(
                'w-8 h-0.5 mx-1',
                index < currentIndex ? 'bg-aurora-600' : 'bg-midnight-700'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// ÉTAPE 1 : Sélection de l'histoire
// ============================================================================

function SelectStoryStep() {
  const t = useTranslations('publish')
  const locale = useLocale()
  const { stories } = useAppStore()
  const { selectedStory, setSelectedStory, setCurrentStep, shopFlow, selectedDerivativeType } = usePublishStore()
  
  // Permettre les livres avec au moins 1 page (on peut toujours compléter plus tard)
  const completedStories = stories.filter(s => s.pages.length >= 1)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          📚 {t('selectStory.title')}
        </h2>
        <p className="text-midnight-300">
          {t('selectStory.description')}
        </p>
      </div>
      
      {completedStories.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
          <h3 className="text-xl text-white mb-2">{t('selectStory.emptyTitle')}</h3>
          <p className="text-midnight-400 mb-4">
            {t('selectStory.emptyDescription')}
          </p>
          <button
            onClick={() => useAppStore.getState().setCurrentMode('book')}
            className="btn-primary"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('selectStory.createStory')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {completedStories.map((story) => (
            <motion.button
              key={story.id}
              onClick={() => setSelectedStory(story)}
              className={cn(
                'glass-card p-6 text-left transition-all hover:scale-[1.02]',
                selectedStory?.id === story.id && 'ring-2 ring-aurora-500 bg-aurora-500/10'
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-aurora-600/20 to-dream-600/20 flex items-center justify-center flex-shrink-0">
                  <Book className="w-8 h-8 text-aurora-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-white truncate">
                    {story.title || t('selectStory.untitled')}
                  </h3>
                  <p className="text-sm text-midnight-400 mt-1">
                    {t('selectStory.pages', { count: story.pages.length })}
                  </p>
                  <p className="text-xs text-midnight-500 mt-2">
                    {t('selectStory.createdAt', { date: new Date(story.createdAt).toLocaleDateString(locale) })}
                  </p>
                  {selectedStory?.id === story.id && (
                    <div className="flex items-center gap-1 mt-2 text-aurora-400 text-sm">
                      <Check className="w-4 h-4" />
                      {t('selectStory.selected')}
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
      
      {selectedStory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          {selectedStory.bookFormat && (
            <p className="text-sm text-aurora-400 flex items-center gap-2">
              <Check className="w-4 h-4" />
              {t('selectStory.format', { format: (locale === 'fr' ? findBookFormat(selectedStory.bookFormat).nameFr : findBookFormat(selectedStory.bookFormat).name) })}
            </p>
          )}
          <button
            onClick={() => {
              if (shopFlow === 'derivatives') {
                // Skip product re-selection if already chosen from shop home
                setCurrentStep(selectedDerivativeType ? 'choose-illustration' : 'select-derivative')
              } else {
                // Appliquer le format de l'histoire si défini
                if (selectedStory.bookFormat) {
                  usePublishStore.getState().setSelectedFormat(selectedStory.bookFormat as any)
                }
                setCurrentStep('choose-format')
              }
            }}
            className="inline-flex items-center gap-2 text-lg px-8 py-3 rounded-xl bg-gradient-to-r from-aurora-500 to-aurora-700 text-white font-semibold hover:from-aurora-400 hover:to-aurora-600 transition-all shadow-lg shadow-aurora-500/25"
          >
            {shopFlow === 'derivatives' ? t('selectStory.chooseGift') : t('selectStory.chooseOptions')}
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE 2 : Choix du format — Wizard en 4 sous-étapes
// ============================================================================

const subStepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -200 : 200, opacity: 0 }),
}

function SubStepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-2.5 h-2.5 rounded-full transition-all duration-300',
            i === current
              ? 'bg-aurora-500 scale-125'
              : i < current
                ? 'bg-aurora-500/50'
                : 'bg-midnight-700'
          )}
        />
      ))}
    </div>
  )
}

function ChoicePill({
  icon,
  label,
  onClick,
}: {
  icon: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-midnight-800/80 hover:bg-midnight-700/80 border border-midnight-600/50 transition-all group"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-white text-sm font-medium">{label}</span>
      <span className="text-xs text-aurora-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1">✎</span>
    </button>
  )
}

function CoverTypeSubStep({
  onSelect,
  currentValue,
}: {
  onSelect: (type: 'hardcover' | 'softcover') => void
  currentValue: string
}) {
  const t = useTranslations('publish')
  const locale = useLocale()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          📚 {t('chooseFormat.coverTypeTitle')}
        </h2>
        <p className="text-midnight-300">{t('chooseFormat.coverTypeSubtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {COVER_TYPES.map((cover) => (
          <motion.button
            key={cover.type}
            onClick={() => onSelect(cover.type)}
            className={cn(
              'glass-card p-8 text-center transition-all relative cursor-pointer',
              currentValue === cover.type
                ? 'ring-2 ring-aurora-500 bg-aurora-500/10'
                : 'hover:bg-midnight-800/80'
            )}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="text-6xl mb-4">{cover.icon}</div>
            <div className="text-lg font-semibold text-white">
              {locale === 'fr' ? cover.nameFr : cover.nameEn}
            </div>
            {cover.type === 'hardcover' && (
              <p className="text-sm text-midnight-400 mt-2">{t('chooseFormat.hardcoverDesc')}</p>
            )}
            {cover.type === 'softcover' && (
              <p className="text-sm text-midnight-400 mt-2">{t('chooseFormat.softcoverDesc')}</p>
            )}
            {currentValue === cover.type && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-aurora-500 flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function PaperTypeSubStep({
  onSelect,
  currentValue,
}: {
  onSelect: (id: string) => void
  currentValue: string
}) {
  const t = useTranslations('publish')
  const locale = useLocale()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          📄 {t('chooseFormat.paperTypeTitle')}
        </h2>
        <p className="text-midnight-300">{t('chooseFormat.paperTypeSubtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {GELATO_PAPER_OPTIONS.map((paper) => (
          <motion.button
            key={paper.id}
            onClick={() => onSelect(paper.id)}
            className={cn(
              'glass-card p-8 text-center transition-all relative cursor-pointer',
              currentValue === paper.id
                ? 'ring-2 ring-aurora-500 bg-aurora-500/10'
                : 'hover:bg-midnight-800/80'
            )}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="text-6xl mb-4">{paper.icon}</div>
            <div className="text-lg font-semibold text-white">
              {locale === 'fr' ? paper.nameFr : paper.nameEn}
            </div>
            <div className="text-sm text-midnight-400 mt-1">{paper.weightGsm}g/m²</div>
            <p className="text-xs text-midnight-500 mt-2">
              {paper.description[locale as keyof typeof paper.description] || paper.description.en}
            </p>
            {paper.weightGsm >= 200 && (
              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium text-aurora-400 bg-aurora-500/10 rounded-full">
                {t('chooseFormat.premium')}
              </span>
            )}
            {currentValue === paper.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-aurora-500 flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function CoverFinishSubStep({
  onSelect,
  currentValue,
}: {
  onSelect: (id: string) => void
  currentValue: string
}) {
  const t = useTranslations('publish')
  const locale = useLocale()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          ✨ {t('chooseFormat.coverFinishTitle')}
        </h2>
        <p className="text-midnight-300">{t('chooseFormat.coverFinishSubtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {GELATO_LAMINATION_OPTIONS.map((lam) => (
          <motion.button
            key={lam.id}
            onClick={() => onSelect(lam.id)}
            className={cn(
              'glass-card p-8 text-center transition-all relative cursor-pointer',
              currentValue === lam.id
                ? 'ring-2 ring-aurora-500 bg-aurora-500/10'
                : 'hover:bg-midnight-800/80'
            )}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="text-6xl mb-4">{lam.icon}</div>
            <div className="text-lg font-semibold text-white">
              {locale === 'fr' ? lam.nameFr : lam.nameEn}
            </div>
            {currentValue === lam.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-aurora-500 flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function SummarySubStep({
  onGoToSubStep,
  onContinue,
}: {
  onGoToSubStep: (step: number) => void
  onContinue: () => void
}) {
  const t = useTranslations('publish')
  const locale = useLocale()
  const {
    selectedFormat,
    coverType,
    paperType,
    lamination,
    selectedStory,
    estimatedPrice,
  } = usePublishStore()

  const currentFormat = findBookFormat(selectedFormat)
  const currentCover = COVER_TYPES.find(c => c.type === coverType)
  const currentPaper = GELATO_PAPER_OPTIONS.find(p => p.id === paperType)
  const currentLamination = GELATO_LAMINATION_OPTIONS.find(l => l.id === lamination)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          🎉 {t('chooseFormat.summaryTitle')}
        </h2>
        <p className="text-midnight-300">{t('chooseFormat.summarySubtitle')}</p>
      </div>

      <div className="space-y-4">
        {/* Format (read-only) */}
        {currentFormat && (
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="text-3xl">{currentFormat.icon}</div>
            <div className="flex-1">
              <div className="text-xs text-midnight-500 uppercase tracking-wide">{t('chooseFormat.bookFormat')}</div>
              <div className="text-white font-medium">
                {locale === 'fr' ? currentFormat.nameFr : currentFormat.name}
              </div>
              <div className="text-xs text-midnight-400">{currentFormat.widthMm} x {currentFormat.heightMm} mm &middot; {selectedStory?.pages.length} pages</div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-midnight-700/80 text-midnight-400 text-xs">
              <Lock className="w-3 h-3" />
              {t('chooseFormat.locked')}
            </span>
          </div>
        )}

        {/* Cover type */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="text-3xl">{currentCover?.icon}</div>
          <div className="flex-1">
            <div className="text-xs text-midnight-500 uppercase tracking-wide">{t('chooseFormat.coverType')}</div>
            <div className="text-white font-medium">
              {locale === 'fr' ? currentCover?.nameFr : currentCover?.nameEn}
            </div>
          </div>
          <ChoicePill
            icon="✎"
            label={t('chooseFormat.changeChoice')}
            onClick={() => onGoToSubStep(0)}
          />
        </div>

        {/* Paper type */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="text-3xl">{currentPaper?.icon}</div>
          <div className="flex-1">
            <div className="text-xs text-midnight-500 uppercase tracking-wide">{t('chooseFormat.paperType')}</div>
            <div className="text-white font-medium">
              {locale === 'fr' ? currentPaper?.nameFr : currentPaper?.nameEn}
            </div>
            <div className="text-xs text-midnight-400">{currentPaper?.weightGsm}g/m²</div>
          </div>
          <ChoicePill
            icon="✎"
            label={t('chooseFormat.changeChoice')}
            onClick={() => onGoToSubStep(1)}
          />
        </div>

        {/* Cover finish */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="text-3xl">{currentLamination?.icon}</div>
          <div className="flex-1">
            <div className="text-xs text-midnight-500 uppercase tracking-wide">{t('chooseFormat.coverFinish')}</div>
            <div className="text-white font-medium">
              {locale === 'fr' ? currentLamination?.nameFr : currentLamination?.nameEn}
            </div>
          </div>
          <ChoicePill
            icon="✎"
            label={t('chooseFormat.changeChoice')}
            onClick={() => onGoToSubStep(2)}
          />
        </div>

        {/* Price */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-midnight-400">{t('chooseFormat.estimatedPrice')}</div>
            <div className="text-right">
              <div className="text-3xl font-bold text-aurora-400">
                {estimatedPrice ? `${estimatedPrice.toFixed(2)}€` : '—'}
              </div>
              <div className="text-xs text-midnight-500">{t('chooseFormat.shipping')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <motion.button
          onClick={onContinue}
          className="inline-flex items-center gap-2 text-lg px-8 py-3 rounded-xl bg-gradient-to-r from-aurora-500 to-aurora-700 text-white font-semibold hover:from-aurora-400 hover:to-aurora-600 transition-all shadow-lg shadow-aurora-500/25"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {t('chooseFormat.checkQuality')}
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  )
}

function ChooseFormatStep() {
  const t = useTranslations('publish')
  const {
    selectedFormat,
    coverType,
    setCoverType,
    paperType,
    setPaperType,
    lamination,
    setLamination,
    setCurrentStep,
    calculatePrice,
  } = usePublishStore()

  const [subStep, setSubStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [returnToSummary, setReturnToSummary] = useState(false)

  useEffect(() => {
    calculatePrice()
  }, [selectedFormat, coverType, paperType, lamination, calculatePrice])

  const goToSubStep = (target: number) => {
    setDirection(target > subStep ? 1 : -1)
    setSubStep(target)
  }

  const handleNext = () => {
    if (returnToSummary) {
      setReturnToSummary(false)
      setDirection(1)
      setSubStep(3)
    } else if (subStep < 3) {
      setDirection(1)
      setSubStep(subStep + 1)
    }
  }

  const handleBack = () => {
    if (subStep === 0) {
      setCurrentStep('select-story')
    } else {
      setDirection(-1)
      setSubStep(subStep - 1)
      setReturnToSummary(false)
    }
  }

  const handleGoToSubStepFromSummary = (step: number) => {
    setReturnToSummary(true)
    goToSubStep(step)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto"
    >
      <SubStepIndicator current={subStep} total={4} />

      <div className="relative overflow-hidden min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          {subStep === 0 && (
            <motion.div
              key="cover-type"
              custom={direction}
              variants={subStepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <CoverTypeSubStep
                currentValue={coverType}
                onSelect={(type) => setCoverType(type)}
              />
            </motion.div>
          )}

          {subStep === 1 && (
            <motion.div
              key="paper-type"
              custom={direction}
              variants={subStepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <PaperTypeSubStep
                currentValue={paperType}
                onSelect={(id) => setPaperType(id as any)}
              />
            </motion.div>
          )}

          {subStep === 2 && (
            <motion.div
              key="cover-finish"
              custom={direction}
              variants={subStepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <CoverFinishSubStep
                currentValue={lamination}
                onSelect={(id) => setLamination(id as any)}
              />
            </motion.div>
          )}

          {subStep === 3 && (
            <motion.div
              key="summary"
              custom={direction}
              variants={subStepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <SummarySubStep
                onGoToSubStep={handleGoToSubStepFromSummary}
                onContinue={() => setCurrentStep('quality-check')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-midnight-600 text-midnight-300 hover:text-white hover:border-midnight-400 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('nav.back')}
        </button>
        {subStep < 3 && (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-aurora-500 to-aurora-700 text-white font-semibold hover:from-aurora-400 hover:to-aurora-600 transition-all shadow-lg shadow-aurora-500/25"
          >
            {t('nav.next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE 3 : Design de la couverture
// ============================================================================

function DesignCoverStep() {
  const t = useTranslations('publish')
  const { cover, updateCover, setCurrentStep, selectedStory } = usePublishStore()
  const { importedAssets } = useStudioStore()
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [imagePickerTarget, setImagePickerTarget] = useState<'front' | 'back'>('front')
  
  // Récupérer les pages de couverture de l'histoire si elles existent
  const frontCoverPage = selectedStory?.pages?.find(p => p.pageType === 'front-cover')
  const backCoverPage = selectedStory?.pages?.find(p => p.pageType === 'back-cover')
  
  // Utiliser les données des pages de couverture si disponibles
  const frontCoverImage = frontCoverPage?.backgroundMedia?.url || 
    frontCoverPage?.images?.[0]?.url || 
    cover.frontImage
  const backCoverImage = backCoverPage?.backgroundMedia?.url || 
    backCoverPage?.images?.[0]?.url || 
    cover.backImage
  const backCoverText = backCoverPage?.content || cover.backText
  
  // Récupérer toutes les images disponibles (Studio + pages de l'histoire)
  const availableImages = [
    // Images importées depuis le Studio (la vraie source !)
    ...importedAssets
      .filter(asset => asset.type === 'image')
      .map(asset => ({ url: asset.url, source: 'Studio' as const })),
    // Images sur les pages (nouveau format multi-images)
    ...(selectedStory?.pages || [])
      .flatMap(page => page.images || [])
      .map(img => ({ url: img.url, source: 'Histoire' as const })),
    // Images legacy (ancien format)
    ...(selectedStory?.pages || [])
      .filter(page => page.image)
      .map(page => ({ url: page.image!, source: 'Histoire' as const })),
    // Fonds de page (backgroundMedia)
    ...(selectedStory?.pages || [])
      .filter(page => page.backgroundMedia?.url && page.backgroundMedia.type === 'image')
      .map(page => ({ url: page.backgroundMedia!.url, source: 'Histoire' as const })),
  ].filter((img, index, self) => 
    // Dédupliquer par URL
    self.findIndex(i => i.url === img.url) === index
  )
  
  const handleSelectImage = (url: string) => {
    if (imagePickerTarget === 'front') {
      updateCover({ frontImage: url })
    } else {
      updateCover({ backImage: url })
    }
    setShowImagePicker(false)
  }
  
  const handleRemoveImage = (target: 'front' | 'back') => {
    if (target === 'front') {
      updateCover({ frontImage: undefined })
    } else {
      updateCover({ backImage: undefined })
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          🎨 {t('designCover.title')}
        </h2>
        <p className="text-midnight-300">
          {t('designCover.description')}
        </p>
        {/* Indication si les couvertures existent dans l'histoire */}
        {(selectedStory?.pages?.some(p => p.pageType === 'front-cover') || 
          selectedStory?.pages?.some(p => p.pageType === 'back-cover')) && (
          <p className="text-sm text-aurora-400 mt-2 flex items-center justify-center gap-2">
            <span>✨</span>
            <span dangerouslySetInnerHTML={{ __html: t('designCover.coversFromBook') }} />
          </p>
        )}
      </div>
      
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Formulaire */}
        <div className="space-y-6">
          {/* Titre */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              {t('designCover.bookTitle')}
            </label>
            <input
              type="text"
              value={cover.frontTitle}
              onChange={(e) => updateCover({ frontTitle: e.target.value })}
              placeholder={selectedStory?.title || t('designCover.bookTitlePlaceholder')}
              className="w-full px-4 py-3 bg-midnight-800/50 border border-midnight-700 rounded-xl text-white placeholder-midnight-500 focus:outline-none focus:ring-2 focus:ring-aurora-500"
            />
          </div>
          
          {/* Sous-titre */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              {t('designCover.subtitle')}
            </label>
            <input
              type="text"
              value={cover.frontSubtitle || ''}
              onChange={(e) => updateCover({ frontSubtitle: e.target.value })}
              placeholder={t('designCover.subtitlePlaceholder')}
              className="w-full px-4 py-3 bg-midnight-800/50 border border-midnight-700 rounded-xl text-white placeholder-midnight-500 focus:outline-none focus:ring-2 focus:ring-aurora-500"
            />
          </div>
          
          {/* Auteur */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              {t('designCover.authorName')}
            </label>
            <input
              type="text"
              value={cover.authorName}
              onChange={(e) => updateCover({ authorName: e.target.value })}
              placeholder={t('designCover.authorNamePlaceholder')}
              className="w-full px-4 py-3 bg-midnight-800/50 border border-midnight-700 rounded-xl text-white placeholder-midnight-500 focus:outline-none focus:ring-2 focus:ring-aurora-500"
            />
          </div>
          
          {/* Image de couverture */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              {t('designCover.coverImage')}
            </label>
            {cover.frontImage ? (
              <div className="relative">
                <img 
                  src={cover.frontImage} 
                  alt={t('designCover.coverImageAlt')}
                  className="w-full h-40 object-cover rounded-xl"
                />
                <button
                  onClick={() => handleRemoveImage('front')}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setImagePickerTarget('front'); setShowImagePicker(true); }}
                  className="absolute bottom-2 right-2 px-3 py-1.5 bg-midnight-800/80 text-white text-xs rounded-lg hover:bg-midnight-700 transition-colors"
                >
                  {t('designCover.changeImage')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setImagePickerTarget('front'); setShowImagePicker(true); }}
                className="w-full h-32 border-2 border-dashed border-midnight-600 rounded-xl flex flex-col items-center justify-center gap-2 text-midnight-400 hover:text-aurora-400 hover:border-aurora-500/50 transition-all"
              >
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm">{t('designCover.chooseImage')}</span>
              </button>
            )}
            {availableImages.length === 0 && (
              <p className="text-xs text-midnight-500 mt-2">
                💡 {t('designCover.studioHint')}
              </p>
            )}
          </div>
          
          {/* Couleur de fond */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              {cover.frontImage ? t('designCover.bgColorBehind') : t('designCover.bgColor')}
            </label>
            <div className="flex gap-3 flex-wrap">
              {[
                '#1a1a2e', '#2d132c', '#0f3460', '#1a472a', 
                '#3d0c02', '#4a235a', '#1b4332', '#0d1b2a'
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => updateCover({ 
                    frontBackgroundColor: color,
                    backBackgroundColor: color,
                    spineBackgroundColor: color,
                  })}
                  className={cn(
                    'w-10 h-10 rounded-lg transition-all',
                    cover.frontBackgroundColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-midnight-900'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          {/* Texte 4ème de couverture */}
          <div className="glass-card p-6">
            <label className="block text-sm font-medium text-midnight-300 mb-2">
              {t('designCover.backCoverText')}
            </label>
            <textarea
              value={cover.backText || ''}
              onChange={(e) => updateCover({ backText: e.target.value })}
              placeholder={t('designCover.backCoverPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 bg-midnight-800/50 border border-midnight-700 rounded-xl text-white placeholder-midnight-500 focus:outline-none focus:ring-2 focus:ring-aurora-500 resize-none"
            />
          </div>
        </div>
        
        {/* Prévisualisation */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-white mb-4">{t('designCover.preview')}</h3>
          
          <div className="flex gap-4 justify-center">
            {/* Première de couverture */}
            <div
              className="w-40 h-56 rounded-lg shadow-2xl flex flex-col items-center justify-center p-4 text-center relative overflow-hidden"
              style={{ backgroundColor: cover.frontBackgroundColor }}
            >
              {/* Image de couverture (depuis la page couverture ou le formulaire) */}
              {frontCoverImage && (
                <img 
                  src={frontCoverImage} 
                  alt="Couverture"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {/* Overlay gradient */}
              <div className={cn(
                "absolute inset-0",
                frontCoverImage 
                  ? "bg-gradient-to-t from-black/70 via-black/20 to-black/30" 
                  : "bg-gradient-to-b from-white/5 to-transparent"
              )} />
              {/* Titre et auteur */}
              <div className="relative z-10 flex flex-col items-center justify-center flex-1">
                <h4 className="text-white font-display text-lg leading-tight drop-shadow-lg">
                  {cover.frontTitle || t('designCover.defaultTitle')}
                </h4>
                {cover.frontSubtitle && (
                  <p className="text-white/80 text-xs mt-2 drop-shadow">
                    {cover.frontSubtitle}
                  </p>
                )}
              </div>
              <p className="text-white/70 text-xs relative z-10 drop-shadow mb-1">
                {cover.authorName || t('designCover.defaultAuthor')}
              </p>
            </div>
            
            {/* Tranche */}
            <div
              className="w-4 h-56 rounded-sm"
              style={{ backgroundColor: cover.spineBackgroundColor }}
            />
            
            {/* 4ème de couverture */}
            <div
              className="w-40 h-56 rounded-lg shadow-2xl flex flex-col p-4 relative overflow-hidden"
              style={{ backgroundColor: cover.backBackgroundColor }}
            >
              {/* Image de fond (depuis la page 4ème couverture ou le formulaire) */}
              {backCoverImage && (
                <img 
                  src={backCoverImage} 
                  alt="Dos"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
              <p className="text-white/80 text-xs leading-relaxed relative z-10 flex-1">
                {backCoverText || t('designCover.defaultSummary')}
              </p>
            </div>
          </div>
          
          <p className="text-center text-midnight-500 text-xs mt-4">
            {t('designCover.previewLabels')}
          </p>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep('choose-format')}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t('nav.back')}
        </button>
        <button
          onClick={() => setCurrentStep('preview')}
          className="btn-primary"
        >
          {t('designCover.continue')}
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
      
      {/* Modal sélection d'image */}
      <AnimatePresence>
        {showImagePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImagePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-display text-white">
                  🖼️ {t('designCover.imagePickerTitle')}
                </h3>
                <button
                  onClick={() => setShowImagePicker(false)}
                  className="p-2 rounded-full hover:bg-midnight-700/50 text-midnight-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {availableImages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="w-16 h-16 text-midnight-600 mb-4" />
                  <p className="text-white mb-2">{t('designCover.noImages')}</p>
                  <p className="text-sm text-midnight-400 mb-4">
                    {t('designCover.noImagesDesc')}
                  </p>
                  <button
                    onClick={() => {
                      setShowImagePicker(false)
                      useAppStore.getState().setCurrentMode('studio')
                    }}
                    className="btn-primary"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('designCover.goToStudio')}
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-3">
                    {availableImages.map((img, index) => (
                      <motion.button
                        key={`${img.url}-${index}`}
                        onClick={() => handleSelectImage(img.url)}
                        className="relative aspect-square rounded-xl overflow-hidden group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img
                          src={getThumbnailUrl(img.url, 200)}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          data-original={img.url}
                          onError={(e) => {
                            const el = e.target as HTMLImageElement
                            if (!el.dataset.fallback) {
                              el.dataset.fallback = '1'
                              el.src = el.dataset.original || ''
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Check className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                        </div>
                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                          {img.source}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE 4 : Aperçu - VRAIE PRÉVISUALISATION D'IMPRESSION
// ============================================================================

function PreviewStep() {
  const t = useTranslations('publish')
  const { selectedStory, selectedFormat, cover, setCurrentStep } = usePublishStore()
  const format = findBookFormat(selectedFormat)
  
  const [currentPage, setCurrentPage] = useState(0)
  const [showSafeZones, setShowSafeZones] = useState(true)
  const [viewMode, setViewMode] = useState<'spread' | 'single'>('spread')
  
  if (!selectedStory || !format) return null
  
  const pages = selectedStory.pages || []
  const totalSpreads = Math.ceil(pages.length / 2) + 1 // +1 pour la couverture
  
  // Calculer le ratio et les dimensions d'affichage
  const formatRatio = format.widthMm / format.heightMm
  const displayHeight = Math.min(400, window.innerHeight * 0.5)
  const displayWidth = displayHeight * formatRatio
  
  // Couleur de fond de page selon le bookColor de l'histoire
  const bookColor = ((selectedStory as any).bookColor as string) || 'cream'
  const pageBackgrounds: Record<string, string> = {
    cream: 'linear-gradient(135deg, #FFFEF5 0%, #FDF8E8 50%, #F5EFD5 100%)',
    white: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 50%, #F5F5F5 100%)',
    aged: 'linear-gradient(135deg, #F5E6D3 0%, #E8D5BE 50%, #D4C4A8 100%)',
    parchment: 'linear-gradient(135deg, #F4E4BC 0%, #E8D4A0 50%, #D4C080 100%)',
  }
  const pageBackground = pageBackgrounds[bookColor] || pageBackgrounds.cream
  
  // Rendu d'une page individuelle avec tous ses éléments
  const renderPage = (pageIndex: number, side: 'left' | 'right') => {
    const page = pages[pageIndex]
    if (!page) {
      return (
        <div className="flex-1 flex items-center justify-center text-amber-400/50 text-sm">
          {pageIndex >= pages.length ? t('preview.endOfBook') : t('preview.emptyPage')}
        </div>
      )
    }
    
    // Images de la page (format nouveau ou legacy)
    const pageImages = page.images || (page.image ? [{
      id: 'legacy',
      url: page.image,
      type: 'image',
      position: page.imagePosition || { x: 50, y: 50, width: 50, height: 50, rotation: 0 },
    }] : [])
    
    return (
      <div className="relative flex-1 overflow-hidden">
        {/* Fond de page (image ou couleur) */}
        {page.backgroundMedia && (
          <div className="absolute inset-0 z-0">
            {page.backgroundMedia.type === 'video' ? (
              <video
                src={page.backgroundMedia.url}
                className="w-full h-full object-cover"
                style={{ opacity: page.backgroundMedia.opacity || 1 }}
                muted
                loop
                autoPlay
              />
            ) : (
              <img
                src={page.backgroundMedia.url}
                alt=""
                className="w-full h-full object-cover"
                style={{ opacity: page.backgroundMedia.opacity || 1 }}
              />
            )}
          </div>
        )}
        
        {/* Zone de sécurité (overlay) */}
        {showSafeZones && (
          <div 
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              border: `${format.safeZoneMm * 0.8}px dashed rgba(255, 0, 0, 0.3)`,
              margin: `${format.bleedMm * 0.8}px`,
            }}
          >
            <div className="absolute top-0 left-0 bg-red-500/20 text-red-500 text-[8px] px-1 rounded-br">
              {t('preview.safeZoneLabel')}
            </div>
          </div>
        )}
        
        {/* Images flottantes */}
        {pageImages.map((img: any, idx: number) => (
          <div
            key={img.id || idx}
            className="absolute z-10"
            style={{
              left: `${img.position?.x || 50}%`,
              top: `${img.position?.y || 50}%`,
              width: `${img.position?.width || 40}%`,
              height: `${img.position?.height || 40}%`,
              transform: `translate(-50%, -50%) rotate(${img.position?.rotation || 0}deg)`,
            }}
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        ))}
        
        {/* Contenu texte */}
        <div 
          className="relative z-20 h-full p-4 overflow-hidden"
          style={{
            padding: `${format.safeZoneMm * 0.8 + 10}px`,
            paddingLeft: side === 'left' ? `${format.spineMarginMm * 0.8 + 10}px` : `${format.safeZoneMm * 0.8 + 10}px`,
            paddingRight: side === 'right' ? `${format.spineMarginMm * 0.8 + 10}px` : `${format.safeZoneMm * 0.8 + 10}px`,
          }}
        >
          <div 
            className="text-sm text-amber-900 font-serif leading-relaxed"
            style={{
              fontFamily: page.style?.fontFamily || 'Georgia, serif',
              fontSize: `${(page.style?.fontSize || 14) * 0.7}px`,
              textAlign: page.style?.textAlign || 'left',
            }}
            dangerouslySetInnerHTML={{ __html: page.content || '' }}
          />
        </div>
      </div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto"
    >
      <div className="text-center mb-6">
        <h2 className="text-3xl font-display text-white mb-2">
          👀 {t('preview.title')}
        </h2>
        <p className="text-midnight-300">
          {t('preview.description')}
        </p>
      </div>
      
      {/* Contrôles */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setShowSafeZones(!showSafeZones)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm transition-all',
            showSafeZones 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'bg-midnight-800/50 text-midnight-400'
          )}
        >
          📏 {t('preview.safeZones')} {showSafeZones ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => setViewMode(viewMode === 'spread' ? 'single' : 'spread')}
          className="px-3 py-1.5 rounded-lg text-sm bg-midnight-800/50 text-midnight-400"
        >
          {viewMode === 'spread' ? `📖 ${t('preview.doublePage')}` : `📄 ${t('preview.singlePage')}`}
        </button>
      </div>
      
      {/* Prévisualisation du livre */}
      <div className="glass-card p-8 mb-6">
        <div className="flex items-center justify-center gap-1">
          {viewMode === 'spread' ? (
            <>
              {/* Page de gauche */}
              <div
                className="relative flex flex-col shadow-xl overflow-hidden"
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  background: pageBackground,
                  borderRadius: '4px 0 0 4px',
                  boxShadow: 'inset -10px 0 20px -10px rgba(0,0,0,0.15)',
                }}
              >
                {currentPage === 0 ? (
                  // Page de titre (couverture intérieure)
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <div>
                      <h3 className="text-2xl font-serif text-amber-900 mb-3">{cover.frontTitle || selectedStory.title}</h3>
                      {cover.frontSubtitle && (
                        <p className="text-sm text-amber-700 mb-4 italic">{cover.frontSubtitle}</p>
                      )}
                      <div className="w-16 h-0.5 bg-amber-400 mx-auto mb-4" />
                      <p className="text-xs text-amber-600">{cover.authorName}</p>
                    </div>
                  </div>
                ) : (
                  renderPage(currentPage * 2 - 1, 'left')
                )}
                <div className="text-center py-2 text-xs text-amber-500/70">
                  {currentPage === 0 ? '' : currentPage * 2}
                </div>
              </div>
              
              {/* Reliure centrale */}
              <div 
                className="w-2 self-stretch"
                style={{
                  background: 'linear-gradient(90deg, rgba(139,90,43,0.3) 0%, rgba(101,67,33,0.5) 50%, rgba(139,90,43,0.3) 100%)',
                  boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                }}
              />
              
              {/* Page de droite */}
              <div
                className="relative flex flex-col shadow-xl overflow-hidden"
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  background: pageBackground,
                  borderRadius: '0 4px 4px 0',
                  boxShadow: 'inset 10px 0 20px -10px rgba(0,0,0,0.15)',
                }}
              >
                {renderPage(currentPage * 2, 'right')}
                <div className="text-center py-2 text-xs text-amber-500/70">
                  {currentPage * 2 + 1}
                </div>
              </div>
            </>
          ) : (
            // Mode page simple
            <div
              className="relative flex flex-col shadow-xl overflow-hidden"
              style={{
                width: `${displayWidth * 1.5}px`,
                height: `${displayHeight * 1.5}px`,
                background: pageBackground,
                borderRadius: '4px',
              }}
            >
              {renderPage(currentPage, currentPage % 2 === 0 ? 'right' : 'left')}
              <div className="text-center py-2 text-xs text-amber-500/70">
                Page {currentPage + 1}
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation des pages */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-full bg-midnight-800/50 text-white disabled:opacity-30 hover:bg-midnight-700/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Indicateurs de pages */}
          <div className="flex items-center gap-1">
            {Array.from({ length: viewMode === 'spread' ? totalSpreads : pages.length }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  currentPage === i ? 'bg-aurora-500 w-4' : 'bg-midnight-600 hover:bg-midnight-500'
                )}
              />
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={viewMode === 'spread' ? currentPage >= totalSpreads - 1 : currentPage >= pages.length - 1}
            className="p-2 rounded-full bg-midnight-800/50 text-white disabled:opacity-30 hover:bg-midnight-700/50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center text-midnight-400 text-sm mt-2">
          {viewMode === 'spread'
            ? (currentPage === 0 ? t('preview.titlePage') : t('preview.pagesRange', { start: currentPage * 2, end: currentPage * 2 + 1 }))
            : t('preview.pageNumber', { number: currentPage + 1 })
          } {t('preview.ofPages', { count: pages.length })}
        </div>
      </div>
      
      {/* Infos format */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-center gap-6 text-sm text-midnight-400 flex-wrap">
          <span>📐 {t('preview.format', { width: format.widthMm, height: format.heightMm })}</span>
          <span>📄 {t('preview.pagesCount', { count: pages.length })}</span>
          <span>📏 {t('preview.safeMargin', { value: format.safeZoneMm })}</span>
          <span>✂️ {t('preview.bleed', { value: format.bleedMm })}</span>
          <span>📚 {t('preview.spineMargin', { value: format.spineMarginMm })}</span>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('design-cover')}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t('nav.back')}
        </button>
        <button
          onClick={() => setCurrentStep('quality-check')}
          className="btn-primary"
        >
          {t('preview.checkQuality')}
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE 5 : Vérification qualité
// ============================================================================

function QualityCheckStep() {
  const t = useTranslations('publish')
  const {
    selectedStory,
    selectedFormat,
    qualityChecks,
    imageQualityInfos,
    isCheckingQuality,
    runQualityCheck,
    setCurrentStep,
  } = usePublishStore()
  
  const format = findBookFormat(selectedFormat)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [upscaleProgress, setUpscaleProgress] = useState<Record<string, 'pending' | 'done' | 'error'>>({})
  
  useEffect(() => {
    if (selectedStory && format) {
      runQualityCheck(selectedStory, format)
    }
  }, [selectedStory, format, runQualityCheck])
  
  const hasErrors = qualityChecks.some(c => c.type === 'error')
  const hasWarnings = qualityChecks.some(c => c.type === 'warning')
  const lowDpiImages = imageQualityInfos.filter(img => !img.isOk)
  
  // Upscale toutes les images en basse résolution
  const handleUpscaleAll = async () => {
    if (lowDpiImages.length === 0) return
    
    setIsUpscaling(true)
    const progress: Record<string, 'pending' | 'done' | 'error'> = {}
    
    for (const img of lowDpiImages) {
      progress[img.imageId] = 'pending'
    }
    setUpscaleProgress(progress)
    
    for (const img of lowDpiImages) {
      try {
        const response = await fetch('/api/ai/upscale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: img.url,
            scale: 2,
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Image ${img.imageId} upscaled:`, data.url)
          setUpscaleProgress(prev => ({ ...prev, [img.imageId]: 'done' }))
          // Note: Ici il faudrait mettre à jour l'URL de l'image dans l'histoire
          // Pour l'instant on marque juste comme fait
        } else {
          setUpscaleProgress(prev => ({ ...prev, [img.imageId]: 'error' }))
        }
      } catch (error) {
        console.error(`Erreur upscale ${img.imageId}:`, error)
        setUpscaleProgress(prev => ({ ...prev, [img.imageId]: 'error' }))
      }
    }
    
    setIsUpscaling(false)
    
    // Re-vérifier la qualité après upscale
    if (selectedStory && format) {
      runQualityCheck(selectedStory, format)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          ✅ {t('quality.title')}
        </h2>
        <p className="text-midnight-300">
          {t('quality.description')}
        </p>
      </div>
      
      <div className="glass-card p-6 mb-8">
        {isCheckingQuality ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-aurora-500 animate-spin mb-4" />
            <p className="text-white">{t('quality.checking')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {qualityChecks.map((check) => (
              <motion.div
                key={check.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl',
                  check.type === 'success' && 'bg-green-500/10 border border-green-500/20',
                  check.type === 'warning' && 'bg-amber-500/10 border border-amber-500/20',
                  check.type === 'error' && 'bg-red-500/10 border border-red-500/20'
                )}
              >
                {check.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />}
                {check.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                {check.type === 'error' && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                
                <div className="flex-1">
                  <p className={cn(
                    check.type === 'success' && 'text-green-300',
                    check.type === 'warning' && 'text-amber-300',
                    check.type === 'error' && 'text-red-300'
                  )}>
                    {check.message}
                  </p>
                  {check.page && (
                    <p className="text-xs text-midnight-500 mt-1">Page {check.page}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Images en basse résolution */}
      {!isCheckingQuality && lowDpiImages.length > 0 && (
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-amber-300 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                {t('quality.lowResTitle')}
              </h3>
              <p className="text-sm text-midnight-400 mt-1">
                {t('quality.lowResDesc')}
              </p>
            </div>
            <button
              onClick={handleUpscaleAll}
              disabled={isUpscaling}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {isUpscaling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('quality.upscaling')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('quality.upscaleAll')}
                </>
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {lowDpiImages.map((img) => (
              <div 
                key={img.imageId}
                className="relative rounded-lg overflow-hidden bg-midnight-800/50 aspect-square"
              >
                <img
                  src={getThumbnailUrl(img.url, 200)}
                  alt={`Page ${img.pageIndex + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  data-original={img.url}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    if (!el.dataset.fallback) {
                      el.dataset.fallback = '1'
                      el.src = el.dataset.original || ''
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-400">
                      {img.currentDpi ? `${img.currentDpi} DPI` : t('quality.dpiUnknown')}
                    </span>
                    <span className="text-midnight-400">
                      Page {img.pageIndex + 1}
                    </span>
                  </div>
                  {img.widthPx && img.heightPx && (
                    <p className="text-[10px] text-midnight-500 mt-0.5">
                      {img.widthPx}×{img.heightPx}px
                    </p>
                  )}
                </div>
                
                {/* Indicateur d'upscale */}
                {upscaleProgress[img.imageId] && (
                  <div className={cn(
                    "absolute top-2 right-2 p-1 rounded-full",
                    upscaleProgress[img.imageId] === 'pending' && "bg-amber-500/80",
                    upscaleProgress[img.imageId] === 'done' && "bg-green-500/80",
                    upscaleProgress[img.imageId] === 'error' && "bg-red-500/80"
                  )}>
                    {upscaleProgress[img.imageId] === 'pending' && (
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    )}
                    {upscaleProgress[img.imageId] === 'done' && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                    {upscaleProgress[img.imageId] === 'error' && (
                      <AlertCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-xs text-midnight-500 mt-4 text-center">
            💡 {t('quality.upscaleHint')}
          </p>
        </div>
      )}
      
      {/* Résumé */}
      {!isCheckingQuality && (
        <div className={cn(
          'glass-card p-6 mb-8 text-center',
          !hasErrors && !hasWarnings && 'bg-green-500/5 border-green-500/20',
          hasWarnings && !hasErrors && 'bg-amber-500/5 border-amber-500/20',
          hasErrors && 'bg-red-500/5 border-red-500/20'
        )}>
          {!hasErrors && !hasWarnings && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl text-green-300 font-medium">{t('quality.allGoodTitle')} 🎉</h3>
              <p className="text-green-400/70 mt-2">{t('quality.allGoodDesc')}</p>
            </>
          )}
          {hasWarnings && !hasErrors && (
            <>
              <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl text-amber-300 font-medium">{t('quality.warningsTitle')}</h3>
              <p className="text-amber-400/70 mt-2">{t('quality.warningsDesc')}</p>
            </>
          )}
          {hasErrors && (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl text-red-300 font-medium">{t('quality.errorsTitle')}</h3>
              <p className="text-red-400/70 mt-2">{t('quality.errorsDesc')}</p>
            </>
          )}
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('choose-format')}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t('nav.back')}
        </button>
        <button
          onClick={() => setCurrentStep('order')}
          disabled={hasErrors}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasErrors ? t('quality.fixErrors') : t('quality.orderButton')}
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE : Commande
// ============================================================================

function OrderStep() {
  const t = useTranslations('publish')
  const locale = useLocale()
  const {
    selectedStory,
    selectedFormat,
    coverType,
    paperType,
    lamination,
    cover,
    estimatedPrice,
    isExporting,
    exportProgress,
    pdfUrl,
    isUploadingPdf,
    uploadPdfProgress,
    uploadPdfToSupabase,
    setCurrentStep,
    // Gelato
    gelatoQuote,
    isLoadingQuote,
    quoteError,
    fetchGelatoQuote,
    orderResult,
  } = usePublishStore()

  const { user } = useAuthStore()

  const format = findBookFormat(selectedFormat)
  const [showExportSuccess, setShowExportSuccess] = useState(false)
  const [localExportProgress, setLocalExportProgress] = useState(0)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [useScreenCapture, setUseScreenCapture] = useState(true) // Nouvelle méthode par défaut
  
  // Hook pour l'export PDF par capture d'écran
  const pdfExport = usePdfExport()

  // Prix de vente calculé (inclut marge + livraison)
  const sellingPriceFormatted = gelatoQuote
    ? (calculateBookPrice(
        coverType === 'hardcover' ? 'hardcover' : 'softcover',
        gelatoQuote.productPrice + gelatoQuote.shippingPrice
      ) / 100).toFixed(2)
    : null

  // Charger le devis Gelato au montage (une seule fois)
  // Note: on n'appelle pas si quoteError existe pour éviter une boucle infinie
  useEffect(() => {
    if (selectedStory && !gelatoQuote && !isLoadingQuote && !quoteError) {
      fetchGelatoQuote()
    }
  }, [selectedStory, gelatoQuote, isLoadingQuote, quoteError, fetchGelatoQuote])
  
  // Générer ET uploader le PDF
  const handleExportPdf = async () => {
    if (!selectedStory || !format || !user) return
    
    setIsGeneratingPdf(true)
    setLocalExportProgress(0)
    
    try {
      let blob: Blob
      
      if (useScreenCapture) {
        // NOUVELLE MÉTHODE : Capture d'écran + upscale fal.ai
        const result = await pdfExport.exportToPdf(selectedStory, {
          format,
          pageColor: 'cream', // TODO: récupérer depuis l'histoire
          showLines: true,
          includePageNumbers: true,
          useUpscale: true, // Activer l'upscale fal.ai pour 300 DPI
        })
        
        if (!result) {
          throw new Error('Échec de la génération du PDF')
        }
        
        blob = result.blob
        setLocalExportProgress(50)
      } else {
        // ANCIENNE MÉTHODE : Génération HTML directe
        const result = await exportToPDF(selectedStory, format, cover, {
          onProgress: (progress) => {
            setLocalExportProgress(Math.round(progress * 0.5)) // 0-50%
          },
          includeBleed: true,
        })
        blob = result.blob
        setLocalExportProgress(50)
      }
      
      setPdfBlob(blob)
      
      // 2. Uploader vers Supabase pour Gelato
      const publicUrl = await uploadPdfToSupabase(blob, selectedStory, user.id)
      
      if (publicUrl) {
        setShowExportSuccess(true)
        setLocalExportProgress(100)
      }
      
    } catch (error) {
      console.error('Erreur génération/upload PDF:', error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }
  
  // Télécharger le PDF localement
  const handleDownloadPdf = () => {
    if (!pdfBlob || !selectedStory) return
    
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedStory.title || 'mon-livre'}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }
  
  const [addedToCart, setAddedToCart] = useState(false)

  const handleAddToCart = () => {
    if (!selectedStory || !gelatoQuote || !pdfUrl) return

    const store = usePublishStore.getState()
    const item: CartItem = {
      id: crypto.randomUUID(),
      type: 'book',
      productUid: '', // resolved at checkout via format/coverType
      priceCents: calculateBookPrice(
        coverType === 'hardcover' ? 'hardcover' : 'softcover',
        gelatoQuote.productPrice + gelatoQuote.shippingPrice
      ),
      quantity: 1,
      label: selectedStory.title || 'Mon livre',
      imageUrls: [],
      bookData: {
        format: selectedFormat,
        coverType,
        paperType,
        lamination,
        pageCount: selectedStory.pages.length,
        pdfUrl,
        pdfFilePath: store.pdfFilePath || '',
        gelatoQuote,
      },
    }

    store.addToCart(item)
    setAddedToCart(true)
  }
  
  // Calculer la progression totale (génération + upload)
  const totalProgress = isGeneratingPdf 
    ? (useScreenCapture ? pdfExport.progress : localExportProgress)
    : isUploadingPdf 
      ? 50 + Math.round(uploadPdfProgress * 0.5)
      : showExportSuccess ? 100 : 0
  
  // Message de progression
  const progressMessage = useScreenCapture && pdfExport.isExporting 
    ? pdfExport.message 
    : isGeneratingPdf 
      ? 'Génération du PDF...'
      : isUploadingPdf 
        ? 'Upload du PDF...' 
        : ''
  
  if (!format) return null
  
  // Si commande réussie
  if (orderResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="glass-card p-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <CheckCircle2 className="w-24 h-24 text-green-400 mx-auto mb-6" />
          </motion.div>
          
          <h2 className="text-3xl font-display text-white mb-4">
            🎉 {t('order.successTitle')}
          </h2>

          <p className="text-midnight-300 mb-6">
            {t('order.successDesc')}
          </p>
          
          <div className="bg-midnight-800/50 rounded-xl p-4 mb-6 text-left">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-midnight-400">{t('order.orderNumber')}</span>
                <span className="text-white font-mono">{orderResult.referenceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-midnight-400">{t('order.status')}</span>
                <span className="text-aurora-400">{orderResult.status}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              usePublishStore.getState().reset()
              useAppStore.getState().setCurrentMode('book')
            }}
            className="btn-primary"
          >
            {t('order.backToWriting')}
          </button>
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          🎉 {t('order.title')}
        </h2>
        <p className="text-midnight-300">
          {t('order.description')}
        </p>
      </div>
      
      {/* Récapitulatif avec prix Gelato */}
      <div className="glass-card p-6 mb-8">
        <h3 className="text-lg font-medium text-white mb-4">{t('order.summary')}</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-midnight-400">{t('order.book')}</span>
            <span className="text-white">{selectedStory?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-400">{t('order.format')}</span>
            <span className="text-white">{locale === 'fr' ? format.nameFr : format.name} ({format.widthMm}×{format.heightMm}mm)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-400">{t('order.pages')}</span>
            <span className="text-white">{t('selectStory.pages', { count: selectedStory?.pages.length || 0 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-400">{t('order.cover')}</span>
            <span className="text-white">{locale === 'fr' ? COVER_TYPES.find(c => c.type === coverType)?.nameFr : COVER_TYPES.find(c => c.type === coverType)?.nameEn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-400">{t('order.paper')}</span>
            <span className="text-white">{locale === 'fr' ? GELATO_PAPER_OPTIONS.find(p => p.id === paperType)?.nameFr : GELATO_PAPER_OPTIONS.find(p => p.id === paperType)?.nameEn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-400">{t('order.finish')}</span>
            <span className="text-white">{locale === 'fr' ? GELATO_LAMINATION_OPTIONS.find(l => l.id === lamination)?.nameFr : GELATO_LAMINATION_OPTIONS.find(l => l.id === lamination)?.nameEn}</span>
          </div>
          
          {/* Prix Gelato */}
          <div className="border-t border-midnight-700 pt-3 mt-3">
            {isLoadingQuote ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-aurora-400" />
                <span className="text-midnight-400">{t('order.calculatingPrice')}</span>
              </div>
            ) : gelatoQuote ? (
              <>
                <div className="flex justify-between text-lg">
                  <span className="text-white font-medium">{t('order.bookPrice')}</span>
                  <span className="text-aurora-400 font-bold">
                    {sellingPriceFormatted}€
                  </span>
                </div>
                <p className="text-xs text-midnight-500 mt-1">
                  🚚 {t('order.shippingIncluded')} — {t('order.estimatedDelivery', { min: gelatoQuote.estimatedDelivery.min, max: gelatoQuote.estimatedDelivery.max })}
                </p>
              </>
            ) : quoteError ? (
              <div className="text-center py-2">
                <p className="text-amber-400 text-sm mb-2">{quoteError}</p>
                <button
                  onClick={() => fetchGelatoQuote()}
                  className="text-xs text-aurora-400 hover:underline"
                >
                  {t('order.retry')}
                </button>
              </div>
            ) : (
              <div className="flex justify-between text-lg">
                <span className="text-white font-medium">{t('order.estimatedPriceLabel')}</span>
                <span className="text-aurora-400 font-bold">{estimatedPrice?.toFixed(2)}€</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Options */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Export PDF */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-aurora-500/20 flex items-center justify-center">
              <Download className="w-6 h-6 text-aurora-400" />
            </div>
            <div>
              <h4 className="text-white font-medium">{t('order.preparePdf')}</h4>
              <p className="text-xs text-midnight-400">{t('order.preparePdfDesc')}</p>
            </div>
          </div>
          
          {(isGeneratingPdf || isUploadingPdf) ? (
            <div className="space-y-3">
              <div className="h-2 bg-midnight-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-aurora-600 to-dream-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={cn(
                  "text-midnight-400",
                  totalProgress < 50 && "text-aurora-400 font-medium"
                )}>
                  {totalProgress < 50 ? `📄 ${t('order.generatingPdf')}` : `☁️ ${t('order.uploadingPdf')}`}
                </span>
                <span className="text-midnight-400">{totalProgress}%</span>
              </div>
            </div>
          ) : showExportSuccess ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('order.pdfReady')}</span>
              </div>
              {/* PDF téléchargement désactivé — le PDF est réservé à l'impression */}
            </div>
          ) : (
            <button
              onClick={handleExportPdf}
              disabled={!user}
              className="w-full py-3 px-4 bg-aurora-600 hover:bg-aurora-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {t('order.preparePdf')}
            </button>
          )}
          
          {!user && (
            <p className="text-xs text-amber-400/70 text-center mt-2">
              ⚠️ {t('order.loginRequired')}
            </p>
          )}
        </div>
        
        {/* Ajouter au panier */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-dream-500/20 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-dream-400" />
            </div>
            <div>
              <h4 className="text-white font-medium">{t('order.addToCartTitle')}</h4>
              <p className="text-xs text-midnight-400">{t('order.addToCartDesc')}</p>
            </div>
          </div>

          {!showExportSuccess ? (
            <div className="text-center py-3">
              <p className="text-midnight-400 text-sm mb-2">
                {t('order.preparePdfFirst')}
              </p>
              <p className="text-xs text-midnight-500">
                {t('order.pdfRequiredDesc')}
              </p>
            </div>
          ) : addedToCart ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400 justify-center">
                <CheckCircle2 className="w-5 h-5" />
                <span>{t('order.addedToCart')}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    usePublishStore.getState().setShopFlow(null)
                    setCurrentStep('shop-home')
                  }}
                  className="flex-1 py-2.5 px-3 bg-midnight-700 hover:bg-midnight-600 text-white rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('order.continueShopping')}
                </button>
                <button
                  onClick={() => setCurrentStep('cart')}
                  className="flex-1 py-2.5 px-3 bg-dream-600 hover:bg-dream-500 text-white rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t('order.viewCart')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={handleAddToCart}
                disabled={!gelatoQuote || isLoadingQuote || !pdfUrl}
                className="w-full py-3 px-4 bg-dream-600 hover:bg-dream-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                {t('order.addToCart')} {gelatoQuote ? `(${sellingPriceFormatted}€)` : ''}
              </button>

              <p className="text-xs text-midnight-500 text-center mt-2">
                {t('order.printedByGelato')}
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep('quality-check')}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t('nav.back')}
        </button>
        <button
          onClick={() => useAppStore.getState().setCurrentMode('book')}
          className="btn-secondary"
        >
          {t('order.backToWriting')}
        </button>
      </div>
      
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE : Sélection produit dérivé
// ============================================================================

const DERIVATIVE_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Coffee,
  Frame,
  Mail,
  Palette,
}

function SelectDerivativeStep() {
  const t = useTranslations('publish')
  const locale = useLocale()
  const { setCurrentStep, setSelectedDerivativeType, selectedStory } = usePublishStore()

  if (!selectedStory) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          {t('derivatives.title')}
        </h2>
        <p className="text-midnight-300">
          {t('derivatives.description')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DERIVATIVE_PRODUCTS.map((product) => {
          const Icon = DERIVATIVE_ICON_MAP[product.icon] || Gift
          const name = locale === 'en' ? product.nameEn : locale === 'ru' ? product.nameRu : product.nameFr
          const desc = locale === 'en' ? product.descriptionEn : locale === 'ru' ? product.descriptionRu : product.descriptionFr

          return (
            <motion.button
              key={product.type}
              onClick={() => {
                setSelectedDerivativeType(product.type)
                setCurrentStep('choose-illustration')
              }}
              className="glass-card p-6 text-center transition-all hover:bg-pink-500/10 relative group"
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="w-14 h-14 rounded-full bg-pink-500/20 mx-auto mb-4 flex items-center justify-center">
                <Icon className="w-7 h-7 text-pink-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">{name}</h3>
              <p className="text-xs text-midnight-400 mb-3 line-clamp-2">{desc}</p>
              <div className="text-lg font-bold text-aurora-400">
                {(product.sellingPriceCents / 100).toFixed(2)}€
              </div>
              {product.requiresCredit && (
                <span className="inline-block mt-2 px-2 py-0.5 text-xs text-violet-400 bg-violet-500/10 rounded-full">
                  1 {t('derivatives.credit')}
                </span>
              )}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity ring-1 ring-pink-500/50" />
            </motion.button>
          )
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => setCurrentStep('select-story')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-midnight-600 text-midnight-300 hover:text-white hover:border-midnight-400 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('nav.back')}
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE : Choix d'illustration
// ============================================================================

function getStoryIllustrations(story: any): { url: string; pageIndex: number }[] {
  const illustrations: { url: string; pageIndex: number }[] = []
  const seen = new Set<string>()

  story.pages?.forEach((page: any, pageIndex: number) => {
    // Skip cover pages
    if (page.pageType === 'front-cover' || page.pageType === 'back-cover') return

    // Multi-image format
    if (page.images?.length) {
      for (const img of page.images) {
        if (img.url && !seen.has(img.url)) {
          seen.add(img.url)
          illustrations.push({ url: img.url, pageIndex })
        }
      }
    }

    // Legacy single image
    if (page.image && !seen.has(page.image)) {
      seen.add(page.image)
      illustrations.push({ url: page.image, pageIndex })
    }

    // Background media (images only)
    if (page.backgroundMedia?.url && page.backgroundMedia.type === 'image' && !seen.has(page.backgroundMedia.url)) {
      seen.add(page.backgroundMedia.url)
      illustrations.push({ url: page.backgroundMedia.url, pageIndex })
    }
  })

  return illustrations
}

function ChooseIllustrationStep() {
  const t = useTranslations('publish')
  const locale = useLocale()
  const {
    selectedStory,
    selectedDerivativeType,
    selectedIllustrations,
    setSelectedIllustrations,
    setCurrentStep,
    addToCart,
  } = usePublishStore()

  if (!selectedStory || !selectedDerivativeType) return null

  const product = getDerivativeProduct(selectedDerivativeType)
  if (!product) return null

  const illustrations = getStoryIllustrations(selectedStory)
  const isMultiSelect = product.maxIllustrations > 1 || product.maxIllustrations === -1
  const maxSelect = product.maxIllustrations === -1 ? illustrations.length : product.maxIllustrations
  const isColoringBook = selectedDerivativeType === 'coloring-book'

  // Auto-select all for coloring book
  useEffect(() => {
    if (isColoringBook) {
      setSelectedIllustrations(illustrations.map(i => i.url))
    }
  }, [isColoringBook]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleIllustration = (url: string) => {
    if (isColoringBook) return // Can't deselect for coloring book

    if (isMultiSelect) {
      if (selectedIllustrations.includes(url)) {
        setSelectedIllustrations(selectedIllustrations.filter(u => u !== url))
      } else if (selectedIllustrations.length < maxSelect) {
        setSelectedIllustrations([...selectedIllustrations, url])
      }
    } else {
      setSelectedIllustrations([url])
    }
  }

  const [isGeneratingColoring, setIsGeneratingColoring] = useState(false)
  const [coloringProgress, setColoringProgress] = useState('')

  const handleAddToCart = async () => {
    if (selectedIllustrations.length === 0) return

    const name = getDerivativeDisplayName(selectedDerivativeType, locale)

    // Coloring book: generate PDF via AI first
    if (isColoringBook) {
      setIsGeneratingColoring(true)
      setColoringProgress(t('coloring.converting'))

      try {
        const response = await fetch('/api/ai/coloring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrls: selectedIllustrations,
            storyTitle: selectedStory?.title,
          }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Échec génération coloriage')
        }

        const item: CartItem = {
          id: crypto.randomUUID(),
          type: selectedDerivativeType,
          productUid: product.gelatoProductUid,
          priceCents: product.sellingPriceCents,
          quantity: 1,
          label: name,
          imageUrls: [...selectedIllustrations],
          coloringBookPdfUrl: data.pdfUrl,
        }

        addToCart(item)
        setSelectedIllustrations([])
        setIsGeneratingColoring(false)
        setCurrentStep('cart')
      } catch (err) {
        console.error('Coloring book error:', err)
        setColoringProgress(err instanceof Error ? err.message : 'Erreur')
        setIsGeneratingColoring(false)
      }
      return
    }

    // Other derivatives: add directly
    const item: CartItem = {
      id: crypto.randomUUID(),
      type: selectedDerivativeType,
      productUid: product.gelatoProductUid,
      priceCents: product.sellingPriceCents,
      quantity: 1,
      label: name,
      imageUrls: [...selectedIllustrations],
    }

    addToCart(item)
    setSelectedIllustrations([])
    setCurrentStep('cart')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          {t('illustrations.title')}
        </h2>
        <p className="text-midnight-300">
          {isColoringBook
            ? t('illustrations.coloringDesc')
            : isMultiSelect
              ? t('illustrations.multiSelectDesc', { max: maxSelect })
              : t('illustrations.singleSelectDesc')
          }
        </p>
      </div>

      {illustrations.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ImageIcon className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
          <h3 className="text-xl text-white mb-2">{t('illustrations.empty')}</h3>
          <p className="text-midnight-400">{t('illustrations.emptyDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {illustrations.map((illus, idx) => {
            const isSelected = selectedIllustrations.includes(illus.url)
            return (
              <motion.button
                key={illus.url}
                onClick={() => toggleIllustration(illus.url)}
                className={cn(
                  'relative aspect-square rounded-xl overflow-hidden group transition-all',
                  isSelected ? 'ring-2 ring-aurora-500 scale-[0.97]' : 'hover:ring-1 hover:ring-midnight-500',
                  isColoringBook && 'pointer-events-none'
                )}
                whileHover={!isColoringBook ? { scale: 1.02 } : {}}
                whileTap={!isColoringBook ? { scale: 0.98 } : {}}
              >
                <img
                  src={getThumbnailUrl(illus.url, 200)}
                  alt={`Illustration ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  data-original={illus.url}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    if (!el.dataset.fallback) {
                      el.dataset.fallback = '1'
                      el.src = el.dataset.original || ''
                    }
                  }}
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-aurora-500/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-aurora-500 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                  p.{illus.pageIndex + 1}
                </span>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Coloring book generation progress */}
      {isGeneratingColoring && (
        <div className="mt-6 glass-card p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-aurora-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">{t('coloring.generatingTitle')}</p>
          <p className="text-sm text-midnight-400">{coloringProgress}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedIllustrations([])
            setCurrentStep('select-derivative')
          }}
          disabled={isGeneratingColoring}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-midnight-600 text-midnight-300 hover:text-white hover:border-midnight-400 transition-all disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('nav.back')}
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-midnight-400">
            {selectedIllustrations.length}/{maxSelect} {t('illustrations.selected')}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={selectedIllustrations.length === 0 || isGeneratingColoring}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold hover:from-pink-400 hover:to-rose-500 transition-all shadow-lg shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingColoring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('coloring.generating')}
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                {t('order.addToCart')} ({(product.sellingPriceCents / 100).toFixed(2)}€)
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE : Panier
// ============================================================================

function CartStep() {
  const t = useTranslations('publish')
  const locale = useLocale()
  const {
    cart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    setCurrentStep,
    shippingAddress,
    updateShippingAddress,
    cartShippingCost,
    isCalculatingShipping,
  } = usePublishStore()

  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Sub-total (somme des prix × quantité)
  const subtotalCents = cart.reduce((sum, item) => sum + item.priceCents * (item.quantity || 1), 0)

  // Le panier contient-il un livre ? Si oui, livraison gratuite
  const hasBook = cart.some(item => item.type === 'book')

  // Coût livraison en cents (0 si un livre est dans le panier)
  const shippingCents = hasBook ? 0 : (cartShippingCost ? Math.round(cartShippingCost * 100) : null)

  // Total
  const totalCents = subtotalCents + (shippingCents || 0)

  const isAddressComplete = shippingAddress.firstName && shippingAddress.lastName &&
    shippingAddress.addressLine1 && shippingAddress.city &&
    shippingAddress.postCode && shippingAddress.email

  // Calculate shipping when country changes and cart has no book
  useEffect(() => {
    if (hasBook || !shippingAddress.country || cart.length === 0) return

    const store = usePublishStore.getState()
    store.setIsCalculatingShipping(true)

    fetch('/api/gelato/shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        shippingAddress: { country: shippingAddress.country },
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          store.setCartShippingCost(data.shippingCost)
        }
      })
      .catch(() => {})
      .finally(() => store.setIsCalculatingShipping(false))
  }, [hasBook, shippingAddress.country, cart.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckout = async () => {
    if (!isAddressComplete || cart.length === 0) return

    setIsRedirectingToStripe(true)
    setCheckoutError(null)

    try {
      const response = await fetch('/api/stripe/checkout/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart,
          shippingAddress,
          shippingCostCents: shippingCents || 0,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Erreur création session paiement')
      }
    } catch (error) {
      console.error('Erreur Stripe checkout:', error)
      setIsRedirectingToStripe(false)
      setCheckoutError(error instanceof Error ? error.message : 'Erreur de paiement')
    }
  }

  if (cart.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="glass-card p-12">
          <ShoppingCart className="w-16 h-16 text-midnight-500 mx-auto mb-4" />
          <h2 className="text-2xl font-display text-white mb-2">{t('cart.empty')}</h2>
          <p className="text-midnight-400 mb-6">{t('cart.emptyDesc')}</p>
          <button
            onClick={() => setCurrentStep('shop-home')}
            className="btn-primary"
          >
            {t('order.continueShopping')}
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">
          {t('cart.title')}
        </h2>
        <p className="text-midnight-300">{t('cart.description')}</p>
      </div>

      {/* Articles */}
      <div className="space-y-3 mb-6">
        {cart.map((item) => (
          <div key={item.id} className="glass-card p-4 flex items-center gap-4">
            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-lg bg-midnight-800 flex-shrink-0 overflow-hidden">
              {item.imageUrls[0] ? (
                <img src={getThumbnailUrl(item.imageUrls[0], 100)} alt="" className="w-full h-full object-cover" />
              ) : item.type === 'book' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Book className="w-6 h-6 text-aurora-400" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-pink-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium truncate">{item.label}</h4>
              <p className="text-xs text-midnight-400">
                {item.type === 'book'
                  ? t('cart.bookItem')
                  : getDerivativeDisplayName(item.type as DerivativeProductType, locale)
                }
              </p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => updateCartItemQuantity(item.id, (item.quantity || 1) - 1)}
                className="w-7 h-7 rounded-full bg-midnight-800 hover:bg-midnight-700 text-midnight-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-white text-sm font-medium">{item.quantity || 1}</span>
              <button
                onClick={() => updateCartItemQuantity(item.id, (item.quantity || 1) + 1)}
                className="w-7 h-7 rounded-full bg-midnight-800 hover:bg-midnight-700 text-midnight-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Price + Remove */}
            <div className="text-right flex-shrink-0 flex items-center gap-3">
              <span className="text-aurora-400 font-semibold">{((item.priceCents * (item.quantity || 1)) / 100).toFixed(2)}€</span>
              <button
                onClick={() => removeFromCart(item.id)}
                className="p-1.5 rounded-full hover:bg-red-500/20 text-midnight-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sous-total + livraison */}
      <div className="glass-card p-5 mb-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-midnight-400">{t('cart.subtotal')}</span>
            <span className="text-white">{(subtotalCents / 100).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-midnight-400">{t('cart.shipping')}</span>
            <span className="text-white">
              {hasBook
                ? t('cart.shippingFree')
                : isCalculatingShipping
                  ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {t('cart.shippingCalculating')}</span>
                  : shippingCents !== null
                    ? `${(shippingCents / 100).toFixed(2)}€`
                    : t('cart.shippingCalculated')
              }
            </span>
          </div>
          <div className="border-t border-midnight-700 pt-2 mt-2 flex justify-between text-lg">
            <span className="text-white font-medium">{t('cart.total')}</span>
            <span className="text-aurora-400 font-bold">{(totalCents / 100).toFixed(2)}€</span>
          </div>
        </div>
      </div>

      {/* Adresse de livraison */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-lg font-medium text-white mb-4">{t('order.shippingAddress')}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-midnight-400 mb-1">{t('order.firstName')}</label>
              <input
                type="text"
                value={shippingAddress.firstName}
                onChange={(e) => updateShippingAddress({ firstName: e.target.value })}
                className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
              />
            </div>
            <div>
              <label className="block text-xs text-midnight-400 mb-1">{t('order.lastName')}</label>
              <input
                type="text"
                value={shippingAddress.lastName}
                onChange={(e) => updateShippingAddress({ lastName: e.target.value })}
                className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-midnight-400 mb-1">{t('order.address')}</label>
            <input
              type="text"
              value={shippingAddress.addressLine1}
              onChange={(e) => updateShippingAddress({ addressLine1: e.target.value })}
              placeholder={t('order.addressPlaceholder')}
              className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
            />
          </div>

          <div>
            <label className="block text-xs text-midnight-400 mb-1">{t('order.addressComplement')}</label>
            <input
              type="text"
              value={shippingAddress.addressLine2 || ''}
              onChange={(e) => updateShippingAddress({ addressLine2: e.target.value })}
              placeholder={t('order.complementPlaceholder')}
              className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-midnight-400 mb-1">{t('order.postCode')}</label>
              <input
                type="text"
                value={shippingAddress.postCode}
                onChange={(e) => updateShippingAddress({ postCode: e.target.value })}
                className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
              />
            </div>
            <div>
              <label className="block text-xs text-midnight-400 mb-1">{t('order.city')}</label>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) => updateShippingAddress({ city: e.target.value })}
                className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-midnight-400 mb-1">{t('order.country')}</label>
            <select
              value={shippingAddress.country}
              onChange={(e) => updateShippingAddress({ country: e.target.value })}
              className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
            >
              <option value="FR">France</option>
              <option value="BE">Belgique</option>
              <option value="CH">Suisse</option>
              <option value="CA">Canada</option>
              <option value="DE">Allemagne</option>
              <option value="ES">Espagne</option>
              <option value="IT">Italie</option>
              <option value="GB">Royaume-Uni</option>
              <option value="US">États-Unis</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-midnight-400 mb-1">{t('order.email')}</label>
              <input
                type="email"
                value={shippingAddress.email}
                onChange={(e) => updateShippingAddress({ email: e.target.value })}
                className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
              />
            </div>
            <div>
              <label className="block text-xs text-midnight-400 mb-1">{t('order.phone')}</label>
              <input
                type="tel"
                value={shippingAddress.phone || ''}
                onChange={(e) => updateShippingAddress({ phone: e.target.value })}
                className="w-full px-3 py-2 bg-midnight-800/50 border border-midnight-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-aurora-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Erreur */}
      {checkoutError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
          <p className="text-red-400 text-sm">{checkoutError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep('shop-home')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-midnight-600 text-midnight-300 hover:text-white hover:border-midnight-400 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('order.continueShopping')}
        </button>

        <button
          onClick={handleCheckout}
          disabled={!isAddressComplete || isRedirectingToStripe || cart.length === 0}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-dream-500 to-dream-700 text-white font-semibold hover:from-dream-400 hover:to-dream-600 transition-all shadow-lg shadow-dream-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRedirectingToStripe ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('order.redirectingToStripe')}
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              {t('cart.pay')} ({(totalCents / 100).toFixed(2)}€)
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-midnight-500 text-center mt-4">
        {t('order.securePayment')}
      </p>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE : Confirmation après paiement Stripe
// ============================================================================

function CheckoutSuccessStep() {
  const t = useTranslations('publish')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto text-center"
    >
      <div className="glass-card p-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <CheckCircle2 className="w-24 h-24 text-green-400 mx-auto mb-6" />
        </motion.div>

        <h2 className="text-3xl font-display text-white mb-4">
          {t('checkoutSuccess.title')}
        </h2>

        <p className="text-midnight-300 mb-8 leading-relaxed">
          {t('checkoutSuccess.description')}
        </p>

        <div className="bg-midnight-800/50 rounded-xl p-5 mb-8 text-left space-y-3">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-aurora-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-midnight-300">{t('checkoutSuccess.productionInfo')}</p>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-aurora-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-midnight-300">{t('checkoutSuccess.emailInfo')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              usePublishStore.getState().reset()
              usePublishStore.getState().setCurrentStep('shop-home')
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-midnight-600 text-midnight-300 hover:text-white hover:border-midnight-400 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            {t('checkoutSuccess.continueShopping')}
          </button>
          <button
            onClick={() => {
              usePublishStore.getState().reset()
              useAppStore.getState().setCurrentMode('book')
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-aurora-500 to-aurora-700 text-white font-semibold hover:from-aurora-400 hover:to-aurora-600 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            {t('checkoutSuccess.backToStories')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// ÉTAPE : Boutique de crédits IA
// ============================================================================

function CreditsShopStep() {
  const t = useTranslations('publish')
  const locale = useLocale()
  const { setCurrentStep } = usePublishStore()
  const { profile } = useAuthStore()
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null)

  const pack = CREDIT_PACKS[0]
  const creditBalance = (profile as any)?.credit_balance ?? 0
  const narrationBalance = (profile as any)?.narration_credit_balance ?? 0

  const handleBuyPack = async () => {
    setIsRedirecting('studio')
    try {
      const response = await fetch('/api/stripe/checkout/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: pack.id }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Erreur')
      }
    } catch (error) {
      console.error('Erreur Stripe checkout credits:', error)
      setIsRedirecting(null)
    }
  }

  const handleBuyNarration = async (packId: string) => {
    setIsRedirecting(packId)
    try {
      const response = await fetch('/api/stripe/checkout/narration-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Erreur')
      }
    } catch (error) {
      console.error('Erreur Stripe checkout narration:', error)
      setIsRedirecting(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center mb-6">
        <h2 className="text-3xl font-display text-white mb-2">
          {t('creditsShop.title')}
        </h2>
        <p className="text-midnight-300">
          {t('creditsShop.description')}
        </p>
      </div>

      {/* Studio Credits */}
      <motion.div
        className="glass-card p-8 text-center relative ring-2 ring-violet-500 bg-violet-500/5"
        whileHover={{ scale: 1.02, y: -4 }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">{t('shop.creditsSection.studioTitle')}</h3>
        </div>

        <h3 className="text-3xl font-bold text-white mb-1">
          {pack.credits} {t('creditsShop.credits', { count: pack.credits })}
        </h3>
        <p className="text-sm text-midnight-400 mb-2">
          {t('creditsShop.perCredit', { price: `${(pack.price / 100 / pack.credits).toFixed(2)}€` })}
        </p>
        {profile && (
          <p className="text-xs text-midnight-400 mb-4">
            {t('shop.creditsSection.yourBalance')} : <span className="text-violet-400 font-medium">{creditBalance}</span>
          </p>
        )}

        <div className="text-4xl font-bold text-aurora-400 mb-6">
          {(pack.price / 100).toFixed(2)}€
        </div>

        <button
          onClick={handleBuyPack}
          disabled={isRedirecting === 'studio'}
          className={cn(
            'w-full py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
            'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-400 hover:to-purple-500 text-lg',
            isRedirecting === 'studio' && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isRedirecting === 'studio' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('order.redirectingToStripe')}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {t('creditsShop.buyPack')}
            </>
          )}
        </button>
      </motion.div>

      {/* Narration Credits */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-aurora-500/20 flex items-center justify-center">
            <Mic className="w-6 h-6 text-aurora-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">{t('shop.creditsSection.narrationTitle')}</h3>
        </div>
        <p className="text-sm text-midnight-400 text-center mb-2">
          {t('shop.creditsSection.narrationDesc')}
        </p>
        {profile && (
          <p className="text-xs text-midnight-400 text-center mb-4">
            {t('shop.creditsSection.yourBalance')} : <span className="text-aurora-400 font-medium">{narrationBalance.toLocaleString()} {t('shop.creditsSection.chars')}</span>
          </p>
        )}
        <div className="space-y-3">
          {NARRATION_CREDIT_PACKS.map((nPack) => (
            <motion.button
              key={nPack.id}
              onClick={() => handleBuyNarration(nPack.id)}
              disabled={isRedirecting === nPack.id}
              className={cn(
                'w-full py-3 px-5 rounded-xl transition-all flex items-center justify-between',
                'bg-white/5 border border-white/10 hover:border-aurora-500/40 hover:bg-aurora-500/5',
                isRedirecting === nPack.id && 'opacity-50 cursor-not-allowed'
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-sm text-white font-medium">
                {locale === 'en' ? nPack.labelEn : nPack.label}
              </span>
              <span className="text-sm font-bold text-aurora-400 flex items-center gap-1.5">
                {isRedirecting === nPack.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  `${(nPack.price / 100).toFixed(2)}€`
                )}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setCurrentStep('shop-home')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-midnight-600 text-midnight-300 hover:text-white hover:border-midnight-400 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('nav.back')}
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function PublishMode() {
  const t = useTranslations('publish')
  const { currentStep, setCurrentStep, reset, cart } = usePublishStore()

  // Modale d'introduction (première visite)
  const { isFirstVisit, markAsSeen } = useFirstVisit('publish')

  // Reset au montage
  useEffect(() => {
    return () => {
      // Ne pas reset si on navigue juste entre les étapes
    }
  }, [])

  const handleBack = () => {
    if (currentStep === 'shop-home') {
      reset()
      useAppStore.getState().setCurrentMode('book')
    } else if (currentStep === 'select-story') {
      setCurrentStep('shop-home')
    } else if (currentStep === 'select-derivative') {
      setCurrentStep('select-story')
    } else if (currentStep === 'choose-illustration') {
      setCurrentStep('select-story')
    } else if (currentStep === 'cart') {
      setCurrentStep('shop-home')
    } else if (currentStep === 'checkout-success') {
      reset()
      setCurrentStep('shop-home')
    } else {
      reset()
      useAppStore.getState().setCurrentMode('book')
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-midnight-800/50 text-midnight-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-display text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-aurora-400" />
              {t('mainTitle')}
            </h1>
          </div>

          {/* Cart badge */}
          {cart.length > 0 && currentStep !== 'cart' && (
            <motion.button
              onClick={() => setCurrentStep('cart')}
              className="relative p-2.5 rounded-full bg-midnight-800/80 hover:bg-midnight-700/80 text-white transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-aurora-500 text-white text-xs flex items-center justify-center font-bold">
                {cart.length}
              </span>
            </motion.button>
          )}
        </div>

        <StepIndicator currentStep={currentStep} />
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 'shop-home' && <ShopHome key="home" />}
          {currentStep === 'select-story' && <SelectStoryStep key="select" />}
          {currentStep === 'choose-format' && <ChooseFormatStep key="format" />}
          {currentStep === 'quality-check' && <QualityCheckStep key="quality" />}
          {currentStep === 'order' && <OrderStep key="order" />}
          {currentStep === 'select-derivative' && <SelectDerivativeStep key="derivative" />}
          {currentStep === 'choose-illustration' && <ChooseIllustrationStep key="illustration" />}
          {currentStep === 'cart' && <CartStep key="cart" />}
          {currentStep === 'checkout-success' && <CheckoutSuccessStep key="success" />}
          {currentStep === 'credits' && <CreditsShopStep key="credits" />}
        </AnimatePresence>
      </div>

      {/* Modale d'introduction - première visite */}
      <ModeIntroModal
        mode="publish"
        isOpen={isFirstVisit}
        onClose={markAsSeen}
      />
    </div>
  )
}
