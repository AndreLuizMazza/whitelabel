// src/pages/LoginPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuth from '@/store/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuth(s => s.login)

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

  const identValido = useMemo(() => identificador.trim().length >= 5, [identificador])
  const senhaValida = useMemo(() => senha.length >= 4, [senha])
  const formValido = identValido && senhaValida && !loading

  useEffect(() => { setErro('') }, [identificador, senha])

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
    try { setCapsLock(e.getModifierState?.('CapsLock') === true) } catch {}
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
      await login(identificador.trim(), senha)

      if (lembrar) {
        try { localStorage.setItem('login_ident', identificador.trim()) } catch {}
      } else {
        try { localStorage.removeItem('login_ident') } catch {}
      }

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
      <div className="container-max max-w-lg">
        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Entrar</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            Acesse sua conta para gerenciar planos, dependentes e benefícios.
          </p>
        </div>

        {/* Aviso pós-cadastro */}
        {location.state?.postRegister && (
          <div
            className="mb-4 rounded-lg px-3 py-2 text-sm"
            style={{
              border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
              background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
              color: 'var(--text)'
            }}
            role="status"
          >
            Conta criada! Se necessário, confirme seu e-mail e faça login para continuar.
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div
            ref={alertRef}
            role="alert"
            tabIndex={-1}
            className="mb-3 rounded-lg px-3 py-2 text-sm"
            style={{
              border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              color: 'var(--text)'
            }}
            aria-live="assertive"
          >
            {erro}
          </div>
        )}

        {/* Card do formulário */}
        <form onSubmit={onSubmit} noValidate className="card p-6 md:p-8 space-y-4 shadow-lg">
          <fieldset disabled={loading} className="space-y-4">
            {/* Identificador */}
            <div className="space-y-1">
              <label htmlFor="ident" className="label font-medium">E-mail ou CPF</label>
              <input
                id="ident"
                ref={identRef}
                name="username"
                className="input"
                placeholder="ex.: joao@email.com ou 000.000.000-00"
                autoComplete="username"
                inputMode="email"
                value={identificador}
                onChange={(e) => setIdent(e.target.value)}
                onKeyUp={onKeyDetectCaps}
                aria-invalid={!identValido}
                aria-describedby="ident-help"
              />
              {!identValido && (
                <p id="ident-help" className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Informe um e-mail ou CPF com pelo menos 5 caracteres.
                </p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="senha" className="label font-medium">Senha</label>
                <Link to="/recuperar-senha" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <input
                  id="senha"
                  ref={senhaRef}
                  name="password"
                  className="input pr-12"
                  placeholder="Sua senha"
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
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 px-3 hover:opacity-80 focus:outline-none"
                  style={{ color: 'var(--text)' }}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                {!senhaValida ? (
                  <p id="senha-help" className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    A senha precisa ter pelo menos 4 caracteres.
                  </p>
                ) : (
                  <span id="senha-help" className="sr-only">Senha válida</span>
                )}
                {capsLock && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Caps Lock está ativado
                  </p>
                )}
              </div>
            </div>

            {/* Opções rápidas */}
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm select-none" style={{ color: 'var(--text)' }}>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border"
                  style={{ borderColor: 'var(--c-border)' }}
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                />
                Lembrar de mim
              </label>

              <Link to="/criar-conta" className="text-sm font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                Criar conta
              </Link>
            </div>

            {/* Enviar */}
            <button
              type="submit"
              className="btn-primary w-full h-11 text-base disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!formValido}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>

            {/* Ações secundárias */}
            <div className="grid grid-cols-2 gap-3">
              <Link to="/criar-conta" className="btn-outline h-11 w-full justify-center text-sm font-medium" aria-disabled={loading}>
                Cadastrar-se
              </Link>
              <Link to="/recuperar-senha" className="btn-outline h-11 w-full justify-center text-sm font-medium" aria-disabled={loading}>
                Recuperar senha
              </Link>
            </div>
          </fieldset>
        </form>

        <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          Precisa de ajuda? Fale com o suporte da sua unidade.
        </p>
      </div>
    </section>
  )
}
