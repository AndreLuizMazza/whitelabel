import { useMemo, useState } from 'react'
import api from '@/lib/api'
import useAuth from '@/store/auth'

export default function TrocarSenha() {
  const email = useAuth(s => s.user?.email || '')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const senhaValida = useMemo(() => novaSenha.length >= 8, [novaSenha])

  async function onSubmit(e) {
    e.preventDefault()
    setErro(''); setMsg('')

    if (!senhaValida) return setErro('A nova senha deve ter ao menos 8 caracteres.')
    if (novaSenha !== confirmar) return setErro('As senhas não coincidem.')

    setLoading(true)
    try {
      // O endpoint /change exige Authorization do usuário (api já deve enviar)
      await api.post('/api/v1/app/password/change', { email, senhaAtual, novaSenha })
      setMsg('Senha alterada com sucesso!')
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('')
    } catch (e) {
      console.error(e)
      const m = e?.response?.data?.message || e?.response?.data?.error || 'Falha ao alterar senha.'
      setErro(m)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div className="container-max max-w-lg">
        <h1 className="text-3xl font-bold mb-6">Alterar senha</h1>

        <form onSubmit={onSubmit} className="card p-6 space-y-4 shadow-lg">
          {erro && <p className="text-red-600 text-sm">{erro}</p>}
          {msg && <p className="text-green-700 text-sm">{msg}</p>}

          <div>
            <label className="label font-medium">Senha atual</label>
            <input
              type="password"
              className="input"
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              required
            />
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

          <button type="submit" className="btn-primary w-full h-11 mt-2" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </section>
  )
}
