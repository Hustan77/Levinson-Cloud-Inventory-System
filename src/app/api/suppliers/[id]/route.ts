import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { z } from "zod";

// LANDMARK: zod update schema
const supplierSchema = z.object({
  name: z.string().min(1).optional(),
  ordering_instructions: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("").transform(() => null)),
  ordering_website: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
});

export async function PATCH(req: Request, context: any) {
  const id = Number(context?.params?.id);
  if (!id) return new NextResponse("Invalid id", { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) return new NextResponse(parsed.error.message, { status: 400 });

  const sb = supabaseServer();
  const { data, error } = await sb.from("suppliers").update(parsed.data).eq("id", id).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, context: any) {
  const id = Number(context?.params?.id);
  if (!id) return new NextResponse("Invalid id", { status: 400 });

  const sb = supabaseServer();
  const { error } = await sb.from("suppliers").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
