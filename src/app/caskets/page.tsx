"use client";

/**
 * Caskets inventory page
 * - SINGLE Jewish / Green toggles (no extra filter chips)
 * - Crisp layout
 * - Dimensions: tolerant to many DB column names (ext_width/ext_w/exterior_width, etc.)
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import type { Casket, Supplier } from "@/lib/types";
import { Input } from "../components/ui/input";

type Status = "FULL" | "SHORT" | "NONE";
type Range = { min?: number | ""; max?: number | "" };

const toNum = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const pickNumber = (obj: any, keys: string[]): number | null => {
  for (const k of keys) {
    if (k in obj) {
      const n = toNum(obj[k]);
      if (n !== null) return n;
    }
  }
  return null;
};

function computeStatus(onHand: number, onOrder: number, target: number | null): { status: Status; deficit: number } {
  if (onHand <= 0) return { status: "NONE", deficit: Math.max((target ?? 0) - (onHand + onOrder), 0) };
  if (target != null && onHand + onOrder < target) {
    return { status: "SHORT", deficit: Math.max(target - (onHand + onOrder), 0) };
  }
  return { status: "FULL", deficit: 0 };
}

function statusTheme(s: Status) {
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
  const [rows, setRows] = useState<Casket[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");

  const [showFilters, setShowFilters] = useState(true);
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [material, setMaterial] = useState<"" | "WOOD" | "METAL" | "GREEN">("");

  const [onlyJewish, setOnlyJewish] = useState(false);
  const [onlyGreen, setOnlyGreen] = useState(false);

  const [extW, setExtW] = useState<Range>({});
  const [extL, setExtL] = useState<Range>({});
  const [extH, setExtH] = useState<Range>({});
  const [intW, setIntW] = useState<Range>({});
  const [intL, setIntL] = useState<Range>({});
  const [intH, setIntH] = useState<Range>({});

  useEffect(() => {
    (async () => {
      const [cs, ss] = await Promise.all([
        fetch("/api/caskets").then((r) => r.json()),
        fetch("/api/suppliers").then((r) => r.json()),
      ]);
      setRows(cs ?? []);
      setSuppliers(ss ?? []);
    })();
  }, []);

  const inRange = (v: number | null, r: Range) => {
    if (v === null) return true;
    if (r.min !== undefined && r.min !== "" && v < Number(r.min)) return false;
    if (r.max !== undefined && r.max !== "" && v > Number(r.max)) return false;
    return true;
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((c: any) => {
      const sname = suppliers.find((s) => Number(s.id) === Number(c.supplier_id))?.name ?? "";
      if (term && !(`${c.name} ${sname}`.toLowerCase().includes(term))) return false;

      if (supplierId !== "" && Number(c.supplier_id) !== Number(supplierId)) return false;
      if (material && c.material !== material) return false;
      if (onlyJewish && !c.jewish) return false;
      if (onlyGreen && !c.green) return false;

      const onHand = toNum(c.on_hand) ?? 0;
      const onOrder = toNum(c.on_order) ?? 0;
      const target = toNum(c.target_qty);
      const { status } = computeStatus(onHand, onOrder, target);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      const EW = pickNumber(c, ["ext_width", "ext_w", "exterior_width", "width_exterior", "extWidth"]);
      const EL = pickNumber(c, ["ext_length", "ext_l", "exterior_length", "length_exterior", "extLength"]);
      const EH = pickNumber(c, ["ext_height", "ext_h", "exterior_height", "height_exterior", "extHeight"]);
      const IW = pickNumber(c, ["int_width", "int_w", "interior_width", "width_interior", "intWidth"]);
      const IL = pickNumber(c, ["int_length", "int_l", "interior_length", "length_interior", "intLength"]);
      const IH = pickNumber(c, ["int_height", "int_h", "interior_height", "height_interior", "intHeight"]);

      if (!inRange(EW, extW)) return false;
      if (!inRange(EL, extL)) return false;
      if (!inRange(EH, extH)) return false;
      if (!inRange(IW, intW)) return false;
      if (!inRange(IL, intL)) return false;
      if (!inRange(IH, intH)) return false;

      return true;
    });
  }, [
    rows,
    suppliers,
    q,
    supplierId,
    statusFilter,
    material,
    onlyJewish,
    onlyGreen,
    extW,
    extL,
    extH,
    intW,
    intL,
    intH,
  ]);

  return (
    <div className="p-6 space-y-4">
      {/* header */}
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

      {/* filters */}
      {showFilters && (
        <HoloPanel rail railColor="cyan" className="space-y-4 p-4">
          <div className="grid lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] text-white/60 mb-1">Supplier</label>
              <select
                className="w-full bg-transparent border border-white/10 rounded-md h-10 px-2 text-white/80"
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
                className="w-full bg-transparent border border-white/10 rounded-md h-10 px-2 text-white/80"
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
                className="w-full bg-transparent border border-white/10 rounded-md h-10 px-2 text-white/80"
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
              <label className="flex items-center gap-2 text-white/80">
                <input
                  type="checkbox"
                  className="accent-emerald-400"
                  checked={onlyJewish}
                  onChange={(e) => setOnlyJewish(e.target.checked)}
                />
                Jewish only
              </label>
              <label className="flex items-center gap-2 text-white/80">
                <input
                  type="checkbox"
                  className="accent-emerald-400"
                  checked={onlyGreen}
                  onChange={(e) => setOnlyGreen(e.target.checked)}
                />
                Green only
              </label>
            </div>
          </div>

          {/* dimensions */}
          <div className="grid xl:grid-cols-2 gap-4">
            <DimGroup title="Exterior (inches)" w={extW} l={extL} h={extH} onW={setExtW} onL={setExtL} onH={setExtH} />
            <DimGroup title="Interior (inches)" w={intW} l={intL} h={intH} onW={setIntW} onL={setIntL} onH={setIntH} />
          </div>
        </HoloPanel>
      )}

      {/* grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filtered.map((c: any) => {
          const sup = suppliers.find((s) => Number(s.id) === Number(c.supplier_id)) || null;

          const onHand = toNum(c.on_hand) ?? 0;
          const onOrder = toNum(c.on_order) ?? 0;
          const target = toNum(c.target_qty);
          const { status, deficit } = computeStatus(onHand, onOrder, target);
          const theme = statusTheme(status);

          const ew = pickNumber(c, ["ext_width", "ext_w", "exterior_width", "width_exterior", "extWidth"]);
          const el = pickNumber(c, ["ext_length", "ext_l", "exterior_length", "length_exterior", "extLength"]);
          const eh = pickNumber(c, ["ext_height", "ext_h", "exterior_height", "height_exterior", "extHeight"]);
          const iw = pickNumber(c, ["int_width", "int_w", "interior_width", "width_interior", "intWidth"]);
          const il = pickNumber(c, ["int_length", "int_l", "interior_length", "length_interior", "intLength"]);
          const ih = pickNumber(c, ["int_height", "int_h", "interior_height", "height_interior", "intHeight"]);

          return (
            <HoloPanel key={c.id} rail railColor={theme.rail} className="flex flex-col gap-4 p-4">
              <div className="flex items-start gap-2">
                <div className="text-white/90 text-sm truncate">{c.name}</div>
                <div className={`ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${theme.badge}`}>
                  {status === "NONE" ? "NONE ON HAND" : status === "SHORT" ? `SHORT by ${deficit}` : "FULL"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-white/70">
                <div className="truncate">
                  <span className="text-white/50">Supplier:</span>{" "}
                  <span className="text-white/80">{sup?.name ?? "—"}</span>
                </div>
                <div className="truncate">
                  <span className="text-white/50">Material:</span>{" "}
                  <span className="text-white/80">
                    {c.material === "WOOD" ? "Wood" : c.material === "METAL" ? "Metal" : c.material === "GREEN" ? "Green Burial" : "—"}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-white/50">Jewish:</span>{" "}
                  <span className="text-white/80">{c.jewish ? "Yes" : "No"}</span>
                </div>
                <div className="truncate">
                  <span className="text-white/50">Green:</span>{" "}
                  <span className="text-white/80">{c.green ? "Yes" : "No"}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 text-center text-[11px] text-white/70 gap-2">
                <StatTile label="On Hand" value={onHand} ring={onHand === 0 ? "ring-rose-400/60" : ""} />
                <StatTile label="On Order" value={onOrder} />
                <StatTile
                  label="Target"
                  value={target ?? "—"}
                  ring={target != null && onHand + onOrder < target ? "ring-amber-400/60" : ""}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <DimSlab title="Exterior (inches)" w={ew} l={el} h={eh} />
                <DimSlab title="Interior (inches)" w={iw} l={il} h={ih} />
              </div>
            </HoloPanel>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full text-white/50 text-sm">No caskets.</div>}
      </div>
    </div>
  );
}

/* helpers */
type DimGroupProps = {
  title: string;
  w: Range;
  l: Range;
  h: Range;
  onW: (r: Range) => void;
  onL: (r: Range) => void;
  onH: (r: Range) => void;
};

function DimGroup({ title, w, l, h, onW, onL, onH }: DimGroupProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] text-white/60 mb-2">{title}</div>
      <div className="grid sm:grid-cols-3 gap-3">
        <DimRange label="Width" value={w} onChange={onW} />
        <DimRange label="Length" value={l} onChange={onL} />
        <DimRange label="Height" value={h} onChange={onH} />
      </div>
    </div>
  );
}

