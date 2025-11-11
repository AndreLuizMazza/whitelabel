// src/lib/toast.js
/**
 * Toast de uso global
 * Exemplo:
 *   showToast('Mensagem simples')
 *   showToast('Falha ao pagar boleto', () => window.open('https://wa.me/...'))
 */

export function showToast(message, onAction = null, actionLabel = 'Falar no WhatsApp', duration = 4000) {
  if (typeof document === 'undefined') return

  const existing = document.querySelector('.global-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.className = 'global-toast'
  toast.style.position = 'fixed'
  toast.style.bottom = '20px'
  toast.style.right = '20px'
  toast.style.zIndex = '9999'
  toast.style.background = 'var(--surface)'
  toast.style.color = 'var(--text)'
  toast.style.border = '1px solid var(--c-border)'
  toast.style.borderRadius = '12px'
  toast.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'
  toast.style.padding = '14px 18px'
  toast.style.maxWidth = '320px'
  toast.style.display = 'flex'
  toast.style.flexDirection = 'column'
  toast.style.gap = '10px'
  toast.style.fontSize = '0.9rem'
  toast.style.opacity = '1'
  toast.style.transition = 'opacity 0.3s ease'

  const text = document.createElement('span')
  text.textContent = message
  toast.appendChild(text)

  if (onAction) {
    const btn = document.createElement('button')
    btn.textContent = actionLabel
    btn.style.alignSelf = 'start'
    btn.style.padding = '6px 12px'
    btn.style.fontSize = '0.8rem'
    btn.style.border = 'none'
    btn.style.borderRadius = '8px'
    btn.style.cursor = 'pointer'
    btn.style.background = 'var(--primary)'
    btn.style.color = 'var(--on-primary)'
    btn.onclick = () => {
      onAction()
      toast.remove()
    }
    toast.appendChild(btn)
  }

  document.body.appendChild(toast)

  // fade-out automático
  setTimeout(() => { toast.style.opacity = '0' }, duration - 400)
  setTimeout(() => toast.remove(), duration)
}
