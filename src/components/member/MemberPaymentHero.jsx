import { fmtBRL, fmtData, isAtrasoPorData, venceHojePorData } from '@/lib/paymentUtils'

export default function MemberPaymentHero({
  parcela,
  isAtraso,
  contratoAtivo = true,
  totalEmAtraso = 0,
  mostrarValores = true,
  numeroContrato = null,
}) {
  const temParcela = Boolean(parcela)
  const atraso = temParcela && isAtraso?.(parcela) && isAtrasoPorData(parcela)
  const venceHoje = temParcela && !atraso && venceHojePorData(parcela)

  let badge = 'Em dia'
  let titulo = 'Próxima mensalidade'
  let subtitulo = 'Escolha PIX ou boleto para pagar com segurança.'

  if (!temParcela && totalEmAtraso > 0) {
    badge = 'Em atraso'
    titulo = 'Parcelas em atraso'
    subtitulo = 'Regularize abaixo para manter seus benefícios ativos.'
  } else if (!temParcela && contratoAtivo) {
    badge = 'Em dia'
    titulo = 'Tudo certo por aqui'
    subtitulo = 'Nenhuma cobrança em aberto no momento.'
  } else if (!temParcela) {
    badge = 'Aguardando'
    titulo = 'Cobranças em breve'
    subtitulo = 'Suas mensalidades aparecerão aqui após a ativação.'
  } else if (atraso) {
    badge = 'Em atraso'
    titulo = 'Mensalidade em atraso'
    subtitulo = 'Pague agora para evitar novos encargos.'
  } else if (venceHoje) {
    badge = 'Vence hoje'
    titulo = 'Vence hoje'
    subtitulo = 'Pagando hoje, você mantém o plano em dia.'
  }

  const valor = temParcela ? fmtBRL(parcela.valorParcela) : null
  const vencimento = temParcela ? fmtData(parcela.dataVencimento) : null

  return (
    <div
      className="relative overflow-hidden rounded-[22px] p-5 mb-5"
      style={{
        background:
          'linear-gradient(145deg, color-mix(in srgb, var(--primary) 92%, #000) 0%, var(--primary) 48%, color-mix(in srgb, var(--primary) 75%, #000) 100%)',
        color: 'var(--on-primary, #fff)',
        boxShadow: '0 8px 32px color-mix(in srgb, var(--primary) 35%, transparent)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(255,255,255,0.22) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(0,0,0,0.15) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-[1]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/75">
              Pagamentos
            </p>
            <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-tight">{titulo}</h1>
            <p className="mt-1.5 text-[14px] leading-snug text-white/82 max-w-md">{subtitulo}</p>
          </div>
          <span
            className="shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '0.5px solid rgba(255,255,255,0.28)',
            }}
          >
            {badge}
          </span>
        </div>

        {temParcela && mostrarValores ? (
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium text-white/70 uppercase tracking-wide">
                Valor
              </p>
              <p className="mt-0.5 text-[34px] font-bold tabular-nums leading-none tracking-tight">
                {valor}
              </p>
              {vencimento ? (
                <p className="mt-2 text-[13px] text-white/80">
                  {atraso ? 'Venceu em' : venceHoje ? 'Vencimento' : 'Vence em'}{' '}
                  <span className="font-semibold text-white">{vencimento}</span>
                </p>
              ) : null}
            </div>
            {numeroContrato ? (
              <span className="text-[11px] font-medium text-white/65 tabular-nums pb-1">
                #{numeroContrato}
              </span>
            ) : null}
          </div>
        ) : null}

        {temParcela && !mostrarValores ? (
          <p className="mt-5 text-[28px] font-bold leading-none">••••••</p>
        ) : null}

        {!temParcela && totalEmAtraso > 0 && mostrarValores ? (
          <div className="mt-5">
            <p className="text-[12px] font-medium text-white/70 uppercase tracking-wide">
              Total em atraso
            </p>
            <p className="mt-0.5 text-[28px] font-bold tabular-nums">{fmtBRL(totalEmAtraso)}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
