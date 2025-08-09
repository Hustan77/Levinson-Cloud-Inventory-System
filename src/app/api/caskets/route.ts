import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("caskets")
    .select("id,name,supplier_id,ext_width_in,ext_length_in,ext_height_in,int_width_in,int_length_in,int_height_in,material,jewish")
    .order("name", { ascending: true });
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: Request) {
  const sb = supabaseServer();
  const body = await req.json();
  const {
    name, supplier_id,
    ext_width_in, ext_length_in, ext_height_in,
    int_width_in, int_length_in, int_height_in,
    material, jewish
  } = body ?? {};
  if (!name) return new NextResponse("name is required", { status: 400 });

  const insert = {
    name,
    supplier_id: supplier_id ?? null,
    ext_width_in: ext_width_in ?? null,
    ext_length_in: ext_length_in ?? null,
    ext_height_in: ext_height_in ?? null,
    int_width_in: int_width_in ?? null,
    int_length_in: int_length_in ?? null,
    int_height_in: int_height_in ?? null,
    material: material ?? null,
    jewish: !!jewish
  };

  const { data, error } = await sb.from("caskets").insert(insert).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
