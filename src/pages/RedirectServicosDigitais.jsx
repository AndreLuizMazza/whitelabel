import { Navigate, useLocation } from 'react-router-dom'

/** Retrocompat (member zone): /servicos-digitais → /area/servicos-digitais */
export default function RedirectServicosDigitais() {
  const location = useLocation()
  return (
    <Navigate
      to={{ pathname: '/area/servicos-digitais', search: location.search }}
      replace
      state={location.state}
    />
  )
}
