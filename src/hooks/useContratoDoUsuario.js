// src/hooks/useContratoDoUsuario.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '@/lib/api'

export default function useContratoDoUsuario({ cpf }) {
  const [erro, setErro] = useState(null)

  const [contratos, setContratos] = useState([])
  const [contrato, setContrato] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const [dependentes, setDependentes] = useState([])
  const [pagamentos, setPagamentos] = useState([]) // único array usado na UI

  const [loadingLista, setLoadingLista] = useState(true)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const loading = loadingLista || loadingDetalhes

  // reqIds independentes para evitar "loading infinito" por corridas
  const listReqId = useRef(0)
  const detailReqId = useRef(0)

  // ------- helpers -------
  const onlyDigits = (s) => (s || '').toString().replace(/\D/g, '')
  const getId = (c) => c?.id ?? c?.contratoId ?? c?.numeroContrato
  const toKey = (v) => (v == null ? null : String(v))
  const isAtivo = (c) => c?.contratoAtivo === true || String(c?.status || '').toUpperCase() === 'ATIVO'
  const isAberta = (x) => String(x?.status || '').toUpperCase() === 'ABERTA'

  const asDate = (s) => {
    if (!s) return 0
    // se já vier ISO com hora, só faz Date(s)
    const hasTime = /T\d{2}:\d{2}/.test(String(s))
    const d = hasTime ? new Date(s) : new Date(`${s}T00:00:00`)
    return isNaN(+d) ? 0 : d.getTime()
  }

  const hoje = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime() })()

  const pickAxiosData = (resp) => resp?.data ?? resp

  function normalizeToArray(input) {
    let v = input

    // unwrap axios
    v = pickAxiosData(v)

    // string JSON
    if (typeof v === 'string') {
      const t = v.trim()
      if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))) {
        try { v = JSON.parse(t) } catch { /* ignore */ }
      }
    }

    // formatos comuns
    if (Array.isArray(v)) return v
    if (Array.isArray(v?.content)) return v.content
    if (Array.isArray(v?.data)) return v.data
    if (Array.isArray(v?.rows)) return v.rows
    if (Array.isArray(v?.items)) return v.items

    // objeto simples → nenhum item
    return []
  }

  const niceError = (e, fallback = 'Erro desconhecido') =>
    e?.response?.data?.error || e?.response?.statusText || e?.message || fallback

  // 1) Carrega lista de contratos por CPF e seleciona o primeiro ATIVO (fallback: primeiro)
  useEffect(() => {
    const cpfSan = onlyDigits(cpf)
    if (!cpfSan) { setErro('CPF não informado'); setLoadingLista(false); return }

    const myId = ++listReqId.current
    setLoadingLista(true)
    setErro(null)
    setContratos([]); setContrato(null); setSelectedId(null)
    setDependentes([]); setPagamentos([])

    async function run() {
      try {
        const resp = await api.get(`/api/v1/contratos/cpf/${encodeURIComponent(cpfSan)}`)
        if (listReqId.current !== myId) return

        const arr = normalizeToArray(resp)
        setContratos(arr)

        if (arr.length > 0) {
          const preferred = arr.find(isAtivo) || arr[0]
          setSelectedId(toKey(getId(preferred)))
        }
      } catch (e) {
        if (listReqId.current === myId) setErro(niceError(e))
      } finally {
        if (listReqId.current === myId) setLoadingLista(false)
      }
    }
    run()
  }, [cpf])

  // 2) Ao trocar seleção, busca dependentes + pagamentos (somente esse endpoint)
  useEffect(() => {
    const sel = contratos.find(c => toKey(getId(c)) === toKey(selectedId)) || null
    setContrato(sel)
    setDependentes([]); setPagamentos([])

    // limpamos erro antigo ao trocar de contrato
    setErro(null)

    if (!sel) { setLoadingDetalhes(false); return }

    const myId = ++detailReqId.current
    setLoadingDetalhes(true)

    async function loadDetails() {
      try {
        const cid = getId(sel); if (!cid) return
        const [dep, pags] = await Promise.allSettled([
          api.get(`/api/v1/contratos/${cid}/dependentes`),
          api.get(`/api/v1/contratos/${cid}/pagamentos`),
        ])
        if (detailReqId.current !== myId) return

        const arrDep = dep.status === 'fulfilled' ? normalizeToArray(dep.value) : []
        const arrPag = pags.status === 'fulfilled' ? normalizeToArray(pags.value) : []

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

  // 3) Derivados para a UI (apenas a partir de /pagamentos)
  const abertasOrdenadas = useMemo(() =>
    [...(pagamentos || [])]
      .filter(p => isAberta(p))
      .sort((a, b) => asDate(a.dataVencimento) - asDate(b.dataVencimento))
  , [pagamentos])

  const proximaParcela = useMemo(
    () => abertasOrdenadas[0] || null,
    [abertasOrdenadas]
  )

  const proximas = useMemo(
    () => (abertasOrdenadas.length > 1 ? abertasOrdenadas.slice(1) : []),
    [abertasOrdenadas]
  )

  const historico = useMemo(() =>
    (pagamentos || [])
      .filter(p => !isAberta(p))
      .sort((a, b) => {
        const da = asDate(p.dataRecebimento || p.dataVencimento)
        const db = asDate(b.dataRecebimento || b.dataVencimento)
        return db - da
      })
  , [pagamentos])

  // helper para a UI
  const isAtraso = (p) => isAberta(p) && asDate(p?.dataVencimento) < hoje

  const chooseContrato = useCallback((id) => {
    setSelectedId(toKey(id))
  }, [])

  return {
    contratos, contrato, selectedId, chooseContrato,
    dependentes, pagamentos,
    proximaParcela, proximas, historico, isAtraso,
    loading, erro
  }
}
