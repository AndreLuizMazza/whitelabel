import {
  IdCard,
  QrCode,
  Gift,
  MessageCircle,
  HeartHandshake,
  ShieldCheck,
  Users,
  Clock,
  Percent,
  Store,
  Wallet,
  Video,
  HeartPulse,
  PawPrint,
  Heart,
  Smile,
  BookHeart,
  Globe,
} from 'lucide-react'

const PILL_ICONS = {
  ShieldCheck,
  Users,
  Clock,
  Percent,
  Store,
  Wallet,
  Video,
  HeartPulse,
  PawPrint,
  Heart,
  Smile,
  BookHeart,
  Globe,
  IdCard,
  QrCode,
  Gift,
  MessageCircle,
  HeartHandshake,
}

export default function HeroValuePills({ pills, includeClubeFallbackPill = true }) {
  const safe = Array.isArray(pills) ? pills.filter(Boolean) : []

  let fallback = [
    { icon: 'IdCard', label: 'Carteirinha digital' },
    { icon: 'QrCode', label: 'PIX & boletos' },
    { icon: 'Gift', label: 'Clube de benefícios' },
  ]
  if (!includeClubeFallbackPill) {
    fallback = fallback.filter((p) => p.icon !== 'Gift')
  }

  const list = safe.length ? safe : fallback

  return (
    <div className="hero-value-pills" aria-label="Recursos em destaque">
      <div className="hero-value-pills__track flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:snap-none">
        {list.map((p, idx) => {
          const Icon = PILL_ICONS[p?.icon] || IdCard
          const label = String(p?.label || '').trim() || 'Benefício'
          return (
            <span key={`${p?.icon || 'i'}-${idx}`} className="hero-value-pills__chip">
              <Icon size={12} strokeWidth={2.25} aria-hidden="true" />
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
