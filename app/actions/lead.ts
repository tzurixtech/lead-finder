"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STAGES } from "@/lib/leads";

export async function updateLeadMeta(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const rawStage = String(formData.get("stage") ?? "Novo");
  const stage = (LEAD_STAGES as ReadonlyArray<string>).includes(rawStage) ? rawStage : "Novo";
  const notesValue = String(formData.get("notes") ?? "").trim();
  const notes = notesValue.length > 0 ? notesValue : null;

  const supabase = await createClient();
  await supabase.from("leads").update({ stage, notes }).eq("id", id);
  revalidatePath(`/lead/${id}`);
}
