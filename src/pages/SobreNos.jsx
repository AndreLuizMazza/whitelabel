import { useEffect, useRef, useState } from "react";
import {
  Award,
  Building2,
  Clock,
  HandCoins,
  Heart,
  Leaf,
  Scale,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import useTenant from "@/store/tenant";
import { setPageSEO, bootstrapTenantSeoDefaults } from "@/lib/seo";
import {
  getTenantContract,
  normalizeAboutPage,
} from "@/lib/tenantContent";

const ABOUT_VALUE_ICONS = [Heart, Shield, Users, Scale, Sparkles, Star];
const ABOUT_DIFF_ICONS = [
  TrendingUp,
  Building2,
  Clock,
  Award,
  Leaf,
  HandCoins,
];

/** Subtle entrance: IntersectionObserver fade+translate. Respects prefers-reduced-motion. */
function useFadeIn() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function SectionTitle({ id, children }) {
  return (
    <div className="mb-12 md:mb-14">
      <h2
        id={id}
        className="text-lg font-semibold tracking-[-0.02em] text-[var(--text)] md:text-xl"
      >
        {children}
      </h2>
      <div
        className="mt-5 h-px w-full max-w-[4rem] bg-[color-mix(in_srgb,var(--c-border)_72%,var(--primary)_28%)]"
        aria-hidden
      />
    </div>
  );
}

function SectionBand({ bgClassName, children }) {
  const { ref, visible } = useFadeIn();
  return (
    <div className={`w-full ${bgClassName}`}>
      <div
        ref={ref}
        className={`container-max py-20 md:py-28 lg:py-32 transition-[opacity,transform] duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      >
        {children}
      </div>
    </div>
  );
}

function AboutListCard({ item, icon: Icon, altBg = false }) {
  return (
    <li
      className={`flex flex-col rounded-2xl border border-[var(--c-border)] p-6 shadow-[0_1px_2px_-1px_color-mix(in_srgb,var(--text)_5%,transparent)] md:p-8 ${altBg ? "bg-[var(--surface-alt)]" : "bg-[var(--surface)]"}`}
    >
      <div
        className="mb-4 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--primary)_15%,var(--surface)_85%)] text-[var(--primary)]"
        aria-hidden
      >
        <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.85} />
      </div>
      {item.title ? (
        <h3 className="text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--text)] md:text-[1rem]">
          {item.title}
        </h3>
      ) : null}
      <p
        className={`text-[0.9375rem] font-normal leading-[1.65] text-[var(--text-muted)] ${item.title ? "mt-3" : ""}`}
      >
        {item.text}
      </p>
    </li>
  );
}

function ListSection({ id, heading, items, tone = "values" }) {
  if (!items?.length) return null;

  const icons = tone === "differentials" ? ABOUT_DIFF_ICONS : ABOUT_VALUE_ICONS;
  const altBg = tone === "values";
  const cols =
    tone === "differentials"
      ? "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 lg:gap-7"
      : "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6 lg:grid-cols-3 lg:gap-7";

  return (
    <section
      id={id}
      className="scroll-mt-24 md:scroll-mt-28"
      aria-labelledby={`${id}-heading`}
    >
      <SectionTitle id={`${id}-heading`}>{heading}</SectionTitle>
      <ul className={cols}>
        {items.map((item, i) => (
          <AboutListCard
            key={i}
            item={item}
            icon={icons[i % icons.length]}
            altBg={altBg}
          />
        ))}
      </ul>
    </section>
  );
}

function ProsePillar({ label, body }) {
  if (!body) return null;
  return (
    <div className="flex h-full flex-col rounded-2xl border-l-[3px] border-l-[var(--primary)] bg-[var(--surface)] p-7 md:p-10">
      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
        {label}
      </p>
      <p className="mt-6 text-[1.125rem] font-normal leading-[1.72] tracking-[-0.015em] text-[var(--text)] text-pretty whitespace-pre-line md:mt-7 md:text-[1.25rem] md:leading-[1.68]">
        {body}
      </p>
    </div>
  );
}

function GallerySection({ items, pageTitle, sectionTitle }) {
  if (!items?.length) return null;
  const heading = sectionTitle?.trim() || "Galeria";
  const n = items.length;

  const layoutClass =
    n === 1
      ? "flex md:block"
      : n === 2
        ? "flex md:grid md:grid-cols-2"
        : "flex md:grid md:grid-cols-2 lg:grid-cols-3";

  return (
    <section
      className="scroll-mt-24 md:scroll-mt-28"
      aria-labelledby="about-gallery-heading"
    >
      <SectionTitle id="about-gallery-heading">{heading}</SectionTitle>
      <div
        className={`${layoutClass} snap-x snap-mandatory gap-6 overflow-x-auto pb-2 md:gap-8 md:overflow-visible md:snap-none lg:gap-10`}
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map((item, i) => (
          <figure
            key={`${item.src}-${i}`}
            className={`flex w-[min(88vw,400px)] shrink-0 snap-center flex-col md:w-auto ${
              n === 1 ? "md:mx-auto md:max-w-3xl" : ""
            }`}
          >
            <div className="overflow-hidden rounded-xl border border-[var(--c-border)] bg-[var(--surface)] shadow-[0_1px_2px_-1px_color-mix(in_srgb,var(--text)_5%,transparent)] lg:rounded-2xl">
              <img
                src={item.src}
                alt={item.caption || `${pageTitle} — imagem ${i + 1}`}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            {item.caption ? (
              <figcaption className="mt-3 min-h-[2.75rem] text-[0.6875rem] font-normal leading-[1.5] tracking-[0.04em] text-[var(--text-muted)] md:min-h-[3rem] md:text-[0.75rem] md:tracking-[0.03em]">
                {item.caption}
              </figcaption>
            ) : (
              <div className="mt-3 min-h-[2.75rem] md:min-h-[3rem]" aria-hidden />
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

export default function SobreNos() {
  const contract = getTenantContract();
  const page = normalizeAboutPage(contract);
  const brandName =
    contract?.brand?.shortName || contract?.shell?.title || "";

  useEffect(() => {
    if (!page) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    setPageSEO({
      title: page.pageTitleForSeo,
      description: page.metaDescription,
      image: page.ogImageUrl || undefined,
      url: url || undefined,
    });
    return () => {
      bootstrapTenantSeoDefaults(useTenant.getState().empresa);
    };
  }, [page]);

  if (!page) return null;

  return (
    <article className="bg-[var(--surface)] text-[var(--text)] antialiased [-webkit-font-smoothing:antialiased]">
      <header className="bg-[color-mix(in_srgb,var(--surface)_95%,var(--primary)_5%)]">
        <div className="container-max py-16 md:py-28 lg:py-36 lg:pb-28">
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:items-center lg:gap-20">
            <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-5">
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Institucional
              </p>
              <div
                className="mt-3 h-px w-8 bg-[color-mix(in_srgb,var(--primary)_30%,transparent)]"
                aria-hidden
              />
              <h1 className="mt-4 text-balance text-[1.75rem] font-bold leading-[1.1] tracking-[-0.04em] text-[var(--text)] sm:text-[2.125rem] sm:leading-[1.08] lg:text-[2.75rem] lg:leading-[1.04]">
                {page.title}
              </h1>
              {page.description ? (
                <div className="mt-8 max-w-[30rem] space-y-6 text-[1rem] font-normal leading-[1.72] text-[var(--text-muted)] text-pretty sm:mt-9 sm:text-[1.0625rem] lg:mt-10">
                  {page.description.split(/\n\n+/).map((para, i) => (
                    <p key={i}>{para.trim()}</p>
                  ))}
                </div>
              ) : null}
            </div>
            {page.photoUrl ? (
              <div className="order-1 lg:order-2 lg:col-span-7">
                <div className="overflow-hidden rounded-xl lg:rounded-2xl">
                  <img
                    src={page.photoUrl}
                    alt={page.title}
                    className="aspect-[3/2] w-full object-cover lg:min-h-[min(420px,52vh)]"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex flex-col">
        {(page.mission || page.vision || page.gallery?.length) ? (
          <SectionBand bgClassName="bg-[var(--surface-alt)]">
            {(page.mission || page.vision) ? (
              <section
                className={`grid gap-8 md:grid-cols-2 md:gap-x-12 md:gap-y-10 lg:gap-x-14 ${page.gallery?.length ? "mb-16 md:mb-20 lg:mb-24" : ""}`}
              >
                {page.mission ? (
                  <ProsePillar label="Missão" body={page.mission} />
                ) : null}
                {page.vision ? (
                  <ProsePillar label="Visão" body={page.vision} />
                ) : null}
              </section>
            ) : null}
            {page.gallery?.length ? (
              <GallerySection
                items={page.gallery}
                pageTitle={page.title}
                sectionTitle={page.galleryTitle}
              />
            ) : null}
          </SectionBand>
        ) : null}

        {page.values?.length ? (
          <SectionBand bgClassName="bg-[var(--surface)]">
            <ListSection
              id="valores"
              heading="Valores"
              items={page.values}
              tone="values"
            />
          </SectionBand>
        ) : null}

        {page.differentials?.length ? (
          <SectionBand bgClassName="bg-[color-mix(in_srgb,var(--surface-alt)_88%,var(--primary)_12%)]">
            <ListSection
              id="diferenciais"
              heading="Diferenciais"
              items={page.differentials}
              tone="differentials"
            />
          </SectionBand>
        ) : null}

        {page.closing ? (
          <SectionBand bgClassName="bg-[var(--surface)]">
            <section className="scroll-mt-24 md:scroll-mt-28">
              <div className="mx-auto max-w-[38rem] text-center">
                <div
                  className="mx-auto mb-10 h-px w-16 bg-[color-mix(in_srgb,var(--c-border)_60%,var(--primary)_40%)]"
                  aria-hidden
                />
                <p className="text-[1.125rem] font-normal leading-[1.65] tracking-[-0.018em] text-[var(--text)] text-pretty whitespace-pre-line md:text-[1.25rem] md:leading-[1.6] lg:text-[1.3125rem] lg:leading-[1.58]">
                  {page.closing}
                </p>
                {brandName ? (
                  <p className="mt-8 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    — {brandName}
                  </p>
                ) : null}
              </div>
            </section>
          </SectionBand>
        ) : null}
      </div>
    </article>
  );
}
