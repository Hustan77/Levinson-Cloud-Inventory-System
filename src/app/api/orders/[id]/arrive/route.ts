// LANDMARK: PATCH /api/orders/[id]/arrive
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabaseServer";
import { ArriveSchema } from "../../../../../lib/types";

export async function PATCH(req: Request, { params }: { params: any }) {
  const sb = supabaseServer();
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Invalid id", { status: 400 });

  const body = await req.json();
  const parsed = ArriveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const cur = await sb.from("orders").select("expected_date").eq("id", id).single();
  if (cur.error) return new NextResponse(cur.error.message, { status: 404 });

  const expected_date = cur.data?.expected_date ?? new Date().toISOString().slice(0,10);
  const { received_by, arrived_at } = parsed.data;

  const { data, error } = await sb
    .from("orders")
    .update({
      status: "ARRIVED",
      received_by,
      arrived_at: arrived_at ?? new Date().toISOString(),
      expected_date,
      backordered: false,
      tbd_expected: false
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}
