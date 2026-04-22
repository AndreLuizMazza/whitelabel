// src/App.jsx
import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

import './styles/theme.css'
import './styles/print.css'
import ScrollToTop from '@/components/ScrollToTop'
import TenantBootstrapper from '@/components/TenantBootstrapper'
import NotificationsBootstrapper from '@/components/NotificationsBootstrapper.jsx'

import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import PlanosGrid from './pages/PlanosGrid.jsx'
import PlanoDetalhe from './pages/PlanoDetalhe.jsx'
import Produtos from './pages/Produtos.jsx'
import ProdutoDetalhe from './pages/ProdutoDetalhe.jsx'
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
import ServicosDigitais from '@/pages/ServicosDigitais.jsx'
import CarteirinhaPage from '@/pages/CarteirinhaPage.jsx'

// 🔐 Perfil (senha e avatar)
import Perfil from '@/pages/Perfil.jsx'

// 🔐 Novas páginas da área do associado
import DependentesPage from '@/pages/DependentesPage.jsx'
import HistoricoPagamentos from '@/pages/HistoricoPagamentos.jsx'
import SobreNos from '@/pages/SobreNos.jsx'
import TenantAboutGate from '@/components/TenantAboutGate.jsx'

// 🧩 Tenant (para título dinâmico)
import useTenant from '@/store/tenant'
import { applyRouteDocumentTitle } from '@/lib/shellBranding'
import { bootstrapTenantSeoDefaults } from '@/lib/seo'
import { isBeneficiosEnabled, isMemorialEnabled } from '@/lib/tenantModules'

// 🧩 Layout global com sidebar
import GlobalShell from '@/layouts/GlobalShell.jsx'

/** Gate único: bloqueia rota se o módulo estiver desabilitado no tenant (`empresa`). */
function TenantModuleGate({ module, children }) {
  const empresa = useTenant((s) => s.empresa)
  const ok =
    module === 'memorial'
      ? isMemorialEnabled(empresa)
      : isBeneficiosEnabled(empresa)
  if (!ok) return <Navigate to="/" replace />
  return children
}

function useDynamicTitle() {
  const location = useLocation()
  const tenant = useTenant((s) => s.empresa)

  useEffect(() => {
    applyRouteDocumentTitle(location.pathname, tenant)
  }, [location.pathname, tenant])

  useEffect(() => {
    bootstrapTenantSeoDefaults(useTenant.getState().empresa)
  }, [tenant])
}

function useBodyRouteTag() {
  const location = useLocation()
  useEffect(() => {
    document.body.setAttribute('data-route', location.pathname || '/')
    return () => document.body.removeAttribute('data-route')
  }, [location.pathname])
}

