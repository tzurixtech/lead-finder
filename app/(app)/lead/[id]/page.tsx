import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateLeadMeta } from "@/app/actions/lead";
import { LEAD_STAGES, type LeadRow } from "@/lib/leads";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RegeneratePitch } from "@/components/regenerate-pitch";

const SELECT_CLASS =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const lead = data as LeadRow;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{lead.name}</h1>
          <p className="text-muted-foreground text-sm">
            {lead.category ?? "—"} · {lead.city ?? lead.neighborhood ?? "—"}
          </p>
        </div>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Voltar
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados e qualificação</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Situação digital" value={lead.digital_label} />
            <Field label="Score" value={lead.score} />
            <Field label="Temperatura" value={lead.temperature} />
            <Field label="Ticket" value={lead.ticket} />
            <Field label="Nota" value={lead.rating} />
            <Field label="Avaliações" value={lead.reviews_count} />
            <Field label="Bairro" value={lead.neighborhood} />
            <Field label="Endereço" value={lead.address} />
            <Field label="Telefone" value={lead.phone} />
            <Field
              label="WhatsApp"
              value={
                lead.whatsapp ? (
                  <a href={lead.whatsapp} target="_blank" rel="noreferrer" className="underline">
                    abrir
                  </a>
                ) : null
              }
            />
            <Field
              label="Site"
              value={
                lead.website ? (
                  <a href={lead.website} target="_blank" rel="noreferrer" className="underline">
                    {lead.website}
                  </a>
                ) : null
              }
            />
            <Field label="Pacote sugerido" value={lead.suggested_package} />
          </dl>
          {lead.reason && <p className="text-muted-foreground mt-4 text-sm">{lead.reason}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Personalização (IA)</CardTitle>
          <RegeneratePitch leadId={lead.id} hasPitch={lead.personalized} />
        </CardHeader>
        <CardContent className="space-y-4">
          {lead.personalized ? (
            <>
              <Field label="Relevância" value={lead.relevance} />
              <div>
                <dt className="text-muted-foreground text-xs">Diagnóstico</dt>
                <dd className="text-sm whitespace-pre-wrap">{lead.diagnosis}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Mensagem de abordagem</dt>
                <dd className="text-sm whitespace-pre-wrap">{lead.opening_message}</dd>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Ainda não personalizado. Gere o pitch com base no seu perfil de negócio.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acompanhamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateLeadMeta} className="space-y-4">
            <input type="hidden" name="id" value={lead.id} />
            <div className="space-y-2">
              <Label htmlFor="stage">Etapa</Label>
              <select id="stage" name="stage" defaultValue={lead.stage ?? "Novo"} className={SELECT_CLASS}>
                {LEAD_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" defaultValue={lead.notes ?? ""} />
            </div>
            <Button type="submit">Salvar acompanhamento</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
