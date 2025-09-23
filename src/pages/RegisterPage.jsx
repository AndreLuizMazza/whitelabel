import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import useTenant from '@/store/tenant'
import useAuth from '@/store/auth'
import { registerUser } from '@/lib/authApi'

const initial = {
  nome: '',
  email: '',
  senha: '',
  cpf: '',
  celular: '',
  dataNascimento: '',
  aceiteTermos: false,
  aceitePrivacidade: false,
}

const onlyDigits = (s = '') => s.replace(/\D/g, '')
const isValidEmail = (e = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
const isValidCPF = (cpf = '') => onlyDigits(cpf).length === 11
const isStrongPassword = (s = '') => s.length >= 6

export default function RegisterPage() {
  // Mantém o store do tenant “vivo” (BFF injeta X-Progem-ID etc.)
  useTenant()

  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth((s) => ({ login: s.login }))

  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  // Refs para foco em erro
  const alertRef = useRef(null)
  const nomeRef = useRef(null)
  const emailRef = useRef(null)
  const senhaRef = useRef(null)

  // Validações reativas (para mensagens inline e habilitar botão)
  const nomeOk = useMemo(() => form.nome.trim().length >= 3, [form.nome])
  const emailOk = useMemo(() => isValidEmail(form.email), [form.email])
  const cpfOk = useMemo(() => isValidCPF(form.cpf), [form.cpf])
  const senhaOk = useMemo(() => isStrongPassword(form.senha), [form.senha])
  const termosOk = form.aceiteTermos && form.aceitePrivacidade

  const formValido = nomeOk && emailOk && cpfOk && senhaOk && termosOk && !loading

  useEffect(() => { setError(''); setOkMsg('') }, [form])
  useEffect(() => { if (error) setTimeout(() => alertRef.current?.focus(), 0) }, [error])

  function onChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function validate() {
    if (!nomeOk) return { msg: 'Informe seu nome completo.', focus: 'nome' }
    if (!emailOk) return { msg: 'Informe um e-mail válido.', focus: 'email' }
    if (!cpfOk) return { msg: 'Informe um CPF válido (11 dígitos).', focus: 'cpf' }
    if (!senhaOk) return { msg: 'A senha deve ter ao menos 6 caracteres.', focus: 'senha' }
    if (!termosOk) return { msg: 'É necessário aceitar os Termos e a Política de Privacidade.' }
    return null
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (loading) return

    const v = validate()
    if (v) {
      setError(v.msg)
      if (v.focus === 'nome') nomeRef.current?.focus()
      if (v.focus === 'email') emailRef.current?.focus()
      if (v.focus === 'senha') senhaRef.current?.focus()
      return
    }

    const from = location.state?.from?.pathname || '/area'
    const identificador = form.email?.trim() || onlyDigits(form.cpf)

    try {
      setLoading(true)
      setError(''); setOkMsg('')

      // 1) cadastra no backend
      await registerUser(form)

      // 2) login automático
      await login(identificador, form.senha)

      // 3) redireciona autenticado
      navigate(from, { replace: true })
    } catch (err) {
      console.error(err)
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string' ? err?.response?.data : null) ||
        'Não foi possível concluir o cadastro.'
      setError(apiMsg)
      setOkMsg('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div className="container-max max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Criar conta</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            Cadastre-se para gerenciar seus planos, dependentes e benefícios.
          </p>
        </div>

        {error && (
          <div
            ref={alertRef}
            role="alert"
            tabIndex={-1}
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{
              border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              color: 'var(--text)',
            }}
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {okMsg && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{
              border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
              background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
              color: 'var(--text)',
            }}
            role="status"
          >
            {okMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="card p-6 md:p-8 shadow-lg space-y-6">
          <fieldset disabled={loading} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nome" className="label font-medium">Nome completo</label>
                <input
                  id="nome"
                  name="nome"
                  ref={nomeRef}
                  value={form.nome}
                  onChange={onChange}
                  className="input"
                  placeholder="Maria Oliveira"
                  autoComplete="name"
                  aria-invalid={!nomeOk && !!form.nome}
                />
              </div>

              <div>
                <label htmlFor="email" className="label font-medium">E-mail</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  ref={emailRef}
                  value={form.email}
                  onChange={onChange}
                  className="input"
                  placeholder="maria@exemplo.com"
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={!emailOk && !!form.email}
                />
                {!emailOk && form.email && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Informe um e-mail válido.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="cpf" className="label font-medium">CPF</label>
                <input
                  id="cpf"
                  name="cpf"
                  value={form.cpf}
                  onChange={onChange}
                  className="input"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  aria-invalid={!cpfOk && !!form.cpf}
                />
                {!cpfOk && form.cpf && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Digite os 11 números do CPF.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="celular" className="label font-medium">Celular</label>
                <input
                  id="celular"
                  name="celular"
                  value={form.celular}
                  onChange={onChange}
                  className="input"
                  placeholder="(00) 90000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label htmlFor="dataNascimento" className="label font-medium">Data de nascimento</label>
                <input
                  id="dataNascimento"
                  type="date"
                  name="dataNascimento"
                  value={form.dataNascimento}
                  onChange={onChange}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="senha" className="label font-medium">Senha</label>
                <input
                  id="senha"
                  type="password"
                  name="senha"
                  ref={senhaRef}
                  value={form.senha}
                  onChange={onChange}
                  className="input"
                  placeholder="Crie uma senha (mín. 6)"
                  autoComplete="new-password"
                  aria-invalid={!senhaOk && !!form.senha}
                />
                {!senhaOk && form.senha && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    A senha deve ter pelo menos 6 caracteres.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="aceiteTermos"
                  checked={form.aceiteTermos}
                  onChange={onChange}
                  className="mt-0.5"
                />
                <span>
                  Li e aceito os{' '}
                  <a className="underline" href="/termos-uso" target="_blank" rel="noreferrer">Termos de Uso</a>.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="aceitePrivacidade"
                  checked={form.aceitePrivacidade}
                  onChange={onChange}
                  className="mt-0.5"
                />
                <span>
                  Concordo com a{' '}
                  <a className="underline" href="/politica-privacidade" target="_blank" rel="noreferrer">
                    Política de Privacidade
                  </a>.
                </span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={!formValido}
                className="btn-primary w-full sm:w-auto justify-center"
              >
                {loading ? 'Enviando…' : 'Criar conta'}
              </button>

              <Link
                to="/login"
                className="btn-outline w-full sm:w-auto justify-center"
                aria-disabled={loading}
              >
                Já tenho conta
              </Link>
            </div>
          </fieldset>
        </form>
      </div>
    </section>
  )
}
