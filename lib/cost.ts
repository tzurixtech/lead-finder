// lib/cost.ts
// Estimativa de custo do Apify — módulo puro, seguro para o client.

/** Custo estimado por lugar rastreado (heurística p/ pré-confirmação). */
export const COST_PER_PLACE_USD = 0.007;

/** Estimativa de custo (US$) mostrada antes de disparar a busca. */
export function estimateCostUsd(niches: number, maxPerNiche: number): number {
  return Number((niches * maxPerNiche * COST_PER_PLACE_USD).toFixed(2));
}
