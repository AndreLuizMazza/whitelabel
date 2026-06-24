import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import api from '@/lib/api'
import { applyEmDashDocumentTitle, applyRouteDocumentTitle } from '@/lib/shellBranding'
import useTenant from '@/store/tenant'
import {
  MapPin,
  Phone,
  Mail,
  Percent,
  Share2,
} from 'lucide-react'
import {
  MemberSubpageNav,
  MemberSubpageHeader,
} from '@/components/member/MemberDashboardUI'
import { MemberSection, MemberGroupedList, MemberListRow } from '@/components/member/MemberGroupedList'
import Skeleton from '@/components/ui/Skeleton.jsx'
import { fmtBeneficio } from '@/components/beneficios/beneficiosUtils'

const CLUB_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMTYwIiB2aWV3Qm94PSIwIDAgNDAwIDE2MCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiNmMWY1ZjkiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSI4MCIgcj0iNDYiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSIyMDAiIHk9Ijg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iSW50ZXIsU2Vnb2UgVUksQXJpYWwsIHNhbnMtc2VyaWZiIiBmb250LXNpemU9IjI4IiBmaWxsPSIjNDc1NTY5Ij4lPC90ZXh0Pjwvc3ZnPg=='

function getEnderecoLinha(e = {}) {
  const partes = [
    e.logradouro,
    e.numero,
    e.bairro,
    e.cidade && e.uf ? `${e.cidade} - ${e.uf}` : e.cidade || e.uf,
    e.cep ? `CEP ${e.cep}` : '',
  ].filter(Boolean)
  return partes.join(', ')
}

