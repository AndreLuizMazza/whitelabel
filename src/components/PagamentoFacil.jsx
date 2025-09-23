import { useMemo, useState } from 'react'

const fmtBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
// "YYYY-MM-DD" -> "dd/MM/YYYY"
const fmtData = (s) => {
  if (!s) return '—'
  const [Y, M, D] = String(s).split('-')
  return `${D}/${M}/${Y}`
}

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

/**
 * Props:
 * - parcelaFoco: pagamento ABERTO ou null
 * - proximas: pagamentos ABERTOS (restantes)
 * - historico: pagamentos não-abertos
 * - isAtraso: (p) => boolean
 */
export default function PagamentoFacil({ parcelaFoco, proximas = [], historico = [], isAtraso = () => false }) {
  const [copied, setCopied] = useState(false)
  const foco = parcelaFoco
  const temFoco = Boolean(foco)
  const focoAtraso = temFoco && isAtraso(foco)

  const acoesFoco = useMemo(() => {
    if (!foco) return []
    const a = []
    if (foco.linkPagamento) a.push({ tipo: 'checkout', label: 'Pagar no checkout', href: foco.linkPagamento })
    if (foco.urlBoleto)    a.push({ tipo: 'boleto',   label: 'Abrir boleto',        href: foco.urlBoleto })
    if (foco.pixQrcode)    a.push({ tipo: 'pix',      label: 'Copiar código PIX',   copy: foco.pixQrcode })
    return a
  }, [foco])

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    } catch {
      const ta = document.createElement('textarea'); ta.value = text
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="card p-5">
      <h3 className="text-lg font-semibold mb-2">Pagamento</h3>

      {!temFoco ? (
        <div
          className="p-4 rounded"
          style={{
            background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
            color: 'var(--primary)',
            border: '1px solid var(--primary)'
          }}
        >
          <p className="font-medium">Tudo em dia!</p>
          <p className="text-sm">Nenhuma parcela aberta no momento.</p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text)' }}>Parcela</span>
                <span className="font-semibold">#{foco.numeroDuplicata || foco.numero}</span>
                {focoAtraso ? (
                  <Badge kind="danger">EM ATRASO</Badge>
                ) : (
                  <Badge kind="warn">ABERTA</Badge>
                )}
              </div>
              <div className="mt-1 text-2xl font-bold">{fmtBRL(foco.valorParcela)}</div>
              <div className="text-sm" style={{ color: 'var(--text)' }}>
                Vencimento: {fmtData(foco.dataVencimento)}
              </div>
            </div>

            {foco.pixImage ? (
              <img
                src={foco.pixImage}
                alt="QR Code PIX"
                className="w-28 h-28 rounded"
                style={{ border: '1px solid var(--c-border)' }}
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {acoesFoco.map((a, i) =>
              a.href ? (
                <a key={i} href={a.href} target="_blank" rel="noreferrer" className="btn-primary text-center">
                  {a.label}
                </a>
              ) : (
                <button key={i} className="btn-outline" onClick={() => copy(a.copy)}>
                  {copied ? 'Copiado!' : a.label}
                </button>
              )
            )}
          </div>

          {foco.pixQrcode ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm" style={{ color: 'var(--text)' }}>
                Ver código PIX (copia e cola)
              </summary>
              <textarea
                readOnly
                value={foco.pixQrcode}
                className="mt-2 w-full rounded text-xs"
                rows={4}
                style={{ border: '1px solid var(--c-border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
              <div className="mt-2">
                <button className="btn-outline" onClick={() => copy(foco.pixQrcode)}>
                  {copied ? 'Copiado!' : 'Copiar código PIX'}
                </button>
              </div>
            </details>
          ) : null}
        </>
      )}

      {/* Próximas: somente ABERTAS restantes (sem duplicar) */}
      {proximas.length > 0 && (
        <div className="mt-6">
          <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>Próximas parcelas</p>
          <ul className="space-y-2">
            {proximas.map((p) => {
              const atrasada = isAtraso(p)
              return (
                <li key={p.id} className="flex items-center justify-between rounded p-3"
                    style={{ border: '1px solid var(--c-border)' }}>
                  <div>
                    <div className="font-medium">
                      #{p.numeroDuplicata || p.numero} • {fmtBRL(p.valorParcela)}{' '}
                      {atrasada ? <Badge kind="danger">EM ATRASO</Badge> : null}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text)' }}>
                      Vencimento: {fmtData(p.dataVencimento)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {p.linkPagamento ? (
                      <a className="btn-outline" target="_blank" rel="noreferrer" href={p.linkPagamento}>Checkout</a>
                    ) : null}
                    {p.urlBoleto ? (
                      <a className="btn-outline" target="_blank" rel="noreferrer" href={p.urlBoleto}>Boleto</a>
                    ) : null}
                    {p.pixQrcode ? (
                      <button className="btn-outline" onClick={() => copy(p.pixQrcode)}>
                        {copied ? 'Copiado!' : 'PIX'}
                      </button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Histórico (não-abertas) */}
      {historico.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm" style={{ color: 'var(--text)' }}>
            Histórico de pagamentos
          </summary>
          <ul className="mt-3 divide-y rounded" style={{ border: '1px solid var(--c-border)' }}>
            {historico.map((p) => (
              <li key={p.id} className="p-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">#{p.numeroDuplicata || p.numero} • {fmtBRL(p.valorParcela)}</div>
                  <div className="text-xs" style={{ color: 'var(--text)' }}>
                    Venc.: {fmtData(p.dataVencimento)}{p.dataRecebimento ? ` • Pago em ${fmtData(p.dataRecebimento)}` : ''}
                  </div>
                </div>
                <Badge kind={String(p.status).toUpperCase() === 'PAGA' ? 'success' : 'info'}>
                  {String(p.status || '').toUpperCase()}
                </Badge>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
