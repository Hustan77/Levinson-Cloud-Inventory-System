"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Route } from "next"; // ✅ typedRoutes: use Route for Link href
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
    setCounts({
      caskets: c.length,
      urns: u.length,
      suppliers: s.length,
      ordersActive: o.length,
    });

    const statusRows: any[] = Array.isArray(vs) ? vs : [];
    const needs = statusRows
      .filter(r => r.requires_attention)
      .map((r) => ({
        item_type: r.item_type,
        item_id: r.item_id,
        name: r.name,
        short_by: r.short_by,
      }));
    setAlerts(needs);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const g = {
      PENDING: [] as VOrderEnriched[],
      BACKORDERED: [] as VOrderEnriched[],
      SPECIAL: [] as VOrderEnriched[],
    };
    for (const o of orders) {
      if (o.status === "PENDING") g.PENDING.push(o);
      else if (o.status === "BACKORDERED") g.BACKORDERED.push(o);
      else if (o.status === "SPECIAL") g.SPECIAL.push(o);
    }
    return g;
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
            {/* ✅ typedRoutes fix: cast to Route */}
            <Link href={"/orders" as Route}>
              <Button size="sm" variant="outline">View All Orders</Button>
            </Link>
          </div>
          <ul className="mt-2 text-sm text-white/80 list-disc pl-6">
            {alerts.slice(0, 5).map((a) => (
              <li key={`${a.item_type}-${a.item_id}`}>{a.name} — short by {a.short_by}</li>
            ))}
          </ul>
        </HoloPanel>
      )}

      {/* LANDMARK: Quick actions */}
      <HoloPanel railColor="cyan">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/80">Create a new order</div>
          <OrderModal onCreated={load} />
        </div>
      </HoloPanel>

      {/* LANDMARK: Order Lanes (ARRIVED excluded) */}
      <div className="grid md:grid-cols-3 gap-4">
        <Lane title="Pending" color="amber" items={grouped.PENDING} reload={load} />
        <Lane title="Backordered" color="rose" items={grouped.BACKORDERED} reload={load} />
        <Lane title="Special" color="purple" items={grouped.SPECIAL} reload={load} />
      </div>
    </div>
  );
}

function Lane({
  title,
  color,
  items,
  reload,
}: {
  title: string;
  color: string;
  items: VOrderEnriched[];
  reload: () => void;
}) {
  return (
    <div>
      <div className="mb-2 text-white/70 uppercase tracking-widest text-xs">{title}</div>
      <div className="space-y-3">
        {items.map((o) => (
          <OrderCard key={o.id} order={o} onRefresh={reload} />
        ))}
        {items.length === 0 && <EmptyLane text={`No ${title.toLowerCase()} orders`} />}
      </div>
    </div>
  );
}

function EmptyLane({ text }: { text: string }) {
  return (
    <HoloPanel railColor="cyan">
      <div className="text-sm text-white/60">{text}</div>
    </HoloPanel>
  );
}
