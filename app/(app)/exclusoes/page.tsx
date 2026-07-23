import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addExclusion, removeExclusion } from "@/app/actions/exclusion";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Exclusion {
  id: string;
  phone: string | null;
  place_id: string | null;
  reason: string | null;
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  nao_abordar: "Não abordar",
  manual: "Manual",
  pediu_saida: "Pediu saída",
  ja_cliente: "Já cliente",
};

export default async function ExclusoesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exclusions")
    .select("id, phone, place_id, reason, created_at")
    .order("created_at", { ascending: false });
  const exclusions = (data ?? []) as Exclusion[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Lista de exclusão</h1>
          <p className="text-muted-foreground text-sm">
            Contatos aqui não são reinseridos nem reabordados nas buscas.
          </p>
        </div>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Voltar
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar por telefone</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addExclusion} className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" placeholder="Ex.: (13) 99999-9999" />
            </div>
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      {exclusions.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Nenhuma exclusão ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left">
              <tr>
                <th className="p-3 font-medium">Telefone</th>
                <th className="p-3 font-medium">Place ID</th>
                <th className="p-3 font-medium">Motivo</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {exclusions.map((exclusion) => (
                <tr key={exclusion.id} className="border-t">
                  <td className="p-3">{exclusion.phone ?? "—"}</td>
                  <td className="text-muted-foreground max-w-40 truncate p-3 text-xs">
                    {exclusion.place_id ?? "—"}
                  </td>
                  <td className="p-3">{REASON_LABELS[exclusion.reason ?? ""] ?? exclusion.reason ?? "—"}</td>
                  <td className="p-3 text-right">
                    <form action={removeExclusion}>
                      <input type="hidden" name="id" value={exclusion.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Remover
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
