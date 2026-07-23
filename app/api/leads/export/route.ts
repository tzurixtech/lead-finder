import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseLeadFilters, leadsQuery, EXPORT_COLUMNS } from "@/lib/leads";

const EXPORT_LIMIT = 5000;

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const filters = parseLeadFilters(Object.fromEntries(request.nextUrl.searchParams));
  const { data } = await leadsQuery(supabase, filters, { columns: EXPORT_COLUMNS })
    .order("score", { ascending: false, nullsFirst: false })
    .limit(EXPORT_LIMIT);

  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const headers = EXPORT_COLUMNS.split(",").map((column) => column.trim());
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ];

  return new NextResponse(`﻿${lines.join("\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
