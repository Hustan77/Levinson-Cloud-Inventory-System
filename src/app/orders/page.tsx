"use client";

/**
 * LANDMARK: Orders history (past year)
 * - Client trims to last 365 days from today
 * - Search by PO, item name, supplier name
 * - Filter by status, type
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { Input } from "../components/ui/input";
import type { VOrderEnriched } from "@/lib/types";

type Status = "PENDING" | "BACKORDERED" | "ARRIVED" | "SPECIAL";
type ItemType = "casket" | "urn";

export default function OrdersHistoryPage() {
  const [rows, setRows] = useState<VOrderEnriched[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | Status>("");
  const [type, setType] = useState<"" | ItemType>("");

  async function load() {
    const res = await fetch("/api/orders", { cache: "no-store" });
    const data: VOrderEnriched[] = await res.json();
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);

  const lastYear = useMemo(()=>{
    const d = new Date();
    d.setDate(d.getDate() - 365);
    return d;
  },[]);

  const filtered = useMemo(()=>{
    return (rows ?? [])
      .filter(r=>{
        // only last 365 days by created_at (if absent, include)
        if (r.created_at) {
          const d = new Date(r.created_at);
          if (d < lastYear) return false;
        }
        if (status && r.status !== status) return false;
        if (type && r.item_type !== type) return false;
        if (q) {
          const s = `${r.po_number ?? ""} ${r.item_name ?? ""} ${r.supplier_name ?? ""}`.toLowerCase();
          if (!s.includes(q.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a,b)=>{
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
  },[rows,q,status,type,lastYear]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-white/90 text-lg">Orders — Last 12 Months</h1>

      <HoloPanel railColor="cyan">
        <div className="grid md:grid-cols-4 gap-2">
          <div className="space-y-1 md:col-span-2">
            <div className="label-xs">Search</div>
            <Input className="input-sm" value={q} onChange={e=>setQ(e.target.value)} placeholder="PO, item, supplier..." />
          </div>
          <div className="space-y-1">
            <div className="label-xs">Status</div>
            <select className="select-sm w-full text-white bg-white/5 border border-white/10 rounded-md" value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="">Any</option>
              <option value="PENDING">Pending</option>
              <option value="BACKORDERED">Backordered</option>
              <option value="SPECIAL">Special</option>
              <option value="ARRIVED">Arrived</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="label-xs">Type</div>
            <select className="select-sm w-full text-white bg-white/5 border border-white/10 rounded-md" value={type} onChange={e=>setType(e.target.value as any)}>
              <option value="">Any</option>
              <option value="casket">Casket</option>
              <option value="urn">Urn</option>
            </select>
          </div>
        </div>
      </HoloPanel>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map(o=>(
          <HoloPanel key={o.id} railColor={o.status === "ARRIVED" ? "emerald" : o.status === "BACKORDERED" ? "rose" : o.status === "SPECIAL" ? "purple" : "amber"}>
            <div className="flex items-center justify-between">
              <div className="text-white/90">{o.item_name ?? (o.item_type === "casket" ? "Casket" : "Urn")}</div>
              <span className="text-xs text-white/50">PO #{o.po_number}</span>
            </div>
            <div className="text-xs text-white/60 mt-1">
              {o.item_type.toUpperCase()} • Supplier: {o.supplier_name ?? "—"}
            </div>
            <div className="text-xs text-white/60 mt-1 space-y-0.5">
              <div>Status: {o.status}</div>
              {o.backordered && <div>Backordered {o.tbd_expected ? "(TBD)" : (o.expected_date ?? "")}</div>}
              {!o.backordered && o.expected_date && <div>Expected: {o.expected_date}</div>}
              {o.arrived_at && <div>Arrived: {new Date(o.arrived_at).toLocaleString()}</div>}
              <div>Created: {o.created_at ? new Date(o.created_at).toLocaleString() : "—"}</div>
              {o.need_by_date && <div>Need By: {o.need_by_date}</div>}
              {o.notes && <div className="text-white/50 italic">{o.notes}</div>}
            </div>
          </HoloPanel>
        ))}
      </div>
    </div>
  );
}
