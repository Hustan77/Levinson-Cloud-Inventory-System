"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CreateOrderSchema } from "../../lib/types";
import { SearchBar } from "./SearchBar";

type ItemRef = { id: number; name: string; supplier_id: number | null };
type SupplierRef = { id: number; name: string; ordering_instructions: string | null };

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => { fetch(url).then(r => r.json()).then(setData).catch(() => setData(null)); }, [url]);
  return data;
}

export function OrderModal({ onCreated }: { onCreated?: () => void }) {
  const caskets = useFetch<ItemRef[]>("/api/caskets");
  const urns = useFetch<ItemRef[]>("/api/urns");
  const suppliers = useFetch<SupplierRef[]>("/api/suppliers");

  const [open, setOpen] = useState(false);
  const [itemType, setItemType] = useState<"casket" | "urn">("casket");
  const [specialOrder, setSpecialOrder] = useState(false);
  const [specialMode, setSpecialMode] = useState<"catalog" | "custom">("custom");
  const [itemId, setItemId] = useState<number | null>(null);
  const [itemName, setItemName] = useState<string>("");
  const [specialSupplierId, setSpecialSupplierId] = useState<number | null>(null);
  const [poNumber, setPoNumber] = useState("");
  const [backordered, setBackordered] = useState(false);
  const [tbd, setTbd] = useState(false);
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [deceasedName, setDeceasedName] = useState<string>("");

  const list = useMemo(() => (itemType === "casket" ? (caskets ?? []) : (urns ?? [])), [itemType, caskets, urns]);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(i => i.name.toLowerCase().includes(q));
  }, [list, search]);
  const selected = useMemo(() => list.find(i => i.id === itemId) || null, [list, itemId]);
  const supplier = useMemo(() => {
    if (specialOrder && specialMode === "custom") return suppliers?.find(s => s.id === specialSupplierId) ?? null;
    if (!selected?.supplier_id) return null;
    return suppliers?.find(s => s.id === selected.supplier_id) ?? null;
  }, [specialOrder, specialMode, specialSupplierId, selected, suppliers]);

  const formValid = useMemo(() => {
    try {
      const payload = {
        item_type: itemType,
        item_id: specialOrder ? (specialMode === "catalog" ? itemId : null) : itemId,
        item_name: specialOrder ? (specialMode === "custom" ? (itemName || null) : null) : null,
        po_number: poNumber,
        expected_date: (backordered ? (tbd ? null : (expectedDate || null)) : (expectedDate || null)),
        backordered,
        tbd_expected: backordered ? tbd : false,
        special_order: specialOrder ? (specialMode === "custom") : false,
        deceased_name: specialOrder && specialMode === "custom" ? (deceasedName || null) : null,
        supplier_id: specialOrder && specialMode === "custom" ? (specialSupplierId ?? null) : null
      };
      CreateOrderSchema.parse(payload);
      if (!specialOrder && !selected?.supplier_id) return false;
      if (specialOrder && specialMode === "catalog" && !itemId) return false;
      if (specialOrder && specialMode === "custom" && !specialSupplierId) return false;
      return !!poNumber;
    } catch {
      return false;
    }
  }, [itemType, specialOrder, specialMode, itemId, itemName, poNumber, expectedDate, backordered, tbd, deceasedName, selected, specialSupplierId]);

  async function submit() {
    const payload = {
      item_type: itemType,
      item_id: specialOrder ? (specialMode === "catalog" ? itemId : null) : itemId,
      item_name: specialOrder ? (specialMode === "custom" ? itemName : null) : null,
      po_number: poNumber,
      expected_date: backordered ? (tbd ? null : (expectedDate || null)) : (expectedDate || null),
      backordered,
      tbd_expected: backordered ? tbd : false,
      special_order: specialOrder ? (specialMode === "custom") : false,
      deceased_name: specialOrder && specialMode === "custom" ? (deceasedName || null) : null,
      supplier_id: specialOrder && specialMode === "custom" ? (specialSupplierId ?? null) : null
    };
    const res = await fetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) {
      setOpen(false);
      onCreated?.();
      setSpecialOrder(false); setSpecialMode("custom"); setItemId(null); setItemName("");
      setPoNumber(""); setBackordered(false); setTbd(false); setExpectedDate(""); setDeceasedName(""); setSpecialSupplierId(null);
    } else {
      const text = await res.text();
      alert("Failed to create order: " + text);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>New Order</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Order</DialogTitle>
          <DialogDescription>Select item and delivery details.</DialogDescription>
        </DialogHeader>

        {/* Item type + special */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Item Type</Label>
            <div className="mt-1 flex gap-2">
              <Button variant={itemType === "casket" ? "default" : "outline"} onClick={() => setItemType("casket")}>Casket</Button>
              <Button variant={itemType === "urn" ? "default" : "outline"} onClick={() => setItemType("urn")}>Urn</Button>
            </div>
          </div>
          <div>
            <Label>Special Order?</Label>
            <div className="mt-1 flex gap-2">
              <Button variant={specialOrder ? "default" : "outline"} onClick={() => setSpecialOrder(true)}>Yes</Button>
              <Button variant={!specialOrder ? "default" : "outline"} onClick={() => setSpecialOrder(false)}>No</Button>
            </div>
          </div>
        </div>

        {/* Special sub-mode */}
        {specialOrder && (
          <div className="mt-3">
            <Label>Special source</Label>
            <div className="mt-1 flex gap-2">
              <Button variant={specialMode === "catalog" ? "default" : "outline"} onClick={() => setSpecialMode("catalog")}>From Catalog</Button>
              <Button variant={specialMode === "custom" ? "default" : "outline"} onClick={() => setSpecialMode("custom")}>Custom Item</Button>
            </div>
          </div>
        )}

        {/* Selection area */}
        {!specialOrder || specialMode === "catalog" ? (
          <div className="mt-4">
            <Label>{itemType === "casket" ? "Casket" : "Urn"}</Label>
            {!selected ? (
              <>
                <div className="mt-1 grid gap-2">
                  <SearchBar value={search} onChange={setSearch} placeholder={`Search ${itemType}s...`} />
                  <div className="max-h-40 overflow-auto rounded-md border border-white/10 bg-white/5">
                    {filtered.map(i => (
                      <button key={i.id} onClick={() => setItemId(i.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-white/10">
                        {i.name}
                      </button>
                    ))}
                    {filtered.length === 0 && <div className="px-3 py-2 text-sm text-white/60">No items found.</div>}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-2 p-3 rounded-md border border-white/10 bg-white/5 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-semibold">{selected.name}</div>
                  <div className="text-white/70">Supplier: {supplier?.name ?? "—"}</div>
                </div>
                <Button variant="outline" onClick={() => setItemId(null)}>Change</Button>
              </div>
            )}
            {supplier?.ordering_instructions && (
              <div className="mt-2 text-sm text-white/70"><b>Ordering instructions:</b> {supplier.ordering_instructions}</div>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <div>
              <Label>Custom Item Name</Label>
              <Input className="mt-1" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Describe the special item" />
            </div>
            <div>
              <Label>Supplier</Label>
              <select
                className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
                value={specialSupplierId ?? ""}
                onChange={(e) => setSpecialSupplierId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="" disabled>Select supplier…</option>
                {(suppliers ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {supplier?.ordering_instructions && (
                <div className="mt-2 text-sm text-white/70"><b>Ordering instructions:</b> {supplier.ordering_instructions}</div>
              )}
            </div>
            <div>
              <Label>Name of Deceased (optional)</Label>
              <Input className="mt-1" value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} placeholder="Only for special custom" />
            </div>
          </div>
        )}

        {/* PO + Delivery */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>PO#</Label>
            <Input className="mt-1" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Required" />
          </div>
          <div>
            <Label>Delivery</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              <Button variant={backordered ? "default" : "outline"} onClick={() => { setBackordered(true); setTbd(false); setExpectedDate(""); }}>Backordered</Button>
              {!backordered ? null : (
                <Button variant={tbd ? "default" : "outline"} onClick={() => { setTbd(true); setExpectedDate(""); }}>TBD</Button>
              )}
              <Button
                variant={(!backordered || !tbd) ? "default" : "outline"}
                onClick={() => { if (backordered) setTbd(false); }}
              >
                Date
              </Button>
            </div>
            {/* Show date if: not backordered OR backordered without TBD */}
            {(!backordered || (backordered && !tbd)) && (
              <Input className="mt-2" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!formValid}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
