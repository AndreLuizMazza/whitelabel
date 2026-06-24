import { Navigate, useParams } from 'react-router-dom'

/** Retrocompat: detalhe público antigo → área privada (exige auth via MemberLayout). */
export default function RedirectBeneficioParceiroPublico() {
  const { id } = useParams()
  return <Navigate to={`/area/beneficios/${id}`} replace />
}
