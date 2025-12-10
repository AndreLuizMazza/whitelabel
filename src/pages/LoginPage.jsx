// src/pages/LoginPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuth from '@/store/auth'
import { registrarDispositivoFcmWeb } from '@/lib/fcm'
import { Lock, UserPlus, CheckCircle2 } from 'lucide-react'

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

      // REGISTRO DO DISPOSITIVO NA API (FCM)
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

  const veioDoCadastro = Boolean(location.state?.postRegister)

  return (
    <section className="section">
      <div className="container-max max-w-4xl relative">
        <div className="min-h-[60vh] py-8 flex flex-col justify-center">
          {/* halo de fundo premium, discreto */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[72px] mx-auto h-40 max-w-2xl rounded-[48px] opacity-70"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)',
              zIndex: -1,
            }}
          />

          {/* topo / header */}
          <header className="mb-6">
            {/* switch login x cadastro - mesmo conceito da tela de registro */}
            <div
              className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--surface-elevated)_94%,transparent)] p-1 border shadow-sm"
              style={{
                borderColor:
                  'color-mix(in srgb, var(--primary) 28%, transparent)',
              }}
            >
              <button
                type="button"
                className="px-4 py-1.5 text-xs md:text-sm font-semibold rounded-full bg-[color-mix(in_srgb,var(--primary)_22%,transparent)] inline-flex items-center gap-1.5"
              >
                <Lock size={14} />
                <span>Entrar</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/criar-conta')}
                className="px-4 py-1.5 text-xs md:text-sm font-medium rounded-full hover:bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] inline-flex items-center gap-1.5"
              >
                <UserPlus size={14} />
                <span>Criar conta</span>
              </button>
            </div>

            <h1 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight">
              Acesse sua área do associado
            </h1>
            <p
              className="mt-1 text-sm md:text-base leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Veja seus planos, dependentes e pagamentos em um ambiente moderno,
              seguro e fácil de usar.
            </p>
          </header>

          {/* feedback pós-cadastro com destaque premium */}
          {veioDoCadastro && (
            <div
              className="mb-4 rounded-2xl px-4 py-3 text-sm md:text-base flex gap-2 items-start"
              style={{
                border:
                  '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
                background:
                  'color-mix(in srgb, var(--primary) 10%, transparent)',
                color: 'var(--text)',
              }}
              role="status"
            >
              <CheckCircle2
                size={20}
                style={{ color: 'var(--primary)', marginTop: 2 }}
              />
              <div>
                <p className="font-medium">
                  Conta criada com sucesso, agora é só fazer login.
                </p>
                <p className="text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>
                  Se necessário, confirme seu e-mail e depois use seus dados de
                  acesso aqui.
                </p>
              </div>
            </div>
          )}

          {/* Erro global */}
          {erro && (
            <div
              ref={alertRef}
              role="alert"
              tabIndex={-1}
              className="mb-4 rounded-2xl px-4 py-3 text-sm md:text-base"
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

          {/* Card principal em 2 colunas (form + destaque cadastro) */}
          <form
            onSubmit={onSubmit}
            noValidate
            className="relative overflow-hidden p-6 md:p-8 rounded-3xl border shadow-xl"
            style={{
              background:
                'color-mix(in srgb, var(--surface) 88%, var(--text) 6%)',
              borderColor: 'color-mix(in srgb, var(--text) 18%, transparent)',
            }}
          >
            {/* gradiente suave no rodapé do card */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
              style={{
                background:
                  'radial-gradient(120% 140% at 50% 120%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)',
                opacity: 0.6,
              }}
            />

            <fieldset
              disabled={loading}
              className="relative z-[1] grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 md:gap-8 items-start"
            >
              {/* COLUNA ESQUERDA – FORMULÁRIO COM FUNDO PRÓPRIO */}
              <div
                className="rounded-2xl border px-4 py-4 md:px-5 md:py-5 space-y-5"
                style={{
                  background:
                    'color-mix(in srgb, var(--surface-elevated) 88%, var(--text) 6%)',
                  borderColor:
                    'color-mix(in srgb, var(--text) 16%, transparent)',
                }}
              >
                <div className="space-y-1">
                  <p className="text-xs md:text-sm font-semibold tracking-wide uppercase">
                    Faça login em poucos segundos
                  </p>
                  <p
                    className="text-xs md:text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Basta informar seu e-mail ou CPF e a senha cadastrada.
                  </p>
                </div>

                {/* Identificador */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="ident"
                    className="label font-medium text-sm md:text-base"
                  >
                    E-mail ou CPF
                  </label>
                  <input
                    id="ident"
                    ref={identRef}
                    name="username"
                    className={`input h-11 md:h-12 text-sm md:text-base bg-white ${
                      !identValido && identificador
                        ? 'ring-1 ring-red-500'
                        : ''
                    }`}
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
                  <div className="flex items-center justify-between text-[11px] md:text-xs">
                    {!identValido && identificador ? (
                      <p
                        id="ident-help"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Verifique se digitou corretamente seu e-mail ou CPF.
                      </p>
                    ) : (
                      <span id="ident-help" className="sr-only">
                        Identificador válido
                      </span>
                    )}
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="senha"
                      className="label font-medium text-sm md:text-base"
                    >
                      Senha
                    </label>
                    <Link
                      to="/recuperar-senha"
                      className="text-[11px] md:text-xs font-medium hover:underline"
                      style={{ color: 'var(--primary)' }}
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                  <div
                    className={`relative ${
                      !senhaValida && senha ? 'ring-1 ring-red-500 rounded-md' : ''
                    }`}
                  >
                    <input
                      id="senha"
                      ref={senhaRef}
                      name="password"
                      className="input h-11 md:h-12 pr-12 text-sm md:text-base bg-white"
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
                  <div className="flex items-center justify-between text-[11px] md:text-xs">
                    {!senhaValida && senha ? (
                      <p id="senha-help" style={{ color: 'var(--text-muted)' }}>
                        Use ao menos 4 caracteres para sua senha.
                      </p>
                    ) : (
                      <span id="senha-help" className="sr-only">
                        Senha válida
                      </span>
                    )}
                    {capsLock && (
                      <p style={{ color: 'var(--text-muted)' }}>
                        Caps Lock está ativado.
                      </p>
                    )}
                  </div>
                </div>

                {/* Opções rápidas */}
                <div className="flex items-center justify-between text-xs md:text-sm">
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
                    Manter conectado neste dispositivo
                  </label>
                </div>

                {/* Botão principal */}
                <button
                  type="submit"
                  className="btn-primary w-full h-11 md:h-12 text-[15px] md:text-base font-semibold rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed transform-gpu transition-transform duration-150 hover:scale-[1.01] focus:scale-[0.99]"
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

                <p
                  className="mt-1 text-[11px] md:text-xs text-center leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Seus dados são protegidos com criptografia e em conformidade
                  com a LGPD.
                </p>
              </div>

              {/* COLUNA DIREITA – VALORIZAR CADASTRO */}
              <aside
                className="rounded-2xl border px-4 py-4 md:px-5 md:py-5 flex flex-col justify-between gap-4"
                style={{
                  background:
                    'color-mix(in srgb, var(--surface-elevated) 94%, transparent)',
                  borderColor:
                    'color-mix(in srgb, var(--primary) 20%, transparent)',
                }}
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] md:text-xs"
                    style={{
                      background:
                        'color-mix(in srgb, var(--primary) 12%, transparent)',
                      color: 'var(--text)',
                    }}
                  >
                    <span
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ background: 'var(--primary)', color: 'white' }}
                    >
                      <UserPlus size={12} />
                    </span>
                    <span>Novo por aqui?</span>
                  </div>

                  <h2 className="text-sm md:text-base font-semibold">
                    Crie sua conta em poucos minutos
                  </h2>
                  <p
                    className="text-xs md:text-sm leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    O cadastro é 100% online, sem papelada e com acesso imediato
                    à área do associado.
                  </p>

                  <ul className="mt-1 space-y-1.5 text-xs md:text-sm">
                    <li className="flex items-start gap-2">
                      <span
                        className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: 'var(--primary)' }}
                      />
                      <span>Visualize seus contratos e mensalidades.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span
                        className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: 'var(--primary)' }}
                      />
                      <span>Gerencie dependentes e dados cadastrais.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span
                        className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: 'var(--primary)' }}
                      />
                      <span>Emita segunda via e facilite seus pagamentos.</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate('/criar-conta')}
                    className="btn-outline w-full justify-center rounded-2xl h-11 md:h-12 text-sm md:text-base font-semibold"
                  >
                    Criar minha conta agora
                  </button>
                  <p
                    className="text-[11px] md:text-xs text-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Ao criar sua conta, você concorda com os Termos de Uso e com
                    a Política de Privacidade da sua unidade.
                  </p>
                </div>
              </aside>
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
