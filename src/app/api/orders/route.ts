import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import type { VOrderEnriched } from "@/lib/types";

/**
 * GET /api/orders
 * Prefer the view v_orders_enriched (already includes supplier_name & item_display_name).
 * If the view is missing for any reason, we enrich on the fly as a fallback.
 */
export async function GET() {
  const sb = supabaseServer();

  // 1) Try the view first
  const viaView = await sb
    .from("v_orders_enriched")
    .select("*")
    .order("created_at", { ascending: false });

  if (!viaView.error && viaView.data) {
    return NextResponse.json(viaView.data as VOrderEnriched[]);
  }

  // 2) Fallback: build enrichment here (only used if the view is unavailable)
  const [ordersRes, suppliersRes, casketsRes, urnsRes] = await Promise.all([
    sb.from("orders").select("*").order("created_at", { ascending: false }),
    sb.from("suppliers").select("id,name"),
    sb.from("caskets").select("id,name"),
    sb.from("urns").select("id,name"),
  ]);

  if (ordersRes.error) {
    return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  }

  const suppliers = suppliersRes.data ?? [];
  const caskets = casketsRes.data ?? [];
  const urns = urnsRes.data ?? [];

  const supMap = new Map<number, string>(suppliers.map((s: any) => [s.id, s.name]));
  const cMap = new Map<number, string>(caskets.map((c: any) => [c.id, c.name ?? ""]));
  const uMap = new Map<number, string>(urns.map((u: any) => [u.id, u.name ?? ""]));

  const enriched: VOrderEnriched[] = (ordersRes.data ?? []).map((o: any) => {
    const supplier_name =
      o.supplier_id != null ? supMap.get(o.supplier_id) ?? null : null;

    let item_display_name: string | null = null;
    if (o.status === "SPECIAL") {
      item_display_name = o.item_name ?? null;
    } else if (o.item_type === "casket" && o.item_id) {
      item_display_name = cMap.get(o.item_id) ?? null;
    } else if (o.item_type === "urn" && o.item_id) {
      item_display_name = uMap.get(o.item_id) ?? null;
    }

    // also provide the alias 'item_display' & pass through 'notes' if your table has it
    return {
      ...o,
      supplier_name,
      item_display_name,
      item_display: item_display_name,
      notes: o.notes ?? null,
    } as VOrderEnriched;
  });

  return NextResponse.json(enriched);
}
