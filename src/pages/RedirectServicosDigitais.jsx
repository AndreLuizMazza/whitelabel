import { Navigate, useLocation } from 'react-router-dom'

/** Retrocompat: /servicos-digitais → /area/beneficios (mesmo state/query). */
export default function RedirectServicosDigitais() {
  const location = useLocation()
  return (
    <Navigate
      to={{ pathname: '/area/beneficios', search: location.search }}
      replace
      state={location.state}
    />
  )
}
