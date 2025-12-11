// src/lib/planPricing.js
import { ageFromDate } from "@/lib/dates";

/** Normaliza parentesco para bater com o backend/enum. */
function normalizeParentesco(p) {
  const v = String(p || "").trim().toUpperCase();

  if (v.startsWith("TITULAR")) return "TITULAR";
  if (v.startsWith("FILHO") || v.startsWith("FILHA")) return "FILHO";
  if (v === "PAI") return "PAI";
  if (v === "MÃE" || v === "MAE") return "MAE";
  if (v.startsWith("CONJUGE") || v.startsWith("CÔNJUGE")) return "CONJUGE";
  if (v.startsWith("COMPANHEIR")) return "COMPANHEIRO";
  if (v.startsWith("IRMAO") || v.startsWith("IRMÃO")) return "IRMAO";

  return v;
}

/**
 * Verifica isenção de pagamento (apenas da parte condicional), espelhando
 * CalculadoraMensalidade.verificaIsencao.
 */
function isIsento(plano, dep) {
  if (!plano?.isencoes || !Array.isArray(plano.isencoes)) return false;

  const parentescoDep = normalizeParentesco(dep.parentesco);

  const idade =
    Number.isFinite(dep.idade) && dep.idade >= 0
      ? dep.idade
      : dep.data_nascimento
      ? ageFromDate(dep.data_nascimento)
      : null;

  if (!Number.isFinite(idade) || idade < 0) return false;

  return plano.isencoes.some((isencao) => {
    if (!isencao) return false;

    const parIsencao = normalizeParentesco(isencao.parentesco);
    if (parIsencao !== parentescoDep) return false;

    const idadeMinRaw =
      isencao.idadeMinima ?? isencao.idade_minima ?? null;
    const idadeMaxRaw =
      isencao.idadeMaxima ?? isencao.idade_maxima ?? null;

    const idadeMin =
      idadeMinRaw != null && idadeMinRaw !== ""
        ? Number(idadeMinRaw)
        : null;
    const idadeMax =
      idadeMaxRaw != null && idadeMaxRaw !== ""
        ? Number(idadeMaxRaw)
        : null;

    const minOk = idadeMin == null || idade >= idadeMin;
    const maxOk = idadeMax == null || idade <= idadeMax;

    return minOk && maxOk;
  });
}

/**
 * Valor da faixa etária para uma idade, usando faixas específicas de titular
 * quando existirem. Espelha calculaAcrescimoFaixaEtaria(+Titular).
 */
function valorFaixaEtaria(plano, idade, { titular = false } = {}) {
  const lista =
    titular &&
    Array.isArray(plano?.faixasEtariasTitular) &&
    plano.faixasEtariasTitular.length > 0
      ? plano.faixasEtariasTitular
      : plano?.faixasEtarias || [];

  const valorCondicionalBase = Number(
    plano?.valorCondicional ?? plano?.valor_condicional ?? 0
  );

  if (!lista || lista.length === 0) {
    return valorCondicionalBase;
  }

  for (const faixa of lista) {
    if (!faixa) continue;

    const idadeMinRaw =
      faixa.idadeMinima ?? faixa.idade_minima ?? null;
    const idadeMaxRaw =
      faixa.idadeMaxima ?? faixa.idade_maxima ?? null;

    if (idadeMinRaw == null || idadeMaxRaw == null) continue;

    const idadeMin = Number(idadeMinRaw);
    const idadeMax = Number(idadeMaxRaw);

    if (!Number.isFinite(idadeMin) || !Number.isFinite(idadeMax)) continue;

    if (idade >= idadeMin && idade <= idadeMax) {
      return Number(faixa.valor ?? faixa.valor_faixa ?? 0);
    }
  }

  // Se não encaixar em nenhuma faixa, volta para o valor condicional padrão
  return valorCondicionalBase;
}

/**
 * Junta titular, dependentes existentes e novos em uma lista única.
 */
