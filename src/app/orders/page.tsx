"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { StatusPill } from "../components/StatusPill";
import { ArrivalModal } from "../components/ArrivalModal";
import { VOrderEnriched } from "../../lib/types";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export default function OrdersAllPage() {
  const [orders, setOrders] = useState<VOrderEnriched[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "PENDING" | "BACKORDERED" | "SPECIAL" | "ARRIVED">("");
  const [type, setType] = useState<"" | "casket" | "urn">("");
  const [onlyBackordered, setOnlyBackordered] = useState(false);

  async function load() {
    const rows = await fetch("/api/orders?includeArrived=1", { cache: "no-store" }).then(r => r.json());
    setOrders(rows);
  }
  useEffect(()=>{ load(); }, []);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (q) {
        const t = `${o.item_display_name ?? ""} ${o.po_number} ${o.supplier_name ?? ""}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      if (status && o.status !== status) return false;
      if (type && o.item_type !== type) return false;
      if (onlyBackordered && !o.backordered) return false;
      return true;
    });
  }, [orders, q, status, type, onlyBackordered]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">All Orders</h1>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      <HoloPanel railColor="cyan">
        {/* LANDMARK: Filters */}
        <div className="grid md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-white/60">Search</div>
            <Input className="input-sm" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Item/PO/Supplier"/>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/60">Status</div>
            <select className="select-sm w-full" value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="">Any</option>
              <option value="PENDING">Pending</option>
              <option value="BACKORDERED">Backordered</option>
              <option value="SPECIAL">Special</option>
              <option value="ARRIVED">Arrived</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/60">Item Type</div>
            <select className="select-sm w-full" value={type} onChange={e=>setType(e.target.value as any)}>
              <option value="">Any</option>
              <option value="casket">Casket</option>
              <option value="urn">Urn</option>
            </select>
          </div>
          <label className="flex items-end gap-2">
            <input type="checkbox" className="accent-rose-400" checked={onlyBackordered} onChange={e=>setOnlyBackordered(e.target.checked)}/>
            <span className="text-sm">Backordered Only</span>
          </label>
        </div>
      </HoloPanel>

      <div className="space-y-3">
        {filtered.map(o => (
          <HoloPanel key={o.id} railColor={
            o.status === "ARRIVED" ? "emerald" : (o.status === "SPECIAL" ? "purple" : (o.status === "BACKORDERED" ? "rose" : "amber"))
          }>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <StatusPill status={o.status}/>
                  <div className="text-sm text-white/60">PO: <span className="text-white">{o.po_number}</span></div>
                </div>
                <div className="mt-2 text-sm text-white/80">
                  <div>Type: {o.item_type.toUpperCase()}</div>
                  <div>Item: {o.item_display_name ?? "—"}</div>
                  <div>Supplier: {o.supplier_name ?? "—"}</div>
                  <div>Expected: {o.tbd_expected ? "TBD" : (o.expected_date ?? "—")}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {o.status !== "ARRIVED" && (
                  <ArrivalModal order={o} onCompleted={load} triggerLabel="Mark Delivered" />
                )}
              </div>
            </div>
          </HoloPanel>
        ))}
        {filtered.length === 0 && (
          <HoloPanel railColor="cyan"><div className="text-sm text-white/60">No orders match your filters.</div></HoloPanel>
        )}
      </div>
    </div>
  );
}
