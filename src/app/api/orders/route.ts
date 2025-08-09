import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * LANDMARK: GET /api/orders (uses v_orders_enriched if present, falls back to orders)
 */
export async function GET() {
  const sb = supabaseServer();

  // Try view first
  const { data: viewData, error: viewErr } = await sb
    .from("v_orders_enriched")
    .select("*")
    .order("created_at", { ascending: false });

  if (!viewErr && viewData) {
    return NextResponse.json(viewData);
  }

  // Fallback to raw orders
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/**
 * LANDMARK: POST /api/orders (create + auto-decrement on_hand for normal items)
 * - Normal order (non-special, non-return, with item_id): on_hand -= 1
 * - Backorder vs pending is controlled via body fields; inventory LIVE on-order is derived by views.
 *
 * Note: keep date fields lenient; we accept ISO strings or empty which become null.
 */

const isoDateOrNull = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const CreateOrderSchema = z.object({
  item_type: z.enum(["casket", "urn"]),
  item_id: z.number().int().nullable().optional(),
  item_name: z.string().nullable().optional(),
  supplier_id: z.number().int().nullable().optional(),
  po_number: z.string().min(1),
  expected_date: isoDateOrNull,
  status: z.enum(["PENDING", "BACKORDERED", "ARRIVED", "SPECIAL"]),
  backordered: z.boolean().optional().default(false),
  tbd_expected: z.boolean().optional().default(false),
  special_order: z.boolean().optional().default(false),
  deceased_name: z.string().nullable().optional(),
  need_by_date: isoDateOrNull,
  notes: z.string().nullable().optional(),
  is_return: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const body = await req.json();

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;

  const sb = supabaseServer();

  // Insert the order
  const { data: inserted, error: insErr } = await sb
    .from("orders")
    .insert({
      item_type: payload.item_type,
      item_id: payload.item_id ?? null,
      item_name: payload.item_name ?? null,
      supplier_id: payload.supplier_id ?? null,
      po_number: payload.po_number,
      expected_date: payload.tbd_expected ? null : (payload.expected_date ?? null),
      status: payload.status, // typically PENDING | BACKORDERED | SPECIAL
      backordered: !!payload.backordered,
      tbd_expected: !!payload.tbd_expected,
      special_order: !!payload.special_order,
      deceased_name: payload.special_order ? (payload.deceased_name ?? null) : null,
      need_by_date: payload.need_by_date ?? null,
      notes: payload.notes ?? null,
      is_return: !!payload.is_return,
    })
    .select("*")
    .limit(1)
    .single();

  if (insErr || !inserted) {
    return NextResponse.json({ error: insErr?.message ?? "Insert failed" }, { status: 500 });
  }

  // LANDMARK: Auto-decrement on_hand for normal orders (not special/return) with a concrete item_id
  const shouldAdjustInventory =
    !inserted.special_order &&
    !inserted.is_return &&
    inserted.item_id != null &&
    (inserted.item_type === "casket" || inserted.item_type === "urn");

  if (shouldAdjustInventory) {
    const table = inserted.item_type === "casket" ? "caskets" : "urns";

    // Fetch current on_hand
    const { data: itemRow, error: fetchErr } = await sb
      .from(table)
      .select("id,on_hand")
      .eq("id", inserted.item_id)
      .limit(1)
      .single();

    if (fetchErr || !itemRow) {
      // Rollback the order insert on failure
      await sb.from("orders").delete().eq("id", inserted.id);
      return NextResponse.json({ error: fetchErr?.message ?? "Inventory fetch failed" }, { status: 500 });
    }

    const newOnHand = (itemRow.on_hand ?? 0) - 1;

    const { error: updateErr } = await sb
      .from(table)
      .update({ on_hand: newOnHand })
      .eq("id", inserted.item_id);

    if (updateErr) {
      // Rollback the order on failure to keep consistency
      await sb.from("orders").delete().eq("id", inserted.id);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
