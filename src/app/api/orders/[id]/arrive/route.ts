import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * LANDMARK: PATCH /api/orders/[id]/arrive
 * - Sets status=ARRIVED, arrived_at=now(), received_by
 * - Auto-increment on_hand by 1 for normal orders (non-special, non-return, with item_id)
 * - Safe rollback if inventory update fails
 *
 * NOTE: We compute the id from URL path to avoid Next 15 "invalid second argument" typing issues.
 */

const ArriveSchema = z.object({
  received_by: z.string().min(1).optional(),
});

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  // pathname like: /api/orders/123/arrive
  const segments = url.pathname.split("/").filter(Boolean);
  const idStr = segments[segments.length - 2]; // .../orders/:id/arrive
  const orderId = Number(idStr);

  if (!orderId || Number.isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ArriveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sb = supabaseServer();

  // Fetch the order (need item_type/item_id/special flags)
  const { data: order, error: fetchErr } = await sb
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .limit(1)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: fetchErr?.message ?? "Order not found" }, { status: 404 });
  }

  // Update the order to ARRIVED
  const { data: updated, error: updErr } = await sb
    .from("orders")
    .update({
      status: "ARRIVED",
      arrived_at: new Date().toISOString(),
      received_by: parsed.data.received_by ?? order.received_by ?? null,
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (updErr || !updated) {
    return NextResponse.json({ error: updErr?.message ?? "Failed to update order" }, { status: 500 });
  }

  // LANDMARK: Auto-increment on_hand for normal orders (not special/return) with a concrete item_id
  const shouldAdjustInventory =
    !updated.special_order &&
    !updated.is_return &&
    updated.item_id != null &&
    (updated.item_type === "casket" || updated.item_type === "urn");

  if (shouldAdjustInventory) {
    const table = updated.item_type === "casket" ? "caskets" : "urns";

    const { data: itemRow, error: fetchItemErr } = await sb
      .from(table)
      .select("id,on_hand")
      .eq("id", updated.item_id)
      .limit(1)
      .single();

    if (fetchItemErr || !itemRow) {
      // Rollback order to previous status if inventory adjust fails
      await sb.from("orders").update({ status: order.status, arrived_at: order.arrived_at, received_by: order.received_by }).eq("id", orderId);
      return NextResponse.json({ error: fetchItemErr?.message ?? "Inventory fetch failed" }, { status: 500 });
    }

    const newOnHand = (itemRow.on_hand ?? 0) + 1;

    const { error: updateErr } = await sb
      .from(table)
      .update({ on_hand: newOnHand })
      .eq("id", updated.item_id);

    if (updateErr) {
      // Rollback order if inventory update fails
      await sb.from("orders").update({ status: order.status, arrived_at: order.arrived_at, received_by: order.received_by }).eq("id", orderId);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
