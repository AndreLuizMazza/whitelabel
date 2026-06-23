// src/hooks/useContratoDoUsuario.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '@/lib/api'
import { normalizeContratosResponse } from '@/lib/postAuthNavigation'

export default function useContratoDoUsuario({
  cpf,
  initialContratoId = null,
  retryOnEmpty = 0,
}) {
  const [erro, setErro] = useState(null)

  const [contratos, setContratos] = useState([])
  const [contrato, setContrato] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const [dependentes, setDependentes] = useState([])
  const [pagamentos, setPagamentos] = useState([])

  const [loadingLista, setLoadingLista] = useState(true)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const loading = loadingLista || loadingDetalhes

  const listReqId = useRef(0)
  const detailReqId = useRef(0)

  const onlyDigits = (s) => (s || '').toString().replace(/\D/g, '')
  const getId = (c) => c?.id ?? c?.contratoId ?? c?.numeroContrato
  const toKey = (v) => (v == null ? null : String(v))
  const isAtivo = (c) =>
    c?.contratoAtivo === true || String(c?.status || '').toUpperCase() === 'ATIVO'
  const isAberta = (x) => String(x?.status || '').toUpperCase() === 'ABERTA'

  const asDate = (s) => {
    if (!s) return 0
    const hasTime = /T\d{2}:\d{2}/.test(String(s))
    const d = hasTime ? new Date(s) : new Date(`${s}T00:00:00`)
    return isNaN(+d) ? 0 : d.getTime()
  }

  const hoje = (() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  })()

  const niceError = (e, fallback = 'Erro desconhecido') =>
    e?.response?.data?.error || e?.response?.statusText || e?.message || fallback

  const pickPreferredId = useCallback(
    (arr) => {
      if (!arr?.length) return null
      const initialKey = initialContratoId ? toKey(initialContratoId) : null
      if (initialKey) {
        const match = arr.find((c) => toKey(getId(c)) === initialKey)
        if (match) return toKey(getId(match))
      }
      const preferred = arr.find(isAtivo) || arr[0]
      return toKey(getId(preferred))
    },
    [initialContratoId]
  )

  // 1) Lista por CPF (com retry opcional pós-adesão)
  useEffect(() => {
    const cpfSan = onlyDigits(cpf)
    if (!cpfSan) {
      setErro('CPF não informado')
      setLoadingLista(false)
      return
    }

    let cancelled = false
    const myId = ++listReqId.current

    setLoadingLista(true)
    setErro(null)
    setContratos([])
    setContrato(null)
    setSelectedId(null)
    setDependentes([])
    setPagamentos([])

    async function fetchList(attempt = 0) {
      try {
        const resp = await api.get(`/api/v1/contratos/cpf/${encodeURIComponent(cpfSan)}`)
        if (cancelled || listReqId.current !== myId) return

        const arr = normalizeContratosResponse(resp)
        setContratos(arr)

        if (arr.length > 0) {
          setSelectedId(pickPreferredId(arr))
          return
        }

        if (attempt < retryOnEmpty) {
          await new Promise((r) => setTimeout(r, 600))
          if (!cancelled && listReqId.current === myId) {
            return fetchList(attempt + 1)
          }
        }
      } catch (e) {
        if (!cancelled && listReqId.current === myId) setErro(niceError(e))
      } finally {
        if (!cancelled && listReqId.current === myId) setLoadingLista(false)
      }
    }

    fetchList()

    return () => {
      cancelled = true
    }
  }, [cpf, retryOnEmpty, pickPreferredId])

  // 2) Detalhes (dependentes + pagamentos)
  useEffect(() => {
    const sel = contratos.find((c) => toKey(getId(c)) === toKey(selectedId)) || null
    setContrato(sel)
    setDependentes([])
    setPagamentos([])

    if (!sel) {
      setLoadingDetalhes(false)
      return
    }

    const myId = ++detailReqId.current
    setLoadingDetalhes(true)

    async function loadDetails() {
      try {
        const cid = getId(sel)
        if (!cid) return
        const [dep, pags] = await Promise.allSettled([
          api.get(`/api/v1/contratos/${cid}/dependentes`),
          api.get(`/api/v1/contratos/${cid}/pagamentos`),
        ])
        if (detailReqId.current !== myId) return

        const arrDep = dep.status === 'fulfilled' ? normalizeContratosResponse(dep.value) : []
        const arrPag = pags.status === 'fulfilled' ? normalizeContratosResponse(pags.value) : []

        setDependentes(arrDep)
        setPagamentos(arrPag)
      } catch (e) {
        if (detailReqId.current === myId) setErro(niceError(e))
      } finally {
        if (detailReqId.current === myId) setLoadingDetalhes(false)
      }
    }
    loadDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, contratos])

  // 3) Derivados para a UI
  const abertasOrdenadas = useMemo(
    () =>
      [...(pagamentos || [])]
        .filter((p) => isAberta(p))
        .sort((a, b) => asDate(a.dataVencimento) - asDate(b.dataVencimento)),
    [pagamentos]
  )

  const proximaParcela = useMemo(() => abertasOrdenadas[0] || null, [abertasOrdenadas])

  const proximas = useMemo(
    () => (abertasOrdenadas.length > 1 ? abertasOrdenadas.slice(1) : []),
    [abertasOrdenadas]
  )

  const historico = useMemo(
    () =>
      (pagamentos || [])
        .filter((p) => !isAberta(p))
        .sort((a, b) => {
          const da = asDate(a.dataRecebimento || a.dataVencimento)
          const db = asDate(b.dataRecebimento || b.dataVencimento)
          return db - da
        }),
    [pagamentos]
  )

  const isAtraso = (p) => isAberta(p) && asDate(p?.dataVencimento) < hoje

  const chooseContrato = useCallback((id) => {
    setSelectedId(toKey(id))
  }, [])

  return {
    contratos,
    contrato,
    selectedId,
    chooseContrato,
    dependentes,
    pagamentos,
    proximaParcela,
    proximas,
    historico,
    isAtraso,
    loading,
    erro,
  }
}
