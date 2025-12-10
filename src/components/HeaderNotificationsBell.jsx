// src/components/HeaderNotificationsBell.jsx
import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import useNotificationsStore from '@/store/notifications'

import notificationSound from '@/assets/sounds/notifications.wav'


export default function HeaderNotificationsBell({ className = '' }) {
  const [open, setOpen] = useState(false)
  const { items, unread, markAllRead, markAsRead } = useNotificationsStore()
  const navigate = useNavigate()
  const location = useLocation()
  const wrapperRef = useRef(null)

  const showBadge = unread > 0
  const badgeText = unread > 9 ? '9+' : String(unread)
  const hasItems = items && items.length > 0

  // controla som de notificação
  const audioRef = useRef(null)
  const prevUnreadRef = useRef(0)

  useEffect(() => {
    audioRef.current = new Audio(notificationSound)
    audioRef.current.volume = 0.7
  }, [])

  // toca som sempre que o número de não lidas aumentar (novo webhook)
  useEffect(() => {
    const prev = prevUnreadRef.current
    if (unread > prev && unread > 0 && audioRef.current) {
      try {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {
          // navegador pode bloquear autoplay; ignorar erro silenciosamente
        })
      } catch {
        /* ignore */
      }
    }
    prevUnreadRef.current = unread
  }, [unread])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  function handleBellClick() {
    if (!hasItems) {
      if (location.pathname !== '/area') navigate('/area')
      return
    }
    setOpen((o) => !o)
  }

  function handleItemClick(n) {
    if (n?._id) markAsRead(n._id)
    setOpen(false)

    const goAreaAndScroll = () => {
      const el = document.getElementById('alertas-automaticos')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    if (location.pathname !== '/area') {
      navigate('/area')
      setTimeout(goAreaAndScroll, 350)
    } else {
      goAreaAndScroll()
    }
  }

  return (
    <div className={'relative ' + className} ref={wrapperRef}>
      <button
        type="button"
        onClick={handleBellClick}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border bg-[var(--surface)]"
        style={{ borderColor: 'var(--c-border)' }}
        aria-label={
          showBadge
            ? `Ver alertas automáticos do sistema. Você tem ${badgeText} novos.`
            : 'Ver alertas automáticos do sistema'
        }
        title="Alertas automáticos"
      >
        <Bell size={16} aria-hidden="true" />
        {showBadge && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-semibold"
            style={{
              // vermelho padrão da Área do Associado
              background: 'var(--c-badge, #f02849)',
              color: '#fff',
              border: '1px solid rgba(0,0,0,0.15)',
              boxShadow: '0 0 0 2px rgba(255,255,255,0.95)',
              transform: 'translateZ(0)',
              zIndex: 2,
            }}
            aria-hidden="true"
          >
            {badgeText}
          </span>
        )}
      </button>

      {open && hasItems && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-xs rounded-xl border shadow-xl z-[60] bg-[var(--surface)]"
          style={{ borderColor: 'var(--c-border)' }}
        >
          <div
            className="px-3 py-2 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--c-border)' }}
          >
            <span className="text-xs font-semibold">Alertas automáticos</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] underline-offset-2 hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Marcar tudo como lido
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-auto">
            {items.map((n) => {
              const title =
                n.titulo || n.title || n.eventType || n.tipo || 'Atualização do contrato'
              const contrato = n.numeroContrato || n.contratoId || n.contrato || '—'
              const when =
                n.dataEvento ||
                n.ocorridoEm ||
                n.createdAt ||
                n.dataVencimento ||
                n.dataReferencia
              const status = String(n.status || n.situacao || '').toUpperCase()
              const isPaid = status === 'PAGA' || status === 'PAID'
              const subtle = status === 'EM_ABERTO' || status === 'PENDENTE'

              const bgColor = isPaid
                ? 'color-mix(in srgb, var(--success, var(--primary)) 15%, transparent)'
                : subtle
                ? 'color-mix(in srgb, var(--warning, var(--primary)) 15%, transparent)'
                : 'color-mix(in srgb, var(--primary) 12%, transparent)'

              const fgColor = isPaid
                ? 'var(--success, var(--primary))'
                : subtle
                ? 'var(--warning, var(--primary))'
                : 'var(--primary)'

              return (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  className="w-full text-left px-3 py-2.5 text-xs border-t flex flex-col gap-0.5 hover:bg-[var(--nav-hover-bg)]"
                  style={{
                    borderColor: 'var(--c-border)',
                    opacity: n._read ? 0.6 : 1,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">Contrato #{contrato}</span>
                    {status && (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: bgColor,
                          color: fgColor,
                        }}
                      >
                        {status}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text)' }}>
                    {title}
                  </div>
                  {when && (
                    <div
                      className="text-[10px]"
                      style={{ color: 'var(--muted-text, #777)' }}
                    >
                      {fmtDatePT(when)}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              if (location.pathname !== '/area') navigate('/area')
            }}
            className="w-full text-center text-[11px] py-2 border-t hover:bg-[var(--nav-hover-bg)]"
            style={{ color: 'var(--primary)', borderColor: 'var(--c-border)' }}
          >
            Ver todos os detalhes na Área do Associado
          </button>
        </div>
      )}
    </div>
  )
}

function fmtDatePT(d) {
  if (!d) return '—'
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [Y, M, D] = d.split('-')
    return `${D}/${M}/${Y}`
  }
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return String(d)
  return dt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
