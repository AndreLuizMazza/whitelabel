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
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
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
  maxAge = 100,
  minAge = 18,
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
  }, [valueISO]) // eslint-disable-line

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
  }, [dia, mes, ano]) // eslint-disable-line

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
  useTenant()

  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth((s) => ({ login: s.login }))

  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errorList, setErrorList] = useState([])

  // Mostrar/ocultar senha
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Refs para foco em erro
  const alertRef = useRef(null)
  const nomeRef = useRef(null)
  const emailRef = useRef(null)
  const senhaRef = useRef(null)
  const confirmRef = useRef(null)
  const cpfRef = useRef(null)
  const celRef = useRef(null)

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
  const celularOk = useMemo(() => phoneIsValid(form.celular), [form.celular])
  const termosOk = form.aceiteTermos && form.aceitePrivacidade

  const formValido =
    nomeOk && emailOk && cpfOk && senhaOk && confirmOk && celularOk && termosOk && idadeOk && !loading

  useEffect(() => { setError(''); setOkMsg('') }, [form])
  useEffect(() => { if (error) setTimeout(() => alertRef.current?.focus(), 0) }, [error])

  // Handlers especializados para aplicar máscara imediatamente
  const onChangeMasked = (name, formatter, ref) => (e) => {
    const raw = e.target.value || ''
    setForm((prev) => ({ ...prev, [name]: formatter(raw) }))
    if (submitted) setErrorList(buildErrorList({ ...form, [name]: formatter(raw) }))
    if (!ref) return
  }
  const onPasteMasked = (name, formatter) => (e) => {
    e.preventDefault()
    const pasted = (e.clipboardData || window.clipboardData).getData('text')
    setForm((prev) => ({ ...prev, [name]: formatter(pasted) }))
  }

  function onChange(e) {
    const { name, value, type, checked } = e.target
    const next = { ...form, [name]: type === 'checkbox' ? checked : value }
    setForm(next)
    if (submitted) setErrorList(buildErrorList(next))
  }

  function buildErrorList(values) {
    const items = []
    if (!(values.nome || '').trim()) items.push({ field: 'nome', label: 'Nome completo é obrigatório.' })
    if (!isValidEmail(values.email)) items.push({ field: 'email', label: 'Informe um e-mail válido.' })
    if (!isValidCPF(values.cpf)) items.push({ field: 'cpf', label: 'Informe um CPF válido (11 dígitos).' })
    if (!phoneIsValid(values.celular)) items.push({ field: 'celular', label: 'Informe um celular válido com DDD.' })
    if (!values.dataNascimento || !(idadeFrom(values.dataNascimento))) items.push({ field: 'dataNascimento', label: 'Informe sua data de nascimento.' })
    if (values.dataNascimento && !idadeOk) items.push({ field: 'dataNascimento', label: 'Você precisa ter entre 18 e 100 anos.' })
    if (!isStrongPassword(values.senha)) items.push({ field: 'senha', label: 'A senha deve ter ao menos 6 caracteres.' })
    if (!(values.confirmSenha && values.confirmSenha === values.senha)) items.push({ field: 'confirmSenha', label: 'As senhas não conferem.' })
    if (!(values.aceiteTermos && values.aceitePrivacidade)) items.push({ field: 'aceites', label: 'É necessário aceitar os Termos e a Política de Privacidade.' })
    return items
  }
  const idadeFrom = (iso) => {
    const a = ageFromISO(iso)
    return a !== null && a >= 0 ? a : null
  }

  function focusByField(field) {
    const map = { nome: nomeRef, email: emailRef, cpf: cpfRef, celular: celRef, senha: senhaRef, confirmSenha: confirmRef }
    map[field]?.current?.focus()
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (loading) return

    setSubmitted(true)
    const list = buildErrorList(form)
    setErrorList(list)

    if (list.length > 0) {
      // foca o primeiro campo com erro
      focusByField(list[0].field)
      return
    }

    // 🔁 suporta state.from como string OU objeto
    const rawFrom = location.state?.from
    const from =
      typeof rawFrom === 'string'
        ? rawFrom
        : (rawFrom?.pathname
            ? `${rawFrom.pathname}${rawFrom.search || ''}${rawFrom.hash || ''}`
            : '/area')

    const identificador = form.email?.trim() || onlyDigits(form.cpf)

    // envia os campos como estão (máscaras são tratadas na API de auth)
    const payload = { ...form }

    try {
      setLoading(true)
      setError(''); setOkMsg('')

      await registerUser(payload)
      await login(identificador, form.senha)

      // ✅ salva um prefill leve para a próxima etapa (Cadastro)
      try {
        const prefill = {
          cpf: onlyDigits(form.cpf),
          celular: onlyDigits(form.celular),
          dataNascimento: form.dataNascimento || '',
          email: (form.email || '').trim(),
          nome: (form.nome || '').trim(),
        }
        sessionStorage.setItem('reg_prefill', JSON.stringify(prefill))
        // opcional: último registro também no localStorage (fallback)
        localStorage.setItem('register:last', JSON.stringify(prefill))
      } catch {}

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
      setTimeout(() => alertRef.current?.focus(), 0)
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

            {/* Nome */}
            <div>
              <label htmlFor="nome" className="label font-medium">
                Nome completo <span aria-hidden="true" className="text-red-600">*</span>
              </label>
              <input
                id="nome"
                name="nome"
                ref={nomeRef}
                value={form.nome}
                onChange={onChange}
                className={`input ${submitted && !nomeOk ? 'ring-1 ring-red-500' : ''}`}
                placeholder="Maria Oliveira"
                autoComplete="name"
                aria-required="true"
                aria-invalid={submitted && !nomeOk}
              />
              {submitted && !nomeOk && (
                <p className="text-xs mt-1 text-red-600">Informe ao menos 3 caracteres.</p>
              )}
            </div>

            {/* Grid 2 col: e-mail + CPF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="label font-medium">
                  E-mail <span aria-hidden="true" className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  ref={emailRef}
                  value={form.email}
                  onChange={onChange}
                  className={`input ${submitted && !emailOk ? 'ring-1 ring-red-500' : ''}`}
                  placeholder="maria@exemplo.com"
                  autoComplete="email"
                  inputMode="email"
                  aria-required="true"
                  aria-invalid={submitted && !emailOk}
                />
                {submitted && !emailOk && (
                  <p className="text-xs mt-1 text-red-600">Informe um e-mail válido.</p>
                )}
              </div>

              <div>
                <label htmlFor="cpf" className="label font-medium">
                  CPF <span aria-hidden="true" className="text-red-600">*</span>
                </label>
                <input
                  id="cpf"
                  name="cpf"
                  ref={cpfRef}
                  value={formatCPF(form.cpf)}
                  onChange={onChangeMasked('cpf', formatCPF, cpfRef)}
                  onPaste={onPasteMasked('cpf', formatCPF)}
                  className={`input ${submitted && !cpfOk ? 'ring-1 ring-red-500' : ''}`}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-required="true"
                  aria-invalid={submitted && !cpfOk}
                />
                {submitted && !cpfOk && (
                  <p className="text-xs mt-1 text-red-600">Digite os 11 números do CPF.</p>
                )}
              </div>
            </div>

            {/* Grid: celular + data de nascimento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="celular" className="label font-medium">
                  Celular <span aria-hidden="true" className="text-red-600">*</span>
                </label>
                <input
                  id="celular"
                  name="celular"
                  ref={celRef}
                  value={formatPhoneBR(form.celular)}
                  onChange={onChangeMasked('celular', formatPhoneBR, celRef)}
                  onPaste={onPasteMasked('celular', formatPhoneBR)}
                  className={`input ${submitted && !celularOk ? 'ring-1 ring-red-500' : ''}`}
                  placeholder="(00) 90000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-required="true"
                  aria-invalid={submitted && !celularOk}
                />
                {submitted && !celularOk && (
                  <p className="text-xs mt-1 text-red-600">Informe um celular válido com DDD.</p>
                )}
              </div>

              <div>
                <label className="label font-medium">
                  Data de nascimento <span aria-hidden="true" className="text-red-600">*</span>
                </label>
                <DateSelectBR
                  idPrefix="reg-nasc"
                  valueISO={form.dataNascimento}
                  onChangeISO={(iso) => setForm((p) => ({ ...p, dataNascimento: iso }))}
                  minAge={18}
                  maxAge={100}
                  invalid={submitted && (!form.dataNascimento || !idadeOk)}
                />
                {submitted && (!form.dataNascimento || !idadeOk) && (
                  <p className="text-xs mt-1 text-red-600">
                    Precisa ter entre <b>18</b> e <b>100</b> anos.
                  </p>
                )}
              </div>
            </div>

            {/* Grid: senha + confirmar senha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="senha" className="label font-medium">
                  Senha <span aria-hidden="true" className="text-red-600">*</span>
                </label>
                <div className={`relative ${submitted && !senhaOk ? 'ring-1 ring-red-500 rounded-md' : ''}`}>
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
                    aria-required="true"
                    aria-invalid={submitted && !senhaOk}
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
                {submitted && !senhaOk && (
                  <p className="text-xs mt-1 text-red-600">A senha deve ter pelo menos 6 caracteres.</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmSenha" className="label font-medium">
                  Confirmar senha <span aria-hidden="true" className="text-red-600">*</span>
                </label>
                <div className={`relative ${submitted && !confirmOk ? 'ring-1 ring-red-500 rounded-md' : ''}`}>
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
                    aria-required="true"
                    aria-invalid={submitted && !confirmOk}
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
                {submitted && !confirmOk && (
                  <p className="text-xs mt-1 text-red-600">As senhas precisam ser idênticas.</p>
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
                  aria-required="true"
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
                  aria-required="true"
                />
                <span>
                  Concordo com a{' '}
                  <a className="underline" href="/politica-privacidade" target="_blank" rel="noreferrer">
                    Política de Privacidade
                  </a>.
                </span>
              </label>
            </div>

            {/* ✅ Sumário de erros compacto — só após tentar enviar */}
            {submitted && errorList.length > 0 && (
              <div
                className="rounded-lg px-4 py-3 text-sm mt-2"
                style={{
                  border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                  background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                  color: 'var(--text)',
                }}
                role="alert"
                aria-live="assertive"
              >
                <p className="font-medium mb-1">Corrija os itens abaixo:</p>
                <ul className="list-disc ml-5 space-y-1">
                  {errorList.map((it, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        className="underline hover:opacity-80"
                        onClick={() => focusByField(it.field)}
                      >
                        {it.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto justify-center"
                aria-disabled={loading}
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
