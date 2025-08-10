"use client";

/**
 * LANDMARK: Caskets Page — Inventory‑only with clear layout + advanced filters
 * - NO order information and NO notes (per requirement).
 * - Status: FULL / SHORT by N / NONE ON HAND (computed from on_hand, on_order, target_qty).
 * - Clean card layout: title/status, supplier+category row, inventory tiles, two slabs for dimensions.
 * - Advanced filters (collapsible): supplier, status, material (Wood/Metal/Green Burial),
 *   Jewish, Green, and numeric ranges for Exterior/Interior (W/L/H).
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import type { Casket, Supplier } from "@/lib/types";
import { Input } from "../components/ui/input";

type Status = "FULL" | "SHORT" | "NONE";

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

type Range = { min?: number | ""; max?: number | "" };

export default function CasketsPage() {
  // LANDMARK: data state
  const [caskets, setCaskets] = useState<Casket[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // LANDMARK: basic search + advanced filters
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [material, setMaterial] = useState<"" | "WOOD" | "METAL" | "GREEN">("");
  const [jewish, setJewish] = useState<"" | "YES" | "NO">("");
  const [green, setGreen] = useState<"" | "YES" | "NO">("");

  const [extW, setExtW] = useState<Range>({});
  const [extL, setExtL] = useState<Range>({});
  const [extH, setExtH] = useState<Range>({});
  const [intW, setIntW] = useState<Range>({});
  const [intL, setIntL] = useState<Range>({});
  const [intH, setIntH] = useState<Range>({});

  // LANDMARK: fetch
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

  // LANDMARK: helper for safe number compare
  const inRange = (value: unknown, range: Range) => {
    const v = typeof value === "number" ? value : value == null ? null : Number(value);
    if (v == null || Number.isNaN(v)) return true; // if item missing value, don't exclude by range
    const { min, max } = range;
    if (min !== undefined && min !== "" && v < Number(min)) return false;
    if (max !== undefined && max !== "" && v > Number(max)) return false;
    return true;
  };

  // LANDMARK: filtering
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return caskets.filter((c) => {
      const sname = suppliers.find((s) => s.id === (c as any).supplier_id)?.name ?? "";
      if (term && !(`${c.name} ${sname}`.toLowerCase().includes(term))) return false;

      const onHand = (c as any).on_hand ?? 0;
      const onOrder = (c as any).on_order ?? 0;
      const target = (c as any).target_qty ?? null;
      const { status } = computeStatus(onHand, onOrder, target);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      if (supplierId !== "" && (c as any).supplier_id !== supplierId) return false;

      const mat = (c as any).material ?? null; // "WOOD" | "METAL" | "GREEN"
      if (material && mat !== material) return false;

      const jw = !!(c as any).jewish;
      if (jewish === "YES" && !jw) return false;
      if (jewish === "NO" && jw) return false;

      const gr = !!(c as any).green;
      if (green === "YES" && !gr) return false;
      if (green === "NO" && gr) return false;

      // Dimensions (tolerant if missing)
      const ew = (c as any).ext_width ?? null;
      const el = (c as any).ext_length ?? null;
      const eh = (c as any).ext_height ?? null;
      const iw = (c as any).int_width ?? null;
      const il = (c as any).int_length ?? null;
      const ih = (c as any).int_height ?? null;

      if (!inRange(ew, extW)) return false;
      if (!inRange(el, extL)) return false;
      if (!inRange(eh, extH)) return false;
      if (!inRange(iw, intW)) return false;
      if (!inRange(il, intL)) return false;
      if (!inRange(ih, intH)) return false;

      return true;
    });
  }, [
    caskets,
    suppliers,
    q,
    supplierId,
    statusFilter,
    material,
    jewish,
    green,
    extW,
    extL,
    extH,
    intW,
    intL,
    intH,
  ]);

  // LANDMARK: small helper for numeric inputs
  const num = (v: string) => (v === "" ? "" : Number(v));

  return (
    <div className="p-6 space-y-4">
      {/* LANDMARK: Header + search + filters toggle */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-white/90 text-lg">Caskets</h1>
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
        <HoloPanel rail railColor="cyan" className="space-y-3">
          {/* Top row */}
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
              <label className="block text-[11px] text-white/60 mb-1">Material</label>
              <select
                className="w-full bg-transparent border border-white/10 rounded-md h-9 px-2 text-white/80"
                value={material}
                onChange={(e) => setMaterial(e.target.value as any)}
              >
                <option value="">Any</option>
                <option value="WOOD">Wood</option>
                <option value="METAL">Metal</option>
                <option value="GREEN">Green Burial</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/60 mb-1">Jewish</label>
                <select
                  className="w-full bg-transparent border border-white/10 rounded-md h-9 px-2 text-white/80"
                  value={jewish}
                  onChange={(e) => setJewish(e.target.value as any)}
                >
                  <option value="">Any</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
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
          </div>

          {/* Dimensions grid */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[11px] text-white/60 mb-2">Exterior (inches)</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] text-white/50">Width</div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="min"
                      value={extW.min ?? ""}
                      onChange={(e) => setExtW((r) => ({ ...r, min: num(e.target.value) }))}
                      className="h-8"
                      inputMode="numeric"
                    />
                    <Input
                      placeholder="max"
                      value={extW.max ?? ""}
                      onChange={(e) => setExtW((r) => ({ ...r, max: num(e.target.value) }))}
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
                      value={extL.min ?? ""}
                      onChange={(e) => setExtL((r) => ({ ...r, min: num(e.target.value) }))}
                      className="h-8"
                      inputMode="numeric"
                    />
                    <Input
                      placeholder="max"
                      value={extL.max ?? ""}
                      onChange={(e) => setExtL((r) => ({ ...r, max: num(e.target.value) }))}
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
                      value={extH.min ?? ""}
                      onChange={(e) => setExtH((r) => ({ ...r, min: num(e.target.value) }))}
                      className="h-8"
                      inputMode="numeric"
                    />
                    <Input
                      placeholder="max"
                      value={extH.max ?? ""}
                      onChange={(e) => setExtH((r) => ({ ...r, max: num(e.target.value) }))}
                      className="h-8"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-[11px] text-white/60 mb-2">Interior (inches)</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] text-white/50">Width</div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="min"
                      value={intW.min ?? ""}
                      onChange={(e) => setIntW((r) => ({ ...r, min: num(e.target.value) }))}
                      className="h-8"
                      inputMode="numeric"
                    />
                    <Input
                      placeholder="max"
                      value={intW.max ?? ""}
                      onChange={(e) => setIntW((r) => ({ ...r, max: num(e.target.value) }))}
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
                      value={intL.min ?? ""}
                      onChange={(e) => setIntL((r) => ({ ...r, min: num(e.target.value) }))}
                      className="h-8"
                      inputMode="numeric"
                    />
                    <Input
                      placeholder="max"
                      value={intL.max ?? ""}
                      onChange={(e) => setIntL((r) => ({ ...r, max: num(e.target.value) }))}
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
                      value={intH.min ?? ""}
                      onChange={(e) => setIntH((r) => ({ ...r, min: num(e.target.value) }))}
                      className="h-8"
                      inputMode="numeric"
                    />
                    <Input
                      placeholder="max"
                      value={intH.max ?? ""}
                      onChange={(e) => setIntH((r) => ({ ...r, max: num(e.target.value) }))}
                      className="h-8"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </HoloPanel>
      )}

      {/* LANDMARK: Card grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map((c) => {
          const s = suppliers.find((x) => x.id === (c as any).supplier_id) || null;

          const onHand = (c as any).on_hand ?? 0;
          const onOrder = (c as any).on_order ?? 0;
          const target = (c as any).target_qty ?? null;

          const { status, deficit } = computeStatus(onHand, onOrder, target);
          const { rail, badge } = statusColors(status);

          const mat = (c as any).material ?? null; // "WOOD" | "METAL" | "GREEN"
          const jewish = !!(c as any).jewish;
          const greenFlag = !!(c as any).green;

          // LANDMARK: Ensure dimensions display (names match schema in repo)
          const ew = (c as any).ext_width ?? null;
          const el = (c as any).ext_length ?? null;
          const eh = (c as any).ext_height ?? null;
          const iw = (c as any).int_width ?? null;
          const il = (c as any).int_length ?? null;
          const ih = (c as any).int_height ?? null;

          return (
            <HoloPanel key={c.id} rail railColor={rail} className="flex flex-col gap-4 p-4">
              {/* LANDMARK: Title + status */}
              <div className="flex items-start gap-2">
                <div className="text-white/90 text-sm truncate">{c.name}</div>
                <div className={`ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${badge}`}>
                  {status === "NONE"
                    ? "NONE ON HAND"
                    : status === "SHORT"
                    ? `SHORT by ${deficit}`
                    : "FULL"}
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
                    {mat === "WOOD" ? "Wood" : mat === "METAL" ? "Metal" : mat === "GREEN" ? "Green Burial" : "—"}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-white/50">Jewish:</span>{" "}
                  <span className="text-white/80">{jewish ? "Yes" : "No"}</span>
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

              {/* LANDMARK: Dimension slabs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white/60 text-[11px] mb-1">Exterior (inches)</div>
                  <div className="text-white/80 text-sm">
                    <span className="text-white/60">W</span> {ew ?? "—"}{" "}
                    <span className="text-white/60">× L</span> {el ?? "—"}{" "}
                    <span className="text-white/60">× H</span> {eh ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white/60 text-[11px] mb-1">Interior (inches)</div>
                  <div className="text-white/80 text-sm">
                    <span className="text-white/60">W</span> {iw ?? "—"}{" "}
                    <span className="text-white/60">× L</span> {il ?? "—"}{" "}
                    <span className="text-white/60">× H</span> {ih ?? "—"}
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
