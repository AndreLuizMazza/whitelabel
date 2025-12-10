// src/lib/fcm.js
import { initializeApp } from "firebase/app"
import { getMessaging, getToken, isSupported } from "firebase/messaging"
import api from "@/lib/api"
import useAuth from "@/store/auth"

// Configuração do Firebase (variáveis do Vite)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let firebaseApp
function getFirebaseApp() {
  if (!firebaseApp) {
    console.info("[FCM] Inicializando Firebase App (web)...")
    firebaseApp = initializeApp(firebaseConfig)
  }
  return firebaseApp
}

function detectarModeloNavegador() {
  if (typeof navigator === "undefined") return "Desconhecido"
  const ua = navigator.userAgent || ""
  if (/chrome|crios|crmo/i.test(ua) && !/edge|edg/i.test(ua)) return "Chrome"
  if (/edg/i.test(ua)) return "Edge"
  if (/firefox|fxios/i.test(ua)) return "Firefox"
  if (/safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua)) return "Safari"
  if (/opr\//i.test(ua)) return "Opera"
  return "Navegador Web"
}

function truncate(str, max) {
  if (!str) return str
  const s = String(str)
  return s.length > max ? s.slice(0, max) : s
}

async function ensureServiceWorkerRegistration() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.info("[FCM] Service Worker não suportado neste ambiente.")
    return null
  }

  try {
    let reg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js")

    if (!reg) {
      console.info("[FCM] Registrando firebase-messaging-sw.js...")
      reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
    }

    console.info("[FCM] Service Worker ativo para FCM:", reg.scope)
    return reg
  } catch (err) {
    console.error("[FCM] Erro ao registrar Service Worker FCM:", err)
    return null
  }
}

/**
 * Tenta resolver o usuarioAppId:
 *  1) A partir do estado do useAuth (user.id, usuarioAppId, etc.)
 *  2) Se ainda estiver null, chama GET /api/v1/app/me e usa o campo "id"
 */
async function resolverUsuarioAppId() {
  let usuarioAppId = null

  try {
    const authState = typeof useAuth.getState === "function" ? useAuth.getState() : null
    const currentUser = authState?.user || authState?.usuario || null

    usuarioAppId =
      currentUser?.usuarioAppId ??
      currentUser?.appId ??
      currentUser?.id ??
      null

    console.info("[FCM] Estado auth atual:", currentUser)
    console.info("[FCM] usuarioAppId resolvido via estado:", usuarioAppId)

    if (usuarioAppId) return usuarioAppId
  } catch (err) {
    console.warn("[FCM] Não foi possível ler useAuth.getState():", err)
  }

  // Fallback: chamar /api/v1/app/me
  try {
    console.info("[FCM] Buscando usuarioAppId via GET /api/v1/app/me...")
    const resp = await api.get("/api/v1/app/me")
    const data = resp?.data
    if (data?.id) {
      usuarioAppId = data.id
      console.info("[FCM] usuarioAppId obtido de /app/me:", usuarioAppId)
      return usuarioAppId
    } else {
      console.warn("[FCM] /api/v1/app/me não retornou id válido:", data)
    }
  } catch (err) {
    console.error("[FCM] Erro ao chamar /api/v1/app/me para resolver usuarioAppId:", err)
  }

  return null
}

/**
 * Registro do dispositivo FCM Web na API Progem.
 *
 * POST /api/v1/app/me/devices
 * Body esperado:
 *  - fcmToken     (string)
 *  - plataforma   (ex.: "WEB")
 *  - appTipo      (ex.: "ASSOCIADO")
 *  - modelo       (varchar(100))
 *  - soVersao     (varchar(50))
 *  - usuarioAppId (Long)
 */
export async function registrarDispositivoFcmWeb() {
  try {
    if (typeof window === "undefined") {
      console.info("[FCM] Ignorando registro (não é ambiente de navegador).")
      return
    }

    console.info("[FCM] Iniciando fluxo de registro de dispositivo (WEB)...")

    const supported = await isSupported().catch(err => {
      console.error("[FCM] isSupported() falhou:", err)
      return false
    })

    if (!supported) {
      console.info("[FCM] Navegador não suporta FCM / Push.")
      return
    }

    if (typeof Notification === "undefined") {
      console.info("[FCM] API Notification indisponível no navegador.")
      return
    }

    const permission = await Notification.requestPermission()
    console.info("[FCM] Permissão de notificação:", permission)

    if (permission !== "granted") {
      console.info("[FCM] Usuário não concedeu permissão para notificações; abortando registro.")
      return
    }

    const swReg = await ensureServiceWorkerRegistration()
    if (!swReg) {
      console.warn("[FCM] Service Worker não disponível para FCM; abortando.")
      return
    }

    const app = getFirebaseApp()
    const messaging = getMessaging(app)

    const fcmToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    })

    if (!fcmToken) {
      console.warn("[FCM] Não foi possível obter o token FCM (getToken retornou vazio).")
      return
    }

    console.info("[FCM] Token FCM obtido (primeiros 16 chars):", fcmToken.substring(0, 16) + "...")

    // Respeita limites da tabela:
    // modelo: varchar(100)
    // so_versao: varchar(50)
    const modeloRaw = detectarModeloNavegador()
    const modelo = truncate(modeloRaw, 100)

    const soVersaoRaw =
      (typeof navigator !== "undefined"
        ? navigator.userAgent || navigator.platform
        : "WEB") || "WEB"
    const soVersao = truncate(soVersaoRaw, 50)

    // Garante que há token de acesso no auth
    try {
      const authState = typeof useAuth.getState === "function" ? useAuth.getState() : null
      const token = authState?.token
      if (!token) {
        console.warn("[FCM] Sem token de acesso no estado; não registrando dispositivo.")
        return
      }
    } catch (err) {
      console.warn("[FCM] Não foi possível validar token no estado de auth:", err)
    }

    const usuarioAppId = await resolverUsuarioAppId()

    if (!usuarioAppId) {
      console.warn(
        "[FCM] Não foi possível determinar usuarioAppId (nem estado, nem /app/me); abortando registro."
      )
      return
    }

    const payload = {
      fcmToken,
      plataforma: "WEB",
      appTipo: "ASSOCIADO",
      modelo,
      soVersao,
      usuarioAppId,
    }

    console.info("[FCM] Enviando payload para /api/v1/app/me/devices:", payload)

    await api.post("/api/v1/app/me/devices", payload)

    console.info("[FCM] Dispositivo registrado na API com sucesso.")
  } catch (err) {
    console.error("[FCM] Erro ao registrar dispositivo FCM / device:", err)
  }
}
