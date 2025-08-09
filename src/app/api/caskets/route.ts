import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from("caskets").select("*").order("name", { ascending: true });
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const sb = supabaseServer();
  const { data, error } = await sb.from("caskets").insert({
    name: body.name,
    supplier_id: body.supplier_id ?? null,
    ext_width_in: body.ext_width_in ?? null,
    ext_length_in: body.ext_length_in ?? null,
    ext_height_in: body.ext_height_in ?? null,
    int_width_in: body.int_width_in ?? null,
    int_length_in: body.int_length_in ?? null,
    int_height_in: body.int_height_in ?? null,
    target_qty: body.target_qty ?? 0,
    on_hand: body.on_hand ?? 0,
    on_order: body.on_order ?? 0,
    backordered_count: body.backordered_count ?? 0,
    material: body.material ?? 'Wood',
    jewish: !!body.jewish,
    green: !!body.green,
  }).select("*").single();

  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
