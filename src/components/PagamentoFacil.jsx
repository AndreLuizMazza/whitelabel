// src/components/PagamentoFacil.jsx
import { useEffect, useMemo, useState } from 'react'
import useAuth from '@/store/auth'
import QRCode from 'qrcode'

const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(v || 0))

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

export default function PagamentoFacil({ parcelaFoco, proximas = [], historico = [], isAtraso = () => false }) {
  const [copied, setCopied] = useState(false)
  const [qrSrc, setQrSrc] = useState(null)
  const { token } = useAuth.getState()
  const foco = parcelaFoco
  const temFoco = Boolean(foco)
  const focoAtraso = temFoco && isAtraso(foco)

  // Gera ou carrega QR somente se houver pixQrcode/pixImage
  useEffect(() => {
    setQrSrc(null)
    const img = foco?.pixImage
    const code = foco?.pixQrcode
    if (!img && !code) return

    // base64 puro
    if (img && !/^https?:\/\//i.test(img)) {
      const src = img.startsWith('data:') ? img : `data:image/png;base64,${img}`
      setQrSrc(src)
      return
    }

    // URL protegida
    if (img && /^https?:\/\//i.test(img)) {
      ;(async () => {
        try {
          const r = await fetch(img, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
          if (!r.ok) throw new Error('QR fetch fail')
          const blob = await r.blob()
          setQrSrc(URL.createObjectURL(blob))
        } catch {
          setQrSrc(null)
        }
      })()
      return
    }

    // ✅ gera QR localmente apenas se existir pixQrcode
    if (code) {
      QRCode.toDataURL(code, { width: 200, margin: 1 }, (err, url) => {
        if (!err) setQrSrc(url)
      })
    }
  }, [foco, token])

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
    } catch {
      const ta = document.createElement('textarea'); ta.value = text
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
    } finally {
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm" style={{ color: 'var(--text)' }}>Parcela</span>
                <span className="font-semibold">#{foco.numeroDuplicata || foco.numero}</span>
                {focoAtraso ? <Badge kind="danger">EM ATRASO</Badge> : <Badge kind="warn">ABERTA</Badge>}
              </div>
              <div className="mt-1 text-2xl font-bold">{fmtBRL(foco.valorParcela)}</div>
              <div className="text-sm" style={{ color: 'var(--text)' }}>
                Vencimento: {fmtData(foco.dataVencimento)}
              </div>
            </div>

            {/* Exibe QR somente se houver imagem ou código */}
            {qrSrc && (
              <img
                src={qrSrc}
                alt="QR Code PIX"
                className="w-28 h-28 rounded"
                style={{ border: '1px solid var(--c-border)', objectFit: 'cover' }}
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          {/* Ações da parcela atual */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {acoesFoco.map((acao, i) =>
              acao.href ? (
                <a key={i} href={acao.href} target="_blank" rel="noreferrer" className="btn-primary text-center">
                  {acao.label}
                </a>
              ) : (
                <button key={i} className="btn-outline" onClick={() => copy(acao.copy)}>
                  {copied ? 'Copiado!' : acao.label}
                </button>
              )
            )}
          </div>

          {foco.pixQrcode && (
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
          )}
        </>
      )}

      {/* Próximas parcelas */}
      {proximas.length > 0 && (
        <div className="mt-6">
          <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>Próximas parcelas</p>
          <ul className="space-y-2">
            {proximas.map((dup) => {
              const atrasada = isAtraso(dup)
              return (
                <li key={dup.id} className="rounded p-3" style={{ border: '1px solid var(--c-border)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium flex items-center gap-2 flex-wrap">
                        #{dup.numeroDuplicata || dup.numero} • {fmtBRL(dup.valorParcela)}
                        {atrasada ? <Badge kind="danger">EM ATRASO</Badge> : null}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text)' }}>
                        Vencimento: {fmtData(dup.dataVencimento)}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end sm:flex-nowrap">
                      {dup.urlBoleto && (
                        <a
                          className="btn-outline text-xs px-3 py-1.5 rounded-full"
                          target="_blank"
                          rel="noreferrer"
                          href={dup.urlBoleto}
                        >
                          Boleto
                        </a>
                      )}
                      {dup.pixQrcode && (
                        <button
                          className="btn-outline text-xs px-3 py-1.5 rounded-full"
                          onClick={() => copy(dup.pixQrcode)}
                        >
                          {copied ? 'Copiado!' : 'PIX'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm" style={{ color: 'var(--text)' }}>
            Histórico de pagamentos
          </summary>
          <ul className="mt-3 divide-y rounded" style={{ border: '1px solid var(--c-border)' }}>
            {historico.map((dup) => (
              <li key={dup.id} className="p-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    #{dup.numeroDuplicata || dup.numero} • {fmtBRL(dup.valorParcela)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text)' }}>
                    Venc.: {fmtData(dup.dataVencimento)}
                    {dup.dataRecebimento ? ` • Pago em ${fmtData(dup.dataRecebimento)}` : ''}
                  </div>
                </div>
                <Badge kind={String(dup.status).toUpperCase() === 'PAGA' ? 'success' : 'info'}>
                  {String(dup.status || '').toUpperCase()}
                </Badge>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
