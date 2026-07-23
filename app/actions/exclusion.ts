"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** "Não abordar": adiciona o lead à exclusão e o remove da lista. */
export async function excludeLead(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: lead } = await supabase
    .from("leads")
    .select("place_id, phone")
    .eq("id", id)
    .maybeSingle();
  if (!lead) return;

  const row = lead as { place_id: string | null; phone: string | null };
  await supabase.from("exclusions").insert({
    user_id: user.id,
    place_id: row.place_id,
    phone: row.phone,
    reason: "nao_abordar",
  });
  await supabase.from("leads").delete().eq("id", id);
  redirect("/");
}

/** Adiciona uma exclusão manual por telefone (tela /exclusoes). */
export async function addExclusion(formData: FormData): Promise<void> {
  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("exclusions").insert({ user_id: user.id, phone, reason: "manual" });
  revalidatePath("/exclusoes");
}

export async function removeExclusion(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("exclusions").delete().eq("id", id);
  revalidatePath("/exclusoes");
}
