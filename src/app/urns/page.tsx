"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { SearchBar } from "../components/SearchBar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

type Supplier = { id:number; name:string };
type UrnCategory = "FULL" | "KEEPSAKE" | "JEWELRY" | "SPECIAL";
type Urn = { id:number; name:string; supplier_id:number | null; width_in:number | null; height_in:number | null; depth_in:number | null; category: UrnCategory | null };

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

export default function UrnsPage() {
  const [rows,setRows] = useState<Urn[]>([]);
  const [suppliers,setSuppliers] = useState<Supplier[]>([]);
  const [q,setQ] = useState("");

  const [supplierFilter,setSupplierFilter] = useState<number | "">("");
  const [category,setCategory] = useState<"" | UrnCategory>("");
  const [minW,setMinW] = useState(""); const [maxW,setMaxW] = useState("");
  const [minH,setMinH] = useState(""); const [maxH,setMaxH] = useState("");
  const [minD,setMinD] = useState(""); const [maxD,setMaxD] = useState("");

  useEffect(()=>{ (async ()=>{
    const [u,s] = await Promise.all([ fetch("/api/urns").then(r=>r.json()), fetch("/api/suppliers").then(r=>r.json()) ]);
    setRows(u); setSuppliers(s);
  })(); }, []);

  const filtered = useMemo(()=>{
    const s = q.trim().toLowerCase();
    const wMin = numOrNull(minW), wMax = numOrNull(maxW);
    const hMin = numOrNull(minH), hMax = numOrNull(maxH);
    const dMin = numOrNull(minD), dMax = numOrNull(maxD);

    return rows.filter(r=>{
      if (s && !r.name.toLowerCase().includes(s)) return false;
      if (supplierFilter !== "" && r.supplier_id !== Number(supplierFilter)) return false;
      if (category && r.category !== category) return false;
      const w=r.width_in, h=r.height_in, d=r.depth_in;
      if (wMin!==null && (w==null || w < wMin)) return false;
      if (wMax!==null && (w==null || w > wMax)) return false;
      if (hMin!==null && (h==null || h < hMin)) return false;
      if (hMax!==null && (h==null || h > hMax)) return false;
      if (dMin!==null && (d==null || d < dMin)) return false;
      if (dMax!==null && (d==null || d > dMax)) return false;
      return true;
    });
  }, [rows,q,supplierFilter,category,minW,maxW,minH,maxH,minD,maxD]);

  async function save(id:number, patch: Partial<Urn>) {
    const res = await fetch(`/api/urns/${id}`, { method:"PATCH", body: JSON.stringify(patch) });
    if (res.ok) { const r = await res.json(); setRows(prev => prev.map(p => p.id === id ? r : p)); }
    else alert(await res.text());
  }
  async function remove(id:number) {
    if (!confirm("Delete urn?")) return;
    const res = await fetch(`/api/urns/${id}`, { method:"DELETE" });
    if (res.ok) setRows(prev => prev.filter(p => p.id !== id)); else alert(await res.text());
  }
  async function addUrn(payload:any, close: () => void) {
    const res = await fetch("/api/urns", { method:"POST", body: JSON.stringify(payload) });
    if (res.ok) { const row = await res.json(); setRows(prev => [row, ...prev]); close(); }
    else alert(await res.text());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Urns</h1>
        <div className="flex gap-3 items-center">
          <div className="w-80"><SearchBar value={q} onChange={setQ} placeholder="Search urns by name..." /></div>
          <AddUrnModal suppliers={suppliers} onCreate={addUrn} />
        </div>
      </div>

      {/* LANDMARK: Filters slab — compact + collapsible */}
      <HoloPanel>
        <details className="group" open>
          <summary className="cursor-pointer list-none flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-white/60">Filters</span>
            <span className="text-white/60 text-xs group-open:hidden">Show</span>
            <span className="text-white/60 text-xs hidden group-open:inline">Hide</span>
          </summary>

        <div className="mt-3 grid 2xl:grid-cols-5 lg:grid-cols-4 sm:grid-cols-2 gap-2">
          <div>
            <div className="label-xs">Category</div>
            <select className="select-sm [&>option]:bg-white [&>option]:text-black"
              value={category} onChange={(e)=>setCategory(e.target.value as any)}>
              <option value="">Any</option>
              <option value="FULL">Full Size</option>
              <option value="KEEPSAKE">Keepsake</option>
              <option value="JEWELRY">Jewelry</option>
              <option value="SPECIAL">Special Use</option>
            </select>
          </div>
          <div>
            <div className="label-xs">Supplier</div>
            <select className="select-sm [&>option]:bg-white [&>option]:text-black"
              value={supplierFilter} onChange={(e)=>setSupplierFilter(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Any</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <div className="label-xs">Width (in)</div>
            <div className="flex gap-2">
              <Input className="input-sm" placeholder="min" value={minW} onChange={e=>setMinW(e.target.value)} />
              <Input className="input-sm" placeholder="max" value={maxW} onChange={e=>setMaxW(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="label-xs">Height (in)</div>
            <div className="flex gap-2">
              <Input className="input-sm" placeholder="min" value={minH} onChange={e=>setMinH(e.target.value)} />
              <Input className="input-sm" placeholder="max" value={maxH} onChange={e=>setMaxH(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="label-xs">Depth (in)</div>
            <div className="flex gap-2">
              <Input className="input-sm" placeholder="min" value={minD} onChange={e=>setMinD(e.target.value)} />
              <Input className="input-sm" placeholder="max" value={maxD} onChange={e=>setMaxD(e.target.value)} />
            </div>
          </div>
        </div>
        </details>
      </HoloPanel>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(r => (
          <UrnCard key={r.id} row={r} suppliers={suppliers} onSave={save} onDelete={remove} />
        ))}
        {filtered.length === 0 && <div className="text-white/60">No matches.</div>}
      </div>
    </div>
  );
}

/* ------------------ Add Urn Modal ------------------ */
function AddUrnModal({ suppliers, onCreate }:{
  suppliers: Supplier[];
  onCreate: (payload:any, close: () => void) => void;
}) {
  const [open,setOpen] = useState(false);
  const [name,setName] = useState("");
  const [supplier,setSupplier] = useState<number | "">("");
  const [category,setCategory] = useState<"" | UrnCategory>("");
  const [w,setW] = useState(""); const [h,setH] = useState(""); const [d,setD] = useState("");

  function submit(){
    onCreate({
      name,
      supplier_id: supplier === "" ? null : Number(supplier),
      category: category || null,
      width_in: numOrNull(w),
      height_in: numOrNull(h),
      depth_in: numOrNull(d)
    }, () => setOpen(false));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Add Urn</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Urn</DialogTitle></DialogHeader>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-white/60">Name</div>
            <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Urn name" />
          </div>
          <div>
            <div className="text-xs text-white/60">Supplier</div>
            <select className="w-full rounded-md bg-white/5 border border-white/10 px-2 py-2 text-sm [&>option]:bg-white [&>option]:text-black"
              value={supplier} onChange={(e)=>setSupplier(e.target.value ? Number(e.target.value) : "")}>
              <option value="">—</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-white/60">Category</div>
            <select className="w-full rounded-md bg-white/5 border border-white/10 px-2 py-2 text-sm [&>option]:bg-white [&>option]:text-black"
              value={category} onChange={(e)=>setCategory(e.target.value as any)}>
              <option value="">—</option>
              <option value="FULL">Full Size</option>
              <option value="KEEPSAKE">Keepsake</option>
              <option value="JEWELRY">Jewelry</option>
              <option value="SPECIAL">Special Use</option>
            </select>
          </div>
          <Input placeholder="Width (in)" value={w} onChange={(e)=>setW(e.target.value)} />
          <Input placeholder="Height (in)" value={h} onChange={(e)=>setH(e.target.value)} />
          <Input placeholder="Depth (in)" value={d} onChange={(e)=>setD(e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------ Urn Card ------------------ */
function UrnCard({ row, suppliers, onSave, onDelete }:{
  row: Urn;
  suppliers: Supplier[];
  onSave: (id:number, patch:Partial<Urn>)=>void;
  onDelete: (id:number)=>void;
}) {
  const [editing,setEditing] = useState(false);
  const [name,setName] = useState(row.name);
  const [sup,setSup] = useState<number | "">(row.supplier_id ?? "");
  const [cat,setCat] = useState<"" | UrnCategory>(row.category ?? "");
  const [w,setW] = useState(row.width_in?.toString() ?? "");
  const [h,setH] = useState(row.height_in?.toString() ?? "");
  const [d,setD] = useState(row.depth_in?.toString() ?? "");

  function reset(){ setEditing(false); setName(row.name); setSup(row.supplier_id ?? ""); setCat(row.category ?? ""); setW(row.width_in?.toString() ?? ""); setH(row.height_in?.toString() ?? ""); setD(row.depth_in?.toString() ?? ""); }
  async function save(){
    await onSave(row.id, {
      name,
      supplier_id: sup === "" ? null : Number(sup),
      category: cat || null,
      width_in: w.trim()===""? null : Number(w),
      height_in: h.trim()===""? null : Number(h),
      depth_in: d.trim()===""? null : Number(d),
    });
    setEditing(false);
  }

  return (
    <HoloPanel>
      {!editing ? (
        <div className="space-y-2">
          <div className="text-lg font-semibold">{row.name}</div>
          <div className="text-sm text-white/70">Category: {row.category ?? "—"}</div>
          <div className="text-sm text-white/70">W {row.width_in ?? "—"}″ • H {row.height_in ?? "—"}″ • D {row.depth_in ?? "—"}″</div>
          <div className="text-sm text-white/60">Supplier ID: {row.supplier_id ?? "—"}</div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={()=>setEditing(true)}>Edit</Button>
            <Button variant="outline" onClick={()=>onDelete(row.id)}>Delete</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input value={name} onChange={(e)=>setName(e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="W" value={w} onChange={(e)=>setW(e.target.value)} />
            <Input placeholder="H" value={h} onChange={(e)=>setH(e.target.value)} />
            <Input placeholder="D" value={d} onChange={(e)=>setD(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="rounded-md bg-white/5 border border-white/10 px-2 py-2 text-sm [&>option]:bg-white [&>option]:text-black" value={cat} onChange={(e)=>setCat(e.target.value as any)}>
              <option value="">—</option>
              <option value="FULL">Full Size</option>
              <option value="KEEPSAKE">Keepsake</option>
              <option value="JEWELRY">Jewelry</option>
              <option value="SPECIAL">Special Use</option>
            </select>
            <select className="rounded-md bg-white/5 border border-white/10 px-2 py-2 text-sm [&>option]:bg-white [&>option]:text-black" value={sup} onChange={(e)=>setSup(e.target.value ? Number(e.target.value) : "")}>
              <option value="">No supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>Cancel</Button>
            <Button onClick={save} disabled={!name}>Save</Button>
          </div>
        </div>
      )}
    </HoloPanel>
  );
}
