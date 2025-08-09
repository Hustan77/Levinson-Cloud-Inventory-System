import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { UpdateOrderSchema } from "../../../../lib/types";

function getId(req: Request) {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const idStr = parts[parts.length - 1];
  const id = Number(idStr);
  return Number.isFinite(id) ? id : null;
}

export async function PATCH(req: Request) {
  const id = getId(req);
  if (id === null) return new NextResponse("Invalid id", { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(parsed.error.errors.map((e) => e.message).join("; "), { status: 400 });
  }

  const sb = supabaseServer();
  const patch = parsed.data;

  if (patch.backordered === false) {
    if (!patch.expected_date) {
      return new NextResponse("Provide expected_date when not backordered.", { status: 400 });
    }
    if (patch.tbd_expected) {
      return new NextResponse("TBD cannot be selected when not backordered.", { status: 400 });
    }
  }

  const { data, error } = await sb.from("orders").update(patch).eq("id", id).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });

  if (data.status !== "ARRIVED") {
    const nextStatus = data.special_order ? "SPECIAL" : (data.backordered ? "BACKORDERED" : "PENDING");
    const upd = await sb.from("orders").update({ status: nextStatus }).eq("id", id);
    if (upd.error) return new NextResponse(upd.error.message, { status: 500 });
    return NextResponse.json({ ...data, status: nextStatus }, { status: 200 });
  }

  return NextResponse.json(data, { status: 200 });
}
