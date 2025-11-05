import { useState } from 'react'

export default function LeadCaptureDialog({ open, onClose, onSubmit }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [whats, setWhats] = useState('')

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    await onSubmit({ nome, email, whatsapp: whats })
    setNome(''); setEmail(''); setWhats('')
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-3" style={{ background: 'rgba(0,0,0,.5)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-5 shadow-lg"
        style={{ background: 'var(--surface)', border: '1px solid var(--c-border)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
          Receber atualizações
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="input w-full"
            placeholder="Seu nome"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
          />
          <input
            className="input w-full"
            placeholder="Seu e-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
          />
          <input
            className="input w-full"
            placeholder="WhatsApp"
            value={whats}
            onChange={e => setWhats(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Quero receber
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
