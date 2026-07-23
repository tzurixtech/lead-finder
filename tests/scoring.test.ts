import { describe, expect, it } from "vitest";
import { classifyDigital, scoreLead, scoreAndFilter, type RawPlace } from "@/lib/scoring";

function place(overrides: Partial<RawPlace> = {}): RawPlace {
  return {
    title: "Negócio Teste",
    categoryName: "padaria",
    phone: "(13) 3333-3333",
    website: null,
    totalScore: 4.5,
    reviewsCount: 40,
    placeId: "place-1",
    ...overrides,
  };
}

describe("classifyDigital", () => {
  it("marca sem site quando o website está vazio", () => {
    const result = classifyDigital(null);
    expect(result.status).toBe("SEM_SITE");
    expect(result.sitePoints).toBe(35);
  });

  it("reconhece Instagram como site fraco", () => {
    const result = classifyDigital("https://instagram.com/negocio");
    expect(result.status).toBe("SITE_FRACO");
    expect(result.label).toBe("Só Instagram");
    expect(result.sitePoints).toBe(25);
  });

  it("reconhece link de WhatsApp como site fraco de maior dor", () => {
    const result = classifyDigital("https://wa.me/5513999999999");
    expect(result.status).toBe("SITE_FRACO");
    expect(result.sitePoints).toBe(33);
  });

  it("trata domínio próprio como site próprio sem pontos", () => {
    const result = classifyDigital("https://negocioproprio.com.br");
    expect(result.status).toBe("SITE_PROPRIO");
    expect(result.sitePoints).toBe(0);
  });
});

describe("scoreLead", () => {
  it("classifica como QUENTE um lead sem site, ticket alto, muitas avaliações e celular", () => {
    const lead = scoreLead(
      place({
        categoryName: "dentista",
        website: null,
        totalScore: 4.9,
        reviewsCount: 250,
        phone: "(13) 99999-9999",
      }),
    );
    // 35 (sem site) + 25 (>=200) + 15 (>=4.7) + 20 (alto) + 5 (celular) + 3 (tem telefone)
    expect(lead.score).toBe(103);
    expect(lead.temperature).toBe("QUENTE");
    expect(lead.whatsapp).toBe("https://wa.me/5513999999999");
    expect(lead.ticket).toBe("alto");
  });

  it("classifica como MORNO um lead na faixa intermediária", () => {
    const lead = scoreLead(
      place({
        categoryName: "academia",
        website: null,
        totalScore: null,
        reviewsCount: 40,
        phone: "(13) 3333-3333",
      }),
    );
    // 35 + 13 (>=30) + 5 (nota nula) + 14 (medio) + 0 (fixo) + 3 (telefone)
    expect(lead.score).toBe(70);
    expect(lead.temperature).toBe("MORNO");
  });

  it("classifica como FRIO um lead de baixa pontuação", () => {
    const lead = scoreLead(
      place({
        categoryName: "padaria",
        website: "https://instagram.com/padoca",
        totalScore: null,
        reviewsCount: 5,
        phone: "(13) 3333-3333",
      }),
    );
    // 25 (instagram) + 3 (resto) + 5 (nota nula) + 8 (baixo) + 0 + 3
    expect(lead.score).toBe(44);
    expect(lead.temperature).toBe("FRIO");
  });

  it("converte nota baixa em pontos de dor", () => {
    const alta = scoreLead(place({ totalScore: 4.5 }));
    const baixa = scoreLead(place({ totalScore: 3.2 }));
    // nota < 3.6 vale 12 (dor) contra 10 de uma nota 4.5
    expect(baixa.score - alta.score).toBe(2);
  });

  it("penaliza a ausência de telefone", () => {
    const comTelefone = scoreLead(place({ phone: "(13) 3333-3333" }));
    const semTelefone = scoreLead(place({ phone: null }));
    // com telefone +3, sem telefone -8 => diferença de 11
    expect(comTelefone.score - semTelefone.score).toBe(11);
  });
});

describe("scoreAndFilter", () => {
  it("remove sites próprios e leads sem telefone, e ordena por score", () => {
    const items: RawPlace[] = [
      place({ title: "Sem site forte", website: null, categoryName: "dentista", reviewsCount: 250, totalScore: 4.9, phone: "(13) 99999-9999" }),
      place({ title: "Site próprio", website: "https://siteproprio.com.br", phone: "(13) 3333-3333" }),
      place({ title: "Sem telefone", website: null, phone: null }),
      place({ title: "Só Instagram", website: "https://instagram.com/loja", categoryName: "padaria", reviewsCount: 10, phone: "(13) 3333-3333" }),
    ];

    const result = scoreAndFilter(items);

    expect(result.map((lead) => lead.name)).toEqual(["Sem site forte", "Só Instagram"]);
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it("mantém sites próprios quando keepOwnSite é verdadeiro", () => {
    const items: RawPlace[] = [
      place({ title: "Site próprio", website: "https://siteproprio.com.br", phone: "(13) 3333-3333" }),
    ];
    const result = scoreAndFilter(items, { keepOwnSite: true });
    expect(result).toHaveLength(1);
    expect(result[0].digitalStatus).toBe("SITE_PROPRIO");
  });
});
