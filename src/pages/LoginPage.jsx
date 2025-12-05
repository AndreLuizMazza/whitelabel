// src/pages/LoginPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuth from '@/store/auth'
import { registrarDispositivoFcmWeb } from '@/lib/fcm'
import { Lock } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuth((s) => s.login)

  const [identificador, setIdent] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lembrar, setLembrar] = useState(true)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  // refs para focar campo inválido
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

  // carrega identificador salvo
  useEffect(() => {
    try {
      const saved = localStorage.getItem('login_ident')
      if (saved) setIdent(saved)
    } catch {}
  }, [])

  // se veio do cadastro e sem token, pré-preenche e-mail
  useEffect(() => {
    if (location.state?.postRegister && location.state?.email) {
      setIdent(location.state.email)
    }
  }, [location.state])

  // ao aparecer erro, leva foco para o alerta
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

    // validações simples + foco
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
      // LOGIN
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

      // ================================
      // REGISTRO DO DISPOSITIVO NA API (FCM)
      // ================================
      try {
        console.info('[Login] Iniciando registro do dispositivo FCM (WEB)...')
        await registrarDispositivoFcmWeb()
        console.info('[Login] Registro do dispositivo FCM finalizado (WEB).')
      } catch (err) {
        console.error(
          '[Login] Falha ao registrar dispositivo FCM (WEB):',
          err
        )
        // não bloqueia o login se der erro no FCM
      }

      // REDIRECIONA
      const from = location.state?.from?.pathname || '/area'
      navigate(from, { replace: true })
    } catch (err) {
      console.error(err)
      setErro('Falha no login. Verifique suas credenciais e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div className="container-max max-w-lg relative">
        <div className="min-h-[60vh] py-8 flex flex-col justify-center">
          {/* halo de fundo estilo app de banco */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[72px] mx-auto h-44 max-w-xl rounded-[40px] opacity-80"
            style={{
              background:
                'radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)',
              zIndex: -1,
            }}
          />

          {/* topo da tela / modo app de banco */}
          <header className="mb-6">
            {/* switch login x cadastro */}
            <div
              className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--surface-elevated)_92%,transparent)] p-1 border shadow-sm"
              style={{
                borderColor:
                  'color-mix(in srgb, var(--primary) 24%, transparent)',
              }}
            >
              <button
                type="button"
                className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
              >
                Já sou associado
              </button>
              <button
                type="button"
                onClick={() => navigate('/criar-conta')}
                className="px-4 py-1.5 text-xs font-medium rounded-full hover:bg-[color-mix(in_srgb,var(--surface)_96%,transparent)]"
              >
                Quero me cadastrar
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border"
                style={{ borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)' }}>
                <Lock size={14} />
              </div>
              <p
                className="text-[11px] font-medium uppercase tracking-[0.18em]"
                style={{ color: 'var(--text-muted)' }}
              >
                Área segura do associado
              </p>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Entrar na sua conta
            </h1>
            <p
              className="mt-1 text-sm leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Acompanhe seus planos, dependentes e pagamentos em um ambiente
              moderno e seguro.
            </p>
          </header>

          {/* Aviso pós-cadastro */}
          {location.state?.postRegister && (
            <div
              className="mb-4 rounded-2xl px-4 py-3 text-sm"
              style={{
                border:
                  '1px solid color-mix(in srgb, var(--primary) 26%, transparent)',
                background:
                  'linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), transparent)',
                color: 'var(--text)',
              }}
              role="status"
            >
              <span className="font-medium">Conta criada com sucesso. </span>
              Se necessário, confirme seu e-mail e faça login para continuar.
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div
              ref={alertRef}
              role="alert"
              tabIndex={-1}
              className="mb-3 rounded-2xl px-4 py-3 text-sm"
              style={{
                border:
                  '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                background:
                  'color-mix(in srgb, var(--primary) 14%, transparent)',
                color: 'var(--text)',
              }}
              aria-live="assertive"
            >
              {erro}
            </div>
          )}

          {/* Card do formulário */}
          <form
            onSubmit={onSubmit}
            noValidate
            className="card relative overflow-hidden border-0 shadow-xl p-6 md:p-7 space-y-5 rounded-3xl"
            style={{
              background:
                'linear-gradient(145deg, color-mix(in srgb, var(--surface) 94%, transparent), color-mix(in srgb, var(--surface-elevated) 96%, transparent))',
            }}
          >
            {/* detalhe de gradiente no rodapé do card */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
              style={{
                background:
                  'radial-gradient(120% 140% at 50% 120%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)',
                opacity: 0.6,
              }}
            />

            <fieldset disabled={loading} className="space-y-4 relative z-[1]">
              {/* Identificador */}
              <div className="space-y-1.5">
                <label htmlFor="ident" className="label font-medium text-sm">
                  E-mail ou CPF
                </label>
                <input
                  id="ident"
                  ref={identRef}
                  name="username"
                  className="input h-11 text-sm"
                  placeholder="ex.: joao@email.com ou 000.000.000-00"
                  autoComplete="username"
                  inputMode="email"
                  value={identificador}
                  onChange={(e) => setIdent(e.target.value)}
                  onKeyUp={onKeyDetectCaps}
                  aria-invalid={!identValido}
                  aria-describedby="ident-help"
                  autoFocus
                />
                {!identValido && (
                  <p
                    id="ident-help"
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Informe um e-mail ou CPF com pelo menos 5 caracteres.
                  </p>
                )}
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="senha"
                    className="label font-medium text-sm"
                  >
                    Senha
                  </label>
                  <Link
                    to="/recuperar-senha"
                    className="text-xs font-medium hover:underline"
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
                    className="input h-11 pr-12 text-sm"
                    placeholder="Digite sua senha"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onKeyUp={onKeyDetectCaps}
                    aria-invalid={!senhaValida}
                    aria-describedby="senha-help"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-sm hover:opacity-80 focus:outline-none"
                    style={{ color: 'var(--text)' }}
                    aria-label={
                      showPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                    aria-pressed={showPassword}
                    title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  {!senhaValida ? (
                    <p
                      id="senha-help"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      A senha precisa ter pelo menos 4 caracteres.
                    </p>
                  ) : (
                    <span id="senha-help" className="sr-only">
                      Senha válida
                    </span>
                  )}
                  {capsLock && (
                    <p style={{ color: 'var(--text-muted)' }}>
                      Caps Lock está ativado
                    </p>
                  )}
                </div>
              </div>

              {/* Opções rápidas */}
              <div className="flex items-center justify-between text-sm">
                <label
                  className="inline-flex items-center gap-2 select-none"
                  style={{ color: 'var(--text)' }}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border"
                    style={{ borderColor: 'var(--c-border)' }}
                    checked={lembrar}
                    onChange={(e) => setLembrar(e.target.checked)}
                  />
                  Lembrar de mim neste dispositivo
                </label>
              </div>

              {/* Botão principal */}
              <button
                type="submit"
                className="btn-primary w-full h-11 text-[15px] font-semibold rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed transform-gpu transition-transform duration-150 hover:scale-[1.01] focus:scale-[0.99]"
                disabled={!formValido}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-[color-mix(in_srgb,var(--surface)_80%,transparent)] border-t-[var(--surface)] animate-spin" />
                    Entrando…
                  </span>
                ) : (
                  'Entrar com segurança'
                )}
              </button>

              {/* Separador “ou” */}
              <div className="flex items-center gap-3 my-1">
                <span
                  className="h-px flex-1"
                  style={{ background: 'var(--c-border)' }}
                />
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ou
                </span>
                <span
                  className="h-px flex-1"
                  style={{ background: 'var(--c-border)' }}
                />
              </div>

              {/* Bloco destacado para cadastro */}
              <div
                className="rounded-2xl border px-4 py-3 flex flex-col gap-1 bg-[color-mix(in_srgb,var(--surface-elevated)_96%,transparent)]"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--primary) 22%, transparent)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Novo por aqui?
                    </p>
                    <p className="text-sm font-medium">
                      Crie sua conta em poucos minutos.
                    </p>
                  </div>
                  <Link
                    to="/criar-conta"
                    className="btn-outline h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap"
                  >
                    Criar conta
                  </Link>
                </div>
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Cadastro online rápido, sem papelada e com acesso imediato à
                  área do associado.
                </p>
              </div>

              <p
                className="mt-1 text-[11px] text-center leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                Seus dados são protegidos com criptografia e em conformidade com
                a LGPD.
              </p>
            </fieldset>
          </form>

          <p
            className="text-xs mt-4 text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            Precisa de ajuda? Fale com o suporte da sua unidade.
          </p>
        </div>
      </div>
    </section>
  )
}
