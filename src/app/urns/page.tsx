"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Supplier, Urn } from "../../lib/types";

type Filters = {
  supplier: number | "";
  category: "" | "Full Size" | "Keepsake" | "Jewelry" | "Special Use";
  green: "" | "yes" | "no";
  minW?: string; maxW?: string; minH?: string; maxH?: string; minD?: string; maxD?: string;
  q: string;
};

export default function UrnsPage() {
  const [rows, setRows] = useState<Urn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<Filters>({ supplier: "", category: "", green: "", q: "" });
  const [openModal, setOpenModal] = useState<null | { mode: "add" } | { mode: "edit", row: Urn }>(null);

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
      if (filters.category && r.category !== filters.category) return false;
      if (filters.green==="yes" && !r.green) return false;
      if (filters.green==="no"  && r.green) return false;
      const within = (v: number | null | undefined, min?: string, max?: string) => {
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

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">Urns</h1>
        <Button variant="default" onClick={()=>setOpenModal({ mode: "add" })}>Add Urn</Button>
      </div>

      {/* LANDMARK: Filters */}
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
            <div className="label-xs">Category</div>
            <select className="select-sm w-full" value={filters.category} onChange={e=>setFilters(f=>({...f, category: e.target.value as any}))}>
              <option value="">Any</option>
              <option>Full Size</option><option>Keepsake</option><option>Jewelry</option><option>Special Use</option>
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
          <Dim label="Width" min={filters.minW} max={filters.maxW} onMin={v=>setFilters(f=>({...f, minW:v}))} onMax={v=>setFilters(f=>({...f, maxW:v}))}/>
          <Dim label="Height" min={filters.minH} max={filters.maxH} onMin={v=>setFilters(f=>({...f, minH:v}))} onMax={v=>setFilters(f=>({...f, maxH:v}))}/>
          <Dim label="Depth" min={filters.minD} max={filters.maxD} onMin={v=>setFilters(f=>({...f, minD:v}))} onMax={v=>setFilters(f=>({...f, maxD:v}))}/>
        </div>
      </HoloPanel>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(row => (
          <HoloPanel key={row.id} railColor="purple">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white/90">{row.name}</div>
                <div className="text-xs text-white/60 mt-1">Supplier: {suppliers.find(s=>s.id===row.supplier_id)?.name ?? "—"}</div>
                <div className="text-xs text-white/60 mt-1">Category: {row.category} {row.green ? "• Green" : ""}</div>
                <div className="text-xs text-white/60 mt-1">
                  {row.width_in ?? "—"}W × {row.height_in ?? "—"}H × {row.depth_in ?? "—"}D
                </div>
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
                  if(!confirm("Delete this urn?")) return;
                  const res = await fetch(`/api/urns/${row.id}`, { method: "DELETE" });
                  if(!res.ok){ alert(await res.text()); return; }
                  load();
                }}>Delete</Button>
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
    </div>
  );
}

function Dim({ label, min, max, onMin, onMax }:{ label:string; min?:string; max?:string; onMin:(v:string)=>void; onMax:(v:string)=>void; }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      <div className="label-xs col-span-3">{label} (in)</div>
      <Input className="input-sm" placeholder="Min" value={min ?? ""} onChange={e=>onMin(e.target.value)} />
      <div className="text-center text-xs text-white/40 self-center">–</div>
      <Input className="input-sm" placeholder="Max" value={max ?? ""} onChange={e=>onMax(e.target.value)} />
    </div>
  );
}

/* LANDMARK: Urn Modal (add/edit) */
function UrnModal({ mode, row, suppliers, onClose, onSaved }:{
  mode: "add"|"edit";
  row?: Urn;
  suppliers: Supplier[];
  onClose: ()=>void;
  onSaved: ()=>void;
}) {
  const [name, setName] = useState(row?.name ?? "");
  const [supplierId, setSupplierId] = useState<number | "">(row?.supplier_id ?? "");
  const [width, setWidth] = useState<string>(row?.width_in?.toString() ?? "");
  const [height, setHeight] = useState<string>(row?.height_in?.toString() ?? "");
  const [depth, setDepth] = useState<string>(row?.depth_in?.toString() ?? "");
  const [category, setCategory] = useState<Urn["category"]>(row?.category ?? "Full Size");
  const [green, setGreen] = useState<boolean>(row?.green ?? false);
  const [target, setTarget] = useState<string>((row?.target_qty ?? 0).toString());
  const [onHand, setOnHand] = useState<string>((row?.on_hand ?? 0).toString());
  const [onOrder, setOnOrder] = useState<string>((row?.on_order ?? 0).toString());

  async function save() {
    const payload = {
      name: name.trim(),
      supplier_id: supplierId === "" ? null : Number(supplierId),
      width_in: width ? Number(width) : null,
      height_in: height ? Number(height) : null,
      depth_in: depth ? Number(depth) : null,
      category, green,
      target_qty: Number(target) || 0,
      on_hand: Number(onHand) || 0,
      on_order: Number(onOrder) || 0,
    };
    const url = mode==="add" ? "/api/urns" : `/api/urns/${row!.id}`;
    const method = mode==="add" ? "POST" : "PATCH";
    const res = await fetch(url, { method, body: JSON.stringify(payload) });
    if(!res.ok){ alert(await res.text()); return; }
    onClose(); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
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
          <div className="space-y-1"><div className="label-xs">Width (in)</div><Input className="input-sm" value={width} onChange={e=>setWidth(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">Height (in)</div><Input className="input-sm" value={height} onChange={e=>setHeight(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">Depth (in)</div><Input className="input-sm" value={depth} onChange={e=>setDepth(e.target.value)} /></div>
          <div className="space-y-1">
            <div className="label-xs">Category</div>
            <select className="select-sm w-full" value={category} onChange={e=>setCategory(e.target.value as any)}>
              <option>Full Size</option><option>Keepsake</option><option>Jewelry</option><option>Special Use</option>
            </select>
          </div>
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
