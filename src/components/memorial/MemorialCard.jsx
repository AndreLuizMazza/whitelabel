import { ChevronRight, Eye } from 'lucide-react'

function fmtDate(d) {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    const fixed = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())
    return fixed.toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}

export default function MemorialCard({ item }) {
  const nome = item?.nomeFalecido || item?.nome || 'Sem nome'
  const foto = item?.fotoUrl || item?.foto
  const nasc = fmtDate(item?.dtNascimento)
  const fale = fmtDate(item?.dtFalecimento)
  const views = Number(item?.contadorAcessos ?? 0)

  return (
    <div
      className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all"
      style={{ background: 'color-mix(in srgb, var(--surface) 90%, transparent)', border: '1px solid var(--c-border)' }}
      onMouseMove={(e) => {
        const el = e.currentTarget
        const r = el.getBoundingClientRect()
        el.style.setProperty('--x', `${e.clientX - r.left}px`)
        el.style.setProperty('--y', `${e.clientY - r.top}px`)
      }}
    >
      {/* faixa sutil no topo */}
      <div
        style={{
          height: '6px',
          width: '100%',
          background:
            'linear-gradient(90deg, color-mix(in srgb, var(--primary) 70%, transparent), var(--primary), color-mix(in srgb, var(--primary) 0%, transparent))'
        }}
      />

      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          {foto ? (
            <img
              src={foto}
              alt={nome}
              className="h-14 w-14 rounded-full object-cover"
              style={{ boxShadow: '0 0 0 2px #fff inset' }}
            />
          ) : (
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center font-semibold"
              style={{ background: 'var(--primary-12)', color: 'var(--primary)' }}
            >
              {nome.slice(0, 1)}
            </div>
          )}

          <div className="min-w-0">
            <h3 className="font-semibold leading-tight truncate" style={{ color: 'var(--text)' }}>
              {nome}
            </h3>

            <p className="text-xs sm:text-[13px] truncate" style={{ color: 'var(--text)' }}>
              {nasc} – {fale}
            </p>

            <p className="mt-0.5 text-xs flex items-center gap-1" style={{ color: 'var(--text)' }}>
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{views} visualiza{views === 1 ? 'ção' : 'ções'}</span>
            </p>
          </div>

          <ChevronRight
            className="ml-auto shrink-0 h-5 w-5 transition-colors"
            style={{ color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* brilho de hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background:
            'radial-gradient(600px circle at var(--x,80%) var(--y,20%), color-mix(in srgb, var(--primary) 10%, transparent), transparent 40%)'
        }}
      />
    </div>
  )
}
