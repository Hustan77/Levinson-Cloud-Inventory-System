import React from "react";
import { StatusPill } from "./StatusPill";
import { Button } from "./ui/button";
import { VOrderEnriched } from "../../lib/types";
import { ArrivalModal } from "./ArrivalModal";
import { UpdateOrderModal } from "./UpdateOrderModal";

/* LANDMARK: Order Card with neon rail and glow */
export function OrderCard({
  order,
  onArriveClick,
  onUpdated
}: {
  order: VOrderEnriched;
  onArriveClick: (o: VOrderEnriched) => void;
  onUpdated?: () => void;
}) {
  const glow =
    order.status === "PENDING" ? "glow-amber" :
    order.status === "BACKORDERED" ? "glow-red" :
    order.status === "SPECIAL" ? "glow-purple" :
    "glow-green";

  return (
    <article className={`relative holo-glass neon-rail hover-lift ${glow}`}>
      <div className="p-4 flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <StatusPill status={order.status} />
            <div className="text-sm text-white/70">PO# {order.po_number}</div>
          </div>
          <h3 className="mt-1 text-lg font-semibold">
            {order.item_display_name ?? "(Unnamed Item)"}
          </h3>
          <div className="mt-1 text-sm text-white/70">Supplier: {order.supplier_name ?? "—"}</div>
          {order.status === "SPECIAL" && order.deceased_name ? (
            <div className="mt-1 text-sm text-white/70">Deceased: {order.deceased_name}</div>
          ) : null}
          <div className="mt-1 text-sm text-white/70">
            Expected: {order.tbd_expected ? "TBD" : (order.expected_date ?? "—")}
            {order.backordered ? " • Backordered" : ""}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {order.status !== "ARRIVED" ? (
            <>
              <UpdateOrderModal order={order} onUpdated={onUpdated} />
              <ArrivalModal order={order} onCompleted={() => onArriveClick(order)} />
            </>
          ) : (
            <div className="text-xs text-emerald-300">
              Arrived {order.arrived_at ? new Date(order.arrived_at).toLocaleString() : ""}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
