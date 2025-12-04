// src/pages/DependentesPage.jsx
import { useLocation, Link } from 'react-router-dom'
import DependentesList from '@/components/DependentesList'
import BackButton from "@/components/BackButton";
export default function DependentesPage() {
  const location = useLocation()
  const { dependentes = [], numeroContrato, nomePlano, unidadeNome } =
    location.state || {}

  const hasData = Array.isArray(dependentes) && dependentes.length > 0

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
            Dependentes e Beneficiários
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {nomePlano && <>Plano <strong>{nomePlano}</strong>{' • '}</>}
            {numeroContrato && <>Contrato #{numeroContrato}{' • '}</>}
            {unidadeNome && <>Administrado por {unidadeNome}</>}
          </p>


        </header>

        {hasData ? (
          <DependentesList dependentes={dependentes} contrato={null} />
        ) : (
          <div className="card p-6">
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Não recebemos a lista de dependentes. Volte para a Área do
              Associado e tente novamente.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
