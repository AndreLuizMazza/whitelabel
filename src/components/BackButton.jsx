import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Botão padrão de "Voltar" para ser reutilizado em todas as páginas.
 * Ex.: <BackButton to="/memorial" />
 */
export default function BackButton({ to = '/', children = 'Voltar', className = '' }) {
  return (
    <Link
      to={to}
      className={`
        inline-flex items-center gap-2 rounded-full px-4 py-2
        border border-[var(--c-border)] text-[var(--text)] hover:bg-[var(--surface)]
        dark:border-[var(--c-border)] dark:text-[var(--text)] dark:hover:bg-[var(--surface)]
        transition-colors ${className}
      `}
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  )
}
