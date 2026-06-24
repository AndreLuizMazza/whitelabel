// src/components/PrivateRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '@/store/auth'

/**
 * Rota protegida: exige usuário autenticado.
 * - Preserva o caminho exato de origem (pathname + search + hash)
 *   em `state.from` para redirecionar corretamente após login/registro.
 */
export default function PrivateRoute({ children, redirectTo = '/login' }) {
  const { sessionReady, isAuthed } = useAuth((s) => ({
    sessionReady: s.sessionReady,
    isAuthed: s.isAuthenticated(),
  }))
  const location = useLocation()

  if (!sessionReady) return null

  if (!isAuthed) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search || '',
            hash: location.hash || '',
          },
        }}
      />
    )
  }

  return children
}
