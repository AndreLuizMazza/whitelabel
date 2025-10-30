// src/pages/cadastro/CadastroPage.jsx
import {
  onlyDigits,
  cpfIsValid,
  formatCPF,
  maskCEP,            // se usar diretamente em inputs
  formatCEP,          // opcional
  formatPhoneBR,
  phoneIsValid,
  sanitizeUF,
  formatDateBR,
  normalizeISODate,
} from "@/lib/br";

import {
  toISODate,
  efetivacaoProxMesPorDiaD,
  ageFromDate,
} from "@/lib/dates";

import {
  PARENTESCOS_FALLBACK,
  PARENTESCO_LABELS,
  labelParentesco,
  ESTADO_CIVIL_OPTIONS,
  ESTADO_CIVIL_LABEL,
  SEXO_OPTIONS,
  DIA_D_OPTIONS,
} from "@/lib/constants";

import { useDebouncedCallback } from "@/lib/hooks";
import { useViaCep } from "@/lib/useViaCep";
