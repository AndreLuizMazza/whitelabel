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
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(txt)) return txt
  const [Y, M, D] = txt.split('T')[0].split('-')
  return (Y && M && D) ? `${D}/${M}/${Y}` : txt
}

const parseDate = (s) => {
  if (!s) return new Date(8640000000000000)
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
    const [dd, mm, yyyy] = t.split('/')
    return new Date(+yyyy, +mm - 1, +dd)
  }
  const [Y, M, D] = t.split('T')[0].split('-')
  return (Y && M && D) ? new Date(+Y, +M - 1, +D) : new Date(8640000000000000)
}

function daysUntilDue(d) {
  try {
    const dt = parseDate(d)
    const now = new Date()
    return Math.ceil((dt - now) / (1000 * 60 * 60 * 24))
  } catch { return 99 }
}

function Badge({ children, kind = 'neutral' }) {
  const styles = {
    neutral: { bg: 'var(--surface)', color: 'var(--text)', ring: 'var(--c-border)' },
    success: { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)', ring: 'var(--primary-20, var(--c-border))' },
    danger:  { bg: '#fde2e1', color: '#b42318', ring: '#f7c2bf' },
    warn:    { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)', ring: 'var(--primary-20, var(--c-border))' },
    info:    { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)', ring: 'var(--primary-20, var(--c-border))' },
  }
  const s = styles[kind] || styles.neutral
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold leading-none"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.ring}` }}
    >
      {children}
    </span>
  )
}

const buildWhats = (number, msg) => {
  const digits = String(number || '').replace(/\D+/g, '')
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : null
}