export default function App() {
  useDynamicTitle()
  useBodyRouteTag()

  const location = useLocation()

  // ✅ Dock NÃO deve existir no fluxo de contratação.
  const hideContactDock =
    location.pathname === '/cadastro' || location.pathname === '/confirmacao' || location.pathname === '/criar-conta' || location.pathname === '/area'|| location.pathname === '/memorial' || location.pathname === '/login'

  // ✅ Footer NÃO deve aparecer na Área do Associado, no fluxo de contratação, e no PlanoDetalhe (/planos/:id).
  const hideFooter =
    location.pathname === '/area' ||
    location.pathname.startsWith('/area/') ||
    location.pathname === '/perfil' ||
    location.pathname === '/carteirinha' ||
    location.pathname === '/carteirinha/print' ||
    location.pathname === '/servicos-digitais' ||
    location.pathname === '/cadastro' ||
    location.pathname === '/confirmacao' ||
    location.pathname === '/criar-conta' ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/planos/') ||
    location.pathname.startsWith('/produtos/') // detalhe do produto: foco na vitrine

  return (
    <div className="min-h-screen flex flex-col">
      <TenantBootstrapper />
      <NotificationsBootstrapper />

      <GlobalShell>
        <Navbar />

        <main className="flex-1">
          <ErrorBoundary>
            <ScrollToTop />
            <Routes>
              {/* Páginas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/planos" element={<PlanosGrid />} />
              <Route path="/planos/:id" element={<PlanoDetalhe />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/produtos/:id" element={<ProdutoDetalhe />} />
              <Route
                path="/beneficios"
                element={
                  <TenantModuleGate module="beneficios">
                    <ClubeBeneficios />
                  </TenantModuleGate>
                }
              />
              <Route
                path="/beneficios/:id"
                element={
                  <TenantModuleGate module="beneficios">
                    <ParceiroDetalhe />
                  </TenantModuleGate>
                }
              />
              <Route path="/contratos" element={<ContratoPage />} />
              <Route path="/contratos/:id/pagamentos" element={<Pagamentos />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/criar-conta" element={<RegisterPage />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route path="/redefinir-senha" element={<VerificarCodigo />} />
              <Route path="/trocar-senha" element={<TrocarSenha />} />
              <Route path="/politica-cookies" element={<PoliticaCookies />} />
              <Route
                path="/politica-privacidade"
                element={<PoliticaPrivacidade />}
              />
              <Route path="/termos-uso" element={<TermosUso />} />
              <Route path="/filiais" element={<Filiais />} />
              <Route
                path="/sobre-nos"
                element={
                  <TenantAboutGate>
                    <SobreNos />
                  </TenantAboutGate>
                }
              />
              <Route path="/verificar/:cpf" element={<VerificarCarteirinha />} />

              {/* Memorial */}
              <Route
                path="/memorial"
                element={
                  <TenantModuleGate module="memorial">
                    <MemorialList />
                  </TenantModuleGate>
                }
              />
              <Route
                path="/memorial/:slug"
                element={
                  <TenantModuleGate module="memorial">
                    <MemorialDetail />
                  </TenantModuleGate>
                }
              />

              {/* Impressão da carteirinha */}
              <Route path="/carteirinha/print" element={<CarteirinhaPrint />} />

              {/* 🔒 Serviços digitais */}
              <Route
                path="/servicos-digitais"
                element={
                  <PrivateRoute redirectTo="/login">
                    <ServicosDigitais />
                  </PrivateRoute>
                }
              />

              {/* 🔒 Fluxo de contratação */}
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

              {/* 🔒 Carteirinha */}
              <Route
                path="/carteirinha"
                element={
                  <PrivateRoute redirectTo="/login">
                    <CarteirinhaPage />
                  </PrivateRoute>
                }
              />

              {/* 🔒 Perfil */}
              <Route
                path="/perfil"
                element={
                  <PrivateRoute redirectTo="/login">
                    <Perfil />
                  </PrivateRoute>
                }
              />

              {/* 🔒 Dependentes */}
              <Route
                path="/area/dependentes"
                element={
                  <PrivateRoute redirectTo="/login">
                    <DependentesPage />
                  </PrivateRoute>
                }
              />

              {/* 🔒 Histórico de pagamentos */}
              <Route
                path="/area/pagamentos"
                element={
                  <PrivateRoute redirectTo="/login">
                    <HistoricoPagamentos />
                  </PrivateRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>

        <CookieBanner />

        {/* ✅ Footer condicional */}
        {!hideFooter && <Footer />}

        {/* ✅ Dock condicional */}
        {!hideContactDock && (
          <StickyContactDock
            position="bottom-left"
            extraAction={{
              label: 'Planos',
              href: '/planos',
              ariaLabel: 'Abrir simulador de planos',
              badge: 'Novo',
            }}
            avoidSelector="[data-cookie-banner], [data-bottom-avoid]"
            reserveSpace
            compactNearFooter
            hideOnKeyboard
            autoHideOnScroll
          />
        )}
      </GlobalShell>
    </div>
  )
}
