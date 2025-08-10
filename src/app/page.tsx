"use client";

// LANDMARK: Dashboard (mixed order list + inventory health KPIs)

import React, { useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import Link from "next/link";

import { HoloPanel } from "./components/HoloPanel";
import OrderCard from "./components/OrderCard";
import OrderModal from "./components/OrderModal";
import { ArrivalModal } from "./components/ArrivalModal";

import { KpiTile } from "./components/KpiTile";
import type { Casket, Supplier, Urn, VOrderEnriched } from "@/lib/types";

// LANDMARK: mini KPI chip
function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "cyan" | "emerald" | "amber" | "rose" | "purple";
}) {
  const color =
    accent === "cyan"
      ? "ring-cyan-400/60 text-cyan-300"
      : accent === "emerald"
      ? "ring-emerald-400/60 text-emerald-300"
      : accent === "amber"
      ? "ring-amber-400/60 text-amber-300"
      : accent === "rose"
      ? "ring-rose-400/60 text-rose-300"
      : "ring-purple-400/60 text-fuchsia-300";

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 ring-1 ${color}`}>
      <span className="text-xs text-white/60">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<VOrderEnriched[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [caskets, setCaskets] = useState<Casket[]>([]);
  const [urns, setUrns] = useState<Urn[]>([]);

  // Modal state
  const [arriving, setArriving] = useState<VOrderEnriched | null>(null);

  async function load() {
    const [oo, ss, cc, uu] = await Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/caskets").then((r) => r.json()),
      fetch("/api/urns").then((r) => r.json()),
    ]);
    setOrders(oo ?? []);
    setSuppliers(ss ?? []);
    setCaskets(cc ?? []);
    setUrns(uu ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  // Mixed list: filter out ARRIVED from dashboard (they live in /orders history)
  const activeOrders = useMemo(
    () => (orders ?? []).filter((o) => o.status !== "ARRIVED"),
    [orders]
  );

  const activeSorted = useMemo(() => {
    return [...activeOrders].sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });
  }, [activeOrders]);

  // LANDMARK: inventory health KPIs
  const casketBackorderedIds = useMemo(() => {
    const ids = new Set<number>();
    for (const o of activeOrders) {
      if (o.item_type === "casket" && o.backordered) {
        if (o.item_id) ids.add(o.item_id);
      }
    }
    return ids;
  }, [activeOrders]);

  const urnBackorderedIds = useMemo(() => {
    const ids = new Set<number>();
    for (const o of activeOrders) {
      if (o.item_type === "urn" && o.backordered) {
        if (o.item_id) ids.add(o.item_id);
      }
    }
    return ids;
  }, [activeOrders]);

  const casketStats = useMemo(() => {
    let belowTarget = 0;
    let outOfStock = 0;
    let backordered = 0;

    for (const c of caskets) {
      const target = (c as any).target_qty ?? null;
      const onHand = (c as any).on_hand ?? 0;
      const onOrder = (c as any).on_order ?? 0; // assumed synced from orders or maintained
      if (target != null && onHand + onOrder < target) belowTarget++;
      if (onHand === 0) outOfStock++;
      if (casketBackorderedIds.has(c.id)) backordered++;
    }
    return { belowTarget, outOfStock, backordered };
  }, [caskets, casketBackorderedIds]);

  const urnStats = useMemo(() => {
    let belowTarget = 0;
    let outOfStock = 0;
    let backordered = 0;

    for (const u of urns) {
      const target = (u as any).target_qty ?? null;
      const onHand = (u as any).on_hand ?? 0;
      const onOrder = (u as any).on_order ?? 0;
      if (target != null && onHand + onOrder < target) belowTarget++;
      if (onHand === 0) outOfStock++;
      if (urnBackorderedIds.has(u.id)) backordered++;
    }
    return { belowTarget, outOfStock, backordered };
  }, [urns, urnBackorderedIds]);

  // KPI counts (top row remains)
  const kCaskets = caskets.length;
  const kUrns = urns.length;
  const kSuppliers = suppliers.length;
  const kActiveOrders = activeSorted.length;

  return (
    <div className="p-6 space-y-6">
      {/* LANDMARK: Header actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Link
            href={"/orders" as Route}
            className="inline-flex h-9 px-3 items-center rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            title="View all orders (past year)"
          >
            View All Orders
          </Link>
          <OrderModal onCreated={load} />
        </div>
      </div>

      {/* LANDMARK: KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* LANDMARK: KPI Tiles */}
        <KpiTile label="Caskets" value={kCaskets} accent="cyan" />
        <KpiTile label="Urns" value={kUrns} accent="emerald" />
        <KpiTile label="Suppliers" value={kSuppliers} accent="purple" />
        <KpiTile label="Active Orders" value={kActiveOrders} accent="amber" />
      </div>

      {/* LANDMARK: Inventory Health snapshots */}
      <div className="grid md:grid-cols-2 gap-4">
        <HoloPanel rail railColor="cyan">
          <div className="text-white/80 text-sm mb-3">Caskets — Inventory Health</div>
          <div className="flex flex-wrap gap-3">
            <MiniStat label="Below Target" value={casketStats.belowTarget} accent="amber" />
            <MiniStat label="Backordered" value={casketStats.backordered} accent="rose" />
            <MiniStat label="None On Hand" value={casketStats.outOfStock} accent="rose" />
          </div>
        </HoloPanel>
        <HoloPanel rail railColor="emerald">
          <div className="text-white/80 text-sm mb-3">Urns — Inventory Health</div>
          <div className="flex flex-wrap gap-3">
            <MiniStat label="Below Target" value={urnStats.belowTarget} accent="amber" />
            <MiniStat label="Backordered" value={urnStats.backordered} accent="rose" />
            <MiniStat label="None On Hand" value={urnStats.outOfStock} accent="rose" />
          </div>
        </HoloPanel>
      </div>

      {/* LANDMARK: Mixed Order List */}
      <HoloPanel rail railColor="cyan">
        <div className="text-white/80 text-sm mb-2">Active Orders</div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {activeSorted.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              suppliers={suppliers}
              caskets={caskets}
              urns={urns}
              onMarkDelivered={(oo) => setArriving(oo)}
              onEdit={(oo) => {
                console.log("Edit order requested:", oo.id);
              }}
            />
          ))}
          {activeSorted.length === 0 && (
            <div className="col-span-full text-white/50 text-sm">No active orders.</div>
          )}
        </div>
      </HoloPanel>

      {/* LANDMARK: Arrival Modal */}
      {arriving && (
        <ArrivalModal
          order={arriving}
          onClose={() => setArriving(null)}
          onCompleted={async () => {
            setArriving(null);
            await load();
          }}
        />
      )}
    </div>
  );
}
