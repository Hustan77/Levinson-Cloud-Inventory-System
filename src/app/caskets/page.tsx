"use client";

/**
 * CASKETS: compact card actions with icon buttons (edit, adjust, delete)
 * - LANDMARKS are sprinkled for quick scanning.
 * - No extra deps: icons are inline SVGs.
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Casket, Supplier } from "../../lib/types";

// Tiny inline SVGs (no new packages)
// LANDMARK: Icon sprites
const IconEdit = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/>
    <path d="M20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
  </svg>
);
const IconAdjust = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
    <path d="M11 11V3h2v8h8v2h-8v8h-2v-8H3v-2h8z" fill="currentColor"/>
  </svg>
);
const IconTrash = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
    <path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" fill="currentColor"/>
  </svg>
);

type Filters = {
  supplier: number | "";
  material: "" | "WOOD" | "METAL" | "GREEN";
  jewish: "" | "yes" | "no";
  green: "" | "yes" | "no";
  minEW?: string; maxEW?: string; minEL?: string; maxEL?: string; minEH?: string; maxEH?: string;
  minIW?: string; maxIW?: string; minIL?: string; maxIL?: string; minIH?: string; maxIH?: string;
  q: string;
};

export default function CasketsPage() {
  const [rows, setRows] = useState<Casket[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<Filters>({ supplier: "", material: "", jewish: "", green: "", q: "" });
  const [openModal, setOpenModal] = useState<null | { mode: "add" } | { mode: "edit", row: Casket }>(null);
  const [adjusting, setAdjusting] = useState<null | Casket>(null);

  async function load() {
    const [c, s] = await Promise.all([
      fetch("/api/caskets", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/suppliers", { cache: "no-store" }).then(r => r.json()),
    ]);
    setRows(c); setSuppliers(s);
  }
  useEffect(()=>{ load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filters.supplier && r.supplier_id !== filters.supplier) return false;
      if (filters.material && (r.material as any) !== filters.material) return false;
      if (filters.jewish === "yes" && !r.jewish) return false;
      if (filters.jewish === "no"  && r.jewish) return false;
      if (filters.green  === "yes" && !r.green) return false;
      if (filters.green  === "no"  && r.green) return false;
      const num = (x:any)=> x==null? null : Number(x);
      const within = (v:number|null|undefined,min?:string,max?:string)=> {
        if (v==null) return true;
        if (min && v < Number(min)) return false;
        if (max && v > Number(max)) return false;
        return true;
      };
      if (!within(num(r.ext_width_in),  filters.minEW, filters.maxEW)) return false;
      if (!within(num(r.ext_length_in), filters.minEL, filters.maxEL)) return false;
      if (!within(num(r.ext_height_in), filters.minEH, filters.maxEH)) return false;
      if (!within(num(r.int_width_in),  filters.minIW, filters.maxIW)) return false;
      if (!within(num(r.int_length_in), filters.minIL, filters.maxIL)) return false;
      if (!within(num(r.int_height_in), filters.minIH, filters.maxIH)) return false;
      if (filters.q) {
        const t = `${r.name}`.toLowerCase();
        if (!t.includes(filters.q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, filters]);

  // LANDMARK: inventory helpers (backorders do NOT count towards availability)
  function available(r: Casket) {
    return (r.on_hand ?? 0) + (r.on_order ?? 0);
  }
  function shortBy(r: Casket) {
    const tgt = r.target_qty ?? 0;
    return Math.max(0, tgt - available(r));
  }
  function isFull(r: Casket) {
    return available(r) >= (r.target_qty ?? 0);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">Caskets</h1>
        <Button variant="default" onClick={()=>setOpenModal({ mode: "add" })}>Add Casket</Button>
      </div>

      {/* LANDMARK: Filters (explicit header so intent is clear) */}
      <HoloPanel railColor="cyan">
        <div className="text-xs text-white/60 mb-2">Filters</div>
        <div className="grid md:grid-cols-6 gap-2">
          <LabeledSelect label="Supplier" value={filters.supplier} onChange={(v)=>setFilters(f=>({...f, supplier: v}))}>
            <option value="">Any</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </LabeledSelect>

          <LabeledSelect label="Material" value={filters.material} onChange={(v)=>setFilters(f=>({...f, material: v as any}))}>
            <option value="">Any</option>
            <option value="WOOD">Wood</option>
            <option value="METAL">Metal</option>
            <option value="GREEN">Green</option>
          </LabeledSelect>

          <LabeledSelect label="Jewish" value={filters.jewish} onChange={(v)=>setFilters(f=>({...f, jewish: v as any}))}>
            <option value="">Any</option><option value="yes">Yes</option><option value="no">No</option>
          </LabeledSelect>

          <LabeledSelect label="Green" value={filters.green} onChange={(v)=>setFilters(f=>({...f, green: v as any}))}>
            <option value="">Any</option><option value="yes">Green Only</option><option value="no">Exclude Green</option>
          </LabeledSelect>

          <div className="space-y-1">
            <div className="label-xs">Search</div>
            <Input className="input-sm" placeholder="Name..." value={filters.q} onChange={e=>setFilters(f=>({...f, q: e.target.value}))}/>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid md:grid-cols-6 gap-2 mt-3">
          <Dim label="Ext Width (in)"  min={filters.minEW} max={filters.maxEW} onMin={v=>setFilters(f=>({...f, minEW:v}))} onMax={v=>setFilters(f=>({...f, maxEW:v}))}/>
          <Dim label="Ext Length (in)" min={filters.minEL} max={filters.maxEL} onMin={v=>setFilters(f=>({...f, minEL:v}))} onMax={v=>setFilters(f=>({...f, maxEL:v}))}/>
          <Dim label="Ext Height (in)" min={filters.minEH} max={filters.maxEH} onMin={v=>setFilters(f=>({...f, minEH:v}))} onMax={v=>setFilters(f=>({...f, maxEH:v}))}/>
          <Dim label="Int Width (in)"  min={filters.minIW} max={filters.maxIW} onMin={v=>setFilters(f=>({...f, minIW:v}))} onMax={v=>setFilters(f=>({...f, maxIW:v}))}/>
          <Dim label="Int Length (in)" min={filters.minIL} max={filters.maxIL} onMin={v=>setFilters(f=>({...f, minIL:v}))} onMax={v=>setFilters(f=>({...f, maxIL:v}))}/>
          <Dim label="Int Height (in)" min={filters.minIH} max={filters.maxIH} onMin={v=>setFilters(f=>({...f, minIH:v}))} onMax={v=>setFilters(f=>({...f, maxIH:v}))}/>
        </div>
      </HoloPanel>

      {/* LANDMARK: Cards grid with compact icon actions */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map(row => (
          <HoloPanel key={row.id} railColor="purple" className="min-h-[220px] relative">
            {/* Icon bar */}
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <IconButton
                label="Edit"
                onClick={()=>setOpenModal({ mode: "edit", row })}
                ariaLabel={`Edit ${row.name}`}
              >
                <IconEdit className="text-white/80" />
              </IconButton>
              <IconButton
                label="Adjust on‑hand"
                onClick={()=>setAdjusting(row)}
                ariaLabel={`Adjust on hand for ${row.name}`}
              >
                <IconAdjust className="text-emerald-300" />
              </IconButton>
              <IconButton
                label="Delete"
                onClick={async ()=>{
                  if(!confirm("Delete this casket?")) return;
                  const res = await fetch(`/api/caskets/${row.id}`, { method: "DELETE" });
                  if(!res.ok){ alert(await res.text()); return; }
                  load();
                }}
                ariaLabel={`Delete ${row.name}`}
              >
                <IconTrash className="text-rose-400" />
              </IconButton>
            </div>

            <div className="flex items-start justify-between pr-16">
              <div>
                <div className="text-white/90">{row.name}</div>
                <div className="text-xs text-white/60 mt-1">
                  Supplier: {suppliers.find(s=>s.id===row.supplier_id)?.name ?? "—"}
                </div>
                <div className="text-xs text-white/60 mt-1 flex gap-3">
                  <span>Material: {row.material}</span>
                  <span>{row.jewish ? "Jewish" : "Non‑Jewish"}</span>
                  <span>{row.green ? "Green" : "—"}</span>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Ext: {row.ext_width_in ?? "—"}W × {row.ext_length_in ?? "—"}L × {row.ext_height_in ?? "—"}H
                </div>
                <div className="text-xs text-white/60">
                  Int: {row.int_width_in ?? "—"}W × {row.int_length_in ?? "—"}L × {row.int_height_in ?? "—"}H
                </div>
                {/* LANDMARK: Inventory math */}
                <div className="mt-2 text-xs space-y-0.5">
                  <div>Target: <b>{row.target_qty}</b></div>
                  <div>On hand: <b>{row.on_hand}</b> • On order: <b>{row.on_order}</b> • Backorders: <b className="text-rose-300">{row.backordered_count}</b></div>
                  <div className={isFull(row) ? "text-emerald-300" : "text-amber-300"}>
                    {isFull(row) ? "Full" : `Short by ${shortBy(row)}`}
                  </div>
                </div>
              </div>
            </div>
          </HoloPanel>
        ))}
      </div>

      {openModal && (
        <CasketModal
          mode={openModal.mode}
          row={openModal.mode==='edit'? openModal.row : undefined}
          suppliers={suppliers}
          onClose={()=>setOpenModal(null)}
          onSaved={load}
        />
      )}

      {adjusting && (
        <AdjustOnHandModal
          row={adjusting}
          onClose={()=>setAdjusting(null)}
          onSaved={async (delta) => {
            const next = adjusting.on_hand + delta;
            const res = await fetch(`/api/caskets/${adjusting.id}`, {
              method: "PATCH",
              body: JSON.stringify({ on_hand: next })
            });
            if(!res.ok){ alert(await res.text()); return; }
            setAdjusting(null); load();
          }}
        />
      )}
    </div>
  );
}

