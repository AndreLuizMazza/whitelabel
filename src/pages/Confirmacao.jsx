// src/pages/Confirmacao.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api.js";
import CTAButton from "@/components/ui/CTAButton";
import { money } from "@/lib/planUtils.js";
import { CheckCircle2, ChevronLeft, Clipboard, ClipboardCheck, MessageCircle, Users, Receipt } from "lucide-react";

/* =============== utils =============== */
function useQuery(){ const {search}=useLocation(); return useMemo(()=>new URLSearchParams(search),[search]); }
const onlyDigits=(v="")=>String(v).replace(/\D+/g,"");
function openWhatsApp(number,message){
  const n=number?onlyDigits(number):"";
  const text=encodeURIComponent(message||"");
  const url=n?`https://wa.me/${n}?text=${text}`:`https://wa.me/?text=${text}`;
  window.open(url,"_blank","noopener");
}

export default function Confirmacao(){
  const q=useQuery(); const navigate=useNavigate();
  const contratoId = q.get("contrato") || "";
  const titularId = q.get("titular") || "";

  const [copied, setCopied] = useState(false);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [deps, setDeps] = useState([]);
  const [depsError, setDepsError] = useState("");

  const [loadingMes, setLoadingMes] = useState(false);
  const [pagMes, setPagMes] = useState(null);
  const [pagMesError, setPagMesError] = useState("");

  const onceRef = useRef(false);

  const whatsNumber = (import.meta?.env?.VITE_WHATSAPP || window.__WHATSAPP__) || "";

  useEffect(()=>{
    if(onceRef.current) return;
    onceRef.current = true;
    // opcional: já tenta buscar pagamento do mês ao abrir
    if(contratoId) fetchPagamentoMes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratoId]);

  async function fetchDependentes(){
    if(!contratoId) return;
    setLoadingDeps(true); setDepsError("");
    try{
      const { data } = await api.get(`/api/v1/contratos/${encodeURIComponent(contratoId)}/dependentes`);
      setDeps(Array.isArray(data)?data:(data?.items||[]));
    }catch(e){
      console.error(e);
      setDepsError("Não foi possível carregar os dependentes.");
    }finally{
      setLoadingDeps(false);
    }
  }

  async function fetchPagamentoMes(){
    if(!contratoId) return;
    setLoadingMes(true); setPagMesError("");
    try{
      const { data } = await api.get(`/api/v1/contratos/${encodeURIComponent(contratoId)}/pagamentos/mes`);
      setPagMes(data || null);
    }catch(e){
      console.error(e);
      setPagMesError("Não foi possível carregar o pagamento do mês.");
    }finally{
      setLoadingMes(false);
    }
  }

  function copyContrato(){
    if(!contratoId) return;
    navigator.clipboard?.writeText(String(contratoId)).then(()=>{
      setCopied(true);
      setTimeout(()=>setCopied(false), 1800);
    }).catch(()=>{});
  }

  function sendWhatsResumo(){
    const L=[];
    L.push("*Cadastro concluído!*");
    if(contratoId) L.push(`Contrato: ${contratoId}`);
    if(titularId) L.push(`Titular ID: ${titularId}`);
    if(pagMes?.valor) L.push(`Valor do mês: ${money(Number(pagMes.valor)||0)}`);
    if(pagMes?.vencimento) L.push(`Vencimento: ${new Date(pagMes.vencimento).toLocaleDateString()}`);
    if(Array.isArray(deps) && deps.length){
      L.push("\n*Dependentes*:");
      deps.forEach((d,i)=>{
        const nome = d?.nome || d?.nomeCompleto || "(Sem nome)";
        const parentesco = d?.parentesco || d?.relacao || "";
        L.push(`${i+1}. ${nome}${parentesco?` — ${parentesco}`:""}`);
      });
    }
    openWhatsApp(whatsNumber, L.join("\n"));
  }

  if(!contratoId){
    return (
      <section className="section">
        <div className="container-max">
          <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
            <h1 className="text-xl font-bold">Confirmação</h1>
            <p className="mt-2 text-[var(--c-muted)]">Não encontramos o identificador do contrato.</p>
            <div className="mt-4">
              <CTAButton onClick={()=>navigate(-1)}><ChevronLeft size={16} className="mr-2"/> Voltar</CTAButton>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container-max">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--c-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--c-surface)]"
            aria-label="Voltar para a página inicial"
          >
            <ChevronLeft size={16}/> Início
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card principal */}
          <div className="md:col-span-2 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-green-600 mt-1" size={22}/>
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold tracking-tight">Cadastro concluído 🎉</h1>
                <p className="mt-1 text-[var(--c-muted)]">
                  Seu pedido foi registrado com sucesso. Em breve você receberá instruções por e-mail/WhatsApp.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between rounded-xl border border-[var(--c-border)] p-3">
                <div>
                  <p className="text-xs text-[var(--c-muted)]">Contrato</p>
                  <p className="font-semibold">{contratoId}</p>
                  {titularId ? (
                    <p className="text-xs text-[var(--c-muted)]">Titular: <span className="font-medium">{titularId}</span></p>
                  ) : null}
                </div>
                <CTAButton variant="ghost" onClick={copyContrato} className="h-10">
                  {copied ? <ClipboardCheck size={16} className="mr-2"/> : <Clipboard size={16} className="mr-2"/>}
                  {copied ? "Copiado" : "Copiar ID"}
                </CTAButton>
              </div>

              <div className="rounded-xl border border-[var(--c-border)] p-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Receipt size={16}/> Pagamento do mês
                </p>
                <div className="mt-2">
                  {loadingMes ? (
                    <div className="h-12 w-full animate-pulse rounded-lg bg-[var(--c-surface-2)]" />
                  ) : pagMesError ? (
                    <p className="text-red-600 text-sm">{pagMesError}</p>
                  ) : pagMes ? (
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="flex gap-2"><span className="text-[var(--c-muted)]">Situação:</span><span className="font-medium">{pagMes.status || pagMes.situacao || "—"}</span></div>
                        <div className="flex gap-2"><span className="text-[var(--c-muted)]">Vencimento:</span><span className="font-medium">
                          {pagMes.vencimento ? new Date(pagMes.vencimento).toLocaleDateString() : "—"}
                        </span></div>
                        <div className="flex gap-2"><span className="text-[var(--c-muted)]">Valor:</span><span className="font-semibold">{money(Number(pagMes.valor)||0)}</span></div>
                      </div>
                      {pagMes?.boletoUrl ? (
                        <a
                          href={pagMes.boletoUrl}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-[var(--c-surface)]"
                        >
                          Abrir boleto
                        </a>
                      ) : (
                        <CTAButton variant="outline" onClick={fetchPagamentoMes} className="h-10">Atualizar</CTAButton>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--c-muted)]">Ainda não há dados para o mês atual.</p>
                      <CTAButton variant="outline" onClick={fetchPagamentoMes} className="h-10">Buscar</CTAButton>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[var(--c-border)] p-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Users size={16}/> Dependentes
                </p>
                <div className="mt-2">
                  {loadingDeps ? (
                    <div className="space-y-2">
                      <div className="h-10 w-full animate-pulse rounded bg-[var(--c-surface-2)]"/>
                      <div className="h-10 w-full animate-pulse rounded bg-[var(--c-surface-2)]"/>
                    </div>
                  ) : depsError ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-red-600">{depsError}</p>
                      <CTAButton variant="outline" onClick={fetchDependentes} className="h-10">Tentar novamente</CTAButton>
                    </div>
                  ) : Array.isArray(deps) && deps.length ? (
                    <ul className="divide-y divide-[var(--c-border-soft)]">
                      {deps.map((d,idx)=>{
                        const nome = d?.nome || d?.nomeCompleto || "(Sem nome)";
                        const parentesco = d?.parentesco || d?.relacao || "";
                        return (
                          <li key={idx} className="py-2 flex items-center justify-between">
                            <div className="text-sm">
                              <p className="font-medium">{nome}</p>
                              <p className="text-[var(--c-muted)] text-xs">{parentesco || "Dependente"}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[var(--c-muted)]">Nenhum dependente cadastrado.</p>
                      <CTAButton variant="outline" onClick={fetchDependentes} className="h-10">Carregar</CTAButton>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <CTAButton onClick={sendWhatsResumo} className="h-12 w-full" title="Enviar resumo por WhatsApp">
                <MessageCircle size={16} className="mr-2"/> Enviar por WhatsApp
              </CTAButton>
              <CTAButton variant="outline" onClick={()=>navigate("/")} className="h-12 w-full">
                Voltar ao início
              </CTAButton>
            </div>
          </div>

          {/* Sidebar com dicas / próximos passos */}
          <aside className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-6">
            <h3 className="text-lg font-semibold">Próximos passos</h3>
            <ul className="mt-3 list-disc pl-5 text-sm space-y-2">
              <li>Guarde o número do seu contrato para atendimento e consultas.</li>
              <li>Se necessário, envie documentos complementares ao time comercial.</li>
              <li>Acompanhe o pagamento do mês nesta tela ou pelo WhatsApp.</li>
            </ul>

            <div className="mt-5 rounded-xl border border-[var(--c-border)] p-3">
              <p className="text-sm font-semibold">Precisa de ajuda?</p>
              <p className="text-sm text-[var(--c-muted)] mt-1">
                Fale com nossa equipe pelo WhatsApp. Estamos por aqui para resolver rapidinho. 🙂
              </p>
              <CTAButton onClick={sendWhatsResumo} className="mt-3 w-full h-11">
                <MessageCircle size={16} className="mr-2"/> Abrir WhatsApp
              </CTAButton>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
