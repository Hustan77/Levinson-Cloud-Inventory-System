"use client";

import React, { useEffect, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Supplier } from "../../lib/types";

export default function SuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState<null | { mode:"add" } | { mode:"edit", row: Supplier }>(null);

  async function load() {
    const s = await fetch("/api/suppliers", { cache: "no-store" }).then(r=>r.json());
    setRows(s);
  }
  useEffect(()=>{ load(); }, []);

  const filtered = rows.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">Suppliers</h1>
        <Button variant="default" onClick={()=>setOpenModal({ mode:"add" })}>Add Supplier</Button>
      </div>

      <HoloPanel railColor="cyan">
        <div className="grid md:grid-cols-3 gap-2">
          <div className="space-y-1">
            <div className="label-xs">Search</div>
            <Input className="input-sm" placeholder="Name..." value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <div className="self-end"><Button variant="outline" onClick={load}>Refresh</Button></div>
        </div>
      </HoloPanel>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(row => (
          <HoloPanel key={row.id} railColor="amber">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white/90">{row.name}</div>
                {row.ordering_instructions && (
                  <div className="text-xs text-emerald-300/80 mt-1">{row.ordering_instructions}</div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" onClick={()=>setOpenModal({ mode:"edit", row })}>Edit</Button>
                <Button size="sm" variant="outline" onClick={async ()=>{
                  if(!confirm("Delete this supplier?")) return;
                  const res = await fetch(`/api/suppliers/${row.id}`, { method: "DELETE" });
                  if(!res.ok){ alert(await res.text()); return; }
                  load();
                }}>Delete</Button>
              </div>
            </div>
          </HoloPanel>
        ))}
      </div>

      {openModal && (
        <SupplierModal
          mode={openModal.mode}
          row={openModal.mode==='edit'? openModal.row : undefined}
          onClose={()=>setOpenModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function SupplierModal({ mode, row, onClose, onSaved }:{
  mode:"add"|"edit"; row?: Supplier; onClose:()=>void; onSaved:()=>void;
}) {
  const [name, setName] = useState(row?.name ?? "");
  const [instr, setInstr] = useState(row?.ordering_instructions ?? "");

  async function save() {
    const payload = { name: name.trim(), ordering_instructions: instr.trim() || null };
    const url = mode==="add" ? "/api/suppliers" : `/api/suppliers/${row!.id}`;
    const method = mode==="add" ? "POST" : "PATCH";
    const res = await fetch(url, { method, body: JSON.stringify(payload) });
    if(!res.ok){ alert(await res.text()); return; }
    onClose(); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <HoloPanel railColor="amber" className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/90">{mode==="add" ? "Add Supplier" : "Edit Supplier"}</div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="space-y-2">
          <div className="space-y-1"><div className="label-xs">Name</div><Input value={name} onChange={e=>setName(e.target.value)} /></div>
          <div className="space-y-1"><div className="label-xs">Ordering Instructions</div><textarea className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-sm" rows={5} value={instr ?? ""} onChange={e=>setInstr(e.target.value)} /></div>
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={save}>Save</Button></div>
      </HoloPanel>
    </div>
  );
}
