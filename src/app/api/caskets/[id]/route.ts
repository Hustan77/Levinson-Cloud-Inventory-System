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

  const update: Record<string, any> = {};
  const keys = [
    "name","supplier_id",
    "ext_width_in","ext_length_in","ext_height_in",
    "int_width_in","int_length_in","int_height_in",
    "target_qty","on_hand","on_order","backordered_count",
    "material","jewish","green"
  ] as const;

  for (const k of keys) if (k in body) (update as any)[k] = body[k];

  const { data, error } = await sb.from("caskets").update(update).eq("id", id).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: Request) {
  const id = getId(req);
  if (id === null) return new NextResponse("Invalid id", { status: 400 });

  const sb = supabaseServer();
  const { error } = await sb.from("caskets").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
