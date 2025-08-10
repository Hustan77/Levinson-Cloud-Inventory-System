// LANDMARK: Orders [id] PATCH route — context param untyped to satisfy Next 15 validator
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { z } from "zod";

// LANDMARK: zod for date string (YYYY-MM-DD) or null/undefined
const DateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
  .nullable()
  .optional();

const UpdateOrderSchema = z.object({
  // core editable fields
  po_number: z.string().min(1).optional(),
  expected_date: DateStr,
  backordered: z.boolean().optional(),
  tbd_expected: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["PENDING", "BACKORDERED", "ARRIVED", "SPECIAL"]).optional(),

  // optional meta
  need_by_date: DateStr,
  is_return: z.boolean().optional(),

  // editable linkages (admin edits)
  item_type: z.enum(["casket", "urn"]).optional(),
  item_id: z.number().int().nullable().optional(),
  item_name: z.string().nullable().optional(),
  supplier_id: z.number().int().optional(),
});

export async function PATCH(req: Request, context: any) {
  // NOTE: Leaving context untyped avoids Next 15 “invalid second argument type” error.
  const idRaw = context?.params?.id;
  const idNum = Number(idRaw);
  if (!idNum) return new NextResponse("Invalid id", { status: 400 });

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const parsed = UpdateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(parsed.error.message, { status: 400 });
  }

  const update = parsed.data;

  // Business rule guardrails:
  // If backordered is true, expected_date may be null only when tbd_expected=true.
  if (update.backordered === true) {
    if (update.tbd_expected !== true && (update.expected_date == null || update.expected_date === "")) {
      return new NextResponse("Provide expected_date or set tbd_expected=true for backorders", { status: 400 });
    }
  }

  // LANDMARK: persist patch
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("orders")
    .update(update)
    .eq("id", idNum)
    .select("*")
    .single();

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json(data);
}
