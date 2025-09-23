import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/lib/api'

export default function RecuperarSenha() {
  const [ident, setIdent] = useState('') // e-mail ou CPF
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const alertRef = useRef(null)
  const identValido = useMemo(() => ident.trim().length >= 5, [ident])

  useEffect(() => { setErro('') }, [ident])
  useEffect(() => { if (erro) setTimeout(() => alertRef.current?.focus(), 0) }, [erro])

  async function onSubmit(e) {
    e.preventDefault()
    if (!identValido || loading) return

    setErro(''); setLoading(true)
    try {
      // Ajuste o endpoint conforme seu BFF/serviço:
      await api.post('/auth/recover', { identificador: ident.trim() })
      setEnviado(true)
    } catch (e) {
      console.error(e)
      const msg = e?.response?.data?.error || e?.response?.statusText || e?.message || 'Não foi possível iniciar a recuperação.'
      setErro(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div className="container-max max-w-lg">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Recuperar senha</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            Informe seu e-mail ou CPF para receber as instruções.
          </p>
        </div>

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

        {enviado ? (
          <div className="card p-6 md:p-8 shadow-lg">
            <p className="text-[var(--text)]">
              Se o identificador informado estiver cadastrado, você receberá um e-mail com os próximos passos.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Link to="/login" className="btn-primary">Voltar ao login</Link>
              <button type="button" className="btn-outline" onClick={() => { setEnviado(false); setIdent('') }}>
                Enviar novamente
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="card p-6 md:p-8 space-y-4 shadow-lg">
            <fieldset disabled={loading}>
              <div className="space-y-1">
                <label htmlFor="ident" className="label font-medium">E-mail ou CPF</label>
                <input
                  id="ident"
                  className="input"
                  placeholder="voce@email.com ou 000.000.000-00"
                  value={ident}
                  onChange={e => setIdent(e.target.value)}
                  autoComplete="username"
                  inputMode="email"
                  aria-invalid={!identValido}
                />
                {!identValido && ident && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Informe um e-mail ou CPF com pelo menos 5 caracteres.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary w-full h-11 text-base mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!identValido}
              >
                {loading ? 'Enviando…' : 'Enviar instruções'}
              </button>

              <div className="mt-3 text-center text-sm">
                Lembrou a senha?{' '}
                <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                  Entrar
                </Link>
              </div>
            </fieldset>
          </form>
        )}
      </div>
    </section>
  )
}