/* ========================= componente ========================= */
export default function PagamentoFacil({
  parcelaFoco,
  proximas = [],
  historico = [],
  isAtraso = () => false,
  contrato
}) {
  const [copiedFoco, setCopiedFoco] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [qrSrc, setQrSrc] = useState(null)
  const [showAllNext, setShowAllNext] = useState(false)
  const warnedRef = useRef(false)
  const ioRef = useRef(null)
  const qrHostRef = useRef(null)

  useAuth((s) => s.token) // mantém store viva

  const foco = parcelaFoco
  const temFoco = Boolean(foco)
  const focoAtraso = temFoco && isAtraso(foco)
  const urgente = temFoco && !focoAtraso && daysUntilDue(foco?.dataVencimento) <= 3

  const proximasOrdenadas = useMemo(() => {
    const arr = Array.isArray(proximas) ? [...proximas] : []
    return arr.sort((a, b) => parseDate(a?.dataVencimento) - parseDate(b?.dataVencimento))
  }, [proximas])

  const proximasVisiveis = useMemo(
    () => (showAllNext ? proximasOrdenadas : proximasOrdenadas.slice(0, 5)),
    [showAllNext, proximasOrdenadas]
  )

  const totalEmAberto = useMemo(() => {
    const pend = [foco, ...proximasOrdenadas]
      .filter(Boolean)
      .filter(p => !p?.status || String(p.status).toUpperCase() !== 'PAGA')
    return pend.reduce((sum, it) => sum + Number(it?.valorParcela || 0), 0)
  }, [foco, proximasOrdenadas])

  /* ========================= guard rails ========================= */
  useEffect(() => {
    if (warnedRef.current) return
    if (!contrato) showToast('Contrato não encontrado para o pagamento.', null, null, 6000)
    if (temFoco) {
      if (!foco.valorParcela || foco.valorParcela <= 0) showToast('Valor da parcela inválido.', null, null, 6000)
      if (!foco.dataVencimento) showToast('Data de vencimento ausente.', null, null, 6000)
      if (!foco.pixQrcode && !foco.urlBoleto) showToast('Nenhuma forma de pagamento disponível no momento.', null, null, 6000)
    }
    warnedRef.current = true
  }, [foco, contrato, temFoco])

  /* ========================= QR: lazy via IntersectionObserver ========================= */
  useEffect(() => {
    setQrSrc(null)
    if (!foco?.pixQrcode) return
    if (!qrHostRef.current) return

    ioRef.current?.disconnect?.()
    ioRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        QRCode.toDataURL(
          foco.pixQrcode,
          { width: 280, margin: 1, errorCorrectionLevel: 'M' },
          (err, url) => { if (!err && url) setQrSrc(url); else showToast('Erro ao gerar o QR Code PIX.') }
        )
        ioRef.current?.disconnect?.()
      }
    }, { rootMargin: '120px' })

    ioRef.current.observe(qrHostRef.current)
    return () => ioRef.current?.disconnect?.()
  }, [foco])

  /* ========================= ações ========================= */
  const acoesFoco = useMemo(() => {
    if (!foco) return []
    const a = []
    if (foco.urlBoleto) a.push({ tipo: 'boleto', label: 'Abrir boleto', href: foco.urlBoleto })
    if (foco.pixQrcode) a.push({ tipo: 'pix', label: 'Copiar código PIX para pagar', copy: foco.pixQrcode })
    return a
  }, [foco])

  async function copy(text, evName, id) {
    try { await navigator.clipboard.writeText(text); showToast('Código PIX copiado com sucesso!') }
    catch { showToast('Falha ao copiar o código PIX.') }
    finally {
      if (id) { setCopiedId(id); setTimeout(() => setCopiedId(null), 1600) }
      else { setCopiedFoco(true); setTimeout(() => setCopiedFoco(false), 1600) }
      track(evName, { duplicataId: id || foco?.id || foco?.numero })
    }
  }

  function abrirRenegociacaoWhats() {
    const wa = contrato?.unidade?.whatsapp || contrato?.contatos?.celular
    const msg =
      `Olá! Gostaria de renegociar meu contrato #${contrato?.numeroContrato || contrato?.id}. ` +
      `Estou com dificuldades para pagar.`
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
      <header className="mb-2">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {temFoco
            ? <>Sua próxima mensalidade — {fmtBRL(foco?.valorParcela)}{' '}
                <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                  (vence {fmtData(foco?.dataVencimento)})
                </span>
              </>
            : 'Sua próxima mensalidade'}
        </h3>

        {temFoco && (
          <div className="mt-1 flex items-center gap-2">
            {focoAtraso
              ? <Badge kind="danger">EM ATRASO</Badge>
              : urgente ? <Badge kind="danger">URGENTE</Badge> : <Badge kind="warn">ABERTA</Badge>}
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Total em aberto: <strong style={{ color: 'var(--text)' }}>{fmtBRL(totalEmAberto)}</strong>
            </span>
          </div>
        )}
      </header>

      {/* QR central + legenda (lazy) */}
      <figure ref={qrHostRef} className="flex flex-col items-center my-2">
        {qrSrc && (
          <img
            src={qrSrc}
            alt="QR Code PIX"
            className="rounded-xl shadow-sm"
            style={{ width: 'min(280px, 40vw)', height: 'auto', border: '1px solid var(--c-border)', background: 'var(--surface-alt)' }}
          />
        )}
        <figcaption className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Pague pelo seu banco apontando a câmera
        </figcaption>
      </figure>

      {/* ações foco */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Ações de pagamento">
        {acoesFoco.map((a, idx) =>
          a.href ? (
            <a key={idx} href={a.href} target="_blank" rel="noreferrer" className="btn-primary h-11 inline-flex items-center justify-center rounded-full">
              {a.label}
            </a>
          ) : (
            <button key={idx} className="btn-outline h-11 rounded-full"
                    onClick={() => copy(a.copy, 'pix_copied', null)} aria-live="polite" aria-label="Copiar código PIX">
              {copiedFoco ? '✅ Copiado!' : a.label}
            </button>
          )
        )}
      </div>

      {/* renegociação (atraso) */}
      {temFoco && focoAtraso && (
        <p className="text-[12px] mt-2" style={{ color: 'var(--text-muted)' }}>
          Multa/juros podem ser aplicados.{' '}
          <button className="btn-link text-[12px]" onClick={abrirRenegociacaoWhats}>Renegociar pelo WhatsApp</button>
        </p>
      )}

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
              const leftBorder = atrasada ? '#b42318' : 'color-mix(in srgb, var(--primary) 60%, transparent)'

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
                        onClick={() => copy(dup.pixQrcode, 'pix_copied_list', dupKey)}
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

      {/* histórico (opcional) */}
      {historico.length > 0 && (
        <details className="mt-6 group">
          <summary className="cursor-pointer text-sm font-medium select-none"
                   style={{ color: 'var(--text)' }}>
            Histórico de pagamentos ({historico.length})
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