function buildDependentesCalculo(titular, depsExistentes = [], depsNovos = []) {
  const list = [];

  if (titular?.data_nascimento) {
    list.push({
      id: titular.id || null,
      nome: titular.nome || "",
      parentesco: "TITULAR",
      data_nascimento: titular.data_nascimento,
      isTitular: true,
      telemedicina: titular.telemedicina,
      seguro: titular.seguro,
      tanato: titular.tanato,
      clubeBeneficios: titular.clubeBeneficios,
      cremacao: titular.cremacao,
      reembolso: titular.reembolso,
    });
  }

  (depsExistentes || []).forEach((d) => {
    list.push({
      id: d.id || null,
      nome: d.nome || "",
      parentesco: d.parentesco || "",
      data_nascimento: d.data_nascimento || "",
      isTitular: false,
      telemedicina: d.telemedicina,
      seguro: d.seguro,
      tanato: d.tanato,
      clubeBeneficios: d.clubeBeneficios,
      cremacao: d.cremacao,
      reembolso: d.reembolso,
    });
  });

  (depsNovos || []).forEach((d) => {
    list.push({
      id: d.id || null,
      nome: d.nome || "",
      parentesco: d.parentesco || "",
      data_nascimento: d.data_nascimento || "",
      isTitular: false,
      telemedicina: d.telemedicina,
      seguro: d.seguro,
      tanato: d.tanato,
      clubeBeneficios: d.clubeBeneficios,
      cremacao: d.cremacao,
      reembolso: d.reembolso,
    });
  });

  return list;
}

/**
 * Cálculo detalhado da mensalidade do plano, espelhando o backend.
 */
