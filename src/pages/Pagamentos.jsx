// src/pages/Pagamentos.jsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '@/lib/api.js'

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
      <div className="h-4 w-40 rounded" style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }} />
      <div className="mt-3 h-3 w-2/3 rounded" style={{ background: 'color-mix(in srgb, var(--primary) 8%, transparent)' }} />
      <div className="mt-2 h-3 w-1/2 rounded" style={{ background: 'color-mix(in srgb, var(--primary) 8%, transparent)' }} />
      <div className="mt-3 h-3 w-32 rounded" style={{ background: 'color-mix(in srgb, var(--primary) 8%, transparent)' }} />
    </div>
  )
}

export default function Pagamentos() {
  const { id } = useParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  // === Normalização, classificação e priorização ===
  const { atrasadas, parcelaDaVez } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const norm = (p) => {
      const statusRaw = (p.status ?? p.situacao ?? '').toString()
      const status = statusRaw.trim().toUpperCase()
      const vencDate = parseDateLike(p.dataVencimento ?? p.vencimento)
      const valor = Number(p.valorParcela ?? p.valor ?? 0)
      const valorRecebido = Number(p.valorRecebido ?? 0)
      const dataRecebimento = parseDateLike(p.dataRecebimento)

      const isCancel = /CANCEL/i.test(status)
      const isPagoByStatus = /(PAG[OA])|(RECEB)|(LIQ)|(BAIXA)|(QUIT)|(COMPENS)/i.test(status)
      const isPagoByValue = isFinite(valor) && isFinite(valorRecebido) && valorRecebido >= Math.max(valor, 0.01)
      const isPagoByDate = Boolean(dataRecebimento)

      const pago = isPagoByStatus || isPagoByValue || isPagoByDate || isCancel
      const ts = vencDate ? vencDate.getTime() : Number.POSITIVE_INFINITY
      const emAtraso = !pago && vencDate && (vencDate.getTime() < today.getTime())

      return {
        raw: p,
        statusRaw,
        pago,
        emAtraso,
        tsVenc: ts,
      }
    }

    const enriched = items.map(norm)

    // Filtra não pagas
    const naoPagas = enriched.filter(x => !x.pago)

    // Atrasadas (todas não pagas com vencimento < hoje)
    const atrasadas = naoPagas
      .filter(x => x.emAtraso)
      .sort((a, b) => a.tsVenc - b.tsVenc)

    // Próxima a vencer ("parcela da vez"): menor vencimento >= hoje dentre não pagas e não atrasadas
    const futuras = naoPagas
      .filter(x => !x.emAtraso && isFinite(x.tsVenc))
      .sort((a, b) => a.tsVenc - b.tsVenc)

    const parcelaDaVez = futuras.length > 0 ? futuras[0] : null

    return { atrasadas, parcelaDaVez }
  }, [items])

  // Render de cartão (usa o objeto original p.raw)
  function ParcelaCard({ p, idx }) {
    const numero = p.numeroDuplicata ?? p.numero ?? idx + 1
    const status = (p.status ?? p.situacao ?? '—').toString()
    const venc = fmtData(p.dataVencimento ?? p.vencimento)
    const receb = fmtData(p.dataRecebimento)
    const valor = fmtValor(p.valorParcela ?? p.valor)
    const valorRec = fmtValor(p.valorRecebido)
    const emAtraso = /ATRAS/i.test(status)

    return (
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">
            Parcela {numero} • {status}
          </p>
          {emAtraso && (
            <span
              className="px-3 py-1 text-xs rounded-full"
              style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
            >
              Em atraso
            </span>
          )}
        </div>

        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Venc.: <strong>{venc}</strong> • Receb.: <strong>{receb}</strong>
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
          Valor: <strong>{valor}</strong> • Recebido: <strong>{valorRec}</strong>
        </p>

        {(p.linkPagamento || p.urlBoleto) && (
          <div className="text-sm mt-2 flex flex-wrap gap-3">
            {p.linkPagamento && (
              <a className="btn-outline" href={p.linkPagamento} target="_blank" rel="noreferrer">
                Link de pagamento
              </a>
            )}
            {p.urlBoleto && (
              <a className="btn-outline" href={p.urlBoleto} target="_blank" rel="noreferrer">
                Boleto
              </a>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="section">
      <div className="container-max">
        <h2 className="text-2xl font-bold">Pagamentos do Contrato {id}</h2>

        {/* Loading */}
        {loading && (
          <div className="mt-4 grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
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

        {/* Vazio (nenhuma prioritária encontrada) */}
        {!loading && !error && atrasadas.length === 0 && !parcelaDaVez && (
          <div
            className="mt-4 rounded-xl border p-4"
            style={{ borderColor: 'var(--c-border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            Nenhuma parcela em atraso ou a vencer encontrada. (Parcelas pagas não são exibidas.)
          </div>
        )}

        {/* Em atraso */}
        {!loading && !error && atrasadas.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Em atraso ({atrasadas.length})</h3>
            <div className="grid gap-3" aria-live="polite">
              {atrasadas.map((x, i) => (
                <ParcelaCard key={x.raw.id || `atr-${i}`} p={x.raw} idx={i} />
              ))}
            </div>
          </div>
        )}

        {/* Parcela da vez */}
        {!loading && !error && parcelaDaVez && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">Parcela da vez</h3>
            <ParcelaCard p={parcelaDaVez.raw} idx={0} />
          </div>
        )}
      </div>
    </section>
  )
}
