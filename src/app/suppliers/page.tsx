"use client";

/**
 * LANDMARK: Suppliers list — compact icon actions (edit/delete), clean layout
 * - Text never collides with icons (pr-16 on content)
 */

import React, { useEffect, useMemo, useState } from "react";
import { HoloPanel } from "../components/HoloPanel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { Supplier } from "../../lib/types";

// Icons
const IconEdit = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/>
    <path d="M20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
  </svg>
);
const IconTrash = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...props}>
    <path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" fill="currentColor"/>
  </svg>
);

function IconButton({
  label, onClick, children, ariaLabel,
}: { label: string; onClick: () => void; children: React.ReactNode; ariaLabel?: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 shadow transition ease-[cubic-bezier(.2,.8,.2,1)] duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
    >
      {children}
    </button>
  );
}

export default function SuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [open, setOpen] = useState<null | { mode: "add" } | { mode: "edit"; row: Supplier }>(null);
  const [q, setQ] = useState("");

  async function load() {
    const s = await fetch("/api/suppliers", { cache: "no-store" }).then((r) => r.json());
    setRows(s);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const t = q.toLowerCase();
    return rows.filter((r) => `${r.name} ${r.ordering_instructions ?? ""}`.toLowerCase().includes(t));
  }, [rows, q]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white/90 text-lg">Suppliers</h1>
        <Button onClick={() => setOpen({ mode: "add" })}>Add Supplier</Button>
      </div>

      <HoloPanel railColor="cyan">
        <div className="grid md:grid-cols-3 gap-2">
          <div className="space-y-1">
            <div className="label-xs">Search</div>
            <Input className="input-sm" placeholder="Name or notes..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </HoloPanel>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map((row) => (
          <HoloPanel key={row.id} railColor="emerald" className="relative min-h-[120px]">
            {/* Icon strip */}
            <div className="absolute right-2 top-2 z-10 flex gap-1">
              <IconButton
                label="Edit"
                ariaLabel={`Edit ${row.name}`}
                onClick={() => setOpen({ mode: "edit", row })}
              >
                <IconEdit className="text-white/80" />
              </IconButton>
              <IconButton
                label="Delete"
                ariaLabel={`Delete ${row.name}`}
                onClick={async () => {
                  if (!confirm("Delete this supplier?")) return;
                  const res = await fetch(`/api/suppliers/${row.id}`, { method: "DELETE" });
                  if (!res.ok) {
                    alert(await res.text());
                    return;
                  }
                  load();
                }}
              >
                <IconTrash className="text-rose-400" />
              </IconButton>
            </div>

            {/* Content with right gutter so text never hits icons */}
            <div className="pr-16">
              <div className="text-white/90">{row.name}</div>
              <div className="text-xs text-white/60 mt-1 whitespace-pre-line">
                {row.ordering_instructions || "—"}
              </div>
            </div>
          </HoloPanel>
        ))}
      </div>

      {open && (
        <SupplierModal
          mode={open.mode}
          row={open.mode === "edit" ? open.row : undefined}
          onClose={() => setOpen(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function SupplierModal({
  mode, row, onClose, onSaved,
}: {
  mode: "add" | "edit";
  row?: Supplier;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(row?.name ?? "");
  const [inst, setInst] = useState(row?.ordering_instructions ?? "");

  async function save() {
    const payload = { name: name.trim(), ordering_instructions: inst.trim() || null };
    const url = mode === "add" ? "/api/suppliers" : `/api/suppliers/${row!.id}`;
    const method = mode === "add" ? "POST" : "PATCH";
    const res = await fetch(url, { method, body: JSON.stringify(payload) });
    if (!res.ok) { alert(await res.text()); return; }
    onClose(); onSaved();
  }

  return (
    <div className="fixed inset-0 z-[500] grid place-items-center bg-black/40">
      <HoloPanel railColor="purple" className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white/90">{mode === "add" ? "Add Supplier" : "Edit Supplier"}</div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="grid gap-3">
          <div className="space-y-1">
            <div className="label-xs">Name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="label-xs">Ordering Instructions</div>
            <textarea
              className="w-full rounded-md bg-white/5 border border-white/10 p-2 text-sm outline-none focus:ring-2 focus:ring-cyan-400/60"
              rows={6}
              value={inst}
              onChange={(e) => setInst(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={save}>Save</Button>
        </div>
      </HoloPanel>
    </div>
  );
}
