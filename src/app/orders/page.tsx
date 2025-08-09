"use client";

/**
 * LANDMARK: Orders History — search + filters (includes ARRIVED)
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "@/app/components/HoloPanel";
import { Input } from "@/app/components/ui/input";
import type { Supplier, Casket, Urn, VOrderEnriched } from "@/lib/types";
import { OrderCard } from "@/app/components/OrderCard";

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<VOrderEnriched[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [caskets, setCaskets] = useState<Casket[]>([]);
  const [urns, setUrns] = useState<Urn[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<""|"PENDING"|"BACKORDERED"|"SPECIAL"|"ARRIVED">("");
  const [type, setType] = useState<""|"casket"|"urn">("");
  const [supplier, setSupplier] = useState<number| "">("");

  async function load() {
    const [o,s,c,u] = await Promise.all([
      fetch("/api/orders", { cache: "no-store" }).then(r=>r.json()),
      fetch("/api/suppliers").then(r=>r.json()),
      fetch("/api/caskets").then(r=>r.json()),
      fetch("/api/urns").then(r=>r.json()),
    ]);
    setOrders(o); setSuppliers(s); setCaskets(c); setUrns(u);
  }
  useEffect(()=>{ load(); },[]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (status && o.status !== status) return false;
      if (type && o.item_type !== type) return false;
      if (supplier && o.supplier_id !== supplier) return false;
      if (q) {
        const hay = `${o.po_number ?? ""} ${o.item_name ?? ""} ${o.supplier_name ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [orders, status, type, supplier, q]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-white/90 text-lg">All Orders</h1>

      <HoloPanel railColor="cyan">
        <div className="grid md:grid-cols-6 gap-2">
          <div className="space-y-1 md:col-span-2">
            <div className="label-xs">Search</div>
            <Input className="input-sm" value={q} onChange={e=>setQ(e.target.value)} placeholder="PO, item, supplier..." />
          </div>
          <div className="space-y-1">
            <div className="label-xs">Status</div>
            <select className="select-sm w-full" value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="">Any</option>
              <option value="PENDING">Pending</option>
              <option value="BACKORDERED">Backordered</option>
              <option value="SPECIAL">Special</option>
              <option value="ARRIVED">Arrived</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="label-xs">Type</div>
            <select className="select-sm w-full" value={type} onChange={e=>setType(e.target.value as any)}>
              <option value="">Any</option>
              <option value="casket">Casket</option>
              <option value="urn">Urn</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="label-xs">Supplier</div>
            <select className="select-sm w-full" value={supplier} onChange={e=>setSupplier(e.target.value? Number(e.target.value):"")}>
              <option value="">Any</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </HoloPanel>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map(o => (
          <OrderCard
            key={o.id}
            order={o}
            suppliers={suppliers}
            caskets={caskets}
            urns={urns}
            onRefresh={load}
          />
        ))}
        {filtered.length === 0 && <div className="text-white/50 text-sm">No orders match.</div>}
      </div>
    </div>
  );
}
