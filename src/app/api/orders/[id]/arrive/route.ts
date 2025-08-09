import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabaseServer";
import { ArriveSchema } from "../../../../../lib/types";

function getOrderId(req: Request) {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const idStr = parts[parts.length - 2]; // .../orders/[id]/arrive
  const id = Number(idStr);
  return Number.isFinite(id) ? id : null;
}

export async function PATCH(req: Request) {
  const id = getOrderId(req);
  if (id === null) return new NextResponse("Invalid id", { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = ArriveSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(parsed.error.errors.map((e) => e.message).join("; "), { status: 400 });
  }

  const { received_by, arrived_at } = parsed.data;

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("orders")
    .update({
      arrived_at: arrived_at ?? new Date().toISOString(),
      received_by,
      status: "ARRIVED",
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}
