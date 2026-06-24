// src/App.jsx
import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

import './styles/theme.css'
import './styles/print.css'
import ScrollToTop from '@/components/ScrollToTop'
import TenantBootstrapper from '@/components/TenantBootstrapper'
import NotificationsBootstrapper from '@/components/NotificationsBootstrapper.jsx'
import ErrorBoundary from '@/components/ErrorBoundary.jsx'

import Home from './pages/Home.jsx'
import PlanosGrid from './pages/PlanosGrid.jsx'
import PlanoDetalhe from './pages/PlanoDetalhe.jsx'
import Produtos from './pages/Produtos.jsx'
import ProdutoDetalhe from './pages/ProdutoDetalhe.jsx'
import ContratoPage from './pages/ContratoPage.jsx'
import AreaUsuario from './pages/AreaUsuario.jsx'
import Pagamentos from './pages/Pagamentos.jsx'
import LoginPage from './pages/LoginPage.jsx'
import BeneficiosPublico from './pages/BeneficiosPublico.jsx'
import BeneficiosAssociado from './pages/BeneficiosAssociado.jsx'
import ServicosDigitaisPublico from './pages/ServicosDigitaisPublico.jsx'
import ServicosDigitaisAssociado from './pages/ServicosDigitaisAssociado.jsx'
import RedirectServicosDigitais from './pages/RedirectServicosDigitais.jsx'
import RedirectBeneficioParceiroPublico from './pages/RedirectBeneficioParceiroPublico.jsx'
import PoliticaCookies from '@/pages/PoliticaCookies'
import PoliticaPrivacidade from '@/pages/PoliticaPrivacidade'
import TermosUso from '@/pages/TermosUso'
import Filiais from '@/pages/Filiais.jsx'
import ParceiroDetalhe from '@/pages/ParceiroDetalhe'
import RegisterPage from '@/pages/RegisterPage.jsx'
import RecuperarSenha from '@/pages/RecuperarSenha.jsx'
import Cadastro from '@/pages/Cadastro.jsx'
import Confirmacao from '@/pages/Confirmacao.jsx'
import VerificarCodigo from '@/pages/VerificarCodigo.jsx'
import TrocarSenha from '@/pages/TrocarSenha.jsx'
import MemorialList from '@/pages/MemorialList.jsx'
import MemorialDetail from '@/pages/MemorialDetail.jsx'
import VerificarCarteirinha from '@/pages/VerificarCarteirinha'
import CarteirinhaPrint from '@/pages/CarteirinhaPrint.jsx'
import CarteirinhaPage from '@/pages/CarteirinhaPage.jsx'
import Perfil from '@/pages/Perfil.jsx'
import PerfilAlterarSenha from '@/pages/PerfilAlterarSenha.jsx'
import DependentesPage from '@/pages/DependentesPage.jsx'
import HistoricoPagamentos from '@/pages/HistoricoPagamentos.jsx'
import SobreNos from '@/pages/SobreNos.jsx'
import TenantAboutGate from '@/components/TenantAboutGate.jsx'
import PrivateRoute from './components/PrivateRoute'
import useTenant from '@/store/tenant'
import { applyRouteDocumentTitle } from '@/lib/shellBranding'
import { bootstrapTenantSeoDefaults } from '@/lib/seo'
import { isBeneficiosEnabled, isMemorialEnabled } from '@/lib/tenantModules'

import PublicLayout from '@/layouts/PublicLayout.jsx'
import AuthLayout from '@/layouts/AuthLayout.jsx'
import MemberLayout from '@/layouts/MemberLayout.jsx'

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

/** Gate único: bloqueia rota se o módulo estiver desabilitado no tenant. */
function TenantModuleGateInline({ module, children }) {
  const empresa = useTenant((s) => s.empresa)
  const ok =
    module === 'memorial'
      ? isMemorialEnabled(empresa)
      : isBeneficiosEnabled(empresa)
  if (!ok) return <Navigate to="/" replace />
  return children
}

export default function App() {
  useDynamicTitle()
  useBodyRouteTag()

  return (
    <div className="min-h-screen flex flex-col">
      <TenantBootstrapper />
      <NotificationsBootstrapper />

      <ErrorBoundary>
        <ScrollToTop />
        <Routes>
          {/* ── Auth zone (sem marketing chrome) ── */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/criar-conta" element={<RegisterPage />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/redefinir-senha" element={<VerificarCodigo />} />
            <Route path="/trocar-senha" element={<TrocarSenha />} />
          </Route>

          {/* ── Member zone (app-like shell) ── */}
          <Route element={<MemberLayout />}>
            <Route path="/area" element={<AreaUsuario />} />
            <Route path="/area/dependentes" element={<DependentesPage />} />
            <Route path="/area/pagamentos" element={<HistoricoPagamentos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil/senha" element={<PerfilAlterarSenha />} />
            <Route path="/carteirinha" element={<CarteirinhaPage />} />
            <Route
              path="/area/beneficios"
              element={
                <TenantModuleGateInline module="beneficios">
                  <BeneficiosAssociado />
                </TenantModuleGateInline>
              }
            />
            <Route
              path="/area/servicos-digitais"
              element={
                <TenantModuleGateInline module="beneficios">
                  <ServicosDigitaisAssociado />
                </TenantModuleGateInline>
              }
            />
            <Route
              path="/area/beneficios/:id"
              element={
                <TenantModuleGateInline module="beneficios">
                  <ParceiroDetalhe />
                </TenantModuleGateInline>
              }
            />
            <Route path="/servicos-digitais" element={<RedirectServicosDigitais />} />
          </Route>

          {/* ── Public zone (marketing chrome) ── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/planos" element={<PlanosGrid />} />
            <Route path="/planos/:id" element={<PlanoDetalhe />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/produtos/:id" element={<ProdutoDetalhe />} />
            <Route
              path="/beneficios"
              element={
                <TenantModuleGateInline module="beneficios">
                  <BeneficiosPublico />
                </TenantModuleGateInline>
              }
            />
            <Route
              path="/servicos-digitais"
              element={
                <TenantModuleGateInline module="beneficios">
                  <ServicosDigitaisPublico />
                </TenantModuleGateInline>
              }
            />
            <Route
              path="/beneficios/:id"
              element={
                <TenantModuleGateInline module="beneficios">
                  <RedirectBeneficioParceiroPublico />
                </TenantModuleGateInline>
              }
            />
            <Route path="/contratos" element={<ContratoPage />} />
            <Route path="/contratos/:id/pagamentos" element={<Pagamentos />} />
            <Route path="/politica-cookies" element={<PoliticaCookies />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
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
            <Route
              path="/memorial"
              element={
                <TenantModuleGateInline module="memorial">
                  <MemorialList />
                </TenantModuleGateInline>
              }
            />
            <Route
              path="/memorial/:slug"
              element={
                <TenantModuleGateInline module="memorial">
                  <MemorialDetail />
                </TenantModuleGateInline>
              }
            />
            {/* Contratação — ainda no chrome público, mas protegida */}
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
          </Route>

          {/* Print — sem chrome */}
          <Route path="/carteirinha/print" element={<CarteirinhaPrint />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </div>
  )
}
