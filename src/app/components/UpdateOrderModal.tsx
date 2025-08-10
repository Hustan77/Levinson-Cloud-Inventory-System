"use client";

/**
 * LANDMARK: UpdateOrderModal
 * - Self-contained Zod schema (no import from lib/types)
 * - Simple overlay modal (no Radix, avoids DialogTitle warnings)
 * - Edits: PO, status, expected date (or TBD if backordered), notes
 * - PATCH /api/orders/[id]
 */

import React, { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { VOrderEnriched } from "../../lib/types";

// LANDMARK: local zod schema (keeps Next build happy)
const DateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD")
  .nullable()
  .optional();

const UpdateOrderPatchSchema = z.object({
  po_number: z.string().min(1).optional(),
  expected_date: DateStr,
  backordered: z.boolean().optional(),
  tbd_expected: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["PENDING", "BACKORDERED", "ARRIVED", "SPECIAL"]).optional(),
  need_by_date: DateStr.optional(),
  is_return: z.boolean().optional(),
  item_type: z.enum(["casket", "urn"]).optional(),
  item_id: z.number().int().nullable().optional(),
  item_name: z.string().nullable().optional(),
  supplier_id: z.number().int().optional(),
});

export function UpdateOrderModal({
  order,
  onUpdated,
}: {
  order: VOrderEnriched;
  onUpdated?: () => void;
}) {
  const [open, setOpen] = useState(false);

  // form state
  const [po, setPo] = useState(order.po_number ?? "");
  const [status, setStatus] = useState<VOrderEnriched["status"]>(order.status);
  const [backordered, setBackordered] = useState<boolean>(order.backordered ?? false);
  const [tbd, setTbd] = useState<boolean>(order.tbd_expected ?? false);
  const [expected, setExpected] = useState<string>(order.expected_date ?? "");
  const [notes, setNotes] = useState<string>(order.notes ?? "");

  // keep in sync if parent changes
  useEffect(() => {
    setPo(order.po_number ?? "");
    setStatus(order.status);
    setBackordered(order.backordered ?? false);
    setTbd(order.tbd_expected ?? false);
    setExpected(order.expected_date ?? "");
    setNotes(order.notes ?? "");
  }, [order]);

  async function submit() {
    const payload = {
      po_number: po.trim() || undefined,
      status,
      backordered,
      tbd_expected: backordered ? tbd : false,
      expected_date: backordered ? (tbd ? null : (expected || null)) : (expected || null),
      notes: notes || null,
    };

    const parsed = UpdateOrderPatchSchema.safeParse(payload);
    if (!parsed.success) {
      alert(parsed.error.message);
      return;
    }

    // guardrail: if backordered, require date or tbd
    if (payload.backordered) {
      if (!payload.tbd_expected && !payload.expected_date) {
        alert("Provide expected_date or mark TBD for backorders.");
        return;
      }
    }

    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      alert(`Update failed: ${txt}`);
      return;
    }

    setOpen(false);
    onUpdated?.();
  }

  return (
    <>
      {/* You can place this trigger wherever you need. Hidden by default if not used directly */}
      <button
        type="button"
        className="hidden"
        onClick={() => setOpen(true)}
        aria-hidden
        tabIndex={-1}
      >
        Open Update Order
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-2xl mx-4 rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl p-5 shadow-[0_0_60px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-auto">
            {/* LANDMARK: title to satisfy a11y without Radix */}
            <h2 className="text-white/90 text-sm mb-3">Edit Order #{order.id}</h2>

            <div className="grid md:grid-cols-3 gap-3 mb-3">
              <div className="md:col-span-2">
                <div className="label-xs">PO#</div>
                <Input className="input-sm" value={po} onChange={(e) => setPo(e.target.value)} />
              </div>
              <div>
                <div className="label-xs">Status</div>
                <select
                  className="select-sm w-full text-white bg-white/5 border border-white/10 rounded-md"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as VOrderEnriched["status"])}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="BACKORDERED">BACKORDERED</option>
                  <option value="SPECIAL">SPECIAL</option>
                  <option value="ARRIVED">ARRIVED</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mb-3">
              <div>
                <div className="label-xs">Backordered?</div>
                <label className="inline-flex items-center gap-2 text-white/80 text-sm h-9">
                  <input
                    type="checkbox"
                    className="accent-rose-400"
                    checked={backordered}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setBackordered(v);
                      if (!v) {
                        setTbd(false);
                      }
                    }}
                  />
                  Backordered
                </label>
              </div>
              <div>
                <div className="label-xs">Expected date</div>
                <Input
                  className="input-sm"
                  type="date"
                  value={expected}
                  onChange={(e) => {
                    setExpected(e.target.value);
                    setTbd(false);
                  }}
                  disabled={backordered && tbd}
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-white/80 text-sm">
                  <input
                    type="checkbox"
                    className="accent-rose-400"
                    checked={tbd}
                    onChange={(e) => {
                      setTbd(e.target.checked);
                      if (e.target.checked) {
                        setExpected("");
                      }
                    }}
                    disabled={!backordered}
                  />
                  TBD
                </label>
              </div>
            </div>

            <div className="mb-4">
              <div className="label-xs">Notes</div>
              <Input
                className="input-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes…"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={submit} disabled={!po.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UpdateOrderModal;
