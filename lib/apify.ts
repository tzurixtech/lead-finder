// lib/apify.ts
// Chamadas ao Apify (actor compass/crawler-google-places).
// SERVIDOR APENAS — usa o APIFY_TOKEN. Nunca importe no bundle do client.
import { serverEnv } from "@/lib/env";
import type { RawPlace } from "@/lib/scoring";

const BASE_URL = "https://api.apify.com/v2";
const ACTOR_ID = "compass~crawler-google-places";

/** Campos que pedimos do dataset — casam com RawPlace. */
const DATASET_FIELDS = [
  "title",
  "categoryName",
  "neighborhood",
  "street",
  "phone",
  "website",
  "totalScore",
  "reviewsCount",
  "placeId",
  "url",
].join(",");

export type ApifyRunStatus =
  | "READY"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "ABORTING"
  | "ABORTED"
  | "TIMING-OUT"
  | "TIMED-OUT";

export interface StartRunInput {
  /** Termos de busca já montados, ex.: ["pizzaria em São Vicente, SP"]. */
  searchStrings: string[];
  city: string;
  maxPerSearch: number;
}

export interface StartedRun {
  runId: string;
  datasetId: string;
  status: ApifyRunStatus;
}

export interface RunState {
  status: ApifyRunStatus;
  datasetId: string;
  costUsd: number;
}

interface ApifyRunResponse {
  data: {
    id: string;
    status: ApifyRunStatus;
    defaultDatasetId: string;
    usageTotalUsd?: number;
  };
}

function isSuccess(status: ApifyRunStatus): boolean {
  return status === "SUCCEEDED";
}

function isFinished(status: ApifyRunStatus): boolean {
  return (
    status === "SUCCEEDED" ||
    status === "FAILED" ||
    status === "ABORTED" ||
    status === "TIMED-OUT"
  );
}

export { isSuccess as isRunSuccess, isFinished as isRunFinished };

/** Dispara um run do actor. Retorna imediatamente (assíncrono). */
export async function startRun(input: StartRunInput): Promise<StartedRun> {
  const response = await fetch(`${BASE_URL}/acts/${ACTOR_ID}/runs?token=${serverEnv.apifyToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      searchStringsArray: input.searchStrings,
      locationQuery: input.city,
      maxCrawledPlacesPerSearch: input.maxPerSearch,
      language: "pt-BR",
      skipClosedPlaces: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Apify startRun falhou: HTTP ${response.status}`);
  }

  const json = (await response.json()) as ApifyRunResponse;
  return {
    runId: json.data.id,
    datasetId: json.data.defaultDatasetId,
    status: json.data.status,
  };
}

/** Consulta o status de um run. */
export async function getRunState(runId: string): Promise<RunState> {
  const response = await fetch(`${BASE_URL}/actor-runs/${runId}?token=${serverEnv.apifyToken}`);
  if (!response.ok) {
    throw new Error(`Apify getRunState falhou: HTTP ${response.status}`);
  }
  const json = (await response.json()) as ApifyRunResponse;
  return {
    status: json.data.status,
    datasetId: json.data.defaultDatasetId,
    costUsd: json.data.usageTotalUsd ?? 0,
  };
}

/** Lê os itens do dataset já filtrados nos campos que usamos. */
export async function getDatasetItems(datasetId: string): Promise<RawPlace[]> {
  const url = `${BASE_URL}/datasets/${datasetId}/items?token=${serverEnv.apifyToken}&fields=${DATASET_FIELDS}&clean=true`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Apify getDatasetItems falhou: HTTP ${response.status}`);
  }
  return (await response.json()) as RawPlace[];
}

/** Monta os termos de busca a partir de nichos + cidade. */
export function buildSearchStrings(niches: string[], city: string): string[] {
  return niches.map((niche) => `${niche} em ${city}`);
}
