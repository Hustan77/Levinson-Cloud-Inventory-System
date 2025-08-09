import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Invalid id", { status: 400 });
  const sb = supabaseServer();
  const body = await req.json().catch(() => ({}));
  const { name, ordering_instructions } = body ?? {};

  const update: Record<string, any> = {};
  if (name !== undefined) update.name = name;
  if (ordering_instructions !== undefined) update.ordering_instructions = ordering_instructions ?? null;

  const { data, error } = await sb.from("suppliers").update(update).eq("id", id).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Invalid id", { status: 400 });
  const sb = supabaseServer();
  const { error } = await sb.from("suppliers").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
