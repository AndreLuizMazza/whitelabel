import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '@/lib/api'
import Button from '@/components/ui/Button.jsx'
import TenantSupportPanel from '@/components/auth/TenantSupportPanel.jsx'

export default function VerificarCodigo() {
  const [search] = useSearchParams()
  const navigate = useNavigate()

  const [token, setToken] = useState(search.get('token') || '')
  const [ident, setIdent] = useState(
    search.get('i') || localStorage.getItem('recuperacao.identifier') || ''
  )
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const codigoInputRef = useRef(null)

  useEffect(() => {
    setErro('')
  }, [token, novaSenha, confirmar, ident])
  useEffect(() => {
    setTimeout(() => codigoInputRef.current?.focus(), 0)
  }, [])

  const identifierValido = useMemo(() => ident.trim().length >= 5, [ident])
  const codigoFinal = useMemo(() => (token || codigo).trim(), [token, codigo])
  const codigoValido = useMemo(() => codigoFinal.length >= 6, [codigoFinal])
  const senhaValida = useMemo(() => novaSenha.length >= 8, [novaSenha])
  const confere = useMemo(() => novaSenha && novaSenha === confirmar, [novaSenha, confirmar])

  useEffect(() => {
    if (ident) localStorage.setItem('recuperacao.identifier', ident)
  }, [ident])

  async function onSubmit(e) {
    e.preventDefault()
    if (loading) return

    if (!identifierValido) return setErro('Identificador ausente. Volte e informe e-mail/CPF.')
    if (!codigoValido) return setErro('Informe o código recebido por e-mail.')
    if (!senhaValida) return setErro('A nova senha deve ter ao menos 8 caracteres.')
    if (!confere) return setErro('As senhas não coincidem.')

    setLoading(true)
    try {
      await api.post('/api/v1/app/password/reset', {
        identifier: ident.trim(),
        codigo: codigoFinal,
        novaSenha,
      })

      setSucesso(true)
      localStorage.removeItem('recuperacao.identifier')
      setTimeout(() => navigate('/login'), 2000)
    } catch (e) {
      console.error(e)
      setErro('Código inválido ou expirado. Tente novamente ou solicite um novo código.')
    } finally {
      setLoading(false)
    }
  }

  function trocarIdent() {
    localStorage.removeItem('recuperacao.identifier')
    setIdent('')
    navigate('/recuperar-senha')
  }

  return (
    <div className="w-full">
      <header className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-xl font-semibold tracking-tight text-[var(--text)]">
          Redefinir senha
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Informe o código recebido por e-mail e escolha uma nova senha.
        </p>
      </header>

      {sucesso ? (
        <div
          className="rounded-2xl border p-5 md:p-6 text-center shadow-sm"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--c-border)',
          }}
        >
          <p className="text-sm text-[var(--text)] mb-4">
            Senha alterada com sucesso! Você será redirecionado ao login.
          </p>
          <Button as={Link} to="/login" variant="primary" size="lg" className="min-h-[48px] rounded-xl">
            Ir para o login
          </Button>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-2xl border p-5 md:p-6 space-y-4 shadow-sm"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--c-border)',
          }}
        >
          {erro && (
            <div
              role="alert"
              className="rounded-xl px-4 py-3 text-sm border"
              style={{
                borderColor: 'color-mix(in srgb, var(--danger, #b91c1c) 25%, transparent)',
                background: 'color-mix(in srgb, var(--danger, #b91c1c) 8%, transparent)',
                color: 'var(--text)',
              }}
            >
              {erro}
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Recuperando a senha de
              </p>
              <p className="font-medium text-sm text-[var(--text)] break-all">{ident || '—'}</p>
            </div>
            <button
              type="button"
              onClick={trocarIdent}
              className="text-sm font-medium shrink-0 min-h-[44px] px-2"
              style={{ color: 'var(--primary)' }}
            >
              Trocar
            </button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="codigo" className="label font-medium text-sm">
              Código recebido
            </label>
            <input
              id="codigo"
              ref={codigoInputRef}
              className="input h-12 md:h-11 w-full text-base md:text-sm rounded-xl"
              value={token || codigo}
              onChange={(e) => {
                setToken('')
                setCodigo(e.target.value)
              }}
              placeholder="Cole aqui o código"
              inputMode="text"
              autoComplete="one-time-code"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="novaSenha" className="label font-medium text-sm">
              Nova senha
            </label>
            <input
              id="novaSenha"
              type="password"
              className="input h-12 md:h-11 w-full text-base md:text-sm rounded-xl"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
            />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Mínimo de 8 caracteres, com maiúscula, minúscula e número.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmarSenha" className="label font-medium text-sm">
              Confirmar nova senha
            </label>
            <input
              id="confirmarSenha"
              type="password"
              className="input h-12 md:h-11 w-full text-base md:text-sm rounded-xl"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            full
            loading={loading}
            disabled={loading}
            className="min-h-[48px] font-semibold rounded-xl"
          >
            {loading ? 'Alterando…' : 'Alterar senha'}
          </Button>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Não recebeu o e-mail?{' '}
            <Link to="/recuperar-senha" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
              Enviar novamente
            </Link>
          </p>
        </form>
      )}

      <div className="mt-6">
        <TenantSupportPanel compact />
      </div>
    </div>
  )
}
