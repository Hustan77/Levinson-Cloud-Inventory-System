"use client";

/**
 * LANDMARK: Caskets Page — Inventory‑only
 * - NO order information and NO notes.
 * - Shows status: FULL / SHORT / NONE ON HAND based on on_hand, on_order, target_qty.
 * - Displays supplier, material (Wood/Metal/Green Burial), Jewish (yes/no),
 *   and interior/exterior dimensions (inches).
 * - Compact, readable grid; future‑panel vibe preserved.
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import type { Casket, Supplier } from "@/lib/types";
import { Input } from "../components/ui/input";

type Status = "FULL" | "SHORT" | "NONE";

function computeStatus(onHand: number, onOrder: number, target: number | null): Status {
  if (onHand <= 0) return "NONE";
  if (target != null && onHand + onOrder < target) return "SHORT";
  return "FULL";
}

function statusColors(s: Status) {
  switch (s) {
    case "NONE":
      return { rail: "rose", badge: "border-rose-400/60 text-rose-300 bg-rose-400/10" };
    case "SHORT":
      return { rail: "amber", badge: "border-amber-400/60 text-amber-300 bg-amber-400/10" };
    default:
      return { rail: "emerald", badge: "border-emerald-400/60 text-emerald-300 bg-emerald-400/10" };
  }
}

export default function CasketsPage() {
  const [caskets, setCaskets] = useState<Casket[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [cs, ss] = await Promise.all([
        fetch("/api/caskets").then((r) => r.json()),
        fetch("/api/suppliers").then((r) => r.json()),
      ]);
      setCaskets(cs ?? []);
      setSuppliers(ss ?? []);
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
      {/* LANDMARK: Header + search */}
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

      {/* LANDMARK: Card grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map((c) => {
          const s = suppliers.find((x) => x.id === (c as any).supplier_id) || null;

          const onHand = (c as any).on_hand ?? 0;
          const onOrder = (c as any).on_order ?? 0;
          const target = (c as any).target_qty ?? null;

          const status = computeStatus(onHand, onOrder, target);
          const { rail, badge } = statusColors(status);

          const material = (c as any).material ?? null; // "WOOD" | "METAL" | "GREEN"
          const jewish = !!(c as any).jewish;
          const green = !!(c as any).green;

          const ew = (c as any).ext_width ?? null;
          const el = (c as any).ext_length ?? null;
          const eh = (c as any).ext_height ?? null;

          const iw = (c as any).int_width ?? null;
          const il = (c as any).int_length ?? null;
          const ih = (c as any).int_height ?? null;

          return (
            <HoloPanel key={c.id} rail railColor={rail} className="flex flex-col gap-3">
              {/* LANDMARK: Title + status */}
              <div className="flex items-start gap-2">
                <div className="text-white/90 text-sm truncate">{c.name}</div>
                <div className={`ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${badge}`}>
                  {status === "NONE" ? "NONE ON HAND" : status}
                </div>
              </div>

              {/* LANDMARK: Supplier / Category row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70">
                <div className="truncate">
                  <span className="text-white/50">Supplier:</span>{" "}
                  <span className="text-white/80">{s?.name ?? "—"}</span>
                </div>
                <div className="truncate">
                  <span className="text-white/50">Material:</span>{" "}
                  <span className="text-white/80">
                    {material === "WOOD" ? "Wood" : material === "METAL" ? "Metal" : material === "GREEN" ? "Green Burial" : "—"}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-white/50">Jewish:</span>{" "}
                  <span className="text-white/80">{jewish ? "Yes" : "No"}</span>
                </div>
                <div className="truncate">
                  <span className="text-white/50">Green:</span>{" "}
                  <span className="text-white/80">{green ? "Yes" : "No"}</span>
                </div>
              </div>

              {/* LANDMARK: Inventory tiles */}
              <div className="grid grid-cols-3 text-center text-[11px] text-white/70 gap-2">
                <div className={`rounded-md border border-white/10 py-2 ${onHand === 0 ? "ring-1 ring-rose-400/60" : ""}`}>
                  <div className="text-white/50">On Hand</div>
                  <div className="text-white/90 text-sm">{onHand}</div>
                </div>
                <div className="rounded-md border border-white/10 py-2">
                  <div className="text-white/50">On Order</div>
                  <div className="text-white/90 text-sm">{onOrder}</div>
                </div>
                <div className={`rounded-md border border-white/10 py-2 ${target != null && onHand + onOrder < target ? "ring-1 ring-amber-400/60" : ""}`}>
                  <div className="text-white/50">Target</div>
                  <div className="text-white/90 text-sm">{target ?? "—"}</div>
                </div>
              </div>

              {/* LANDMARK: Dimensions */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-white/60 text-[11px] mb-1">Exterior (in)</div>
                  <div className="text-white/80">
                    W {ew ?? "—"} × L {el ?? "—"} × H {eh ?? "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <div className="text-white/60 text-[11px] mb-1">Interior (in)</div>
                  <div className="text-white/80">
                    W {iw ?? "—"} × L {il ?? "—"} × H {ih ?? "—"}
                  </div>
                </div>
              </div>
            </HoloPanel>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-white/50 text-sm">No caskets.</div>
        )}
      </div>
    </div>
  );
}
