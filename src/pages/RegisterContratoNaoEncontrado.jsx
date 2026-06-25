import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import TenantSupportPanel from '@/components/auth/TenantSupportPanel.jsx'
import Button from '@/components/ui/Button.jsx'
import useAuth from '@/store/auth'

export default function RegisterContratoNaoEncontrado() {
  const navigate = useNavigate()
  const logout = useAuth((s) => s.logout)

  async function tentarOutroCpf() {
    try {
      await logout({ skipServer: false })
    } catch {
      /* segue mesmo se falhar no servidor */
    }
    navigate('/criar-conta', { replace: true, state: { intent: 'cliente' } })
  }

  return (
    <div className="w-full">
      <div
        className="rounded-2xl border px-4 py-5 md:px-6 md:py-6 text-center"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--c-border)',
        }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
            color: 'var(--primary)',
          }}
        >
          <AlertCircle size={24} aria-hidden />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-[var(--text)]">
          Contrato não encontrado
        </h1>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Não localizamos contrato ativo com o CPF informado. Confira os números ou fale com
          nossa equipe — estamos prontos para ajudar.
        </p>
        <p
          className="mt-3 text-xs leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Sua conta digital foi criada, mas ainda não está vinculada a um contrato neste CPF.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <Button
            type="button"
            onClick={() => navigate('/area', { replace: true })}
            variant="primary"
            size="lg"
            full
            className="min-h-[48px] rounded-xl"
          >
            Ir para minha área
          </Button>
          <Button
            type="button"
            onClick={tentarOutroCpf}
            variant="outline"
            size="lg"
            full
            className="min-h-[48px] rounded-xl"
          >
            Tentar com outro CPF
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <TenantSupportPanel compact />
      </div>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Quer contratar um plano?{' '}
        <Link to="/planos" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
          Ver planos disponíveis
        </Link>
      </p>
    </div>
  )
}
