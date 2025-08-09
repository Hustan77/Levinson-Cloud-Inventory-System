"use client";

/**
 * LANDMARK: All Orders (past year)
 * - Shows ALL statuses, including ARRIVED
 * - Basic search (PO, item name, supplier)
 * - Status filter
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { Input } from "../components/ui/input";
import type { VOrderEnriched } from "@/lib/types";

export default function OrdersAllPage(){
  const [rows, setRows] = useState<VOrderEnriched[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<""|"PENDING"|"BACKORDERED"|"SPECIAL"|"ARRIVED">("");

  async function load(){
    const data = await fetch("/api/orders", { cache:"no-store" }).then(r=>r.json());
    setRows(data ?? []);
  }
  useEffect(()=>{ load(); },[]);

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase();
    return rows
      .filter(r=>{
        if (status && r.status !== status) return false;
        if (!term) return true;
        const hay = `${r.po_number ?? ""} ${r.item_name ?? ""} ${r.supplier_name ?? ""}`.toLowerCase();
        return hay.includes(term);
      })
      .sort((a,b)=> (b.created_at?.localeCompare(a.created_at ?? "") ?? 0));
  },[rows, q, status]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">All Orders (Past Year)</h1>
      </div>

      <HoloPanel railColor="cyan">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-3">
            <div className="label-xs">Search</div>
            <Input className="input-sm" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search PO, item, supplier..." />
          </div>
          <div>
            <div className="label-xs">Status</div>
            <select className="select-sm w-full text-white bg-white/5 border border-white/10 rounded-md" value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="">Any</option>
              <option value="PENDING">Pending</option>
              <option value="BACKORDERED">Backordered</option>
              <option value="SPECIAL">Special</option>
              <option value="ARRIVED">Arrived</option>
            </select>
          </div>
        </div>
      </HoloPanel>

      <HoloPanel railColor="purple">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/60 bg-white/5">
              <tr>
                <th className="text-left font-normal px-3 py-2">Created</th>
                <th className="text-left font-normal px-3 py-2">PO</th>
                <th className="text-left font-normal px-3 py-2">Item</th>
                <th className="text-left font-normal px-3 py-2">Supplier</th>
                <th className="text-left font-normal px-3 py-2">Status</th>
                <th className="text-left font-normal px-3 py-2">Expected</th>
                <th className="text-left font-normal px-3 py-2">Arrived</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r)=>(
                <tr key={r.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-3 py-2 text-white/70">{r.created_at?.slice(0,10) ?? "—"}</td>
                  <td className="px-3 py-2 text-white/90">{r.po_number}</td>
                  <td className="px-3 py-2 text-white/80">{r.item_name ?? (r.item_type?.toUpperCase() ?? "")}</td>
                  <td className="px-3 py-2 text-white/70">{r.supplier_name ?? "—"}</td>
                  <td className="px-3 py-2 text-white/70">{r.status}</td>
                  <td className="px-3 py-2 text-white/70">
                    {r.backordered ? (r.tbd_expected ? "TBD" : (r.expected_date ?? "—")) : (r.expected_date ?? "—")}
                  </td>
                  <td className="px-3 py-2 text-white/70">{r.arrived_at?.slice(0,16).replace("T"," ") ?? "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td className="px-3 py-6 text-center text-white/50" colSpan={7}>No orders match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </HoloPanel>
    </div>
  );
}
