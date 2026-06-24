/** Gera/recupera um identificador do dispositivo (auditoria/segurança) */
export function getDeviceId() {
  const k = 'x_device_id'
  let v = null
  try {
    v = localStorage.getItem(k)
    if (!v) {
      v = crypto.randomUUID()
      localStorage.setItem(k, v)
    }
  } catch {}
  return v
}
