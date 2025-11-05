// src/pages/Home.jsx
import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import useTenant from '@/store/tenant'
import useAuth from '@/store/auth'

import PlanosCTA from '@/components/PlanosCTA'
import MemorialCTA from '@/components/MemorialCTA'
import ParceirosCTA from '@/components/ParceirosCTA'
import StatsStrip from '@/components/StatsStrip'
import FaqSection from '@/components/faq/FaqSection.jsx'

import CTAButton from '@/components/ui/CTAButton'
import {
  Layers, BadgePercent, Receipt, UserSquare2,
  Smartphone, Apple, ArrowRight, IdCard, QrCode, Gift, HelpCircle, ChevronDown
} from 'lucide-react'
import { usePrimaryColor as usePrimaryColorLocal } from '@/lib/themeColor'

// hook centralizado para pegar as cores primárias do tema
function usePrimaryColor() { return usePrimaryColorLocal() }

/* ===================== peças utilitárias ===================== */

function IconBadge({ children }) {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--text)] ring-1 ring-[var(--c-border)] shadow-sm">
      {children}
    </span>
  )
}

function FeatureCard({ icon, title, desc, to, cta, mounted, delay = 0 }) {
  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${title}. ${cta}`}
      onClick={() => to && (window.location.href = to)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          to && (window.location.href = to)
        }
      }}
      className={[
        'group card p-5 md:p-6 transition-all duration-500 will-change-transform cursor-pointer',
        'hover:-translate-y-[3px] hover:shadow-2xl hover:ring-1 hover:ring-[var(--c-border)] hover:bg-[var(--surface)]',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-[color-mix(in_srgb,var(--primary)_50%,black)]',
      ].join(' ')}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <IconBadge>{icon}</IconBadge>
        <div>
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <p className="mt-1 text-sm text-[var(--text)]">{desc}</p>
        </div>
      </div>

      <div className="pt-5">
        <CTAButton as="link" to={to} iconAfter={<ArrowRight size={16} />}>
          {cta}
        </CTAButton>
      </div>
    </div>
  )
}

/** Botão padronizado para as lojas (usa CTAButton outline com ícone) */
function AppStoreButton({ href, icon, children, delay = 0 }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])
  return (
    <CTAButton
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="outline"
      size="lg"
      iconBefore={icon}
      className={[
        'transition-all duration-500',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </CTAButton>
  )
}

function ValuePills() {
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] text-[var(--text)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--c-border)]">
        <IdCard size={14}/> Carteirinha digital
      </span>
      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] text-[var(--text)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--c-border)]">
        <QrCode size={14}/> PIX & boletos
      </span>
      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] text-[var(--text)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--c-border)]">
        <Gift size={14}/> Clube de benefícios
      </span>
    </div>
  )
}

/* ============================== HOME ============================== */

export default function Home() {
  const empresa = useTenant(s => s.empresa)
  const { isAuthenticated, token, user } = useAuth(s => ({
    isAuthenticated: s.isAuthenticated, token: s.token, user: s.user,
  }))
  const isLogged = isAuthenticated() || !!token || !!user

  const ANDROID_URL = import.meta.env.VITE_ANDROID_URL || '#'
  const IOS_URL = import.meta.env.VITE_IOS_URL || '#'

  const { base, dark } = usePrimaryColor()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  // monta link do WhatsApp dinamicamente a partir do telefone do tenant
  const whatsappHref = useMemo(() => {
    let tel = empresa?.contato?.telefone || ''
    let digits = String(tel).replace(/\D+/g, '')
    if (!digits) return ''
    if (!digits.startsWith('55')) digits = '55' + digits
    const msg = encodeURIComponent('Olá! Quero ser parceiro.')
    return `https://wa.me/${digits}?text=${msg}`
  }, [empresa])

  return (
    <section className="section">
      <div className="container-max relative overflow-hidden">
        {/* blobs decorativos (suaves, pegam a cor do tema) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="home-blob" style={{ background: `radial-gradient(30% 35% at 12% 10%, ${base}22, transparent 60%)` }} />
          <div className="home-blob delay-300" style={{ background: `radial-gradient(30% 35% at 88% -5%, ${dark}22, transparent 60%)` }} />
        </div>

        {/* HERO */}
        <header className={['relative text-center mb-6 md:mb-8 transition-all duration-700', mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'].join(' ')}>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Bem-vindo</h1>
          <p className="mt-2 text-[var(--text)]" aria-live="polite">
            <span className="font-semibold">{empresa?.nomeFantasia || '—'}</span>
          </p>
          <ValuePills />
        </header>

        {/* QUADRO DE AÇÕES */}
        <div className="relative grid gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Layers size={22} />}
            title="Planos"
            desc="Veja planos, detalhes e simule preços."
            to="/planos"
            cta="Ver planos"
            mounted={mounted}
            delay={60}
          />
          <FeatureCard
            icon={<BadgePercent size={22} />}
            title="Clube de Benefícios"
            desc="Parceiros com descontos e vantagens para associados."
            to="/beneficios"
            cta="Ver parceiros"
            mounted={mounted}
            delay={130}
          />
          <FeatureCard
            icon={<Receipt size={22} />}
            title="Segunda via do Boleto"
            desc="Consulte contratos e situação de cobrança sem senha."
            to="/contratos"
            cta="Pesquisar"
            mounted={mounted}
            delay={200}
          />
          <FeatureCard
            icon={<UserSquare2 size={22} />}
            title="Área do Associado"
            desc="Acesse contratos, dependentes e pagamentos."
            to={isLogged ? '/area' : '/login'}
            cta="Abrir área"
            mounted={mounted}
            delay={270}
          />
        </div>

        {/* APP SECTION */}
        <div className={['relative mt-10 md:mt-12 card p-0 overflow-hidden transition-all duration-700', mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'].join(' ')} style={{ transitionDelay: '320ms' }}>
          <div className="grid md:grid-cols-2">
            <div className="p-6 md:p-8 lg:p-10">
              <h2 className="text-2xl font-extrabold text-[var(--primary)]">Baixe nosso aplicativo</h2>
              <p className="mt-2 text-[var(--text)]">
                Tenha carteirinha digital, boletos, PIX e benefícios sempre à mão.
                Acompanhe seus contratos e receba notificações de vencimentos no celular.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <AppStoreButton href={ANDROID_URL} icon={<Smartphone size={16} />} delay={380}>
                  Baixar para Android
                </AppStoreButton>
                <AppStoreButton href={IOS_URL} icon={<Apple size={16} />} delay={450}>
                  Baixar para iOS
                </AppStoreButton>
              </div>
              {!import.meta.env.VITE_ANDROID_URL && !import.meta.env.VITE_IOS_URL && (
                <p className="mt-3 text-xs text-[var(--text)]">
                  * Links das lojas ainda não configurados. Defina <code>VITE_ANDROID_URL</code> e <code>VITE_IOS_URL</code> no seu <code>.env</code>.
                </p>
              )}
            </div>
            <div className="bg-[var(--surface)] flex items-center justify-center p-8 lg:p-10">
              <div className="rounded-2xl border bg-[var(--surface)]/70 p-10 text-center shadow-sm">
                <div className="text-sm font-semibold text-[var(--text)]">App do Associado</div>
                <div className="mt-1 text-xs text-[var(--text)]">Carteirinha • Pagamentos • Benefícios</div>
              </div>
            </div>
          </div>
        </div>

        {/* PROVA SOCIAL */}
        <StatsStrip associados="12.4k+" parceiros="180+" avaliacao="4.8/5" />

        {/* CTA PLANOS */}
        <div className="mt-12 md:mt-16">
          <PlanosCTA onSeePlans={() => (window.location.href = '/planos')} />
        </div>

        {/* CTA MEMORIAL */}
        <div className="mt-12 md:mt-16">
          <MemorialCTA onVisitMemorial={() => (window.location.href = '/memorial')} />
        </div>

        {/* CTA PARCEIROS */}
        <div className="mt-12 md:mt-16">
          <ParceirosCTA
            onBecomePartner={() => (window.location.href = '/parceiros/inscrever')}
            whatsappHref={whatsappHref}
          />
        </div>

        {/* FAQ */}
        <div className="faq-dark mt-12 md:mt-16">
          <FaqSection isLogged={isLogged} areaDest={isLogged ? '/area' : '/login'} />
        </div>
      </div>
    </section>
  )
}
