"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Supplier, Urn } from "@/lib/types";

const IconEdit = (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/><path d="M20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>);
const IconAdjust = (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M11 11V3h2v8h8v2h-8v8h-2v-8H3v-2h8z" fill="currentColor"/></svg>);
const IconTrash = (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" fill="currentColor"/></svg>);

type Filters = {
  supplier: number | "";
  category: "" | "FULL" | "KEEPSAKE" | "JEWELRY" | "SPECIAL";
  green: "" | "yes" | "no";
  q: string;
  minW?: string; maxW?: string; minH?: string; maxH?: string; minD?: string; maxD?: string;
};

export default function UrnsPage() {
  const [rows, setRows] = useState<(Urn & { on_order_live:number; backordered_live:number })[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filters, setFilters] = useState<Filters>({ supplier:"", category:"", green:"", q:"" });
  const [editRow, setEditRow] = useState<Urn | null>(null);
  const [adjustRow, setAdjustRow] = useState<Urn | null>(null);
  const [formTarget, setFormTarget] = useState<number>(0);
  const [formOnHand, setFormOnHand] = useState<number>(0);

  async function load(){
    const [u,s] = await Promise.all([
      fetch("/api/urns",{cache:"no-store"}).then(r=>r.json()),
      fetch("/api/suppliers").then(r=>r.json()),
    ]);
    setRows(u); setSuppliers(s);
  }
  useEffect(()=>{ load(); },[]);

  useEffect(()=>{
    if(editRow){ setFormTarget(editRow.target_qty ?? 0); }
    if(adjustRow){ setFormOnHand(adjustRow.on_hand ?? 0); }
  },[editRow,adjustRow]);

  const filtered = useMemo(()=>{
    const within = (v:number|null|undefined, min?:string, max?:string) => {
      if (v==null) return true;
      if (min && v < Number(min)) return false;
      if (max && v > Number(max)) return false;
      return true;
    };
    return rows.filter(r=>{
      if (filters.supplier !== "" && r.supplier_id !== filters.supplier) return false;
      if (filters.category && (r.category as any) !== filters.category) return false;
      if (filters.green==="yes" && !r.green) return false;
      if (filters.green==="no"  && r.green) return false;
      if (!within(r.width_in as any, filters.minW, filters.maxW)) return false;
      if (!within(r.height_in as any, filters.minH, filters.maxH)) return false;
      if (!within(r.depth_in as any, filters.minD, filters.maxD)) return false;
      if (filters.q) {
        const t = `${r.name}`.toLowerCase();
        if (!t.includes(filters.q.toLowerCase())) return false;
      }
      return true;
    });
  },[rows,filters]);

  function available(r:any){ return (r.on_hand ?? 0) + (r.on_order_live ?? 0); }
  function shortBy(r:any){ return Math.max(0, (r.target_qty ?? 0) - available(r)); }
  function isFull(r:any){ return available(r) >= (r.target_qty ?? 0); }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">Urns</h1>
        <Button onClick={()=>setEditRow({} as any)}>Add Urn</Button>
      </div>

      <HoloPanel railColor="cyan">
        <div className="text-xs text-white/60 mb-2">Filters</div>
        <div className="grid md:grid-cols-6 gap-2">
          <LabelSel label="Supplier" value={filters.supplier} onChange={v=>setFilters(f=>({...f, supplier:v}))}>
            <option value="">Any</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </LabelSel>
          <LabelSel label="Category" value={filters.category} onChange={v=>setFilters(f=>({...f, category:v as any}))}>
            <option value="">Any</option>
            <option value="FULL">Full</option><option value="KEEPSAKE">Keepsake</option>
            <option value="JEWELRY">Jewelry</option><option value="SPECIAL">Special</option>
          </LabelSel>
          <LabelSel label="Green" value={filters.green} onChange={v=>setFilters(f=>({...f, green:v as any}))}>
            <option value="">Any</option><option value="yes">Green Only</option><option value="no">Exclude Green</option>
          </LabelSel>
          <div className="space-y-1 md:col-span-3">
            <div className="label-xs">Search</div>
            <Input className="input-sm" value={filters.q} onChange={e=>setFilters(f=>({...f, q:e.target.value}))} placeholder="Name..." />
          </div>
        </div>
        <div className="grid md:grid-cols-6 gap-2 mt-3">
          <Dim label="W" min={filters.minW} max={filters.maxW} onMin={v=>setFilters(f=>({...f, minW:v}))} onMax={v=>setFilters(f=>({...f, maxW:v}))}/>
          <Dim label="H" min={filters.minH} max={filters.maxH} onMin={v=>setFilters(f=>({...f, minH:v}))} onMax={v=>setFilters(f=>({...f, maxH:v}))}/>
          <Dim label="D" min={filters.minD} max={filters.maxD} onMin={v=>setFilters(f=>({...f, minD:v}))} onMax={v=>setFilters(f=>({...f, maxD:v}))}/>
        </div>
      </HoloPanel>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map(row=>{
          const none = (row.on_hand ?? 0) === 0;
          const rail = none ? "rose" : "purple";
          const full = isFull(row);
          const stat = full ? "FULL" : none ? "NONE ON HAND" : `SHORT by ${shortBy(row)}`;
          const statStyle = none
            ? "text-rose-300"
            : full ? "text-emerald-300" : "text-amber-300";
          return (
            <HoloPanel key={row.id} railColor={rail} className="min-h-[208px] pb-10 flex flex-col">
              <div className="flex items-center justify-between gap-3">
                <div className="text-white/90 truncate">{row.name}</div>
                <span className={`inline-flex items-center px-2 h-6 rounded-md border border-white/10 bg-white/5 text-xs ${statStyle}`}>{stat}</span>
              </div>
              <div className="text-xs text-white/60 mt-1">
                Supplier: {suppliers.find(s=>s.id===row.supplier_id)?.name ?? "—"}
              </div>
              <div className="text-xs text-white/60 mt-1 flex gap-3 flex-wrap">
                <span>Category: {row.category}</span>
                <span>{row.green ? "Green" : "—"}</span>
              </div>
              <div className="text-xs text-white/60 mt-1">
                {row.width_in ?? "—"}W × {row.height_in ?? "—"}H × {row.depth_in ?? "—"}D
              </div>
              <div className="mt-2 text-xs space-y-0.5">
                <div>Target: <b>{row.target_qty}</b></div>
                <div>On hand: <b>{row.on_hand}</b> • On order: <b>{row.on_order_live}</b> • Backorders: <b className="text-rose-300">{row.backordered_live}</b></div>
              </div>

              <div className="mt-auto pt-3 flex items-center justify-end gap-2 border-t border-white/10 relative z-10 pointer-events-auto">
                <IconBtn title="Edit" onClick={()=>setEditRow(row)}><IconEdit className="text-white/80"/></IconBtn>
                <IconBtn title="Adjust on‑hand" onClick={()=>setAdjustRow(row)}><IconAdjust className="text-emerald-300"/></IconBtn>
                <IconBtn title="Delete" onClick={async ()=>{
                  if(!confirm("Delete this urn?")) return;
                  const res = await fetch(`/api/urns/${row.id}`, { method:"DELETE" });
                  if(!res.ok){ alert(await res.text()); return; }
                  load();
                }}><IconTrash className="text-rose-400"/></IconBtn>
              </div>
            </HoloPanel>
          );
        })}
      </div>

      {/* Edit modal (target) */}
      {editRow !== null && (
        <Modal onClose={()=>setEditRow(null)} title={editRow.id ? "Edit Urn" : "Add Urn"}>
          <form className="space-y-3" onSubmit={async (e)=>{
            e.preventDefault();
            const id = editRow!.id;
            const method = id ? "PATCH" : "POST";
            const url = id ? `/api/urns/${id}` : "/api/urns";
            const body = id
              ? { target_qty: formTarget } 
              : { name: prompt("Name?") ?? "", supplier_id: Number(prompt("Supplier ID?") ?? "0") || null, category: "FULL", green: false, target_qty: formTarget, on_hand: 0 };
            const res = await fetch(url, { method, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
            if(!res.ok){ alert(await res.text()); return; }
            setEditRow(null); load();
          }}>
            <div>
              <div className="label-xs">Target Quantity</div>
              <Input className="input-sm" type="number" min={0} value={formTarget} onChange={e=>setFormTarget(Number(e.target.value))}/>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={()=>setEditRow(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Adjust on-hand */}
      {adjustRow !== null && (
        <Modal onClose={()=>setAdjustRow(null)} title="Adjust On‑Hand">
          <form className="space-y-3" onSubmit={async (e)=>{
            e.preventDefault();
            const id = adjustRow!.id;
            const res = await fetch(`/api/urns/${id}`, { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ on_hand: formOnHand }) });
            if(!res.ok){ alert(await res.text()); return; }
            setAdjustRow(null); load();
          }}>
            <div>
              <div className="label-xs">On‑hand</div>
              <Input className="input-sm" type="number" min={0} value={formOnHand} onChange={e=>setFormOnHand(Number(e.target.value))}/>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={()=>setAdjustRow(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function LabelSel({ label, value, onChange, children }:{
  label:string; value:any; onChange:(v:any)=>void; children:React.ReactNode;
}){
  return (
    <div className="space-y-1">
      <div className="label-xs">{label}</div>
      <select className="select-sm w-full text-white bg-white/5 border border-white/10 rounded-md" value={value as any} onChange={e=>onChange(e.target.value ? isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) : "")}>
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
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
    >
      {children}
    </button>
  );
}
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string; }){
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-neutral-900/90 backdrop-blur-xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
        <h2 className="text-white/90 text-sm mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}