function mapsLink(endereco = {}) {
  if (endereco.latitude && endereco.longitude) {
    return `https://www.google.com/maps?q=${endereco.latitude},${endereco.longitude}`
  }
  const q = encodeURIComponent(getEnderecoLinha(endereco))
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

function wppLink(fone) {
  if (!fone) return null
  const num = String(fone).replace(/\D/g, '')
  return num ? `https://wa.me/${num}` : null
}

function domainUrl() {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}`
}

function BeneficioRow({ beneficio }) {
  const detail = beneficio.observacao
    ? `${fmtBeneficio(beneficio)} · ${beneficio.observacao}`
    : fmtBeneficio(beneficio)

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 min-h-[56px]">
      <span
        className="inline-flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[7px] mt-0.5"
        style={{
          background: 'color-mix(in srgb, var(--primary) 14%, var(--surface))',
          color: 'var(--primary)',
        }}
      >
        <Percent size={15} strokeWidth={2} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[17px] leading-snug" style={{ color: 'var(--text)' }}>
          {beneficio.descricao || 'Benefício'}
        </span>
        <span className="block text-[13px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
          {detail}
        </span>
      </span>
    </div>
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

  const imagens = useMemo(() => {
    const unica = parceiro?.imagem && String(parceiro.imagem).trim() ? [parceiro.imagem] : []
    const galeria = Array.isArray(parceiro?.imagens) ? parceiro.imagens.filter(Boolean) : []
    return Array.from(new Set([...unica, ...galeria]))
  }, [parceiro])

  const beneficios = Array.isArray(parceiro?.beneficios) ? parceiro.beneficios : []
  const contato = parceiro?.contatos || {}
  const endereco = parceiro?.endereco || {}
  const cidadeUF = [endereco?.cidade, endereco?.uf].filter(Boolean).join(' · ')
  const enderecoLinha = getEnderecoLinha(endereco)

  const headerMeta = useMemo(() => {
    const parts = []
    if (cidadeUF) parts.push(cidadeUF)
    if (parceiro?.categoria) parts.push(parceiro.categoria)
    return parts.length ? parts.join(' · ') : null
  }, [cidadeUF, parceiro?.categoria])

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
    <div className="w-full max-w-6xl mx-auto pb-2">
      <MemberSubpageNav to="/area/beneficios" label="Parceiros" />

      {loading ? (
        <>
          <Skeleton className="h-10 w-56 rounded-md mb-5" />
          <Skeleton className="h-44 rounded-[10px] mb-5" />
          <Skeleton className="h-[200px] rounded-[10px]" />
        </>
      ) : null}

      {!loading && error ? (
        <>
          <MemberSubpageHeader title="Parceiro" />
          <MemberGroupedList>
            <div className="px-4 py-8 text-center">
              <p className="text-[15px] leading-snug" style={{ color: 'var(--danger, #dc2626)' }}>
                {error}
              </p>
              <Link
                to="/area/beneficios"
                className="inline-flex mt-4 text-[15px] font-semibold min-h-[44px] items-center active:opacity-70"
                style={{ color: 'var(--primary)' }}
              >
                Voltar para benefícios
              </Link>
            </div>
          </MemberGroupedList>
        </>
      ) : null}

      {!loading && !error && parceiro ? (
        <>
          <MemberSubpageHeader title={parceiro.nome} meta={headerMeta}>
            <button
              type="button"
              onClick={handleShare}
              className="mt-3 inline-flex items-center gap-2 min-h-[44px] px-1 text-[15px] font-medium active:opacity-70"
              style={{ color: 'var(--primary)' }}
            >
              <Share2 size={17} />
              Compartilhar
            </button>
          </MemberSubpageHeader>

          {parceiro.descricao ? (
            <p className="px-1 mb-5 text-[15px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {parceiro.descricao}
            </p>
          ) : null}

          {imagens.length > 0 ? (
            <div
              className="mb-5 rounded-[10px] overflow-hidden flex items-center justify-center min-h-[140px] max-h-[220px]"
              style={{
                background: 'var(--surface)',
                border: '0.5px solid var(--separator, var(--c-border))',
                backgroundImage: `url(${CLUB_PLACEHOLDER})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'contain',
              }}
            >
              <img
                src={imagens[0]}
                alt={parceiro.nome}
                className="max-h-[200px] w-full object-contain p-4"
                loading="lazy"
              />
            </div>
          ) : null}

          {beneficios.length > 0 ? (
            <MemberSection title="Vantagens para associados">
              <MemberGroupedList>
                {beneficios.map((b, idx) => (
                  <BeneficioRow key={b.id || `${b.descricao}-${idx}`} beneficio={b} />
                ))}
              </MemberGroupedList>
            </MemberSection>
          ) : (
            <MemberSection title="Vantagens para associados">
              <MemberGroupedList>
                <div className="px-4 py-6 text-center text-[15px]" style={{ color: 'var(--text-muted)' }}>
                  Este parceiro ainda não cadastrou benefícios detalhados.
                </div>
              </MemberGroupedList>
            </MemberSection>
          )}

          {(contato.telefone || contato.celular || contato.email || wppLink(contato.celular || contato.telefone)) ? (
            <MemberSection title="Contato">
              <MemberGroupedList>
                {contato.telefone ? (
                  <MemberListRow icon={Phone} label="Telefone" detail={contato.telefone} external={`tel:${contato.telefone}`} />
                ) : null}
                {contato.celular ? (
                  <MemberListRow icon={Phone} label="Celular" detail={contato.celular} external={`tel:${contato.celular}`} />
                ) : null}
                {wppLink(contato.celular || contato.telefone) ? (
                  <MemberListRow
                    icon={Phone}
                    label="WhatsApp"
                    detail="Enviar mensagem"
                    external={wppLink(contato.celular || contato.telefone)}
                  />
                ) : null}
                {contato.email ? (
                  <MemberListRow
                    icon={Mail}
                    label="E-mail"
                    detail={contato.email}
                    external={contato.email.startsWith('http') ? contato.email : `mailto:${contato.email}`}
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
                  detail={cidadeUF || 'Ver rota'}
                  external={mapsLink(endereco)}
                />
              </MemberGroupedList>
            </MemberSection>
          ) : null}

          {imagens.length > 1 ? (
            <MemberSection title="Galeria">
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
                {imagens.slice(1).map((src, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-28 h-24 rounded-[10px] overflow-hidden snap-start"
                    style={{
                      border: '0.5px solid var(--separator, var(--c-border))',
                      background: 'var(--surface)',
                    }}
                  >
                    <img src={src} alt={`Foto ${i + 2}`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </MemberSection>
          ) : null}

        </>
      ) : null}
    </div>
  )
}
