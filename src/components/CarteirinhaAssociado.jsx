// src/components/CarteirinhaAssociado.jsx
import { useEffect, useState } from 'react'

function usePrefersDark() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  )
  useEffect(() => {
    if (!window?.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setDark(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return dark
}

// iniciais do avatar
function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase() || '').join('')
}

const fmtHoje = () => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export default function CarteirinhaAssociado({ user = {}, contrato = {} }) {
  const prefersDark = usePrefersDark()

  const nome = contrato.nomeTitular || user?.nome || user?.name || 'Associado(a)'
  const plano = contrato.nomePlano ?? contrato.plano?.nome ?? 'Plano'
  const numero = contrato.numeroContrato ?? contrato.id ?? contrato.contratoId ?? '—'
  const ativo = contrato.contratoAtivo ?? (String(contrato.status).toUpperCase() === 'ATIVO')
  const validade = fmtHoje()
  const avatarUrl = user?.fotoUrl || user?.photoURL || contrato?.fotoTitular

  const gradStartOpacity = prefersDark ? 4 : 8
  const ringOpacity       = prefersDark ? 30 : 35
  const badgeBgOpacity    = prefersDark ? 10 : 12
  const glowPrimaryMix    = prefersDark ? 12 : 18
  const cardShadow        = prefersDark
    ? '0 8px 22px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.18)'
    : '0 8px 22px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)'

  return (
    <div
      className="card relative overflow-hidden mx-auto"
      aria-label="Carteirinha do Associado"
      style={{
        maxWidth: '420px',
        width: '100%',
        aspectRatio: '85.6 / 54',
        padding: 'clamp(12px, 2.4vh, 18px)',
        background: `linear-gradient(180deg, color-mix(in srgb, var(--primary) ${gradStartOpacity}%, var(--surface)) 0%, var(--surface) 100%)`,
        boxShadow: cardShadow,
        border: '1px solid var(--c-border)',
        borderRadius: '14px'
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          insetInline: 0,
          top: 0,
          height: '6px',
          background: 'linear-gradient(90deg, color-mix(in srgb, var(--primary) 50%, transparent), transparent 60%)',
          borderTopLeftRadius: '14px',
          borderTopRightRadius: '14px'
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '-10%',
          top: '-30%',
          width: '45%',
          height: '120%',
          transform: 'rotate(18deg)',
          background: `radial-gradient(60% 60% at 50% 50%, color-mix(in srgb, var(--primary) ${glowPrimaryMix}%, ${
            prefersDark ? 'black' : 'white'
          }) 0%, transparent 70%)`,
          filter: 'blur(10px)',
          opacity: prefersDark ? 0.35 : 0.4
        }}
      />

      <div className="flex items-center justify-between relative" style={{ height: '100%' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={nome}
                className="rounded-full object-cover"
                style={{
                  width: '58px',
                  height: '58px',
                  border: `2px solid color-mix(in srgb, var(--primary) ${ringOpacity}%, transparent)`
                }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="rounded-full flex items-center justify-center text-base font-semibold"
                style={{
                  width: '58px',
                  height: '58px',
                  background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
                  color: 'var(--primary)',
                  border: `2px solid color-mix(in srgb, var(--primary) ${ringOpacity}%, transparent)`
                }}
              >
                {initials(nome)}
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                background: `color-mix(in srgb, var(--primary) ${badgeBgOpacity}%, ${prefersDark ? 'black' : 'white'})`,
                color: 'var(--primary)',
                border: '1px solid var(--c-border)'
              }}
            >
              {ativo ? 'ATIVO' : 'INATIVO'}
            </span>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--text)' }}>
              Carteirinha do Associado
            </div>
            <div className="font-semibold leading-tight text-[15px]">{nome}</div>
            <div className="text-[11px]" style={{ color: 'var(--text)' }}>
              {plano} • Contrato #{numero}
            </div>
          </div>
        </div>

        <div className="self-end text-[10px]" style={{ color: 'var(--text)' }}>
          Validade: <strong>{validade}</strong>
        </div>
      </div>
    </div>
  )
}
