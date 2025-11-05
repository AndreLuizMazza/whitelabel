// src/pages/VerificarCodigo.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '@/lib/api'

export default function VerificarCodigo() {
  const [search] = useSearchParams()
  const navigate = useNavigate()

  // token do link (?token=)
  const [token, setToken] = useState(search.get('token') || '')
  // identifier da URL (?i=) ou do localStorage
  const [ident, setIdent] = useState(
    search.get('i') || localStorage.getItem('recuperacao.identifier') || ''
  )
  // usuário pode digitar o código caso não venha por URL
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const codigoInputRef = useRef(null)

  useEffect(() => { setErro('') }, [token, novaSenha, confirmar, ident])
  useEffect(() => {
    // foco direto no campo de código
    setTimeout(() => codigoInputRef.current?.focus(), 0)
  }, [])

  const identifierValido = useMemo(() => ident.trim().length >= 5, [ident])
  const codigoFinal = useMemo(() => (token || codigo).trim(), [token, codigo])
  const codigoValido = useMemo(() => codigoFinal.length >= 6, [codigoFinal])
  const senhaValida = useMemo(() => novaSenha.length >= 8, [novaSenha])
  const confere = useMemo(() => novaSenha && novaSenha === confirmar, [novaSenha, confirmar])

  // manter consistência do identifier entre telas
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
        novaSenha
      })

      setSucesso(true)
      localStorage.removeItem('recuperacao.identifier')
      setTimeout(() => navigate('/login'), 2000)
    } catch (e) {
      console.error(e)
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        'Código inválido ou expirado.'
      setErro(msg)
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
    <section className="section">
      <div className="container-max max-w-lg">
        <h1 className="text-3xl font-bold mb-6">Redefinir senha</h1>

        {sucesso ? (
          <div className="card p-6 shadow-lg text-center">
            <p className="text-[var(--text)] mb-3">
              Senha alterada com sucesso! Você será redirecionado ao login.
            </p>
            <Link to="/login" className="btn-primary">Ir para o login</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card p-6 space-y-5 shadow-lg">
            {erro && (
              <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">
                {erro}
              </div>
            )}

            {/* (2) Identificador apenas exibido como label */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Recuperando a senha de</p>
                <p className="font-medium text-[var(--text)] break-all">{ident || '—'}</p>
              </div>
              <button type="button" onClick={trocarIdent} className="btn-ghost text-sm">
                Trocar
              </button>
            </div>

            {/* Código de verificação */}
            <div>
              <label className="label font-medium">Código recebido</label>
              <input
                ref={codigoInputRef}
                className="input"
                value={token || codigo}
                onChange={e => { setToken(''); setCodigo(e.target.value) }}
                placeholder="Cole aqui o código"
                inputMode="text"
                autoComplete="one-time-code"
                required
              />
            </div>

            {/* Nova senha */}
            <div>
              <label className="label font-medium">Nova senha</label>
              <input
                type="password"
                className="input"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                required
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">Mínimo de 8 caracteres.</p>
            </div>

            {/* Confirmar nova senha */}
            <div>
              <label className="label font-medium">Confirmar nova senha</label>
              <input
                type="password"
                className="input"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full h-11 mt-2"
              disabled={loading}
            >
              {loading ? 'Alterando…' : 'Alterar senha'}
            </button>

            <div className="text-center text-sm">
              Não recebeu o e-mail?{' '}
              <Link to="/recuperar-senha" className="text-[var(--primary)] hover:underline">
                Enviar novamente
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
