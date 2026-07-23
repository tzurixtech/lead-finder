// lib/scoring.ts
// Núcleo de qualificação: classifica a situação digital, calcula o score,
// define temperatura e monta o "motivo". Coração do produto — cobrir com testes.
import { ticketForCategory, ticketPoints, suggestedPackage, type Ticket } from "./categories";
import { competitorAngle } from "./competitors";

export type DigitalStatus =
  | "SEM_SITE" | "SITE_FRACO" | "SITE_PROPRIO";

export type Temperature = "QUENTE" | "MORNO" | "FRIO";

/** Item bruto vindo do Apify (campos que usamos). */
export interface RawPlace {
  title: string;
  categoryName?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  phone?: string | null;
  website?: string | null;
  totalScore?: number | null;   // nota
  reviewsCount?: number | null;
  placeId?: string | null;
  url?: string | null;
}

export interface ScoredLead {
  placeId?: string | null;
  name: string;
  category?: string | null;
  neighborhood?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  digitalStatus: DigitalStatus;
  digitalLabel: string;
  rating?: number | null;
  reviewsCount: number;
  ticket: Ticket;
  score: number;
  temperature: Temperature;
  suggestedPackage: string;
  reason: string;
}

// URLs que caracterizam "site fraco" (rede social, agregador, plataforma de terceiro)
const WEAK_PATTERNS: Array<[RegExp, string, number]> = [
  [/wa\.me|api\.whatsapp|whatsapp/i, "Só link de WhatsApp", 33],
  [/linkedin/i, "Só LinkedIn", 33],
  [/facebook|fb\.com|fb\.me/i, "Só Facebook", 28],
  [/instagram|instagran/i, "Só Instagram", 25],
  [/linktr|beacons|bio\.link|bio\.site/i, "Só Linktree/Beacons", 27],
  [/sites\.google/i, "Google Sites gratuito", 27],
  [/wixsite|\.wixsite\.|webnode|netlify\.app|ueniweb|lojavirtualnuvem/i, "Plataforma gratuita antiga", 22],
  [/negocio\.site|business\.site/i, "Mini-site do Google", 24],
  [/instadelivery|swfast|byappfood|appbarber|appfood|goomer|abrir\.link|ifood/i, "Cardápio/agenda de terceiro", 24],
  [/goo\.gl|bit\.ly/i, "Link encurtado quebrado", 34],
];

/** Classifica a situação digital a partir do website. */
export function classifyDigital(website?: string | null): { status: DigitalStatus; label: string; sitePoints: number } {
  if (!website || !website.trim()) return { status: "SEM_SITE", label: "Sem site", sitePoints: 35 };
  for (const [re, label, pts] of WEAK_PATTERNS) {
    if (re.test(website)) return { status: "SITE_FRACO", label, sitePoints: pts };
  }
  return { status: "SITE_PROPRIO", label: "Site próprio", sitePoints: 0 };
}

function reviewPoints(n: number): number {
  if (n >= 200) return 25;
  if (n >= 80) return 19;
  if (n >= 30) return 13;
  if (n >= 10) return 7;
  return 3;
}

function ratingPoints(nota?: number | null): number {
  if (nota == null) return 5;
  if (nota >= 4.7) return 15;
  if (nota >= 4.3) return 10;
  if (nota < 3.6) return 12; // nota baixa = dor forte, argumento de venda
  return 5;
}

/** Detecta celular BR (13 9xxxx-xxxx -> 13 dígitos começando 55 e 9 no 5º). */
function toWhatsapp(phone?: string | null): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  if (d.length === 13 && d.startsWith("55") && d[4] === "9") return `https://wa.me/${d}`;
  if (d.length === 11 && d[2] === "9") return `https://wa.me/55${d}`;
  return null;
}

function isMobile(phone?: string | null): boolean {
  return toWhatsapp(phone) != null;
}

/** Monta o texto "por que é um bom lead". */
function buildReason(name: string, cat: string | null | undefined, status: DigitalStatus, label: string, nota: number | null | undefined, reviews: number, ticket: Ticket): string {
  const parts: string[] = [];
  const angle = competitorAngle(cat);
  parts.push(angle.headline);
  if (reviews >= 200) parts.push(`${reviews} avaliações: demanda comprovada e caixa para investir.`);
  else if (reviews >= 80) parts.push(`${reviews} avaliações: negócio consolidado no bairro.`);
  else if (reviews >= 30) parts.push(`${reviews} avaliações: já tem movimento constante.`);
  else parts.push(`${reviews} avaliações: perfil novo — abertura fácil e barata de crescer.`);
  if (nota != null && nota >= 4.8) parts.push(`Nota ${nota}: reputação excelente e desperdiçada sem site para converter.`);
  else if (nota != null && nota < 3.6) parts.push(`Nota ${nota}: reputação em risco — entra pela dor, não pelo preço.`);
  if (ticket === "alto") parts.push("Ticket alto: cliente pesquisa no Google antes de fechar.");
  return parts.join(" ");
}

/** Pontua um lead bruto. Retorna null se for filtrado (ex.: site próprio, sem interesse). */
export function scoreLead(raw: RawPlace, opts: { keepOwnSite?: boolean } = {}): ScoredLead {
  const { status, label, sitePoints } = classifyDigital(raw.website);
  const reviews = raw.reviewsCount ?? 0;
  const nota = raw.totalScore ?? null;
  const ticket = ticketForCategory(raw.categoryName);
  const mobile = isMobile(raw.phone);

  const score =
    sitePoints +
    reviewPoints(reviews) +
    ratingPoints(nota) +
    ticketPoints(ticket) +
    (mobile ? 5 : 0) +
    (raw.phone ? 3 : -8);

  const temperature: Temperature = score >= 82 ? "QUENTE" : score >= 70 ? "MORNO" : "FRIO";

  return {
    placeId: raw.placeId ?? null,
    name: raw.title,
    category: raw.categoryName ?? null,
    neighborhood: raw.neighborhood ?? null,
    address: raw.street ?? null,
    phone: raw.phone ?? null,
    whatsapp: toWhatsapp(raw.phone),
    website: raw.website ?? null,
    digitalStatus: status,
    digitalLabel: label,
    rating: nota,
    reviewsCount: reviews,
    ticket,
    score,
    temperature,
    suggestedPackage: suggestedPackage(ticket),
    reason: buildReason(raw.title, raw.categoryName, status, label, nota, reviews, ticket),
  };
}

/**
 * Pontua uma lista e, por padrão, remove quem já tem site próprio
 * (não é lead) e quem não tem telefone.
 */
export function scoreAndFilter(items: RawPlace[], opts: { keepOwnSite?: boolean } = {}): ScoredLead[] {
  return items
    .map((r) => scoreLead(r))
    .filter((l) => (opts.keepOwnSite ? true : l.digitalStatus !== "SITE_PROPRIO"))
    .filter((l) => !!l.phone)
    .sort((a, b) => b.score - a.score);
}
