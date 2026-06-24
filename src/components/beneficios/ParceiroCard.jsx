import { Link } from 'react-router-dom'
import { BadgePercent, ChevronRight, MapPin } from 'lucide-react'
import { CLUB_PLACEHOLDER, fmtBeneficio, mapsLink } from './beneficiosUtils'

function ImgWithFallback({ src, alt, className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

function BeneficioChip({ label, value, extraCount = 0, compact = false }) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full text-xs ${
        compact ? 'px-2 py-0.5' : 'px-2.5 py-1'
      }`}
      style={{ border: '1px solid var(--c-border)', background: 'var(--surface)', color: 'var(--text)' }}
    >
      <span className="shrink-0" style={{ color: 'var(--primary)' }}>
        <BadgePercent size={compact ? 12 : 14} />
      </span>
      <span className="truncate">
        {label} • <b>{value}</b>
      </span>
      {extraCount > 0 ? (
        <span
          className="ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ background: 'var(--primary-12)', color: 'var(--primary)' }}
        >
          +{extraCount}
        </span>
      ) : null}
    </div>
  )
}

function ParceiroMemberRow({ p, detailBase }) {
  const hasImg = p?.imagem && String(p.imagem).trim()
  const beneficios = Array.isArray(p?.beneficios) ? p.beneficios : []
  const principal = beneficios[0]
  const extraCount = Math.max(0, beneficios.length - 1)
  const cidade = [p?.endereco?.cidade, p?.endereco?.uf].filter(Boolean).join(' · ')
  const detailParts = []
  if (principal) detailParts.push(`${principal.descricao} · ${fmtBeneficio(principal)}`)
  else if (cidade) detailParts.push(cidade)
  if (extraCount > 0) detailParts.push(`+${extraCount} benefício${extraCount > 1 ? 's' : ''}`)

  return (
    <Link
      to={`${detailBase}/${p.id}`}
      className="flex items-center gap-3 w-full min-h-[64px] px-4 py-3 text-left transition active:opacity-70"
      aria-label={p?.nome || 'Parceiro'}
    >
      <span
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px]"
        style={{
          background: 'color-mix(in srgb, var(--text) 5%, var(--surface))',
          border: '0.5px solid var(--separator, var(--c-border))',
        }}
      >
        {hasImg ? (
          <ImgWithFallback
            src={p.imagem}
            alt=""
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <BadgePercent size={18} strokeWidth={1.85} style={{ color: 'var(--primary)' }} />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[17px] font-semibold leading-snug truncate" style={{ color: 'var(--text)' }}>
          {p?.nome}
        </span>
        {detailParts.length ? (
          <span className="block text-[13px] mt-0.5 leading-snug truncate" style={{ color: 'var(--text-muted)' }}>
            {detailParts.join(' · ')}
          </span>
        ) : null}
      </span>
      <ChevronRight
        size={17}
        strokeWidth={2.5}
        className="shrink-0 opacity-35"
        style={{ color: 'var(--text-muted)' }}
        aria-hidden="true"
      />
    </Link>
  )
}

export default function ParceiroCard({
  p,
  detailBase = '/area/beneficios',
  compact = false,
  variant = 'card',
}) {
  if (variant === 'member') {
    return <ParceiroMemberRow p={p} detailBase={detailBase} />
  }

  const hasImg = p?.imagem && String(p.imagem).trim()
  const beneficios = Array.isArray(p?.beneficios) ? p.beneficios : []
  const principal = beneficios[0]
  const extraCount = Math.max(0, beneficios.length - 1)

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-md transition hover:-translate-y-[2px] hover:shadow-lg ${
        compact ? 'rounded-[20px]' : ''
      }`}
      style={{ borderColor: 'var(--c-border)', background: 'var(--surface)' }}
    >
      <div
        className={`w-full flex items-center justify-center ${compact ? 'h-32' : 'h-40'}`}
        style={{
          background: 'var(--surface)',
          backgroundImage: `url(${CLUB_PLACEHOLDER})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain',
        }}
      >
        {hasImg ? (
          <ImgWithFallback
            src={p.imagem}
            alt={p?.nome || 'Parceiro'}
            className="max-h-full max-w-full object-contain"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3
          className="mb-2 text-base font-bold leading-tight line-clamp-2"
          style={{ color: 'var(--text)' }}
        >
          {p?.nome}
        </h3>

        {principal ? (
          <BeneficioChip
            label={principal.descricao}
            value={fmtBeneficio(principal)}
            extraCount={extraCount}
          />
        ) : null}

        <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
          <Link
            to={`${detailBase}/${p.id}`}
            className="btn-primary w-full justify-center text-sm"
          >
            Ver detalhes
          </Link>
          <a
            href={mapsLink(p?.endereco)}
            target="_blank"
            rel="noreferrer"
            className="btn-outline w-full justify-center text-sm"
          >
            <MapPin size={14} />
            Como chegar
          </a>
        </div>
      </div>
    </article>
  )
}
