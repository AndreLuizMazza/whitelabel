/* firebase-messaging-sw.js */
/* eslint-disable no-undef */

// Usando as libs compat na Service Worker (recomendação do Firebase para web v9)
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js")

// Mesmo config do projeto Firebase
firebase.initializeApp({
  apiKey: "AIzaSyAa_GfEbL2E_r0cWurYYaxOoFXwYneg1S0",
  authDomain: "progem-74681.firebaseapp.com",
  projectId: "progem-74681",
  storageBucket: "progem-74681.firebasestorage.app",
  messagingSenderId: "755848466064",
  appId: "1:755848466064:web:2eb057f99cb56b20c79215",
})

// Instância de messaging no SW
const messaging = firebase.messaging()

// Mensagens recebidas em background (quando a aba não está em foco)
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message recebida:", payload)

  const notification = payload.notification || {}
  const notificationTitle = notification.title || "Nova notificação"
  const notificationOptions = {
    body: notification.body || "",
    // ajuste o ícone para um arquivo real do seu projeto (ex.: /icons/icon-192.png)
    icon: "/icon-192x192.png",
    data: payload.data || {},
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Clique na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = (event.notification && event.notification.data && event.notification.data.click_action) || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const client = clientList.find((c) => c.url.includes(self.location.origin))
      if (client) {
        return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})
