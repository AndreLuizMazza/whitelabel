import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BadgePercent } from 'lucide-react'
import { setPageSEO } from '@/lib/seo'
import {
  MemberSubpageNav,
  MemberSubpageHeader,
  formatDisplayLabel,
} from '@/components/member/MemberDashboardUI'
import { MemberSection } from '@/components/member/MemberGroupedList'
import ServicosDigitaisSection from '@/components/beneficios/ServicosDigitaisSection'
import useMemberContratoContext from '@/hooks/useMemberContratoContext'
import Skeleton from '@/components/ui/Skeleton.jsx'

function buildMeta({ nomePlano, numeroContrato, unidadeNome }) {
  const parts = []
  if (nomePlano) parts.push(formatDisplayLabel(nomePlano))
  if (numeroContrato) parts.push(`Contrato #${numeroContrato}`)
  if (unidadeNome) parts.push(formatDisplayLabel(unidadeNome))
  return parts.length ? parts.join(' · ') : null
}

export default function ServicosDigitaisAssociado() {
  const { loading, erro, nomePlano, numeroContrato, unidadeNome, planoId, contrato } =
    useMemberContratoContext()

  const headerMeta = buildMeta({ nomePlano, numeroContrato, unidadeNome })

  useEffect(() => {
    setPageSEO({
      title: 'Serviços digitais',
      description: 'Acessos digitais inclusos no seu plano.',
      robots: 'noindex, nofollow',
    })
  }, [])

  if (loading && !contrato) {
    return (
      <div className="w-full max-w-6xl mx-auto min-h-[50dvh]">
        <Skeleton className="h-11 w-28 rounded-md mb-1" />
        <Skeleton className="h-10 w-56 rounded-md mb-5" />
        <Skeleton className="h-[200px] rounded-[10px]" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-2 min-h-[calc(100dvh-8rem)] flex flex-col">
      <MemberSubpageNav to="/area" label="Início" />
      <MemberSubpageHeader title="Serviços digitais" meta={headerMeta} />

      {erro ? (
        <div
          className="mb-4 rounded-[10px] px-4 py-3"
          style={{
            background: 'color-mix(in srgb, var(--danger, #dc2626) 8%, var(--surface))',
            border: '0.5px solid color-mix(in srgb, var(--danger, #dc2626) 22%, transparent)',
          }}
        >
          <p className="text-[14px] leading-snug" style={{ color: 'var(--danger, #dc2626)' }}>
            Não foi possível carregar os dados do contrato. Tente novamente em instantes.
          </p>
        </div>
      ) : null}

      <div className="flex-1">
        <MemberSection title="Acessos do plano">
          <ServicosDigitaisSection
            variant="member"
            planoId={planoId}
            numeroContrato={numeroContrato}
            nomePlano={nomePlano}
          />
        </MemberSection>
      </div>

      <Link
        to="/area/beneficios"
        className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold min-h-[44px] active:opacity-70"
        style={{ color: 'var(--primary)' }}
      >
        <BadgePercent size={18} />
        Ver clube de parceiros
      </Link>
    </div>
  )
}
