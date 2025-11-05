// src/components/faq/FaqSection.jsx
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import CTAButton from "@/components/ui/CTAButton"
import FaqItem from "./FaqItem.jsx"
import { Smartphone, Apple } from "lucide-react"

export default function FaqSection({ isLogged, areaDest }) {
  const ANDROID_URL = import.meta.env.VITE_ANDROID_URL || "#"
  const IOS_URL = import.meta.env.VITE_IOS_URL || "#"

  // Base de perguntas (edite à vontade)
  const FAQ = useMemo(() => ([
    {
      id: "acesso-area",
      q: "Como acessar a Área do Associado?",
      a: (
        <p className="text-sm">
          Clique em <Link to={areaDest} className="underline">“Abrir área”</Link>.
          Se não tiver sessão ativa, você será direcionado para o login.
        </p>
      ),
      tags: ["login", "área", "acesso", "contratos"]
    },
    {
      id: "esqueci-senha",
      q: "Esqueci minha senha. O que fazer?",
      a: (
        <p className="text-sm">
          Acesse <Link to="/recuperar-senha" className="underline">Recuperar senha</Link> e siga as instruções enviadas ao seu e-mail/WhatsApp cadastrado.
        </p>
      ),
      tags: ["senha", "recuperar", "login"]
    },
    {
      id: "segunda-via",
      q: "Consigo emitir 2ª via e pagar por PIX?",
      a: (
        <p className="text-sm">
          Sim. Entre em <Link to="/contratos" className="underline">2ª via</Link>, informe os dados solicitados e gere o boleto/PIX.
        </p>
      ),
      tags: ["boleto", "pix", "pagamento", "contrato"]
    },
    {
      id: "app-mobile",
      q: "Tem app para celular? Como ativar?",
      a: (
        <div className="text-sm">
          <p>Instale o app na loja do seu aparelho e entre com os mesmos dados do site.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium hover:opacity-90"
              href={ANDROID_URL}
              target="_blank" rel="noopener noreferrer"
            >
              <Smartphone size={14}/> Android
            </a>
            <a
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium hover:opacity-90"
              href={IOS_URL}
              target="_blank" rel="noopener noreferrer"
            >
              <Apple size={14}/> iOS
            </a>
          </div>
        </div>
      ),
      tags: ["app", "android", "ios", "mobile"]
    },
    {
      id: "dependentes",
      q: "Como incluir ou remover dependentes?",
      a: (
        <p className="text-sm">
          Acesse a <Link to={isLogged ? "/area" : "/login"} className="underline">Área do Associado</Link> e vá em <strong>Contratos &gt; Dependentes</strong>. Se precisar, nosso time pode orientar pelo atendimento.
        </p>
      ),
      tags: ["dependentes", "contrato", "cadastro"]
    },
    {
      id: "dados-cadastrais",
      q: "Posso atualizar meus dados cadastrais?",
      a: (
        <p className="text-sm">
          Sim. Na <Link to={isLogged ? "/area" : "/login"} className="underline">Área do Associado</Link> você consegue editar e salvar suas informações.
        </p>
      ),
      tags: ["dados", "cadastro", "endereço", "telefone"]
    },
    {
      id: "cancelamento",
      q: "Como solicitar cancelamento?",
      a: (
        <p className="text-sm">
          Abra um pedido em <Link to="/atendimento" className="underline">Atendimento</Link> ou fale com o suporte. Sem fidelidade; seguimos as regras contratuais de encerramento.
        </p>
      ),
      tags: ["cancelamento", "plano", "contrato"]
    },
  ]), [ANDROID_URL, IOS_URL, areaDest, isLogged])

  const [query, setQuery] = useState("")
  const items = useMemo(() => {
    if (!query.trim()) return FAQ
    const q = query.toLowerCase()
    return FAQ.filter(it =>
      it.q.toLowerCase().includes(q) ||
      it.tags?.some(t => t.toLowerCase().includes(q))
    )
  }, [FAQ, query])

  return (
    <section className="mt-12 md:mt-16 card p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h3 className="text-xl font-extrabold">Dúvidas frequentes</h3>
        <label className="w-full md:w-80">
          <span className="block text-xs font-medium mb-1 text-[var(--text)] dark:text-[var(--text)]">Buscar no FAQ</span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ex.: 2ª via, senha, app…"
            className="w-full rounded-lg border px-3 py-2 text-sm bg-[var(--surface)] border-[var(--c-border)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_40%,black)]"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3">
        {items.map((item, i) => (
          <FaqItem
            key={item.id || i}
            id={item.id}
            q={item.q}
            a={item.a}
            defaultOpen={i === 0 && !query}  // abre a 1ª por padrão quando sem busca
          />
        ))}

        {!items.length && (
          <div className="rounded-xl border border-[var(--c-border)] bg-[var(--surface)]/70 p-4 text-sm">
            Nada encontrado para <strong>“{query}”</strong>. Tente outra palavra.
          </div>
        )}
      </div>

      {/* CTAs de rodapé do FAQ (padronizados) */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <CTAButton as="link" to="/beneficios" variant="outline">Ver parceiros</CTAButton>
        <CTAButton as="link" to={isLogged ? "/area" : "/login"}>Abrir área</CTAButton>
      </div>

      {/* Schema.org FAQPage para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQ.map(f => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": typeof f.a === "string" ? f.a : undefined
              }
            }))
          })
        }}
      />
    </section>
  )
}
