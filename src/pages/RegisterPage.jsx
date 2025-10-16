// src/pages/RegisterPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import useTenant from '@/store/tenant'
import useAuth from '@/store/auth'
import { registerUser } from '@/lib/authApi'
import { AlertTriangle } from 'lucide-react'

const initial = {
  nome: '',
  email: '',
  senha: '',
  confirmSenha: '',
  cpf: '',
  celular: '',
  dataNascimento: '', // ISO yyyy-mm-dd
  aceiteTermos: false,
  aceitePrivacidade: false,
}

const onlyDigits = (s = '') => s.replace(/\D/g, '')
const isValidEmail = (e = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
const isValidCPF = (cpf = '') => onlyDigits(cpf).length === 11
const isStrongPassword = (s = '') => s.length >= 6

/* =================== Máscaras =================== */
function formatCPF(v = '') {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
function formatPhoneBR(v = '') {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 2) return d // iniciando DDD
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  // 11 dígitos (celular)
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
const phoneIsValid = (v = '') => {
  const d = onlyDigits(v)
  return d.length === 10 || d.length === 11
}

/* =============== DateSelectBR (18–100 anos) =============== */
function DateSelectBR({
  valueISO,
  onChangeISO,
  invalid = false,
  className = '',
  maxAge = 100,   // máximo 100 anos (hoje - 100)
  minAge = 18,    // mínimo 18 anos (hoje - 18)
  idPrefix,
}) {
  const [dia, setDia] = useState('')
  const [mes, setMes] = useState('')
  const [ano, setAno] = useState('')
  const [softWarn, setSoftWarn] = useState('')
  const hydratedRef = useRef(false)

  useEffect(() => {
    const m = typeof valueISO === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(valueISO)
    if (!m) return
    const [, yy, mm, dd] = m
    if (ano !== yy) setAno(yy)
    if (mes !== mm) setMes(mm)
    if (dia !== dd) setDia(dd)
    hydratedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueISO])

  const today = new Date()

  const minDate = (() => {
    const d = new Date(today)
    d.setFullYear(d.getFullYear() - (maxAge || 100))
    return d
  })()
  const maxDate = (() => {
    const d = new Date(today)
    d.setFullYear(d.getFullYear() - (minAge || 18))
    return d
  })()

  const minY = minDate.getFullYear()
  const maxY = maxDate.getFullYear()

  const anos = useMemo(() => {
    const arr = []
    for (let y = maxY; y >= minY; y--) arr.push(String(y))
    return arr
  }, [minY, maxY])

  const mesesAll = [
    ['01', 'Janeiro'], ['02', 'Fevereiro'], ['03', 'Março'], ['04', 'Abril'],
    ['05', 'Maio'], ['06', 'Junho'], ['07', 'Julho'], ['08', 'Agosto'],
    ['09', 'Setembro'], ['10', 'Outubro'], ['11', 'Novembro'], ['12', 'Dezembro'],
  ]
  const str2int = (s) => parseInt(s, 10) || 0
  const daysInMonth = (y, m) => new Date(y, m, 0).getDate()

  const mesesFiltrados = useMemo(() => {
    if (!ano) return mesesAll
    const y = str2int(ano)
    const minM = (y === minY) ? (minDate.getMonth() + 1) : 1
    const maxM = (y === maxY) ? (maxDate.getMonth() + 1) : 12
    return mesesAll.filter(([v]) => {
      const mm = str2int(v)
      return mm >= minM && mm <= maxM
    })
  }, [ano, minY, maxY])

  function clampMonthIfNeeded(y, m) {
    const minM = (y === minY) ? (minDate.getMonth() + 1) : 1
    const maxM = (y === maxY) ? (maxDate.getMonth() + 1) : 12
    if (!m) return m
    if (m < minM) return minM
    if (m > maxM) return maxM
    return m
  }
  function clampDayIfNeeded(y, m, d) {
    if (!y || !m || !d) return d
    const maxDMonth = daysInMonth(y, m)
    let minD = 1, maxD = maxDMonth
    if (y === minY && m === (minDate.getMonth() + 1)) minD = minDate.getDate()
    if (y === maxY && m === (maxDate.getMonth() + 1)) maxD = Math.min(maxDMonth, maxDate.getDate())
    if (d < minD) return minD
    if (d > maxD) return maxD
    return d
  }
  function inRange(iso) {
    const d = new Date(iso)
    const a = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    const b = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
    return !isNaN(d) && d >= a && d <= b
  }

  useEffect(() => {
    setSoftWarn('')
    if (!(dia && mes && ano)) return
    const iso = `${ano}-${mes}-${dia}`
    const ok = inRange(iso)
    if (!ok) setSoftWarn('Data fora do intervalo permitido (entre 18 e 100 anos).')
    if (hydratedRef.current && valueISO === iso) return
    onChangeISO?.(iso)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dia, mes, ano])

  function handleChangeAno(nextAnoStr) {
    setSoftWarn('')
    const y = str2int(nextAnoStr)
    setAno(nextAnoStr)
    if (!y) return
    let m = str2int(mes)
    const mClamped = clampMonthIfNeeded(y, m || 0)
    if (m && m !== mClamped) {
      setMes(String(mClamped).padStart(2, '0'))
      setSoftWarn('Ajustamos o mês para o limite permitido.')
      m = mClamped
    }
    if (m) {
      const d = str2int(dia)
      if (d) {
        const dClamped = clampDayIfNeeded(y, m, d)
        if (dClamped !== d) {
          setDia(String(dClamped).padStart(2, '0'))
          setSoftWarn('Ajustamos o dia para o máximo permitido no período.')
        }
      }
    }
  }
  function handleChangeMes(nextMesStr) {
    setSoftWarn('')
    setMes(nextMesStr)
    const y = str2int(ano)
    const m = str2int(nextMesStr)
    const d = str2int(dia)
    if (y && m && d) {
      const dClamped = clampDayIfNeeded(y, m, d)
      if (dClamped !== d) {
        setDia(String(dClamped).padStart(2, '0'))
        setSoftWarn('Ajustamos o dia para o máximo permitido no mês/limite.')
      }
    }
  }

  const idDia = `${idPrefix || 'date'}-dia`
  const idMes = `${idPrefix || 'date'}-mes`
  const idAno = `${idPrefix || 'date'}-ano`

  return (
    <div>
      <div className={`grid grid-cols-3 gap-2 ${invalid ? 'ring-1 ring-red-500 rounded-md p-1' : ''} ${className}`}>
        <label htmlFor={idDia} className="sr-only">Dia</label>
        <select id={idDia} className="input h-11" value={dia} onChange={(e) => setDia(e.target.value)}>
          <option value="">Dia</option>
          {(() => {
            const y = parseInt(ano || '', 10) || 0; const m = parseInt(mes || '', 10) || 0
            let minD = 1, maxD = 31
            if (y && m) {
              const maxDMonth = daysInMonth(y, m)
              minD = (y === minY && m === (minDate.getMonth() + 1)) ? minDate.getDate() : 1
              maxD = (y === maxY && m === (maxDate.getMonth() + 1)) ? Math.min(maxDMonth, maxDate.getDate()) : maxDMonth
            }
            const arr = []; for (let d = minD; d <= maxD; d++) arr.push(String(d).padStart(2, '0'))
            return arr.map(d => <option key={d} value={d}>{d}</option>)
          })()}
        </select>

        <label htmlFor={idMes} className="sr-only">Mês</label>
        <select id={idMes} className="input h-11" value={mes} onChange={(e) => handleChangeMes(e.target.value)}>
          <option value="">Mês</option>
          {mesesFiltrados.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <label htmlFor={idAno} className="sr-only">Ano</label>
        <select id={idAno} className="input h-11" value={ano} onChange={(e) => handleChangeAno(e.target.value)}>
          <option value="">Ano</option>
          {anos.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {(invalid || softWarn) && (
        <p className={`mt-1 text-xs inline-flex items-center gap-1 ${invalid ? 'text-red-600' : 'text-amber-600'}`} role="alert">
          <AlertTriangle size={14} /> {invalid ? 'Você precisa ter no mínimo 18 anos (e no máximo 100).' : softWarn}
        </p>
      )}
    </div>
  )
}

/* =============== Página =============== */
export default function RegisterPage() {
  // Mantém o store do tenant “vivo”
  useTenant()

  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth((s) => ({ login: s.login }))

  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  // Mostrar/ocultar senha
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Refs para foco em erro
  const alertRef = useRef(null)
  const nomeRef = useRef(null)
  const emailRef = useRef(null)
  const senhaRef = useRef(null)
  const confirmRef = useRef(null)

  // helpers de idade
  const ageFromISO = (iso) => {
    if (!iso) return null
    const d = new Date(iso)
    if (isNaN(d)) return null
    const t = new Date()
    let a = t.getFullYear() - d.getFullYear()
    const m = t.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--
    return a
  }

  const idade = useMemo(() => ageFromISO(form.dataNascimento), [form.dataNascimento])
  const idadeOk = idade !== null && idade >= 18 && idade <= 100

  // Validações reativas
  const nomeOk = useMemo(() => form.nome.trim().length >= 3, [form.nome])
  const emailOk = useMemo(() => isValidEmail(form.email), [form.email])
  const cpfOk = useMemo(() => isValidCPF(form.cpf), [form.cpf])
  const senhaOk = useMemo(() => isStrongPassword(form.senha), [form.senha])
  const confirmOk = useMemo(() => form.confirmSenha.length > 0 && form.confirmSenha === form.senha, [form.confirmSenha, form.senha])
  const termosOk = form.aceiteTermos && form.aceitePrivacidade

  const formValido =
    nomeOk && emailOk && cpfOk && senhaOk && confirmOk && termosOk && idadeOk && !loading

  useEffect(() => { setError(''); setOkMsg('') }, [form])
  useEffect(() => { if (error) setTimeout(() => alertRef.current?.focus(), 0) }, [error])

  // Handlers especializados para aplicar máscara imediatamente
  const onChangeMasked = (name, formatter) => (e) => {
    const raw = e.target.value || ''
    setForm((prev) => ({ ...prev, [name]: formatter(raw) }))
  }
  const onPasteMasked = (name, formatter) => (e) => {
    e.preventDefault()
    const pasted = (e.clipboardData || window.clipboardData).getData('text')
    setForm((prev) => ({ ...prev, [name]: formatter(pasted) }))
  }

  function onChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function validate() {
    if (!nomeOk) return { msg: 'Informe seu nome completo.', focus: 'nome' }
    if (!emailOk) return { msg: 'Informe um e-mail válido.', focus: 'email' }
    if (!cpfOk) return { msg: 'Informe um CPF válido (11 dígitos).', focus: 'cpf' }
    if (!form.dataNascimento) return { msg: 'Informe sua data de nascimento.', focus: null }
    if (!idadeOk) return { msg: 'Você precisa ter no mínimo 18 anos (e no máximo 100).', focus: null }
    if (!senhaOk) return { msg: 'A senha deve ter ao menos 6 caracteres.', focus: 'senha' }
    if (!confirmOk) return { msg: 'As senhas não conferem.', focus: 'confirmSenha' }
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
      if (v.focus === 'confirmSenha') confirmRef.current?.focus()
      return
    }

    const from = location.state?.from?.pathname || '/area'
    const identificador = form.email?.trim() || onlyDigits(form.cpf)

    // Garante que CPF e celular vão limpos para a API
    const payload = {
      ...form,
      cpf: onlyDigits(form.cpf),
      celular: onlyDigits(form.celular),
    }

    try {
      setLoading(true)
      setError(''); setOkMsg('')

      // 1) cadastra no backend
      await registerUser(payload)

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

            {/* Nome em largura total */}
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
              {!nomeOk && form.nome && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Informe ao menos 3 caracteres.
                </p>
              )}
            </div>

            {/* Grid 2 col: e-mail + CPF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  value={formatCPF(form.cpf)}
                  onChange={onChangeMasked('cpf', formatCPF)}
                  onPaste={onPasteMasked('cpf', formatCPF)}
                  className="input"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={!cpfOk && !!form.cpf}
                />
                {!cpfOk && form.cpf && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Digite os 11 números do CPF.
                  </p>
                )}
              </div>
            </div>

            {/* Grid: celular + data de nascimento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="celular" className="label font-medium">Celular</label>
                <input
                  id="celular"
                  name="celular"
                  value={formatPhoneBR(form.celular)}
                  onChange={onChangeMasked('celular', formatPhoneBR)}
                  onPaste={onPasteMasked('celular', formatPhoneBR)}
                  className="input"
                  placeholder="(00) 90000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={!!form.celular && !phoneIsValid(form.celular)}
                />
                {!!form.celular && !phoneIsValid(form.celular) && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Informe um telefone válido com DDD.
                  </p>
                )}
              </div>

              <div>
                <label className="label font-medium">Data de nascimento</label>
                <DateSelectBR
                  idPrefix="reg-nasc"
                  valueISO={form.dataNascimento}
                  onChangeISO={(iso) => setForm((p) => ({ ...p, dataNascimento: iso }))}
                  minAge={18}
                  maxAge={100}
                  invalid={!!form.dataNascimento && !idadeOk}
                />
                {(!form.dataNascimento || !idadeOk) && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Precisa ter entre <b>18</b> e <b>100</b> anos.
                  </p>
                )}
              </div>
            </div>

            {/* Grid: senha + confirmar senha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="senha" className="label font-medium">Senha</label>
                <div className="relative">
                  <input
                    id="senha"
                    type={showPass ? 'text' : 'password'}
                    name="senha"
                    ref={senhaRef}
                    value={form.senha}
                    onChange={onChange}
                    className="input pr-12"
                    placeholder="Crie uma senha (mín. 6)"
                    autoComplete="new-password"
                    aria-invalid={!senhaOk && !!form.senha}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute inset-y-0 right-0 px-3 hover:opacity-80 focus:outline-none"
                    aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPass}
                    title={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {!senhaOk && form.senha && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    A senha deve ter pelo menos 6 caracteres.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmSenha" className="label font-medium">Confirmar senha</label>
                <div className="relative">
                  <input
                    id="confirmSenha"
                    ref={confirmRef}
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmSenha"
                    value={form.confirmSenha}
                    onChange={onChange}
                    className="input pr-12"
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    aria-invalid={!!form.confirmSenha && !confirmOk}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute inset-y-0 right-0 px-3 hover:opacity-80 focus:outline-none"
                    aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showConfirm}
                    title={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {!!form.confirmSenha && !confirmOk && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    As senhas precisam ser idênticas.
                  </p>
                )}
              </div>
            </div>

            {/* Aceites */}
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

            {/* Ações */}
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
