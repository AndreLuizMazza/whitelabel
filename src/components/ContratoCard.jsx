function Badge({ children, kind = 'neutral' }) {
  // Todas as variações usam apenas tokens do tema
  const styles = {
    neutral: {
      background: 'var(--surface)',
      color: 'var(--text)'
    },
    success: {
      background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
      color: 'var(--primary)'
    },
    danger: {
      background: 'color-mix(in srgb, var(--primary) 16%, transparent)',
      color: 'var(--primary)'
    },
    warn: {
      background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
      color: 'var(--primary)'
    },
    info: {
      background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
      color: 'var(--primary)'
    }
  }
  const s = styles[kind] || styles.neutral
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: s.background, color: s.color, border: '1px solid var(--c-border)' }}
    >
      {children}
    </span>
  )
}

// "YYYY-MM-DD" -> "dd/MM/YYYY"
const fmtData = (s) => {
  if (!s) return '—'
  const [Y, M, D] = String(s).split('-')
  return `${D}/${M}/${Y}`
}

export default function ContratoCard({ contrato }) {
  if (!contrato) return null

  const numero = contrato.numeroContrato ?? contrato.id ?? contrato.contratoId
  const plano = contrato.nomePlano ?? contrato.plano?.nome ?? 'Plano'
  const ativo = contrato.contratoAtivo ?? (String(contrato.status).toUpperCase() === 'ATIVO')
  const efetivacao = contrato.dataEfetivacao ?? contrato.dataContrato ?? contrato.criadoEm ?? '—'
  const dia = contrato.diaD ?? contrato.diaVencimento ?? '—'
  const atrasos = Number(contrato.parcelasEmAtraso || 0)

  const unidade = contrato.unidade || {}
  const contatos = contrato.contatos || {}

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Contrato #{numero}</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge kind={ativo ? 'success' : 'danger'}>{ativo ? 'ATIVO' : 'INATIVO'}</Badge>
            {atrasos > 0 ? <Badge kind="warn">Em atraso ({atrasos})</Badge> : null}
          </div>
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

      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt style={{ color: 'var(--text)' }}>Plano</dt>
          <dd className="font-medium">{plano}</dd>
        </div>
        <div>
          <dt style={{ color: 'var(--text)' }}>Efetivação</dt>
          <dd className="font-medium">{fmtData(efetivacao)}</dd>
        </div>
        <div>
          <dt style={{ color: 'var(--text)' }}>Dia de vencimento</dt>
          <dd className="font-medium">{dia}</dd>
        </div>
        <div>
          <dt style={{ color: 'var(--text)' }}>Titular</dt>
          <dd className="font-medium">{contrato.nomeTitular ?? contrato.nome ?? '—'}</dd>
        </div>
      </dl>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded" style={{ border: '1px solid var(--c-border)', background: 'var(--surface)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>Unidade</p>
          <p className="font-medium">{unidade.nomeFantasia ?? '—'}</p>
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            {unidade.cidade ?? '—'} / {unidade.uf ?? '—'}
          </p>
          {unidade.cnpj ? <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>CNPJ: {unidade.cnpj}</p> : null}
        </div>

        <div className="p-4 rounded" style={{ border: '1px solid var(--c-border)', background: 'var(--surface)' }}>
          <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>Contatos</p>
          <p className="text-sm"><span style={{ color: 'var(--text)' }}>E-mail:</span> {contatos.email || '—'}</p>
          <p className="text-sm"><span style={{ color: 'var(--text)' }}>Celular:</span> {contatos.celular || '—'}</p>
          {contatos.telefone ? (
            <p className="text-sm"><span style={{ color: 'var(--text)' }}>Telefone:</span> {contatos.telefone}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
