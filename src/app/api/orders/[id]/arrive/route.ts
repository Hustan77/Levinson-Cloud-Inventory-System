import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { z } from "zod";

const arriveSchema = z.object({
  received_by: z.string().min(1),
  arrived_at: z.string().datetime().optional(), // ISO; default now on server if missing
});

export async function PATCH(req: Request, context: any) {
  const id = Number(context?.params?.id);
  if (!id) return new NextResponse("Invalid id", { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = arriveSchema.safeParse(body);
  if (!parsed.success) return new NextResponse(parsed.error.message, { status: 400 });

  const { received_by, arrived_at } = parsed.data;

  const sb = supabaseServer();

  // Fetch order
  const { data: ord, error: getErr } = await sb.from("orders").select("*").eq("id", id).single();
  if (getErr || !ord) return new NextResponse(getErr?.message || "Order not found", { status: 404 });
  if (ord.status === "ARRIVED") return new NextResponse("Already arrived", { status: 409 });

  // Mark order arrived
  const { error: updErr } = await sb
    .from("orders")
    .update({
      status: "ARRIVED",
      arrived_at: arrived_at ?? new Date().toISOString(),
      received_by,
    })
    .eq("id", id);
  if (updErr) return new NextResponse(updErr.message, { status: 500 });

  // Optional: inventory reconciliation happens via database triggers or separate logic.
  // If you want to ensure on_hand increments here, uncomment the below and ensure schema supports it.

  // if (ord.item_id && ord.item_type === "casket") {
  //   await sb.rpc("fn_inventory_arrival_casket", { p_casket_id: ord.item_id }); // if you have a SQL function
  // } else if (ord.item_id && ord.item_type === "urn") {
  //   await sb.rpc("fn_inventory_arrival_urn", { p_urn_id: ord.item_id });
  // }

  return NextResponse.json({ ok: true });
}
