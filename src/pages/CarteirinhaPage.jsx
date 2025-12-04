// src/pages/CarteirinhaPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '@/store/auth'
import useContratoDoUsuario from '@/hooks/useContratoDoUsuario'
import CarteirinhaAssociado from '@/components/CarteirinhaAssociado'
import { displayCPF, formatCPF } from '@/lib/cpf'
import { Lock, ArrowLeft } from 'lucide-react'
import { showToast } from '@/lib/toast'

/* simples helper para skeleton */
function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{
        background:
          'linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.10), rgba(0,0,0,0.06))',
        backgroundSize: '200% 100%',
      }}
    />
  )
}

export default function CarteirinhaPage() {
  const user = useAuth((s) => s.user)

  const cpf =
    user?.cpf ||
    user?.documento ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem('auth_user') || '{}').cpf
      } catch {
        return ''
      }
    })() ||
    ''

  const {
    contrato,
    loading,
    erro,
  } = useContratoDoUsuario({ cpf })

  const nomeExibicao = useMemo(
    () => user?.nome ?? user?.email ?? 'Associado(a)',
    [user]
  )

  /* revelação de CPF só aqui em cima, opcional */
  const [cpfReveal, setCpfReveal] = useState(false)
  const [cpfSeconds, setCpfSeconds] = useState(0)
  const timerRef = useRef(null)
  const tickRef = useRef(null)

  function startReveal10s() {
    if (!cpf) return
    setCpfReveal(true)
    setCpfSeconds(10)
    showToast('CPF visível por 10 segundos.', null, null, 3500)

    tickRef.current && clearInterval(tickRef.current)
    tickRef.current = setInterval(
      () => setCpfSeconds((s) => (s > 0 ? s - 1 : 0)),
      1000
    )

    timerRef.current && clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCpfReveal(false)
      setCpfSeconds(0)
      clearInterval(tickRef.current)
      tickRef.current = null
      showToast('CPF ocultado novamente.')
    }, 10000)
  }

  useEffect(
    () => () => {
      timerRef.current && clearTimeout(timerRef.current)
      tickRef.current && clearInterval(tickRef.current)
    },
    []
  )

  useEffect(() => {
    if (erro) {
      showToast(
        'Não foi possível carregar os dados do contrato para a carteirinha.'
      )
    }
  }, [erro])

  const printableState =
    contrato && user
      ? { user, contrato, side: 'both' }
      : null

  return (
    <section className="section">
      <div className="container-max max-w-5xl">
        {/* topo / breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/area"
              className="inline-flex items-center gap-1 text-sm btn-ghost"
            >
              <ArrowLeft size={16} />
              Voltar para a Área do Associado
            </Link>
          </div>
        </div>

        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Carteirinha do Associado
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text)' }}>
              {nomeExibicao}
              {cpf && (
                <>
                  {' '}
                  • CPF{' '}
                  {cpfReveal ? formatCPF(cpf) : displayCPF(cpf, 'last2')}
                </>
              )}
            </p>
          </div>

          {cpf && (
            <button
              type="button"
              className="btn-outline text-xs self-start"
              onClick={startReveal10s}
              disabled={cpfReveal}
            >
              <Lock size={14} className="mr-1" />
              {cpfReveal ? `CPF visível (${cpfSeconds}s)` : 'Mostrar CPF por 10s'}
            </button>
          )}
        </header>

        {loading && (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-56" />
            <Skeleton className="h-10" />
          </div>
        )}

        {!loading && !contrato && !erro && (
          <div className="mt-6 card p-6 text-center">
            <p className="font-medium">
              Nenhum contrato localizado para exibir a carteirinha.
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
              Assim que seu contrato for efetivado, sua carteirinha digital
              ficará disponível aqui.
            </p>
            <div className="mt-4">
              <Link to="/planos" className="btn-primary">
                Conhecer planos
              </Link>
            </div>
          </div>
        )}

        {!loading && contrato && (
          <>
            <div className="mt-6 flex justify-center">
              <CarteirinhaAssociado
                user={user}
                contrato={contrato}
                printable={false}
                matchContratoHeight={false}
                loadAvatar={true}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {printableState && (
                <Link
                  to="/carteirinha/print"
                  state={printableState}
                  className="btn-outline text-sm inline-flex items-center gap-1"
                >
                  <Lock size={14} />
                  Imprimir (frente e verso)
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
