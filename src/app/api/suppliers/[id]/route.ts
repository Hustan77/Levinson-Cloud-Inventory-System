import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

export async function PATCH(req: Request, { params }: { params: any }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Invalid id", { status: 400 });
  const sb = supabaseServer();
  const body = await req.json();
  const { name, ordering_instructions } = body ?? {};
  const { data, error } = await sb.from("suppliers").update({ name, ordering_instructions }).eq("id", id).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(_req: Request, { params }: { params: any }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Invalid id", { status: 400 });
  const sb = supabaseServer();
  const { error } = await sb.from("suppliers").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
