"use client";

import React, { useEffect, useMemo, useState } from "react";
import { KpiTile } from "./components/KpiTile";
import { HoloPanel } from "./components/HoloPanel";
import { OrderCard } from "./components/OrderCard";
import { OrderModal } from "./components/OrderModal";
import { ArrivalModal } from "./components/ArrivalModal";
import { VOrderEnriched } from "@/lib/types";
import { SearchBar } from "./components/SearchBar";

/* LANDMARK: Dashboard */
export default function DashboardPage() {
  const [orders, setOrders] = useState<VOrderEnriched[]>([]);
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      (o.item_display_name ?? "").toLowerCase().includes(q) ||
      (o.po_number ?? "").toLowerCase().includes(q) ||
      (o.supplier_name ?? "").toLowerCase().includes(q)
    );
  }, [orders, search]);

  // KPI counts
  const kpi = useMemo(() => {
    const totalCasket = filtered.filter(o => o.item_type === "casket").length;
    const totalUrn = filtered.filter(o => o.item_type === "urn").length;
    const suppliers = new Set(filtered.map(o => o.supplier_id).filter(Boolean)).size;
    const active = filtered.filter(o => o.status !== "ARRIVED").length;
    return { totalCasket, totalUrn, suppliers, active };
  }, [filtered]);

  const grouped = useMemo(() => {
    const by = { PENDING: [] as VOrderEnriched[], BACKORDERED: [] as VOrderEnriched[], SPECIAL: [] as VOrderEnriched[], ARRIVED: [] as VOrderEnriched[] };
    for (const o of filtered) by[o.status].push(o);
    return by;
  }, [filtered]);

  const [arriving, setArriving] = useState<VOrderEnriched | null>(null);

  return (
    <div className="space-y-8">
      {/* LANDMARK: KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile label="Caskets" value={kpi.totalCasket} accent="cyan" />
        <KpiTile label="Urns" value={kpi.totalUrn} accent="emerald" />
        <KpiTile label="Suppliers" value={kpi.suppliers} accent="purple" />
        <KpiTile label="Active Orders" value={kpi.active} accent="amber" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <HoloPanel rail={false} className="flex-1">
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search orders by item, PO#, or supplier..." />
          </div>
        </HoloPanel>
        <OrderModal onCreated={load} />
      </div>

      {/* Order Lanes */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* PENDING */}
        <div>
          <h2 className="mb-2 font-semibold text-amber-300">PENDING</h2>
          <div className="space-y-3">
            {grouped.PENDING.map(o => (
              <OrderCard key={o.id} order={o} onArriveClick={(oo) => setArriving(oo)} />
            ))}
            {grouped.PENDING.length === 0 && <EmptyLane text="No pending orders" />}
          </div>
        </div>

        {/* BACKORDERED */}
        <div>
          <h2 className="mb-2 font-semibold text-rose-300">BACKORDERED</h2>
          <div className="space-y-3">
            {grouped.BACKORDERED.map(o => (
              <OrderCard key={o.id} order={o} onArriveClick={(oo) => setArriving(oo)} />
            ))}
            {grouped.BACKORDERED.length === 0 && <EmptyLane text="No backorders" />}
          </div>
        </div>

        {/* SPECIAL */}
        <div>
          <h2 className="mb-2 font-semibold text-fuchsia-300">SPECIAL</h2>
          <div className="space-y-3">
            {grouped.SPECIAL.map(o => (
              <OrderCard key={o.id} order={o} onArriveClick={(oo) => setArriving(oo)} />
            ))}
            {grouped.SPECIAL.length === 0 && <EmptyLane text="No special orders" />}
          </div>
        </div>

        {/* ARRIVED */}
        <div>
          <h2 className="mb-2 font-semibold text-emerald-300">ARRIVED</h2>
          <div className="space-y-3">
            {grouped.ARRIVED.map(o => (
              <OrderCard key={o.id} order={o} onArriveClick={(oo) => setArriving(oo)} />
            ))}
            {grouped.ARRIVED.length === 0 && <EmptyLane text="No arrivals yet" />}
          </div>
        </div>
      </div>

      {arriving && (
        <ArrivalModal
          order={arriving}
          onCompleted={() => { setArriving(null); load(); }}
        />
      )}
    </div>
  );
}

function EmptyLane({ text }: { text: string }) {
  return (
    <div className="holo-glass p-4 text-sm text-white/60">{text}</div>
  );
}
