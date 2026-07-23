// lib/competitors.ts
// Concorrentes REAIS de São Vicente/SP que possuem site próprio,
// por categoria. Usado pelo Personalizador para citar o concorrente
// no diagnóstico ("quem está levando o seu cliente").
// Extraído da coleta Apify (jul/2026). Amplie conforme mapear novas cidades/nichos.

export interface Competitor {
  name: string;
  domain: string;
  rating?: number;   // 0 = sem dado
  reviews?: number;  // 0 = sem dado
}

/**
 * Chave = categoria em minúsculas. Valor = lista de concorrentes com site,
 * ordenada do mais forte para o mais fraco.
 */
export const COMPETITORS: Record<string, Competitor[]> = {
  "padaria": [{ name: "Padaria & Confeitaria Lorenzo", domain: "padarialorenzo.com.br", rating: 4.8, reviews: 559 }],
  "pizzaria": [{ name: "Pinna's Restaurante e Pizzaria", domain: "pizzariaerestaurantepinnas.com.br", rating: 4.5, reviews: 918 }],
  "restaurante": [{ name: "Mania de Churrasco", domain: "maniadechurrasco.com", rating: 4.6, reviews: 7398 }],
  "restaurante japonês": [{ name: "Mania de Churrasco", domain: "maniadechurrasco.com", rating: 4.6, reviews: 7398 }],
  "restaurante corporativo": [{ name: "Mania de Churrasco", domain: "maniadechurrasco.com", rating: 4.6, reviews: 7398 }],
  "lanchonete": [{ name: "Pinna's Restaurante e Pizzaria", domain: "pizzariaerestaurantepinnas.com.br", rating: 4.5, reviews: 918 }],
  "loja de materiais de construção": [
    { name: "Casa Nobre", domain: "casanobrematconstrucao.com.br", rating: 4.4, reviews: 570 },
    { name: "Correia Materiais", domain: "correiamateriais.com.br", rating: 4.5, reviews: 338 },
  ],
  "materiais de construção": [
    { name: "Casa Nobre", domain: "casanobrematconstrucao.com.br", rating: 4.4, reviews: 570 },
    { name: "Correia Materiais", domain: "correiamateriais.com.br", rating: 4.5, reviews: 338 },
  ],
  "oficina mecânica": [
    { name: "Trokescap Auto Center", domain: "trokescap.com.br", rating: 4.7, reviews: 434 },
    { name: "Oficina Express", domain: "redeoficinaexpress.com", rating: 3.9, reviews: 583 },
  ],
  "mecânica para carros": [{ name: "Trokescap Auto Center", domain: "trokescap.com.br", rating: 4.7, reviews: 434 }],
  "academia": [
    { name: "Smart Fit", domain: "smartfit.com.br", rating: 4.5, reviews: 1858 },
    { name: "R3 Academia", domain: "r3academia.com.br", rating: 4.2, reviews: 360 },
  ],
  "academia / crossfit": [{ name: "Smart Fit", domain: "smartfit.com.br", rating: 4.5, reviews: 1858 }],
  "advogado": [
    { name: "Dr. Eduardo Oliveira", domain: "dreduardooliveira.com", rating: 5.0, reviews: 515 },
    { name: "Dra. Sabrina Douetts", domain: "sabrinadouettsadvocacia.com", rating: 4.9, reviews: 182 },
  ],
  "serviços jurídicos": [{ name: "Marques e Barroso Advogados", domain: "marquesebarroso.adv.br", rating: 4.9, reviews: 35 }],
  "dentista": [
    { name: "OrthoDontic", domain: "orthodonticbrasil.com.br", rating: 4.8, reviews: 664 },
    { name: "Dentari Clinic", domain: "dentari.com.br", rating: 4.8, reviews: 148 },
  ],
  "clínica odontológica": [
    { name: "OrthoDontic", domain: "orthodonticbrasil.com.br", rating: 4.8, reviews: 664 },
    { name: "Sorridents", domain: "sorridents.com.br", rating: 4.4, reviews: 217 },
  ],
  "buffet de casamento": [
    { name: "Barcelona Buffet", domain: "barcelonabuffet.com.br", rating: 4.9, reviews: 796 },
    { name: "Buffet Garden", domain: "buffetgarden.com.br", rating: 5.0, reviews: 326 },
  ],
  "buffet / salão de festas": [{ name: "Barcelona Buffet", domain: "barcelonabuffet.com.br", rating: 4.9, reviews: 796 }],
  "salão de festas": [{ name: "Barcelona Buffet", domain: "barcelonabuffet.com.br", rating: 4.9, reviews: 796 }],
  "ar-condicionado": [
    { name: "Friocar Ar Condicionado", domain: "friocarsv.com.br", rating: 4.5, reviews: 558 },
    { name: "Nascimento Ar", domain: "nascimentoar.com", rating: 4.9, reviews: 61 },
  ],
  "prestador de serviços de climatização": [
    { name: "Friocar Ar Condicionado", domain: "friocarsv.com.br", rating: 4.5, reviews: 558 },
    { name: "Nascimento Ar", domain: "nascimentoar.com", rating: 4.9, reviews: 61 },
  ],
  "clínica de fisioterapia": [
    { name: "Clínica Padre Anchieta", domain: "clinicapadreanchieta.com.br", rating: 4.1, reviews: 99 },
    { name: "Movah Pilates", domain: "movahpilates.com", rating: 4.9, reviews: 82 },
  ],
  "estúdio de pilates": [{ name: "Movah Pilates", domain: "movahpilates.com", rating: 4.9, reviews: 82 }],
  "clínica de estética": [
    { name: "Royal Face", domain: "royalface.com.br", rating: 4.8, reviews: 135 },
    { name: "Estética Rubi", domain: "esteticarubi.com.br", rating: 4.9, reviews: 97 },
  ],
  "centro de saúde e beleza": [{ name: "Royal Face", domain: "royalface.com.br", rating: 4.8, reviews: 135 }],
  "esteticista": [{ name: "Royal Face", domain: "royalface.com.br", rating: 4.8, reviews: 135 }],
  "escritório de contabilidade": [
    { name: "José Alves Contabilidade", domain: "josealvescontabilidade.com.br", rating: 5.0, reviews: 355 },
    { name: "Contabilidade Ipiranga", domain: "contabilidadeipiranga.com.br", rating: 5.0, reviews: 50 },
  ],
  "assessoria contábil": [{ name: "José Alves Contabilidade", domain: "josealvescontabilidade.com.br", rating: 5.0, reviews: 355 }],
  "imobiliária": [
    { name: "Praia Mar Imóveis", domain: "praiamarimoveissv.com.br", rating: 4.7, reviews: 346 },
    { name: "HM Imóveis", domain: "hmimoveissaovicente.com.br", rating: 4.4, reviews: 150 },
  ],
  "ótica": [{ name: "Ótica Líder", domain: "oticalider.com.br" }],
  "loja de roupa": [{ name: "Caedu Moda", domain: "caedu.com.br", rating: 4.2, reviews: 1057 }],
  "loja de moda feminina": [{ name: "Caedu Moda", domain: "caedu.com.br", rating: 4.2, reviews: 1057 }],
};

