// src/pages/DependentesPage.jsx
import { useLocation } from 'react-router-dom'
import DependentesList from '@/components/DependentesList'
import BackButton from "@/components/BackButton";

export default function DependentesPage() {
  const location = useLocation()
  const {
    dependentes = [],
    numeroContrato,
    nomePlano,
    unidadeNome,
    contrato,
  } = location.state || {}

  const hasData = Array.isArray(dependentes) && dependentes.length > 0

  return (
    <section className="section">
      <div className="container-max">

        <div className="mb-4">
          <BackButton to="/area" />
        </div>

        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-70">
            Área do associado
          </p>

          <h1 className="text-2xl font-semibold mt-1">
            Dependentes e Beneficiários
          </h1>

          {(nomePlano || numeroContrato || unidadeNome) && (
            <p className="text-sm mt-1 opacity-75">
              {nomePlano && <>Plano <strong>{nomePlano}</strong></>}
              {numeroContrato && <> • Contrato #{numeroContrato}</>}
              {unidadeNome && <> • Administrado por {unidadeNome}</>}
            </p>
          )}
        </header>

        {hasData ? (
          <DependentesList dependentes={dependentes} contrato={contrato} />
        ) : (
          <div className="card p-6">
            <p className="text-sm opacity-80">
              Não foi possível carregar os dependentes deste contrato.
            </p>
          </div>
        )}

      </div>
    </section>
  )
}