export function detalharValorMensalidadePlano(
  plano,
  titular,
  depsExistentes = [],
  depsNovos = []
) {
  if (!plano) {
    return {
      basePlano: 0,
      usaValorCondicional: false,
      habilitarValorTitularPorFaixaEtaria: false,
      total: 0,
      totalExtras: 0,
      totalFaixas: 0,
      dependentes: [],
    };
  }

  const habilitarValorTitularPorFaixaEtaria =
    plano.habilitarValorTitularPorFaixaEtaria ??
    plano.habilitar_valor_titular_por_faixa_etaria ??
    false;

  // Base da mensalidade:
  // - se backend mandar valorMensalidade, usamos
  // - senão tentamos outros campos
  // - fallback: valorUnitario / 12
  let baseMensalidade;

  if (plano.valorMensalidade ?? plano.valor_mensalidade) {
    baseMensalidade = Number(
      plano.valorMensalidade ?? plano.valor_mensalidade
    );
  } else if (plano.mensal ?? plano.mensalidade) {
    baseMensalidade = Number(plano.mensal ?? plano.mensalidade);
  } else if (plano.valorUnitario ?? plano.valor_unitario) {
    baseMensalidade =
      Number(plano.valorUnitario ?? plano.valor_unitario) / 12;
  } else {
    baseMensalidade = 0;
  }

  const dependentesCalculo = buildDependentesCalculo(
    titular,
    depsExistentes,
    depsNovos
  );

  const result = {
    basePlano: 0,
    usaValorCondicional: false,
    habilitarValorTitularPorFaixaEtaria,
    total: 0,
    totalExtras: 0,
    totalFaixas: 0,
    dependentes: [],
  };

  // Detecta se o plano usa regra condicional (faixas/isenções)
  const hasFaixasDep =
    Array.isArray(plano.faixasEtarias) && plano.faixasEtarias.length > 0;
  const hasFaixasTit =
    Array.isArray(plano.faixasEtariasTitular) &&
    plano.faixasEtariasTitular.length > 0;
  const hasIsencoes =
    Array.isArray(plano.isencoes) && plano.isencoes.length > 0;

  // Regra condicional SÓ quando temos faixas e/ou isenções
  const usaCondicional = hasFaixasDep || hasFaixasTit || hasIsencoes;

  result.usaValorCondicional = usaCondicional;

  /* ================= REGRINHA ANTIGA (sem condicional) ================= */
  if (!usaCondicional) {
    const numDepsIncl =
      Number(plano?.numeroDependentes ?? plano?.numero_dependentes ?? 0) ||
      0;
    const valorIncAnual = Number(
      plano?.valorIncremental ?? plano?.valor_incremental ?? 0
    );
    const valorIncMensal = valorIncAnual / 12;

    result.basePlano = baseMensalidade;

    // Se não tiver configuração de incrementais → volta só com base
    if (numDepsIncl <= 0 || valorIncMensal <= 0) {
      result.total = result.basePlano;
      return result;
    }

    const todosDeps = [...(depsExistentes || []), ...(depsNovos || [])];
    const totalDeps = todosDeps.length;
    const excedentes = Math.max(0, totalDeps - numDepsIncl);

    const excedentesStartIndex = Math.max(0, totalDeps - excedentes);

    dependentesCalculo.forEach((dep) => {
      const idade = dep.data_nascimento
        ? ageFromDate(dep.data_nascimento)
        : null;

      let valorFaixa = 0;

      // Titular nunca entra como excedente
      if (!dep.isTitular && excedentes > 0) {
        const idx = todosDeps.findIndex(
          (d) =>
            d.nome === dep.nome &&
            (d.data_nascimento || "") === (dep.data_nascimento || "") &&
            (d.parentesco || "") === dep.parentesco
        );
        if (idx >= excedentesStartIndex) {
          valorFaixa = valorIncMensal;
        }
      }

      const totalExtrasPessoa = 0;

      result.dependentes.push({
        id: dep.id || null,
        nome: dep.nome || "",
        parentesco: normalizeParentesco(dep.parentesco),
        idade,
        isTitular: !!dep.isTitular,
        isento: false,
        valorFaixa,
        totalExtrasPessoa,
        valorTotalPessoa: valorFaixa + totalExtrasPessoa,
      });

      result.totalFaixas += valorFaixa;
      result.totalExtras += totalExtrasPessoa;
    });

    result.total = result.basePlano + result.totalFaixas + result.totalExtras;
    return result;
  }

  /* ============== REGRA CONDICIONAL (faixa etária + isenções) ============== */

  // Igual ao Java: se habilitarValorTitularPorFaixaEtaria → base 0; senão, base = mensalidade do plano
  result.basePlano = habilitarValorTitularPorFaixaEtaria ? 0 : baseMensalidade;

  // Flags / valores de extras (telemedicina, seguro etc.)
  const telemedicinaHabilitada =
    plano.telemedicina ?? plano.hasTelemedicina ?? false;
  const valorTelemedicina = Number(
    plano.valorTelemedicina ?? plano.valor_telemedicina ?? 0
  );
  const isentarTitularTelemedicina =
    plano.isentarTitularTelemedicina ??
    plano.isentar_titular_telemedicina ??
    false;

  const seguroHabilitado = plano.seguro ?? plano.hasSeguro ?? false;
  const valorSeguro = Number(plano.valorSeguro ?? plano.valor_seguro ?? 0);
  const isentarTitularSeguro =
    plano.isentarTitularSeguro ?? plano.isentar_titular_seguro ?? false;

  const tanatoHabilitado = plano.tanato ?? plano.hasTanato ?? false;
  const valorTanato = Number(plano.valorTanato ?? plano.valor_tanato ?? 0);
  const isentarTitularTanato =
    plano.isentarTitularTanato ?? plano.isentar_titular_tanato ?? false;

  const clubeHabilitado =
    plano.clubeBeneficios ?? plano.clube_beneficios ?? false;
  const valorClube = Number(
    plano.valorClubeBeneficios ?? plano.valor_clube_beneficios ?? 0
  );
  const isentarTitularClube =
    plano.isentarTitularClubeBeneficios ??
    plano.isentar_titular_clube_beneficios ??
    false;

  const cremacaoHabilitada = plano.cremacao ?? plano.hasCremacao ?? false;
  const valorCremacao = Number(
    plano.valorCremacao ?? plano.valor_cremacao ?? 0
  );
  const isentarTitularCremacao =
    plano.isentarTitularCremacao ?? plano.isentar_titular_cremacao ?? false;

  const reembolsoHabilitado =
    plano.reembolso ?? plano.hasReembolso ?? false;
  const valorReembolso = Number(
    plano.valorReembolso ?? plano.valor_reembolso ?? 0
  );
  const isentarTitularReembolso =
    plano.isentarTitularReembolso ?? plano.isentar_titular_reembolso ?? false;

  for (const dep of dependentesCalculo) {
    if (!dep.data_nascimento) continue;

    const idade = ageFromDate(dep.data_nascimento);
    if (!Number.isFinite(idade) || idade < 0) continue;

    const parentescoNorm = normalizeParentesco(dep.parentesco);
    const ehTitular =
      parentescoNorm === "TITULAR" || dep.isTitular === true;

    const depInfo = {
      ...dep,
      idade,
      parentesco: parentescoNorm,
      isTitular: ehTitular,
    };

    const isento = isIsento(plano, depInfo);

    let valorFaixa = 0;
    if (!isento) {
      if (habilitarValorTitularPorFaixaEtaria) {
        valorFaixa = valorFaixaEtaria(plano, idade, { titular: ehTitular });
      } else {
        valorFaixa = valorFaixaEtaria(plano, idade, { titular: false });
      }
    }

    // Extras por pessoa
    let extrasTele = 0;
    let extrasSeguro = 0;
    let extrasTanato = 0;
    let extrasClube = 0;
    let extrasCremacao = 0;
    let extrasReembolso = 0;

    if (telemedicinaHabilitada && dep.telemedicina) {
      extrasTele = ehTitular && isentarTitularTelemedicina ? 0 : valorTelemedicina;
    }

    if (seguroHabilitado && dep.seguro) {
      extrasSeguro = ehTitular && isentarTitularSeguro ? 0 : valorSeguro;
    }

    if (tanatoHabilitado && dep.tanato) {
      extrasTanato = ehTitular && isentarTitularTanato ? 0 : valorTanato;
    }

    if (clubeHabilitado && dep.clubeBeneficios) {
      extrasClube = ehTitular && isentarTitularClube ? 0 : valorClube;
    }

    if (cremacaoHabilitada && dep.cremacao) {
      extrasCremacao =
        ehTitular && isentarTitularCremacao ? 0 : valorCremacao;
    }

    if (reembolsoHabilitado && dep.reembolso) {
      extrasReembolso =
        ehTitular && isentarTitularReembolso ? 0 : valorReembolso;
    }

    const totalExtrasPessoa =
      extrasTele +
      extrasSeguro +
      extrasTanato +
      extrasClube +
      extrasCremacao +
      extrasReembolso;

    const valorTotalPessoa = valorFaixa + totalExtrasPessoa;

    result.dependentes.push({
      id: dep.id || null,
      nome: dep.nome || "",
      parentesco: parentescoNorm,
      idade,
      isTitular: !!ehTitular,
      isento,
      valorFaixa,
      totalExtrasPessoa,
      valorTotalPessoa,
    });

    result.totalFaixas += valorFaixa;
    result.totalExtras += totalExtrasPessoa;
  }

  result.total = result.basePlano + result.totalFaixas + result.totalExtras;
  return result;
}

