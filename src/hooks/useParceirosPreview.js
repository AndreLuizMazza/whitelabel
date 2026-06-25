import { useEffect, useMemo, useState } from 'react'
import api from '@/lib/api.js'
import {
  buildPublicParceirosPreview,
  mergePartnerOffersInterleaved,
  shuffleArray,
} from '@/components/beneficios/beneficiosUtils'

const PREVIEW_SIZE = 24

/**
 * Parceiros sanitizados para vitrine pública (/beneficios).
 * Usa client token via BFF — sem auth de associado.
 */
export default function useParceirosPreview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [partners, setPartners] = useState([])

  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)
      setError(false)
      try {
        const { data } = await api.get(`/api/v1/locais/parceiros?size=${PREVIEW_SIZE}`, {
          transformRequest: [
            (d, headers) => {
              try {
                delete headers.Authorization
              } catch {}
              return d
            },
          ],
          __skipAuthRedirect: true,
        })
        if (!alive) return
        setPartners(shuffleArray(buildPublicParceirosPreview(data)))
      } catch (e) {
        console.error('useParceirosPreview', e)
        if (alive) {
          setPartners([])
          setError(true)
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [])

  const offers = useMemo(
    () => shuffleArray(mergePartnerOffersInterleaved(partners)),
    [partners]
  )
  const hasPreview = partners.length > 0
  const hasOffers = offers.length > 0
  const showPreview = loading || hasPreview

  return {
    loading,
    error,
    partners,
    offers,
    hasPreview,
    hasOffers,
    showPreview,
  }
}
