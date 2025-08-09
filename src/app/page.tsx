"use client";

/**
 * LANDMARK: Dashboard
 * - Mixed lane (no columns by type). Cards are uniform and arranged in a grid.
 * - Create Order modal guaranteed on top (z-[600]) so it never hides behind cards.
 * - OrderCard now shows compact icons that don’t collide with text.
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "./components/HoloPanel";
import { KpiTile } from "./components/KpiTile";
import { OrderCard } from "./components/OrderCard";
import { ArrivalModal } from "./components/ArrivalModal";
import { OrderModal } from "./components/OrderModal";
import { Button } from "./components/ui/button";
import type { Casket, Supplier, Urn, VOrderEnriched } from "../lib/types";

export default function Dashboard() {
  const [orders, setOrders] = useState<VOrderEnriched[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [caskets, setCaskets] = useState<Casket[]>([]);
  const [urns, setUrns] = useState<Urn[]>([]);
  const [arriving, setArriving] = useState<VOrderEnriched | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  async function load() {
    const [o, s, c, u] = await Promise.all([
      fetch("/api/orders", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/suppliers", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/caskets", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/urns", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setOrders(o);
    setSuppliers(s);
    setCaskets(c);
    setUrns(u);
  }
  useEffect(() => { load(); }, []);

  // KPI counts
  const kpis = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== "ARRIVED").length;
    return {
      caskets: caskets.length,
      urns: urns.length,
      suppliers: suppliers.length,
      activeOrders,
    };
  }, [orders, suppliers, caskets, urns]);

  // Mixed list: show only non-arrived on dashboard, arrived go to view-all page
  const visibleOrders = useMemo(
    () => orders.filter((o) => o.status !== "ARRIVED"),
    [orders]
  );

  return (
    <div className="p-6 space-y-5">
      {/* LANDMARK: Header + Create Order */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-white/90 text-lg">Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => setOpenCreate(true)}>Create Order</Button>
        </div>
      </div>

      {/* LANDMARK: KPI Tiles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile label="Caskets" value={kpis.caskets} accent="cyan" />
        <KpiTile label="Urns" value={kpis.urns} accent="purple" />
        <KpiTile label="Suppliers" value={kpis.suppliers} accent="amber" />
        <KpiTile label="Active Orders" value={kpis.activeOrders} accent="emerald" />
      </div>

      {/* LANDMARK: Orders grid (mixed) */}
      <HoloPanel railColor="cyan">
        <div className="text-xs text-white/60 mb-2">Active Orders</div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {visibleOrders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              suppliers={suppliers}
              caskets={caskets}
              urns={urns}
              onRefresh={load}
              onMarkDelivered={(oo) => setArriving(oo)}
              onDetails={() => setArriving(o)} /* reuse modal for quick info */
            />
          ))}
          {visibleOrders.length === 0 && (
            <div className="text-white/50 text-sm">No active orders.</div>
          )}
        </div>
      </HoloPanel>

      {/* LANDMARK: Create Order Modal — elevated z-index */}
      {openCreate && (
        <div className="fixed inset-0 z-[600] grid place-items-center bg-black/50">
          <OrderModal
            suppliers={suppliers}
            caskets={caskets}
            urns={urns}
            onClose={() => setOpenCreate(false)}
            onCreated={async () => {
              setOpenCreate(false);
              await load();
            }}
          />
        </div>
      )}

      {/* LANDMARK: Arrival modal (also above cards) */}
      {arriving && (
        <div className="fixed inset-0 z-[600] grid place-items-center bg-black/50">
          <ArrivalModal
            order={arriving}
            onCompleted={async () => {
              setArriving(null);
              await load();
            }}
            onClose={() => setArriving(null)}
          />
        </div>
      )}
    </div>
  );
}
