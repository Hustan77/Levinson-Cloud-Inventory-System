"use client";

/**
 * LANDMARK: OrderModal (Create Order)
 * - Clean searchable combobox
 * - Once selected, the list collapses to only the chosen item, with a “Change” control
 * - Supplier’s ordering website link shows when known
 * - Backorder flow: date or TBD + notes
 * - Special order: choose from catalog (searchable) or custom (pick supplier)
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
  const [specialMode, setSpecialMode] = useState<SpecialMode>("catalog");

  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [po, setPo] = useState("");
  const [expected, setExpected] = useState<string>("");
  const [tbd, setTbd] = useState(false);
  const [backordered, setBackordered] = useState(false);
  const [notes, setNotes] = useState("");

  // special custom
  const [customName, setCustomName] = useState("");
  const [customSupplierId, setCustomSupplierId] = useState<number | "">("");

  // load data when opened
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

  // combined list for current mode
  const list = useMemo(() => {
    const base =
      mode === "urn"
        ? urns
        : mode === "casket"
        ? caskets
        : specialMode === "catalog"
        ? [...caskets, ...urns]
        : [];
    const term = q.trim().toLowerCase();
    if (!term) return base;
    const tokens = term.split(/\s+/);
    return base.filter((x) => {
      const sname = suppliers.find((s) => s.id === (x as any).supplier_id)?.name ?? "";
      const hay = `${x.name} ${sname}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [mode, specialMode, caskets, urns, suppliers, q]);

  // chosen item (if any)
  const selectedItem = useMemo(() => {
    if (!selectedId) return null;
    const pool = mode === "urn" ? urns : mode === "casket" ? caskets : [...caskets, ...urns];
    return pool.find((x) => x.id === selectedId) ?? null;
  }, [selectedId, mode, specialMode, caskets, urns]);

  const selectedSupplier = useMemo(() => {
    const sid =
      selectedItem?.supplier_id ??
      (mode === "special" && specialMode === "custom" && customSupplierId ? Number(customSupplierId) : null);
    if (!sid) return null;
    return suppliers.find((s) => s.id === sid) ?? null;
  }, [selectedItem, suppliers, mode, specialMode, customSupplierId]);

  function reset() {
    setMode("casket");
    setSpecialMode("catalog");
    setQ("");
    setSelectedId(null);
    setPo("");
    setExpected("");
    setTbd(false);
    setBackordered(false);
    setNotes("");
    setCustomName("");
    setCustomSupplierId("");
  }

  async function submit() {
    if (!po.trim()) return alert("PO# is required");

    const payload: any = {
      po_number: po.trim(),
      backordered,
      tbd_expected: backordered ? tbd : false,
      expected_date: backordered ? (tbd ? null : expected || null) : expected || null,
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
        const picked = [...caskets, ...urns].find((x) => x.id === selectedId);
        if (!picked) return alert("Could not resolve selected item");
        payload.item_type = "width_in" in (picked as any) ? "urn" : "casket";
        payload.item_id = picked.id;
        payload.item_name = picked.name;
        payload.supplier_id = (picked as any).supplier_id ?? null;
      } else {
        if (!customName.trim()) return alert("Enter a custom item name");
        if (!customSupplierId) return alert("Choose a supplier");
        payload.item_type = "casket"; // neutral classification (does not affect inventory counts)
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
      alert(await res.text());
      return;
    }

    setOpen(false);
    reset();
    await onCreated?.();
  }

  // UI bits
  function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
  function ModeSubTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setOpen(false); reset(); }} />
          <div className="relative w-full max-w-3xl mx-4 rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl p-5 shadow-[0_0_60px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-auto">
            {/* DialogTitle */}
            <h2 className="text-white/90 text-sm mb-3">Create Order</h2>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-3">
              <ModeTab active={mode==="casket"} onClick={()=>{ setMode("casket"); setSpecialMode("catalog"); setSelectedId(null); setQ(""); }}>Casket</ModeTab>
              <ModeTab active={mode==="urn"} onClick={()=>{ setMode("urn"); setSpecialMode("catalog"); setSelectedId(null); setQ(""); }}>Urn</ModeTab>
              <ModeTab active={mode==="special"} onClick={()=>{ setMode("special"); setSelectedId(null); setQ(""); }}>Special</ModeTab>
            </div>

            {/* Special sub-toggle */}
            {mode==="special" && (
              <div className="flex gap-2 mb-3">
                <ModeSubTab active={specialMode==="catalog"} onClick={()=>{ setSpecialMode("catalog"); setSelectedId(null); setQ(""); }}>From Catalog</ModeSubTab>
                <ModeSubTab active={specialMode==="custom"} onClick={()=>{ setSpecialMode("custom"); setSelectedId(null); setQ(""); }}>Custom Item</ModeSubTab>
              </div>
            )}

            {/* Searchable combobox + list (hidden after selection) */}
            {!(mode==="special" && specialMode==="custom") && (
              <div className="mb-3">
                <div className="label-xs">Search {mode==="urn" ? "Urns" : mode==="casket" ? "Caskets" : "Catalog"} (type to filter)</div>
                {!selectedItem && (
                  <>
                    <Input
                      className="input-sm"
                      value={q}
                      onChange={(e)=>setQ(e.target.value)}
                      placeholder="Type name or supplier…"
                    />
                    <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-white/10">
                      <table className="w-full text-sm">
                        <thead className="bg-white/5 sticky top-0">
                          <tr className="text-white/60">
                            <th className="text-left font-normal px-3 py-2">Name</th>
                            <th className="text-left font-normal px-3 py-2">Supplier</th>
                            <th className="text-left font-normal px-3 py-2 w-16">Pick</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((row)=> {
                            const sid = (row as any).supplier_id;
                            const s = suppliers.find((x)=>x.id===sid);
                            return (
                              <tr key={row.id} className="border-t border-white/5 hover:bg-white/5">
                                <td className="px-3 py-2 text-white/90">{row.name}</td>
                                <td className="px-3 py-2 text-white/70">{s?.name ?? "—"}</td>
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={()=>setSelectedId(row.id)}
                                    className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-cyan-400/60 bg-cyan-400/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
                                    aria-label="Select"
                                  >
                                    ✓
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {list.length===0 && (
                            <tr><td className="px-3 py-6 text-center text-white/50" colSpan={3}>No matches.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {selectedItem && (
                  <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white/90">
                        <div className="text-sm">{selectedItem.name}</div>
                        <div className="text-xs text-white/60">
                          Supplier: {selectedSupplier?.name ?? "—"}
                        </div>
                        {selectedSupplier?.ordering_website && (
                          <div className="text-xs mt-1">
                            <a
                              className="text-cyan-300 hover:underline"
                              href={selectedSupplier.ordering_website}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Visit Ordering Site
                            </a>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="h-8 px-3 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
                        onClick={()=>{ setSelectedId(null); setQ(""); }}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

            {/* PO / Supplier derived */}
            <div className="grid md:grid-cols-3 gap-3 mb-3">
              <div>
                <div className="label-xs">PO#</div>
                <Input className="input-sm" value={po} onChange={e=>setPo(e.target.value)} />
              </div>
              <div>
                <div className="label-xs">Supplier</div>
                <Input
                  className="input-sm"
                  value={selectedSupplier?.name ?? (mode==="special" && specialMode==="custom" && customSupplierId ? (suppliers.find(s=>s.id===customSupplierId)?.name ?? "") : "")}
                  readOnly
                  placeholder="Auto from item / choose in Custom"
                />
              </div>
              <div>
                <div className="label-xs">Backordered?</div>
                <div className="h-9 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-white/80 text-sm">
                    <input
                      type="checkbox"
                      className="accent-rose-400"
                      checked={backordered}
                      onChange={(e)=>{ setBackordered(e.target.checked); if(!e.target.checked){ setTbd(false); setExpected(""); } }}
                    />
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
              <Button
                type="button"
                onClick={submit}
                disabled={
                  !po.trim() ||
                  (mode!=="special" && !selectedId) ||
                  (mode==="special" && specialMode==="catalog" && !selectedId) ||
                  (mode==="special" && specialMode==="custom" && (!customName.trim() || !customSupplierId))
                }
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
