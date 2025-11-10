// src/components/PagamentoFacil.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import useAuth from '@/store/auth'
import QRCode from 'qrcode'
import { track } from '@/lib/analytics'
import { showToast } from '@/lib/toast'

const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(v || 0))

const fmtData = (s) => {
  if (!s) return '—'
  const txt = String(s)
  if (txt.includes('/') && /^\d{2}\/\d{2}\/\d{4}$/.test(txt)) return txt
  const cleaned = txt.split('T')[0]
  const [Y, M, D] = cleaned.split('-')
  if (!Y || !M || !D) return txt
  return `${D}/${M}/${Y}`
}

const parseDate = (s) => {
  if (!s) return new Date(8640000000000000)
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
    const [dd, mm, yyyy] = t.split('/')
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  }
  const [Y, M, D] = t.split('T')[0].split('-')
  return (Y && M && D) ? new Date(Number(Y), Number(M) - 1, Number(D)) : new Date(8640000000000000)
}

function Badge({ children, kind = 'neutral' }) {
  const styles = {
    neutral: { bg: 'var(--surface)', color: 'var(--text)' },
    success: { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' },
    danger:  { bg: '#fde2e1', color: '#d64545' },
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

function buildWhats(number, msg) {
  const digits = String(number || '').replace(/\D+/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
}

export default function PagamentoFacil({
  parcelaFoco,
  proximas = [],
  historico = [],
  isAtraso = () => false,
  contrato
}) {
  const [copied, setCopied] = useState(false)
  const [qrSrc, setQrSrc] = useState(null)
  const [showAllNext, setShowAllNext] = useState(false)
  const warnedRef = useRef(false)
  const { token } = useAuth.getState()

  const foco = parcelaFoco
  const temFoco = Boolean(foco)
  const focoAtraso = temFoco && isAtraso(foco)

  const proximasOrdenadas = useMemo(() => {
    const arr = Array.isArray(proximas) ? [...proximas] : []
    return arr.sort((a, b) => parseDate(a?.dataVencimento) - parseDate(b?.dataVencimento))
  }, [proximas])

  const proximasVisiveis = useMemo(() => {
    if (showAllNext) return proximasOrdenadas
    return proximasOrdenadas.slice(0, 5)
  }, [showAllNext, proximasOrdenadas])

  /* Guard rails */
  useEffect(() => {
    if (warnedRef.current) return
    if (!contrato) {
      showToast('Contrato não encontrado para o pagamento.', null, null, 6000)
    } else {
      const wa = contrato?.unidade?.whatsapp || contrato?.contatos?.celular
      if (!wa) showToast('Nenhum WhatsApp configurado na unidade.', null, null, 6000)
    }
    if (temFoco) {
      if (!foco.valorParcela || foco.valorParcela <= 0) showToast('Valor da parcela inválido.', null, null, 6000)
      if (!foco.dataVencimento) showToast('Data de vencimento ausente.', null, null, 6000)
      if (!foco.pixQrcode && !foco.urlBoleto && !foco.linkPagamento)
        showToast('Nenhuma forma de pagamento disponível no momento.', null, null, 6000)
    }
    warnedRef.current = true
  }, [foco, contrato, temFoco])

  // QR
  useEffect(() => {
    let revoke = null
    setQrSrc(null)
    const img = foco?.pixImage
    const code = foco?.pixQrcode
    if (!img && !code) return

    if (img && !/^https?:\/\//i.test(img)) {
      const src = img.startsWith('data:') ? img : `data:image/png;base64,${img}`
      setQrSrc(src)
      return
    }

    if (img && /^https?:\/\//i.test(img)) {
      ;(async () => {
        try {
          const r = await fetch(img, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          })
          if (!r.ok) throw new Error('QR fetch fail')
          const blob = await r.blob()
          const url = URL.createObjectURL(blob)
          revoke = url
          setQrSrc(url)
        } catch {
          showToast('Não foi possível carregar o QR Code do pagamento.')
        }
      })()
      return
    }

    if (code) {
      QRCode.toDataURL(code, { width: 240, margin: 1 }, (err, url) => {
        if (!err) setQrSrc(url)
        else showToast('Erro ao gerar o QR Code PIX.')
      })
    }

    return () => { if (revoke) URL.revokeObjectURL(revoke) }
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
      showToast('Código PIX copiado com sucesso!')
    } catch {
      showToast('Falha ao copiar o código PIX.')
    } finally {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      track('pix_copied', { duplicataId: foco?.id || foco?.numero })
    }
  }

  function abrirRenegociacaoWhats() {
    const wa = contrato?.unidade?.whatsapp || contrato?.contatos?.celular
    const msg =
      `Olá! Gostaria de renegociar meu contrato #${contrato?.numeroContrato || contrato?.id}. ` +
      `Estou com dificuldades para pagar a(s) parcela(s) em aberto e preciso de opções.`
    const href = buildWhats(wa, msg)
    if (href) {
      track('renegociar_whatsapp', { contratoId: contrato?.id || contrato?.numeroContrato })
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      showToast('Canal de WhatsApp indisponível.')
    }
  }

  return (
    <div className="card p-5" aria-live="polite">
      <h3 className="text-lg font-semibold mb-2">Pagamento</h3>

      {!temFoco ? (
        <div className="p-4 rounded border" style={{ borderColor: 'var(--c-border)' }}>
          <p className="font-medium">Tudo em dia!</p>
          <p className="text-sm" style={{ color: 'var(--text)' }}>Nenhuma parcela aberta no momento.</p>
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
              {focoAtraso && (
                <p className="text-xs mt-1" style={{ color: 'var(--text)' }}>
                  Multa/juros podem ser aplicados.{' '}
                  <button className="btn-link text-xs" onClick={abrirRenegociacaoWhats} aria-label="Renegociar pelo WhatsApp">
                    Renegociar pelo WhatsApp
                  </button>
                </p>
              )}
            </div>

            {qrSrc && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={qrSrc}
                  alt="QR Code PIX"
                  className="w-40 h-40 rounded"
                  style={{ border: '1px solid var(--c-border)' }}
                />
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label="Ações de pagamento">
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
        </>
      )}

      {/* Próximas parcelas resumidas com toggle */}
      {proximasOrdenadas.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>Próximas parcelas</p>
            {proximasOrdenadas.length > 5 && (
              <button className="btn-link text-xs" onClick={() => setShowAllNext(v => !v)}>
                {showAllNext ? 'Ver menos' : 'Ver todas'}
              </button>
            )}
          </div>

          <ul className="space-y-2">
            {proximasVisiveis.map((dup) => {
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
                          target="_blank" rel="noreferrer"
                          href={dup.urlBoleto}
                          onClick={() => track('boleto_opened', { duplicataId: dup?.id || dup?.numero })}
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

      {/* Histórico (mantido) */}
      {historico.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm">Histórico de pagamentos</summary>
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
