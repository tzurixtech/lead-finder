"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Algo deu errado</h1>
      <p className="text-muted-foreground text-sm">
        Não foi possível carregar esta página. Tente novamente.
      </p>
      <Button onClick={reset}>Tentar de novo</Button>
    </main>
  );
}
