import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseLeadFilters, parsePage, leadsQuery, LIST_COLUMNS, PAGE_SIZE } from "@/lib/leads";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const filters = parseLeadFilters(params);
  const page = parsePage(params);
  const from = (page - 1) * PAGE_SIZE;

  const { data, count } = await leadsQuery(supabase, filters, { columns: LIST_COLUMNS })
    .order("score", { ascending: false, nullsFirst: false })
    .range(from, from + PAGE_SIZE - 1);

  return NextResponse.json({ leads: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE });
}
