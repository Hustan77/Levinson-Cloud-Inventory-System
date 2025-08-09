import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

function getId(req: Request) {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const idStr = parts[parts.length - 1];
  const id = Number(idStr);
  return Number.isFinite(id) ? id : null;
}

export async function PATCH(req: Request) {
  const id = getId(req);
  if (id === null) return new NextResponse("Invalid id", { status: 400 });

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

export async function DELETE(req: Request) {
  const id = getId(req);
  if (id === null) return new NextResponse("Invalid id", { status: 400 });

  const sb = supabaseServer();
  const { error } = await sb.from("suppliers").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
