// src/pages/Pagamentos.jsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '@/lib/api.js'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
function fmtValor(v) {
  const n = Number(v ?? 0)
  return BRL.format(isFinite(n) ? n : 0)
}
function fmtData(d) {
  if (!d) return '—'
  try {
    const date = typeof d === 'string' && d.length <= 10 ? new Date(`${d}T00:00:00`) : new Date(d)
    return isNaN(date) ? String(d) : date.toLocaleDateString('pt-BR')
  } catch {
    return String(d)
  }
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

  // Ordena por vencimento asc, mantendo robustez contra formatos diferentes
  const ordered = useMemo(() => {
    const toTs = (p) => {
      const d = p.dataVencimento ?? p.vencimento
      const dt = typeof d === 'string' && d.length <= 10 ? new Date(`${d}T00:00:00`) : new Date(d)
      return isNaN(dt) ? 0 : dt.getTime()
    }
    return [...items].sort((a, b) => toTs(a) - toTs(b))
  }, [items])

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

        {/* Vazio */}
        {!loading && !error && ordered.length === 0 && (
          <div
            className="mt-4 rounded-xl border p-4"
            style={{ borderColor: 'var(--c-border)', background: 'var(--surface)', color: 'var(--text)' }}
          >
            Nenhuma parcela encontrada para este contrato.
          </div>
        )}

        {/* Lista */}
        {!loading && !error && ordered.length > 0 && (
          <div className="grid gap-3 mt-4" aria-live="polite">
            {ordered.map((p, idx) => {
              const numero = p.numeroDuplicata ?? p.numero ?? idx + 1
              const status = (p.status ?? p.situacao ?? '—').toString()
              const venc = fmtData(p.dataVencimento ?? p.vencimento)
              const receb = fmtData(p.dataRecebimento)
              const valor = fmtValor(p.valorParcela ?? p.valor)
              const valorRec = fmtValor(p.valorRecebido)
              const emAtraso = status.toUpperCase().includes('ATRAS')

              return (
                <div key={p.id || `${numero}-${venc}-${idx}`} className="card p-4">
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
            })}
          </div>
        )}
      </div>
    </section>
  )
}
