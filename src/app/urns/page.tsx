"use client";

/**
 * URNS: compact card actions with icon buttons (edit, adjust, delete)
 * - Mirrors caskets layout; includes filters for category, green, supplier, dims.
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Supplier, Urn } from "../../lib/types";

// Icon sprites (same look as caskets)
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
  category: "" | "FULL" | "KEEPSAKE" | "JEWELRY" | "SPECIAL";
  green: "" | "yes" | "no";
  minW?: string; maxW?: string;
  minH?: string; maxH?: string;
  minD?: string; maxD?: string;
  q: string;
};

export default function UrnsPage() {
  const [rows, setRows] = useState<Urn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<Filters>({ supplier: "", category: "", green: "", q: "" });
  const [openModal, setOpenModal] = useState<null | { mode: "add" } | { mode: "edit", row: Urn }>(null);
  const [adjusting, setAdjusting] = useState<null | Urn>(null);

  async function load() {
    const [u, s] = await Promise.all([
      fetch("/api/urns", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/suppliers", { cache: "no-store" }).then(r => r.json()),
    ]);
    setRows(u); setSuppliers(s);
  }
  useEffect(()=>{ load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filters.supplier && r.supplier_id !== filters.supplier) return false;
      if (filters.category && (r.category as any) !== filters.category) return false;
      if (filters.green === "yes" && !r.green) return false;
      if (filters.green === "no"  && r.green) return false;
      const within = (v:number|null|undefined,min?:string,max?:string)=> {
        if (v==null) return true;
        if (min && v < Number(min)) return false;
        if (max && v > Number(max)) return false;
        return true;
      };
      if (!within(r.width_in as any,  filters.minW, filters.maxW)) return false;
      if (!within(r.height_in as any, filters.minH, filters.maxH)) return false;
      if (!within(r.depth_in as any,  filters.minD, filters.maxD)) return false;
      if (filters.q) {
        const t = `${r.name}`.toLowerCase();
        if (!t.includes(filters.q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, filters]);

  function available(r: Urn) { return (r.on_hand ?? 0) + (r.on_order ?? 0); }
  function shortBy(r: Urn) { return Math.max(0, (r.target_qty ?? 0) - available(r)); }
  function isFull(r: Urn) { return available(r) >= (r.target_qty ?? 0); }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">Urns</h1>
        <Button variant="default" onClick={()=>setOpenModal({ mode: "add" })}>Add Urn</Button>
      </div>

      <HoloPanel railColor="cyan">
        <div className="text-xs text-white/60 mb-2">Filters</div>
        <div className="grid md:grid-cols-6 gap-2">
          <LabeledSelect label="Supplier" value={filters.supplier} onChange={(v)=>setFilters(f=>({...f, supplier: v}))}>
            <option value="">Any</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </LabeledSelect>

          <LabeledSelect label="Category" value={filters.category} onChange={(v)=>setFilters(f=>({...f, category: v as any}))}>
            <option value="">Any</option>
            <option value="FULL">Full</option>
            <option value="KEEPSAKE">Keepsake</option>
            <option value="JEWELRY">Jewelry</option>
            <option value="SPECIAL">Special</option>
          </LabeledSelect>

          <LabeledSelect label="Green" value={filters.green} onChange={(v)=>setFilters(f=>({...f, green: v as any}))}>
            <option value="">Any</option><option value="yes">Green Only</option><option value="no">Exclude Green</option>
          </LabeledSelect>

          <div className="space-y-1">
            <div className="label-xs">Search</div>
            <Input className="input-sm" placeholder="Name..." value={filters.q} onChange={e=>setFilters(f=>({...f, q: e.target.value}))}/>
          </div>
        </div>

        <div className="grid md:grid-cols-6 gap-2 mt-3">
          <Dim label="Width (in)"  min={filters.minW} max={filters.maxW} onMin={v=>setFilters(f=>({...f, minW:v}))} onMax={v=>setFilters(f=>({...f, maxW:v}))}/>
          <Dim label="Height (in)" min={filters.minH} max={filters.maxH} onMin={v=>setFilters(f=>({...f, minH:v}))} onMax={v=>setFilters(f=>({...f, maxH:v}))}/>
          <Dim label="Depth (in)"  min={filters.minD} max={filters.maxD} onMin={v=>setFilters(f=>({...f, minD:v}))} onMax={v=>setFilters(f=>({...f, maxD:v}))}/>
        </div>
      </HoloPanel>

      {/* LANDMARK: Cards grid with compact icon actions */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map(row => (
          <HoloPanel key={row.id} railColor="purple" className="min-h-[200px] relative">
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
                  if(!confirm("Delete this urn?")) return;
                  const res = await fetch(`/api/urns/${row.id}`, { method: "DELETE" });
                  if(!res.ok){ alert(await res.text()); return; }
                  load();
                }}
                ariaLabel={`Delete ${row.name}`}
              >
                <IconTrash className="text-rose-400" />
              </IconButton>
            </div>

            <div className="pr-16">
              <div className="text-white/90">{row.name}</div>
              <div className="text-xs text-white/60 mt-1">
                Supplier: {suppliers.find(s=>s.id===row.supplier_id)?.name ?? "—"}
              </div>
              <div className="text-xs text-white/60 mt-1 flex gap-3">
                <span>Category: {row.category}</span>
                <span>{row.green ? "Green" : "—"}</span>
              </div>
              <div className="text-xs text-white/60 mt-1">
                {row.width_in ?? "—"}W × {row.height_in ?? "—"}H × {row.depth_in ?? "—"}D
              </div>
              <div className="mt-2 text-xs space-y-0.5">
                <div>Target: <b>{row.target_qty}</b></div>
                <div>On hand: <b>{row.on_hand}</b> • On order: <b>{row.on_order}</b> • Backorders: <b className="text-rose-300">{row.backordered_count}</b></div>
                <div className={isFull(row) ? "text-emerald-300" : "text-amber-300"}>
                  {isFull(row) ? "Full" : `Short by ${shortBy(row)}`}
                </div>
              </div>
            </div>
          </HoloPanel>
        ))}
      </div>

      {openModal && (
        <UrnModal
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
            const res = await fetch(`/api/urns/${adjusting.id}`, {
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

/* LANDMARK: Urn Modal (Add/Edit) */
function UrnModal({ mode, row, suppliers, onClose, onSaved }:{
  mode: "add"|"edit";
  row?: Urn;
  suppliers: Supplier[];
  onClose: ()=>void;
  onSaved: ()=>void;
}) {
  const [name, setName] = useState(row?.name ?? "");
  const [supplierId, setSupplierId] = useState<number | "">(row?.supplier_id ?? "");
  const [w, setW] = useState<string>(row?.width_in?.toString() ?? "");
  const [h, setH] = useState<string>(row?.height_in?.toString() ?? "");
  const [d, setD] = useState<string>(row?.depth_in?.toString() ?? "");
  const [category, setCategory] = useState<"FULL"|"KEEPSAKE"|"JEWELRY"|"SPECIAL">(row?.category as any ?? "FULL");
  const [green, setGreen] = useState<boolean>(row?.green ?? false);
  const [target, setTarget] = useState<string>((row?.target_qty ?? 0).toString());

  async function save() {
    const payload = {
      name: name.trim(),
      supplier_id: supplierId === "" ? null : Number(supplierId),
      width_in: w ? Number(w) : null,
      height_in: h ? Number(h) : null,
      depth_in: d ? Number(d) : null,
      category, green,
      target_qty: Number(target) || 0,
    };
    const url = mode==="add" ? "/api/urns" : `/api/urns/${row!.id}`;
    const method = mode==="add" ? "POST" : "PATCH";
    const res = await fetch(url, { method, body: JSON.stringify(payload) });
    if(!res.ok){ alert(await res.text()); return; }
    onClose(); onSaved();
  }

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40">
      <HoloPanel railColor="purple" className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/90">{mode==="add" ? "Add Urn" : "Edit Urn"}</div>
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
          <div className="space-y-1"><div className="label-xs">Width (in)</div><Input className="input-sm" value={w} onChange={e=>setW(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">Height (in)</div><Input className="input-sm" value={h} onChange={e=>setH(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">Depth (in)</div><Input className="input-sm" value={d} onChange={e=>setD(e.target.value)} /></div>
          <div className="space-y-1">
            <div className="label-xs">Category</div>
            <select className="select-sm w-full" value={category} onChange={e=>setCategory(e.target.value as any)}>
              <option value="FULL">Full</option>
              <option value="KEEPSAKE">Keepsake</option>
              <option value="JEWELRY">Jewelry</option>
              <option value="SPECIAL">Special</option>
            </select>
          </div>
          <div className="col-span-2 flex gap-6 mt-1">
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
  row: Urn; onClose:()=>void; onSaved:(delta:number)=>void;
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
