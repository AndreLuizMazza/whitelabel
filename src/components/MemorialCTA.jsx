import { ArrowRight, Flower2, Heart, Sparkles, Landmark } from "lucide-react";
import CTAButton from "@/components/ui/CTAButton";

export default function MemorialCTA({ onVisitMemorial }) {
  return (
    <section id="memorial-cta" className="py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          style={{ backgroundColor: "var(--primary-20)", color: "var(--primary-dark)" }}
        >
          <Sparkles className="h-4 w-4" /> Homenagens e lembranças
        </div>

        {/* Título */}
        <h2
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          style={{ color: "var(--primary-dark)" }}
        >
          Visite nosso Memorial Online
        </h2>

        {/* Descrição */}
        <p className="max-w-2xl mx-auto text-lg text-[var(--text)] dark:text-[var(--text)]">
          Um espaço para <strong>homenagens</strong>, <em>lembranças</em> e <em>celebração da vida</em>.{" "}
          Encontre informações das cerimônias, acenda uma vela virtual e deixe sua mensagem de carinho.
        </p>

        {/* Benefícios rápidos */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3 text-left max-w-3xl mx-auto">
          {[
            { icon: Flower2, text: "Flores e velas virtuais" },
            { icon: Heart, text: "Mensagens de apoio e lembranças" },
            { icon: Landmark, text: "Informações de velórios e sepultamentos" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 rounded-xl bg-[var(--surface)]/80 dark:bg-[var(--surface)]/40 p-3 border shadow-sm"
              style={{ borderColor: "color-mix(in srgb, var(--primary) 24%, transparent)" }}
            >
              <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>

        {/* CTA principal */}
        <div className="pt-6">
          <CTAButton onClick={onVisitMemorial} iconAfter={<ArrowRight size={16} />} size="lg">
            Acessar o Memorial
          </CTAButton>
        </div>

        {/* Cartão visual simples */}
        <div className="pt-6">
          <div
            className="mx-auto max-w-xl rounded-3xl border bg-[var(--surface)]/80 dark:bg-[var(--surface)]/50 p-8 shadow-sm"
            style={{ borderColor: "color-mix(in srgb, var(--primary) 22%, transparent)" }}
          >
            <div className="flex items-center gap-2 justify-center text-[var(--text)] dark:text-[var(--text)]">
              <Landmark className="h-6 w-6" style={{ color: "var(--primary)" }} />
              <h3 className="text-base font-semibold">Homenagens eternas</h3>
            </div>
            <p className="mt-1 text-sm text-[var(--text)] dark:text-[var(--text)]">
              Preservando memórias e fortalecendo laços
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
