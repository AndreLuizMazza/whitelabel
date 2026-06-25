import { Link } from 'react-router-dom'
import { KeyRound, ShieldAlert } from 'lucide-react'
import TenantSupportPanel from '@/components/auth/TenantSupportPanel.jsx'
import Button from '@/components/ui/Button.jsx'

function HelpCard({ icon: Icon, title, description, to, cta }) {
  return (
    <div
      className="rounded-2xl border p-4 md:p-5"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--c-border)',
      }}
    >
      <div className="flex gap-3 items-start">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
            color: 'var(--primary)',
          }}
        >
          <Icon size={20} strokeWidth={2} aria-hidden />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
          <Button
            as={Link}
            to={to}
            variant="outline"
            size="sm"
            className="mt-3 min-h-[44px] rounded-xl"
          >
            {cta}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AjudaAcessoPage() {
  return (
    <div className="w-full">
      <header className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-xl font-semibold tracking-tight text-[var(--text)]">
          Precisa de ajuda para acessar?
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Recupere sua senha ou fale com nossa equipe. Estamos aqui para ajudar.
        </p>
      </header>

      <div className="space-y-3">
        <HelpCard
          icon={KeyRound}
          title="Recuperar senha"
          description="Informe seu e-mail ou CPF. Se estiver cadastrado, enviaremos um código por e-mail."
          to="/recuperar-senha"
          cta="Recuperar senha"
        />

        <HelpCard
          icon={ShieldAlert}
          title="Outros problemas de acesso"
          description="CPF não reconhecido, e-mail antigo ou telefone desatualizado? Nossa equipe pode orientar com segurança."
          to="/filiais"
          cta="Ver canais de atendimento"
        />
      </div>

      <div className="mt-6">
        <TenantSupportPanel
          title="Atendimento humano"
          subtitle="Preferir falar com alguém? Nossa equipe atende por WhatsApp e telefone."
        />
      </div>

      <p
        className="mt-6 text-xs text-center leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Por segurança, não informamos se um CPF ou e-mail está cadastrado.
      </p>

      <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        <Link
          to="/login"
          className="font-semibold hover:underline"
          style={{ color: 'var(--primary)' }}
        >
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}
