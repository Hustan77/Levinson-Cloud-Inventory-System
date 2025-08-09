"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CreateOrderSchema } from "../lib/types";
import { SearchBar } from "./SearchBar";


type ItemRef = { id: number; name: string; supplier_id: number | null };

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    fetch(url).then(r => r.json()).then(setData).catch(() => setData(null));
  }, [url]);
  return data;
}

/* LANDMARK: Advanced Order Dialog */
export function OrderModal({ onCreated }: { onCreated?: () => void }) {
  const caskets = useFetch<ItemRef[]>("/api/caskets");
  const urns = useFetch<ItemRef[]>("/api/urns");
  const suppliers = useFetch<{ id:number; name:string; ordering_instructions:string | null }[]>("/api/suppliers");

  const [open, setOpen] = useState(false);

  const [specialOrder, setSpecialOrder] = useState(false);
  const [itemType, setItemType] = useState<"casket" | "urn">("casket");
  const [itemId, setItemId] = useState<number | null>(null);
  const [itemName, setItemName] = useState<string>("");
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

  const supplierId = useMemo(() => {
    if (specialOrder) return null;
    const found = list.find(i => i.id === itemId);
    return found?.supplier_id ?? null;
  }, [specialOrder, list, itemId]);

  const supplier = useMemo(() => {
    if (supplierId == null) return null;
    return suppliers?.find(s => s.id === supplierId) ?? null;
  }, [suppliers, supplierId]);

  const formValid = useMemo(() => {
    try {
      const payload = {
        item_type: itemType,
        item_id: specialOrder ? null : itemId,
        item_name: specialOrder ? (itemName || null) : null,
        po_number: poNumber,
        expected_date: expectedDate || null,
        backordered,
        tbd_expected: tbd,
        special_order: specialOrder,
        deceased_name: specialOrder ? (deceasedName || null) : null
      };
      CreateOrderSchema.parse(payload);
      if (!specialOrder && !supplierId) return false;
      return true;
    } catch {
      return false;
    }
  }, [itemType, specialOrder, itemId, itemName, poNumber, expectedDate, backordered, tbd, deceasedName, supplierId]);

  async function submit() {
    const payload = {
      item_type: itemType,
      item_id: specialOrder ? null : itemId,
      item_name: specialOrder ? itemName : null,
      po_number: poNumber,
      expected_date: expectedDate || null,
      backordered,
      tbd_expected: tbd,
      special_order: specialOrder,
      deceased_name: specialOrder ? (deceasedName || null) : null
    };
    const res = await fetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) {
      setOpen(false);
      onCreated?.();
      setSpecialOrder(false);
      setItemId(null);
      setItemName("");
      setPoNumber("");
      setBackordered(false);
      setTbd(false);
      setExpectedDate("");
      setDeceasedName("");
    } else {
      const text = await res.text();
      alert("Failed to create order: " + text);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Order</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Order</DialogTitle>
          <DialogDescription>When an item is sold, create its order here.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Item Type</label>
            <div className="mt-1 flex gap-2">
              <Button
                variant={itemType === "casket" ? "default" : "outline"}
                onClick={() => setItemType("casket")}
              >
                Casket
              </Button>
              <Button
                variant={itemType === "urn" ? "default" : "outline"}
                onClick={() => setItemType("urn")}
              >
                Urn
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm">Special Order</label>
            <div className="mt-1 flex items-center gap-2">
              <Button
                variant={specialOrder ? "default" : "outline"}
                onClick={() => setSpecialOrder(true)}
              >
                Yes
              </Button>
              <Button
                variant={!specialOrder ? "default" : "outline"}
                onClick={() => setSpecialOrder(false)}
              >
                No
              </Button>
            </div>
          </div>

          {!specialOrder ? (
            <>
              <div className="md:col-span-2">
                <label className="text-sm">Item</label>
                <div className="mt-1 grid gap-2">
                  <SearchBar value={search} onChange={setSearch} placeholder={`Search ${itemType}s...`} />
                  <div className="max-h-40 overflow-auto rounded-md border border-white/10 bg-white/5">
                    {filtered.map(i => (
                      <button
                        key={i.id}
                        onClick={() => setItemId(i.id)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${itemId === i.id ? "bg-white/10" : ""}`}
                      >
                        {i.name}
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <div className="px-3 py-2 text-sm text-white/60">No items found.</div>
                    )}
                  </div>
                </div>
                {supplier ? (
                  <div className="mt-3 text-sm">
                    <div className="text-white/80"><b>Supplier:</b> {supplier.name} (auto‑selected)</div>
                    {supplier.ordering_instructions && (
                      <div className="mt-1 text-white/70">
                        <b>Ordering instructions:</b> {supplier.ordering_instructions}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-white/50">Supplier will auto‑fill from the selected item.</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="md:col-span-2">
                <label className="text-sm">Custom Item Name (Special Order)</label>
                <Input
                  className="mt-1"
                  placeholder="Describe the special item..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
                <div className="mt-3">
                  <label className="text-sm">Name of Deceased (optional)</label>
                  <Input
                    className="mt-1"
                    placeholder="Only for special orders"
                    value={deceasedName}
                    onChange={(e) => setDeceasedName(e.target.value)}
                  />
                </div>
              </div>
              <div className="md:col-span-2 text-sm text-white/70">
                Supplier is chosen server‑side (NorthStar preferred if present). Adjust logic in API if needed.
              </div>
            </>
          )}

          <div>
            <label className="text-sm">PO#</label>
            <Input className="mt-1" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Required" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label className="text-sm">Expected Delivery</label>
            <Input
              className="mt-1"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              disabled={backordered || tbd}
            />
            <div className="flex gap-2">
              <Button
                variant={backordered ? "default" : "outline"}
                onClick={() => { setBackordered(true); setTbd(false); setExpectedDate(""); }}
              >
                Backordered
              </Button>
              <Button
                variant={tbd ? "default" : "outline"}
                onClick={() => { setTbd(true); setBackordered(false); setExpectedDate(""); }}
              >
                TBD
              </Button>
              {(backordered || tbd) && (
                <Button variant="outline" onClick={() => { setBackordered(false); setTbd(false); }}>
                  Clear
                </Button>
              )}
            </div>
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
