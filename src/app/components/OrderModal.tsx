"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { HoloPanel } from "./HoloPanel";
import type { Casket, Supplier, Urn, VOrderEnriched } from "../../lib/types";

// LANDMARK: Props
type Props = {
  mode?: "create" | "update";
  trigger?: React.ReactNode;
  orderId?: number;
  initial?: Partial<VOrderEnriched>;
  onCreated?: () => void;
  onDone?: () => void;
  suppliers?: Supplier[];
  caskets?: Casket[];
  urns?: Urn[];
  triggerLabel?: string;
};

export function OrderModal({
  mode = "create",
  trigger,
  triggerLabel,
  orderId,
  initial,
  onCreated,
  onDone,
  suppliers: pSuppliers,
  caskets: pCaskets,
  urns: pUrns,
}: Props) {
  const [open, setOpen] = useState(false);

  const [suppliers, setSuppliers] = useState<Supplier[]>(pSuppliers ?? []);
  const [caskets, setCaskets] = useState<Casket[]>(pCaskets ?? []);
  const [urns, setUrns] = useState<Urn[]>(pUrns ?? []);
  const [loading, setLoading] = useState(false);

  // LANDMARK: form state
  const [itemType, setItemType] = useState<"casket"|"urn">(initial?.item_type ?? "casket");
  const [special, setSpecial] = useState<boolean>(initial?.status === "SPECIAL" || initial?.special_order === true || false);
  const [useCatalogForSpecial, setUseCatalogForSpecial] = useState<boolean>(false); // special can pick a catalog item but will not affect inventory (we store its name only)

  const [q, setQ] = useState(""); // dynamic search
  const [selectedId, setSelectedId] = useState<number | null>(initial?.item_id ?? null);
  const [selectedName, setSelectedName] = useState<string>(initial?.item_name ?? "");
  const [supplierId, setSupplierId] = useState<number | null>(initial?.supplier_id ?? null);

  const [po, setPo] = useState(initial?.po_number ?? "");
  const [expected, setExpected] = useState<string>(initial?.expected_date ?? "");
  const [backordered, setBackordered] = useState<boolean>(initial?.backordered ?? false);
  const [tbd, setTbd] = useState<boolean>(initial?.tbd_expected ?? false);
  const [deceased, setDeceased] = useState<string>(initial?.deceased_name ?? "");
  const [needBy, setNeedBy] = useState<string>(initial?.need_by_date ?? "");
  const [notes, setNotes] = useState<string>(initial?.notes ?? ""); // backorder/special notes

  useEffect(() => {
    if (open && (!pSuppliers || !pCaskets || !pUrns)) {
      (async () => {
        const [s, c, u] = await Promise.all([
          fetch("/api/suppliers", { cache: "no-store" }).then(r => r.json()),
          fetch("/api/caskets", { cache: "no-store" }).then(r => r.json()),
          fetch("/api/urns", { cache: "no-store" }).then(r => r.json()),
        ]);
        setSuppliers(s); setCaskets(c); setUrns(u);
      })();
    }
  }, [open, pSuppliers, pCaskets, pUrns]);

  // LANDMARK: dynamic search list
  const catalog = itemType === "casket" ? caskets : urns;
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = catalog.filter(r => {
      if (!term) return true;
      const base = `${r.name}`.toLowerCase();
      return base.includes(term);
    });
    return rows.slice(0, 20);
  }, [catalog, q]);

  // When selecting a normal item, supplier auto‑locks
  function pickItem(id: number) {
    setSelectedId(id);
    setSelectedName("");
    const r = catalog.find(x => x.id === id);
    setSupplierId(r?.supplier_id ?? null);
  }

  // LANDMARK: open/close
  function openModal() {
    // reset when opening in create mode
    if (mode === "create") {
      setItemType("casket");
      setSpecial(false);
      setUseCatalogForSpecial(false);
      setQ(""); setSelectedId(null); setSelectedName("");
      setSupplierId(null);
      setPo(""); setExpected(""); setBackordered(false); setTbd(false);
      setDeceased(""); setNeedBy(""); setNotes("");
    }
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  async function save() {
    setLoading(true);
    try {
      if (mode === "create") {
        // SPECIAL rules
        const payload: any = {
          item_type: itemType,
          item_id: special ? null : selectedId,
          item_name: special ? (useCatalogForSpecial
            ? (catalog.find(x => x.id === selectedId)?.name || selectedName || null)
            : (selectedName || null)) : null,
          supplier_id: supplierId,
          po_number: po,
          expected_date: backordered ? (tbd ? null : (expected || null)) : (expected || null),
          backordered,
          tbd_expected: backordered ? tbd : false,
          special_order: special,
          deceased_name: special ? (deceased || null) : null,
          need_by_date: special ? (needBy || null) : null,
          is_return: false,
          return_reason: null,
          notes: notes || null,
        };
        const res = await fetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
        if (!res.ok) { alert(await res.text()); return; }
        onCreated?.();
        closeModal();
      } else {
        // UPDATE (does not alter item selection here)
        const payload: any = {
          po_number: po || undefined,
          expected_date: backordered ? (tbd ? null : (expected || null)) : (expected || null),
          backordered,
          tbd_expected: backordered ? tbd : false,
          need_by_date: special ? (needBy || null) : undefined,
          notes: notes || null,
        };
        const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify(payload) });
        if (!res.ok) { alert(await res.text()); return; }
        onDone?.();
        closeModal();
      }
    } finally {
      setLoading(false);
    }
  }

  // VALIDITY
  const valid = useMemo(() => {
    if (!po) return false;
    if (special) {
      if (!needBy) return false;
      // supplier optional for special orders
      return !!(useCatalogForSpecial ? (selectedId || selectedName) : (selectedName || selectedId));
    } else {
      if (!selectedId) return false;
      if (!backordered && !expected) return false;
      return true;
    }
  }, [po, special, needBy, selectedId, selectedName, backordered, expected, useCatalogForSpecial]);

  return (
    <>
      {trigger ? (
        <span onClick={openModal}>{trigger}</span>
      ) : (
        <Button onClick={openModal}>{triggerLabel ?? (mode === "create" ? "Create Order" : "Update")}</Button>
      )}

      {!open ? null : (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <HoloPanel railColor="cyan" className="w-full max-w-3xl">
            {/* LANDMARK: Dialog Title (a11y) */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/90">{mode === "create" ? "Create Order" : "Update Order"}</div>
              <Button variant="outline" onClick={closeModal}>Close</Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* LANDMARK: Type toggle + Special */}
              <div className="space-y-1">
                <div className="label-xs">Item Type</div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="itype" checked={itemType==="casket"} onChange={()=>{ setItemType("casket"); setSelectedId(null); setQ(""); }} />
                    <span className="text-sm">Casket</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="itype" checked={itemType==="urn"} onChange={()=>{ setItemType("urn"); setSelectedId(null); setQ(""); }} />
                    <span className="text-sm">Urn</span>
                  </label>
                </div>
              </div>

              <label className="flex items-end gap-2">
                <input type="checkbox" className="accent-purple-400" checked={special} onChange={e=>{ setSpecial(e.target.checked); }} />
                <span className="text-sm">Special Order</span>
              </label>

              {/* LANDMARK: Dynamic search / selection */}
              {!special && (
                <>
                  <div className="space-y-1">
                    <div className="label-xs">Search {itemType === "casket" ? "Caskets" : "Urns"}</div>
                    <Input className="input-sm" placeholder={`Type to search ${itemType}s...`} value={q} onChange={e=>setQ(e.target.value)} />
                    <div className="max-h-40 overflow-auto mt-2 rounded-md border border-white/10 bg-white/[0.03]">
                      {results.map(r => (
                        <button
                          key={r.id}
                          onClick={()=>pickItem(r.id)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${selectedId===r.id ? "bg-emerald-500/20" : ""}`}
                        >
                          <div className="text-white/90">{r.name}</div>
                          <div className="text-white/50 text-xs">
                            Supplier: {suppliers.find(s=>s.id===r.supplier_id)?.name ?? "—"}
                          </div>
                        </button>
                      ))}
                      {results.length===0 && <div className="px-3 py-2 text-white/50 text-sm">No matches.</div>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="label-xs">Selected</div>
                    <div className="text-sm">{selectedId ? (catalog.find(x=>x.id===selectedId)?.name) : "—"}</div>
                    <div className="label-xs mt-3">Supplier (auto‑selected)</div>
                    <div className="text-sm">
                      {supplierId ? (suppliers.find(s=>s.id===supplierId)?.name ?? supplierId) : "—"}
                    </div>
                  </div>
                </>
              )}

              {/* LANDMARK: Special order path */}
              {special && (
                <>
                  <div className="space-y-1">
                    <div className="label-xs">Use Catalog Item (name only)</div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={useCatalogForSpecial} onChange={e=>{ setUseCatalogForSpecial(e.target.checked); setSelectedId(null); setSelectedName(""); }} />
                      <span className="text-sm">Pick from catalog but treat as Special (no inventory impact)</span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <div className="label-xs">Supplier (optional)</div>
                    <select className="select-sm w-full" value={supplierId ?? ""} onChange={e=>setSupplierId(e.target.value? Number(e.target.value): null)}>
                      <option value="">—</option>
                      {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                    </select>
                  </div>

                  {useCatalogForSpecial ? (
                    <>
                      <div className="space-y-1">
                        <div className="label-xs">Search Catalog</div>
                        <Input className="input-sm" placeholder={`Type to search ${itemType}s...`} value={q} onChange={e=>setQ(e.target.value)} />
                        <div className="max-h-40 overflow-auto mt-2 rounded-md border border-white/10 bg-white/[0.03]">
                          {results.map(r => (
                            <button
                              key={r.id}
                              onClick={()=>{ setSelectedId(r.id); setSelectedName(r.name); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${selectedId===r.id ? "bg-purple-500/20" : ""}`}
                            >
                              <div className="text-white/90">{r.name}</div>
                              <div className="text-white/50 text-xs">Supplier: {suppliers.find(s=>s.id===r.supplier_id)?.name ?? "—"}</div>
                            </button>
                          ))}
                          {results.length===0 && <div className="px-3 py-2 text-white/50 text-sm">No matches.</div>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="label-xs">Selected Name</div>
                        <div className="text-sm">{selectedName || "—"}</div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1 md:col-span-2">
                      <div className="label-xs">Custom Item Name</div>
                      <Input className="input-sm" value={selectedName} onChange={e=>setSelectedName(e.target.value)} placeholder="Type name..." />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="label-xs">Need By (deadline)</div>
                    <Input className="input-sm" type="date" value={needBy} onChange={e=>setNeedBy(e.target.value)} />
                  </div>
                </>
              )}

              {/* LANDMARK: Backorder / Expected */}
              <div className="space-y-1">
                <div className="label-xs">Backordered</div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-rose-400" checked={backordered} onChange={e=>{ setBackordered(e.target.checked); if(!e.target.checked){ setTbd(false);} }} />
                  <span className="text-sm">Mark as backordered</span>
                </label>
                {backordered && (
                  <label className="flex items-center gap-2 mt-2">
                    <input type="checkbox" className="accent-rose-400" checked={tbd} onChange={e=>setTbd(e.target.checked)} />
                    <span className="text-sm">Expected date TBD</span>
                  </label>
                )}
              </div>

              <div className="space-y-1">
                <div className="label-xs">Expected Delivery</div>
                <Input className="input-sm" type="date" value={expected} onChange={e=>setExpected(e.target.value)} disabled={backordered && tbd} />
              </div>

              {/* LANDMARK: PO + Deceased (special only) */}
              <div className="space-y-1">
                <div className="label-xs">PO #</div>
                <Input className="input-sm" value={po} onChange={e=>setPo(e.target.value)} />
              </div>

              {special && (
                <div className="space-y-1">
                  <div className="label-xs">Name of Deceased (optional)</div>
                  <Input className="input-sm" value={deceased} onChange={e=>setDeceased(e.target.value)} />
                </div>
              )}

              {/* LANDMARK: Notes */}
              <div className="space-y-1 md:col-span-2">
                <div className="label-xs">Notes (backorder / special)</div>
                <textarea className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-sm" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
              </div>

              {/* Supplier instructions (if supplier known) */}
              {!!supplierId && (
                <div className="md:col-span-2 text-xs text-emerald-300/80">
                  {suppliers.find(s=>s.id===supplierId)?.ordering_instructions ?? ""}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Button disabled={!valid || loading} onClick={save}>{mode === "create" ? "Save Order" : "Save Changes"}</Button>
            </div>
          </HoloPanel>
        </div>
      )}
    </>
  );
}
