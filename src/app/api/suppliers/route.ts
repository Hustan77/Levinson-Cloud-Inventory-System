import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { z } from "zod";

// LANDMARK: zod schema for suppliers
const supplierSchema = z.object({
  name: z.string().min(1),
  ordering_instructions: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("").transform(()=>null)),
  ordering_website: z.string().url().nullable().optional().or(z.literal("").transform(()=>null)),
});

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from("suppliers").select("*").order("name");
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(parsed.error.message, { status: 400 });
  }
  const sb = supabaseServer();
  const { data, error } = await sb.from("suppliers").insert(parsed.data).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data);
}
