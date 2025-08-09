import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { CreateOrderSchema } from "../../../lib/types";

export async function GET() {
  const sb = supabaseServer();
  // Try view, else fallback to orders table
  const view = await sb.from("v_orders_enriched").select("*").order("created_at", { ascending: false });
  if (!view.error && view.data) return NextResponse.json(view.data, { status: 200 });

  const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false });
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: Request) {
  const sb = supabaseServer();
  const body = await req.json().catch(() => ({}));
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(parsed.error.errors.map(e=>e.message).join("; "), { status: 400 });
  }
  const payload = parsed.data;

  // Base status
  let status: "PENDING" | "BACKORDERED" | "SPECIAL" = payload.backordered ? "BACKORDERED" : "PENDING";
  if (payload.special_order) status = "SPECIAL";

  const insert = {
    item_type: payload.item_type,
    item_id: payload.special_order ? null : payload.item_id,
    item_name: payload.special_order ? payload.item_name : null,
    supplier_id: payload.supplier_id ?? null,
    po_number: payload.po_number,
    expected_date: payload.expected_date,
    status,
    backordered: payload.backordered,
    tbd_expected: payload.tbd_expected,
    deceased_name: payload.special_order ? (payload.deceased_name ?? null) : null,
  };

  const { data, error } = await sb.from("orders").insert(insert).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
