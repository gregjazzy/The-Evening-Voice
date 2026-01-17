import { create } from 'zustand';

// Types
export interface Family {
  id: string;
  name: string;
  code: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface FamilyConfig {
  id: string;
  family_id: string;
  // Clés API
  elevenlabs_key: string | null;
  midjourney_key: string | null;
  runway_key: string | null;
  gemini_key: string | null;
  // Voix par défaut
  default_narration_voice_fr: string | null;
  default_narration_voice_en: string | null;
  default_narration_voice_ru: string | null;
  default_ai_voice: string | null;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: 'parent' | 'child' | 'guest';
  avatar_emoji: string;
  invitation_status: 'pending' | 'accepted' | 'expired';
  invitation_sent_at: string | null;
  invitation_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFamilyInfo {
  family_id: string;
  family_name: string;
  family_code: string;
  user_role: 'parent' | 'child' | 'guest';
  config: FamilyConfig | null;
}

interface AdminState {
  // État
  isSuperAdmin: boolean;
  userFamilyInfo: UserFamilyInfo | null;
  
  // Pour super admin
  families: Family[];
  selectedFamilyId: string | null;
  selectedFamilyConfig: FamilyConfig | null;
  selectedFamilyMembers: FamilyMember[];
  
  // Chargement
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setIsSuperAdmin: (value: boolean) => void;
  setUserFamilyInfo: (info: UserFamilyInfo | null) => void;
  setFamilies: (families: Family[]) => void;
  selectFamily: (familyId: string | null) => void;
  setSelectedFamilyConfig: (config: FamilyConfig | null) => void;
  setSelectedFamilyMembers: (members: FamilyMember[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions CRUD
  addFamily: (family: Family) => void;
  updateFamily: (familyId: string, updates: Partial<Family>) => void;
  removeFamily: (familyId: string) => void;
  
  addMember: (member: FamilyMember) => void;
  updateMember: (memberId: string, updates: Partial<FamilyMember>) => void;
  removeMember: (memberId: string) => void;
  
  updateConfig: (updates: Partial<FamilyConfig>) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  isSuperAdmin: false,
  userFamilyInfo: null,
  families: [],
  selectedFamilyId: null,
  selectedFamilyConfig: null,
  selectedFamilyMembers: [],
  isLoading: false,
  error: null,
};

export const useAdminStore = create<AdminState>((set, get) => ({
  ...initialState,
  
  setIsSuperAdmin: (value) => set({ isSuperAdmin: value }),
  
  setUserFamilyInfo: (info) => set({ userFamilyInfo: info }),
  
  setFamilies: (families) => set({ families }),
  
  selectFamily: (familyId) => set({ 
    selectedFamilyId: familyId,
    selectedFamilyConfig: null,
    selectedFamilyMembers: []
  }),
  
  setSelectedFamilyConfig: (config) => set({ selectedFamilyConfig: config }),
  
  setSelectedFamilyMembers: (members) => set({ selectedFamilyMembers: members }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  addFamily: (family) => set((state) => ({
    families: [...state.families, family]
  })),
  
  updateFamily: (familyId, updates) => set((state) => ({
    families: state.families.map(f => 
      f.id === familyId ? { ...f, ...updates } : f
    )
  })),
  
  removeFamily: (familyId) => set((state) => ({
    families: state.families.filter(f => f.id !== familyId),
    selectedFamilyId: state.selectedFamilyId === familyId ? null : state.selectedFamilyId
  })),
  
  addMember: (member) => set((state) => ({
    selectedFamilyMembers: [...state.selectedFamilyMembers, member]
  })),
  
  updateMember: (memberId, updates) => set((state) => ({
    selectedFamilyMembers: state.selectedFamilyMembers.map(m =>
      m.id === memberId ? { ...m, ...updates } : m
    )
  })),
  
  removeMember: (memberId) => set((state) => ({
    selectedFamilyMembers: state.selectedFamilyMembers.filter(m => m.id !== memberId)
  })),
  
  updateConfig: (updates) => set((state) => ({
    selectedFamilyConfig: state.selectedFamilyConfig 
      ? { ...state.selectedFamilyConfig, ...updates }
      : null
  })),
  
  reset: () => set(initialState),
}));

// Sélecteurs utilitaires
export const selectIsParent = (state: AdminState) => 
  state.userFamilyInfo?.user_role === 'parent';

export const selectCanManageFamily = (state: AdminState) =>
  state.isSuperAdmin || state.userFamilyInfo?.user_role === 'parent';

export const selectHasApiKeys = (state: AdminState) => {
  const config = state.isSuperAdmin 
    ? state.selectedFamilyConfig 
    : state.userFamilyInfo?.config;
  
  return {
    elevenlabs: !!config?.elevenlabs_key,
    midjourney: !!config?.midjourney_key,
    runway: !!config?.runway_key,
    gemini: !!config?.gemini_key,
  };
};
