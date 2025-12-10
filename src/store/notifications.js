// src/store/notifications.js
import { create } from 'zustand'

const useNotificationsStore = create((set, get) => ({
  items: [],
  unread: 0,
  loading: false,

  setLoading: (loading) => set({ loading }),

  setNotifications: (items = []) => {
    const normalized = items.map((n, idx) => ({
      ...n,
      _id:
        n._id ||
        n.id ||
        n.eventId ||
        `${n.eventType || n.tipo || 'evt'}-${
          n.parcelaId || n.numeroContrato || idx
        }`,
      _read: n._read ?? false,
    }))
    const unread = normalized.filter((n) => !n._read).length
    set({ items: normalized, unread })
  },

  setUnread: (unread) => {
    const value = Math.max(0, Number(unread) || 0)
    let items = get().items
    if (value === 0) {
      items = items.map((n) => ({ ...n, _read: true }))
    }
    set({ unread: value, items })
  },

  markAsRead: (id) => {
    const items = get().items.map((n) =>
      n._id === id ? { ...n, _read: true } : n
    )
    const unread = items.filter((n) => !n._read).length
    set({ items, unread })
  },

  markAllRead: () => {
    const items = get().items.map((n) => ({ ...n, _read: true }))
    set({ items, unread: 0 })
  },
}))

export default useNotificationsStore
