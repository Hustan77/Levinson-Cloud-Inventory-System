import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { CreateOrderSchema } from "../../../lib/types";

// LANDMARK: GET /api/orders?includeArrived=0|1
export async function GET(req: Request) {
  const url = new URL(req.url);
  const includeArrived = url.searchParams.get("includeArrived") === "1";

  const sb = supabaseServer();

  // Prefer the enriched view; if missing, fall back to orders
  const { data: viewData, error: viewErr } = await sb.from("v_orders_enriched").select("*");
  if (!viewErr && viewData) {
    const rows = includeArrived ? viewData : viewData.filter((r) => r.status !== "ARRIVED");
    return NextResponse.json(rows, { status: 200 });
  }

  const { data, error } = await sb.from("orders").select("*");
  if (error) return new NextResponse(error.message, { status: 500 });

  const rows = includeArrived ? data : data.filter((r) => r.status !== "ARRIVED");
  return NextResponse.json(rows, { status: 200 });
}

// LANDMARK: POST /api/orders (create)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(parsed.error.errors.map((e) => e.message).join("; "), { status: 400 });
  }

  const sb = supabaseServer();
  const payload = parsed.data;

  // Server-side validation mirrors UI rules
  if (!payload.special_order && !payload.item_id) {
    return new NextResponse("Normal order requires item_id.", { status: 400 });
  }
  if (payload.special_order && !payload.item_name) {
    return new NextResponse("Special order requires item_name.", { status: 400 });
  }
  if (!payload.backordered && !payload.expected_date) {
    return new NextResponse("Provide expected_date or mark Backordered/TBD.", { status: 400 });
  }
  if (!payload.backordered && payload.tbd_expected) {
    return new NextResponse("TBD cannot be selected when not backordered.", { status: 400 });
  }
  if (payload.special_order && !payload.need_by_date) {
    // business: special orders must have a deadline
    return new NextResponse("Special order requires a need_by_date (deadline).", { status: 400 });
  }

  // status derivation
  const status = payload.special_order ? "SPECIAL" : (payload.backordered ? "BACKORDERED" : "PENDING");

  const { data, error } = await sb
    .from("orders")
    .insert({
      item_type: payload.item_type,
      item_id: payload.special_order ? null : payload.item_id,
      item_name: payload.special_order ? payload.item_name : null,
      supplier_id: payload.supplier_id ?? null,
      po_number: payload.po_number,
      expected_date: payload.expected_date,
      status,
      backordered: payload.backordered,
      tbd_expected: payload.tbd_expected,
      special_order: payload.special_order,
      deceased_name: payload.deceased_name ?? null,
      need_by_date: payload.need_by_date ?? null,
      is_return: payload.is_return ?? false,
      return_reason: payload.return_reason ?? null,
    })
    .select("*")
    .single();

  if (error) return new NextResponse(error.message, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
