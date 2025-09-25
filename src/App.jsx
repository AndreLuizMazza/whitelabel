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
import Cadastro from "@/pages/Cadastro.jsx";

// Memorial
import MemorialList from '@/pages/MemorialList.jsx'
import MemorialDetail from '@/pages/MemorialDetail.jsx'
import ErrorBoundary from '@/components/ErrorBoundary.jsx'



// (opcional) página simples de confirmação
function Confirmacao() {
  const params = new URLSearchParams(location.search);
  const familia = params.get("familia");
  const orc = params.get("orcamento");
  return (
    <section className="section">
      <div className="container-max">
        <h1 className="text-2xl font-extrabold">Pedido enviado ✅</h1>
        <p className="mt-2">Recebemos seus dados. Em breve entraremos em contato.</p>
        <div className="mt-4 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 text-sm">
          <div className="flex justify-between"><span>ID Família</span><span>{familia || "-"}</span></div>
          <div className="flex justify-between"><span>ID Orçamento</span><span>{orc || "-"}</span></div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* carrega token + /unidades/me e aplica tema */}
      <TenantBootstrapper />

      <Navbar />

      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/planos" element={<PlanosGrid />} />
            <Route path="/cadastro" element={<Cadastro />} />
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

            {/* Rotas do Memorial */}
            <Route path="/memorial" element={<MemorialList />} />
            <Route path="/memorial/:slug" element={<MemorialDetail />} />

            <Route
              path="/area"
              element={
                <PrivateRoute>
                  <AreaUsuario />
                </PrivateRoute>
              }
            />
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
