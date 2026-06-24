import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, QrCode, Receipt, Copy, ExternalLink } from 'lucide-react'
import QRCode from 'qrcode'
import { track } from '@/lib/analytics'
import { showToast } from '@/lib/toast'
import {
  fmtBRL,
  fmtData,
  isAtrasoPorData,
  venceEmLabel,
  parcelKey,
  buildWhats,
  paymentCardShadow,
  parseDate,
} from '@/lib/paymentUtils'
import { MemberSection } from '@/components/member/MemberGroupedList'

function PaymentActionButton({ children, primary, onClick, href, className = '' }) {
  const base =
    'inline-flex w-full items-center justify-center gap-2 min-h-[50px] rounded-[14px] text-[15px] font-semibold transition active:scale-[0.98]'

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`${base} border ${className}`}
        style={{
          borderColor: 'var(--separator, var(--c-border))',
          color: 'var(--primary)',
          background: 'var(--surface)',
        }}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${className}`}
      style={
        primary
          ? { background: 'var(--primary)', color: 'var(--on-primary, #fff)' }
          : {
              border: '0.5px solid var(--separator, var(--c-border))',
              color: 'var(--primary)',
              background: 'var(--surface)',
            }
      }
    >
      {children}
    </button>
  )
}

export default function MemberPaymentsHub({
  contrato,
  parcelaFoco,
  proximas = [],
  isAtraso,
  mostrarValores = true,
}) {
  const [copiedFoco, setCopiedFoco] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [qrSrc, setQrSrc] = useState(null)
  const [showAllNext, setShowAllNext] = useState(false)
  const qrHostRef = useRef(null)
  const ioRef = useRef(null)

  const foco = parcelaFoco
  const temFoco = Boolean(foco)
  const focoAtraso = temFoco && isAtraso?.(foco) && isAtrasoPorData(foco)

  const proximasOrdenadas = useMemo(() => {
    const arr = Array.isArray(proximas) ? [...proximas] : []
    return arr.sort((a, b) => parseDate(a?.dataVencimento) - parseDate(b?.dataVencimento))
  }, [proximas])

  const proximasVisiveis = useMemo(
    () => (showAllNext ? proximasOrdenadas : proximasOrdenadas.slice(0, 5)),
    [showAllNext, proximasOrdenadas]
  )

  const totalEmAtraso = useMemo(() => {
    const all = [foco, ...proximasOrdenadas].filter(Boolean).filter((p) => {
      const status = String(p.status || '').toUpperCase()
      return status !== 'PAGA' && isAtraso?.(p) && isAtrasoPorData(p)
    })
    return all.reduce((sum, it) => sum + Number(it?.valorParcela || 0), 0)
  }, [foco, proximasOrdenadas, isAtraso])

  useEffect(() => {
    setQrSrc(null)
    if (!foco?.pixQrcode || !qrHostRef.current) return

    ioRef.current?.disconnect?.()
    ioRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          QRCode.toDataURL(
            foco.pixQrcode,
            { width: 280, margin: 1, errorCorrectionLevel: 'M' },
            (err, url) => {
              if (!err && url) setQrSrc(url)
              else showToast('Erro ao gerar o QR Code PIX.')
            }
          )
          ioRef.current?.disconnect?.()
        }
      },
      { rootMargin: '120px' }
    )
    ioRef.current.observe(qrHostRef.current)
    return () => ioRef.current?.disconnect?.()
  }, [foco])

  async function copyPix(text, eventName, id) {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Código PIX copiado!')
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
      track(eventName, { duplicataId: id || foco?.id || foco?.numero })
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

  if (!temFoco && totalEmAtraso === 0 && proximasOrdenadas.length === 0) {
    return (
      <div
        className="rounded-[20px] px-4 py-8 text-center mb-5"
        style={{ background: 'var(--surface)', boxShadow: paymentCardShadow }}
      >
        <span
          className="inline-flex h-12 w-12 items-center justify-center rounded-full mb-3"
          style={{
            background: 'color-mix(in srgb, #30d158 14%, var(--surface))',
            color: '#248a3d',
          }}
        >
          <Receipt size={22} strokeWidth={1.85} />
        </span>
        <p className="text-[17px] font-semibold">Nenhuma cobrança em aberto</p>
        <p className="text-[14px] mt-2 leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
          Quando houver uma nova mensalidade, você poderá pagar por PIX ou boleto aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5" aria-live="polite">
      {temFoco ? (
        <section aria-label="Pagar mensalidade prioritária">
          <p
            className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Pagar agora
          </p>
          <div
            className="rounded-[20px] overflow-hidden p-4 space-y-3"
            style={{ background: 'var(--surface)', boxShadow: paymentCardShadow }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Parcela #{foco?.numeroDuplicata || foco?.numero || '—'}
                </p>
                {mostrarValores ? (
                  <p className="text-[22px] font-bold tabular-nums tracking-tight mt-0.5">
                    {fmtBRL(foco?.valorParcela)}
                  </p>
                ) : (
                  <p className="text-[22px] font-bold mt-0.5">••••••</p>
                )}
              </div>
              {focoAtraso ? (
                <span
                  className="text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0"
                  style={{
                    background: 'color-mix(in srgb, #ff453a 12%, var(--surface))',
                    color: '#c93400',
                  }}
                >
                  Atrasada
                </span>
              ) : null}
            </div>

            <div className="grid gap-2">
              {foco?.pixQrcode ? (
                <PaymentActionButton
                  primary
                  onClick={() => copyPix(foco.pixQrcode, 'pix_copied', null)}
                >
                  <Copy size={17} strokeWidth={2.25} />
                  {copiedFoco ? 'PIX copiado' : 'Copiar código PIX'}
                </PaymentActionButton>
              ) : null}
              {foco?.urlBoleto ? (
                <a
                  href={foco.urlBoleto}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 min-h-[50px] rounded-[14px] text-[15px] font-semibold transition active:scale-[0.98] border"
                  style={{
                    borderColor: 'var(--separator, var(--c-border))',
                    color: 'var(--primary)',
                    background: 'var(--surface)',
                  }}
                  onClick={() => track('boleto_opened', { duplicataId: foco?.id || foco?.numero })}
                >
                  <ExternalLink size={16} strokeWidth={2.25} />
                  Abrir boleto
                </a>
              ) : null}
            </div>

            {focoAtraso ? (
              <p className="text-[13px] leading-snug pt-1" style={{ color: 'var(--text-muted)' }}>
                Multa e juros podem ser aplicados.{' '}
                <button
                  type="button"
                  className="font-semibold"
                  style={{ color: 'var(--primary)' }}
                  onClick={abrirRenegociacaoWhats}
                >
                  Renegociar pelo WhatsApp
                </button>
              </p>
            ) : null}
          </div>

          {foco?.pixQrcode ? (
            <figure
              ref={qrHostRef}
              className="mt-3 rounded-[20px] px-4 py-5 flex flex-col items-center"
              style={{ background: 'var(--surface)', boxShadow: paymentCardShadow }}
            >
              <div className="flex items-center gap-2 mb-3 self-start">
                <QrCode size={16} style={{ color: 'var(--primary)' }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                  QR Code PIX
                </span>
              </div>
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="QR Code PIX"
                  className="rounded-[16px]"
                  style={{
                    width: 'min(240px, 68vw)',
                    height: 'auto',
                    border: '0.5px solid var(--separator, var(--c-border))',
                  }}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-[16px] text-[13px] text-center px-4 animate-pulse"
                  style={{
                    width: 'min(240px, 68vw)',
                    height: 'min(240px, 68vw)',
                    color: 'var(--text-muted)',
                    background: 'color-mix(in srgb, var(--text) 4%, var(--surface))',
                  }}
                >
                  Gerando QR Code…
                </div>
              )}
              <figcaption
                className="text-[12px] mt-3 text-center max-w-[280px] leading-snug"
                style={{ color: 'var(--text-muted)' }}
              >
                Escaneie com o app do seu banco para pagar via PIX em segundos.
              </figcaption>
            </figure>
          ) : null}
        </section>
      ) : null}

      {proximasOrdenadas.length > 0 ? (
        <MemberSection title="Próximas parcelas">
          <ul
            className="rounded-[20px] overflow-hidden divide-y"
            style={{
              background: 'var(--surface)',
              boxShadow: paymentCardShadow,
              border: '0.5px solid var(--separator, var(--c-border))',
            }}
          >
            {proximasVisiveis.map((dup, idx) => {
              const dupKey = parcelKey(dup, idx)
              const atrasada = isAtraso?.(dup) && isAtrasoPorData(dup)

              return (
                <li
                  key={dupKey}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 min-h-[64px]"
                  style={
                    atrasada
                      ? {
                          borderLeft: '3px solid #ff453a',
                          paddingLeft: '13px',
                        }
                      : undefined
                  }
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[15px] tabular-nums" style={{ color: 'var(--text)' }}>
                      #{dup?.numeroDuplicata || dup?.numero}
                      {mostrarValores ? ` · ${fmtBRL(dup?.valorParcela)}` : ''}
                    </p>
                    <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {venceEmLabel(dup)} {fmtData(dup?.dataVencimento)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {dup?.urlBoleto ? (
                      <a
                        className="text-[12px] font-semibold min-h-[34px] px-3 inline-flex items-center rounded-full border active:opacity-80"
                        style={{
                          borderColor: 'var(--separator, var(--c-border))',
                          color: 'var(--primary)',
                        }}
                        target="_blank"
                        rel="noreferrer"
                        href={dup.urlBoleto}
                        onClick={() => track('boleto_opened', { duplicataId: dupKey })}
                      >
                        Boleto
                      </a>
                    ) : null}
                    {dup?.pixQrcode ? (
                      <button
                        type="button"
                        className="text-[12px] font-semibold min-h-[34px] px-3 rounded-full active:opacity-80"
                        style={{
                          background: 'var(--primary)',
                          color: 'var(--on-primary, #fff)',
                        }}
                        onClick={() => copyPix(dup.pixQrcode, 'pix_copied_list', dupKey)}
                      >
                        {copiedId === dupKey ? 'Copiado' : 'PIX'}
                      </button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
          {proximasOrdenadas.length > 5 ? (
            <button
              type="button"
              className="mt-2 flex items-center gap-1 text-[13px] font-semibold min-h-[44px] px-1"
              style={{ color: 'var(--primary)' }}
              onClick={() => setShowAllNext((v) => !v)}
            >
              {showAllNext ? 'Ver menos' : `Ver todas (${proximasOrdenadas.length})`}
              <ChevronDown
                size={16}
                className={`transition-transform ${showAllNext ? 'rotate-180' : ''}`}
              />
            </button>
          ) : null}
        </MemberSection>
      ) : null}
    </div>
  )
}