function LabeledSelect({
  label, value, onChange, children
}: { label:string; value:any; onChange:(v:any)=>void; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="label-xs">{label}</div>
      <select className="select-sm w-full" value={value as any} onChange={e=>onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}

function Dim({ label, min, max, onMin, onMax }: { label: string; min?: string; max?: string; onMin: (v:string)=>void; onMax:(v:string)=>void; }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      <div className="label-xs col-span-3">{label}</div>
      <Input className="input-sm" placeholder="Min" value={min ?? ""} onChange={e=>onMin(e.target.value)} />
      <div className="text-center text-xs text-white/40 self-center">–</div>
      <Input className="input-sm" placeholder="Max" value={max ?? ""} onChange={e=>onMax(e.target.value)} />
    </div>
  );
}

/* LANDMARK: Tiny icon button with tooltip */
function IconButton({
  label, children, onClick, ariaLabel
}: { label:string; children:React.ReactNode; onClick:()=>void; ariaLabel?:string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      title={label}
      className="
        inline-flex items-center justify-center
        h-7 w-7 rounded-md
        bg-white/5 hover:bg-white/10
        border border-white/10
        shadow
        transition ease-[cubic-bezier(.2,.8,.2,1)] duration-150
        focus:outline-none focus:ring-2 focus:ring-cyan-400/60
      "
    >
      {children}
    </button>
  );
}

/* LANDMARK: Casket Modal (Add/Edit) — Target only editable; Jewish & Green side-by-side */
function CasketModal({ mode, row, suppliers, onClose, onSaved }:{
  mode: "add"|"edit";
  row?: Casket;
  suppliers: Supplier[];
  onClose: ()=>void;
  onSaved: ()=>void;
}) {
  const [name, setName] = useState(row?.name ?? "");
  const [supplierId, setSupplierId] = useState<number | "">(row?.supplier_id ?? "");
  const [extW, setExtW] = useState<string>(row?.ext_width_in?.toString() ?? "");
  const [extL, setExtL] = useState<string>(row?.ext_length_in?.toString() ?? "");
  const [extH, setExtH] = useState<string>(row?.ext_height_in?.toString() ?? "");
  const [intW, setIntW] = useState<string>(row?.int_width_in?.toString() ?? "");
  const [intL, setIntL] = useState<string>(row?.int_length_in?.toString() ?? "");
  const [intH, setIntH] = useState<string>(row?.int_height_in?.toString() ?? "");
  const [material, setMaterial] = useState<"WOOD"|"METAL"|"GREEN">(row?.material as any ?? "WOOD");
  const [jewish, setJewish] = useState<boolean>(row?.jewish ?? false);
  const [green, setGreen] = useState<boolean>(row?.green ?? false);
  const [target, setTarget] = useState<string>((row?.target_qty ?? 0).toString());

  async function save() {
    const payload = {
      name: name.trim(),
      supplier_id: supplierId === "" ? null : Number(supplierId),
      ext_width_in: extW ? Number(extW) : null,
      ext_length_in: extL ? Number(extL) : null,
      ext_height_in: extH ? Number(extH) : null,
      int_width_in: intW ? Number(intW) : null,
      int_length_in: intL ? Number(intL) : null,
      int_height_in: intH ? Number(intH) : null,
      material, jewish, green,
      target_qty: Number(target) || 0,
    };
    const url = mode==="add" ? "/api/caskets" : `/api/caskets/${row!.id}`;
    const method = mode==="add" ? "POST" : "PATCH";
    const res = await fetch(url, { method, body: JSON.stringify(payload) });
    if(!res.ok){ alert(await res.text()); return; }
    onClose(); onSaved();
  }

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40">
      <HoloPanel railColor="purple" className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/90">{mode==="add" ? "Add Casket" : "Edit Casket"}</div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1"><div className="label-xs">Name</div><Input value={name} onChange={e=>setName(e.target.value)} /></div>
          <div className="space-y-1">
            <div className="label-xs">Supplier</div>
            <select className="select-sm w-full" value={supplierId} onChange={e=>setSupplierId(e.target.value? Number(e.target.value):"")}>
              <option value="">—</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1"><div className="label-xs">Ext W (in)</div><Input className="input-sm" value={extW} onChange={e=>setExtW(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">Ext L (in)</div><Input className="input-sm" value={extL} onChange={e=>setExtL(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">Ext H (in)</div><Input className="input-sm" value={extH} onChange={e=>setExtH(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">Int W (in)</div><Input className="input-sm" value={intW} onChange={e=>setIntW(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">Int L (in)</div><Input className="input-sm" value={intL} onChange={e=>setIntL(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">Int H (in)</div><Input className="input-sm" value={intH} onChange={e=>setIntH(e.target.value)} /></div>
          <div className="space-y-1">
            <div className="label-xs">Material</div>
            <select className="select-sm w-full" value={material} onChange={e=>setMaterial(e.target.value as any)}>
              <option value="WOOD">Wood</option><option value="METAL">Metal</option><option value="GREEN">Green</option>
            </select>
          </div>

          {/* Checkboxes side-by-side */}
          <div className="col-span-2 flex gap-6 mt-1">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-emerald-400" checked={jewish} onChange={e=>setJewish(e.target.checked)} />
              <span className="text-sm">Jewish</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-emerald-400" checked={green} onChange={e=>setGreen(e.target.checked)} />
              <span className="text-sm">Green</span>
            </label>
          </div>

          <div className="space-y-1">
            <div className="label-xs">Target Qty</div>
            <Input className="input-sm" value={target} onChange={e=>setTarget(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={save}>Save</Button></div>
      </HoloPanel>
    </div>
  );
}

function AdjustOnHandModal({ row, onClose, onSaved }:{
  row: Casket; onClose:()=>void; onSaved:(delta:number)=>void;
}) {
  const [delta, setDelta] = useState<string>("0");
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40">
      <HoloPanel railColor="emerald" className="w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/90">Adjust On‑Hand — {row.name}</div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="space-y-1">
          <div className="label-xs">Delta (use negative to decrease)</div>
          <Input className="input-sm" value={delta} onChange={e=>setDelta(e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={()=>onSaved(Number(delta)||0)}>Apply</Button>
        </div>
      </HoloPanel>
    </div>
  );
}
