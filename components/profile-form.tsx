"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { BusinessProfile } from "@/lib/profile";
import type { ProfileFormState } from "@/app/actions/profile";
import { LLM_OPTIONS, DEFAULT_LLM, llmKey } from "@/lib/llm-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProfileAction = (state: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;

interface ProfileFormProps {
  action: ProfileAction;
  initial: BusinessProfile | null;
  submitLabel: string;
}

const INITIAL_STATE: ProfileFormState = { error: null, saved: false };

export function ProfileForm({ action, initial, submitLabel }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (state.saved) toast.success("Perfil salvo.");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="business_name">Nome do negócio *</Label>
        <Input
          id="business_name"
          name="business_name"
          required
          defaultValue={initial?.business_name ?? ""}
          placeholder="Ex.: Tzurix"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="what_you_sell">O que você vende *</Label>
        <Textarea
          id="what_you_sell"
          name="what_you_sell"
          required
          defaultValue={initial?.what_you_sell ?? ""}
          placeholder="Ex.: Sites profissionais + otimização do Google Meu Negócio"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="value_proposition">Proposta de valor *</Label>
        <Textarea
          id="value_proposition"
          name="value_proposition"
          required
          defaultValue={initial?.value_proposition ?? ""}
          placeholder="Ex.: Fazer o negócio ser encontrado no Google por quem procura na cidade"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ideal_client">Cliente ideal</Label>
        <Input
          id="ideal_client"
          name="ideal_client"
          defaultValue={initial?.ideal_client ?? ""}
          placeholder="Ex.: comércio local sem site, com boa reputação"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price_range">Faixa de preço</Label>
        <Input
          id="price_range"
          name="price_range"
          defaultValue={initial?.price_range ?? ""}
          placeholder="Ex.: pacotes de R$ 1.500 a R$ 5.500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tone_signature">Tom e assinatura</Label>
        <Textarea
          id="tone_signature"
          name="tone_signature"
          defaultValue={initial?.tone_signature ?? ""}
          placeholder="Ex.: tom direto e cordial. Assinatura: Tzurix — @tzurix — tzurix.com.br"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="good_lead_signals">Sinais de um bom lead</Label>
        <Textarea
          id="good_lead_signals"
          name="good_lead_signals"
          defaultValue={initial?.good_lead_signals ?? ""}
          placeholder="Ex.: negócio sem site ou só com Instagram, mas com muitas avaliações"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="llm">Modelo de IA (personalização)</Label>
        <select
          id="llm"
          name="llm"
          defaultValue={llmKey(
            initial?.llm_provider ?? DEFAULT_LLM.provider,
            initial?.llm_model ?? DEFAULT_LLM.model,
          )}
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
        >
          {LLM_OPTIONS.map((option) => (
            <option key={llmKey(option.provider, option.model)} value={llmKey(option.provider, option.model)}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-muted-foreground text-xs">
          Usado para gerar relevância, diagnóstico e mensagem de cada lead.
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
