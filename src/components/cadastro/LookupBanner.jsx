import { Info, Loader2 } from "lucide-react";
import CTAButton from "@/components/ui/CTAButton";

export default function LookupBanner({ lookupState, onGoArea }){
  if(!(lookupState.running || lookupState.mensagem || lookupState.erro)) return null;

  return (
    <div className="mb-4 rounded-xl border p-4"
         style={{ background:'color-mix(in srgb, var(--primary) 10%, transparent)', borderColor:'color-mix(in srgb, var(--primary) 35%, transparent)' }}
         role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="rounded-full p-2 text-white" style={{background:'color-mix(in srgb, var(--primary) 90%, black)'}}>
          {lookupState.running ? <Loader2 className="animate-spin" size={16}/> : <Info size={16}/>}
        </div>
        <div className="flex-1">
          {lookupState.running && <p className="text-sm">Verificando CPF e contratos…</p>}
          {!lookupState.running && lookupState.mensagem && <p className="text-sm font-medium">{lookupState.mensagem}</p>}
          {!lookupState.running && lookupState.erro && <p className="text-sm text-red-700">Falha na verificação automática: {lookupState.erro}</p>}
          {!lookupState.running && lookupState.temContratoAtivo && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CTAButton onClick={onGoArea} className="h-10">Ir para a Área do Associado</CTAButton>
              <span className="text-xs text-[var(--c-muted)]">Você também pode seguir com o cadastro abaixo.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
