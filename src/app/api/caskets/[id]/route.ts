import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  supplier_id: z.number().int().nullable().optional(),
  material: z.enum(["WOOD", "METAL", "GREEN"]).nullable().optional(),
  jewish: z.boolean().nullable().optional(),
  green: z.boolean().nullable().optional(),
  ext_width_in: z.number().nullable().optional(),
  ext_length_in: z.number().nullable().optional(),
  ext_height_in: z.number().nullable().optional(),
  int_width_in: z.number().nullable().optional(),
  int_length_in: z.number().nullable().optional(),
  int_height_in: z.number().nullable().optional(),
  target_qty: z.number().int().nullable().optional(),
  on_hand: z.number().int().nullable().optional(), // note: generally adjusted via API logic; keep editable for admin use if needed
});

export async function PATCH(req: Request, context: any) {
  const id = Number(context?.params?.id);
  if (!id) return new NextResponse("Invalid id", { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return new NextResponse(parsed.error.message, { status: 400 });

  const sb = supabaseServer();
  const { data, error } = await sb.from("caskets").update(parsed.data).eq("id", id).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, context: any) {
  const id = Number(context?.params?.id);
  if (!id) return new NextResponse("Invalid id", { status: 400 });

  const sb = supabaseServer();
  const { error } = await sb.from("caskets").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
