import {
  CheckCircle2,
  Handshake,
  Store,
  Truck,
  Megaphone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import CTAButton from "@/components/ui/CTAButton";

export default function ParceirosCTA({ onBecomePartner, whatsappHref = "#" }) {
  return (
    <section id="parceiros" className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Texto principal */}
          <div className="space-y-8 md:space-y-10">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium shadow-sm ring-1 ring-black/5 dark:ring-white/10"
              style={{ backgroundColor: "var(--primary-20)", color: "var(--primary-dark)" }}
            >
              <Sparkles className="h-4 w-4" /> Benefícios exclusivos para quem se conecta
            </div>

            <h2
              className="text-4xl sm:text-5xl font-extrabold tracking-tight"
              style={{ color: "var(--primary-dark)" }}
            >
              Seja nosso parceiro premium
            </h2>

            <p className="text-lg text-[var(--text)] dark:text-[var(--text)] max-w-prose">
              Ofereça <strong>condições especiais</strong> aos associados e receba{" "}
              <em>indicações qualificadas</em>, <em>visibilidade</em> e <em>novos clientes</em>.
              Parceria transparente e focada em resultado.
            </p>

            {/* Benefícios */}
            <ul className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Store, text: "Divulgação para base ativa" },
                { icon: Megaphone, text: "Indicações e campanhas exclusivas" },
                { icon: ShieldCheck, text: "Sem custo fixo, paga quem vende" },
                { icon: Truck, text: "Fluxo constante de novos clientes" },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 rounded-xl bg-[var(--surface)]/80 dark:bg-[var(--surface)]/40 shadow-sm p-3 border"
                  style={{ borderColor: "color-mix(in srgb, var(--primary) 24%, transparent)" }}
                >
                  <Icon className="h-5 w-5" style={{ color: "var(--primary)" }} />
                  <span className="text-sm sm:text-base">{text}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-3">
              <CTAButton onClick={onBecomePartner} iconAfter={<ArrowRight size={16} />} size="lg">
                Quero ser parceiro(a)
              </CTAButton>

              <CTAButton
                as="a"
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="lg"
                iconBefore={<MessageSquare size={16} />}
                className="sm:ml-1"
              >
                Falar com o time
              </CTAButton>
            </div>

            {/* Tags */}
            <div className="pt-4">
              <p className="text-xs uppercase tracking-wide text-[var(--text)] dark:text-[var(--text)]">
                Segmentos que buscamos
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "Farmácias",
                  "Clínicas",
                  "Óticas",
                  "Mercados",
                  "Academias",
                  "Transporte",
                  "Serviços Domésticos",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs rounded-full px-3 py-1"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)",
                      color: "var(--primary-dark)",
                      border: "1px solid var(--primary-33)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card lateral */}
          <aside className="order-first lg:order-last">
            <div
              className="relative rounded-3xl border bg-[var(--surface)]/80 dark:bg-[var(--surface)]/50 p-8 shadow-xl"
              style={{ borderColor: "color-mix(in srgb, var(--primary) 22%, transparent)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-2xl grid place-items-center"
                  style={{ backgroundColor: "var(--primary-20)", color: "var(--primary-dark)" }}
                >
                  <Handshake className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-semibold">Rede de Benefícios Premium</p>
                  <p className="text-xs text-[var(--text)] dark:text-[var(--text)]">
                    Empresas selecionadas e verificadas
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Exposição em campanhas digitais",
                  "Destaque no Clube de Benefícios",
                  "Eventos e ativações exclusivas",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-xl border p-3 bg-[var(--surface)]/80 dark:bg-[var(--surface)]/40"
                    style={{ borderColor: "color-mix(in srgb, var(--primary) 22%, transparent)" }}
                  >
                    <CheckCircle2 className="h-5 w-5" style={{ color: "var(--primary)" }} />
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>

              <div
                className="mt-6 rounded-2xl border border-dashed p-4 text-sm"
                style={{ borderColor: "var(--primary-66)" }}
              >
                <p className="font-semibold">Critérios para participação</p>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-[var(--text)] dark:text-[var(--text)]">
                  <li>Possuir CNPJ ativo</li>
                  <li>Oferecer desconto real aos associados</li>
                  <li>Manter qualidade de atendimento</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
