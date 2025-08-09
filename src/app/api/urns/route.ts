import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { z } from "zod";

/** LANDMARK: GET urns from v_inventory_urns (live on_order/backordered) */
export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from("v_inventory_urns").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

const UrnCreate = z.object({
  name: z.string().min(1),
  supplier_id: z.number().nullable().optional(),
  width_in: z.number().nullable().optional(),
  height_in: z.number().nullable().optional(),
  depth_in: z.number().nullable().optional(),
  category: z.enum(["FULL", "KEEPSAKE", "JEWELRY", "SPECIAL"]),
  green: z.boolean().optional(),
  target_qty: z.number().int().nonnegative().default(0),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = UrnCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json(parsed.error.format(), { status: 400 });

  const sb = supabaseServer();
  const { error } = await sb.from("urns").insert({
    ...parsed.data,
    on_hand: 0,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
