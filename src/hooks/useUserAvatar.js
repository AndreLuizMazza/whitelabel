import { useEffect, useMemo, useRef, useState } from 'react'
import useAuth from '@/store/auth'
import { getAvatarBlobUrl } from '@/lib/profile'

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export default function useUserAvatar() {
  const user = useAuth((s) => s.user)
  const isLogged = useAuth((s) => s.isLoggedIn())

  const [avatarBlobUrl, setAvatarBlobUrl] = useState(null)
  const [avatarErro, setAvatarErro] = useState(false)
  const lastObjUrlRef = useRef(null)

  const fotoDeclarada = user?.fotoUrl || user?.photoURL || ''
  const avatarUrl = avatarErro ? '' : avatarBlobUrl || fotoDeclarada || ''

  const initials = useMemo(
    () => initialsFromName(user?.nome || user?.email),
    [user?.nome, user?.email]
  )

  useEffect(() => {
    let active = true

    if (!isLogged) {
      if (lastObjUrlRef.current) {
        URL.revokeObjectURL(lastObjUrlRef.current)
        lastObjUrlRef.current = null
      }
      setAvatarBlobUrl(null)
      setAvatarErro(false)
      return () => {}
    }

    async function loadAvatar() {
      try {
        const objUrl = await getAvatarBlobUrl()
        if (!active) {
          if (objUrl) URL.revokeObjectURL(objUrl)
          return
        }
        if (lastObjUrlRef.current) URL.revokeObjectURL(lastObjUrlRef.current)
        lastObjUrlRef.current = objUrl || null
        setAvatarBlobUrl(objUrl || null)
        setAvatarErro(false)
      } catch {
        if (active) setAvatarBlobUrl(null)
      }
    }

    loadAvatar()

    return () => {
      active = false
      if (lastObjUrlRef.current) {
        URL.revokeObjectURL(lastObjUrlRef.current)
        lastObjUrlRef.current = null
      }
    }
  }, [isLogged, user?.id, user?.email])

  return {
    avatarUrl,
    avatarErro,
    setAvatarErro,
    initials,
  }
}
