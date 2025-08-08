import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { ArriveSchema } from "@/lib/types";

/** PATCH /api/orders/[id]/arrive — mark order as delivered */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const sb = supabaseServer();
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.text("Invalid id", { status: 400 });

  const body = await req.json();
  const parsed = ArriveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { received_by, arrived_at } = parsed.data;

  const { data, error } = await sb.from("orders").update({
    status: "ARRIVED",
    received_by,
    arrived_at: arrived_at ?? new Date().toISOString()
  }).eq("id", id).select("*").single();

  if (error) return NextResponse.text(error.message, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}
