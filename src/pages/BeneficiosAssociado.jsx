import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Smartphone } from 'lucide-react'
import { setPageSEO } from '@/lib/seo'
import {
  MemberSubpageNav,
  MemberSubpageHeader,
  formatDisplayLabel,
} from '@/components/member/MemberDashboardUI'
import ClubeParceirosList from '@/components/beneficios/ClubeParceirosList'
import useMemberContratoContext from '@/hooks/useMemberContratoContext'
import Skeleton from '@/components/ui/Skeleton.jsx'

function buildMeta({ nomePlano, numeroContrato, unidadeNome }) {
  const parts = []
  if (nomePlano) parts.push(formatDisplayLabel(nomePlano))
  if (numeroContrato) parts.push(`Contrato #${numeroContrato}`)
  if (unidadeNome) parts.push(formatDisplayLabel(unidadeNome))
  return parts.length ? parts.join(' · ') : null
}

export default function BeneficiosAssociado() {
  const { loading, contrato, nomePlano, numeroContrato, unidadeNome } = useMemberContratoContext()

  const headerMeta = buildMeta({ nomePlano, numeroContrato, unidadeNome })

  useEffect(() => {
    setPageSEO({
      title: 'Clube de parceiros',
      description: 'Parceiros e descontos exclusivos para associados.',
      robots: 'noindex, nofollow',
    })
  }, [])

  if (loading && !contrato) {
    return (
      <div className="w-full max-w-6xl mx-auto min-h-[50dvh]">
        <Skeleton className="h-11 w-28 rounded-md mb-1" />
        <Skeleton className="h-10 w-48 rounded-md mb-5" />
        <div className="flex gap-3 mb-6 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[67px] w-[67px] rounded-full shrink-0" />
          ))}
        </div>
        <Skeleton className="h-[140px] rounded-[16px] mb-4" />
        <Skeleton className="h-[280px] rounded-[16px]" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-4">
      <MemberSubpageNav to="/area" label="Início" />
      <MemberSubpageHeader title="Clube de parceiros" meta={headerMeta} />

      <ClubeParceirosList variant="member" detailBase="/area/beneficios" showIntro={false} />

      <Link
        to="/area/servicos-digitais"
        className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold min-h-[44px] active:opacity-70"
        style={{ color: 'var(--primary)' }}
      >
        <Smartphone size={18} />
        Serviços digitais do plano
      </Link>
    </div>
  )
}
