// src/components/CarteirinhaAssociado.jsx
import { useEffect, useState } from 'react'

// Hook simples para detectar tema escuro do SO/Navegador
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

  // Ajustes finos para dark mode (opacidades e mistura)
  const gradStartOpacity = prefersDark ? 4 : 8           // % da primary no topo do gradiente
  const ringOpacity       = prefersDark ? 30 : 35        // % no anel do avatar
  const badgeBgOpacity    = prefersDark ? 10 : 12        // % do badge ATIVO/INATIVO
  const glowPrimaryMix    = prefersDark ? 12 : 18        // % do brilho diagonal
  const cardShadow        = prefersDark
    ? '0 8px 22px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.18)'
    : '0 8px 22px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)'

  return (
    <div
      className="card p-5 relative overflow-hidden"
      style={{
        // Gradiente base “dark-tuned” mantendo tokens
        background: `linear-gradient(180deg, color-mix(in srgb, var(--primary) ${gradStartOpacity}%, var(--surface)) 0%, var(--surface) 100%)`,
        minHeight: '7.5rem',
        boxShadow: cardShadow,
        border: '1px solid var(--c-border)'
      }}
    >
      {/* faixa decorativa superior */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          insetInline: 0,
          top: 0,
          height: '6px',
          background: 'linear-gradient(90deg, color-mix(in srgb, var(--primary) 50%, transparent), transparent 60%)'
        }}
      />
      {/* brilho diagonal suave (com mistura diferente no dark) */}
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

      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={nome}
                className="w-14 h-14 rounded-full object-cover"
                style={{ border: `2px solid color-mix(in srgb, var(--primary) ${ringOpacity}%, transparent)` }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-base font-semibold"
                style={{
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
            <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--text)' }}>
              Carteirinha do Associado
            </div>
            <div className="font-semibold leading-tight text-base">{nome}</div>
            <div className="text-xs" style={{ color: 'var(--text)' }}>
              {plano} • Contrato #{numero}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs flex items-center justify-between relative">
        <span style={{ color: 'var(--text)' }}>
          Validade: <strong>{validade}</strong>
        </span>
      </div>
    </div>
  )
}
