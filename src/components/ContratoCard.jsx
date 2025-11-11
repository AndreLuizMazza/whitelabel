// src/components/ContratoCard.jsx
function Badge({ children, kind = 'neutral' }) {
  const styles = {
    neutral: { bg: 'var(--surface)', color: 'var(--text)' },
    success: { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' },
    danger:  { bg: 'color-mix(in srgb, var(--primary) 16%, transparent)', color: 'var(--primary)' },
    warn:    { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' },
    info:    { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' },
  }
  const s = styles[kind] || styles.neutral
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color, border: '1px solid var(--c-border)' }}
    >
      {children}
    </span>
  )
}

function buildWhats(number, msg = 'Olá! Preciso de ajuda com meu contrato.') {
  if (!number) return null
  const justDigits = String(number).replace(/\D+/g, '')
  return `https://wa.me/${justDigits}?text=${encodeURIComponent(msg)}`
}

const fmt = {
  enderecoCompact(e = {}) {
    const { bairro, cidade, uf } = e || {}
    const compact = [bairro, cidade, uf].filter(Boolean).join(' • ')
    return compact || '—'
  },
  enderecoCompleto(e = {}) {
    const { logradouro, numero, bairro, cidade, uf, cep } = e || {}
    const l1 = [logradouro, numero].filter(Boolean).join(', ')
    const l2 = [bairro, cidade, uf].filter(Boolean).join(' / ')
    const l3 = cep ? `CEP ${cep}` : ''
    return [l1, l2, l3].filter(Boolean).join(' · ')
  },
}

function buildMapsLink(endereco = {}, latitude, longitude) {
  const lat = String(latitude || '').trim()
  const lng = String(longitude || '').trim()
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
  }
  const { logradouro, numero, bairro, cidade, uf, cep } = endereco
  const q = [logradouro, numero, bairro, cidade, uf, cep].filter(Boolean).join(', ')
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null
}

/* ===================================================================
   CONTRATO CARD — mais simples de ler
   - Endereço compacto por padrão + toggle “Ver endereço completo”
=================================================================== */
import { useState } from 'react'

export default function ContratoCard({ contrato }) {
  const [expandEndereco, setExpandEndereco] = useState(false)
  if (!contrato) return null

  const ativo   = contrato.contratoAtivo ?? (String(contrato.status).toUpperCase() === 'ATIVO')
  const dia     = contrato.diaD ?? contrato.diaVencimento ?? '—'
  const atrasos = Number(contrato.parcelasEmAtraso || 0)

  const unidade  = contrato.unidade || contrato.empresa || {}
  const contatos = contrato.contatos || {}
  const endereco = contrato.endereco || unidade.endereco || {}

  const waHref   = buildWhats(unidade.whatsapp || contatos.celular)
  const mapsHref = buildMapsLink(endereco, endereco.latitude, endereco.longitude)

  const enderecoCompact = fmt.enderecoCompact(endereco)
  const enderecoFull    = fmt.enderecoCompleto(endereco)

  return (
    <section
      id="contrato-card-root"
      className="card p-5 md:p-6 rounded-xl"
      aria-label="Seu contrato"
      style={{ background: 'var(--surface)', border: '1px solid var(--c-border)' }}
    >
      {/* HEADER */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-[-0.01em]" style={{ color: 'var(--text)' }}>
            Seu contrato
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {ativo ? <Badge kind="success">ATIVO</Badge> : <Badge kind="warn">Aguardando ativação</Badge>}
            {atrasos > 0 && <Badge kind="danger">Em atraso ({atrasos})</Badge>}
          </div>
        </div>

        {/* CTA primário */}
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="btn-primary shrink-0 inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium"
            aria-label="Falar com a unidade no WhatsApp"
            style={{
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)'
            }}
          >
            Falar com a unidade
          </a>
        )}
      </header>

      <div className="mt-4" style={{ height: 1, background: 'var(--c-border)' }} />

      {/* INFO */}
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="min-w-0">
          <dt className="text-[12px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Dia de vencimento
          </dt>
          <dd className="mt-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{dia}</dd>
        </div>

        <div className="min-w-0">
          <dt className="text-[12px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Unidade
          </dt>
          <dd className="mt-1 text-sm font-medium" style={{ color: 'var(--text)' }}>
            {unidade.nomeFantasia ?? '—'}
            {unidade.cnpj && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                CNPJ: {unidade.cnpj}
              </div>
            )}
          </dd>
        </div>
      </dl>

      {/* ENDEREÇO */}
      <div className="mt-4 text-sm">
        <p className="text-[12px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
          Endereço
        </p>

        {/* Compacto */}
        <div className="leading-relaxed" style={{ color: 'var(--text)' }}>
          <div>{enderecoCompact}</div>
          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-sm font-medium underline-offset-2 hover:underline focus:underline"
              style={{ color: 'var(--primary)' }}
            >
              Ver no mapa
            </a>
          )}
        </div>

        {/* Toggle “completo” */}
        {!!enderecoFull && (
          <div className="mt-1">
            <button
              type="button"
              className="btn-link text-xs"
              onClick={() => setExpandEndereco(v => !v)}
              aria-expanded={expandEndereco}
              aria-controls="endereco-completo"
            >
              {expandEndereco ? 'Ocultar endereço completo' : 'Ver endereço completo'}
            </button>
            {expandEndereco && (
              <div id="endereco-completo" className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {enderecoFull}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ALERTA CONTEXTUAL */}
      {!ativo && (
        <div
          className="mt-5 p-4 rounded-lg"
          role="status"
          style={{
            border: '1px solid var(--primary)',
            background: 'color-mix(in srgb, var(--primary) 10%, transparent)'
          }}
        >
          <p className="font-medium text-sm" style={{ color: 'var(--primary)' }}>Próximos passos</p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            {contrato.motivoInativo || contrato.motivoStatus || 'Aguardando ativação.'}
            {waHref ? ' Se precisar de ajuda, use “Falar com a unidade”.' : ''}
          </p>
        </div>
      )}
    </section>
  )
}