function DimRange({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Range;
  onChange: (next: Range) => void;
}) {
  const normalize = (v: string) => (v === "" ? "" : Number(v));
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-1">{label}</div>
      <div className="flex gap-2">
        <Input
          placeholder="min"
          value={value.min ?? ""}
          onChange={(e) => onChange({ ...value, min: normalize(e.target.value) })}
          className="h-9"
          inputMode="numeric"
        />
        <Input
          placeholder="max"
          value={value.max ?? ""}
          onChange={(e) => onChange({ ...value, max: normalize(e.target.value) })}
          className="h-9"
          inputMode="numeric"
        />
      </div>
    </div>
  );
}

function StatTile({ label, value, ring = "" }: { label: string; value: number | string; ring?: string }) {
  return (
    <div className={`rounded-md border border-white/10 py-2 ${ring ? `ring-1 ${ring}` : ""}`}>
      <div className="text-white/50">{label}</div>
      <div className="text-white/90 text-sm">{value}</div>
    </div>
  );
}

function DimSlab({ title, w, l, h }: { title: string; w: number | null; l: number | null; h: number | null }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-white/60 text-[11px] mb-1">{title}</div>
      <div className="text-white/80 text-sm leading-6">
        <span className="text-white/60">W</span> {w ?? "—"}{" "}
        <span className="text-white/60">× L</span> {l ?? "—"}{" "}
        <span className="text-white/60">× H</span> {h ?? "—"}
      </div>
    </div>
  );
}
