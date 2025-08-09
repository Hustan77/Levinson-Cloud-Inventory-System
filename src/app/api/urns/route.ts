import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("urns")
    .select("id,name,supplier_id,width_in,height_in,depth_in,category")
    .order("name", { ascending: true });
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: Request) {
  const sb = supabaseServer();
  const body = await req.json();
  const { name, supplier_id, width_in, height_in, depth_in, category } = body ?? {};
  if (!name) return new NextResponse("name is required", { status: 400 });
  const { data, error } = await sb
    .from("urns")
    .insert({
      name,
      supplier_id: supplier_id ?? null,
      width_in: width_in ?? null,
      height_in: height_in ?? null,
      depth_in: depth_in ?? null,
      category: category ?? null
    })
    .select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
