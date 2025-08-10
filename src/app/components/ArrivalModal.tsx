"use client";

/**
 * LANDMARK: ArrivalModal (portal + high z-index + default now)
 */

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { VOrderEnriched } from "@/lib/types";

function toLocalInputDateTime(now: Date) {
  // yyyy-MM-ddTHH:mm for <input type="datetime-local">
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

export function ArrivalModal({
  order,
  onClose,
  onCompleted,
}: {
  order: VOrderEnriched;
  onClose: () => void;
  onCompleted: () => void | Promise<void>;
}) {
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const [receivedBy, setReceivedBy] = useState("");
  const [arrivedAt, setArrivedAt] = useState<string>(toLocalInputDateTime(new Date())); // LANDMARK: default now

  const itemDisplay = useMemo(() => {
    return order.item_display || order.item_name || `${order.item_type === "urn" ? "Urn" : "Casket"}${order.item_id ? ` #${order.item_id}` : ""}`;
  }, [order]);

  useEffect(() => {
    setMounted(true);
    const el = document.createElement("div");
    el.setAttribute("data-portal", "arrival-modal");
    document.body.appendChild(el);
    setContainer(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  async function submit() {
    const payload: any = {
      received_by: receivedBy.trim() || "Unknown",
      arrived_at: arrivedAt ? new Date(arrivedAt).toISOString() : undefined,
    };

    const res = await fetch(`/api/orders/${order.id}/arrive`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      alert(`Failed: ${txt}`);
      return;
    }

    await onCompleted();
  }

  if (!mounted || !container) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/65" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="arrival-modal-title" className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl p-5 shadow-[0_0_80px_rgba(0,0,0,0.65)]">
          <h2 id="arrival-modal-title" className="text-white/90 text-sm mb-3">
            Mark Delivered — Order #{order.id}
          </h2>

          <div className="space-y-2 text-sm">
            <div className="text-white/70">
              <span className="text-white/50">Item:</span>{" "}
              <span className="text-white/90">{itemDisplay}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="label-xs">Received by</div>
                <Input className="input-sm" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <div className="label-xs">Arrived at</div>
                <Input className="input-sm" type="datetime-local" value={arrivedAt} onChange={(e) => setArrivedAt(e.target.value)} />
              </div>
            </div>
          </div>

           <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={submit}>Mark Delivered</Button>
          </div>
        </div>
      </div>
    </div>,
    container
  );
}

export default ArrivalModal;
