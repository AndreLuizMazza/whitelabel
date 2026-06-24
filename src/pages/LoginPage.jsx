// src/pages/LoginPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import useAuth from '@/store/auth'
import { registrarDispositivoFcmWeb } from '@/lib/fcm'
import { resolvePostAuthDestination } from '@/lib/postAuthNavigation'
import { CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const login = useAuth((s) => s.login)

  const [identificador, setIdent] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lembrar, setLembrar] = useState(true)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  const identRef = useRef(null)
  const senhaRef = useRef(null)
  const alertRef = useRef(null)

  const identValido = useMemo(
    () => identificador.trim().length >= 5,
    [identificador]
  )
  const senhaValida = useMemo(() => senha.length >= 4, [senha])
  const formValido = identValido && senhaValida && !loading

  useEffect(() => {
    setErro('')
  }, [identificador, senha])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('login_ident')
      if (saved) setIdent(saved)
    } catch {}
  }, [])

  useEffect(() => {
    if (location.state?.postRegister && location.state?.email) {
      setIdent(location.state.email)
    }
  }, [location.state])

  useEffect(() => {
    if (erro) {
      setTimeout(() => alertRef.current?.focus(), 0)
    }
  }, [erro])

  function onKeyDetectCaps(e) {
    try {
      setCapsLock(e.getModifierState?.('CapsLock') === true)
    } catch {}
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (loading) return

    if (!identValido) {
      setErro('Informe um e-mail ou CPF válido.')
      identRef.current?.focus()
      return
    }
    if (!senhaValida) {
      setErro('Informe sua senha (mínimo 4 caracteres).')
      senhaRef.current?.focus()
      return
    }

    setErro('')
    setLoading(true)

    try {
      await login(identificador.trim(), senha)

      if (lembrar) {
        try {
          localStorage.setItem('login_ident', identificador.trim())
        } catch {}
      } else {
        try {
          localStorage.removeItem('login_ident')
        } catch {}
      }

      try {
        await registrarDispositivoFcmWeb()
      } catch (err) {
        console.error('[Login] FCM registration failed:', err)
      }

      const { path, state } = await resolvePostAuthDestination({
        rawFrom: location.state?.from,
        intent: location.state?.intent,
      })
      navigate(path, { replace: true, state })
    } catch (err) {
      console.error(err)
      setErro('Falha no login. Verifique suas credenciais e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const veioDoCadastro = Boolean(location.state?.postRegister)
  const sessaoExpirada = searchParams.get('session_expired') === '1'

  return (
    <div className="w-full">
      <header className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-xl font-semibold tracking-tight text-[var(--text)]">
          Entrar na sua conta
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Acesse planos, dependentes e pagamentos.
        </p>
      </header>

      {sessaoExpirada && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm border"
          style={{
            borderColor: 'color-mix(in srgb, var(--danger, #b91c1c) 25%, transparent)',
            background: 'color-mix(in srgb, var(--danger, #b91c1c) 8%, transparent)',
            color: 'var(--text)',
          }}
          role="alert"
        >
          Sua sessão expirou. Faça login novamente para continuar.
        </div>
      )}

      {veioDoCadastro && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm flex gap-2.5 items-start border"
          style={{
            borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
            background: 'color-mix(in srgb, var(--primary) 6%, transparent)',
          }}
          role="status"
        >
          <CheckCircle2
            size={18}
            className="shrink-0 mt-0.5"
            style={{ color: 'var(--primary)' }}
          />
          <p>Conta criada! Faça login com seus dados de acesso.</p>
        </div>
      )}

      {erro && (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="mb-4 rounded-xl px-4 py-3 text-sm border"
          style={{
            borderColor: 'color-mix(in srgb, #dc2626 25%, transparent)',
            background: 'color-mix(in srgb, #dc2626 6%, transparent)',
            color: 'var(--text)',
          }}
          aria-live="assertive"
        >
          {erro}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-2xl border p-5 md:p-6 shadow-sm"
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
              ref={identRef}
              name="username"
              className={`input h-12 md:h-11 w-full text-base md:text-sm rounded-xl ${
                !identValido && identificador ? 'ring-1 ring-red-500' : ''
              }`}
              placeholder="ex.: joao@email.com"
              autoComplete="username"
              inputMode="email"
              value={identificador}
              onChange={(e) => setIdent(e.target.value)}
              onKeyUp={onKeyDetectCaps}
              aria-invalid={!identValido && !!identificador}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="senha" className="label font-medium text-sm">
                Senha
              </label>
              <Link
                to="/recuperar-senha"
                className="text-xs font-medium hover:underline min-h-[44px] inline-flex items-center"
                style={{ color: 'var(--primary)' }}
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative">
              <input
                id="senha"
                ref={senhaRef}
                name="password"
                className={`input h-12 md:h-11 w-full pr-12 text-base md:text-sm rounded-xl ${
                  !senhaValida && senha ? 'ring-1 ring-red-500' : ''
                }`}
                placeholder="Sua senha"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyUp={onKeyDetectCaps}
                aria-invalid={!senhaValida && !!senha}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-r-xl"
                style={{ color: 'var(--text-muted)' }}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {capsLock && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Caps Lock está ativado.
              </p>
            )}
          </div>

          <label
            className="inline-flex items-center gap-2.5 select-none text-sm min-h-[44px]"
            style={{ color: 'var(--text)' }}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border"
              style={{ borderColor: 'var(--c-border)' }}
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
            />
            Manter conectado neste dispositivo
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            full
            loading={loading}
            disabled={!formValido}
            className="min-h-[48px] font-semibold rounded-xl md:rounded-lg"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </fieldset>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Não tem conta?{' '}
        <Link
          to="/criar-conta"
          state={
            location.state?.from
              ? { from: location.state.from, intent: location.state?.intent }
              : { intent: 'onboarding' }
          }
          className="font-semibold hover:underline"
          style={{ color: 'var(--primary)' }}
        >
          Criar conta
        </Link>
      </p>

      <p
        className="mt-4 text-xs text-center leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        Seus dados são protegidos em conformidade com a LGPD.
      </p>
    </div>
  )
}
