"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { estimateCostUsd } from "@/lib/cost";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Phase = "form" | "confirm" | "running" | "done" | "error";

interface SearchProgress {
  status: "pending" | "running" | "processing" | "done" | "error";
  totalFound: number;
  totalNew: number;
  costUsd: number;
  error: string | null;
}

const POLL_INTERVAL_MS = 5000;
const usd = (value: number) => `US$ ${value.toFixed(2)}`;

export function SearchForm() {
  const [niches, setNiches] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [city, setCity] = useState("");
  const [maxPerNiche, setMaxPerNiche] = useState(15);
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<SearchProgress | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const estimate = estimateCostUsd(niches.length, maxPerNiche);

  function addNiche() {
    const value = draft.trim().toLowerCase();
    if (!value) return;
    if (!niches.includes(value)) setNiches((current) => [...current, value]);
    setDraft("");
  }

  function removeNiche(value: string) {
    setNiches((current) => current.filter((item) => item !== value));
  }

  function onDraftKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addNiche();
    }
  }

  function goToConfirm() {
    if (niches.length === 0) {
      toast.error("Adicione ao menos um nicho.");
      return;
    }
    if (!city.trim()) {
      toast.error("Informe a cidade.");
      return;
    }
    setPhase("confirm");
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function pollStatus(searchId: string) {
    try {
      const response = await fetch(`/api/search/${searchId}/status`);
      const data = (await response.json()) as SearchProgress;
      if (data.status === "done") {
        stopPolling();
        setResult(data);
        setPhase("done");
      } else if (data.status === "error") {
        stopPolling();
        setResult(data);
        setPhase("error");
      }
    } catch {
      // Erro transitório de rede: mantém o polling.
    }
  }

  async function startSearch() {
    setPhase("running");
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niches, city: city.trim(), maxPerNiche }),
      });
      const data = (await response.json()) as { searchId?: string; error?: string };
      if (!response.ok || !data.searchId) {
        toast.error(data.error ?? "Não foi possível iniciar a busca.");
        setPhase("form");
        return;
      }
      const searchId = data.searchId;
      pollRef.current = setInterval(() => void pollStatus(searchId), POLL_INTERVAL_MS);
      void pollStatus(searchId);
    } catch {
      toast.error("Não foi possível iniciar a busca.");
      setPhase("form");
    }
  }

  function reset() {
    setNiches([]);
    setDraft("");
    setCity("");
    setMaxPerNiche(15);
    setResult(null);
    setPhase("form");
  }

  if (phase === "running") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Buscando…</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>O Apify leva de 2 a 5 minutos. Pode deixar esta tela aberta.</p>
          <p>Nichos: {niches.join(", ")} · Cidade: {city}</p>
        </CardContent>
      </Card>
    );
  }

  if (phase === "done" && result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Busca concluída</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p>{result.totalNew} novos leads · {result.totalFound} qualificados no total.</p>
            <p className="text-muted-foreground">Custo real: {usd(result.costUsd)}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className={buttonVariants()}>
              Ver no dashboard
            </Link>
            <Button variant="outline" onClick={reset}>
              Nova busca
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "error" && result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Busca com erro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">{result.error ?? "Erro desconhecido."}</p>
          <Button variant="outline" onClick={reset}>
            Tentar de novo
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "confirm") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirmar busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm space-y-1">
            <li><span className="text-muted-foreground">Nichos:</span> {niches.join(", ")}</li>
            <li><span className="text-muted-foreground">Cidade:</span> {city}</li>
            <li><span className="text-muted-foreground">Máx. por nicho:</span> {maxPerNiche}</li>
            <li><span className="text-muted-foreground">Custo estimado:</span> ~{usd(estimate)}</li>
          </ul>
          <p className="text-muted-foreground text-xs">
            Estimativa; o custo real depende dos resultados e aparece ao final.
          </p>
          <div className="flex gap-2">
            <Button onClick={startSearch}>Confirmar e buscar</Button>
            <Button variant="outline" onClick={() => setPhase("form")}>
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova busca</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="niche">Nichos</Label>
          <div className="flex gap-2">
            <Input
              id="niche"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onDraftKeyDown}
              placeholder="Ex.: pizzaria (Enter para adicionar)"
            />
            <Button type="button" variant="outline" onClick={addNiche}>
              Adicionar
            </Button>
          </div>
          {niches.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {niches.map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => removeNiche(niche)}
                  className="bg-muted hover:bg-muted/70 rounded-full px-3 py-1 text-xs"
                  aria-label={`Remover ${niche}`}
                >
                  {niche} ✕
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Ex.: São Vicente, SP"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max">Máximo por nicho</Label>
          <Input
            id="max"
            type="number"
            min={1}
            max={30}
            value={maxPerNiche}
            onChange={(event) => setMaxPerNiche(Number(event.target.value))}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Custo estimado: ~{usd(estimate)}</span>
          <Button onClick={goToConfirm}>Buscar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
