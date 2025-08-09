import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { UpdateOrderSchema } from "../../../../lib/types";

// LANDMARK: PATCH /api/orders/[id] — update PO, expected_date, backordered, tbd_expected
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Invalid id", { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(parsed.error.errors.map(e => e.message).join("; "), { status: 400 });
  }

  const sb = supabaseServer();
  const patch = parsed.data;

  // Apply update
  const { data, error } = await sb.from("orders").update(patch).eq("id", id).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });

  // Keep status in sync (if not ARRIVED)
  if (data.status !== "ARRIVED") {
    const nextStatus = data.backordered ? "BACKORDERED" : (data.item_name ? "SPECIAL" : "PENDING");
    const upd = await sb.from("orders").update({ status: nextStatus }).eq("id", id);
    if (upd.error) return new NextResponse(upd.error.message, { status: 500 });
    return NextResponse.json({ ...data, status: nextStatus }, { status: 200 });
  }

  return NextResponse.json(data, { status: 200 });
}

// LANDMARK: DELETE /api/orders/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Invalid id", { status: 400 });

  const sb = supabaseServer();
  const { error } = await sb.from("orders").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
