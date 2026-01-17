'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  X,
  Loader2,
  Mail,
  Crown,
  Baby,
  UserCircle,
  Trash2,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAdminStore, FamilyMember } from '@/store/useAdminStore';

export default function ParentAdminPanel({ onClose }: { onClose: () => void }) {
  // État local
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'child' as const, avatar_emoji: '👤' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const EMOJI_OPTIONS = ['👧', '👦', '👶', '🧒', '👩', '👨', '🧑', '👴', '👵', '🐱', '🐶', '🦄', '🌟', '🎀', '🎮'];
  
  const { userFamilyInfo } = useAdminStore();
  const familyId = userFamilyInfo?.family_id;
  
  // Charger les membres
  const loadMembers = useCallback(async () => {
    if (!familyId) return;
    
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/families/${familyId}/members`);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: 'Erreur de chargement' });
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);
  
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);
  
  // Ajouter un membre
  const handleAddMember = async () => {
    if (!familyId || !newMember.name || !newMember.email) return;
    
    try {
      setIsSaving(true);
      const res = await fetch(`/api/admin/families/${familyId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur');
      }
      
      const data = await res.json();
      setMembers(prev => [...prev, data.member]);
      setShowAddMember(false);
      setNewMember({ name: '', email: '', role: 'child', avatar_emoji: '👤' });
      setMessage({ type: 'success', text: `✨ ${newMember.name} a été ajouté ! Une invitation a été envoyée.` });
    } catch (err: unknown) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur d\'ajout' });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Supprimer un membre
  const handleRemoveMember = async (member: FamilyMember) => {
    if (!familyId) return;
    if (!confirm(`Retirer ${member.name} de la famille ?`)) return;
    
    try {
      const res = await fetch(`/api/admin/families/${familyId}/members/${member.id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur');
      }
      
      setMembers(prev => prev.filter(m => m.id !== member.id));
      setMessage({ type: 'success', text: `${member.name} a été retiré` });
    } catch (err: unknown) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur' });
    }
  };
  
  // Renvoyer invitation
  const handleResendInvite = async (member: FamilyMember) => {
    if (!familyId) return;
    
    try {
      const res = await fetch(`/api/admin/families/${familyId}/members/${member.id}`, {
        method: 'POST',
      });
      
      if (!res.ok) throw new Error('Erreur');
      
      setMessage({ type: 'success', text: `📧 Invitation renvoyée à ${member.email}` });
    } catch (err) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: 'Erreur d\'envoi' });
    }
  };
  
  // Effacer le message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-pink-900/70 rounded-3xl w-full max-w-lg overflow-hidden border border-white/20 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500/30 to-purple-500/30 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ma Famille</h2>
              <p className="text-sm text-pink-200">{userFamilyInfo?.family_name || 'Famille'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Message toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-green-500/20 text-green-200 border border-green-400/30'
                  : 'bg-red-500/20 text-red-200 border border-red-400/30'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Contenu */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Bouton ajouter */}
          <button
            onClick={() => setShowAddMember(true)}
            className="w-full py-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 rounded-2xl border-2 border-dashed border-pink-400/40 hover:border-pink-400/60 transition-all flex items-center justify-center gap-3 group"
          >
            <div className="w-10 h-10 bg-pink-500/30 group-hover:bg-pink-500/50 rounded-xl flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5 text-pink-300" />
            </div>
            <span className="font-medium text-pink-200">Ajouter quelqu&apos;un</span>
          </button>
          
          {/* Liste des membres */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-purple-300/60">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Ajoutez des membres à votre famille</p>
              </div>
            ) : (
              members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{member.avatar_emoji}</span>
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {member.name}
                        {member.role === 'parent' && (
                          <Crown className="w-4 h-4 text-yellow-400" title="Parent" />
                        )}
                        {member.role === 'child' && (
                          <Baby className="w-4 h-4 text-pink-400" title="Enfant" />
                        )}
                        {member.role === 'guest' && (
                          <UserCircle className="w-4 h-4 text-gray-400" title="Invité" />
                        )}
                      </div>
                      <div className="text-xs text-purple-300/60">{member.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {member.invitation_status === 'pending' && (
                      <>
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-lg">
                          En attente
                        </span>
                        <button
                          onClick={() => handleResendInvite(member)}
                          className="p-2 hover:bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                          title="Renvoyer l'invitation"
                        >
                          <Mail className="w-4 h-4 text-blue-400" />
                        </button>
                      </>
                    )}
                    {member.invitation_status === 'accepted' && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-lg flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Actif
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="p-2 hover:bg-red-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      title="Retirer"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          
          {/* Bouton actualiser */}
          {!isLoading && members.length > 0 && (
            <button
              onClick={loadMembers}
              className="w-full py-2 text-purple-300/60 hover:text-purple-300 flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Actualiser</span>
            </button>
          )}
        </div>
        
        {/* Modal ajout membre */}
        <AnimatePresence>
          {showAddMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowAddMember(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-indigo-800 to-purple-900 rounded-2xl p-6 w-full max-w-md border border-white/20"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-pink-400" />
                  Ajouter un membre
                </h3>
                
                <div className="space-y-4">
                  {/* Avatar */}
                  <div>
                    <label className="block text-sm text-purple-200 mb-2">Choisir un avatar</label>
                    <div className="flex flex-wrap gap-2">
                      {EMOJI_OPTIONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => setNewMember(p => ({ ...p, avatar_emoji: emoji }))}
                          className={`w-10 h-10 text-2xl rounded-xl transition-all ${
                            newMember.avatar_emoji === emoji
                              ? 'bg-pink-500/40 scale-110 ring-2 ring-pink-400'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Prénom */}
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
                      placeholder="Emma"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300/50 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
                    />
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label className="block text-sm text-purple-200 mb-1">Email</label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))}
                      placeholder="emma@email.com"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300/50 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
                    />
                  </div>
                  
                  {/* Rôle */}
                  <div>
                    <label className="block text-sm text-purple-200 mb-2">C&apos;est...</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'child', label: 'Un enfant', icon: Baby, color: 'pink' },
                        { value: 'parent', label: 'Un parent', icon: Crown, color: 'yellow' },
                        { value: 'guest', label: 'Un invité', icon: UserCircle, color: 'gray' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setNewMember(p => ({ ...p, role: opt.value as 'child' | 'parent' | 'guest' }))}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            newMember.role === opt.value
                              ? `bg-${opt.color}-500/20 border-${opt.color}-400`
                              : 'bg-white/5 border-white/10 hover:border-white/30'
                          }`}
                        >
                          <opt.icon className={`w-5 h-5 ${
                            newMember.role === opt.value ? `text-${opt.color}-400` : 'text-white/60'
                          }`} />
                          <span className="text-xs text-white/80">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Boutons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowAddMember(false)}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddMember}
                      disabled={isSaving || !newMember.name || !newMember.email}
                      className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Inviter
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
