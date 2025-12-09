// src/pages/RegisterPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import useTenant from '@/store/tenant'
import useAuth from '@/store/auth'
import { registerUser } from '@/lib/authApi'
import { AlertTriangle, UserPlus, Lock, CheckCircle2 } from 'lucide-react'
import { registrarDispositivoFcmWeb } from '@/lib/fcm'

const initial = {
  nome: '',
  email: '',
  senha: '',
  confirmSenha: '',
  cpf: '',
  celular: '',
  dataNascimento: '',
  aceiteTermos: true,
  aceitePrivacidade: true,
}

const onlyDigits = (s = '') => s.replace(/\D/g, '')
const isValidEmail = (e = '') =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

function getPasswordChecks(s = '') {
  return {
    len: s.length >= 8,
    upper: /[A-Z]/.test(s),
    lower: /[a-z]/.test(s),
    digit: /\d/.test(s),
  }
}
function isStrongPassword(s = '') {
  const c = getPasswordChecks(s)
  return c.len && c.upper && c.lower && c.digit
}

function isValidCPF(cpf = '') {
  const d = onlyDigits(cpf)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i)
  let rest = sum % 11
  const dv1 = rest < 2 ? 0 : 11 - rest
  if (dv1 !== Number(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i)
  rest = sum % 11
  const dv2 = rest < 2 ? 0 : 11 - rest
  return dv2 === Number(d[10])
}

