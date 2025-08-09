"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { SearchBar } from "../components/SearchBar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

type Supplier = { id:number; name:string; ordering_instructions:string | null };

export default function SuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");

  async function reload() { const s = await fetch("/api/suppliers").then(r=>r.json()); setRows(s); }
  useEffect(()=>{ reload(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      r.name.toLowerCase().includes(s) ||
      (r.ordering_instructions ?? "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  async function save(id:number, patch: Partial<Supplier>) {
    const res = await fetch(`/api/suppliers/${id}`, { method:"PATCH", body: JSON.stringify(patch) });
    if (res.ok) reload(); else alert(await res.text());
  }
  async function remove(id:number) {
    if (!confirm("Delete supplier?")) return;
    const res = await fetch(`/api/suppliers/${id}`, { method:"DELETE" });
    if (res.ok) reload(); else alert(await res.text());
  }
  async function addSupplier(payload:any, close: () => void) {
    const res = await fetch("/api/suppliers", { method:"POST", body: JSON.stringify(payload) });
    if (res.ok) { reload(); close(); } else alert(await res.text());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Suppliers</h1>
        <div className="flex gap-3 items-center">
          <div className="w-80"><SearchBar value={q} onChange={setQ} placeholder="Search suppliers..." /></div>
          <AddSupplierModal onCreate={addSupplier} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(r => (
          <SupplierCard key={r.id} row={r} onSave={save} onDelete={remove} />
        ))}
        {filtered.length === 0 && <div className="text-white/60">No matches.</div>}
      </div>
    </div>
  );
}

function AddSupplierModal({ onCreate }:{ onCreate: (payload:any, close: () => void) => void }) {
  const [open,setOpen] = useState(false);
  const [name,setName] = useState("");
  const [instr,setInstr] = useState("");

  function submit(){ onCreate({ name, ordering_instructions: instr || null }, () => setOpen(false)); }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Add Supplier</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-white/60">Name</div>
            <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Supplier name" />
          </div>
          <div className="md:col-span-2">
            <div className="text-xs text-white/60">Ordering instructions</div>
            <Input value={instr} onChange={(e)=>setInstr(e.target.value)} placeholder="How to place POs" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SupplierCard({ row, onSave, onDelete }:{
  row: Supplier;
  onSave: (id:number, patch:Partial<Supplier>)=>void;
  onDelete: (id:number)=>void;
}) {
  const [editing, setEditing] = useState(false);
  const [name,setName] = useState(row.name);
  const [instr,setInstr] = useState(row.ordering_instructions ?? "");

  function reset(){ setEditing(false); setName(row.name); setInstr(row.ordering_instructions ?? ""); }
  async function save(){ await onSave(row.id, { name, ordering_instructions: instr || null }); setEditing(false); }

  return (
    <HoloPanel>
      {!editing ? (
        <div className="space-y-2">
          <div className="text-lg font-semibold">{row.name}</div>
          <div className="text-sm text-white/70">{row.ordering_instructions ?? "—"}</div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={()=>setEditing(true)}>Edit</Button>
            <Button variant="outline" onClick={()=>onDelete(row.id)}>Delete</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input value={name} onChange={(e)=>setName(e.target.value)} />
          <Input value={instr} onChange={(e)=>setInstr(e.target.value)} placeholder="Ordering instructions" />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>Cancel</Button>
            <Button onClick={save} disabled={!name}>Save</Button>
          </div>
        </div>
      )}
    </HoloPanel>
  );
}
