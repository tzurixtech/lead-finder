"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RegeneratePitch({ leadId, hasPitch }: { leadId: string; hasPitch: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function regenerate() {
    setPending(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/personalize`, { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Não foi possível gerar o pitch.");
        return;
      }
      toast.success("Pitch atualizado.");
      router.refresh();
    } catch {
      toast.error("Não foi possível gerar o pitch.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={regenerate}>
      {pending ? "Gerando..." : hasPitch ? "Regenerar" : "Gerar pitch"}
    </Button>
  );
}
