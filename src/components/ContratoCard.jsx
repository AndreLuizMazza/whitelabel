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
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: s.bg, color: s.color, border: '1px solid var(--c-border)' }}
    >
      {children}
    </span>
  )
}

const fmtData = (s) => {
  if (!s) return '—'
  const txt = String(s)
  if (txt.includes('/') && /^\d{2}\/\d{2}\/\d{4}$/.test(txt)) return txt
  const cleaned = txt.split('T')[0]
  const [Y, M, D] = cleaned.split('-')
  if (!Y || !M || !D) return txt
  return `${D}/${M}/${Y}`
}

function buildWhats(number, msg = 'Olá! Gostaria de falar sobre meu contrato.') {
  if (!number) return null
  const justDigits = String(number).replace(/\D+/g, '')
  return `https://wa.me/${justDigits}?text=${encodeURIComponent(msg)}`
}

/* ========================= Card do contrato ========================= */
export default function ContratoCard({ contrato }) {
  if (!contrato) return null

  const numero = contrato.numeroContrato ?? contrato.id ?? contrato.contratoId
  const ativo = contrato.contratoAtivo ?? (String(contrato.status).toUpperCase() === 'ATIVO')
  const efetivacao = contrato.dataEfetivacao ?? contrato.dataContrato ?? contrato.criadoEm ?? '—'
  const dia = contrato.diaD ?? contrato.diaVencimento ?? '—'
  const atrasos = Number(contrato.parcelasEmAtraso || 0)

  const unidade = contrato.unidade || {}
  const contatos = contrato.contatos || {}

  const waHref = buildWhats(unidade.whatsapp || contatos.celular, 'Olá! Preciso de ajuda com meu contrato.')
  const etapaInativo = contrato.motivoInativo || contrato.motivoStatus || 'Aguardando ativação.'

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Informações do contrato</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            {ativo ? <Badge kind="success">ATIVO</Badge> : <Badge kind="warn">Aguardando ativação</Badge>}
            {atrasos > 0 ? <Badge kind="danger">Em atraso ({atrasos})</Badge> : null}
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>
            Contrato #{numero}
          </p>
        </div>
        {unidade?.nomeLogo ? (
          <img
            src={unidade.nomeLogo}
            alt={unidade.nomeFantasia || 'Unidade'}
            className="w-16 h-16 object-contain rounded"
            referrerPolicy="no-referrer"
          />
        ) : null}
      </div>

      {/* Dados essenciais */}
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt style={{ color: 'var(--text)' }}>Efetivação</dt>
          <dd className="font-medium">{fmtData(efetivacao)}</dd>
        </div>
        <div>
          <dt style={{ color: 'var(--text)' }}>Dia de vencimento</dt>
          <dd className="font-medium">{dia}</dd>
        </div>
      </dl>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* UNIDADE */}
        <div className="p-4 rounded space-y-3" style={{ border: '1px solid var(--c-border)', background: 'var(--surface)' }}>
          <div>
            <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>Unidade</p>
            <p className="font-medium">{unidade.nomeFantasia ?? '—'}</p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              {unidade.cidade ?? '—'} / {unidade.uf ?? '—'}
            </p>
            {unidade.cnpj && <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>CNPJ: {unidade.cnpj}</p>}
          </div>

          {waHref && (
            <a className="btn-primary inline-flex items-center justify-center" href={waHref} target="_blank" rel="noreferrer">
              Fale conosco
            </a>
          )}
        </div>

        {/* CONTATOS */}
        <div className="p-4 rounded" style={{ border: '1px solid var(--c-border)', background: 'var(--surface)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>Contatos</p>
          <p className="text-sm"><span style={{ color: 'var(--text)' }}>E-mail:</span> {contatos.email || '—'}</p>
          <p className="text-sm"><span style={{ color: 'var(--text)' }}>Celular:</span> {contatos.celular || '—'}</p>
          {contatos.telefone && (
            <p className="text-sm"><span style={{ color: 'var(--text)' }}>Telefone:</span> {contatos.telefone}</p>
          )}
        </div>
      </div>

      {/* Alerta se ainda não estiver ativo */}
      {!ativo && (
        <div
          className="mt-5 p-4 rounded"
          style={{
            border: '1px solid var(--primary)',
            background: 'color-mix(in srgb, var(--primary) 10%, transparent)'
          }}
        >
          <p className="font-semibold" style={{ color: 'var(--primary)' }}>Próximos passos</p>
          <ul className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
            <li>• <strong>Status:</strong> {etapaInativo}</li>
            <li>• Caso precise de ajuda, utilize os canais da unidade ao lado.</li>
          </ul>
        </div>
      )}
    </div>
  )
}
