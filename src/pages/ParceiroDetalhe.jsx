import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import api from '@/lib/api'
import { applyEmDashDocumentTitle, applyRouteDocumentTitle } from '@/lib/shellBranding'
import useTenant from '@/store/tenant'
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react'
import { MemberSubpageNav, formatDisplayLabel } from '@/components/member/MemberDashboardUI'
import { MemberSection, MemberGroupedList, MemberListRow } from '@/components/member/MemberGroupedList'
import Skeleton from '@/components/ui/Skeleton.jsx'
import ParceiroDetailHero from '@/components/beneficios/member/ParceiroDetailHero'
import {
  fmtBeneficio,
  getEnderecoLinha,
  mapsLink,
  safeImageUrl,
} from '@/components/beneficios/beneficiosUtils'

function wppLink(fone) {
  if (!fone) return null
  const num = String(fone).replace(/\D/g, '')
  return num ? `https://wa.me/${num}` : null
}

function domainUrl() {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}`
}

function DetailSkeleton() {
  return (
    <>
      <Skeleton className="h-[200px] w-full rounded-[22px] mb-5" />
      <Skeleton className="h-[120px] w-full rounded-[16px] mb-5" />
      <Skeleton className="h-[180px] w-full rounded-[16px]" />
    </>
  )
}

function BeneficioRow({ beneficio }) {
  const titulo = formatDisplayLabel(beneficio.descricao || 'Benefício')
  const valor = fmtBeneficio(beneficio)
  const observacao = beneficio.observacao
    ? formatDisplayLabel(beneficio.observacao)
    : null

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 min-h-[60px]">
      <span className="flex-1 min-w-0">
        <span className="block text-[17px] font-medium leading-snug" style={{ color: 'var(--text)' }}>
          {titulo}
        </span>
        {observacao ? (
          <span className="block text-[13px] mt-0.5 leading-snug line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {observacao}
          </span>
        ) : null}
      </span>
      <span
        className="shrink-0 rounded-full px-3 py-1.5 text-[14px] font-bold tabular-nums tracking-tight"
        style={{
          background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
          color: 'var(--primary)',
          border: '0.5px solid color-mix(in srgb, var(--primary) 22%, transparent)',
        }}
      >
        {valor}
      </span>
    </div>
  )
}

function GalleryStrip({ imagens, nome }) {
  if (imagens.length <= 1) return null

  return (
    <MemberSection title="Galeria">
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {imagens.slice(1).map((src, i) => (
          <div
            key={src}
            className="relative shrink-0 w-32 h-28 rounded-[14px] overflow-hidden snap-start"
            style={{
              border: '0.5px solid var(--separator, var(--c-border))',
              boxShadow: '0 1px 4px color-mix(in srgb, var(--text) 5%, transparent)',
            }}
          >
            <img
              src={src}
              alt={`${nome} — foto ${i + 2}`}
              className="h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        ))}
      </div>
    </MemberSection>
  )
}

export default function ParceiroDetalhe() {
  const { id } = useParams()
  const location = useLocation()
  const empresa = useTenant((s) => s.empresa)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parceiro, setParceiro] = useState(null)

  useEffect(() => {
    let active = true
    async function run() {
      try {
        setError('')
        setLoading(true)
        const { data } = await api.get(`/api/v1/locais/parceiros/${id}`)
        if (active) setParceiro(data)
      } catch (e) {
        try {
          const res = await api.get(`/api/v1/locais/parceiros?size=999`)
          const all = Array.isArray(res.data) ? res.data : res.data?.content || []
          const found = all.find((p) => String(p.id) === String(id))
          if (!found) throw new Error('Parceiro não encontrado')
          if (active) setParceiro(found)
        } catch (inner) {
          console.error(inner)
          const msg = e?.response?.data?.error || e?.message || 'Erro desconhecido'
          if (active) setError('Não foi possível carregar o parceiro: ' + msg)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (parceiro?.nome) {
      applyEmDashDocumentTitle(parceiro.nome, 'Benefícios', empresa)
    }
    return () => {
      applyRouteDocumentTitle('/area/beneficios', useTenant.getState().empresa)
    }
  }, [parceiro?.nome, empresa])

  const logoUrl = safeImageUrl(parceiro?.imagem)
  const capaUrl = safeImageUrl(parceiro?.capa) || logoUrl

  const imagens = useMemo(() => {
    const unica = logoUrl ? [logoUrl] : []
    const capa = capaUrl && capaUrl !== logoUrl ? [capaUrl] : []
    const galeria = Array.isArray(parceiro?.imagens)
      ? parceiro.imagens.map(safeImageUrl).filter(Boolean)
      : []
    return Array.from(new Set([...capa, ...unica, ...galeria]))
  }, [parceiro, logoUrl, capaUrl])

  const beneficios = Array.isArray(parceiro?.beneficios) ? parceiro.beneficios : []
  const contato = parceiro?.contatos || {}
  const endereco = parceiro?.endereco || {}
  const cidadeUF = [endereco?.cidade, endereco?.uf].filter(Boolean).join(' · ')
  const enderecoLinha = getEnderecoLinha(endereco)

  const headerMeta = useMemo(() => {
    const parts = []
    if (cidadeUF) parts.push(formatDisplayLabel(cidadeUF))
    if (parceiro?.categoria) parts.push(formatDisplayLabel(parceiro.categoria))
    return parts.length ? parts.join(' · ') : null
  }, [cidadeUF, parceiro?.categoria])

  const whatsappUrl = wppLink(contato.celular || contato.telefone)
  const nomeExibicao = formatDisplayLabel(parceiro?.nome || '')

  async function handleShare() {
    const url = `${domainUrl()}${location.pathname}`
    const title = parceiro?.nome || 'Parceiro'
    const text = `Benefício para associados em ${title}`
    try {
      if (navigator.share) await navigator.share({ title, text, url })
      else {
        await navigator.clipboard.writeText(url)
        alert('Link copiado!')
      }
    } catch (_) {}
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-4">
      <MemberSubpageNav to="/area/beneficios" label="Parceiros" />

      {loading ? <DetailSkeleton /> : null}

      {!loading && error ? (
        <MemberGroupedList>
          <div className="px-4 py-10 text-center">
            <p className="text-[15px] leading-snug" style={{ color: 'var(--danger, #dc2626)' }}>
              {error}
            </p>
            <Link
              to="/area/beneficios"
              className="inline-flex mt-5 text-[15px] font-semibold min-h-[44px] items-center active:opacity-70"
              style={{ color: 'var(--primary)' }}
            >
              Voltar para benefícios
            </Link>
          </div>
        </MemberGroupedList>
      ) : null}

      {!loading && !error && parceiro ? (
        <>
          <ParceiroDetailHero
            nome={nomeExibicao}
            meta={headerMeta}
            logoUrl={logoUrl}
            capaUrl={capaUrl}
            onShare={handleShare}
          />

          {parceiro.descricao ? (
            <p
              className="px-1 mb-5 text-[15px] leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              {parceiro.descricao}
            </p>
          ) : null}

          <MemberSection title="Vantagens para associados">
            <MemberGroupedList>
              {beneficios.length > 0 ? (
                beneficios.map((b, idx) => (
                  <BeneficioRow key={b.id || `${b.descricao}-${idx}`} beneficio={b} />
                ))
              ) : (
                <div className="px-4 py-7 text-center text-[15px]" style={{ color: 'var(--text-muted)' }}>
                  Este parceiro ainda não cadastrou benefícios detalhados.
                </div>
              )}
            </MemberGroupedList>
          </MemberSection>

          {contato.telefone || contato.celular || contato.email || whatsappUrl ? (
            <MemberSection title="Contato">
              <MemberGroupedList>
                {contato.telefone ? (
                  <MemberListRow
                    icon={Phone}
                    label="Telefone"
                    detail={contato.telefone}
                    external={`tel:${contato.telefone}`}
                  />
                ) : null}
                {contato.celular ? (
                  <MemberListRow
                    icon={Phone}
                    label="Celular"
                    detail={contato.celular}
                    external={`tel:${contato.celular}`}
                  />
                ) : null}
                {whatsappUrl ? (
                  <MemberListRow
                    icon={MessageCircle}
                    label="WhatsApp"
                    detail="Enviar mensagem"
                    external={whatsappUrl}
                  />
                ) : null}
                {contato.email ? (
                  <MemberListRow
                    icon={Mail}
                    label="E-mail"
                    detail={contato.email}
                    external={
                      contato.email.startsWith('http') ? contato.email : `mailto:${contato.email}`
                    }
                  />
                ) : null}
              </MemberGroupedList>
            </MemberSection>
          ) : null}

          {enderecoLinha ? (
            <MemberSection title="Endereço" footer={enderecoLinha}>
              <MemberGroupedList>
                <MemberListRow
                  icon={MapPin}
                  label="Abrir no mapa"
                  detail={cidadeUF ? formatDisplayLabel(cidadeUF) : 'Ver rota'}
                  external={mapsLink(endereco)}
                />
              </MemberGroupedList>
            </MemberSection>
          ) : null}

          <GalleryStrip imagens={imagens} nome={nomeExibicao} />
        </>
      ) : null}
    </div>
  )
}
