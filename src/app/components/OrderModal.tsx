"use client";

/**
 * LANDMARK: OrderModal (Create Order)
 * - Fixed center, max-h viewport, scrollable, z-[80]
 * - Proper DialogTitle heading
 * - Inline button only (no full-width bar)
 * - Selection clarity: selected row highlighted + checkmark
 */

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import type { Casket, Supplier, Urn } from "@/lib/types";

type Mode = "casket" | "urn" | "special";
type SpecialMode = "catalog" | "custom";

export default function OrderModal({ onCreated }: { onCreated?: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);

  const [caskets, setCaskets] = useState<Casket[]>([]);
  const [urns, setUrns] = useState<Urn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [mode, setMode] = useState<Mode>("casket");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [po, setPo] = useState("");
  const [expected, setExpected] = useState<string>("");
  const [tbd, setTbd] = useState(false);
  const [backordered, setBackordered] = useState(false);
  const [notes, setNotes] = useState("");

  const [specialMode, setSpecialMode] = useState<SpecialMode>("catalog");
  const [customName, setCustomName] = useState("");
  const [customSupplierId, setCustomSupplierId] = useState<number | "">("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [cs, us, ss] = await Promise.all([
        fetch("/api/caskets").then((r) => r.json()),
        fetch("/api/urns").then((r) => r.json()),
        fetch("/api/suppliers").then((r) => r.json()),
      ]);
      setCaskets(cs ?? []);
      setUrns(us ?? []);
      setSuppliers(ss ?? []);
    })();
  }, [open]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const data = mode === "casket" || (mode === "special" && specialMode === "catalog") ? caskets : urns;
    if (!term) return data;
    return data.filter((x) => x.name.toLowerCase().includes(term));
  }, [caskets, urns, mode, q, specialMode]);

  const selectedItem = useMemo(() => {
    if (mode === "casket" || (mode === "special" && specialMode === "catalog")) {
      return caskets.find((c) => c.id === selectedId) ?? null;
    } else if (mode === "urn") {
      return urns.find((u) => u.id === selectedId) ?? null;
    }
    return null;
  }, [selectedId, mode, specialMode, caskets, urns]);

  const supplierName = useMemo(() => {
    const sid =
      selectedItem?.supplier_id ??
      (mode === "special" && specialMode === "custom" && customSupplierId ? Number(customSupplierId) : null);
    if (!sid) return "";
    return suppliers.find((s) => s.id === sid)?.name ?? "";
  }, [selectedItem, suppliers, mode, specialMode, customSupplierId]);

  function reset() {
    setMode("casket");
    setQ("");
    setSelectedId(null);
    setPo("");
    setExpected("");
    setTbd(false);
    setBackordered(false);
    setNotes("");
    setSpecialMode("catalog");
    setCustomName("");
    setCustomSupplierId("");
  }

  async function submit() {
    if (!po.trim()) {
      alert("PO# is required");
      return;
    }
    const payload: any = {
      po_number: po.trim(),
      backordered,
      tbd_expected: backordered ? tbd : false,
      expected_date: backordered ? (tbd ? null : (expected || null)) : (expected || null),
      notes: notes || null,
      need_by_date: null,
      is_return: false,
    };

    if (mode === "casket") {
      if (!selectedId) return alert("Pick a casket");
      payload.item_type = "casket";
      payload.item_id = selectedId;
      payload.special_order = false;
      payload.status = backordered ? "BACKORDERED" : "PENDING";
    } else if (mode === "urn") {
      if (!selectedId) return alert("Pick an urn");
      payload.item_type = "urn";
      payload.item_id = selectedId;
      payload.special_order = false;
      payload.status = backordered ? "BACKORDERED" : "PENDING";
    } else {
      payload.status = "SPECIAL";
      payload.special_order = true;
      if (specialMode === "catalog") {
        if (!selectedId) return alert("Pick an item from the catalog or switch to Custom");
        const picked = caskets.find((c) => c.id === selectedId) ?? urns.find((u) => u.id === selectedId);
        payload.item_type = picked ? ("width_in" in (picked as any) ? "urn" : "casket") : "casket";
        payload.item_id = picked?.id ?? null;
        payload.item_name = picked?.name ?? null;
        payload.supplier_id = picked?.supplier_id ?? null;
      } else {
        if (!customName.trim()) return alert("Enter a custom item name");
        if (!customSupplierId) return alert("Choose a supplier");
        payload.item_type = "casket"; // default classification (doesn’t affect inventory)
        payload.item_id = null;
        payload.item_name = customName.trim();
        payload.supplier_id = Number(customSupplierId);
      }
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      alert(`Failed: ${text}`);
      return;
    }

    setOpen(false);
    reset();
    await onCreated?.();
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-2 px-3 h-9 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
        onClick={() => setOpen(true)}
      >
        + Create Order
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setOpen(false); reset(); }} />
          <div className="relative w-full max-w-3xl mx-4 rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl p-5 shadow-[0_0_60px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-auto">
            {/* DialogTitle */}
            <h2 className="text-white/90 text-sm mb-3">Create Order</h2>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-3">
              <ModeTab active={mode==="casket"} onClick={()=>{setMode("casket"); setSpecialMode("catalog"); setSelectedId(null);}}>Casket</ModeTab>
              <ModeTab active={mode==="urn"} onClick={()=>{setMode("urn"); setSpecialMode("catalog"); setSelectedId(null);}}>Urn</ModeTab>
              <ModeTab active={mode==="special"} onClick={()=>{setMode("special"); setSelectedId(null);}}>Special</ModeTab>
            </div>

            {/* Special sub-toggle */}
            {mode==="special" && (
              <div className="flex gap-2 mb-3">
                <ModeSubTab active={specialMode==="catalog"} onClick={()=>{setSpecialMode("catalog"); setSelectedId(null);}}>From Catalog</ModeSubTab>
                <ModeSubTab active={specialMode==="custom"} onClick={()=>{setSpecialMode("custom"); setSelectedId(null);}}>Custom Item</ModeSubTab>
              </div>
            )}

            {/* Search + list */}
            {!(mode==="special" && specialMode==="custom") && (
              <>
                <div className="mb-2">
                  <Input className="input-sm" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search items..." />
                </div>
                <div className="max-h-56 overflow-auto rounded-lg border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 sticky top-0">
                      <tr className="text-white/60">
                        <th className="text-left font-normal px-3 py-2">Name</th>
                        <th className="text-left font-normal px-3 py-2">Supplier</th>
                        <th className="text-left font-normal px-3 py-2 w-16">Pick</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((row) => {
                        const sid = (row as any).supplier_id;
                        const sname = suppliers.find((s) => s.id === sid)?.name ?? "—";
                        const selected = selectedId === row.id;
                        return (
                          <tr
                            key={row.id}
                            className={`border-t border-white/5 ${selected ? "bg-cyan-900/30 outline outline-2 outline-cyan-400/60" : "hover:bg-white/5"}`}
                          >
                            <td className="px-3 py-2 text-white/90">{row.name}</td>
                            <td className="px-3 py-2 text-white/60">{sname}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={()=>setSelectedId(row.id)}
                                className={`h-7 w-7 inline-flex items-center justify-center rounded-md border ${selected ? "border-cyan-400/60 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"} focus:outline-none focus:ring-2 focus:ring-cyan-400/60`}
                                aria-pressed={selected}
                                aria-label="Select item"
                              >
                                {selected ? (
                                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                    <path d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l7.1-7.1 1.4 1.4z" fill="currentColor"/>
                                  </svg>
                                ) : (
                                  <span className="text-white/50">•</span>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {list.length === 0 && (
                        <tr>
                          <td className="px-3 py-6 text-center text-white/50" colSpan={3}>No items match your search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Special custom form */}
            {mode==="special" && specialMode==="custom" && (
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="label-xs">Custom item name</div>
                  <Input className="input-sm" value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="e.g., Special Mahogany 32x84" />
                </div>
                <div>
                  <div className="label-xs">Supplier</div>
                  <select
                    className="select-sm w-full text-white bg-white/5 border border-white/10 rounded-md"
                    value={customSupplierId as any}
                    onChange={(e)=>setCustomSupplierId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">Pick supplier…</option>
                    {suppliers.map((s)=>(
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Supplier derived */}
            <div className="grid md:grid-cols-3 gap-3 mb-3">
              <div>
                <div className="label-xs">PO#</div>
                <Input className="input-sm" value={po} onChange={e=>setPo(e.target.value)} />
              </div>
              <div>
                <div className="label-xs">Supplier</div>
                <Input className="input-sm" value={supplierName} readOnly placeholder="Auto from item / choose in Custom" />
              </div>
              <div>
                <div className="label-xs">Backordered?</div>
                <div className="h-9 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-white/80 text-sm">
                    <input type="checkbox" className="accent-rose-400" checked={backordered} onChange={(e)=>{ setBackordered(e.target.checked); if(!e.target.checked){ setTbd(false); setExpected(""); } }} />
                    Backordered
                  </label>
                </div>
              </div>
            </div>

            {backordered ? (
              <div className="grid md:grid-cols-3 gap-3 mb-3">
                <div>
                  <div className="label-xs">Expected date</div>
                  <Input className="input-sm" type="date" value={expected} onChange={e=>{ setExpected(e.target.value); setTbd(false); }} disabled={tbd}/>
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-white/80 text-sm">
                    <input type="checkbox" className="accent-rose-400" checked={tbd} onChange={(e)=>{ setTbd(e.target.checked); if(e.target.checked){ setExpected(""); } }} />
                    TBD
                  </label>
                </div>
                <div>
                  <div className="label-xs">Notes</div>
                  <Input className="input-sm" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Backorder notes…" />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-3 mb-3">
                <div>
                  <div className="label-xs">Expected date</div>
                  <Input className="input-sm" type="date" value={expected} onChange={e=>setExpected(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <div className="label-xs">Notes</div>
                  <Input className="input-sm" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional notes…" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={()=>{ setOpen(false); reset(); }}>Cancel</Button>
              <Button type="button" onClick={submit} disabled={!po.trim() || (mode!=="special" && !selectedId) || (mode==="special" && specialMode==="custom" && (!customName.trim() || !customSupplierId))}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ModeTab({ active, onClick, children }:{ active:boolean; onClick:()=>void; children:React.ReactNode; }){
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-md border ${active ? "border-cyan-400/60 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"} text-sm`}
    >
      {children}
    </button>
  );
}
function ModeSubTab({ active, onClick, children }:{ active:boolean; onClick:()=>void; children:React.ReactNode; }){
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-md border ${active ? "border-emerald-400/60 bg-emerald-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"} text-xs`}
    >
      {children}
    </button>
  );
}
