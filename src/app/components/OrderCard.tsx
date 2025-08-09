"use client";

import React from "react";
import { HoloPanel } from "./HoloPanel";
import { Button } from "./ui/button";
import { StatusPill } from "./StatusPill";
import type { VOrderEnriched } from "../../lib/types";
import { ArrivalModal } from "./ArrivalModal";
import { OrderModal } from "./OrderModal";

function statusColor(status: VOrderEnriched["status"]) {
  switch (status) {
    case "PENDING": return "amber";
    case "BACKORDERED": return "rose";
    case "SPECIAL": return "purple";
    case "ARRIVED": return "emerald";
    default: return "cyan";
  }
}

export function OrderCard({
  order,
  onRefresh,
}: {
  order: VOrderEnriched;
  onRefresh: () => void;
}) {
  const rail = statusColor(order.status);
  return (
    <HoloPanel railColor={rail} className="min-h-[170px] flex flex-col">
      {/* LANDMARK: Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white/90 text-sm">{order.item_display_name ?? order.item_name ?? "Special Item"}</div>
          <div className="text-xs text-white/60 mt-1">
            Supplier: {order.supplier_name ?? "—"} • PO {order.po_number}
          </div>
          <div className="mt-2"><StatusPill status={order.status} /></div>
        </div>
        <div className="text-xs text-white/50 text-right">
          Created {new Date(order.created_at).toLocaleDateString()}
          {order.expected_date && <div>ETA {new Date(order.expected_date).toLocaleDateString()}</div>}
          {order.notes && <div className="mt-1 text-white/60 max-w-[240px] truncate" title={order.notes}>Notes: {order.notes}</div>}
        </div>
      </div>

      {/* LANDMARK: Actions */}
      <div className="mt-auto flex gap-2 pt-3">
        <ArrivalModal
          order={order}
          onCompleted={onRefresh}
          triggerLabel="Mark Delivered"
        />
        <OrderModal
          mode="update"
          orderId={order.id}
          initial={order}
          onDone={onRefresh}
          triggerLabel="Update"
        />
      </div>
    </HoloPanel>
  );
}
