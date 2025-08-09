"use client";
import React, { useEffect, useState } from "react";
import { HoloPanel } from "../../components/HoloPanel";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

type Supplier = { id:number; name:string; ordering_instructions:string | null };

export default function ManageSuppliers() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [instr, setInstr] = useState("");

  async function reload() {
    const s = await fetch("/api/suppliers").then(r=>r.json());
    setRows(s);
  }
  useEffect(()=>{ reload(); }, []);

  async function add() {
    const res = await fetch("/api/suppliers", { method:"POST", body: JSON.stringify({ name, ordering_instructions: instr || null }) });
    if (res.ok) { setName(""); setInstr(""); reload(); } else alert(await res.text());
  }
  async function save(id:number, partial: Partial<Supplier>) {
    const res = await fetch(`/api/suppliers/${id}`, { method:"PATCH", body: JSON.stringify(partial) });
    if (res.ok) reload(); else alert(await res.text());
  }
  async function remove(id:number) {
    if (!confirm("Delete supplier?")) return;
    const res = await fetch(`/api/suppliers/${id}`, { method:"DELETE" });
    if (res.ok) reload(); else alert(await res.text());
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Manage Suppliers</h1>

      <HoloPanel>
        <div className="grid md:grid-cols-3 gap-3">
          <Input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
          <Input placeholder="Ordering instructions" value={instr} onChange={(e)=>setInstr(e.target.value)} />
          <Button onClick={add} disabled={!name}>Add</Button>
        </div>
      </HoloPanel>

      <div className="space-y-3">
        {rows.map(r=>(
          <HoloPanel key={r.id}>
            <div className="grid md:grid-cols-3 gap-3 items-center">
              <Input defaultValue={r.name} onBlur={(e)=>save(r.id, { name: e.target.value })} />
              <Input defaultValue={r.ordering_instructions ?? ""} onBlur={(e)=>save(r.id, { ordering_instructions: e.target.value || null })} />
              <div className="flex justify-end"><Button variant="outline" onClick={()=>remove(r.id)}>Delete</Button></div>
            </div>
          </HoloPanel>
        ))}
      </div>
    </div>
  );
}
