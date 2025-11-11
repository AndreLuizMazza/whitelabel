// src/components/PagamentoFacil.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import useAuth from '@/store/auth'
import QRCode from 'qrcode'
import { track } from '@/lib/analytics'
import { showToast } from '@/lib/toast'

/* ========================= helpers ========================= */
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
    neutral: { bg: 'var(--surface)', color: 'var(--text)', ring: 'var(--c-border)' },
    success: { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)', ring: 'var(--primary-20, var(--c-border))' },
    danger:  { bg: '#fde2e1', color: '#d64545', ring: '#f7c2bf' },
    warn:    { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)', ring: 'var(--primary-20, var(--c-border))' },
    info:    { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)', ring: 'var(--primary-20, var(--c-border))' },
  }
  const s = styles[kind] || styles.neutral
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.ring}` }}
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

/* ========================= componente ========================= */
export default function PagamentoFacil({
  parcelaFoco,
  proximas = [],
  historico = [],
  isAtraso = () => false,
  contrato
}) {
  // estados “premium UX”
  const [copiedFoco, setCopiedFoco] = useState(false) // apenas botão do foco
  const [copiedId, setCopiedId] = useState(null)      // item específico da lista
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

  /* ========================= guard rails ========================= */
  useEffect(() => {
    if (warnedRef.current) return
    if (!contrato) {
      showToast('Contrato não encontrado para o pagamento.', null, null, 6000)
    }
    if (temFoco) {
      if (!foco.valorParcela || foco.valorParcela <= 0)
        showToast('Valor da parcela inválido.', null, null, 6000)
      if (!foco.dataVencimento)
        showToast('Data de vencimento ausente.', null, null, 6000)
      if (!foco.pixQrcode && !foco.urlBoleto)
        showToast('Nenhuma forma de pagamento disponível no momento.', null, null, 6000)
    }
    warnedRef.current = true
  }, [foco, contrato, temFoco])

  /* ========================= QR foco auto ========================= */
  useEffect(() => {
    setQrSrc(null)
    const code = foco?.pixQrcode
    if (!code) return
    QRCode.toDataURL(code, { width: 260, margin: 1, errorCorrectionLevel: 'M' }, (err, url) => {
      if (!err && url) setQrSrc(url)
      else showToast('Erro ao gerar o QR Code PIX.')
    })
  }, [foco])

  /* ========================= ações ========================= */
  const acoesFoco = useMemo(() => {
    if (!foco) return []
    const a = []
    if (foco.urlBoleto) a.push({ tipo: 'boleto', label: 'Abrir boleto', href: foco.urlBoleto })
    if (foco.pixQrcode) a.push({ tipo: 'pix', label: 'Copiar código PIX', copy: foco.pixQrcode })
    return a
  }, [foco])

  async function copyFoco(text) {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Código PIX copiado com sucesso!')
    } catch {
      showToast('Falha ao copiar o código PIX.')
    } finally {
      setCopiedFoco(true)
      setTimeout(() => setCopiedFoco(false), 1600)
      track('pix_copied', { duplicataId: foco?.id || foco?.numero })
    }
  }

  async function copyDaLista(text, dupKey) {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Código PIX copiado com sucesso!')
    } catch {
      showToast('Falha ao copiar o código PIX.')
    } finally {
      setCopiedId(dupKey)
      setTimeout(() => setCopiedId(null), 1600)
      track('pix_copied_list', { duplicataId: dupKey })
    }
  }

  function abrirRenegociacaoWhats() {
    const wa = contrato?.unidade?.whatsapp || contrato?.contatos?.celular
    const msg =
      `Olá! Gostaria de renegociar meu contrato #${contrato?.numeroContrato || contrato?.id}. ` +
      `Estou com dificuldades para pagar a(s) parcela(s) em aberto e preciso de opções.`
    const href = buildWhats(wa, msg)
    if (href) window.open(href, '_blank', 'noopener,noreferrer')
    else showToast('Canal de WhatsApp indisponível.')
  }

  /* ========================= UI ========================= */
  return (
    <section
      className="card rounded-2xl p-5 border"
      style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}
      aria-live="polite"
    >
      <header className="flex items-start justify-between gap-4 mb-2">
        {/* bloco título/valor */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
              Parcela <span className="font-bold">#{foco?.numeroDuplicata || foco?.numero || '—'}</span>
            </h3>
            {temFoco ? (
              focoAtraso ? <Badge kind="danger">EM ATRASO</Badge> : <Badge kind="warn">ABERTA</Badge>
            ) : null}
          </div>

          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold leading-tight" style={{ color: 'var(--text)' }}>
              {temFoco ? fmtBRL(foco?.valorParcela) : fmtBRL(0)}
            </p>
          </div>

          {temFoco && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Vencimento: <span className="font-medium" style={{ color: 'var(--text)' }}>{fmtData(foco?.dataVencimento)}</span>
            </p>
          )}

          {temFoco && focoAtraso && (
            <p className="text-[12px] mt-2" style={{ color: 'var(--text-muted)' }}>
              Multa/juros podem ser aplicados.{' '}
              <button
                className="btn-link text-[12px]"
                onClick={abrirRenegociacaoWhats}
                aria-label="Renegociar pelo WhatsApp"
              >
                Renegociar pelo WhatsApp
              </button>
            </p>
          )}
        </div>

        {/* bloco QR com legenda */}
        {qrSrc && (
          <figure className="flex flex-col items-center shrink-0">
            <img
              src={qrSrc}
              alt="QR Code PIX"
              className="w-40 h-40 rounded-xl shadow-sm"
              style={{ border: '1px solid var(--c-border)', background: 'var(--surface-alt)' }}
            />
            <figcaption className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Aponte a câmera do seu banco
            </figcaption>
          </figure>
        )}
      </header>

      {/* ações foco */}
      {temFoco ? (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Ações de pagamento">
          {foco.urlBoleto && (
            <a
              href={foco.urlBoleto}
              target="_blank"
              rel="noreferrer"
              className="btn-primary h-11 inline-flex items-center justify-center rounded-full"
            >
              Abrir boleto
            </a>
          )}

          {foco.pixQrcode && (
            <button
              className="btn-outline h-11 rounded-full"
              onClick={() => copyFoco(foco.pixQrcode)}
              aria-live="polite"
              aria-label="Copiar código PIX"
            >
              {copiedFoco ? '✅ Copiado!' : 'Copiar código PIX'}
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl mt-3" style={{ border: '1px dashed var(--c-border)' }}>
          <p className="font-medium" style={{ color: 'var(--text)' }}>Tudo em dia!</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma parcela aberta no momento.</p>
        </div>
      )}

      {/* separador */}
      <hr className="my-5 border-0 h-px" style={{ background: 'var(--c-border)' }} />

      {/* próximas parcelas */}
      {proximasOrdenadas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Próximas parcelas</h4>
            {proximasOrdenadas.length > 5 && (
              <button className="btn-link text-xs" onClick={() => setShowAllNext(v => !v)}>
                {showAllNext ? 'Ver menos' : 'Ver todas'}
              </button>
            )}
          </div>

          <ul className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--c-border)' }}>
            {proximasVisiveis.map((dup, idx) => {
              const atrasada = isAtraso(dup)
              const dupKey = dup?.id ?? dup?.numero ?? dup?.numeroDuplicata ?? `${idx}-${dup?.dataVencimento}`

              // borda lateral por status
              const leftBorder = atrasada ? '#d64545' : 'color-mix(in srgb, var(--primary) 60%, transparent)'

              return (
                <li
                  key={dupKey}
                  className="flex items-center justify-between gap-3 p-3 sm:p-3.5 hover:shadow-[0_1px_0_0_var(--c-border)] transition-colors"
                  style={{
                    background: 'var(--surface)',
                    borderTop: idx === 0 ? 'none' : `1px solid var(--c-border)`,
                    borderLeft: `3px solid ${leftBorder}`
                  }}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--text)' }}>
                      #{dup?.numeroDuplicata || dup?.numero} • {fmtBRL(dup?.valorParcela)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Vence em <span className="font-medium" style={{ color: 'var(--text)' }}>{fmtData(dup?.dataVencimento)}</span>
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end sm:flex-nowrap">
                    {dup?.urlBoleto && (
                      <a
                        className="btn-outline text-xs px-3 py-1.5 rounded-full"
                        target="_blank"
                        rel="noreferrer"
                        href={dup.urlBoleto}
                        onClick={() => track('boleto_opened', { duplicataId: dupKey })}
                      >
                        Boleto
                      </a>
                    )}
                    {dup?.pixQrcode && (
                      <button
                        className="btn-outline text-xs px-3 py-1.5 rounded-full"
                        onClick={() => copyDaLista(dup.pixQrcode, dupKey)}
                        aria-live="polite"
                        aria-label={`Copiar código PIX da duplicata ${dup?.numero || dup?.numeroDuplicata}`}
                      >
                        {copiedId === dupKey ? '✅ Copiado!' : 'PIX'}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* histórico (opcional, mantido) */}
      {historico.length > 0 && (
        <details className="mt-6 group">
          <summary className="cursor-pointer text-sm font-medium select-none"
                   style={{ color: 'var(--text)' }}>
            Histórico de pagamentos
          </summary>
          <ul className="mt-3 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--c-border)' }}>
            {historico.map((dup, i) => {
              const dupKey = dup?.id ?? dup?.numero ?? dup?.numeroDuplicata ?? `hist-${i}`
              const status = String(dup?.status || '').toUpperCase()
              return (
                <li key={dupKey}
                    className="flex items-center justify-between p-3 sm:p-3.5"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--c-border)' }}>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text)' }}>
                      #{dup?.numeroDuplicata || dup?.numero} • {fmtBRL(dup?.valorParcela)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Venc.: {fmtData(dup?.dataVencimento)}
                      {dup?.dataRecebimento ? ` • Pago em ${fmtData(dup.dataRecebimento)}` : ''}
                    </div>
                  </div>
                  <Badge kind={status === 'PAGA' ? 'success' : 'info'}>{status || '—'}</Badge>
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </section>
  )
}
