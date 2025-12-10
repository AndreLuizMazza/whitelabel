// src/App.jsx
import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

import './styles/theme.css'
import './styles/print.css' // impressão (CR-80 / A4)
import ScrollToTop from '@/components/ScrollToTop'
import TenantBootstrapper from '@/components/TenantBootstrapper'
import NotificationsBootstrapper from '@/components/NotificationsBootstrapper.jsx'

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
import ServicosDigitais from '@/pages/ServicosDigitais.jsx'
import CarteirinhaPage from '@/pages/CarteirinhaPage.jsx'

// 🔐 Perfil (senha e avatar)
import Perfil from '@/pages/Perfil.jsx'

// 🔐 Novas páginas da área do associado
import DependentesPage from '@/pages/DependentesPage.jsx'
import HistoricoPagamentos from '@/pages/HistoricoPagamentos.jsx'

// 🧩 Tenant (para título dinâmico)
import useTenant from '@/store/tenant'

// 🧩 Layout global com sidebar
import GlobalShell from '@/layouts/GlobalShell.jsx'

/**
 * Resolve o “subtítulo” da página com base na rota.
 * Ideia: algo curto, elegante e útil na aba do navegador.
 */
function resolvePageTitle(pathname = '/') {
  if (pathname === '/') return 'Início'
  if (pathname === '/planos') return 'Planos'
  if (pathname.startsWith('/planos/')) return 'Detalhes do plano'
  if (pathname === '/beneficios') return 'Clube de Benefícios'
  if (pathname.startsWith('/beneficios/')) return 'Benefício'
  if (pathname === '/contratos') return 'Contratos'
  if (pathname.endsWith('/pagamentos')) return 'Pagamentos do contrato'
  if (pathname === '/login') return 'Entrar'
  if (pathname === '/criar-conta') return 'Criar conta'
  if (pathname === '/recuperar-senha') return 'Recuperar senha'
  if (pathname === '/redefinir-senha') return 'Verificar código'
  if (pathname === '/trocar-senha') return 'Trocar senha'
  if (pathname === '/politica-cookies') return 'Política de Cookies'
  if (pathname === '/politica-privacidade') return 'Política de Privacidade'
  if (pathname === '/termos-uso') return 'Termos de Uso'
  if (pathname === '/filiais') return 'Unidades'
  if (pathname.startsWith('/verificar/')) return 'Verificar carteirinha'

  if (pathname === '/memorial') return 'Memorial'
  if (pathname.startsWith('/memorial/')) return 'Homenagem'

  if (pathname === '/carteirinha/print') return 'Impressão da carteirinha'
  if (pathname === '/servicos-digitais') return 'Serviços digitais'
  if (pathname === '/carteirinha') return 'Carteirinha digital'

  if (pathname === '/area') return 'Área do associado'
  if (pathname === '/perfil') return 'Perfil'
  if (pathname === '/area/dependentes') return 'Dependentes'
  if (pathname === '/area/pagamentos') return 'Histórico de pagamentos'

  return ''
}

/**
 * Hook para atualizar o título da aba com base no tenant + rota.
 * Ex.: "Planos • Funerária Patense"
 */
function useDynamicTitle() {
  const location = useLocation()
  const tenant = useTenant((s) => s.empresa)

  useEffect(() => {
    const base =
      tenant?.nomeFantasia ||
      tenant?.nome ||
      'Progem Starter' // fallback geral

    const section = resolvePageTitle(location.pathname)
    document.title = section ? `${section} • ${base}` : base
  }, [location.pathname, tenant])
}

export default function App() {
  useDynamicTitle()

  return (
    <div className="min-h-screen flex flex-col">
      {/* carrega token + /unidades/me e aplica tema */}
      <TenantBootstrapper />
      {/* escuta webhooks globalmente e atualiza store + unread */}
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
              <Route path="/beneficios" element={<ClubeBeneficios />} />
              <Route path="/beneficios/:id" element={<ParceiroDetalhe />} />
              <Route path="/contratos" element={<ContratoPage />} />
              <Route path="/contratos/:id/pagamentos" element={<Pagamentos />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/criar-conta" element={<RegisterPage />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route path="/redefinir-senha" element={<VerificarCodigo />} />
              <Route path="/trocar-senha" element={<TrocarSenha />} />
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

              {/* 🔒 Serviços digitais */}
              <Route
                path="/servicos-digitais"
                element={
                  <PrivateRoute redirectTo="/login">
                    <ServicosDigitais />
                  </PrivateRoute>
                }
              />

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

              {/* 🔒 Carteirinha (nova página dedicada) */}
              <Route
                path="/carteirinha"
                element={
                  <PrivateRoute redirectTo="/login">
                    <CarteirinhaPage />
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

              {/* 🔒 Dependentes – área do associado */}
              <Route
                path="/area/dependentes"
                element={
                  <PrivateRoute redirectTo="/login">
                    <DependentesPage />
                  </PrivateRoute>
                }
              />

              {/* 🔒 Histórico de pagamentos – área do associado */}
              <Route
                path="/area/pagamentos"
                element={
                  <PrivateRoute redirectTo="/login">
                    <HistoricoPagamentos />
                  </PrivateRoute>
                }
              />

              {/* Redirecionamento padrão */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>

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
      </GlobalShell>
    </div>
  )
}
