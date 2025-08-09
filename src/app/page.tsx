"use client";

/**
 * LANDMARK: Dashboard
 * - Fixes ArrivalModal import (named export)
 * - Keeps OrderModal as default export
 * - Provides a lightweight EditOrder modal to handle the OrderCard "Edit" icon
 * - Hides ARRIVED orders on the dashboard (mixed lane)
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "./components/HoloPanel";
import { KpiTile } from "./components/KpiTile";
import { OrderCard } from "./components/OrderCard";
import { ArrivalModal } from "./components/ArrivalModal"; // ✅ named import
import OrderModal from "./components/OrderModal"; // ✅ default import

import type { VOrderEnriched, Supplier, Casket, Urn } from "@/lib/types";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";

// Small inline modal component (accessible title included)
function Modal({
  title,
  children,
  onClose,
  maxWidth = "max-w-lg",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} mx-4 rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.45)]`}>
        <h2 className="text-white/90 text-sm mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // LANDMARK: data state
  const [orders, setOrders] = useState<VOrderEnriched[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [caskets, setCaskets] = useState<Casket[]>([]);
  const [urns, setUrns] = useState<Urn[]>([]);

  // LANDMARK: modal state
  const [arriving, setArriving] = useState<VOrderEnriched | null>(null);
  const [editing, setEditing] = useState<VOrderEnriched | null>(null);

  const load = async () => {
    const [o, s, c, u] = await Promise.all([
      fetch("/api/orders", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/caskets").then((r) => r.json()),
      fetch("/api/urns").then((r) => r.json()),
    ]);
    setOrders(o ?? []);
    setSuppliers(s ?? []);
    setCaskets(c ?? []);
    setUrns(u ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  // LANDMARK: KPIs
  const kpis = useMemo(() => {
    const casketCount = caskets.length;
    const urnCount = urns.length;
    const supplierCount = suppliers.length;
    const activeOrders = orders.filter((o) => o.status !== "ARRIVED").length;
    return { casketCount, urnCount, supplierCount, activeOrders };
  }, [caskets, urns, suppliers, orders]);

  // LANDMARK: Only non-arrived orders on dashboard
  const active = useMemo(
    () => orders.filter((o) => o.status !== "ARRIVED"),
    [orders]
  );

  return (
    <div className="p-6 space-y-4">
      {/* LANDMARK: KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Caskets" value={kpis.casketCount} accent="cyan" />
        <KpiTile label="Urns" value={kpis.urnCount} accent="purple" />
        <KpiTile label="Suppliers" value={kpis.supplierCount} accent="amber" />
        <KpiTile label="Active Orders" value={kpis.activeOrders} accent="emerald" />
      </div>

      {/* LANDMARK: Create Order + Search */}
      <HoloPanel railColor="cyan">
        <div className="flex flex-wrap items-center gap-3">
          <OrderModal onCreated={load} />
          <div className="grow" />
          <div className="w-full sm:w-auto">
            <Input className="input-sm w-full" placeholder="(Optional) quick filter by PO, item, supplier — coming soon" disabled />
          </div>
        </div>
      </HoloPanel>

      {/* LANDMARK: Mixed order list (no columns) */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {active.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            suppliers={suppliers}
            caskets={caskets}
            urns={urns}
            onMarkDelivered={(oo) => setArriving(oo)}
            onEdit={(oo) => setEditing(oo)}
          />
        ))}
        {active.length === 0 && (
          <HoloPanel railColor="emerald">
            <div className="text-white/70">No active orders. 🎉</div>
          </HoloPanel>
        )}
      </div>

      {/* LANDMARK: Mark Delivered modal */}
      {arriving && (
        <ArrivalModal
          order={arriving}
          onCompleted={async () => {
            setArriving(null);
            await load();
          }}
          onClose={() => setArriving(null)}
        />
      )}

      {/* LANDMARK: Edit Order modal (minimal but functional) */}
      {editing && (
        <EditOrderModal
          order={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

/** LANDMARK: Minimal Edit Order modal
 * Edits: PO#, expected date, backordered + TBD, notes.
 * (Supplier/item are derived; full item change would be a separate flow.)
 */
function EditOrderModal({
  order,
  onClose,
  onSaved,
}: {
  order: VOrderEnriched;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [po, setPo] = useState(order.po_number ?? "");
  const [backordered, setBackordered] = useState(!!order.backordered);
  const [tbd, setTbd] = useState(!!order.tbd_expected);
  const [expected, setExpected] = useState(order.expected_date ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");

  const canSave =
    po.trim().length > 0 &&
    (!backordered || (backordered && (tbd || expected)));

  const save = async () => {
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        po_number: po.trim(),
        backordered,
        tbd_expected: backordered ? tbd : false,
        expected_date: backordered ? (tbd ? null : expected || null) : (expected || null),
        notes: notes || null,
      }),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    await onSaved();
  };

  return (
    <Modal title="Edit Order" onClose={onClose}>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <div className="label-xs">PO#</div>
          <Input className="input-sm" value={po} onChange={(e) => setPo(e.target.value)} />
        </div>
        <div>
          <div className="label-xs">Backordered?</div>
          <div className="h-9 flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-white/80 text-sm">
              <input
                type="checkbox"
                className="accent-rose-400"
                checked={backordered}
                onChange={(e) => {
                  setBackordered(e.target.checked);
                  if (!e.target.checked) {
                    setTbd(false);
                  }
                }}
              />
              Backordered
            </label>
          </div>
        </div>
        <div>
          <div className="label-xs">Expected date</div>
          <Input
            className="input-sm"
            type="date"
            value={expected || ""}
            onChange={(e) => setExpected(e.target.value)}
            disabled={backordered && tbd}
          />
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-white/80 text-sm">
            <input
              type="checkbox"
              className="accent-rose-400"
              checked={tbd}
              onChange={(e) => {
                setTbd(e.target.checked);
                if (e.target.checked) setExpected("");
              }}
              disabled={!backordered}
            />
            TBD
          </label>
        </div>
        <div className="md:col-span-2">
          <div className="label-xs">Notes</div>
          <Input
            className="input-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes…"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={save} disabled={!canSave}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
