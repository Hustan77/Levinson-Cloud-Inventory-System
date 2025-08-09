import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { z } from "zod";

/** LANDMARK: GET caskets from v_inventory_caskets (live on_order/backordered) */
export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from("v_inventory_caskets").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/** LANDMARK: POST create casket (target qty only editable; on_hand allowed via adjust) */
const CasketCreate = z.object({
  name: z.string().min(1),
  supplier_id: z.number().nullable().optional(),
  ext_width_in: z.number().nullable().optional(),
  ext_length_in: z.number().nullable().optional(),
  ext_height_in: z.number().nullable().optional(),
  int_width_in: z.number().nullable().optional(),
  int_length_in: z.number().nullable().optional(),
  int_height_in: z.number().nullable().optional(),
  material: z.enum(["WOOD", "METAL", "GREEN"]),
  jewish: z.boolean().optional(),
  green: z.boolean().optional(),
  target_qty: z.number().int().nonnegative().default(0),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CasketCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json(parsed.error.format(), { status: 400 });

  const sb = supabaseServer();
  const { error } = await sb.from("caskets").insert({
    ...parsed.data,
    on_hand: 0, // start at 0; use adjust endpoint to change
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
