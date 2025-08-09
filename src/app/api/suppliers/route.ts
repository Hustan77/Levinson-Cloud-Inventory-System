import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from("suppliers").select("id,name,ordering_instructions").order("name", { ascending: true });
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: Request) {
  const sb = supabaseServer();
  const body = await req.json().catch(() => ({}));
  const { name, ordering_instructions } = body ?? {};
  if (!name) return new NextResponse("name is required", { status: 400 });
  const { data, error } = await sb.from("suppliers").insert({ name, ordering_instructions: ordering_instructions ?? null }).select("*").single();
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
