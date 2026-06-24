import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import { setPageSEO } from '@/lib/seo'
import {
  MemberSubpageNav,
  MemberSubpageHeader,
  formatDisplayLabel,
} from '@/components/member/MemberDashboardUI'
import { MemberSection } from '@/components/member/MemberGroupedList'
import ClubeParceirosList from '@/components/beneficios/ClubeParceirosList'
import ServicosDigitaisSection from '@/components/beneficios/ServicosDigitaisSection'
import Skeleton from '@/components/ui/Skeleton.jsx'

function buildMeta({ nomePlano, numeroContrato, unidadeNome }) {
  const parts = []
  if (nomePlano) parts.push(formatDisplayLabel(nomePlano))
  if (numeroContrato) parts.push(`Contrato #${numeroContrato}`)
  if (unidadeNome) parts.push(formatDisplayLabel(unidadeNome))
  return parts.length ? parts.join(' · ') : null
}

export default function BeneficiosAssociado() {
  const location = useLocation()
  const state = location.state || {}

  const user = useAuth((s) => s.user)
  const cpf =
    user?.cpf ||
    user?.documento ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem('auth_user') || '{}').cpf
      } catch {
        return ''
      }
    })() ||
    ''

  const { contrato, loading, erro } = useContratoDoUsuario({ cpf })

  const nomePlano = contrato?.nomePlano ?? contrato?.plano?.nome ?? state.nomePlano ?? null
  const numeroContrato = contrato?.numeroContrato ?? contrato?.id ?? state.numeroContrato ?? null
  const unidadeNome =
    contrato?.unidade?.nomeFantasia ??
    contrato?.unidade?.razaoSocial ??
    state.unidadeNome ??
    null

  const planoIdForRoute = useMemo(
    () => contrato?.planoId || contrato?.plano_id || contrato?.plano?.id || state.planoId || null,
    [contrato, state.planoId]
  )

  const headerMeta = buildMeta({ nomePlano, numeroContrato, unidadeNome })

  useEffect(() => {
    setPageSEO({
      title: 'Meus benefícios',
      description: 'Benefícios completos do associado: serviços digitais e clube de parceiros.',
      robots: 'noindex, nofollow',
    })
  }, [])

  if (loading && !contrato) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <Skeleton className="h-11 w-28 rounded-md mb-1" />
        <Skeleton className="h-10 w-48 rounded-md mb-5" />
        <div className="space-y-6">
          <div>
            <Skeleton className="h-4 w-32 rounded mb-2 ml-1" />
            <Skeleton className="h-[120px] rounded-[10px]" />
          </div>
          <div>
            <Skeleton className="h-4 w-36 rounded mb-2 ml-1" />
            <Skeleton className="h-[280px] rounded-[10px]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-2">
      <MemberSubpageNav to="/area" label="Início" />
      <MemberSubpageHeader title="Benefícios" meta={headerMeta} />

      {erro ? (
        <div
          className="mb-4 rounded-[10px] px-4 py-3"
          style={{
            background: 'color-mix(in srgb, var(--danger, #dc2626) 8%, var(--surface))',
            border: '0.5px solid color-mix(in srgb, var(--danger, #dc2626) 22%, transparent)',
          }}
        >
          <p className="text-[14px] leading-snug" style={{ color: 'var(--danger, #dc2626)' }}>
            Alguns dados do contrato não puderam ser carregados. Serviços digitais podem ficar indisponíveis.
          </p>
        </div>
      ) : null}

      <div className="space-y-6">
        <MemberSection title="Serviços digitais">
          <ServicosDigitaisSection
            variant="member"
            planoId={planoIdForRoute}
            numeroContrato={numeroContrato}
            nomePlano={nomePlano}
          />
        </MemberSection>

        <MemberSection title="Clube de parceiros" footer="Descontos e vantagens em estabelecimentos parceiros.">
          <ClubeParceirosList
            variant="member"
            detailBase="/area/beneficios"
            showIntro={false}
          />
        </MemberSection>
      </div>
    </div>
  )
}
