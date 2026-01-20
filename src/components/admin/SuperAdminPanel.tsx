'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Key,
  Settings,
  Plus,
  Check,
  X,
  Loader2,
  RefreshCw,
  Mail,
  Eye,
  EyeOff,
  Crown,
  Baby,
  UserCircle,
  Trash2,
  Edit3,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAdminStore, Family, FamilyMember, FamilyConfig } from '@/store/useAdminStore';

interface ApiKeyStatus {
  elevenlabs: 'unchecked' | 'checking' | 'valid' | 'invalid';
  midjourney: 'unchecked' | 'checking' | 'valid' | 'invalid';
  runway: 'unchecked' | 'checking' | 'valid' | 'invalid';
  gemini: 'unchecked' | 'checking' | 'valid' | 'invalid';
}

export default function SuperAdminPanel({ onClose }: { onClose: () => void }) {
  // État local
  const [activeTab, setActiveTab] = useState<'families' | 'selected'>('families');
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newFamily, setNewFamily] = useState({ name: '', owner_email: '' });
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'child' as const });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus>({
    elevenlabs: 'unchecked',
    midjourney: 'unchecked',
    runway: 'unchecked',
    gemini: 'unchecked',
  });
  const [editingConfig, setEditingConfig] = useState<Partial<FamilyConfig>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Store
  const {
    families,
    selectedFamilyId,
    selectedFamilyConfig,
    selectedFamilyMembers,
    isLoading,
    setFamilies,
    selectFamily,
    setSelectedFamilyConfig,
    setSelectedFamilyMembers,
    setLoading,
    addFamily,
    addMember,
    removeMember,
  } = useAdminStore();
  
  // Charger les familles
  const loadFamilies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/families');
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setFamilies(data.families || []);
    } catch (err) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: 'Erreur de chargement des familles' });
    } finally {
      setLoading(false);
    }
  }, [setFamilies, setLoading]);
  
  // Charger les détails d'une famille
  const loadFamilyDetails = useCallback(async (familyId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/families/${familyId}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setSelectedFamilyConfig(data.config);
      setSelectedFamilyMembers(data.members);
      setEditingConfig(data.config || {});
      setActiveTab('selected');
    } catch (err) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: 'Erreur de chargement' });
    } finally {
      setLoading(false);
    }
  }, [setLoading, setSelectedFamilyConfig, setSelectedFamilyMembers]);
  
  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);
  
  useEffect(() => {
    if (selectedFamilyId) {
      loadFamilyDetails(selectedFamilyId);
    }
  }, [selectedFamilyId, loadFamilyDetails]);
  
  // Créer une famille
  const handleCreateFamily = async () => {
    if (!newFamily.name || !newFamily.owner_email) return;
    
    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFamily),
      });
      
      if (!res.ok) throw new Error('Erreur création');
      
      const data = await res.json();
      addFamily(data.family);
      setShowCreateFamily(false);
      setNewFamily({ name: '', owner_email: '' });
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: 'Erreur de création' });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Ajouter un membre
  const handleAddMember = async () => {
    if (!selectedFamilyId || !newMember.name || !newMember.email) return;
    
    try {
      setIsSaving(true);
      const res = await fetch(`/api/admin/families/${selectedFamilyId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      
      if (!res.ok) throw new Error('Erreur ajout');
      
      const data = await res.json();
      addMember(data.member);
      setShowAddMember(false);
      setNewMember({ name: '', email: '', role: 'child' });
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: 'Erreur d\'ajout' });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Supprimer un membre
  const handleRemoveMember = async (memberId: string) => {
    if (!selectedFamilyId || !confirm('Supprimer ce membre ?')) return;
    
    try {
      const res = await fetch(`/api/admin/families/${selectedFamilyId}/members/${memberId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Erreur suppression');
      
      removeMember(memberId);
      setMessage({ type: 'success', text: 'Membre supprimé' });
    } catch (err) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: 'Erreur de suppression' });
    }
  };
  
  // Sauvegarder la config
  const handleSaveConfig = async () => {
    if (!selectedFamilyId) return;
    
    try {
      setIsSaving(true);
      const res = await fetch(`/api/admin/families/${selectedFamilyId}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingConfig),
      });
      
      if (!res.ok) throw new Error('Erreur sauvegarde');
      
      const data = await res.json();
      setSelectedFamilyConfig(data.config);
      setMessage({ type: 'success', text: 'Configuration sauvegardée ✓' });
    } catch (err) {
      console.error('Erreur:', err);
      setMessage({ type: 'error', text: 'Erreur de sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Valider une clé
  const validateKey = async (keyType: keyof ApiKeyStatus, keyValue: string) => {
    if (!keyValue || !selectedFamilyId) return;
    
    setKeyStatus(prev => ({ ...prev, [keyType]: 'checking' }));
    
    try {
      const res = await fetch(`/api/admin/families/${selectedFamilyId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_type: keyType, key_value: keyValue }),
      });
      
      const data = await res.json();
      setKeyStatus(prev => ({ ...prev, [keyType]: data.isValid ? 'valid' : 'invalid' }));
    } catch {
      setKeyStatus(prev => ({ ...prev, [keyType]: 'invalid' }));
    }
  };
  
  // Effacer le message après 3s
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  const selectedFamily = families.find(f => f.id === selectedFamilyId);
  
  // Render
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-purple-500/30 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Super Admin</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Message toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar - Liste des familles */}
          <div className="w-72 border-r border-white/10 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Familles
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={loadFamilies}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Actualiser"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowCreateFamily(true)}
                  className="p-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                  title="Nouvelle famille"
                >
                  <Plus className="w-4 h-4 text-purple-300" />
                </button>
              </div>
            </div>
            
            {/* Liste */}
            <div className="space-y-2">
              {families.map(family => (
                <button
                  key={family.id}
                  onClick={() => selectFamily(family.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedFamilyId === family.id
                      ? 'bg-purple-500/30 border border-purple-500/50'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{family.name}</span>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                      selectedFamilyId === family.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{family.code}</div>
                  <div className="flex gap-1 mt-2">
                    {(family as Family & { has_elevenlabs?: boolean }).has_elevenlabs && (
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 text-xs rounded">11L</span>
                    )}
                    {(family as Family & { has_gemini?: boolean }).has_gemini && (
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">AI</span>
                    )}
                    {(family as Family & { has_midjourney?: boolean }).has_midjourney && (
                      <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">MJ</span>
                    )}
                    {(family as Family & { has_runway?: boolean }).has_runway && (
                      <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded">RW</span>
                    )}
                  </div>
                </button>
              ))}
              
              {families.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune famille</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Contenu principal */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedFamily ? (
              <div className="space-y-6">
                {/* En-tête famille */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedFamily.name}</h3>
                    <p className="text-gray-400">Code: {selectedFamily.code}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    selectedFamily.is_active
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {selectedFamily.is_active ? 'Active' : 'Désactivée'}
                  </span>
                </div>
                
                {/* Onglets */}
                <div className="flex gap-2 border-b border-white/10 pb-2">
                  <button
                    onClick={() => setActiveTab('selected')}
                    className={`px-4 py-2 rounded-t-lg transition-colors ${
                      activeTab === 'selected'
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Key className="w-4 h-4 inline mr-2" />
                    Clés API
                  </button>
                </div>
                
                {/* Clés API */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Configuration des clés API
                  </h4>
                  
                  {/* ElevenLabs */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-300">ElevenLabs</label>
                      <div className="flex items-center gap-2">
                        {keyStatus.elevenlabs === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                        {keyStatus.elevenlabs === 'valid' && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {keyStatus.elevenlabs === 'invalid' && <AlertCircle className="w-4 h-4 text-red-400" />}
                        <button
                          onClick={() => setShowKeys(p => ({ ...p, elevenlabs: !p.elevenlabs }))}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          {showKeys.elevenlabs ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type={showKeys.elevenlabs ? 'text' : 'password'}
                        value={editingConfig.elevenlabs_key || ''}
                        onChange={e => setEditingConfig(p => ({ ...p, elevenlabs_key: e.target.value }))}
                        placeholder="sk-..."
                        className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      />
                      <button
                        onClick={() => validateKey('elevenlabs', editingConfig.elevenlabs_key || '')}
                        className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-300 text-sm"
                      >
                        Tester
                      </button>
                    </div>
                  </div>
                  
                  {/* Gemini */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-300">Gemini (IA)</label>
                      <div className="flex items-center gap-2">
                        {keyStatus.gemini === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                        {keyStatus.gemini === 'valid' && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {keyStatus.gemini === 'invalid' && <AlertCircle className="w-4 h-4 text-red-400" />}
                        <button
                          onClick={() => setShowKeys(p => ({ ...p, gemini: !p.gemini }))}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          {showKeys.gemini ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type={showKeys.gemini ? 'text' : 'password'}
                        value={editingConfig.gemini_key || ''}
                        onChange={e => setEditingConfig(p => ({ ...p, gemini_key: e.target.value }))}
                        placeholder="AIza..."
                        className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      />
                      <button
                        onClick={() => validateKey('gemini', editingConfig.gemini_key || '')}
                        className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-300 text-sm"
                      >
                        Tester
                      </button>
                    </div>
                  </div>
                  
                  {/* Midjourney */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-300">Images (legacy - non utilisé)</label>
                      <button
                        onClick={() => setShowKeys(p => ({ ...p, midjourney: !p.midjourney }))}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        {showKeys.midjourney ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                    <input
                      type={showKeys.midjourney ? 'text' : 'password'}
                      value={editingConfig.midjourney_key || ''}
                      onChange={e => setEditingConfig(p => ({ ...p, midjourney_key: e.target.value }))}
                      placeholder="Clé ImagineAPI..."
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  {/* Runway */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-300">Vidéos (legacy - non utilisé)</label>
                      <button
                        onClick={() => setShowKeys(p => ({ ...p, runway: !p.runway }))}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        {showKeys.runway ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                    <input
                      type={showKeys.runway ? 'text' : 'password'}
                      value={editingConfig.runway_key || ''}
                      onChange={e => setEditingConfig(p => ({ ...p, runway_key: e.target.value }))}
                      placeholder="key_..."
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  {/* Bouton sauvegarder */}
                  <button
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-lg font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    Sauvegarder la configuration
                  </button>
                </div>
                
                {/* Membres */}
                <div className="space-y-4 mt-8">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Membres de la famille
                    </h4>
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-300 text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>
                  
                  <div className="grid gap-2">
                    {selectedFamilyMembers.map(member => (
                      <div
                        key={member.id}
                        className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{member.avatar_emoji}</span>
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              {member.name}
                              {member.role === 'parent' && <Crown className="w-4 h-4 text-yellow-400" />}
                              {member.role === 'child' && <Baby className="w-4 h-4 text-pink-400" />}
                              {member.role === 'guest' && <UserCircle className="w-4 h-4 text-gray-400" />}
                            </div>
                            <div className="text-xs text-gray-400">{member.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            member.invitation_status === 'accepted'
                              ? 'bg-green-500/20 text-green-300'
                              : member.invitation_status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {member.invitation_status === 'accepted' ? 'Actif' : 
                             member.invitation_status === 'pending' ? 'En attente' : 'Expiré'}
                          </span>
                          {member.invitation_status === 'pending' && (
                            <button
                              onClick={() => {/* Renvoyer invitation */}}
                              className="p-1.5 hover:bg-white/10 rounded"
                              title="Renvoyer l'invitation"
                            >
                              <Mail className="w-4 h-4 text-blue-400" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 hover:bg-red-500/20 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {selectedFamilyMembers.length === 0 && (
                      <div className="text-center py-6 text-gray-400">
                        Aucun membre
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Settings className="w-16 h-16 mb-4 opacity-30" />
                <p>Sélectionnez une famille pour la configurer</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal création famille */}
        <AnimatePresence>
          {showCreateFamily && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
              onClick={() => setShowCreateFamily(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/20"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-white mb-4">Nouvelle famille</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nom de la famille</label>
                    <input
                      type="text"
                      value={newFamily.name}
                      onChange={e => setNewFamily(p => ({ ...p, name: e.target.value }))}
                      placeholder="Dupont"
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email du parent principal</label>
                    <input
                      type="email"
                      value={newFamily.owner_email}
                      onChange={e => setNewFamily(p => ({ ...p, owner_email: e.target.value }))}
                      placeholder="parent@email.com"
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowCreateFamily(false)}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCreateFamily}
                      disabled={isSaving || !newFamily.name || !newFamily.owner_email}
                      className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Créer
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Modal ajout membre */}
        <AnimatePresence>
          {showAddMember && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
              onClick={() => setShowAddMember(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-white/20"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-white mb-4">Ajouter un membre</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))}
                      placeholder="Emma"
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))}
                      placeholder="emma@email.com"
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Rôle</label>
                    <select
                      value={newMember.role}
                      onChange={e => setNewMember(p => ({ ...p, role: e.target.value as 'child' | 'parent' | 'guest' }))}
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="child">👶 Enfant</option>
                      <option value="parent">👑 Parent</option>
                      <option value="guest">👤 Invité</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowAddMember(false)}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddMember}
                      disabled={isSaving || !newMember.name || !newMember.email}
                      className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Ajouter & Inviter
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
