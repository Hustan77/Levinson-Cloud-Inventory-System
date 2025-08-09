import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabaseServer";
import { CreateOrderSchema } from "../../lib/types";


/** GET /api/orders */
export async function GET() {
  const sb = supabaseServer();

  // Try the view first
  let { data, error } = await sb.from("v_orders_enriched").select("*").order("created_at", { ascending: false });

  if (error) {
    // Fallback: manual join
    const base = await sb.from("orders").select("*").order("created_at", { ascending: false });
    if (base.error) return new NextResponse(base.error.message, { status: 500 });

    const [supRes, cRes, uRes] = await Promise.all([
      sb.from("suppliers").select("id,name"),
      sb.from("caskets").select("id,name"),
      sb.from("urns").select("id,name")
    ]);

    if (supRes.error || cRes.error || uRes.error) {
      return NextResponse.json(base.data ?? [], { status: 200 });
    }

    const supMap = new Map<number, string>();
    supRes.data?.forEach((s) => supMap.set(s.id, s.name));
    const cMap = new Map<number, string>();
    cRes.data?.forEach((c) => cMap.set(c.id, c.name));
    const uMap = new Map<number, string>();
    uRes.data?.forEach((u) => uMap.set(u.id, u.name));

    const enriched =
      base.data?.map((o: any) => ({
        ...o,
        supplier_name: o.supplier_id ? supMap.get(o.supplier_id) ?? null : null,
        item_display_name:
          o.status === "SPECIAL"
            ? o.item_name
            : o.item_type === "casket"
            ? o.item_id
              ? cMap.get(o.item_id) ?? null
              : null
            : o.item_id
            ? uMap.get(o.item_id) ?? null
            : null
      })) ?? [];

    return NextResponse.json(enriched, { status: 200 });
  }

  return NextResponse.json(data ?? [], { status: 200 });
}

/** POST /api/orders */
export async function POST(req: NextRequest) {
  const sb = supabaseServer();
  const payload = await req.json();

  const parsed = CreateOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const p = parsed.data;

  // Determine supplier_id
  let supplier_id: number | null = null;
  if (!p.special_order) {
    if (!p.item_id) return new NextResponse("Missing item_id", { status: 400 });
    if (p.item_type === "casket") {
      const { data, error } = await sb.from("caskets").select("supplier_id").eq("id", p.item_id).single();
      if (error) return new NextResponse(error.message, { status: 400 });
      supplier_id = data?.supplier_id ?? null;
    } else {
      const { data, error } = await sb.from("urns").select("supplier_id").eq("id", p.item_id).single();
      if (error) return new NextResponse(error.message, { status: 400 });
      supplier_id = data?.supplier_id ?? null;
    }
  } else {
    const ns = await sb.from("suppliers").select("id").ilike("name", "%NorthStar%").maybeSingle();
    if (ns.data?.id) supplier_id = ns.data.id;
    else {
      const any = await sb.from("suppliers").select("id").limit(1).single();
      supplier_id = any.data?.id ?? null;
    }
  }

  // Derive status
  let status: "PENDING" | "BACKORDERED" | "SPECIAL" = "PENDING";
  if (p.special_order) status = "SPECIAL";
  else if (p.backordered || p.tbd_expected) status = "BACKORDERED";

  const insert = {
    item_type: p.item_type,
    item_id: p.special_order ? null : p.item_id,
    item_name: p.special_order ? p.item_name : null,
    supplier_id,
    po_number: p.po_number,
    expected_date: p.expected_date,
    status,
    backordered: p.backordered,
    tbd_expected: p.tbd_expected,
    deceased_name: p.special_order ? p.deceased_name : null
  };

  const { data, error } = await sb.from("orders").insert(insert).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
