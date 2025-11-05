// src/pages/Pagamentos.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '@/lib/api.js'
import { QrCode, Barcode, CalendarClock, Copy, Check, X } from 'lucide-react'

/* ===== Utils ===== */
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
function fmtValor(v) {
  const n = Number(v ?? 0)
  return BRL.format(isFinite(n) ? n : 0)
}
function parseDateLike(d) {
  if (!d) return null
  try {
    const date = typeof d === 'string' && d.length <= 10 ? new Date(`${d}T00:00:00`) : new Date(d)
    return isNaN(date) ? null : date
  } catch {
    return null
  }
}
function fmtData(d) {
  const date = parseDateLike(d)
  return date ? date.toLocaleDateString('pt-BR') : '—'
}

function SkeletonRow() {
  return (
    <div
      className="rounded-2xl border p-4 animate-pulse"
      style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}
    >
      <div className="h-4 w-48 rounded" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)' }} />
      <div className="mt-3 h-6 w-24 rounded" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }} />
      <div className="mt-3 h-9 w-40 rounded" style={{ background: 'color-mix(in srgb, var(--primary) 14%, transparent)' }} />
    </div>
  )
}

/* ===== Componente ===== */
export default function Pagamentos() {
  const { id } = useParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState(null)

  // Estado do modal de PIX
  const [pixModal, setPixModal] = useState({
    open: false,
    pixQrcode: '',
    pixImage: '',
    numero: '',
    venc: '',
    valor: '',
  })

  // refs para acessibilidade
  const closeBtnRef = useRef(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        // BFF faz fallback de token de cliente
        const { data } = await api.get(`/api/v1/contratos/${id}/pagamentos`)
        const list = Array.isArray(data) ? data : (data?.content || data?.rows || [])
        if (active) setItems(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error(e)
        const msg =
          e?.response?.data?.error ||
          e?.response?.statusText ||
          e?.message ||
          'Erro desconhecido'
        if (active) setError('Falha ao carregar pagamentos: ' + msg)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id])

  // === Normalização: somente não pagas, priorizando em atraso + próxima a vencer ===
  const { atrasadas, parcelaDaVez } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const norm = (p) => {
      const statusRaw = (p.status ?? p.situacao ?? '').toString().toUpperCase()
      const vencDate = parseDateLike(p.dataVencimento ?? p.vencimento)
      const valor = Number(p.valorParcela ?? p.valor ?? 0)
      const valorRecebido = Number(p.valorRecebido ?? 0)
      const dataRecebimento = parseDateLike(p.dataRecebimento)

      const pago =
        /(PAGO|LIQ|BAIXA|RECEB|QUIT|COMPENS|CANCEL)/i.test(statusRaw) ||
        valorRecebido >= valor ||
        Boolean(dataRecebimento)

      const emAtraso = !pago && vencDate && vencDate.getTime() < today.getTime()
      return { raw: p, pago, emAtraso, ts: vencDate ? vencDate.getTime() : Infinity }
    }

    const enriched = items.map(norm)
    const naoPagas = enriched.filter((x) => !x.pago)
    const atrasadas = naoPagas.filter((x) => x.emAtraso).sort((a, b) => a.ts - b.ts)
    const futuras = naoPagas.filter((x) => !x.emAtraso).sort((a, b) => a.ts - b.ts)
    return { atrasadas, parcelaDaVez: futuras[0] || null }
  }, [items])

  /* ===== Ações PIX ===== */
  async function copiarPix(qrcode, idToFlag) {
    try {
      await navigator.clipboard.writeText(qrcode)
      setCopiado(idToFlag ?? 'modal')
      setTimeout(() => setCopiado(null), 2500)
    } catch {
      alert('Não foi possível copiar o código PIX automaticamente.')
    }
  }

  function abrirModalPIX(p) {
    const numero = p.numeroDuplicata ?? p.numero ?? '—'
    const venc = fmtData(p.dataVencimento ?? p.vencimento)
    const valor = fmtValor(p.valorParcela ?? p.valor)
    setPixModal({
      open: true,
      pixQrcode: p.pixQrcode || '',
      pixImage: p.pixImage || '',
      numero,
      venc,
      valor,
    })
    // foco no botão fechar após render
    setTimeout(() => closeBtnRef.current?.focus(), 0)
  }

  function fecharModalPIX() {
    setPixModal((m) => ({ ...m, open: false }))
  }

  // fechar com Esc
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && pixModal.open) fecharModalPIX()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pixModal.open])

  /* ===== UI Auxiliares ===== */
  function Chip({ children, tone = 'default', icon }) {
    const bg =
      tone === 'danger'
        ? 'color-mix(in srgb, var(--primary) 16%, transparent)'
        : tone === 'info'
          ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
          : 'color-mix(in srgb, var(--primary) 10%, transparent)'
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full"
        style={{ background: bg, color: 'var(--text)' }}
      >
        {icon} {children}
      </span>
    )
  }

  function CTAGroup({ p }) {
    const hasPix = Boolean(p.pixQrcode)
    const hasBoleto = Boolean(p.urlBoleto)

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {hasPix && (
          <>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={() => copiarPix(p.pixQrcode, p.id)}
            >
              {copiado === p.id ? <Check size={16} /> : <Copy size={16} />}
              {copiado === p.id ? 'Copiado!' : 'Copiar código PIX'}
            </button>

            <button
              className="btn-outline inline-flex items-center gap-2"
              onClick={() => abrirModalPIX(p)}
            >
              <QrCode size={16} />
              Ver QR Code
            </button>
          </>
        )}

        {hasBoleto && (
          <a
            className="btn-outline inline-flex items-center gap-2"
            href={p.urlBoleto}
            target="_blank"
            rel="noreferrer"
          >
            <Barcode size={16} /> 2ª via do boleto
          </a>
        )}

        {!hasPix && !hasBoleto && (
          <div
            className="text-sm rounded-lg border px-3 py-2"
            style={{
              borderColor: 'color-mix(in srgb, var(--primary) 25%, transparent)',
              background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
              color: 'var(--text)'
            }}
          >
            Métodos de pagamento indisponíveis no momento. Tente mais tarde ou contate o atendimento.
          </div>
        )}
      </div>
    )
  }

  function ParcelaCard({ p, idx, tone = 'default', rotulo }) {
    const numero = p.numeroDuplicata ?? p.numero ?? idx + 1
    const venc = fmtData(p.dataVencimento ?? p.vencimento)
    const valor = fmtValor(p.valorParcela ?? p.valor)

    const borderColor =
      tone === 'danger'
        ? 'color-mix(in srgb, var(--primary) 40%, transparent)'
        : 'color-mix(in srgb, var(--primary) 28%, transparent)'
    const bgStripe =
      tone === 'danger'
        ? 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, transparent), transparent 60%)'
        : 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 6%, transparent), transparent 60%)'

    return (
      <div
        className="rounded-2xl border p-5 shadow-sm"
        style={{ borderColor: borderColor, background: `var(--surface)` }}
      >
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: bgStripe, maskImage: 'linear-gradient(to bottom, black, transparent 70%)' }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">Parcela {numero}</span>
                {rotulo && (
                  <Chip tone={tone} icon={tone === 'danger' ? <span aria-hidden>⚠️</span> : <QrCode size={14}/>}>
                    {rotulo}
                  </Chip>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
                <CalendarClock size={16} aria-hidden />
                Vencimento: <strong>{venc}</strong>
              </div>

              <div className="mt-1 flex items-center gap-2 text-2xl font-bold" style={{ color: 'var(--text)' }}>
                {valor}
              </div>
            </div>

            {/* Miniatura do QR para chamar o modal (se houver) */}
            {p.pixImage && (
              <button
                className="group"
                onClick={() => abrirModalPIX(p)}
                aria-label="Ampliar QR Code PIX"
                title="Ampliar QR Code PIX"
              >
                <img
                  src={p.pixImage}
                  alt="QR Code PIX"
                  className="w-28 h-28 object-contain rounded-lg border group-hover:scale-105 transition"
                  style={{ borderColor: 'var(--c-border)' }}
                />
              </button>
            )}
          </div>

          <CTAGroup p={p} />
        </div>
      </div>
    )
  }

  /* ===== Render ===== */
  return (
    <section className="section">
      <div className="container-max">
        <h2 className="text-2xl font-bold">Pagamentos do Contrato {id}</h2>

        {/* Banner para o pagador */}
        <div
          className="mt-3 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
            background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
            color: 'var(--text)'
          }}
          role="note"
        >
          <QrCode size={18} className="mt-0.5" />
          <div>
            Pague com <strong>PIX</strong> copiando o código ou escaneando o QR Code. Exibimos somente parcelas <strong>não pagas</strong>.
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-4 grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* Erro */}
        {!loading && error && (
          <div
            className="mt-4 rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)',
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              color: 'var(--primary)'
            }}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {/* Vazio */}
        {!loading && !error && atrasadas.length === 0 && !parcelaDaVez && (
          <div
            className="mt-4 rounded-xl border p-4"
            style={{ borderColor: 'var(--c-border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            Nenhuma parcela em atraso ou a vencer encontrada.
          </div>
        )}

        {/* Em atraso */}
        {!loading && !error && atrasadas.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Em atraso ({atrasadas.length})</h3>
            <div className="grid gap-3" aria-live="polite">
              {atrasadas.map((x, i) => (
                <ParcelaCard key={x.raw.id || `atr-${i}`} p={x.raw} idx={i} tone="danger" rotulo="Em atraso" />
              ))}
            </div>
          </div>
        )}

        {/* Parcela da vez */}
        {!loading && !error && parcelaDaVez && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">Parcela da vez</h3>
            <ParcelaCard p={parcelaDaVez.raw} idx={0} tone="info" rotulo="Próxima a vencer" />
          </div>
        )}
      </div>

      {/* ===== Modal PIX ===== */}
      {pixModal.open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Pagamento via PIX"
          onMouseDown={(e) => {
            // fecha ao clicar fora do conteúdo
            if (e.target === e.currentTarget) fecharModalPIX()
          }}
          style={{ background: 'color-mix(in srgb, var(--surface) 30%, black)' }}
        >
          <div
            className="relative max-w-[92vw] w-[520px] rounded-2xl border shadow-lg"
            style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}
          >
            <button
              ref={closeBtnRef}
              onClick={fecharModalPIX}
              className="absolute top-3 right-3 p-2 rounded-full border hover:opacity-90"
              style={{ borderColor: 'var(--c-border)', background: 'var(--surface-alt)' }}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-semibold">Pagamento via PIX</h4>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Parcela {pixModal.numero} • Venc.: <strong>{pixModal.venc}</strong>
                  </p>
                  <div className="text-2xl font-bold mt-2">{pixModal.valor}</div>
                </div>
                {pixModal.pixImage && (
                  <img
                    src={pixModal.pixImage}
                    alt="QR Code PIX"
                    className="w-36 h-36 object-contain rounded-lg border"
                    style={{ borderColor: 'var(--c-border)' }}
                  />
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="codigo-pix" className="text-sm font-medium">
                  Código PIX (copia e cola)
                </label>
                <textarea
                  id="codigo-pix"
                  className="mt-2 w-full rounded-xl border p-3 text-sm select-all"
                  rows={4}
                  readOnly
                  value={pixModal.pixQrcode}
                  style={{ borderColor: 'var(--c-border)', background: 'var(--surface-alt)', color: 'var(--text)' }}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    className="btn-primary inline-flex items-center gap-2"
                    onClick={() => copiarPix(pixModal.pixQrcode)}
                  >
                    {copiado === 'modal' ? <Check size={16} /> : <Copy size={16} />}
                    {copiado === 'modal' ? 'Copiado!' : 'Copiar código PIX'}
                  </button>
                  {pixModal.pixImage && (
                    <a
                      className="btn-outline inline-flex items-center gap-2"
                      href={pixModal.pixImage}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <QrCode size={16} /> Abrir QR em nova aba
                    </a>
                  )}
                </div>
              </div>

              <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                Dica: no mobile, prefira escanear o QR com o app do seu banco. No desktop, copie o código e cole no Internet Banking.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
