import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import Button from '@/components/ui/Button.jsx'
import TenantSupportPanel from '@/components/auth/TenantSupportPanel.jsx'

export default function RecuperarSenha() {
  const navigate = useNavigate()
  const [ident, setIdent] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const alertRef = useRef(null)
  const identValido = useMemo(() => ident.trim().length >= 5, [ident])

  useEffect(() => {
    setErro('')
  }, [ident])
  useEffect(() => {
    if (erro) setTimeout(() => alertRef.current?.focus(), 0)
  }, [erro])

  async function onSubmit(e) {
    e.preventDefault()
    if (!identValido || loading) return

    setErro('')
    setLoading(true)

    try {
      await api.post('/api/v1/app/password/forgot', {
        ident: ident.trim(),
        identifier: ident.trim(),
      })

      localStorage.setItem('recuperacao.identifier', ident.trim())
      setEnviado(true)
    } catch (e) {
      console.error(e)
      setErro(
        'Não foi possível iniciar a recuperação agora. Tente novamente ou fale conosco.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <header className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-xl font-semibold tracking-tight text-[var(--text)]">
          Recuperar senha
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Informe seu e-mail ou CPF para receber as instruções.
        </p>
      </header>

      {erro && (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="mb-4 rounded-xl px-4 py-3 text-sm border"
          style={{
            borderColor: 'color-mix(in srgb, var(--danger, #b91c1c) 25%, transparent)',
            background: 'color-mix(in srgb, var(--danger, #b91c1c) 8%, transparent)',
            color: 'var(--text)',
          }}
          aria-live="assertive"
        >
          {erro}
        </div>
      )}

      {enviado ? (
        <div
          className="rounded-2xl border p-5 md:p-6 shadow-sm"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--c-border)',
          }}
        >
          <p className="text-sm leading-relaxed text-[var(--text)]">
            Se o e-mail informado estiver cadastrado, você receberá um e-mail com um código para
            redefinir sua senha.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              type="button"
              variant="primary"
              size="lg"
              full
              className="min-h-[48px] rounded-xl"
              onClick={() => navigate('/redefinir-senha')}
            >
              Já tenho o código
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              full
              className="min-h-[48px] rounded-xl"
              onClick={() => {
                setEnviado(false)
                setIdent('')
              }}
            >
              Enviar novamente
            </Button>

            <Button
              as={Link}
              to="/login"
              variant="ghost"
              size="lg"
              full
              className="min-h-[48px] rounded-xl"
            >
              Voltar ao login
            </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-2xl border p-5 md:p-6 shadow-sm space-y-4"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--c-border)',
          }}
        >
          <fieldset disabled={loading} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="ident" className="label font-medium text-sm">
                E-mail ou CPF
              </label>
              <input
                id="ident"
                className="input h-12 md:h-11 w-full text-base md:text-sm rounded-xl"
                placeholder="voce@email.com ou 000.000.000-00"
                value={ident}
                onChange={(e) => setIdent(e.target.value)}
                autoComplete="username"
                inputMode="email"
                aria-invalid={!identValido && !!ident}
                autoFocus
              />
              {!identValido && ident && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Informe um e-mail ou CPF com pelo menos 5 caracteres.
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              full
              loading={loading}
              disabled={!identValido || loading}
              className="min-h-[48px] font-semibold rounded-xl"
            >
              {loading ? 'Enviando…' : 'Enviar instruções'}
            </Button>

            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Já recebeu o e-mail?{' '}
              <button
                type="button"
                className="font-semibold hover:underline"
                style={{ color: 'var(--primary)' }}
                onClick={() => navigate('/redefinir-senha')}
              >
                Já tenho o código
              </button>
            </p>

            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Lembrou a senha?{' '}
              <Link
                to="/login"
                className="font-semibold hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Entrar
              </Link>
            </p>
          </fieldset>
        </form>
      )}

      <div className="mt-6">
        <TenantSupportPanel compact />
      </div>

      <p
        className="mt-4 text-xs text-center leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Por segurança, não informamos se um CPF ou e-mail está cadastrado.
      </p>
    </div>
  )
}
