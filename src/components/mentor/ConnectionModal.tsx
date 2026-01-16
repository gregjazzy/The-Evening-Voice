'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMentorStore, type UserRole } from '@/store/useMentorStore'
import { 
  Users, 
  GraduationCap, 
  Sparkles, 
  Link2, 
  ArrowRight,
  Copy,
  Check
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { cn } from '@/lib/utils'

interface ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ConnectionModal({ isOpen, onClose }: ConnectionModalProps) {
  const { connect, isConnected } = useMentorStore()
  
  const [step, setStep] = useState<'role' | 'session'>('role')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [userName, setUserName] = useState('')
  const [copied, setCopied] = useState(false)

  const generateSessionId = () => {
    const id = uuidv4().slice(0, 8).toUpperCase()
    setSessionId(id)
  }

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConnect = () => {
    if (!selectedRole || !sessionId || !userName) return
    
    connect(sessionId, selectedRole, userName)
    onClose()
  }

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role)
    if (role === 'mentor') {
      generateSessionId()
    }
    setStep('session')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-midnight-950/90 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative glass rounded-3xl p-8 w-full max-w-lg mx-4"
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-aurora-500/30 to-dream-500/30 flex items-center justify-center"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(233, 121, 249, 0.3)',
                    '0 0 40px rgba(233, 121, 249, 0.5)',
                    '0 0 20px rgba(233, 121, 249, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Link2 className="w-8 h-8 text-aurora-400" />
              </motion.div>
              <h2 className="font-display text-2xl text-white">
                {step === 'role' ? 'Connexion Collaborative' : 'Rejoindre la Session'}
              </h2>
              <p className="text-midnight-300 mt-2">
                {step === 'role' 
                  ? 'Choisis ton rôle pour cette session' 
                  : selectedRole === 'mentor'
                    ? 'Partage ce code avec tes élèves'
                    : 'Entre le code donné par ton mentor'
                }
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'role' ? (
                <motion.div
                  key="role"
                  className="space-y-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Rôle Mentor */}
                  <motion.button
                    onClick={() => handleSelectRole('mentor')}
                    className="w-full p-6 rounded-2xl bg-gradient-to-br from-aurora-600/20 to-aurora-800/20 border border-aurora-500/30 text-left hover:border-aurora-500/50 transition-all group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-aurora-600/30 flex items-center justify-center group-hover:bg-aurora-600/50 transition-colors">
                        <GraduationCap className="w-6 h-6 text-aurora-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">Je suis le Mentor</h3>
                        <p className="text-sm text-midnight-300">
                          Créer une session et inviter les élèves
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-aurora-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>

                  {/* Rôle Enfant */}
                  <motion.button
                    onClick={() => handleSelectRole('child')}
                    className="w-full p-6 rounded-2xl bg-gradient-to-br from-dream-600/20 to-dream-800/20 border border-dream-500/30 text-left hover:border-dream-500/50 transition-all group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-dream-600/30 flex items-center justify-center group-hover:bg-dream-600/50 transition-colors">
                        <Users className="w-6 h-6 text-dream-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">Je suis l'élève</h3>
                        <p className="text-sm text-midnight-300">
                          Rejoindre la session de mon mentor
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-dream-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="session"
                  className="space-y-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Nom */}
                  <div>
                    <label className="block text-sm text-midnight-300 mb-2">
                      Ton prénom
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder={selectedRole === 'mentor' ? 'Ex: Maître Lucas' : 'Ex: Emma'}
                      className="w-full px-4 py-3 rounded-xl bg-midnight-900/50 border border-white/10 focus:border-aurora-500/50 focus:ring-2 focus:ring-aurora-500/20"
                    />
                  </div>

                  {/* Code de session */}
                  <div>
                    <label className="block text-sm text-midnight-300 mb-2">
                      Code de session
                    </label>
                    {selectedRole === 'mentor' ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-4 py-3 rounded-xl bg-midnight-800/50 border border-aurora-500/30 font-mono text-xl text-center text-aurora-300 tracking-widest">
                          {sessionId || '--------'}
                        </div>
                        <motion.button
                          onClick={copySessionId}
                          className={cn(
                            "p-3 rounded-xl transition-colors",
                            copied 
                              ? "bg-dream-600/30 text-dream-300" 
                              : "bg-midnight-800/50 text-white hover:bg-midnight-700/50"
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </motion.button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                        placeholder="XXXXXXXX"
                        maxLength={8}
                        className="w-full px-4 py-3 rounded-xl bg-midnight-900/50 border border-white/10 focus:border-dream-500/50 focus:ring-2 focus:ring-dream-500/20 font-mono text-xl text-center tracking-widest"
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <motion.button
                      onClick={() => setStep('role')}
                      className="px-6 py-3 rounded-xl bg-midnight-800/50 text-midnight-300 hover:text-white hover:bg-midnight-700/50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Retour
                    </motion.button>
                    
                    <motion.button
                      onClick={handleConnect}
                      disabled={!sessionId || !userName}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all",
                        !sessionId || !userName
                          ? "bg-midnight-800/50 text-midnight-500 cursor-not-allowed"
                          : selectedRole === 'mentor'
                            ? "bg-gradient-to-r from-aurora-600 to-aurora-700 text-white shadow-glow"
                            : "bg-gradient-to-r from-dream-600 to-dream-700 text-white"
                      )}
                      whileHover={sessionId && userName ? { scale: 1.02 } : {}}
                      whileTap={sessionId && userName ? { scale: 0.98 } : {}}
                    >
                      <Sparkles className="w-5 h-5" />
                      {selectedRole === 'mentor' ? 'Créer la session' : 'Rejoindre'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

