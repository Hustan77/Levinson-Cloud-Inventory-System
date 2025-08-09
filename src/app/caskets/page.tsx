"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Casket, Supplier } from "../../lib/types";

type Filters = {
  supplier: number | "";
  material: "" | "Wood" | "Metal" | "Green Burial";
  jewish: "" | "yes" | "no";
  green: "" | "yes" | "no";
  minEW?: string; maxEW?: string; minEL?: string; maxEL?: string; minEH?: string; maxEH?: string;
  minIW?: string; maxIW?: string; minIL?: string; maxIL?: string; minIH?: string; maxIH?: string;
  q: string;
};

export default function CasketsPage() {
  const [rows, setRows] = useState<Casket[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<Filters>({
    supplier: "", material: "", jewish: "", green: "", q: "",
  });
  const [openModal, setOpenModal] = useState<null | { mode: "add" } | { mode: "edit", row: Casket }>(null);

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
      if (filters.material && r.material !== filters.material) return false;
      if (filters.jewish === "yes" && !r.jewish) return false;
      if (filters.jewish === "no"  && r.jewish) return false;
      if (filters.green  === "yes" && !r.green) return false;
      if (filters.green  === "no"  && r.green) return false;
      const num = (x: any)=> x==null? null : Number(x);
      const within = (v: number | null | undefined, min?: string, max?: string) => {
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

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">Caskets</h1>
        <Button variant="default" onClick={()=>setOpenModal({ mode: "add" })}>Add Casket</Button>
      </div>

      {/* LANDMARK: Filters (compact) */}
      <HoloPanel railColor="cyan">
        <div className="text-xs text-white/60 mb-2">Filters</div>
        <div className="grid md:grid-cols-6 gap-2">
          <div className="space-y-1">
            <div className="label-xs">Supplier</div>
            <select className="select-sm w-full" value={filters.supplier} onChange={e=>setFilters(f=>({...f, supplier: e.target.value? Number(e.target.value): ""}))}>
              <option value="">Any</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <div className="label-xs">Material</div>
            <select className="select-sm w-full" value={filters.material} onChange={e=>setFilters(f=>({...f, material: e.target.value as any}))}>
              <option value="">Any</option>
              <option>Wood</option>
              <option>Metal</option>
              <option>Green Burial</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="label-xs">Jewish</div>
            <select className="select-sm w-full" value={filters.jewish} onChange={e=>setFilters(f=>({...f, jewish: e.target.value as any}))}>
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="label-xs">Green</div>
            <select className="select-sm w-full" value={filters.green} onChange={e=>setFilters(f=>({...f, green: e.target.value as any}))}>
              <option value="">Any</option>
              <option value="yes">Green Only</option>
              <option value="no">Exclude Green</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="label-xs">Search</div>
            <Input className="input-sm" placeholder="Name..." value={filters.q} onChange={e=>setFilters(f=>({...f, q: e.target.value}))}/>
          </div>
        </div>

        {/* LANDMARK: Dim filters */}
        <div className="grid md:grid-cols-6 gap-2 mt-3">
          <Dim min={filters.minEW} max={filters.maxEW} label="Ext Width" onMin={v=>setFilters(f=>({...f, minEW:v}))} onMax={v=>setFilters(f=>({...f, maxEW:v}))}/>
          <Dim min={filters.minEL} max={filters.maxEL} label="Ext Length" onMin={v=>setFilters(f=>({...f, minEL:v}))} onMax={v=>setFilters(f=>({...f, maxEL:v}))}/>
          <Dim min={filters.minEH} max={filters.maxEH} label="Ext Height" onMin={v=>setFilters(f=>({...f, minEH:v}))} onMax={v=>setFilters(f=>({...f, maxEH:v}))}/>
          <Dim min={filters.minIW} max={filters.maxIW} label="Int Width" onMin={v=>setFilters(f=>({...f, minIW:v}))} onMax={v=>setFilters(f=>({...f, maxIW:v}))}/>
          <Dim min={filters.minIL} max={filters.maxIL} label="Int Length" onMin={v=>setFilters(f=>({...f, minIL:v}))} onMax={v=>setFilters(f=>({...f, maxIL:v}))}/>
          <Dim min={filters.minIH} max={filters.maxIH} label="Int Height" onMin={v=>setFilters(f=>({...f, minIH:v}))} onMax={v=>setFilters(f=>({...f, maxIH:v}))}/>
        </div>
      </HoloPanel>

      {/* LANDMARK: Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(row => (
          <HoloPanel key={row.id} railColor="purple">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white/90">{row.name}</div>
                <div className="text-xs text-white/60 mt-1">
                  Supplier: {suppliers.find(s=>s.id===row.supplier_id)?.name ?? "—"}
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Material: {row.material} {row.jewish ? "• Jewish" : ""} {row.green ? "• Green" : ""}
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Ext: {row.ext_width_in ?? "—"}W × {row.ext_length_in ?? "—"}L × {row.ext_height_in ?? "—"}H
                </div>
                <div className="text-xs text-white/60">
                  Int: {row.int_width_in ?? "—"}W × {row.int_length_in ?? "—"}L × {row.int_height_in ?? "—"}H
                </div>
                {/* LANDMARK: Inventory status */}
                <div className="mt-2 text-xs">
                  Target: <b>{row.target_qty}</b> • On hand: <b>{row.on_hand}</b> • On order: <b>{row.on_order}</b> • Backorders: <b className="text-rose-300">{row.backordered_count}</b>
                  <div className={(row.on_hand + row.on_order) >= row.target_qty ? "text-emerald-300" : "text-amber-300"}>
                    {(row.on_hand + row.on_order) >= row.target_qty ? "Full" : `Short by ${Math.max(0, row.target_qty - (row.on_hand + row.on_order))}`}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" onClick={()=>setOpenModal({ mode: "edit", row })}>Edit</Button>
                <Button size="sm" variant="outline" onClick={async ()=>{
                  if(!confirm("Delete this casket?")) return;
                  const res = await fetch(`/api/caskets/${row.id}`, { method: "DELETE" });
                  if(!res.ok){ alert(await res.text()); return; }
                  load();
                }}>Delete</Button>
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
    </div>
  );
}

function Dim({ label, min, max, onMin, onMax }: { label: string; min?: string; max?: string; onMin: (v:string)=>void; onMax:(v:string)=>void; }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      <div className="label-xs col-span-3">{label} (in)</div>
      <Input className="input-sm" placeholder="Min" value={min ?? ""} onChange={e=>onMin(e.target.value)} />
      <div className="text-center text-xs text-white/40 self-center">–</div>
      <Input className="input-sm" placeholder="Max" value={max ?? ""} onChange={e=>onMax(e.target.value)} />
    </div>
  );
}

