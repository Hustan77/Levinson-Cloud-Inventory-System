import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from("urns").select("*").order("name", { ascending: true });
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const sb = supabaseServer();
  const { data, error } = await sb.from("urns").insert({
    name: body.name,
    supplier_id: body.supplier_id ?? null,
    width_in: body.width_in ?? null,
    height_in: body.height_in ?? null,
    depth_in: body.depth_in ?? null,
    target_qty: body.target_qty ?? 0,
    on_hand: body.on_hand ?? 0,
    on_order: body.on_order ?? 0,
    backordered_count: body.backordered_count ?? 0,
    category: body.category ?? 'Full Size',
    green: !!body.green,
  }).select("*").single();

  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
