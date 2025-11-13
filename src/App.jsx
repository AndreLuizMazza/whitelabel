import { Routes, Route, Navigate } from 'react-router-dom'

import './styles/theme.css'
import './styles/print.css' // impressão (CR-80 / A4)
import ScrollToTop from '@/components/ScrollToTop'
import TenantBootstrapper from '@/components/TenantBootstrapper'

import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import PlanosGrid from './pages/PlanosGrid.jsx'
import PlanoDetalhe from './pages/PlanoDetalhe.jsx'
import ContratoPage from './pages/ContratoPage.jsx'
import PrivateRoute from './components/PrivateRoute'
import AreaUsuario from './pages/AreaUsuario.jsx'
import Pagamentos from './pages/Pagamentos.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ClubeBeneficios from './pages/ClubeBeneficios.jsx'
import PoliticaCookies from '@/pages/PoliticaCookies'
import PoliticaPrivacidade from '@/pages/PoliticaPrivacidade'
import TermosUso from '@/pages/TermosUso'
import Filiais from '@/pages/Filiais.jsx'
import CookieBanner from '@/components/CookieBanner.jsx'
import ParceiroDetalhe from '@/pages/ParceiroDetalhe'
import RegisterPage from '@/pages/RegisterPage.jsx'
import RecuperarSenha from '@/pages/RecuperarSenha.jsx'
import Cadastro from '@/pages/Cadastro.jsx'
import Confirmacao from '@/pages/Confirmacao.jsx'
import VerificarCodigo from '@/pages/VerificarCodigo.jsx'
import TrocarSenha from '@/pages/TrocarSenha.jsx'
import StickyContactDock from './components/StickyContactDock.jsx'

// Memorial
import MemorialList from '@/pages/MemorialList.jsx'
import MemorialDetail from '@/pages/MemorialDetail.jsx'
import ErrorBoundary from '@/components/ErrorBoundary.jsx'
import VerificarCarteirinha from '@/pages/VerificarCarteirinha'
// Impressão da carteirinha
import CarteirinhaPrint from '@/pages/CarteirinhaPrint.jsx'

// 🔐 Perfil (senha e avatar)
import Perfil from '@/pages/Perfil.jsx'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* carrega token + /unidades/me e aplica tema */}
      <TenantBootstrapper />

      <Navbar />

      <main className="flex-1">
        <ErrorBoundary>
              <ScrollToTop />
          <Routes>
            {/* Páginas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/planos" element={<PlanosGrid />} />
            <Route path="/planos/:id" element={<PlanoDetalhe />} />
            <Route path="/beneficios" element={<ClubeBeneficios />} />
            <Route path="/beneficios/:id" element={<ParceiroDetalhe />} />
            <Route path="/contratos" element={<ContratoPage />} />
            <Route path="/contratos/:id/pagamentos" element={<Pagamentos />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/criar-conta" element={<RegisterPage />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/redefinir-senha" element={<VerificarCodigo />} />
            <Route path="/politica-cookies" element={<PoliticaCookies />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/termos-uso" element={<TermosUso />} />
            <Route path="/filiais" element={<Filiais />} />
            <Route path="/verificar/:cpf" element={<VerificarCarteirinha />} />
            {/* Memorial */}
            <Route path="/memorial" element={<MemorialList />} />
            <Route path="/memorial/:slug" element={<MemorialDetail />} />

            {/* Impressão da carteirinha */}
            <Route path="/carteirinha/print" element={<CarteirinhaPrint />} />

            {/* 🔒 Fluxo de contratação: prioriza registro */}
            <Route
              path="/cadastro"
              element={
                <PrivateRoute redirectTo="/criar-conta">
                  <Cadastro />
                </PrivateRoute>
              }
            />
            <Route
              path="/confirmacao"
              element={
                <PrivateRoute redirectTo="/criar-conta">
                  <Confirmacao />
                </PrivateRoute>
              }
            />

            {/* 🔒 Área do associado */}
            <Route
              path="/area"
              element={
                <PrivateRoute redirectTo="/login">
                  <AreaUsuario />
                </PrivateRoute>
              }
            />

            {/* 🔒 Perfil (senha + avatar) */}
            <Route
              path="/perfil"
              element={
                <PrivateRoute redirectTo="/login">
                  <Perfil />
                </PrivateRoute>
              }
            />

            {/* Redirecionamento padrão */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Banner de cookies sempre ativo */}
      <CookieBanner />

      <Footer />

      <StickyContactDock
        position="bottom-left"
        extraAction={{
          label: 'Planos',
          href: '/planos',
          ariaLabel: 'Abrir simulador de planos',
          badge: 'Novo',
        }}
        avoidSelector='[data-cookie-banner], [data-bottom-avoid]'
        reserveSpace
        compactNearFooter
        hideOnKeyboard
        autoHideOnScroll
      />
    </div>
  )
}
