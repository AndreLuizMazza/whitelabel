import { useEffect, useState } from 'react'
import api from '@/lib/api.js'
import { getMensal } from '@/lib/planUtils.js'

/**
 * Carrega planos ativos para preview na home pública.
 * @returns {{ planos: object[], loading: boolean, error: string }}
 */
export default function usePublicPlanos(limit = 3) {
  const [planos, setPlanos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/api/v1/planos?status=ATIVO')
        const data = res.data
        const list = Array.isArray(data) ? data : data?.content || []
        const sorted = [...list]
          .map((p) => ({ ...p, precoMensal: getMensal(p) }))
          .sort((a, b) => (a.precoMensal || 0) - (b.precoMensal || 0))
        if (!cancelled) setPlanos(sorted.slice(0, limit))
      } catch (e) {
        if (!cancelled) {
          setPlanos([])
          setError(
            e?.response?.data?.error ||
              e?.response?.statusText ||
              e?.message ||
              'Erro ao carregar planos'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [limit])

  return { planos, loading, error }
}
