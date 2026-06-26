import { Link } from 'react-router-dom'
import { ArrowRight, Flower2, Heart, Landmark } from 'lucide-react'

import CTAButton from '@/components/ui/CTAButton'
import PublicPageHeader from '@/components/public/PublicPageHeader'

export default function MemorialCTA({ onVisitMemorial }) {
  return (
    <section id="memorial-cta" className="public-section">
      <div className="container-max">
        <PublicPageHeader
          kicker="Homenagens e lembranças"
          title="Visite nosso Memorial Online"
          description="Espaço respeitoso para homenagens, mensagens de carinho e informações das cerimônias."
          align="center"
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-3 max-w-3xl mx-auto text-left">
          {[
            { icon: Flower2, text: 'Flores e velas virtuais' },
            { icon: Heart, text: 'Mensagens de apoio' },
            { icon: Landmark, text: 'Informações de cerimônias' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 rounded-xl bg-[var(--surface)]/90 p-3 border"
              style={{ borderColor: 'color-mix(in srgb, var(--primary) 20%, var(--c-border))' }}
            >
              <Icon className="h-5 w-5 shrink-0" style={{ color: 'var(--primary)' }} />
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <CTAButton
            onClick={onVisitMemorial}
            iconAfter={<ArrowRight size={16} />}
            size="lg"
          >
            Acessar o Memorial
          </CTAButton>
          <Link
            to="/memorial"
            className="text-sm font-semibold min-h-[44px] inline-flex items-center hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            Ver homenagens recentes
          </Link>
        </div>
      </div>
    </section>
  )
}