/**
 * Categorias onde NENHUM negócio de São Vicente tem site próprio.
 * O Personalizador deve inverter o argumento: "território livre — seja o primeiro".
 */
export const OPEN_TERRITORY = new Set<string>([
  "pet shop",
  "loja de ração",
  "banho e tosa",
  "pet shop / ração",
  "banho e tosa / pet shop",
  "barbearia",
  "salão de beleza",
  "manicure",
]);

export interface CompetitorAngle {
  type: "PERDA" | "OPORTUNIDADE" | "INVISIVEL";
  competitor?: Competitor;
  headline: string;
}

/**
 * Decide o ângulo do ponto 1 do diagnóstico para uma categoria.
 * - Território livre -> OPORTUNIDADE (seja o primeiro)
 * - Tem concorrente com site -> PERDA (quem está levando seu cliente)
 * - Sem dado -> INVISIVEL (você não aparece na busca)
 */
export function competitorAngle(category?: string | null): CompetitorAngle {
  const c = (category ?? "").trim().toLowerCase();
  if (OPEN_TERRITORY.has(c)) {
    return {
      type: "OPORTUNIDADE",
      headline: `Nenhum ${c} de São Vicente tem site próprio. Quem colocar o primeiro fica com a busca inteira.`,
    };
  }
  const list = COMPETITORS[c];
  if (list && list.length) {
    const top = list[0];
    const extra = top.reviews ? ` (nota ${top.rating}, ${top.reviews} avaliações)` : "";
    return {
      type: "PERDA",
      competitor: top,
      headline: `A ${top.name}${extra} tem site próprio (${top.domain}) e aparece na frente em quem procura "${c} em São Vicente".`,
    };
  }
  return {
    type: "INVISIVEL",
    headline: `Quem busca "${c} em São Vicente" no Google não te encontra — o Google só te mostra para quem já procura pelo seu nome.`,
  };
}
