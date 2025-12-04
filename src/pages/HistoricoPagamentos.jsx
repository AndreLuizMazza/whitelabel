// src/pages/HistoricoPagamentos.jsx
import { useLocation, Link } from 'react-router-dom'
import BackButton from "@/components/BackButton";
const fmtBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(v || 0)
  )

const fmtDate = (s) => {
  if (!s) return '—'
  const t = String(s)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t
  const [Y, M, D] = t.split('T')[0].split('-')
  return Y && M && D ? `${D}/${M}/${Y}` : t
}

export default function HistoricoPagamentos() {
  const location = useLocation()
  const { historico = [], numeroContrato, nomePlano, unidadeNome } =
    location.state || {}

  const pagos = Array.isArray(historico)
    ? historico.filter((p) => {
        const st = String(p.status || '').toUpperCase()
        return st === 'PAGA' || st === 'PAID'
      })
    : []

  return (
    <section className="section">
      <div className="container-max">
        
                     {/* Barra superior com Voltar */}
              <div className="mb-4 flex items-center justify-between">
               <BackButton to="/area" className="mb-4" />
              </div>
        <header className="mb-6">
          <p
            className="text-[11px] uppercase tracking-[0.2em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Área do associado
          </p>
          <h1 className="text-2xl font-semibold mt-1">
            Histórico de Pagamentos
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {nomePlano && <>Plano <strong>{nomePlano}</strong>{' • '}</>}
            {numeroContrato && <>Contrato #{numeroContrato}{' • '}</>}
            {unidadeNome && <>Administrado por {unidadeNome}</>}
          </p>


        </header>

        {pagos.length === 0 ? (
          <div className="card p-6">
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Ainda não encontramos pagamentos confirmados para este contrato.
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    background:
                      'color-mix(in srgb, var(--primary) 10%, var(--surface) 90%)',
                  }}
                >
                  <th className="text-left px-4 py-2">Parcela</th>
                  <th className="text-left px-4 py-2">Vencimento</th>
                  <th className="text-left px-4 py-2">Pago em</th>
                  <th className="text-right px-4 py-2">Valor pago</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p, i) => {
                  const key =
                    p?.id ||
                    p?.numeroDuplicata ||
                    p?.numero ||
                    `hist-${i}`
                  return (
                    <tr
                      key={key}
                      className="border-t"
                      style={{ borderColor: 'var(--c-border)' }}
                    >
                      <td className="px-4 py-2">
                        #{p?.numeroDuplicata || p?.numero || '—'}
                      </td>
                      <td className="px-4 py-2">{fmtDate(p?.dataVencimento)}</td>
                      <td className="px-4 py-2">{fmtDate(p?.dataRecebimento)}</td>
                      <td className="px-4 py-2 text-right">
                        {fmtBRL(
                          p?.valorParcelaRecebida ??
                            p?.valorParcela ??
                            0
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
