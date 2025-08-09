"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Casket, Supplier } from "../../lib/types";

// icons
const IconEdit = (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/><path d="M20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>);
const IconAdjust = (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M11 11V3h2v8h8v2h-8v8h-2v-8H3v-2h8z" fill="currentColor"/></svg>);
const IconTrash = (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" fill="currentColor"/></svg>);

type Filters = {
  supplier: number | "";
  material: "" | "WOOD" | "METAL" | "GREEN";
  jewish: "" | "yes" | "no";
  green: "" | "yes" | "no";
  q: string;
  // dims
  minEW?: string; maxEW?: string; minEL?: string; maxEL?: string; minEH?: string; maxEH?: string;
  minIW?: string; maxIW?: string; minIL?: string; maxIL?: string; minIH?: string; maxIH?: string;
};

export default function CasketsPage() {
  const [rows, setRows] = useState<(Casket & { on_order_live:number; backordered_live:number })[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<Filters>({ supplier:"", material:"", jewish:"", green:"", q:"" });
  const [openModal, setOpenModal] = useState<null | { mode: "add" } | { mode:"edit", row:Casket }>(null);
  const [adjusting, setAdjusting] = useState<null | Casket>(null);

  async function load(){
    const [c,s] = await Promise.all([
      fetch("/api/caskets",{cache:"no-store"}).then(r=>r.json()),
      fetch("/api/suppliers").then(r=>r.json()),
    ]);
    setRows(c); setSuppliers(s);
  }
  useEffect(()=>{ load(); },[]);

  const filtered = useMemo(()=>{
    const within = (v:number|null|undefined, min?:string, max?:string) => {
      if (v==null) return true;
      if (min && v < Number(min)) return false;
      if (max && v > Number(max)) return false;
      return true;
    };
    return rows.filter(r=>{
      if (filters.supplier !== "" && r.supplier_id !== filters.supplier) return false;
      if (filters.material && (r.material as any) !== filters.material) return false;
      if (filters.jewish==="yes" && !r.jewish) return false;
      if (filters.jewish==="no"  && r.jewish) return false;
      if (filters.green==="yes" && !r.green) return false;
      if (filters.green==="no"  && r.green) return false;
      if (!within(r.ext_width_in as any, filters.minEW, filters.maxEW)) return false;
      if (!within(r.ext_length_in as any, filters.minEL, filters.maxEL)) return false;
      if (!within(r.ext_height_in as any, filters.minEH, filters.maxEH)) return false;
      if (!within(r.int_width_in as any, filters.minIW, filters.maxIW)) return false;
      if (!within(r.int_length_in as any, filters.minIL, filters.maxIL)) return false;
      if (!within(r.int_height_in as any, filters.minIH, filters.maxIH)) return false;
      if (filters.q) {
        const t = `${r.name}`.toLowerCase();
        if (!t.includes(filters.q.toLowerCase())) return false;
      }
      return true;
    });
  },[rows,filters]);

  function available(r: any){ return (r.on_hand ?? 0) + (r.on_order_live ?? 0); }
  function shortBy(r: any){ return Math.max(0, (r.target_qty ?? 0) - available(r)); }
  function isFull(r: any){ return available(r) >= (r.target_qty ?? 0); }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">Caskets</h1>
        <Button onClick={()=>setOpenModal({mode:"add"})}>Add Casket</Button>
      </div>

      <HoloPanel railColor="cyan">
        <div className="text-xs text-white/60 mb-2">Filters</div>
        <div className="grid md:grid-cols-6 gap-2">
          <LabelSel label="Supplier" value={filters.supplier} onChange={v=>setFilters(f=>({...f, supplier:v}))}>
            <option value="">Any</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </LabelSel>
          <LabelSel label="Material" value={filters.material} onChange={v=>setFilters(f=>({...f, material:v as any}))}>
            <option value="">Any</option><option value="WOOD">Wood</option><option value="METAL">Metal</option><option value="GREEN">Green</option>
          </LabelSel>
          <LabelSel label="Jewish" value={filters.jewish} onChange={v=>setFilters(f=>({...f, jewish:v as any}))}>
            <option value="">Any</option><option value="yes">Yes</option><option value="no">No</option>
          </LabelSel>
          <LabelSel label="Green" value={filters.green} onChange={v=>setFilters(f=>({...f, green:v as any}))}>
            <option value="">Any</option><option value="yes">Green Only</option><option value="no">Exclude Green</option>
          </LabelSel>
          <div className="space-y-1 md:col-span-2">
            <div className="label-xs">Search</div>
            <Input className="input-sm" value={filters.q} onChange={e=>setFilters(f=>({...f, q: e.target.value}))} placeholder="Name..." />
          </div>
        </div>
        <div className="grid md:grid-cols-6 gap-2 mt-3">
          <Dim label="Ext W"  min={filters.minEW} max={filters.maxEW} onMin={v=>setFilters(f=>({...f, minEW:v}))} onMax={v=>setFilters(f=>({...f, maxEW:v}))}/>
          <Dim label="Ext L"  min={filters.minEL} max={filters.maxEL} onMin={v=>setFilters(f=>({...f, minEL:v}))} onMax={v=>setFilters(f=>({...f, maxEL:v}))}/>
          <Dim label="Ext H"  min={filters.minEH} max={filters.maxEH} onMin={v=>setFilters(f=>({...f, minEH:v}))} onMax={v=>setFilters(f=>({...f, maxEH:v}))}/>
          <Dim label="Int W"  min={filters.minIW} max={filters.maxIW} onMin={v=>setFilters(f=>({...f, minIW:v}))} onMax={v=>setFilters(f=>({...f, maxIW:v}))}/>
          <Dim label="Int L"  min={filters.minIL} max={filters.maxIL} onMin={v=>setFilters(f=>({...f, minIL:v}))} onMax={v=>setFilters(f=>({...f, maxIL:v}))}/>
          <Dim label="Int H"  min={filters.minIH} max={filters.maxIH} onMin={v=>setFilters(f=>({...f, minIH:v}))} onMax={v=>setFilters(f=>({...f, maxIH:v}))}/>
        </div>
      </HoloPanel>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map(row=>(
          <HoloPanel key={row.id} railColor="purple" className="min-h-[220px] flex flex-col">
            <div className="text-white/90">{row.name}</div>
            <div className="text-xs text-white/60 mt-1">
              Supplier: {suppliers.find(s=>s.id===row.supplier_id)?.name ?? "—"}
            </div>
            <div className="text-xs text-white/60 mt-1 flex gap-3 flex-wrap">
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
            <div className="mt-2 text-xs space-y-0.5">
              <div>Target: <b>{row.target_qty}</b></div>
              <div>On hand: <b>{row.on_hand}</b> • On order: <b>{row.on_order_live}</b> • Backorders: <b className="text-rose-300">{row.backordered_live}</b></div>
              <div className={isFull(row) ? "text-emerald-300" : (row.on_hand===0 || row.backordered_live>0) ? "text-rose-300" : "text-amber-300"}>
                {isFull(row) ? "Full" : row.on_hand===0 ? "None on hand" : `Short by ${shortBy(row)}`}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="mt-auto pt-3 flex items-center justify-end gap-2 border-t border-white/10">
              <IconBtn title="Edit" onClick={()=>setOpenModal({mode:"edit", row})}><IconEdit className="text-white/80"/></IconBtn>
              <IconBtn title="Adjust on‑hand" onClick={()=>setAdjusting(row)}><IconAdjust className="text-emerald-300"/></IconBtn>
              <IconBtn title="Delete" onClick={async ()=>{
                if(!confirm("Delete this casket?")) return;
                const res = await fetch(`/api/caskets/${row.id}`, { method:"DELETE" });
                if(!res.ok){ alert(await res.text()); return; }
                load();
              }}><IconTrash className="text-rose-400"/></IconBtn>
            </div>
          </HoloPanel>
        ))}
      </div>
    </div>
  );
}

function LabelSel({ label, value, onChange, children }:{
  label:string; value:any; onChange:(v:any)=>void; children:React.ReactNode;
}){
  return (
    <div className="space-y-1">
      <div className="label-xs">{label}</div>
      <select className="select-sm w-full" value={value as any} onChange={e=>onChange(e.target.value ? isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) : "")}>
        {children}
      </select>
    </div>
  );
}
function Dim({label,min,max,onMin,onMax}:{label:string;min?:string;max?:string;onMin:(v:string)=>void;onMax:(v:string)=>void;}){
  return (
    <div className="grid grid-cols-3 gap-1">
      <div className="label-xs col-span-3">{label}</div>
      <Input className="input-sm" placeholder="Min" value={min ?? ""} onChange={e=>onMin(e.target.value)}/>
      <div className="text-center text-xs text-white/40 self-center">–</div>
      <Input className="input-sm" placeholder="Max" value={max ?? ""} onChange={e=>onMax(e.target.value)}/>
    </div>
  );
}
function IconBtn({title, onClick, children}:{title:string; onClick:()=>void; children:React.ReactNode;}){
  return (
    <button title={title} aria-label={title} onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10">
      {children}
    </button>
  );
}
