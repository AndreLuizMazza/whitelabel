import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import CTAButton from "@/components/ui/CTAButton";

export default function PlanosCTA({ onSeePlans }) {
  return (
    <section id="planos-cta" className="py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          style={{ backgroundColor: "var(--primary-20)", color: "var(--primary-dark)" }}
        >
          <Sparkles className="h-4 w-4" /> Planos exclusivos para você
        </div>

        {/* Título */}
        <h2
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{ color: "var(--primary-dark)" }}
        >
          Conheça os planos da nossa empresa
        </h2>

        {/* Descrição */}
        <p className="max-w-2xl mx-auto text-lg text-[var(--text)] dark:text-[var(--text)]">
          Soluções completas em <strong>assistência</strong> e <strong>benefícios</strong>. Escolha o plano
          ideal e tenha tranquilidade em todos os momentos.
        </p>

        {/* Benefícios rápidos */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3 text-left max-w-3xl mx-auto">
          {[
            "Cobertura para toda a família",
            "Clube de Benefícios incluso",
            "Adesão simples e rápida",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-xl bg-[var(--surface)]/80 dark:bg-[var(--surface)]/40 p-3 border shadow-sm"
              style={{ borderColor: "color-mix(in srgb, var(--primary) 24%, transparent)" }}
            >
              <CheckCircle2 className="h-5 w-5" style={{ color: "var(--primary)" }} />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>

        {/* CTA + reforço */}
        <div className="pt-6 space-y-2">
          <CTAButton onClick={onSeePlans} iconAfter={<ArrowRight size={16} />} size="lg">
            Ver planos agora
          </CTAButton>
          <p className="text-xs text-[var(--text)] dark:text-[var(--text)]">
            Sem fidelidade • Cancelamento a qualquer momento • Suporte humano
          </p>
        </div>
      </div>
    </section>
  );
}
