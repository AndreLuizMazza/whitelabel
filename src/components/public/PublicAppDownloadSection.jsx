import { useMemo } from 'react'
import { Apple, ArrowRight, Smartphone, X } from 'lucide-react'

import CTAButton from '@/components/ui/CTAButton'
import useAppInstall from '@/hooks/useAppInstall'
import useAuth from '@/store/auth'
import { resolveContractAssetUrl } from '@/lib/branding/tenantContract'
import { getHomeAppStoreLinks, getTenantContract } from '@/lib/tenantContent'

function resolveStoreLinks() {
  const contract = getTenantContract()
  const fromJson = getHomeAppStoreLinks(contract)
  const android =
    fromJson.android ||
    String(import.meta.env.VITE_ANDROID_URL || '').trim().replace(/^#+$/, '')
  const ios =
    fromJson.ios || String(import.meta.env.VITE_IOS_URL || '').trim().replace(/^#+$/, '')
  return {
    android: android && android !== '#' ? android : '',
    ios: ios && ios !== '#' ? ios : '',
    previewImage: fromJson.previewImage,
    contract,
  }
}

function IosInstallModal({ open, onClose, appName }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[2100] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        className="relative w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl"
        style={{ background: 'var(--surface)', borderColor: 'var(--c-border)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 hover:bg-black/5"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 id="ios-install-title" className="text-lg font-bold pr-8">
          Instalar {appName}
        </h3>
        <ol className="mt-4 space-y-3 text-sm text-[var(--text-muted)] list-decimal list-inside">
          <li>
            Toque em <strong className="text-[var(--text)]">Compartilhar</strong> na barra do Safari.
          </li>
          <li>
            Selecione <strong className="text-[var(--text)]">Adicionar à Tela de Início</strong>.
          </li>
          <li>
            Confirme em <strong className="text-[var(--text)]">Adicionar</strong>.
          </li>
        </ol>
        <CTAButton type="button" className="mt-5 w-full" onClick={onClose}>
          Entendi
        </CTAButton>
      </div>
    </div>
  )
}

export default function PublicAppDownloadSection({ mounted = true, appName = 'App do Associado' }) {
  const isLogged = useAuth((s) => s.isLoggedIn())
  const { android, ios, previewImage, contract } = useMemo(() => resolveStoreLinks(), [])
  const { isInstalled, showIosHelp, promptInstall, closeIosHelp } = useAppInstall()

  const hasStoreLinks = Boolean(android || ios)
  const previewUrl = previewImage ? resolveContractAssetUrl(contract, previewImage) : ''

  async function handleInstallClick() {
    if (isInstalled) return
    await promptInstall()
  }

  const openAppTo = isLogged ? '/area' : '/login'

  return (
    <section className="home-app-strip" aria-labelledby="home-app-heading">
      <div
        className={[
          'home-app-strip__row transition-all duration-700',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="h-9 w-9 shrink-0 grid place-items-center rounded-lg"
            style={{
              background: 'color-mix(in srgb, var(--primary) 10%, var(--surface))',
              color: 'var(--primary)',
            }}
          >
            <Smartphone className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="public-kicker text-[10px]">Para associados</p>
            <h2 id="home-app-heading" className="text-sm md:text-base font-semibold tracking-tight mt-0.5">
              Baixe nosso aplicativo
            </h2>
            <p className="mt-0.5 text-[11px] md:text-xs text-[var(--text-muted)] leading-snug hidden sm:block">
              Carteirinha, boletos e benefícios na palma da mão.
            </p>
          </div>
        </div>

        <div className="home-app-strip__actions shrink-0">
          {isInstalled ? (
            <CTAButton
              as="link"
              to={openAppTo}
              size="sm"
              variant="outline"
              className="justify-center"
              iconAfter={<ArrowRight size={14} />}
            >
              Abrir app
            </CTAButton>
          ) : hasStoreLinks ? (
            <>
              {android ? (
                <CTAButton
                  as="a"
                  href={android}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="sm"
                  className="justify-center min-w-[108px]"
                  iconBefore={<Smartphone size={14} />}
                >
                  Google Play
                </CTAButton>
              ) : null}
              {ios ? (
                <CTAButton
                  as="a"
                  href={ios}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="sm"
                  className="justify-center min-w-[108px]"
                  iconBefore={<Apple size={14} />}
                >
                  App Store
                </CTAButton>
              ) : null}
            </>
          ) : (
            <CTAButton
              type="button"
              size="sm"
              variant="outline"
              className="justify-center"
              onClick={() => void handleInstallClick()}
              iconBefore={<Smartphone size={14} />}
            >
              Baixar o app
            </CTAButton>
          )}
        </div>
      </div>

      {previewUrl ? (
        <div className="hidden lg:flex justify-end mt-3 pt-3 border-t border-[var(--c-border)]">
          <img
            src={previewUrl}
            alt={`Prévia do ${appName}`}
            className="max-h-[120px] w-auto rounded-lg border object-contain"
            style={{ borderColor: 'var(--c-border)' }}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      <IosInstallModal open={showIosHelp} onClose={closeIosHelp} appName={appName} />
    </section>
  )
}
