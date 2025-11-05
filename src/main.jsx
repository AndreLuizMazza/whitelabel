import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

/* 1) Tokens/base do tema (valores padrão) */
import './styles/theme.css'

/* 2) Inicializa: modo claro/escuro + aplica VARS do tenant */
import './theme/initTheme'

/* 3) Demais estilos globais (tailwind etc.) */
import './index.css'

const Root = (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>
)

createRoot(document.getElementById('root')).render(
  import.meta.env.PROD ? <React.StrictMode>{Root}</React.StrictMode> : Root
)
