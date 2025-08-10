"use client";

// LANDMARK: Dashboard (mixed order list)
// - Imports use default exports for OrderCard, OrderModal, ArrivalModal
// - Typed callbacks (no implicit any)
// - Uses typedRoutes for Link to /orders

import React, { useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import Link from "next/link";

import { HoloPanel } from "./components/HoloPanel";
import OrderCard from "./components/OrderCard";          // FIX: default import
import OrderModal from "./components/OrderModal";        // default export per latest component
import { ArrivalModal } from "./components/ArrivalModal";    // default export per latest component

import { KpiTile } from "./components/KpiTile";
import type { Casket, Supplier, Urn, VOrderEnriched } from "@/lib/types";

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

  // Mixed list: filter out ARRIVED from dashboard (your spec)
  const activeOrders = useMemo(
    () => (orders ?? []).filter((o: VOrderEnriched) => o.status !== "ARRIVED"),
    [orders]
  );

  // Sort by created_at desc as a sensible default
  const activeSorted = useMemo(() => {
    return [...activeOrders].sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });
  }, [activeOrders]);

  // KPI counts
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
            href={"/orders" as Route} // typedRoutes friendly
            className="inline-flex h-9 px-3 items-center rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            title="View all orders (past year)"
          >
            View All Orders
          </Link>
          {/* Create Order trigger lives here */}
          <OrderModal onCreated={load} />
        </div>
      </div>

      {/* LANDMARK: KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Caskets" value={kCaskets} accent="cyan" />
        <KpiTile label="Urns" value={kUrns} accent="emerald" />
        <KpiTile label="Suppliers" value={kSuppliers} accent="purple" />
        <KpiTile label="Active Orders" value={kActiveOrders} accent="amber" />
      </div>

      {/* LANDMARK: Mixed Order List */}
      <HoloPanel rail railColor="cyan">
        <div className="text-white/80 text-sm mb-2">Active Orders</div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {activeSorted.map((o: VOrderEnriched) => (
            <OrderCard
              key={o.id}
              order={o}
              suppliers={suppliers}
              caskets={caskets}
              urns={urns}
              // FIX: add explicit type to avoid implicit any
              onMarkDelivered={(oo: VOrderEnriched) => setArriving(oo)}
              onEdit={(oo: VOrderEnriched) => {
                // You can wire an Edit Order modal here; for now just open arrival if needed,
                // or route to a detail page when ready.
                // Example placeholder:
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
