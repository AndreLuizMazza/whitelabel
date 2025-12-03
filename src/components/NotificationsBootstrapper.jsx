// src/components/NotificationsBootstrapper.jsx
import { useEffect, useRef } from 'react'
import useAuth from '@/store/auth'
import useNotificationsStore from '@/store/notifications'
import api from '@/lib/api'
import { showToast } from '@/lib/toast'

function getUserCpf(user) {
  if (!user) {
    try {
      const stored = JSON.parse(localStorage.getItem('auth_user') || '{}')
      return stored.cpf || ''
    } catch {
      return ''
    }
  }
  return user.cpf || user.documento || ''
}

function calcularUnread(normalizedList, storageKey) {
  const hasAlerts = normalizedList.length > 0
  if (!hasAlerts) return 0

  let lastSeenId = null
  try {
    lastSeenId = window.localStorage.getItem(storageKey) || null
  } catch {
    lastSeenId = null
  }

  if (!lastSeenId) return normalizedList.length

  const idx = normalizedList.findIndex((n) => n._id === lastSeenId)
  if (idx === -1) return normalizedList.length

  return idx
}

export default function NotificationsBootstrapper() {
  const user = useAuth((s) => s.user)

  const {
    setLoading,
    setNotifications,
    setUnread,
  } = useNotificationsStore()

  const lastEventIdRef = useRef(null)

  useEffect(() => {
    const cpf = getUserCpf(user)
    if (!cpf) return

    let cancelado = false
    let intervalId = null

    async function fetchNotifications() {
      try {
        setLoading(true)

        const { data } = await api.get('/api/webhooks/progem/history', {
          params: { cpf, limit: 10 },
          __skipAuthRedirect: true,
        })

        if (cancelado) return

        let list = []

        if (Array.isArray(data)) {
          list = data
        } else if (data && typeof data === 'object') {
          if (Array.isArray(data.items)) {
            list = data.items
          } else if (Array.isArray(data.eventos)) {
            list = data.eventos
          } else if (data.eventId || data.id || data.eventType || data.evento) {
            list = [data]
          }
        }

        if (!list.length) {
          setNotifications([])
          setUnread(0)
          return
        }

        const normalizedList = list.map((ev, idx) => {
          const id =
            ev.eventId ||
            ev.id ||
            `${ev.eventType || ev.tipo || 'evt'}-${
              ev.parcelaId || ev.numeroContrato || idx
            }`
          return { ...ev, _id: id }
        })

        const newest = normalizedList[0]
        const eventId = newest?._id

        setNotifications(normalizedList)

        // calcula unread global (mesma lógica do NotificationsCenter)
        const storageKey = `progem.notifications.lastSeen.${cpf}`
        const unreadCount = calcularUnread(normalizedList, storageKey)
        setUnread(unreadCount)

        // TOAST de pagamento registrado (em qualquer tela)
        if (eventId && eventId !== lastEventIdRef.current) {
          lastEventIdRef.current = eventId

          const status = String(newest.status || '').toUpperCase()
          if (status === 'PAGA' || status === 'PAID') {
            showToast(
              `Pagamento da parcela do contrato #${
                newest.numeroContrato || ''
              } foi registrado com sucesso.`,
              'success'
            )
          }
        }
      } catch (e) {
        console.error('Falha ao carregar notificações de pagamento (global)', e)
        if (!cancelado) {
          setNotifications([])
          setUnread(0)
        }
      } finally {
        if (!cancelado) setLoading(false)
      }
    }

    fetchNotifications()
    intervalId = setInterval(fetchNotifications, 15000)

    return () => {
      cancelado = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [user, setLoading, setNotifications, setUnread])

  return null
}
