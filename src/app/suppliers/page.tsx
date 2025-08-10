"use client";

import React, { useEffect, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Supplier } from "@/lib/types";

const IconEdit = (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/><path d="M20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>);
const IconTrash = (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" fill="currentColor"/></svg>);
const IconLink = (p: React.SVGProps<SVGSVGElement>) => (<svg viewBox="0 0 24 24" width="14" height="14" {...p}><path d="M3.9 12a4.1 4.1 0 0 1 4.1-4.1h3v2h-3a2.1 2.1 0 0 0 0 4.2h3v2h-3A4.1 4.1 0 0 1 3.9 12Zm12-4.1a4.1 4.1 0 0 1 0 8.2h-3v-2h3a2.1 2.1 0 1 0 0-4.2h-3v-2h3Z" fill="currentColor"/></svg>);

export default function SuppliersPage(){
  const [rows, setRows] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");
  const [editRow, setEditRow] = useState<Supplier | null>(null);

  // form fields
  const [fName, setFName] = useState("");
  const [fInstr, setFInstr] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fWebsite, setFWebsite] = useState("");

  async function load(){
    const data = await fetch("/api/suppliers").then(r=>r.json());
    setRows(data ?? []);
  }
  useEffect(()=>{ load(); },[]);

  useEffect(()=>{
    if(!editRow) return;
    setFName(editRow.name ?? "");
    setFInstr(editRow.ordering_instructions ?? "");
    setFPhone(editRow.phone ?? "");
    setFEmail(editRow.email ?? "");
    setFWebsite(editRow.ordering_website ?? "");
  },[editRow]);

  const filtered = rows.filter(r=>{
    const t = `${r.name} ${r.ordering_instructions ?? ""} ${r.phone ?? ""} ${r.email ?? ""}`.toLowerCase();
    return t.includes(q.trim().toLowerCase());
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">Suppliers</h1>
        <Button onClick={()=>setEditRow({} as any)}>Add Supplier</Button>
      </div>

      <HoloPanel railColor="cyan">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <div className="label-xs">Search</div>
            <Input className="input-sm" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search supplier or notes..." />
          </div>
        </div>
      </HoloPanel>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map((s)=>(
          <HoloPanel key={s.id} railColor="amber" className="pb-10 flex flex-col">
            <div className="text-white/90">{s.name}</div>
            <div className="text-xs text-white/60 mt-1 whitespace-pre-wrap">{s.ordering_instructions || "—"}</div>
            <div className="text-xs text-white/60 mt-2 space-y-1">
              {s.phone && <div>Phone: <span className="text-white/80">{s.phone}</span></div>}
              {s.email && <div>Email: <span className="text-white/80">{s.email}</span></div>}
              {s.ordering_website && (
                <div className="flex items-center gap-1">
                  <IconLink className="text-cyan-300" />
                  <a className="text-cyan-300 hover:underline" href={s.ordering_website} target="_blank" rel="noreferrer">Ordering Website</a>
                </div>
              )}
            </div>
            <div className="mt-auto pt-3 flex items-center justify-end gap-2 border-t border-white/10">
              <IconBtn title="Edit" onClick={()=>setEditRow(s)}><IconEdit className="text-white/80"/></IconBtn>
              <IconBtn title="Delete" onClick={async ()=>{
                if(!confirm("Delete this supplier?")) return;
                const res = await fetch(`/api/suppliers/${s.id}`, { method:"DELETE" });
                if(!res.ok){ alert(await res.text()); return; }
                load();
              }}><IconTrash className="text-rose-400"/></IconBtn>
            </div>
          </HoloPanel>
        ))}
      </div>

      {editRow!==null && (
        <Modal onClose={()=>setEditRow(null)} title={editRow.id ? "Edit Supplier" : "Add Supplier"}>
          <form className="space-y-3" onSubmit={async (e)=>{
            e.preventDefault();
            const id = editRow!.id;
            const method = id ? "PATCH" : "POST";
            const url = id ? `/api/suppliers/${id}` : "/api/suppliers";
            const body:any = {
              name: fName.trim(),
              ordering_instructions: fInstr || null,
              phone: fPhone || null,
              email: fEmail || null,
              ordering_website: fWebsite || null,
            };
            const res = await fetch(url, { method, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
            if(!res.ok){ alert(await res.text()); return; }
            setEditRow(null); await load();
          }}>
            <div className="grid md:grid-cols-2 gap-3">
              <Text label="Name" value={fName} onChange={setFName}/>
              <Text label="Phone" value={fPhone} onChange={setFPhone}/>
              <Text label="Email" value={fEmail} onChange={setFEmail}/>
              <Text label="Ordering Website (https://…)" value={fWebsite} onChange={setFWebsite}/>
              <div className="md:col-span-2">
                <div className="label-xs">Ordering Instructions</div>
                <textarea className="w-full min-h-[120px] rounded-md border border-white/10 bg-white/5 text-white/90 p-2" value={fInstr} onChange={e=>setFInstr(e.target.value)} placeholder="Notes for ordering…"/>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={()=>setEditRow(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}
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
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl border border-white/10 bg-neutral-900/90 backdrop-blur-xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.45)] max-h-[90vh] overflow-auto">
        <h2 className="text-white/90 text-sm mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}
function Text({label,value,onChange}:{label:string; value:string; onChange:(v:string)=>void;}){
  return (<div><div className="label-xs">{label}</div><Input className="input-sm" value={value} onChange={e=>onChange(e.target.value)}/></div>);
}
