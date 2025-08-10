"use client";

/**
 * LANDMARK: Urns Page — Inventory‑only with clear layout + advanced filters
 * - NO order information and NO notes (per requirement).
 * - Status: FULL / SHORT by N / NONE ON HAND (on_hand, on_order, target_qty).
 * - Clean card layout; single Dimensions slab (W × L × H).
 * - Advanced filters: supplier, status, category (Full Size / Keepsake / Jewelry / Special Use),
 *   Green flag, and numeric ranges for W/L/H.
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import type { Supplier, Urn } from "@/lib/types";
import { Input } from "../components/ui/input";

type Status = "FULL" | "SHORT" | "NONE";
type Range = { min?: number | ""; max?: number | "" };

function computeStatus(onHand: number, onOrder: number, target: number | null): { status: Status; deficit: number } {
  if (onHand <= 0) return { status: "NONE", deficit: target != null ? Math.max(target - (onHand + onOrder), 0) : 0 };
  if (target != null && onHand + onOrder < target) {
    return { status: "SHORT", deficit: Math.max(target - (onHand + onOrder), 0) };
  }
  return { status: "FULL", deficit: 0 };
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
  // LANDMARK: data state
  const [urns, setUrns] = useState<Urn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // LANDMARK: basic search + advanced filters
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [category, setCategory] = useState<"" | "Full Size" | "Keepsake" | "Jewelry" | "Special Use">("");
  const [green, setGreen] = useState<"" | "YES" | "NO">("");

  const [rw, setRw] = useState<Range>({});
  const [rl, setRl] = useState<Range>({});
  const [rh, setRh] = useState<Range>({});

  // LANDMARK: fetch
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

  // LANDMARK: helpers
  const num = (v: string) => (v === "" ? "" : Number(v));
  const inRange = (value: unknown, range: Range) => {
    const v = typeof value === "number" ? value : value == null ? null : Number(value);
    if (v == null || Number.isNaN(v)) return true;
    const { min, max } = range;
    if (min !== undefined && min !== "" && v < Number(min)) return false;
    if (max !== undefined && max !== "" && v > Number(max)) return false;
    return true;
  };

  // LANDMARK: filtering
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return urns.filter((u) => {
      const sname = suppliers.find((s) => s.id === (u as any).supplier_id)?.name ?? "";
      if (term && !(`${u.name} ${sname}`.toLowerCase().includes(term))) return false;

      const onHand = (u as any).on_hand ?? 0;
      const onOrder = (u as any).on_order ?? 0;
      const target = (u as any).target_qty ?? null;
      const { status } = computeStatus(onHand, onOrder, target);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      if (supplierId !== "" && (u as any).supplier_id !== supplierId) return false;

      const cat = (u as any).category ?? null;
      if (category && cat !== category) return false;

      const gr = !!(u as any).green;
      if (green === "YES" && !gr) return false;
      if (green === "NO" && gr) return false;

      const w = (u as any).width ?? null;
      const l = (u as any).length ?? null;
      const h = (u as any).height ?? null;

      if (!inRange(w, rw)) return false;
      if (!inRange(l, rl)) return false;
      if (!inRange(h, rh)) return false;

      return true;
    });
  }, [urns, suppliers, q, supplierId, statusFilter, category, green, rw, rl, rh]);

  return (
    <div className="p-6 space-y-4">
      {/* LANDMARK: Header + search + filters toggle */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-white/90 text-lg">Urns</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-full max-w-sm">
            <Input
              className="input-sm"
              placeholder="Search by name or supplier…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="h-9 px-3 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
          >
            {showFilters ? "Hide filters" : "Advanced filters"}
          </button>
        </div>
      </div>

      {/* LANDMARK: Advanced filters panel */}
      {showFilters && (
        <HoloPanel rail railColor="emerald" className="space-y-3">
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Supplier</label>
              <select
                className="w-full bg-transparent border border-white/10 rounded-md h-9 px-2 text-white/80"
                value={supplierId === "" ? "" : supplierId}
                onChange={(e) => setSupplierId(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">Any</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-white/60 mb-1">Status</label>
              <select
                className="w-full bg-transparent border border-white/10 rounded-md h-9 px-2 text-white/80"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All</option>
                <option value="FULL">Full</option>
                <option value="SHORT">Short</option>
                <option value="NONE">None on hand</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-white/60 mb-1">Category</label>
              <select
                className="w-full bg-transparent border border-white/10 rounded-md h-9 px-2 text-white/80"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="">Any</option>
                <option value="Full Size">Full Size</option>
                <option value="Keepsake">Keepsake</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Special Use">Special Use</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-white/60 mb-1">Green</label>
              <select
                className="w-full bg-transparent border border-white/10 rounded-md h-9 px-2 text-white/80"
                value={green}
                onChange={(e) => setGreen(e.target.value as any)}
              >
                <option value="">Any</option>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </div>
          </div>

          {/* Dimensions (inches) */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] text-white/60 mb-2">Dimensions (inches)</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <div className="text-[11px] text-white/50">Width</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="min"
                    value={rw.min ?? ""}
                    onChange={(e) => setRw((r) => ({ ...r, min: num(e.target.value) }))}
                    className="h-8"
                    inputMode="numeric"
                  />
                  <Input
                    placeholder="max"
                    value={rw.max ?? ""}
                    onChange={(e) => setRw((r) => ({ ...r, max: num(e.target.value) }))}
                    className="h-8"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div>
                <div className="text-[11px] text-white/50">Length</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="min"
                    value={rl.min ?? ""}
                    onChange={(e) => setRl((r) => ({ ...r, min: num(e.target.value) }))}
                    className="h-8"
                    inputMode="numeric"
                  />
                  <Input
                    placeholder="max"
                    value={rl.max ?? ""}
                    onChange={(e) => setRl((r) => ({ ...r, max: num(e.target.value) }))}
                    className="h-8"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div>
                <div className="text-[11px] text-white/50">Height</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="min"
                    value={rh.min ?? ""}
                    onChange={(e) => setRh((r) => ({ ...r, min: num(e.target.value) }))}
                    className="h-8"
                    inputMode="numeric"
                  />
                  <Input
                    placeholder="max"
                    value={rh.max ?? ""}
                    onChange={(e) => setRh((r) => ({ ...r, max: num(e.target.value) }))}
                    className="h-8"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>
          </div>
        </HoloPanel>
      )}

      {/* LANDMARK: Card grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map((u) => {
          const s = suppliers.find((x) => x.id === (u as any).supplier_id) || null;

          const onHand = (u as any).on_hand ?? 0;
          const onOrder = (u as any).on_order ?? 0;
          const target = (u as any).target_qty ?? null;

          const { status, deficit } = computeStatus(onHand, onOrder, target);
          const { rail, badge } = statusColors(status);

          const cat = (u as any).category ?? null;
          const w = (u as any).width ?? null;
          const l = (u as any).length ?? null;
          const h = (u as any).height ?? null;
          const greenFlag = !!(u as any).green;

          return (
            <HoloPanel key={u.id} rail railColor={rail} className="flex flex-col gap-4 p-4">
              {/* LANDMARK: Title + status */}
              <div className="flex items-start gap-2">
                <div className="text-white/90 text-sm truncate">{u.name}</div>
                <div className={`ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${badge}`}>
                  {status === "NONE"
                    ? "NONE ON HAND"
                    : status === "SHORT"
                    ? `SHORT by ${deficit}`
                    : "FULL"}
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
                  <span className="text-white/80">{cat ?? "—"}</span>
                </div>
                <div className="truncate">
                  <span className="text-white/50">Green:</span>{" "}
                  <span className="text-white/80">{greenFlag ? "Yes" : "No"}</span>
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

              {/* LANDMARK: Dimensions slab */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-white/60 text-[11px] mb-1">Dimensions (inches)</div>
                <div className="text-white/80 text-sm">
                  <span className="text-white/60">W</span> {w ?? "—"}{" "}
                  <span className="text-white/60">× L</span> {l ?? "—"}{" "}
                  <span className="text-white/60">× H</span> {h ?? "—"}
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
