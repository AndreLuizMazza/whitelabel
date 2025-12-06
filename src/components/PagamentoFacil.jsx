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
    neutral: {
      bg: 'color-mix(in srgb, var(--surface) 90%, var(--background) 10%)',
      color: 'var(--text-muted)',
      ring: 'var(--c-border)'
    },
    success: {
      bg: 'color-mix(in srgb, var(--primary) 16%, transparent)',
      color: 'var(--primary)',
      ring: 'var(--primary-20, var(--c-border))'
    },
    danger:  {
      bg: '#fde2e1',
      color: '#b42318',
      ring: '#f7c2bf'
    },
    warn:    {
      bg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
      color: 'var(--primary)',
      ring: 'var(--primary-20, var(--c-border))'
    },
    info:    {
      bg: 'color-mix(in srgb, var(--primary) 12%, transparent)',
      color: 'var(--primary)',
      ring: 'var(--primary-20, var(--c-border))'
    },
  }
  const s = styles[kind] || styles.neutral
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-none whitespace-nowrap"
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
    () => (showAllNext ? proximasOrdenadas : proximasOrdenadas.slice(0, 3)),
    [showAllNext, proximasOrdenadas]
  )

  // total apenas do que estiver em atraso (foco + próximas)
  const totalEmAtraso = useMemo(() => {
    const all = [foco, ...proximasOrdenadas]
      .filter(Boolean)
      .filter(p => {
        const status = String(p.status || '').toUpperCase()
        return status !== 'PAGA' && isAtraso(p)
      })
    return all.reduce((sum, it) => sum + Number(it?.valorParcela || 0), 0)
  }, [foco, proximasOrdenadas, isAtraso])

  const hasAtrasoGlobal = totalEmAtraso > 0

  const currentYear = new Date().getFullYear()

  // histórico apenas do ano vigente (considera primeiro dataRecebimento, depois vencimento)
  const historicoAno = useMemo(
    () =>
      Array.isArray(historico)
        ? historico.filter((dup) => {
            const baseDate =
              dup?.dataRecebimento || dup?.dataVencimento || null
            if (!baseDate) return false
            return parseDate(baseDate).getFullYear() === currentYear
          })
        : [],
    [historico, currentYear]
  )

  /* ========================= header copy dinâmico ========================= */
  const headerTitle = (() => {
    if (!temFoco) {
      return 'Situação das suas mensalidades'
    }
    if (focoAtraso) {
      return 'Mensalidade em atraso'
    }
    if (urgente) {
      return 'Mensalidade com vencimento próximo'
    }
    return 'Próxima mensalidade'
  })()

  const headerSubtitle = (() => {
    if (!temFoco && !hasAtrasoGlobal) {
      return 'Você está em dia com suas mensalidades. Assim que houver uma nova cobrança, ela aparecerá aqui com as opções de pagamento.'
    }
    if (!temFoco && hasAtrasoGlobal) {
      return 'Você tem parcelas em atraso. Utilize as opções abaixo para regularizar seus pagamentos com segurança.'
    }
    if (focoAtraso) {
      return 'Organize o pagamento desta parcela para manter seus benefícios ativos e evitar novos encargos.'
    }
    if (urgente) {
      return 'Antecipe o pagamento para evitar juros e manter suas mensalidades sempre em dia.'
    }
    return 'Veja os detalhes da sua próxima cobrança e escolha como deseja pagar.'
  })()

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
    if (foco.pixQrcode) a.push({ tipo: 'pix', label: 'Pagar agora com PIX', copy: foco.pixQrcode })
    return a
  }, [foco])

  async function copy(text, evName, id) {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Código PIX copiado com sucesso!')
    } catch {
      showToast('Falha ao copiar o código PIX.')
    } finally {
      if (id) {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 1600)
      } else {
        setCopiedFoco(true)
        setTimeout(() => setCopiedFoco(false), 1600)
      }
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
      className="card relative overflow-hidden rounded-2xl border p-5 sm:p-6"
      style={{
        borderColor: 'var(--c-border)',
        background:
          'radial-gradient(140% 140% at 0% 0%, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 55%), var(--surface)'
      }}
      aria-live="polite"
    >
      {/* topo tipo “resumo financeiro” */}
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
            Cobranças do seu plano
          </p>
          <h3 className="mt-1 text-lg sm:text-xl font-semibold" style={{ color: 'var(--text)' }}>
            {headerTitle}
          </h3>
          <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {headerSubtitle}
          </p>

          {temFoco && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {focoAtraso ? (
                <Badge kind="danger">Parcela em atraso</Badge>
              ) : urgente ? (
                <Badge kind="danger">Vencimento próximo</Badge>
              ) : (
                <Badge kind="warn">Parcela em aberto</Badge>
              )}

              {contrato?.numeroContrato && (
                <Badge kind="neutral">Contrato #{contrato.numeroContrato}</Badge>
              )}
            </div>
          )}
        </div>

        {/* mostra só se tiver atraso */}
        {totalEmAtraso > 0 && (
          <div className="flex flex-col items-start sm:items-end gap-1">
            <span
              className="text-[11px] uppercase tracking-[0.14em] font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Total em atraso
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text)' }}>
                {fmtBRL(totalEmAtraso)}
              </span>
            </div>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Regularize para manter seus benefícios em dia.
            </span>
          </div>
        )}
      </header>

      {/* bloco principal: foco + QR */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* coluna esquerda: detalhes & ações */}
        <div
          className="rounded-2xl border px-4 py-3.5 sm:px-4.5 sm:py-4"
          style={{
            borderColor: 'var(--c-border)',
            background: 'color-mix(in srgb, var(--surface) 94%, var(--background) 6%)'
          }}
        >
          {temFoco ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="text-xs font-medium uppercase tracking-[0.16em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Mensalidade em destaque
                  </p>
                  <p className="mt-1 text-base font-semibold" style={{ color: 'var(--text)' }}>
                    {fmtBRL(foco?.valorParcela)}
                  </p>
                  <p className="mt-0.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    Vencimento{' '}
                    <span className="font-medium" style={{ color: 'var(--text)' }}>
                      {fmtData(foco?.dataVencimento)}
                    </span>
                  </p>
                </div>
              </div>

              {/* ações foco */}
              <div
                className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2"
                role="group"
                aria-label="Ações de pagamento"
              >
                {acoesFoco.map((a, idx) =>
                  a.href ? (
                    <a
                      key={idx}
                      href={a.href}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline h-11 inline-flex items-center justify-center rounded-full text-sm font-medium"
                    >
                      {a.label}
                    </a>
                  ) : (
                    <button
                      key={idx}
                      className="btn-primary h-11 rounded-full text-sm font-medium"
                      onClick={() => copy(a.copy, 'pix_copied', null)}
                      aria-live="polite"
                      aria-label="Copiar código PIX para pagamento"
                    >
                      {copiedFoco ? '✅ PIX copiado' : a.label}
                    </button>
                  )
                )}
              </div>

              {/* renegociação (atraso) */}
              {focoAtraso && (
                <p className="text-[12px] mt-3" style={{ color: 'var(--text-muted)' }}>
                  Multa e juros podem ser aplicados.{' '}
                  <button className="btn-link text-[12px]" onClick={abrirRenegociacaoWhats}>
                    Renegociar pelo WhatsApp
                  </button>
                </p>
              )}
            </>
          ) : (
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Assim que houver uma nova mensalidade, ela aparecerá aqui com o valor, vencimento
              e opções de pagamento.
            </div>
          )}
        </div>

        {/* coluna direita: QR central + legenda (lazy) */}
        <figure
          ref={qrHostRef}
          className="flex flex-col items-center justify-center rounded-2xl border px-4 py-4 sm:px-5 sm:py-5"
          style={{
            borderColor: 'var(--c-border)',
            background:
              'radial-gradient(120% 120% at 0% 0%, color-mix(in srgb, var(--primary) 16%, transparent) 0%, transparent 60%), var(--surface-alt, var(--surface))'
          }}
        >
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="QR Code PIX"
              className="rounded-xl shadow-sm"
              style={{
                width: 'min(260px, 60vw)',
                height: 'auto',
                border: '1px solid var(--c-border)',
                background: 'var(--surface)'
              }}
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-xl border text-xs"
              style={{
                width: 'min(260px, 60vw)',
                height: 'min(260px, 60vw)',
                borderColor: 'var(--c-border)',
                color: 'var(--text-muted)',
                background: 'color-mix(in srgb, var(--surface) 90%, var(--background) 10%)'
              }}
            >
              {temFoco && foco?.pixQrcode
                ? 'O QR Code será carregado assim que esta área estiver visível.'
                : 'QR Code PIX não disponível para esta parcela.'}
            </div>
          )}

          <figcaption
            className="text-[12px] mt-2 text-center max-w-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Aponte a câmera do app do seu banco para o QR Code para pagar com PIX em poucos segundos.
          </figcaption>
        </figure>
      </div>

      {/* divisor sutil */}
      <hr
        className="my-5 border-0 h-px"
        style={{ background: 'color-mix(in srgb, var(--c-border) 60%, transparent 40%)' }}
      />

      {/* próximas parcelas */}
      {proximasOrdenadas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Próximas parcelas
            </h4>
            {proximasOrdenadas.length > 5 && (
              <button
                className="btn-link text-xs"
                onClick={() => setShowAllNext((v) => !v)}
              >
                {showAllNext ? 'Ver menos' : `Ver todas (${proximasOrdenadas.length})`}
              </button>
            )}
          </div>

          <ul
            className="rounded-2xl overflow-hidden border"
            style={{
              borderColor: 'var(--c-border)',
              background: 'color-mix(in srgb, var(--surface) 96%, var(--background) 4%)'
            }}
          >
            {proximasVisiveis.map((dup, idx) => {
              const atrasada = isAtraso(dup)
              const dupKey =
                dup?.id ?? dup?.numero ?? dup?.numeroDuplicata ?? `${idx}-${dup?.dataVencimento}`
              const leftBorder = atrasada
                ? '#b42318'
                : 'color-mix(in srgb, var(--primary) 60%, transparent)'

              return (
                <li
                  key={dupKey}
                  className="flex items-center justify-between gap-3 p-3 sm:p-3.5 hover:bg-[color-mix(in_srgb,var(--surface)98%,var(--background)2%)] transition-colors"
                  style={{
                    borderTop: idx === 0 ? 'none' : `1px solid var(--c-border)`,
                    borderLeft: `3px solid ${leftBorder}`
                  }}
                >
                  <div className="min-w-0">
                    <p
                      className="font-medium truncate text-sm"
                      style={{ color: 'var(--text)' }}
                    >
                      #{dup?.numeroDuplicata || dup?.numero} • {fmtBRL(dup?.valorParcela)}
                    </p>
                    <p
                      className="text-[12px] mt-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Vence em{' '}
                      <span
                        className="font-medium"
                        style={{ color: 'var(--text)' }}
                      >
                        {fmtData(dup?.dataVencimento)}
                      </span>
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

      {/* histórico (apenas ano vigente) */}
      {historicoAno.length > 0 && (
        <details className="mt-6 group" id="historico-pagamentos">
          <summary
            className="cursor-pointer text-sm font-medium select-none flex items-center justify-between"
            style={{ color: 'var(--text)' }}
          >
            <span>Histórico de pagamentos ({historicoAno.length})</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
             Toque para ver detalhes
            </span>
          </summary>
          <ul
            className="mt-3 rounded-2xl overflow-hidden border"
            style={{
              borderColor: 'var(--c-border)',
              background: 'color-mix(in srgb, var(--surface) 96%, var(--background) 4%)'
            }}
          >
            {historicoAno.map((dup, i) => {
              const dupKey =
                dup?.id ?? dup?.numero ?? dup?.numeroDuplicata ?? `hist-${i}`
              const status = String(dup?.status || '').toUpperCase()
              return (
                <li
                  key={dupKey}
                  className="flex items-center justify-between p-3 sm:p-3.5"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--c-border)' }}
                >
                  <div className="min-w-0">
                    <div
                      className="font-medium text-sm"
                      style={{ color: 'var(--text)' }}
                    >
                      #{dup?.numeroDuplicata || dup?.numero} • {fmtBRL(dup?.valorParcela)}
                    </div>
                    <div
                      className="text-[12px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Venc.: {fmtData(dup?.dataVencimento)}
                      {dup?.dataRecebimento ? ` • Pago em ${fmtData(dup.dataRecebimento)}` : ''}
                    </div>
                  </div>
                  <Badge kind={status === 'PAGA' ? 'success' : 'info'}>
                    {status || '—'}
                  </Badge>
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </section>
  )
}
