// src/theme/useTheme.js (corrigido)
import { useEffect, useState } from 'react'
import { applyTheme, resolveTheme } from '@/theme/initTheme'

export function useTheme() {
  const [theme, setTheme] = useState(resolveTheme()) // 'system' | 'light' | 'dark'

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // quando em "system", reagir a mudanças do SO
  useEffect(() => {
    if (theme !== 'system') return
    try {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => applyTheme('system')
      mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange)
      return () => {
        mql.removeEventListener ? mql.removeEventListener('change', onChange) : mql.removeListener(onChange)
      }
    } catch {}
  }, [theme])

  function cycle() {
    setTheme(t => (t === 'system' ? 'light' : t === 'light' ? 'dark' : 'system'))
  }

  return { theme, setTheme, cycle }
}
