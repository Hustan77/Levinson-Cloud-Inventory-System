// LANDMARK: PATCH /api/orders/[id]/arrive
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabaseServer";
import { ArriveSchema } from "../../../../../lib/types";

// NOTE: With Next 15 + typedRoutes, avoid typing the 2nd arg explicitly.
// Let Next infer { params } to satisfy the route handler type.
export async function PATCH(req: Request, { params }: { params: any }) {
  const sb = supabaseServer();

  // LANDMARK: parse and validate id
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return new NextResponse("Invalid id", { status: 400 });
  }

  // LANDMARK: validate body with Zod
  const body = await req.json();
  const parsed = ArriveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { received_by, arrived_at } = parsed.data;

  // LANDMARK: update order to ARRIVED
  const { data, error } = await sb
    .from("orders")
    .update({
      status: "ARRIVED",
      received_by,
      arrived_at: arrived_at ?? new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}