/* LANDMARK: Casket Modal (add/edit) */
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
  const [material, setMaterial] = useState<Casket["material"]>(row?.material ?? "Wood");
  const [jewish, setJewish] = useState<boolean>(row?.jewish ?? false);
  const [green, setGreen] = useState<boolean>(row?.green ?? false);
  const [target, setTarget] = useState<string>((row?.target_qty ?? 0).toString());
  const [onHand, setOnHand] = useState<string>((row?.on_hand ?? 0).toString());
  const [onOrder, setOnOrder] = useState<string>((row?.on_order ?? 0).toString());

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
      on_hand: Number(onHand) || 0,
      on_order: Number(onOrder) || 0,
    };
    const url = mode==="add" ? "/api/caskets" : `/api/caskets/${row!.id}`;
    const method = mode==="add" ? "POST" : "PATCH";
    const res = await fetch(url, { method, body: JSON.stringify(payload) });
    if(!res.ok){ alert(await res.text()); return; }
    onClose(); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
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
              <option>Wood</option><option>Metal</option><option>Green Burial</option>
            </select>
          </div>
          <label className="flex items-end gap-2"><input type="checkbox" className="accent-emerald-400" checked={jewish} onChange={e=>setJewish(e.target.checked)} /><span className="text-sm">Jewish</span></label>
          <label className="flex items-end gap-2"><input type="checkbox" className="accent-emerald-400" checked={green} onChange={e=>setGreen(e.target.checked)} /><span className="text-sm">Green</span></label>
          <div className="space-y-1"><div className="label-xs">Target Qty</div><Input className="input-sm" value={target} onChange={e=>setTarget(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">On Hand</div><Input className="input-sm" value={onHand} onChange={e=>setOnHand(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">On Order</div><Input className="input-sm" value={onOrder} onChange={e=>setOnOrder(e.target.value)} /></div>
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={save}>Save</Button></div>
      </HoloPanel>
    </div>
  );
}
