// src/components/PrivateRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '@/store/auth'

/**
 * Rota protegida: exige usuário autenticado.
 * - Preserva o caminho exato de origem (pathname + search + hash)
 *   em `state.from` para redirecionar corretamente após login/registro.
 *
 * Uso:
 * <PrivateRoute>
 *   <MinhaPaginaProtegida />
 * </PrivateRoute>
 */
export default function PrivateRoute({ children, redirectTo = '/login' }) {
  const isAuthenticated = useAuth((s) =>
    typeof s.isAuthenticated === 'function' ? s.isAuthenticated() : !!s.token
  )
  const location = useLocation()

  if (!isAuthenticated) {
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