function formatCPF(v = '') {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9)
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
function formatPhoneBR(v = '') {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length === 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
const phoneIsValid = (v = '') => {
  const d = onlyDigits(v)
  return d.length === 10 || d.length === 11
}

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

  useEffect(() => {
    const m =
      typeof valueISO === 'string' &&
      /^(\d{4})-(\d{2})-(\d{2})$/.exec(valueISO)
    if (!m) return
    const [, yy, mm, dd] = m
    if (ano !== yy) setAno(yy)
    if (mes !== mm) setMes(mm)
    if (dia !== dd) setDia(dd)
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
    ['01', 'Janeiro'],
    ['02', 'Fevereiro'],
    ['03', 'Março'],
    ['04', 'Abril'],
    ['05', 'Maio'],
    ['06', 'Junho'],
    ['07', 'Julho'],
    ['08', 'Agosto'],
    ['09', 'Setembro'],
    ['10', 'Outubro'],
    ['11', 'Novembro'],
    ['12', 'Dezembro'],
  ]
  const str2int = (s) => parseInt(s, 10) || 0
  const daysInMonth = (y, m) => new Date(y, m, 0).getDate()

  const mesesFiltrados = useMemo(() => {
    if (!ano) return mesesAll
    const y = str2int(ano)
    const minM = y === minY ? minDate.getMonth() + 1 : 1
    const maxM = y === maxY ? maxDate.getMonth() + 1 : 12
    return mesesAll.filter(([v]) => {
      const mm = str2int(v)
      return mm >= minM && mm <= maxM
    })
  }, [ano, minY, maxY])

  function clampMonthIfNeeded(y, m) {
    const minM = y === minY ? minDate.getMonth() + 1 : 1
    const maxM = y === maxY ? maxDate.getMonth() + 1 : 12
    if (!m) return m
    if (m < minM) return minM
    if (m > maxM) return maxM
    return m
  }
  function clampDayIfNeeded(y, m, d) {
    if (!y || !m || !d) return d
    const maxDMonth = daysInMonth(y, m)
    let minD = 1,
      maxD = maxDMonth
    if (y === minY && m === minDate.getMonth() + 1) minD = minDate.getDate()
    if (y === maxY && m === maxDate.getMonth() + 1)
      maxD = Math.min(maxDMonth, maxDate.getDate())
    if (d < minD) return minD
    if (d > maxD) return maxD
    return d
  }
  function inRange(iso) {
    const d = new Date(iso)
    const a = new Date(
      minDate.getFullYear(),
      minDate.getMonth(),
      minDate.getDate()
    )
    const b = new Date(
      maxDate.getFullYear(),
      maxDate.getMonth(),
      maxDate.getDate()
    )
    return !isNaN(d) && d >= a && d <= b
  }

  useEffect(() => {
    setSoftWarn('')
    if (!(dia && mes && ano)) return
    const iso = `${ano}-${mes}-${dia}`
    const ok = inRange(iso)
    if (!ok)
      setSoftWarn('Data fora do intervalo permitido (entre 18 e 100 anos).')
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
      <div
        className={`grid grid-cols-3 gap-2 ${
          invalid ? 'ring-1 ring-red-500 rounded-md p-1' : ''
        } ${className}`}
      >
        <label htmlFor={idDia} className="sr-only">
          Dia
        </label>
        <select
          id={idDia}
          className="input h-12 text-base bg-white"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
        >
          <option value="">Dia</option>
          {(() => {
            const y = parseInt(ano || '', 10) || 0
            const m = parseInt(mes || '', 10) || 0
            let minD = 1,
              maxD = 31
            if (y && m) {
              const maxDMonth = daysInMonth(y, m)
              minD =
                y === minY && m === minDate.getMonth() + 1
                  ? minDate.getDate()
                  : 1
              maxD =
                y === maxY && m === maxDate.getMonth() + 1
                  ? Math.min(maxDMonth, maxDate.getDate())
                  : maxDMonth
            }
            const arr = []
            for (let d = minD; d <= maxD; d++)
              arr.push(String(d).padStart(2, '0'))
            return arr.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))
          })()}
        </select>

        <label htmlFor={idMes} className="sr-only">
          Mês
        </label>
        <select
          id={idMes}
          className="input h-12 text-base bg-white"
          value={mes}
          onChange={(e) => handleChangeMes(e.target.value)}
        >
          <option value="">Mês</option>
          {mesesFiltrados.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <label htmlFor={idAno} className="sr-only">
          Ano
        </label>
        <select
          id={idAno}
          className="input h-12 text-base bg-white"
          value={ano}
          onChange={(e) => handleChangeAno(e.target.value)}
        >
          <option value="">Ano</option>
          {anos.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      {(invalid || softWarn) && (
        <p
          className={`mt-1 text-xs md:text-sm inline-flex items-center gap-1 ${
            invalid ? 'text-red-600' : 'text-amber-600'
          }`}
          role="alert"
        >
          <AlertTriangle size={14} />{' '}
          {invalid
            ? 'Você precisa ter no mínimo 18 anos (e no máximo 100).'
            : softWarn}
        </p>
      )}
    </div>
  )
}

function Rule({ ok, children }) {
  return (
    <li className="flex items-center gap-2 text-xs md:text-sm">
      <span
        aria-hidden="true"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
        style={{
          background: ok
            ? 'color-mix(in srgb, var(--primary) 18%, transparent)'
            : 'color-mix(in srgb, var(--text) 15%, transparent)',
          color: ok ? 'var(--primary)' : 'var(--text-muted)',
        }}
      >
        {ok ? '✓' : '•'}
      </span>
      <span style={{ color: ok ? 'var(--text)' : 'var(--text-muted)' }}>
        {children}
      </span>
    </li>
  )
}

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
  const [step, setStep] = useState(1)

  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const alertRef = useRef(null)
  const nomeRef = useRef(null)
  const emailRef = useRef(null)
  const senhaRef = useRef(null)
  const confirmRef = useRef(null)
  const cpfRef = useRef(null)
  const celRef = useRef(null)

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

  const idade = useMemo(
    () => ageFromISO(form.dataNascimento),
    [form.dataNascimento]
  )
  const idadeOk = idade !== null && idade >= 18 && idade <= 100

  const nomeOk = useMemo(() => form.nome.trim().length >= 3, [form.nome])
  const emailOk = useMemo(() => isValidEmail(form.email), [form.email])
  const cpfOk = useMemo(() => isValidCPF(form.cpf), [form.cpf])
  const senhaChecks = useMemo(
    () => getPasswordChecks(form.senha),
    [form.senha]
  )
  const senhaOk = useMemo(() => isStrongPassword(form.senha), [form.senha])
  const confirmOk = useMemo(
    () => form.confirmSenha.length > 0 && form.confirmSenha === form.senha,
    [form.confirmSenha, form.senha]
  )
  const celularOk = useMemo(
    () => phoneIsValid(form.celular),
    [form.celular]
  )

  const formValido =
    nomeOk && emailOk && cpfOk && celularOk && idadeOk && senhaOk && confirmOk

  // usados apenas como referência interna; botões já não dependem deles
  const step1Valid = nomeOk && cpfOk && idadeOk
  const step2Valid = emailOk && celularOk
  const step3Valid = senhaOk && confirmOk

  useEffect(() => {
    setError('')
    setOkMsg('')
  }, [form])

  useEffect(() => {
    if (error) setTimeout(() => alertRef.current?.focus(), 0)
  }, [error])

  function buildErrorList(values) {
    const items = []
    const age = ageFromISO(values.dataNascimento)

    if (!(values.nome || '').trim())
      items.push({
        field: 'nome',
        label: 'Nome completo é obrigatório.',
      })
    if (!isValidEmail(values.email))
      items.push({
        field: 'email',
        label: 'Informe um e-mail válido.',
      })
    if (!isValidCPF(values.cpf))
      items.push({
        field: 'cpf',
        label: 'Informe um CPF válido.',
      })
    if (!phoneIsValid(values.celular))
      items.push({
        field: 'celular',
        label: 'Informe um celular válido com DDD.',
      })
    if (!values.dataNascimento || age === null) {
      items.push({
        field: 'dataNascimento',
        label: 'Informe sua data de nascimento.',
      })
    } else if (age < 18 || age > 100) {
      items.push({
        field: 'dataNascimento',
        label: 'Você precisa ter entre 18 e 100 anos.',
      })
    }
    if (!isStrongPassword(values.senha)) {
      items.push({
        field: 'senha',
        label:
          'A senha deve ter pelo menos 8 caracteres, com letra maiúscula, minúscula e número.',
      })
    }
    if (!(values.confirmSenha && values.confirmSenha === values.senha)) {
      items.push({
        field: 'confirmSenha',
        label: 'As senhas precisam ser iguais.',
      })
    }
    return items
  }

  function buildStep1Errors(values) {
    const all = buildErrorList(values)
    const step1Fields = ['nome', 'cpf', 'dataNascimento']
    return all.filter((it) => step1Fields.includes(it.field))
  }

  function buildStep2Errors(values) {
    const all = buildErrorList(values)
    const step2Fields = ['email', 'celular']
    return all.filter((it) => step2Fields.includes(it.field))
  }

  function focusByField(field) {
    const map = {
      nome: nomeRef,
      email: emailRef,
      cpf: cpfRef,
      celular: celRef,
      senha: senhaRef,
      confirmSenha: confirmRef,
    }
    map[field]?.current?.focus()
  }

  const recomputeErrorsIfSubmitted = (next) => {
    if (!submitted) return
    const list =
      step === 1
        ? buildStep1Errors(next)
        : step === 2
        ? buildStep2Errors(next)
        : buildErrorList(next)
    setErrorList(list)
  }

  const onChangeMasked =
    (name, formatter, _ref) =>
    (e) => {
      const raw = e.target.value || ''
      const nextVal = formatter(raw)
      const next = { ...form, [name]: nextVal }
      setForm(next)
      recomputeErrorsIfSubmitted(next)
    }

  const onPasteMasked = (name, formatter) => (e) => {
    e.preventDefault()
    const pasted =
      (e.clipboardData || window.clipboardData).getData('text') || ''
    const nextVal = formatter(pasted)
    const next = { ...form, [name]: nextVal }
    setForm(next)
    recomputeErrorsIfSubmitted(next)
  }

  function onChange(e) {
    const { name, value, type, checked } = e.target
    const next = {
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    }
    setForm(next)
    recomputeErrorsIfSubmitted(next)
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (loading) return

    if (step === 1) {
      setSubmitted(true)
      const list = buildStep1Errors(form)
      setErrorList(list)

      if (list.length > 0 || !step1Valid) {
        if (list.length > 0) focusByField(list[0].field)
        return
      }

      // Etapa 1 OK → avança para a 2 sem validações exibidas
      setStep(2)
      setSubmitted(false)
      setErrorList([])
      setTimeout(() => emailRef.current?.focus(), 0)
      return
    }

    if (step === 2) {
      setSubmitted(true)
      const list = buildStep2Errors(form)
      setErrorList(list)

      if (list.length > 0 || !step2Valid) {
        if (list.length > 0) focusByField(list[0].field)
        return
      }

      // Etapa 2 OK → avança para a 3 sem validações exibidas
      setStep(3)
      setSubmitted(false)
      setErrorList([])
      setTimeout(() => senhaRef.current?.focus(), 0)
      return
    }

    // step 3
    setSubmitted(true)
    const list = buildErrorList(form)
    setErrorList(list)

    if (list.length > 0 || !step3Valid) {
      if (list.length > 0) focusByField(list[0].field)
      return
    }

    if (!isValidCPF(form.cpf)) {
      setError('CPF inválido. Verifique os números digitados.')
      setTimeout(() => alertRef.current?.focus(), 0)
      focusByField('cpf')
      setStep(1)
      setSubmitted(false)
      return
    }

    const rawFrom = location.state?.from
    const from =
      typeof rawFrom === 'string'
        ? rawFrom
        : rawFrom?.pathname
        ? `${rawFrom.pathname}${rawFrom.search || ''}${rawFrom.hash || ''}`
        : '/area'

    const identificador = form.email?.trim() || onlyDigits(form.cpf)
    const payload = {
      ...form,
      aceiteTermos: true,
      aceitePrivacidade: true,
    }

    try {
      setLoading(true)
      setError('')
      setOkMsg('')

      await registerUser(payload)
      await login(identificador, form.senha)

      try {
        console.info(
          '[Register] Iniciando registro do dispositivo FCM (WEB) após cadastro...'
        )
        await registrarDispositivoFcmWeb()
        console.info('[Register] Registro do dispositivo FCM finalizado (WEB).')
      } catch (err) {
        console.error(
          '[Register] Falha ao registrar dispositivo FCM (WEB):',
          err
        )
      }

      try {
        const prefill = {
          cpf: onlyDigits(form.cpf),
          celular: onlyDigits(form.celular),
          dataNascimento: form.dataNascimento || '',
          email: (form.email || '').trim(),
          nome: (form.nome || '').trim(),
        }
        sessionStorage.setItem('reg_prefill', JSON.stringify(prefill))
        localStorage.setItem('register:last', JSON.stringify(prefill))
      } catch {}

      navigate(from, { replace: true })
    } catch (err) {
      console.error(err)
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string'
          ? err?.response?.data
          : null) ||
        'Não foi possível concluir o cadastro.'
      setError(apiMsg)
      setOkMsg('')
      setTimeout(() => alertRef.current?.focus(), 0)
    } finally {
      setLoading(false)
    }
  }

  const firstName = useMemo(() => {
    const n = (form.nome || '').trim()
    if (!n) return ''
    return n.split(' ')[0]
  }, [form.nome])

  const stepTitle =
    step === 1
      ? 'Etapa 1 de 3 · Seus dados principais'
      : step === 2
      ? 'Etapa 2 de 3 · Contatos'
      : 'Etapa 3 de 3 · Sua senha'

  const stepDesc =
    step === 1
      ? 'Informe seus dados básicos para começarmos o cadastro.'
      : step === 2
      ? 'Agora, confirme seus dados de contato para enviarmos comunicações importantes.'
      : 'Por fim, defina uma senha segura para acessar sua área.'

  const progressPercent = step === 1 ? '33%' : step === 2 ? '66%' : '100%'

  return (
    <section className="section">
      <div className="container-max max-w-4xl relative">
        <div className="min-h-[60vh] py-8 flex flex-col justify-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[72px] mx-auto h-40 max-w-2xl rounded-[48px] opacity-70"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--primary) 18%, transparent) 0, transparent 70%)',
              zIndex: -1,
            }}
          />

          <header className="mb-6">
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
                <UserPlus size={14} />
                <span>Criar conta</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-4 py-1.5 text-xs md:text-sm font-medium rounded-full hover:bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]"
              >
                Já tenho conta
              </button>
            </div>

            <h1 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight">
              Cadastre-se em poucos passos
            </h1>
            <p
              className="mt-1 text-sm md:text-base leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Você só precisa informar seus dados, escolher uma senha e pronto.
            </p>
          </header>

          {error && (
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
              {error}
            </div>
          )}

          {okMsg && (
            <div
              className="mb-4 rounded-2xl px-4 py-3 text-sm md:text-base"
              style={{
                border:
                  '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
                background:
                  'color-mix(in srgb, var(--primary) 8%, transparent)',
                color: 'var(--text)',
              }}
              role="status"
            >
              {okMsg}
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="relative overflow-hidden p-6 md:p-8 space-y-6 rounded-3xl border shadow-xl"
            style={{
              background:
                'color-mix(in srgb, var(--surface) 88%, var(--text) 6%)',
              borderColor: 'color-mix(in srgb, var(--text) 18%, transparent)',
            }}
          >
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
              className="space-y-6 relative z-[1]"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs md:text-sm font-semibold tracking-wide uppercase">
                    {stepTitle}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] md:text-xs"
                    style={{
                      background:
                        'color-mix(in srgb, var(--surface-elevated) 90%, transparent)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: 'var(--primary)' }}
                    />
                    {step === 1
                      ? 'Começando'
                      : step === 2
                      ? 'Continuando'
                      : 'Quase lá'}
                  </span>
                </div>

                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{
                    background:
                      'color-mix(in srgb, var(--surface-elevated) 80%, var(--text) 6%)',
                  }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: progressPercent,
                      background: 'var(--primary)',
                    }}
                  />
                </div>

                <p
                  className="text-xs md:text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {stepDesc}
                </p>
              </div>

              

              {step === 3 && (
                <div
                  className="rounded-2xl px-4 py-3 text-xs md:text-sm mb-1 flex items-start gap-2"
                  style={{
                    background:
                      'color-mix(in srgb, var(--primary) 12%, transparent)',
                    border:
                      '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
                  }}
                >
                  <div className="mt-0.5">
                    <CheckCircle2
                      size={18}
                      style={{ color: 'var(--primary)' }}
                    />
                  </div>
                  <div>
                    <p className="font-medium mb-0.5">
                      {firstName
                        ? `${firstName}, seus dados estão certos.`
                        : 'Seus dados estão certos.'}
                    </p>
                    <p style={{ color: 'var(--text-muted)' }}>
                      Agora crie uma senha para acessar sua conta quando
                      quiser.
                    </p>
                  </div>
                </div>
              )}

              <div
                className="rounded-2xl border px-4 py-4 md:px-5 md:py-5 space-y-6"
                style={{
                  background:
                    'color-mix(in srgb, var(--surface-elevated) 88%, var(--text) 6%)',
                  borderColor:
                    'color-mix(in srgb, var(--text) 16%, transparent)',
                }}
              >
                {step === 1 && (
                  <>
                    <div>
                      <label
                        htmlFor="nome"
                        className="label font-medium text-sm md:text-base"
                      >
                        Nome completo{' '}
                        <span aria-hidden="true" className="text-red-600">
                          *
                        </span>
                      </label>
                      <input
                        id="nome"
                        name="nome"
                        ref={nomeRef}
                        value={form.nome}
                        onChange={onChange}
                        className={`input h-12 text-base bg-white ${
                          submitted && !nomeOk ? 'ring-1 ring-red-500' : ''
                        }`}
                        placeholder="Maria Oliveira"
                        autoComplete="name"
                        aria-required="true"
                        aria-invalid={submitted && !nomeOk}
                      />
                      {submitted && !nomeOk && (
                        <p className="text-xs md:text-sm mt-1 text-red-600">
                          Informe ao menos 3 caracteres.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="cpf"
                          className="label font-medium text-sm md:text-base"
                        >
                          CPF{' '}
                          <span aria-hidden="true" className="text-red-600">
                            *
                          </span>
                        </label>
                        <input
                          id="cpf"
                          name="cpf"
                          ref={cpfRef}
                          value={formatCPF(form.cpf)}
                          onChange={onChangeMasked('cpf', formatCPF, cpfRef)}
                          onPaste={onPasteMasked('cpf', formatCPF)}
                          className={`input h-12 text-base bg-white ${
                            submitted && !cpfOk ? 'ring-1 ring-red-500' : ''
                          }`}
                          placeholder="000.000.000-00"
                          inputMode="numeric"
                          autoComplete="off"
                          aria-required="true"
                          aria-invalid={submitted && !cpfOk}
                        />
                        {submitted && !cpfOk && (
                          <p className="text-xs md:text-sm mt-1 text-red-600">
                            CPF inválido. Verifique os números digitados.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="label font-medium text-sm md:text-base">
                          Data de nascimento{' '}
                          <span aria-hidden="true" className="text-red-600">
                            *
                          </span>
                        </label>
                        <DateSelectBR
                          idPrefix="reg-nasc"
                          valueISO={form.dataNascimento}
                          onChangeISO={(iso) =>
                            setForm((p) => ({
                              ...p,
                              dataNascimento: iso,
                            }))
                          }
                          minAge={18}
                          maxAge={100}
                          invalid={
                            submitted &&
                            (!form.dataNascimento || !idadeOk)
                          }
                        />
                        {submitted &&
                          (!form.dataNascimento || !idadeOk) && (
                            <p className="text-xs md:text-sm mt-1 text-red-600">
                              É preciso ter entre <b>18</b> e <b>100</b> anos.
                            </p>
                          )}
                      </div>
                    </div>

                    {submitted && step === 1 && errorList.length > 0 && (
                      <div
                        className="rounded-lg px-4 py-3 text-sm md:text-base mt-1"
                        style={{
                          border:
                            '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                          background:
                            'color-mix(in srgb, var(--primary) 12%, transparent)',
                          color: 'var(--text)',
                        }}
                        role="alert"
                        aria-live="assertive"
                      >
                        <p className="font-medium mb-1">
                          Revise os campos destacados antes de continuar:
                        </p>
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
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="email"
                          className="label font-medium text-sm md:text-base"
                        >
                          E-mail{' '}
                          <span aria-hidden="true" className="text-red-600">
                            *
                          </span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          ref={emailRef}
                          value={form.email}
                          onChange={onChange}
                          className={`input h-12 text-base bg-white ${
                            submitted && !emailOk ? 'ring-1 ring-red-500' : ''
                          }`}
                          placeholder="maria@exemplo.com"
                          autoComplete="email"
                          inputMode="email"
                          aria-required="true"
                          aria-invalid={submitted && !emailOk}
                        />
                        {submitted && !emailOk && (
                          <p className="text-xs md:text-sm mt-1 text-red-600">
                            Informe um e-mail válido.
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="celular"
                          className="label font-medium text-sm md:text-base"
                        >
                          Celular{' '}
                          <span aria-hidden="true" className="text-red-600">
                            *
                          </span>
                        </label>
                        <input
                          id="celular"
                          name="celular"
                          ref={celRef}
                          value={formatPhoneBR(form.celular)}
                          onChange={onChangeMasked(
                            'celular',
                            formatPhoneBR,
                            celRef
                          )}
                          onPaste={onPasteMasked('celular', formatPhoneBR)}
                          className={`input h-12 text-base bg-white ${
                            submitted && !celularOk ? 'ring-1 ring-red-500' : ''
                          }`}
                          placeholder="(00) 90000-0000"
                          inputMode="tel"
                          autoComplete="tel"
                          aria-required="true"
                          aria-invalid={submitted && !celularOk}
                        />
                        {submitted && !celularOk && (
                          <p className="text-xs md:text-sm mt-1 text-red-600">
                            Informe um celular válido com DDD.
                          </p>
                        )}
                      </div>
                    </div>

                    {submitted && step === 2 && errorList.length > 0 && (
                      <div
                        className="rounded-lg px-4 py-3 text-sm md:text-base mt-1"
                        style={{
                          border:
                            '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                          background:
                            'color-mix(in srgb, var(--primary) 12%, transparent)',
                          color: 'var(--text)',
                        }}
                        role="alert"
                        aria-live="assertive"
                      >
                        <p className="font-medium mb-1">
                          Revise os campos destacados antes de continuar:
                        </p>
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
                  </>
                )}

                {step === 3 && (
                  <>
                    <div
                      className="rounded-2xl px-4 py-3 text-xs md:text-sm mb-2 flex items-start gap-2"
                      style={{
                        background:
                          'color-mix(in srgb, var(--surface) 90%, transparent)',
                        border:
                          '1px dashed color-mix(in srgb, var(--text) 18%, transparent)',
                      }}
                    >
                      <Lock
                        size={18}
                        className="mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      />
                      <div>
                        <p className="font-medium mb-0.5">
                          Capriche em uma senha segura.
                        </p>
                        <p style={{ color: 'var(--text-muted)' }}>
                          Use uma combinação de letras maiúsculas, minúsculas e
                          números que só você saiba.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="senha"
                          className="label font-medium text-sm md:text-base"
                        >
                          Senha{' '}
                          <span aria-hidden="true" className="text-red-600">
                            *
                          </span>
                        </label>
                        <div
                          className={`relative ${
                            submitted && !senhaOk
                              ? 'ring-1 ring-red-500 rounded-md'
                              : ''
                          }`}
                        >
                          <input
                            id="senha"
                            type={showPass ? 'text' : 'password'}
                            name="senha"
                            ref={senhaRef}
                            value={form.senha}
                            onChange={onChange}
                            className="input pr-12 h-12 text-xs sm:text-sm md:text-base bg-white"
                            placeholder="Crie uma senha forte"
                            autoComplete="new-password"
                            aria-required="true"
                            aria-invalid={submitted && !senhaOk}
                            aria-describedby="senha-policy"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass((v) => !v)}
                            className="absolute inset-y-0 right-0 px-3 hover:opacity-80 focus:outline-none text-sm"
                            aria-label={
                              showPass ? 'Ocultar senha' : 'Mostrar senha'
                            }
                            aria-pressed={showPass}
                            title={
                              showPass ? 'Ocultar senha' : 'Mostrar senha'
                            }
                          >
                            {showPass ? '🙈' : '👁️'}
                          </button>
                        </div>

                        <div
                          id="senha-policy"
                          className="rounded-lg px-3 py-2 mt-2"
                          style={{
                            background:
                              'color-mix(in srgb, var(--surface) 80%, transparent)',
                            border: '1px solid var(--c-border)',
                          }}
                          aria-live="polite"
                        >
                          <p
                            className="text-[11px] md:text-xs mb-1"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            A senha precisa ter:
                          </p>
                          <ul className="space-y-1">
                            <Rule ok={senhaChecks.len}>
                              Pelo menos 8 caracteres
                            </Rule>
                            <Rule ok={senhaChecks.upper}>
                              Ao menos 1 letra maiúscula (A–Z)
                            </Rule>
                            <Rule ok={senhaChecks.lower}>
                              Ao menos 1 letra minúscula (a–z)
                            </Rule>
                            <Rule ok={senhaChecks.digit}>
                              Ao menos 1 número (0–9)
                            </Rule>
                          </ul>
                        </div>

                        {submitted && !senhaOk && (
                          <p className="text-xs md:text-sm mt-2 text-red-600">
                            Ajuste a senha conforme os requisitos acima.
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="confirmSenha"
                          className="label font-medium text-sm md:text-base"
                        >
                          Confirmar senha{' '}
                          <span aria-hidden="true" className="text-red-600">
                            *
                          </span>
                        </label>
                        <div
                          className={`relative ${
                            submitted && !confirmOk
                              ? 'ring-1 ring-red-500 rounded-md'
                              : ''
                          }`}
                        >
                          <input
                            id="confirmSenha"
                            ref={confirmRef}
                            type={showConfirm ? 'text' : 'password'}
                            name="confirmSenha"
                            value={form.confirmSenha}
                            onChange={onChange}
                            className="input pr-12 h-12 text-xs sm:text-sm md:text-base bg-white"
                            placeholder="Repita a mesma senha"
                            autoComplete="new-password"
                            aria-required="true"
                            aria-invalid={submitted && !confirmOk}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute inset-y-0 right-0 px-3 hover:opacity-80 focus:outline-none text-sm"
                            aria-label={
                              showConfirm ? 'Ocultar senha' : 'Mostrar senha'
                            }
                            aria-pressed={showConfirm}
                            title={
                              showConfirm ? 'Ocultar senha' : 'Mostrar senha'
                            }
                          >
                            {showConfirm ? '🙈' : '👁️'}
                          </button>
                        </div>
                        {submitted && !confirmOk && (
                          <p className="text-xs md:text-sm mt-1 text-red-600">
                            As senhas precisam ser iguais.
                          </p>
                        )}
                      </div>
                    </div>

                    {submitted && step === 3 && errorList.length > 0 && (
                      <div
                        className="rounded-lg px-4 py-3 text-sm md:text-base mt-1"
                        style={{
                          border:
                            '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                          background:
                            'color-mix(in srgb, var(--primary) 12%, transparent)',
                          color: 'var(--text)',
                        }}
                        role="alert"
                        aria-live="assertive"
                      >
                        <p className="font-medium mb-1">
                          Revise os campos destacados para concluir o cadastro:
                        </p>
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
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {step === 1 && (
                  <>
                    <button
                      type="submit"
                      className="btn-primary w-full sm:w-auto justify-center rounded-2xl h-12 text-[15px] md:text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed transform-gpu transition-transform duration-150 hover:scale-[1.01] focus:scale-[0.99]"
                      disabled={loading}
                    >
                      Continuar
                    </button>
                    <Link
                      to="/login"
                      className="btn-outline w-full sm:w-auto justify-center rounded-2xl h-12 text-sm md:text-base font-medium"
                      aria-disabled={loading}
                    >
                      Já tenho conta
                    </Link>
                  </>
                )}

                {step === 2 && (
                  <>
                    <button
                      type="submit"
                      className="btn-primary w-full sm:w-auto justify-center rounded-2xl h-12 text-[15px] md:text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed transform-gpu transition-transform duration-150 hover:scale-[1.01] focus:scale-[0.99]"
                      disabled={loading}
                    >
                      Continuar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1)
                        setSubmitted(false)
                        setErrorList([])
                        setTimeout(() => nomeRef.current?.focus(), 0)
                      }}
                      className="btn-outline w-full sm:w-auto justify-center rounded-2xl h-12 text-sm md:text-base font-medium"
                    >
                      Voltar aos dados principais
                    </button>
                  </>
                )}

                {step === 3 && (
                  <>
                    <button
                      type="submit"
                      className="btn-primary w-full sm:w-auto justify-center rounded-2xl h-12 text-[15px] md:text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed transform-gpu transition-transform duration-150 hover:scale-[1.01] focus:scale-[0.99]"
                      disabled={loading}
                    >
                      {loading ? 'Criando conta…' : 'Criar conta agora'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(2)
                        setSubmitted(false)
                        setErrorList([])
                        setTimeout(() => emailRef.current?.focus(), 0)
                      }}
                      className="btn-outline w-full sm:w-auto justify-center rounded-2xl h-12 text-sm md:text-base font-medium"
                    >
                      Voltar aos contatos
                    </button>
                  </>
                )}
              </div>

              {!formValido && !submitted && (
                <p
                  className="mt-1 text-[11px] md:text-xs text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Preencha os campos com * para finalizar o cadastro.
                </p>
              )}

              <p
                className="mt-2 text-[11px] md:text-xs text-center leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                Ao criar sua conta, você declara que leu e concorda com os{' '}
                <a
                  href="/termos-uso"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Termos de Uso
                </a>{' '}
                e com a{' '}
                <a
                  href="/politica-privacidade"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Política de Privacidade
                </a>
                . Seus dados são protegidos com criptografia e em conformidade
                com a LGPD.
              </p>
            </fieldset>
          </form>
        </div>
      </div>
    </section>
  )
}
