import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  supplier_id: z.number().int().nullable().optional(),
  category: z.enum(["FULL", "KEEPSAKE", "JEWELRY", "SPECIAL"]).nullable().optional(),
  green: z.boolean().nullable().optional(),
  width_in: z.number().nullable().optional(),
  height_in: z.number().nullable().optional(),
  depth_in: z.number().nullable().optional(),
  target_qty: z.number().int().nullable().optional(),
  on_hand: z.number().int().nullable().optional(), // generally adjusted via API logic; editable for admin if needed
});

export async function PATCH(req: Request, context: any) {
  const id = Number(context?.params?.id);
  if (!id) return new NextResponse("Invalid id", { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return new NextResponse(parsed.error.message, { status: 400 });

  const sb = supabaseServer();
  const { data, error } = await sb.from("urns").update(parsed.data).eq("id", id).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, context: any) {
  const id = Number(context?.params?.id);
  if (!id) return new NextResponse("Invalid id", { status: 400 });

  const sb = supabaseServer();
  const { error } = await sb.from("urns").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
