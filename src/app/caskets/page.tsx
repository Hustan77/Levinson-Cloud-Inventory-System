"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { SearchBar } from "../components/SearchBar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Casket, Supplier } from "../../lib/types";

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

export default function CasketsPage() {
  const [rows, setRows] = useState<Casket[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");

  // Filters
  const [material, setMaterial] = useState<"" | "WOOD" | "METAL" | "GREEN">("");
  const [onlyJewish, setOnlyJewish] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState<number | "">("");

  // Exterior ranges
  const [minEW, setMinEW] = useState(""); const [maxEW, setMaxEW] = useState("");
  const [minEL, setMinEL] = useState(""); const [maxEL, setMaxEL] = useState("");
  const [minEH, setMinEH] = useState(""); const [maxEH, setMaxEH] = useState("");

  // Interior ranges
  const [minIW, setMinIW] = useState(""); const [maxIW, setMaxIW] = useState("");
  const [minIL, setMinIL] = useState(""); const [maxIL, setMaxIL] = useState("");
  const [minIH, setMinIH] = useState(""); const [maxIH, setMaxIH] = useState("");

  useEffect(() => {
    (async () => {
      const [c, s] = await Promise.all([
        fetch("/api/caskets").then(r => r.json()),
        fetch("/api/suppliers").then(r => r.json())
      ]);
      setRows(c); setSuppliers(s);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const ewMin = numOrNull(minEW), ewMax = numOrNull(maxEW);
    const elMin = numOrNull(minEL), elMax = numOrNull(maxEL);
    const ehMin = numOrNull(minEH), ehMax = numOrNull(maxEH);
    const iwMin = numOrNull(minIW), iwMax = numOrNull(maxIW);
    const ilMin = numOrNull(minIL), ilMax = numOrNull(maxIL);
    const ihMin = numOrNull(minIH), ihMax = numOrNull(maxIH);

    return rows.filter(r => {
      if (s && !r.name.toLowerCase().includes(s)) return false;
      if (material && r.material !== material) return false;
      if (onlyJewish && !r.jewish) return false;
      if (supplierFilter !== "" && r.supplier_id !== Number(supplierFilter)) return false;

      const ew = r.ext_width_in,  el = r.ext_length_in, eh = r.ext_height_in;
      if (ewMin !== null && (ew == null || ew < ewMin)) return false;
      if (ewMax !== null && (ew == null || ew > ewMax)) return false;
      if (elMin !== null && (el == null || el < elMin)) return false;
      if (elMax !== null && (el == null || el > elMax)) return false;
      if (ehMin !== null && (eh == null || eh < ehMin)) return false;
      if (ehMax !== null && (eh == null || eh > ehMax)) return false;

      const iw = r.int_width_in,  il = r.int_length_in, ih = r.int_height_in;
      if (iwMin !== null && (iw == null || iw < iwMin)) return false;
      if (iwMax !== null && (iw == null || iw > iwMax)) return false;
      if (ilMin !== null && (il == null || il < ilMin)) return false;
      if (ilMax !== null && (il == null || il > ilMax)) return false;
      if (ihMin !== null && (ih == null || ih < ihMin)) return false;
      if (ihMax !== null && (ih == null || ih > ihMax)) return false;

      return true;
    });
  }, [rows, q, material, onlyJewish, supplierFilter, minEW, maxEW, minEL, maxEL, minEH, maxEH, minIW, maxIW, minIL, maxIL, minIH, maxIH]);

  async function save(id: number, patch: Partial<Casket>) {
    const res = await fetch(`/api/caskets/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    if (res.ok) { const r = await res.json(); setRows(prev => prev.map(p => p.id === id ? r : p)); }
    else alert(await res.text());
  }

  async function remove(id: number) {
    if (!confirm("Delete casket?")) return;
    const res = await fetch(`/api/caskets/${id}`, { method: "DELETE" });
    if (res.ok) setRows(prev => prev.filter(p => p.id !== id));
    else alert(await res.text());
  }

  async function addCasket(payload: any, close: () => void) {
    const res = await fetch("/api/caskets", { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) { const row = await res.json(); setRows(prev => [row, ...prev]); close(); }
    else alert(await res.text());
  }

  return (
    <div className="space-y-6">
      {/* LANDMARK: header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Caskets</h1>
        <div className="flex gap-3 items-center">
          <div className="w-80"><SearchBar value={q} onChange={setQ} placeholder="Search caskets by name..." /></div>
          <AddCasketModal suppliers={suppliers} onCreate={addCasket} />
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

          <div className="mt-3 grid 2xl:grid-cols-6 lg:grid-cols-4 sm:grid-cols-2 gap-2">
            <div>
              <div className="label-xs">Material</div>
              <select className="select-sm [&>option]:bg-white [&>option]:text-black"
                value={material} onChange={(e)=>setMaterial(e.target.value as any)}>
                <option value="">Any</option>
                <option value="WOOD">Wood</option>
                <option value="METAL">Metal</option>
                <option value="GREEN">Green Burial</option>
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

            <label className="flex items-end gap-2 mt-4 sm:mt-0">
              <input type="checkbox" className="accent-emerald-400" checked={onlyJewish} onChange={(e)=>setOnlyJewish(e.target.checked)} />
              <span className="text-xs">Jewish only</span>
            </label>

            {/* Exterior */}
            <div>
              <div className="label-xs">Ext Width (in)</div>
              <div className="flex gap-2">
                <Input className="input-sm" placeholder="min" value={minEW} onChange={e=>setMinEW(e.target.value)} />
                <Input className="input-sm" placeholder="max" value={maxEW} onChange={e=>setMaxEW(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="label-xs">Ext Length (in)</div>
              <div className="flex gap-2">
                <Input className="input-sm" placeholder="min" value={minEL} onChange={e=>setMinEL(e.target.value)} />
                <Input className="input-sm" placeholder="max" value={maxEL} onChange={e=>setMaxEL(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="label-xs">Ext Height (in)</div>
              <div className="flex gap-2">
                <Input className="input-sm" placeholder="min" value={minEH} onChange={e=>setMinEH(e.target.value)} />
                <Input className="input-sm" placeholder="max" value={maxEH} onChange={e=>setMaxEH(e.target.value)} />
              </div>
            </div>

            {/* Interior */}
            <div>
              <div className="label-xs">Int Width (in)</div>
              <div className="flex gap-2">
                <Input className="input-sm" placeholder="min" value={minIW} onChange={e=>setMinIW(e.target.value)} />
                <Input className="input-sm" placeholder="max" value={maxIW} onChange={e=>setMaxIW(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="label-xs">Int Length (in)</div>
              <div className="flex gap-2">
                <Input className="input-sm" placeholder="min" value={minIL} onChange={e=>setMinIL(e.target.value)} />
                <Input className="input-sm" placeholder="max" value={maxIL} onChange={e=>setMaxIL(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="label-xs">Int Height (in)</div>
              <div className="flex gap-2">
                <Input className="input-sm" placeholder="min" value={minIH} onChange={e=>setMinIH(e.target.value)} />
                <Input className="input-sm" placeholder="max" value={maxIH} onChange={e=>setMaxIH(e.target.value)} />
              </div>
            </div>
          </div>
        </details>
      </HoloPanel>

      {/* LANDMARK: Results grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(r => (
          <CasketCard key={r.id} row={r} suppliers={suppliers} onSave={save} onDelete={remove} />
        ))}
        {filtered.length === 0 && <div className="text-white/60">No matches.</div>}
      </div>
    </div>
  );
}

/* ------------------ Add Casket Modal ------------------ */
function AddCasketModal({ suppliers, onCreate }:{
  suppliers: Supplier[];
  onCreate: (payload:any, close: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name,setName] = useState("");
  const [material,setMaterial] = useState<""|"WOOD"|"METAL"|"GREEN">("");
  const [supplier,setSupplier] = useState<number | "">("");
  const [jewish,setJewish] = useState(false);
  const [extW,setExtW] = useState(""); const [extL,setExtL] = useState(""); const [extH,setExtH] = useState("");
  const [intW,setIntW] = useState(""); const [intL,setIntL] = useState(""); const [intH,setIntH] = useState("");

  function submit(){
    onCreate({
      name,
      supplier_id: supplier === "" ? null : Number(supplier),
      material: material || null,
      jewish,
      ext_width_in: numOrNull(extW),
      ext_length_in: numOrNull(extL),
      ext_height_in: numOrNull(extH),
      int_width_in: numOrNull(intW),
      int_length_in: numOrNull(intL),
      int_height_in: numOrNull(intH),
    }, () => setOpen(false));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Add Casket</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Casket</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-white/60">Name</div>
            <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Casket name" />
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
            <div className="text-xs text-white/60">Material</div>
            <select className="w-full rounded-md bg-white/5 border border-white/10 px-2 py-2 text-sm [&>option]:bg-white [&>option]:text-black"
              value={material} onChange={(e)=>setMaterial(e.target.value as any)}>
              <option value="">—</option>
              <option value="WOOD">Wood</option>
              <option value="METAL">Metal</option>
              <option value="GREEN">Green Burial</option>
            </select>
          </div>
          <label className="flex items-end gap-2">
            <input type="checkbox" className="accent-emerald-400" checked={jewish} onChange={e=>setJewish(e.target.checked)} />
            <span className="text-sm">Jewish</span>
          </label>

          {/* Exterior */}
          <div className="md:col-span-2 mt-2 text-xs uppercase tracking-wider text-white/50">Exterior (inches)</div>
          <Input placeholder="Width" value={extW} onChange={(e)=>setExtW(e.target.value)} />
          <Input placeholder="Length" value={extL} onChange={(e)=>setExtL(e.target.value)} />
          <Input placeholder="Height" value={extH} onChange={(e)=>setExtH(e.target.value)} />

          {/* Interior */}
          <div className="md:col-span-2 mt-2 text-xs uppercase tracking-wider text-white/50">Interior (inches)</div>
          <Input placeholder="Width" value={intW} onChange={(e)=>setIntW(e.target.value)} />
          <Input placeholder="Length" value={intL} onChange={(e)=>setIntL(e.target.value)} />
          <Input placeholder="Height" value={intH} onChange={(e)=>setIntH(e.target.value)} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------ Casket Card ------------------ */
function CasketCard({
  row, suppliers, onSave, onDelete
}:{
  row: Casket;
  suppliers: Supplier[];
  onSave: (id:number, patch:Partial<Casket>)=>void;
  onDelete: (id:number)=>void;
}) {
  const [editing,setEditing] = useState(false);
  const [name,setName] = useState(row.name);
  const [material,setMaterial] = useState<""|"WOOD"|"METAL"|"GREEN">(row.material ?? "");
  const [supplier,setSupplier] = useState<number | "">(row.supplier_id ?? "");
  const [jewish,setJewish] = useState(row.jewish);
  const [extW,setExtW] = useState(row.ext_width_in?.toString() ?? "");
  const [extL,setExtL] = useState(row.ext_length_in?.toString() ?? "");
  const [extH,setExtH] = useState(row.ext_height_in?.toString() ?? "");
  const [intW,setIntW] = useState(row.int_width_in?.toString() ?? "");
  const [intL,setIntL] = useState(row.int_length_in?.toString() ?? "");
  const [intH,setIntH] = useState(row.int_height_in?.toString() ?? "");

  function reset(){
    setEditing(false);
    setName(row.name);
    setMaterial(row.material ?? "");
    setSupplier(row.supplier_id ?? "");
    setJewish(row.jewish);
    setExtW(row.ext_width_in?.toString() ?? "");
    setExtL(row.ext_length_in?.toString() ?? "");
    setExtH(row.ext_height_in?.toString() ?? "");
    setIntW(row.int_width_in?.toString() ?? "");
    setIntL(row.int_length_in?.toString() ?? "");
    setIntH(row.int_height_in?.toString() ?? "");
  }

  async function save(){
    await onSave(row.id, {
      name,
      supplier_id: supplier === "" ? null : Number(supplier),
      material: material || null,
      jewish,
      ext_width_in: extW.trim()===""? null : Number(extW),
      ext_length_in: extL.trim()===""? null : Number(extL),
      ext_height_in: extH.trim()===""? null : Number(extH),
      int_width_in: intW.trim()===""? null : Number(intW),
      int_length_in: intL.trim()===""? null : Number(intL),
      int_height_in: intH.trim()===""? null : Number(intH),
    });
    setEditing(false);
  }

  return (
    <HoloPanel>
      {!editing ? (
        <div className="space-y-2">
          <div className="text-lg font-semibold">{row.name}</div>
          <div className="text-sm text-white/70">Material: {row.material ?? "—"}{row.jewish ? " • Jewish" : ""}</div>
          <div className="text-sm text-white/70">
            <span className="font-medium">Exterior:</span> W {row.ext_width_in ?? "—"}″ • L {row.ext_length_in ?? "—"}″ • H {row.ext_height_in ?? "—"}″
          </div>
          <div className="text-sm text-white/70">
            <span className="font-medium">Interior:</span> W {row.int_width_in ?? "—"}″ • L {row.int_length_in ?? "—"}″ • H {row.int_height_in ?? "—"}″
          </div>
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
            <Input placeholder="Ext W" value={extW} onChange={(e)=>setExtW(e.target.value)} />
            <Input placeholder="Ext L" value={extL} onChange={(e)=>setExtL(e.target.value)} />
            <Input placeholder="Ext H" value={extH} onChange={(e)=>setExtH(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Int W" value={intW} onChange={(e)=>setIntW(e.target.value)} />
            <Input placeholder="Int L" value={intL} onChange={(e)=>setIntL(e.target.value)} />
            <Input placeholder="Int H" value={intH} onChange={(e)=>setIntH(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="rounded-md bg-white/5 border border-white/10 px-2 py-2 text-sm [&>option]:bg-white [&>option]:text-black" value={material} onChange={(e)=>setMaterial(e.target.value as any)}>
              <option value="">—</option><option value="WOOD">Wood</option><option value="METAL">Metal</option><option value="GREEN">Green Burial</option>
            </select>
            <select className="rounded-md bg-white/5 border border-white/10 px-2 py-2 text-sm [&>option]:bg-white [&>option]:text-black" value={supplier} onChange={(e)=>setSupplier(e.target.value ? Number(e.target.value) : "")}>
              <option value="">No supplier</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-emerald-400" checked={jewish} onChange={(e)=>setJewish(e.target.checked)} />
            <span className="text-sm">Jewish</span>
          </label>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>Cancel</Button>
            <Button onClick={save} disabled={!name}>Save</Button>
          </div>
        </div>
      )}
    </HoloPanel>
  );
}
