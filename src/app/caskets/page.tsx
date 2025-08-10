"use client";

/**
 * LANDMARK: Caskets Page (no notes UI)
 * - Shows due/late badges based on active orders for each casket.
 * - Inventory tiles for On Hand / On Order / Target.
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import type { Casket, Supplier, VOrderEnriched } from "@/lib/types";
import { Input } from "../components/ui/input";

function dueOrLate(casketId: number, orders: VOrderEnriched[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let due = false;
  let late = false;
  for (const o of orders) {
    if (o.item_type !== "casket") continue;
    if (o.status === "ARRIVED") continue;
    if (!o.item_id || o.item_id !== casketId) continue;
    if (!o.expected_date) continue;
    const d = new Date(o.expected_date);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) due = true;
    if (d.getTime() < today.getTime()) late = true;
    if (late) break;
  }
  return { due, late };
}

export default function CasketsPage() {
  const [caskets, setCaskets] = useState<Casket[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<VOrderEnriched[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [cs, ss, oo] = await Promise.all([
        fetch("/api/caskets").then((r) => r.json()),
        fetch("/api/suppliers").then((r) => r.json()),
        fetch("/api/orders").then((r) => r.json()),
      ]);
      setCaskets(cs ?? []);
      setSuppliers(ss ?? []);
      setOrders(oo ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return caskets;
    return caskets.filter((c) => {
      const sname = suppliers.find((s) => s.id === (c as any).supplier_id)?.name ?? "";
      return `${c.name} ${sname}`.toLowerCase().includes(term);
    });
  }, [caskets, suppliers, q]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-white/90 text-lg">Caskets</h1>
        <div className="w-full max-w-sm">
          <Input
            className="input-sm"
            placeholder="Search by name or supplier…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map((c) => {
          const supplier = suppliers.find((s) => s.id === (c as any).supplier_id) || null;

          const { due, late } = dueOrLate(c.id, orders);
          const railColor = late || due ? "rose" : "cyan";

          const onHand = (c as any).on_hand ?? 0;
          const onOrder = (c as any).on_order ?? 0;
          const target = (c as any).target_qty ?? null;
          const below = target != null ? onHand + onOrder < target : false;
          const none = onHand === 0;

          return (
            <HoloPanel key={c.id} rail railColor={railColor} className="flex flex-col pb-10 relative">
              {late ? (
                <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-rose-400/60 text-rose-300 bg-rose-400/10">
                  LATE
                </div>
              ) : due ? (
                <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-amber-400/60 text-amber-300 bg-amber-400/10">
                  DUE
                </div>
              ) : null}

              <div className="text-white/90 text-sm pr-8">{c.name}</div>
              <div className="mt-1 text-xs text-white/60">Supplier: {supplier?.name ?? "—"}</div>

              <div className="mt-3 grid grid-cols-3 text-center text-[11px] text-white/70 gap-2">
                <div className={`rounded-md border border-white/10 py-2 ${none ? "ring-1 ring-rose-400/60" : ""}`}>
                  <div className="text-white/50">On Hand</div>
                  <div className="text-white/90 text-sm">{onHand}</div>
                </div>
                <div className="rounded-md border border-white/10 py-2">
                  <div className="text-white/50">On Order</div>
                  <div className="text-white/90 text-sm">{onOrder}</div>
                </div>
                <div className={`rounded-md border border-white/10 py-2 ${below ? "ring-1 ring-amber-400/60" : ""}`}>
                  <div className="text-white/50">Target</div>
                  <div className="text-white/90 text-sm">{target ?? "—"}</div>
                </div>
              </div>
            </HoloPanel>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full text-white/50 text-sm">No caskets.</div>}
      </div>
    </div>
  );
}
