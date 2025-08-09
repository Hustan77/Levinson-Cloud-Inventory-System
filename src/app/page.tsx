"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import { HoloPanel } from "./components/HoloPanel";
import { KpiTile } from "./components/KpiTile";
import { OrderCard } from "./components/OrderCard";
import { OrderModal } from "./components/OrderModal";
import { Button } from "./components/ui/button";
import Link from "next/link";
import type { VOrderEnriched } from "../lib/types";

type Counts = { caskets: number; urns: number; suppliers: number; ordersActive: number };
type InvAlert = { item_type: "casket" | "urn"; item_id: number; name: string; short_by: number };

export default function Dashboard() {
  const [orders, setOrders] = useState<VOrderEnriched[]>([]);
  const [counts, setCounts] = useState<Counts>({ caskets: 0, urns: 0, suppliers: 0, ordersActive: 0 });
  const [alerts, setAlerts] = useState<InvAlert[]>([]);

  async function load() {
    const [o, c, u, s, vs] = await Promise.all([
      fetch("/api/orders?includeArrived=0", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/caskets", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/urns", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/suppliers", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/v_inventory_status").then(r => (r.ok ? r.json() : [])).catch(() => []),
    ]);

    setOrders(o);
    setCounts({ caskets: c.length, urns: u.length, suppliers: s.length, ordersActive: o.length });

    const statusRows: any[] = Array.isArray(vs) ? vs : [];
    setAlerts(statusRows.filter(r => r.requires_attention).map(r => ({
      item_type: r.item_type, item_id: r.item_id, name: r.name, short_by: r.short_by
    })));
  }

  useEffect(() => { load(); }, []);

  // LANDMARK: Mixed list, newest first
  const mixed = useMemo(() => {
    return [...orders].sort((a, b) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  }, [orders]);

  return (
    <div className="p-6 space-y-6">
      {/* LANDMARK: KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Caskets" value={counts.caskets} accent="cyan" />
        <KpiTile label="Urns" value={counts.urns} accent="purple" />
        <KpiTile label="Suppliers" value={counts.suppliers} accent="amber" />
        <KpiTile label="Active Orders" value={counts.ordersActive} accent="emerald" />
      </div>

      {/* LANDMARK: Alerts banner */}
      {alerts.length > 0 && (
        <HoloPanel railColor="rose">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <strong className="text-rose-300">Attention:</strong> {alerts.length} product(s) are short and have backorders.
            </div>
            <Link href={"/orders" as Route}><Button size="sm" variant="outline">View All Orders</Button></Link>
          </div>
          <ul className="mt-2 text-sm text-white/80 list-disc pl-6">
            {alerts.slice(0,5).map(a => (<li key={`${a.item_type}-${a.item_id}`}>{a.name} — short by {a.short_by}</li>))}
          </ul>
        </HoloPanel>
      )}

      {/* LANDMARK: Quick action */}
      <HoloPanel railColor="cyan">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/80">Create a new order</div>
          {/* OrderModal renders a fixed overlay with very high z-index so it cannot sit behind cards */}
          <OrderModal onCreated={load} />
        </div>
      </HoloPanel>

      {/* LANDMARK: Mixed order grid (uniform cards) */}
      <div
        className="
          grid gap-3
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          2xl:grid-cols-4
        "
      >
        {mixed.map(o => (<OrderCard key={o.id} order={o} onRefresh={load} />))}
        {mixed.length === 0 && (
          <HoloPanel railColor="cyan"><div className="text-sm text-white/60">No active orders</div></HoloPanel>
        )}
      </div>
    </div>
  );
}
