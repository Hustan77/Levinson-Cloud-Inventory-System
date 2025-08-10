"use client";

/**
 * LANDMARK: Urns Page — Inventory‑only
 * - NO order information and NO notes.
 * - Status: FULL / SHORT / NONE ON HAND (on_hand, on_order, target_qty).
 * - Displays supplier, category (Full Size / Keepsake / Jewelry / Special Use),
 *   and exterior dimensions (inches). (Urns typically don’t need interior dims.)
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import type { Supplier, Urn } from "@/lib/types";
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

export default function UrnsPage() {
  const [urns, setUrns] = useState<Urn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [us, ss] = await Promise.all([
        fetch("/api/urns").then((r) => r.json()),
        fetch("/api/suppliers").then((r) => r.json()),
      ]);
      setUrns(us ?? []);
      setSuppliers(ss ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return urns;
    return urns.filter((u) => {
      const sname = suppliers.find((s) => s.id === (u as any).supplier_id)?.name ?? "";
      return `${u.name} ${sname}`.toLowerCase().includes(term);
    });
  }, [urns, suppliers, q]);

  return (
    <div className="p-6 space-y-4">
      {/* LANDMARK: Header + search */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-white/90 text-lg">Urns</h1>
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
        {filtered.map((u) => {
          const s = suppliers.find((x) => x.id === (u as any).supplier_id) || null;

          const onHand = (u as any).on_hand ?? 0;
          const onOrder = (u as any).on_order ?? 0;
          const target = (u as any).target_qty ?? null;

          const status = computeStatus(onHand, onOrder, target);
          const { rail, badge } = statusColors(status);

          const category = (u as any).category ?? null; // "Full Size" | "Keepsake" | "Jewelry" | "Special Use"
          const w = (u as any).width ?? null;
          const l = (u as any).length ?? null;
          const h = (u as any).height ?? null;
          const green = !!(u as any).green;

          return (
            <HoloPanel key={u.id} rail railColor={rail} className="flex flex-col gap-3">
              {/* LANDMARK: Title + status */}
              <div className="flex items-start gap-2">
                <div className="text-white/90 text-sm truncate">{u.name}</div>
                <div className={`ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${badge}`}>
                  {status === "NONE" ? "NONE ON HAND" : status}
                </div>
              </div>

              {/* LANDMARK: Supplier / Category */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70">
                <div className="truncate">
                  <span className="text-white/50">Supplier:</span>{" "}
                  <span className="text-white/80">{s?.name ?? "—"}</span>
                </div>
                <div className="truncate">
                  <span className="text-white/50">Category:</span>{" "}
                  <span className="text-white/80">{category ?? "—"}</span>
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

              {/* LANDMARK: Dimensions (exterior, in) */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
                <div className="text-white/60 text-[11px] mb-1">Dimensions (in)</div>
                <div className="text-white/80">
                  W {w ?? "—"} × L {l ?? "—"} × H {h ?? "—"}
                </div>
              </div>
            </HoloPanel>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-white/50 text-sm">No urns.</div>
        )}
      </div>
    </div>
  );
}
