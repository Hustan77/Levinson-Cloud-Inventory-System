import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from("suppliers").select("id,name,ordering_instructions").order("name", { ascending: true });
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data ?? [], { status: 200 });
}
