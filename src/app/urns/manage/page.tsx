"use client";
import React, { useEffect, useState } from "react";
import { HoloPanel } from "../../components/HoloPanel";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

type Urn = { id:number; name:string; supplier_id:number | null };
type Supplier = { id:number; name:string };

export default function ManageUrns() {
  const [rows, setRows] = useState<Urn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [supplierId, setSupplierId] = useState<number | "">("");

  async function reload() {
    const [u, s] = await Promise.all([
      fetch("/api/urns").then(r=>r.json()),
      fetch("/api/suppliers").then(r=>r.json())
    ]);
    setRows(u); setSuppliers(s);
  }
  useEffect(()=>{ reload(); }, []);

  async function add() {
    const res = await fetch("/api/urns", {
      method:"POST",
      body: JSON.stringify({ name, supplier_id: supplierId === "" ? null : Number(supplierId) })
    });
    if (res.ok) { setName(""); setSupplierId(""); reload(); }
    else alert(await res.text());
  }

  async function save(id:number, partial: Partial<Urn>) {
    const res = await fetch(`/api/urns/${id}`, { method:"PATCH", body: JSON.stringify(partial) });
    if (res.ok) reload(); else alert(await res.text());
  }

  async function remove(id:number) {
    if (!confirm("Delete urn?")) return;
    const res = await fetch(`/api/urns/${id}`, { method:"DELETE" });
    if (res.ok) reload(); else alert(await res.text());
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Manage Urns</h1>

      <HoloPanel>
        <div className="grid md:grid-cols-4 gap-3">
          <Input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
          <select
            className="rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
            value={supplierId}
            onChange={(e)=>setSupplierId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">No supplier</option>
            {suppliers.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div />
          <Button onClick={add} disabled={!name}>Add</Button>
        </div>
      </HoloPanel>

      <div className="space-y-3">
        {rows.map(r=>(
          <HoloPanel key={r.id}>
            <div className="grid md:grid-cols-4 gap-3 items-center">
              <Input defaultValue={r.name} onBlur={(e)=>save(r.id, { name: e.target.value })} />
              <select
                className="rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
                defaultValue={r.supplier_id ?? ""}
                onChange={(e)=>save(r.id, { supplier_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">No supplier</option>
                {suppliers.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="text-sm text-white/70">ID: {r.id}</div>
              <div className="flex justify-end"><Button variant="outline" onClick={()=>remove(r.id)}>Delete</Button></div>
            </div>
          </HoloPanel>
        ))}
      </div>
    </div>
  );
}
