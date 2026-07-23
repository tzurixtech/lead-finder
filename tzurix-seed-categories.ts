// lib/categories.ts
// Mapa de ticket por categoria + pacote sugerido.
// Seed inicial baseado no mercado da Baixada Santista (2026). Ajuste livremente.

export type Ticket = "alto" | "medio" | "baixo";

/**
 * Categorias de ticket ALTO: cliente pesquisa no Google antes de fechar,
 * margem boa, decisão individual. Escassez e site institucional convertem bem.
 */
const TICKET_ALTO = new Set<string>([
  "clínica odontológica",
  "dentista",
  "advogado",
  "advogado previdenciário",
  "advogado trabalhista",
  "advogado criminal",
  "serviços jurídicos",
  "clínica de estética",
  "centro de saúde e beleza",
  "esteticista",
  "estética / emagrecimento",
  "imobiliária",
  "consultora de imóveis",
  "escritório de contabilidade",
  "assessoria contábil",
  "contabilidade",
  "buffet de casamento",
  "buffet / salão de festas",
  "buffet / catering",
  "buffet / local para eventos",
  "salão de festas",
  "serviço de catering",
  "prestador de serviços de climatização",
  "fornecedor de ar-condicionado",
  "ar-condicionado",
  "clínica de fisioterapia",
  "fisioterapeuta",
  "fisioterapia",
  "estúdio de pilates",
  "pilates / fisioterapia",
  "clínica ortopédica",
  "ótica / laboratório",
]);

/**
 * Categorias de ticket MÉDIO: negócio com caixa, decisão mais rápida,
 * ticket de serviço intermediário.
 */
const TICKET_MEDIO = new Set<string>([
  "pet shop",
  "loja de ração",
  "banho e tosa",
  "banho e tosa / pet shop",
  "pet shop / ração",
  "academia",
  "academia / crossfit",
  "sala de fitness",
  "oficina mecânica",
  "mecânica para carros",
  "loja de materiais de construção",
  "materiais de construção",
  "ótica",
  "fabricante de produtos ópticos",
  "loja de roupa",
  "loja de moda feminina",
  "restaurante corporativo",
  "restaurante japonês",
]);

/**
 * Retorna o ticket da categoria. Comparação case-insensitive e tolerante.
 * Tudo que não é alto nem médio cai em baixo (padaria, lanchonete, pizzaria,
 * barbearia, salão de beleza, sorveteria, etc.).
 */
export function ticketForCategory(category?: string | null): Ticket {
  if (!category) return "baixo";
  const c = category.trim().toLowerCase();
  if (TICKET_ALTO.has(c)) return "alto";
  if (TICKET_MEDIO.has(c)) return "medio";
  // fallback por palavra-chave, para categorias novas não mapeadas
  if (/(odont|dentist|advog|jur[ií]d|est[eé]tic|im[oó]vel|imobili|cont[aá]b|buffet|festas|catering|climatiz|ar-?condicion|fisioterap|pilates|ortop)/.test(c)) return "alto";
  if (/(pet|ra[çc][aã]o|academia|fitness|mec[aâ]nic|oficina|constru[çc]|[oó]tic|roupa|moda)/.test(c)) return "medio";
  return "baixo";
}

/** Pontos de ticket usados no score. */
export function ticketPoints(t: Ticket): number {
  return t === "alto" ? 20 : t === "medio" ? 14 : 8;
}

/** Pacote sugerido conforme ticket. */
export function suggestedPackage(t: Ticket): string {
  if (t === "alto") return "Autoridade Local (R$ 3.500 – R$ 5.500 + R$ 397/mês)";
  if (t === "medio") return "Presença Essencial+ (R$ 2.200 – R$ 3.500 + R$ 249/mês)";
  return "Presença Essencial (R$ 1.500 – R$ 2.400 + R$ 179/mês)";
}