/** Versão simples: apenas o total. */
export function calcularValorMensalidadePlano(
  plano,
  titular,
  depsExistentes = [],
  depsNovos = []
) {
  return detalharValorMensalidadePlano(
    plano,
    titular,
    depsExistentes,
    depsNovos
  ).total;
}

/**
 * Gera o cronograma de cobranças mensais, respeitando:
 *  - plano.gerarParcelasAteDezembro  (boolean)
 *  - plano.numeroParcelas / plano.numero_parcelas
 *
 * Retorna:
 * [
 *   { numeroParcela, valor, dataVencimentoISO },
 *   ...
 * ]
 */
export function gerarCobrancasPlano(plano, dataPrimeiraParcelaISO, valorParcela) {
  if (!dataPrimeiraParcelaISO) return [];

  // Parse robusto da data (YYYY-MM-DD)
  const parts = String(dataPrimeiraParcelaISO).split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return [];
  }

  const gerarAteDezembro =
    plano?.gerarParcelasAteDezembro ??
    plano?.gerar_parcelas_ate_dezembro ??
    false;

  const valor = Number(valorParcela || 0);

  let quantidadeParcelas;

  if (gerarAteDezembro) {
    // Quantos meses faltam até dezembro, incluindo o mês da primeira parcela.
    // Ex.: março (3) -> 12 - 3 + 1 = 10 meses (mar a dez)
    // Ex.: dezembro (12) -> 1 mês (dez)
    const mesesRestantes = 12 - m + 1;
    quantidadeParcelas = Math.max(1, mesesRestantes);
  } else {
    // Respeita numeroParcelas; se vier vazio/0/NaN, fallback para 12
    const numRaw =
      plano?.numeroParcelas ?? plano?.numero_parcelas ?? null;
    let num = Number(numRaw);
    if (!Number.isFinite(num) || num <= 0) {
      num = 12;
    }
    quantidadeParcelas = num;
  }

  const baseDate = new Date(Date.UTC(y, m - 1, d));
  const cobrancas = [];

  for (let i = 0; i < quantidadeParcelas; i += 1) {
    const dt = new Date(baseDate);
    dt.setUTCMonth(baseDate.getUTCMonth() + i);

    cobrancas.push({
      numeroParcela: i + 1,
      valor,
      dataVencimentoISO: dt.toISOString().slice(0, 10),
    });
  }

  return cobrancas;
}
