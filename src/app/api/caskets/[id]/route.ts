import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

export async function PATCH(req: Request, { params }: { params: any }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Invalid id", { status: 400 });
  const sb = supabaseServer();
  const body = await req.json();
  const {
    name, supplier_id,
    ext_width_in, ext_length_in, ext_height_in,
    int_width_in, int_length_in, int_height_in,
    material, jewish
  } = body ?? {};

  const update: Record<string, any> = {};
  if (name !== undefined) update.name = name;
  if (supplier_id !== undefined) update.supplier_id = supplier_id;
  if (ext_width_in !== undefined) update.ext_width_in = ext_width_in;
  if (ext_length_in !== undefined) update.ext_length_in = ext_length_in;
  if (ext_height_in !== undefined) update.ext_height_in = ext_height_in;
  if (int_width_in !== undefined) update.int_width_in = int_width_in;
  if (int_length_in !== undefined) update.int_length_in = int_length_in;
  if (int_height_in !== undefined) update.int_height_in = int_height_in;
  if (material !== undefined) update.material = material;
  if (jewish !== undefined) update.jewish = jewish;

  const { data, error } = await sb.from("caskets").update(update).eq("id", id).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(_req: Request, { params }: { params: any }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Invalid id", { status: 400 });
  const sb = supabaseServer();
  const { error } = await sb.from("caskets").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
