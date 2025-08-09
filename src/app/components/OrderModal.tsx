"use client";

/**
 * LANDMARK: OrderModal
 * - Toggle: Casket | Urn | Special
 * - Special: searchable picker over all products (caskets+urns) OR custom name
 * - Backorder controls: only enable TBD/date when Backordered is checked
 * - Supplier auto for normal orders; explicit for Special
 */

import React, { useMemo, useState } from "react";
import { HoloPanel } from "./HoloPanel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { Casket, Supplier, Urn } from "../../lib/types";

export function OrderModal({
  suppliers, caskets, urns, onClose, onCreated,
}: {
  suppliers: Supplier[];
  caskets: Casket[];
  urns: Urn[];
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [itemType, setItemType] = useState<"casket" | "urn" | "special">("casket");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [customName, setCustomName] = useState("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [po, setPo] = useState("");
  const [backordered, setBackordered] = useState(false);
  const [tbd, setTbd] = useState(false);
  const [expected, setExpected] = useState<string>("");
  const [deceased, setDeceased] = useState("");
  const [notes, setNotes] = useState("");

  // Dynamic search for normal orders
  const list = useMemo(() => {
    const all = itemType === "casket" ? caskets : itemType === "urn" ? urns : [];
    if (!q) return all;
    const t = q.toLowerCase();
    return all.filter((i) => i.name.toLowerCase().includes(t));
  }, [q, itemType, caskets, urns]);

  // Searchable combined list for "Special" (doesn't affect inventory)
  const specialList = useMemo(() => {
    const all = [
      ...caskets.map(c => ({ id: c.id, name: c.name, type: "casket" as const })),
      ...urns.map(u => ({ id: u.id, name: u.name, type: "urn" as const })),
    ];
    if (!q) return all.slice(0, 50);
    const t = q.toLowerCase();
    return all.filter(i => i.name.toLowerCase().includes(t)).slice(0, 50);
  }, [q, caskets, urns]);

  const lockedSupplierName = useMemo(() => {
    if (itemType === "special") return null;
    const sid =
      itemType === "casket"
        ? caskets.find((x) => x.id === selectedId)?.supplier_id
        : urns.find((x) => x.id === selectedId)?.supplier_id;
    if (!sid) return null;
    return suppliers.find((s) => s.id === sid)?.name ?? null;
  }, [itemType, selectedId, caskets, urns, suppliers]);

  async function submit() {
    const payload: any = {
      item_type: itemType === "special"
        ? (selectedId ? (specialList.find(s=>s.id===selectedId)?.type ?? "casket") : "casket")
        : itemType,
      item_id: selectedId,
      item_name: itemType === "special" ? (customName || (selectedId ? (specialList.find(s=>s.id===selectedId)?.name ?? null) : null)) : null,
      supplier_id:
        itemType === "special"
          ? (supplierId === "" ? null : Number(supplierId))
          : itemType === "casket"
          ? caskets.find((x) => x.id === selectedId)?.supplier_id
          : urns.find((x) => x.id === selectedId)?.supplier_id,
      po_number: po,
      expected_date: backordered ? (tbd ? null : (expected || null)) : (expected || null),
      status: itemType === "special" ? "SPECIAL" : (backordered ? "BACKORDERED" : "PENDING"),
      backordered,
      tbd_expected: backordered ? tbd : false,
      special_order: itemType === "special",
      deceased_name: itemType === "special" ? (deceased || null) : null,
      notes: notes || null,
    };

    const res = await fetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    onCreated?.();
  }

  const supplierInstructions = useMemo(() => {
    const id =
      itemType === "special"
        ? supplierId === "" ? null : Number(supplierId)
        : itemType === "casket"
        ? caskets.find((x) => x.id === selectedId)?.supplier_id ?? null
        : urns.find((x) => x.id === selectedId)?.supplier_id ?? null;
    if (!id) return null;
    return suppliers.find((s) => s.id === id)?.ordering_instructions ?? null;
  }, [itemType, supplierId, selectedId, caskets, urns, suppliers]);

  const canSave =
    !!po &&
    ((itemType === "special" && !!supplierId) || (!!selectedId || !!customName)) &&
    (!backordered || tbd || !!expected);

  return (
    <HoloPanel railColor="purple" className="w-full max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/90 text-base">Create Order</div>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>

      {/* LANDMARK: Type toggle */}
      <div className="flex gap-2 mb-3">
        <Button variant={itemType === "casket" ? "default" : "outline"} onClick={() => { setItemType("casket"); setSelectedId(null); setCustomName(""); setSupplierId(""); }}>
          Casket
        </Button>
        <Button variant={itemType === "urn" ? "default" : "outline"} onClick={() => { setItemType("urn"); setSelectedId(null); setCustomName(""); setSupplierId(""); }}>
          Urn
        </Button>
        <Button variant={itemType === "special" ? "default" : "outline"} onClick={() => { setItemType("special"); setSelectedId(null); }}>
          Special
        </Button>
      </div>

      {/* LANDMARK: Search areas */}
      {itemType !== "special" ? (
        <>
          <div className="grid md:grid-cols-3 gap-2">
            <div className="space-y-1 md:col-span-2">
              <div className="label-xs">Search {itemType === "casket" ? "Caskets" : "Urns"}</div>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type to search..." />
            </div>
            <div className="space-y-1">
              <div className="label-xs">Supplier (auto)</div>
              <Input disabled value={lockedSupplierName ?? ""} />
            </div>
          </div>
          <div className="max-h-56 overflow-auto rounded-md border border-white/10 mt-2">
            <ul className="divide-y divide-white/10">
              {list.length === 0 ? (
                <li className="p-2 text-xs text-white/50">No matches.</li>
              ) : list.map(i => (
                <li
                  key={i.id}
                  className={`p-2 cursor-pointer text-sm hover:bg-white/5 ${selectedId===i.id ? "bg-white/10" : ""}`}
                  onClick={() => setSelectedId(i.id)}
                >
                  {i.name}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="label-xs">Search Catalog (optional)</div>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search caskets & urns..." />
              <div className="max-h-48 overflow-auto rounded-md border border-white/10">
                <ul className="divide-y divide-white/10">
                  {specialList.length === 0 ? (
                    <li className="p-2 text-xs text-white/50">No matches.</li>
                  ) : specialList.map(i => (
                    <li
                      key={`${i.type}-${i.id}`}
                      className={`p-2 cursor-pointer text-sm hover:bg-white/5 ${selectedId===i.id ? "bg-white/10" : ""}`}
                      onClick={() => setSelectedId(i.id)}
                    >
                      [{i.type}] {i.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-1">
              <div className="label-xs">Or custom name</div>
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Custom product name" />
            </div>
            <div className="space-y-1">
              <div className="label-xs">Supplier</div>
              <select className="select-sm w-full" value={supplierId} onChange={(e)=>setSupplierId(e.target.value? Number(e.target.value):"")}>
                <option value="">—</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <div className="label-xs">Name of deceased (optional)</div>
              <Input value={deceased} onChange={(e)=>setDeceased(e.target.value)} />
            </div>
          </div>
        </>
      )}

      {/* LANDMARK: Shared fields */}
      <div className="grid md:grid-cols-3 gap-3 mt-4">
        <div className="space-y-1">
          <div className="label-xs">PO #</div>
          <Input value={po} onChange={(e)=>setPo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <div className="label-xs">Backordered</div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="accent-rose-400"
              checked={backordered}
              onChange={(e)=>{
                const v = e.target.checked;
                setBackordered(v);
                if (!v) { setTbd(false); setExpected(""); }
              }}
            />
            <span className="text-sm">Is backordered</span>
          </label>
        </div>
        <div className="space-y-1">
          <div className="label-xs">Expected</div>
          {backordered ? (
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-amber-400"
                  checked={tbd}
                  onChange={(e)=>{ setTbd(e.target.checked); if (e.target.checked) setExpected(""); }}
                />
                <span className="text-sm">TBD</span>
              </label>
              <Input type="date" disabled={tbd} value={expected} onChange={(e)=>setExpected(e.target.value)} />
            </div>
          ) : (
            <Input type="date" value={expected} onChange={(e)=>setExpected(e.target.value)} />
          )}
        </div>
        <div className="space-y-1 md:col-span-3">
          <div className="label-xs">Notes</div>
          <textarea
            className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-sm outline-none focus:ring-2 focus:ring-cyan-400/60"
            rows={3}
            value={notes}
            onChange={(e)=>setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Supplier instructions */}
      {supplierInstructions && (
        <div className="mt-3 text-xs text-white/60">
          <span className="text-white/40">Supplier Instructions:</span> {supplierInstructions}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={!canSave} onClick={submit}>Save</Button>
      </div>
    </HoloPanel>
  );
}
