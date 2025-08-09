import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

export async function PATCH(req: Request, { params }: { params: any }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Invalid id", { status: 400 });
  const sb = supabaseServer();
  const body = await req.json();
  const { name, supplier_id, width_in, height_in, depth_in, category } = body ?? {};

  const update: Record<string, any> = {};
  if (name !== undefined) update.name = name;
  if (supplier_id !== undefined) update.supplier_id = supplier_id;
  if (width_in !== undefined) update.width_in = width_in;
  if (height_in !== undefined) update.height_in = height_in;
  if (depth_in !== undefined) update.depth_in = depth_in;
  if (category !== undefined) update.category = category;

  const { data, error } = await sb.from("urns").update(update).eq("id", id).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(_req: Request, { params }: { params: any }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Invalid id", { status: 400 });
  const sb = supabaseServer();
  const { error } = await sb.from("urns").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
