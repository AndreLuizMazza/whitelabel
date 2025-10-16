// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'

import './styles/theme.css'

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

// Memorial
import MemorialList from '@/pages/MemorialList.jsx'
import MemorialDetail from '@/pages/MemorialDetail.jsx'
import ErrorBoundary from '@/components/ErrorBoundary.jsx'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* carrega token + /unidades/me e aplica tema */}
      <TenantBootstrapper />

      <Navbar />

      <main className="flex-1">
        <ErrorBoundary>
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
            <Route path="/politica-cookies" element={<PoliticaCookies />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/termos-uso" element={<TermosUso />} />
            <Route path="/filiais" element={<Filiais />} />

            {/* Memorial */}
            <Route path="/memorial" element={<MemorialList />} />
            <Route path="/memorial/:slug" element={<MemorialDetail />} />

            {/* ⚠️ Páginas que exigem login
                Se não estiver autenticado, vai para /criar-conta (não /login) */}
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
            <Route
              path="/area"
              element={
                <PrivateRoute redirectTo="/criar-conta">
                  <AreaUsuario />
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
    </div>
  )
}
