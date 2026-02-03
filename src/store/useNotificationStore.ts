/**
 * Store global pour les notifications
 * Permet d'afficher des toasts depuis n'importe où (hooks, stores, etc.)
 */

import { create } from 'zustand'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration: number
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  // Helpers
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = generateId()
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }))
    
    // Auto-remove après la durée
    setTimeout(() => {
      get().removeNotification(id)
    }, notification.duration)
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },
  
  success: (title, message) => {
    get().addNotification({ type: 'success', title, message, duration: 3000 })
  },
  
  error: (title, message) => {
    get().addNotification({ type: 'error', title, message, duration: 6000 })
  },
  
  warning: (title, message) => {
    get().addNotification({ type: 'warning', title, message, duration: 4000 })
  },
  
  info: (title, message) => {
    get().addNotification({ type: 'info', title, message, duration: 3000 })
  },
}))

// Export pour usage direct sans hook (dans des fonctions non-React)
export const notify = {
  success: (title: string, message?: string) => useNotificationStore.getState().success(title, message),
  error: (title: string, message?: string) => useNotificationStore.getState().error(title, message),
  warning: (title: string, message?: string) => useNotificationStore.getState().warning(title, message),
  info: (title: string, message?: string) => useNotificationStore.getState().info(title, message),
}
