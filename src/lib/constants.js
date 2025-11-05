// src/lib/constants.js

/** Parentescos padrão (fallback) */
export const PARENTESCOS_FALLBACK = [
  ["CONJUGE","Cônjuge"],["COMPANHEIRO","Companheiro(a)"],["FILHO","Filho(a)"],["PAI","Pai"],["MAE","Mãe"],
  ["IRMAO","Irmã(o)"],["AVO","Avô(ó)"],["TITULAR","Titular"],["RESPONSAVEL","Responsável"],["TIO","Tio(a)"],
  ["SOBRINHO","Sobrinho(a)"],["PRIMO","Primo(a)"],["NETO","Neto(a)"],["BISNETO","Bisneto(a)"],["PADRASTO","Padrasto"],
  ["MADRASTRA","Madrasta"],["AFILHADO","Afilhado(a)"],["ENTEADA","Enteado(a)"],["SOGRO","Sogro(a)"],["GENRO","Genro"],
  ["NORA","Nora"],["CUNHADO","Cunhado(a)"],["BISAVO","Bisavô(ó)"],["MADRINHA","Madrinha"],["PADRINHO","Padrinho"],
  ["AMIGO","Amigo(a)"],["AGREGADO","Agregado"],["DEPENDENTE","Dependente"],["COLABORADOR","Colaborador"],
  ["EX_CONJUGE","Ex Cônjuge"],["EX_TITULAR","Ex Titular"],["EX_RESPONSAVEL","Ex Responsável"],
];

/** Mapa de rótulos de parentesco */
export const PARENTESCO_LABELS = Object.fromEntries(PARENTESCOS_FALLBACK);
export const labelParentesco = (v) => PARENTESCO_LABELS[v] || v;

/** Estado civil aceito pela API */
export const ESTADO_CIVIL_OPTIONS = [
  ["SOLTEIRO","Solteiro(a)"],["CASADO","Casado(a)"],["DIVORCIADO","Divorciado(a)"],
  ["AMASIADO","Amasiado(a)"],["UNIAO_ESTAVEL","União Estável"],["VIUVO","Viúvo(a)"],["SEPARADO","Separado(a)"],
];
export const ESTADO_CIVIL_LABEL = Object.fromEntries(ESTADO_CIVIL_OPTIONS);

/** Sexo (UI -> API) */
export const SEXO_OPTIONS = [
  ["HOMEM","Masculino"],
  ["MULHER","Feminino"],
];

/** Opções de Dia D (vencimento) */
export const DIA_D_OPTIONS = [5, 10, 15, 20, 25];
