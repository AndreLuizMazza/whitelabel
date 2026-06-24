import { useEffect, useMemo, useState } from 'react'
import { Globe, Smartphone } from 'lucide-react'
import api from '@/lib/api.js'
import { MemberGroupedList, MemberListRow } from '@/components/member/MemberGroupedList'
import { extractPlanoLinks, getHostFromLink } from './beneficiosUtils'

const track = (..._args) => {}

function MemberEmptyState({ children }) {
  return (
    <MemberGroupedList>
      <div className="px-4 py-7 text-center">
        <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {children}
        </p>
      </div>
    </MemberGroupedList>
  )
}

export default function ServicosDigitaisSection({
  planoId,
  numeroContrato,
  nomePlano,
  variant = 'card',
}) {
  const [plano, setPlano] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let alive = true

    async function fetchPlano(planId) {
      if (!planId) {
        setErro('Plano não informado.')
        setLoading(false)
        return
      }
      setLoading(true)
      setErro('')
      try {
        const { data } = await api.get(`/api/v1/planos/${planId}`, {
          transformRequest: [
            (d, headers) => {
              try {
                delete headers.Authorization
              } catch {}
              return d
            },
          ],
          __skipAuthRedirect: true,
        })
        if (alive) setPlano(data)
      } catch {
        try {
          const { data } = await api.get(`/api/v1/planos/${planId}`, {
            headers: { Authorization: '' },
            __skipAuthRedirect: true,
          })
          if (alive) setPlano(data)
        } catch (e2) {
          console.error('Erro ao carregar plano em Serviços Digitais', e2)
          if (alive) setErro('Não foi possível carregar os serviços digitais deste plano.')
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    fetchPlano(planoId)
    return () => {
      alive = false
    }
  }, [planoId])

  const links = useMemo(() => extractPlanoLinks(plano), [plano])
  const tituloPlano = plano?.nome || nomePlano || 'Plano'
  const isMember = variant === 'member'

  if (!planoId) {
    const message =
      'Seus serviços digitais aparecerão aqui quando houver um plano vinculado ao contrato.'
    if (isMember) return <MemberEmptyState>{message}</MemberEmptyState>
    return (
      <div className="member-dashboard-card rounded-[22px] p-4" style={{ background: 'var(--surface)' }}>
        <p className="text-[15px]" style={{ color: 'var(--text-muted)' }}>
          {message}
        </p>
      </div>
    )
  }

  if (loading) {
    if (isMember) {
      return (
        <MemberGroupedList>
          <div className="px-4 py-4 space-y-3">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="h-[52px] animate-pulse rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--text) 6%, var(--surface))' }}
              />
            ))}
          </div>
        </MemberGroupedList>
      )
    }
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className="h-28 animate-pulse rounded-[16px]"
            style={{ background: 'color-mix(in srgb, var(--text) 6%, var(--surface))' }}
          />
        ))}
      </div>
    )
  }

  if (erro) {
    if (isMember) {
      return (
        <MemberGroupedList>
          <div className="px-4 py-6 text-center">
            <p className="text-[15px] leading-snug" style={{ color: 'var(--danger, #dc2626)' }}>
              {erro}
            </p>
          </div>
        </MemberGroupedList>
      )
    }
    return (
      <p className="text-[14px]" style={{ color: 'var(--danger, #dc2626)' }}>
        {erro}
      </p>
    )
  }

  if (links.length === 0) {
    const message = 'Este plano não possui serviços digitais cadastrados no momento.'
    if (isMember) return <MemberEmptyState>{message}</MemberEmptyState>
    return (
      <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
    )
  }

  if (isMember) {
    return (
      <>
        <MemberGroupedList>
          {links.map((item, idx) => {
            const tituloServico = item.descricao || getHostFromLink(item.link) || 'Serviço digital'
            const detail = item.observacoes || getHostFromLink(item.link) || null
            return (
              <MemberListRow
                key={`${item.link}-${idx}`}
                icon={Smartphone}
                label={tituloServico}
                detail={detail}
                external={item.link}
              />
            )
          })}
        </MemberGroupedList>
        {numeroContrato || tituloPlano ? (
          <p className="px-1 mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Inclusos no plano {tituloPlano}
            {numeroContrato ? ` · Contrato #${numeroContrato}` : ''}. Toque para abrir em nova aba.
          </p>
        ) : null}
      </>
    )
  }

  return (
    <div className="member-dashboard-card rounded-[22px] p-4 md:p-5" style={{ background: 'var(--surface)' }}>
      <div className="mb-4">
        <h2 className="text-[17px] font-semibold tracking-tight">Serviços digitais</h2>
        <p className="mt-1 text-[14px] leading-snug" style={{ color: 'var(--text-muted)' }}>
          Acessos online incluídos no plano <strong>{tituloPlano}</strong>
          {numeroContrato ? <> · Contrato #{numeroContrato}</> : null}.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {links.map((item, idx) => {
          const tituloServico = item.descricao || getHostFromLink(item.link) || 'Serviço digital'
          return (
            <article
              key={`${item.link}-${idx}`}
              className="rounded-[16px] border p-4 flex flex-col gap-3"
              style={{ borderColor: 'var(--separator, var(--c-border))', background: 'var(--surface)' }}
            >
              <div>
                <h3 className="text-[15px] font-semibold leading-snug flex items-center gap-2">
                  <Globe size={16} style={{ color: 'var(--primary)' }} />
                  {tituloServico}
                </h3>
                {item.observacoes ? (
                  <p className="mt-1 text-[13px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {item.observacoes}
                  </p>
                ) : null}
              </div>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm w-full justify-center"
                onClick={() =>
                  track('servicos_digitais_click', {
                    link: item.link,
                    planoId,
                    numeroContrato,
                  })
                }
              >
                Acessar serviço
              </a>
            </article>
          )
        })}
      </div>
    </div>
  )
}
