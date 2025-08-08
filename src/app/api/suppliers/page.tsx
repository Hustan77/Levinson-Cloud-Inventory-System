"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SearchBar } from "../components/SearchBar";
import { HoloPanel } from "../components/HoloPanel";

type Row = { id:number; name:string; ordering_instructions:string | null };

export default function SuppliersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => { fetch("/api/suppliers").then(r => r.json()).then(setRows); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => r.name.toLowerCase().includes(s));
  }, [rows, q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Suppliers</h1>
        <div className="w-80"><SearchBar value={q} onChange={setQ} /></div>
      </div>
      <div className="space-y-4">
        {filtered.map(r => (
          <HoloPanel key={r.id}>
            <div className="text-lg font-semibold">{r.name}</div>
            <div className="mt-1 text-sm text-white/70 whitespace-pre-wrap">{r.ordering_instructions ?? "—"}</div>
          </HoloPanel>
        ))}
        {filtered.length === 0 && <div className="text-white/60">No matches.</div>}
      </div>
    </div>
  );
}
