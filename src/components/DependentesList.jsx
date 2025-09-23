export default function DependentesList({ dependentes = [] }) {
  return (
    <div className="card p-5">
      <h3 className="text-lg font-semibold">Dependentes</h3>

      {dependentes.length === 0 ? (
        <p className="text-sm mt-2" style={{ color: 'var(--text)' }}>
          Nenhum dependente cadastrado.
        </p>
      ) : (
        <ul className="mt-3 divide-y" style={{ borderColor: 'var(--c-border)' }}>
          {dependentes.map((d) => (
            <li key={d.id ?? d.dependenteId} className="py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{d.nome}</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{d.parentesco ?? 'Dependente'}</p>
                </div>
                <div className="text-right text-sm">
                  <p style={{ color: 'var(--text)' }}>Nascimento</p>
                  <p className="font-medium">{d.dataNascimento ?? '—'}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
