import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  Clock3,
  Mail,
  Scale,
  Send,
  Shield,
  X,
} from 'lucide-react'
import CTAButton from '@/components/ui/CTAButton'

function useLockBodyScroll(open) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
}

function getPortalRoot() {
  if (typeof document === 'undefined') return null
  let el = document.getElementById('modal-root')
  if (!el) {
    el = document.createElement('div')
    el.id = 'modal-root'
    document.body.appendChild(el)
  }
  return el
}

function StepRow({ step, icon: Icon, title, detail }) {
  return (
    <li className="flex gap-3.5">
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-[13px] font-semibold tabular-nums"
        style={{
          background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
          color: 'var(--primary)',
          border: '0.5px solid color-mix(in srgb, var(--primary) 22%, transparent)',
        }}
        aria-hidden="true"
      >
        {step}
      </span>
      <span className="flex-1 min-w-0 pt-0.5">
        <span className="flex items-center gap-2">
          <Icon size={15} strokeWidth={2.1} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <span className="text-[15px] font-semibold leading-snug" style={{ color: 'var(--text)' }}>
            {title}
          </span>
        </span>
        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {detail}
        </p>
      </span>
    </li>
  )
}

export default function AccountDeletionModal({
  open,
  onClose,
  onConfirm,
  tenantLabel = 'prestador de serviços',
  contactEmail = '',
  loading = false,
}) {
  useLockBodyScroll(open)

  const root = useMemo(getPortalRoot, [])
  const panelRef = useRef(null)
  const lastActiveRef = useRef(null)

  useEffect(() => {
    if (!open) return

    lastActiveRef.current = document.activeElement
    const t = setTimeout(() => {
      panelRef.current?.querySelector('[data-account-deletion-confirm]')?.focus?.()
    }, 0)

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
        return
      }

      if (e.key === 'Tab') {
        const panel = panelRef.current
        if (!panel) return

        const focusables = panel.querySelectorAll(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        )
        const list = Array.from(focusables).filter(
          (x) => !x.hasAttribute('disabled') && !x.getAttribute('aria-disabled')
        )
        if (!list.length) return

        const first = list[0]
        const last = list[list.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) return
    const el = lastActiveRef.current
    if (el && typeof el.focus === 'function') {
      setTimeout(() => el.focus(), 0)
    }
  }, [open])

  if (!open || !root) return null

  function onBackdropClick(e) {
    if (e.target === e.currentTarget) onClose?.()
  }

  async function handleConfirm() {
    if (loading) return
    await onConfirm?.()
  }

  const recipient = contactEmail || tenantLabel

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        background: 'color-mix(in srgb, var(--text) 52%, transparent)',
        backdropFilter: 'blur(14px) saturate(120%)',
        WebkitBackdropFilter: 'blur(14px) saturate(120%)',
      }}
      onMouseDown={onBackdropClick}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-deletion-title"
        aria-describedby="account-deletion-desc"
        className={[
          'relative w-full sm:max-w-[480px]',
          'rounded-t-[28px] sm:rounded-[28px]',
          'overflow-hidden',
          'shadow-[0_-8px_40px_rgba(0,0,0,0.18),0_30px_100px_rgba(0,0,0,0.28)]',
          'ring-1 ring-[color:color-mix(in_srgb,var(--separator,var(--c-border))_80%,transparent)]',
        ].join(' ')}
        style={{
          background: 'var(--surface)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(520px 220px at 50% -10%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 70%),' +
              'linear-gradient(180deg, color-mix(in srgb, var(--primary) 4%, var(--surface)), var(--surface) 38%)',
          }}
        />

        <div className="relative px-5 pt-3 pb-5 sm:px-6 sm:pt-5 sm:pb-6">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full sm:hidden" style={{ background: 'var(--separator, var(--c-border))' }} aria-hidden="true" />

          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-start gap-3.5 min-w-0">
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 11%, var(--surface))',
                  color: 'var(--primary)',
                  boxShadow: 'inset 0 1px 0 color-mix(in srgb, #fff 40%, transparent)',
                  border: '0.5px solid color-mix(in srgb, var(--primary) 18%, transparent)',
                }}
              >
                <Scale size={22} strokeWidth={1.85} aria-hidden="true" />
              </span>

              <div className="min-w-0 pt-0.5">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Privacidade · LGPD
                </p>
                <h2
                  id="account-deletion-title"
                  className="text-[22px] sm:text-[24px] font-bold leading-[1.12] tracking-tight"
                  style={{ color: 'var(--text)' }}
                >
                  Encerrar conta
                </h2>
                <p
                  id="account-deletion-desc"
                  className="mt-2 text-[15px] leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Solicite a eliminação dos seus dados pessoais, conforme o art.&nbsp;18, VI, da Lei
                  nº&nbsp;13.709/2018.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95"
              style={{
                background: 'color-mix(in srgb, var(--text) 5%, var(--surface))',
                color: 'var(--text-muted)',
              }}
              aria-label="Fechar"
            >
              <X size={18} strokeWidth={2.25} />
            </button>
          </div>

          <div
            className="member-dashboard-card rounded-[18px] p-4 mb-4"
            style={{ background: 'color-mix(in srgb, var(--grouped-bg, var(--surface-alt)) 55%, var(--surface))' }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Como funciona
            </p>
            <ol className="space-y-4 list-none p-0 m-0">
              <StepRow
                step="1"
                icon={Mail}
                title="E-mail pré-preenchido"
                detail="Seu aplicativo de e-mail será aberto com uma solicitação formal já redigida."
              />
              <StepRow
                step="2"
                icon={Send}
                title="Envie a mensagem"
                detail="A solicitação só é registrada após você confirmar o envio no seu e-mail."
              />
              <StepRow
                step="3"
                icon={Clock3}
                title="Retorno do prestador"
                detail="O encerramento não é imediato neste app. Você receberá orientações pelo canal oficial."
              />
            </ol>
          </div>

          <div
            className="rounded-[16px] px-4 py-3.5 mb-4 flex items-start gap-3"
            style={{
              background: 'color-mix(in srgb, var(--primary) 7%, var(--surface))',
              border: '0.5px solid color-mix(in srgb, var(--primary) 16%, transparent)',
            }}
          >
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
              style={{
                background: 'color-mix(in srgb, var(--primary) 14%, var(--surface))',
                color: 'var(--primary)',
              }}
            >
              <Mail size={17} strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                Destinatário
              </p>
              <p
                className="mt-1 text-[15px] font-semibold leading-snug break-all"
                style={{ color: 'var(--text)' }}
              >
                {recipient}
              </p>
            </div>
          </div>

          <div
            className="rounded-[14px] px-3.5 py-3 mb-5 flex gap-2.5"
            style={{
              background: 'color-mix(in srgb, var(--text) 4%, var(--surface))',
              border: '0.5px solid var(--separator, var(--c-border))',
            }}
          >
            <Shield
              size={16}
              strokeWidth={2}
              className="shrink-0 mt-0.5"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden="true"
            />
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Alguns dados podem ser mantidos pelo prazo legal exigido para obrigações contratuais,
              fiscais ou regulatórias, conforme a Política de Privacidade vigente.
            </p>
          </div>

          <div className="space-y-2.5">
            <CTAButton
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              size="lg"
              data-account-deletion-confirm
              className="w-full rounded-[14px] !h-[50px] text-[17px] font-semibold shadow-[0_8px_24px_color-mix(in_srgb,var(--primary)_28%,transparent)]"
              iconAfter={<ArrowRight size={18} strokeWidth={2.25} />}
            >
              Abrir e-mail de solicitação
            </CTAButton>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full min-h-[44px] text-[17px] font-medium transition active:opacity-60 disabled:opacity-40"
              style={{ color: 'var(--primary)' }}
            >
              Cancelar
            </button>
          </div>

          {loading ? (
            <div
              className="mt-4 h-1 w-full overflow-hidden rounded-full"
              style={{ background: 'color-mix(in srgb, var(--c-border) 35%, transparent)' }}
            >
              <div
                className="h-full w-1/3 animate-[modalprogress_1.1s_ease-in-out_infinite]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 60%, transparent), transparent)',
                }}
              />
              <style>
                {`@keyframes modalprogress{0%{transform:translateX(-120%)}100%{transform:translateX(360%)}}`}
              </style>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    root
  )
}
