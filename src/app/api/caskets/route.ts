import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from("caskets").select("id,name,supplier_id").order("name");
  if (error) return NextResponse.text(error.message, { status: 500 });
  return NextResponse.json(data ?? [], { status: 200 });
}
