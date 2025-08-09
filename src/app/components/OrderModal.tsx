"use client";

// LANDMARK: OrderModal — create/update orders
// - Props for suppliers/caskets/urns are OPTIONAL; we self-fetch on open if missing.
// - Supports both onDone and onCreated callbacks (both will fire if provided).
// - Accessible: includes DialogTitle to satisfy Radix requirements.

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { Casket, Supplier, Urn, CreateOrderInput } from "../../lib/types";

type Mode = "create" | "update";

type Props = {
  mode?: Mode; // default "create"
  trigger?: React.ReactNode; // optional; default button if omitted
  suppliers?: Supplier[]; // OPTIONAL (self-fetch on open if not provided)
  caskets?: Casket[];     // OPTIONAL (self-fetch on open if not provided)
  urns?: Urn[];           // OPTIONAL (self-fetch on open if not provided)
  orderId?: number;
  initial?: {
    item_type: "casket" | "urn";
    item_id: number | null;
    item_name: string | null;
    supplier_id: number | null;
    po_number: string;
    expected_date: string | null;
    backordered: boolean;
    tbd_expected: boolean;
    status: "PENDING" | "BACKORDERED" | "ARRIVED" | "SPECIAL";
    deceased_name: string | null;
  };
  // Legacy + current callbacks (we call both if present)
  onCreated?: () => void;
  onDone?: () => void;
};

