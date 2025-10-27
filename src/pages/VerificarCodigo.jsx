// src/pages/VerificarCodigo.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '@/lib/api'

export default function VerificarCodigo() {
  const [search] = useSearchParams()
  const navigate = useNavigate()

  // token pode vir por ?token= no link do e-mail
  const [token, setToken] = useState(search.get('token') || '')
  // identifier pode vir por ?i= (email/CPF) ou do localStorage
  const [ident, setIdent] = useState(
    search.get('i') || localStorage.getItem('recuperacao.identifier') || ''
  )
  const [codigo, setCodigo] = useState('') // fallback se o usuário preferir digitar
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => { setErro('') }, [token, novaSenha, confirmar, ident])

  const identifierValido = useMemo(() => ident.trim().length >= 5, [ident])
  const codigoFinal = useMemo(() => (token || codigo).trim(), [token, codigo])
  const codigoValido = useMemo(() => codigoFinal.length >= 6, [codigoFinal])
  const senhaValida = useMemo(() => novaSenha.length >= 8, [novaSenha])
  const confere = useMemo(() => novaSenha && novaSenha === confirmar, [novaSenha, confirmar])

  async function onSubmit(e) {
    e.preventDefault()
    if (loading) return

    if (!identifierValido) return setErro('Informe seu e-mail ou CPF.')
    if (!codigoValido) return setErro('Informe o código recebido por e-mail.')
    if (!senhaValida) return setErro('A nova senha deve ter ao menos 8 caracteres.')
    if (!confere) return setErro('As senhas não coincidem.')

    setLoading(true)
    try {
      // API/BFF espera { identifier, codigo, novaSenha }
      await api.post('/api/v1/app/password/reset', {
        identifier: ident.trim(),
        codigo: codigoFinal,
        novaSenha
      })

      setSucesso(true)
      // limpa o cache do identifier para próximas tentativas não confundirem
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

  // se vier identifier pela URL, persiste para consistência entre telas
  useEffect(() => {
    if (ident) localStorage.setItem('recuperacao.identifier', ident)
  }, [ident])

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
          <form onSubmit={onSubmit} className="card p-6 space-y-4 shadow-lg">
            {erro && (
              <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">
                {erro}
              </div>
            )}

            <div>
              <label className="label font-medium">E-mail ou CPF</label>
              <input
                className="input"
                value={ident}
                onChange={e => setIdent(e.target.value)}
                placeholder="Digite seu e-mail ou CPF"
                required
              />
            </div>

            <div>
              <label className="label font-medium">Código recebido</label>
              <input
                className="input"
                value={token || codigo}
                onChange={e => {
                  setToken('')           // ao digitar manualmente, usa `codigo`
                  setCodigo(e.target.value)
                }}
                placeholder="Cole aqui o código do e-mail"
                required
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Se você abriu pelo link do e-mail, o código pode vir preenchido automaticamente.
              </p>
            </div>

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
          </form>
        )}
      </div>
    </section>
  )
}
