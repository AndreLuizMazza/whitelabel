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

function formatEndereco(e = {}) {
  const { logradouro, numero, bairro, cidade, uf, cep } = e || {}
  const linha1 = [logradouro, numero].filter(Boolean).join(', ')
  const linha2 = [bairro, cidade, uf].filter(Boolean).join(' / ')
  const linha3 = cep ? `CEP ${cep}` : ''
  return { linha1, linha2, linha3 }
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
   CONTRATO CARD — enxuto, elegante e funcional
   - Prioriza contrato.endereco; fallback: unidade.endereco
   - Exibe endereço completo + botão “Ver no mapa”
   - Mantém CTA WhatsApp e alerta contextual
=================================================================== */
export default function ContratoCard({ contrato }) {
  if (!contrato) return null

  const ativo   = contrato.contratoAtivo ?? (String(contrato.status).toUpperCase() === 'ATIVO')
  const dia     = contrato.diaD ?? contrato.diaVencimento ?? '—'
  const atrasos = Number(contrato.parcelasEmAtraso || 0)

  const unidade  = contrato.unidade || contrato.empresa || {}
  const contatos = contrato.contatos || {}
  const endereco = contrato.endereco || unidade.endereco || {}

  const waHref   = buildWhats(unidade.whatsapp || contatos.celular)
  const mapsHref = buildMapsLink(endereco, endereco.latitude, endereco.longitude)
  const { linha1, linha2, linha3 } = formatEndereco(endereco)

  return (
    <section
      className="card p-5 md:p-6 rounded-xl"
      aria-label="Informações do contrato"
      style={{ background: 'var(--surface)', border: '1px solid var(--c-border)' }}
    >
      {/* HEADER */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-semibold tracking-[-0.01em]" style={{ color: 'var(--text)' }}>
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
            aria-label="Falar com a unidade pelo WhatsApp"
            style={{
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              border: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)'
            }}
          >
            Fale conosco
          </a>
        )}
      </header>

      {/* DIVISOR SUTIL */}
      <div className="mt-4" style={{ height: 1, background: 'var(--c-border)' }} />

      {/* INFO PRINCIPAIS */}
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="min-w-0">
          <dt className="text-[12px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Dia de vencimento
          </dt>
          <dd className="mt-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
            {dia}
          </dd>
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

      {/* ENDEREÇO COMPLETO + VER NO MAPA */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="min-w-0">
          <p className="text-[12px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
            Endereço
          </p>
          <div className="leading-relaxed" style={{ color: 'var(--text)' }}>
            {linha1 && <div>{linha1}</div>}
            {linha2 && <div style={{ color: 'var(--text-muted)' }}>{linha2}</div>}
            {linha3 && <div style={{ color: 'var(--text-muted)' }}>{linha3}</div>}
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm font-medium underline-offset-2 hover:underline focus:underline"
                style={{ color: 'var(--primary)' }}
                aria-label="Abrir endereço no Google Maps"
              >
                Ver no mapa
              </a>
            )}
          </div>
        </div>
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
          <p className="font-medium text-sm" style={{ color: 'var(--primary)' }}>
            Próximos passos
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            {contrato.motivoInativo || contrato.motivoStatus || 'Aguardando ativação.'}
            {waHref ? ' Se precisar de ajuda, utilize o botão “Fale conosco”.' : ''}
          </p>
        </div>
      )}
    </section>
  )
}