export function OrderModal(props: Props) {
  const {
    mode = "create",
    trigger,
    suppliers: suppliersProp,
    caskets: casketsProp,
    urns: urnsProp,
    initial,
    orderId,
    onCreated,
    onDone,
  } = props;

  const [open, setOpen] = useState(false);

  // LANDMARK: local copies for self-fetch when props are missing
  const [suppliers, setSuppliers] = useState<Supplier[]>(suppliersProp ?? []);
  const [caskets, setCaskets] = useState<Casket[]>(casketsProp ?? []);
  const [urns, setUrns] = useState<Urn[]>(urnsProp ?? []);
  const needSuppliers = suppliersProp == null;
  const needCaskets = casketsProp == null;
  const needUrns = urnsProp == null;

  // Self-fetch lists when dialog opens and those lists were not injected
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        if (needSuppliers) {
          const r = await fetch("/api/suppliers", { cache: "no-store" });
          if (alive && r.ok) setSuppliers(await r.json());
        }
        if (needCaskets) {
          const r = await fetch("/api/caskets", { cache: "no-store" });
          if (alive && r.ok) setCaskets(await r.json());
        }
        if (needUrns) {
          const r = await fetch("/api/urns", { cache: "no-store" });
          if (alive && r.ok) setUrns(await r.json());
        }
      } catch {
        /* ignore; UI validation will still run */
      }
    }
    if (open) load();
    return () => {
      alive = false;
    };
  }, [open, needSuppliers, needCaskets, needUrns]);

  // LANDMARK: form state
  const [itemType, setItemType] = useState<"casket" | "urn">(initial?.item_type ?? "casket");
  const [itemId, setItemId] = useState<number | "">(initial?.item_id ?? "");
  const [itemName, setItemName] = useState<string>(initial?.item_name ?? "");
  const [po, setPo] = useState(initial?.po_number ?? "");
  const [expected, setExpected] = useState<string>(initial?.expected_date ?? "");
  const [backordered, setBackordered] = useState<boolean>(initial?.backordered ?? false);
  const [tbd, setTbd] = useState<boolean>(initial?.tbd_expected ?? false);
  const [special, setSpecial] = useState<boolean>(
    initial?.status === "SPECIAL" || (initial?.item_id == null && !!initial?.item_name) || false
  );
  const [deceased, setDeceased] = useState<string>(initial?.deceased_name ?? "");
  const [specialSupplier, setSpecialSupplier] = useState<number | "">(initial?.supplier_id ?? "");

  // Reset on close (clean form after cancel) to meet your UX rule
  useEffect(() => {
    if (!open) {
      setItemType(initial?.item_type ?? "casket");
      setItemId(initial?.item_id ?? "");
      setItemName(initial?.item_name ?? "");
      setPo(initial?.po_number ?? "");
      setExpected(initial?.expected_date ?? "");
      setBackordered(initial?.backordered ?? false);
      setTbd(initial?.tbd_expected ?? false);
      setSpecial(
        initial?.status === "SPECIAL" || (initial?.item_id == null && !!initial?.item_name) || false
      );
      setDeceased(initial?.deceased_name ?? "");
      setSpecialSupplier(initial?.supplier_id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Use whichever lists are available (props first, then local)
  const itemsCaskets = casketsProp ?? caskets;
  const itemsUrns = urnsProp ?? urns;
  const items = itemType === "casket" ? itemsCaskets : itemsUrns;
  const allSuppliers = suppliersProp ?? suppliers;

  // derive supplier for non-special orders
  const derivedSupplierId = useMemo(() => {
    if (special) return specialSupplier === "" ? null : Number(specialSupplier);
    if (itemType === "casket") {
      const found = itemsCaskets.find((c) => c.id === (itemId === "" ? -1 : Number(itemId)));
      return found?.supplier_id ?? null;
    }
    const found = itemsUrns.find((u) => u.id === (itemId === "" ? -1 : Number(itemId)));
    return found?.supplier_id ?? null;
  }, [special, specialSupplier, itemType, itemId, itemsCaskets, itemsUrns]);

  const supplierInstructions = useMemo(() => {
    const sid = derivedSupplierId;
    if (!sid) return null;
    const s = allSuppliers.find((x) => x.id === sid);
    return s?.ordering_instructions ?? null;
  }, [derivedSupplierId, allSuppliers]);

  // LANDMARK: front-end validation (matches your business rules)
  const uiError = useMemo(() => {
    if (!po.trim()) return "PO# is required.";
    if (!special) {
      if (itemId === "") return "Select an item.";
      if (!backordered) {
        if (!expected) return "Expected date is required when not backordered.";
        if (tbd) return "TBD cannot be selected when not backordered.";
      } else {
        if (!tbd && !expected) return "When backordered, choose TBD or set a date.";
      }
    } else {
      if (!itemName.trim()) return "Special order requires a custom item name.";
      if (!backordered) {
        if (!expected) return "Expected date is required when not backordered.";
        if (tbd) return "TBD cannot be selected when not backordered.";
      } else {
        if (!tbd && !expected) return "When backordered, choose TBD or set a date.";
      }
    }
    return "";
  }, [po, special, itemId, backordered, expected, tbd, itemName]);

  function toggleBackordered(next: boolean) {
    setBackordered(next);
    if (!next) setTbd(false); // reversible: disable TBD when not backordered
  }

  function onPickItem(id: string) {
    setItemId(id ? Number(id) : "");
  }

  async function submit() {
    if (uiError) return alert(uiError);

    if (mode === "create") {
      const payload: CreateOrderInput = {
        item_type: itemType,
        item_id: special ? null : itemId === "" ? null : Number(itemId),
        item_name: special ? itemName : null,
        po_number: po.trim(),
        expected_date: expected || null,
        backordered,
        tbd_expected: tbd,
        special_order: special,
        deceased_name: special ? (deceased?.trim() || null) : null,
        supplier_id: special ? (specialSupplier === "" ? null : Number(specialSupplier)) : null,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        alert(`Create failed: ${txt}`);
        return;
      }
      setOpen(false);
      onDone?.();
      onCreated?.();
      return;
    }

    // UPDATE flow
    if (!orderId) return;
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({
        po_number: po.trim(),
        expected_date: expected || null,
        backordered,
        tbd_expected: tbd,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      alert(`Update failed: ${txt}`);
      return;
    }
    setOpen(false);
    onDone?.();
    onCreated?.();
  }

  const TriggerButton = trigger ?? <Button variant="default">Create Order</Button>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{TriggerButton}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          {/* LANDMARK: DialogTitle to satisfy Radix accessibility requirement */}
        <DialogTitle>{mode === "create" ? "Create Order" : "Update Order"}</DialogTitle>
        </DialogHeader>

        {/* LANDMARK: Order Type + Special */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-white/60">Order Type</div>
            <select
              className="w-full rounded-md bg-white/5 border border-white/10 px-2 py-2 text-sm [&>option]:bg-white [&>option]:text-black"
              value={itemType}
              onChange={(e) => setItemType(e.target.value as "casket" | "urn")}
              disabled={mode === "update"}
            >
              <option value="casket">Casket</option>
              <option value="urn">Urn</option>
            </select>
          </div>

          <label className="flex items-end gap-2">
            <input
              type="checkbox"
              className="accent-emerald-400"
              checked={special}
              onChange={(e) => setSpecial(e.target.checked)}
              disabled={mode === "update"}
            />
            <span className="text-sm">Special Order</span>
          </label>
        </div>

        {!special ? (
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-white/60">Select Item</div>
              <select
                className="w-full rounded-md bg-white/5 border border-white/10 px-2 py-2 text-sm [&>option]:bg-white [&>option]:text-black"
                value={itemId === "" ? "" : String(itemId)}
                onChange={(e) => onPickItem(e.target.value)}
                disabled={mode === "update"}
              >
                <option value="">—</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-white/60">Supplier (auto)</div>
              <Input value={derivedSupplierId ?? ""} readOnly />
              {supplierInstructions && (
                <div className="text-xs text-emerald-300/80 mt-1">{supplierInstructions}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-white/60">Custom Item Name</div>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Custom Casket X"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-white/60">Supplier (optional)</div>
              <select
                className="w-full rounded-md bg-white/5 border border-white/10 px-2 py-2 text-sm [&>option]:bg-white [&>option]:text-black"
                value={specialSupplier}
                onChange={(e) =>
                  setSpecialSupplier(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">—</option>
                {allSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <div className="text-xs text-white/60">Name of Deceased (optional)</div>
              <Input
                value={deceased}
                onChange={(e) => setDeceased(e.target.value)}
                placeholder="Only for special orders"
              />
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-white/60">PO#</div>
            <Input value={po} onChange={(e) => setPo(e.target.value)} placeholder="Required" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/60">Expected Delivery</div>
            <Input
              type="date"
              value={expected ?? ""}
              onChange={(e) => setExpected(e.target.value)}
              disabled={backordered && tbd}
            />
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-rose-400"
                  checked={backordered}
                  onChange={(e) => toggleBackordered(e.target.checked)}
                />
                <span className="text-sm">Backordered</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-amber-400"
                  checked={tbd}
                  onChange={(e) => setTbd(e.target.checked)}
                  disabled={!backordered}
                />
                <span className="text-sm">TBD</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!!uiError}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
