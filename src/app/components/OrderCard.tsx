"use client";

import React, { useMemo } from "react";
import { HoloPanel } from "./HoloPanel";
import { StatusPill } from "./StatusPill";
import { Button } from "./ui/button";
import { ArrivalModal } from "./ArrivalModal";
import { VOrderEnriched, Supplier, Casket, Urn } from "../../lib/types";
import { OrderModal } from "./OrderModal";

type Props = {
  order: VOrderEnriched;
  onArriveClick?: (order: VOrderEnriched) => void;
  suppliers?: Supplier[];
  caskets?: Casket[];
  urns?: Urn[];
  onRefresh?: () => void;
};

export function OrderCard({
  order,
  onArriveClick,
  suppliers,
  caskets,
  urns,
  onRefresh,
}: Props) {
  const color = useMemo(() => {
    switch (order.status) {
      case "PENDING": return "amber";
      case "BACKORDERED": return "rose";
      case "SPECIAL": return "purple";
      case "ARRIVED": return "emerald";
      default: return "cyan";
    }
  }, [order.status]);

  return (
    <HoloPanel railColor={color}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusPill status={order.status} />
            <div className="text-sm text-white/60">
              PO: <span className="text-white">{order.po_number}</span>
            </div>
          </div>

          <div className="mt-2 text-sm text-white/80">
            <div>Type: {order.item_type.toUpperCase()}</div>
            {order.item_name ? (
              <div>Item: <span className="text-white">{order.item_name}</span></div>
            ) : (
              <div>Item ID: {order.item_id ?? "—"}</div>
            )}
            {order.deceased_name && <div>Deceased: {order.deceased_name}</div>}
            <div>Expected: {order.tbd_expected ? "TBD" : (order.expected_date ?? "—")}</div>
            {!!order.supplier_name && <div className="text-white/60">Supplier: {order.supplier_name}</div>}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <OrderModal
            mode="update"
            trigger={<Button size="sm" variant="outline">Update</Button>}
            suppliers={suppliers}
            caskets={caskets}
            urns={urns}
            orderId={order.id}
            initial={{
              item_type: order.item_type,
              item_id: order.item_id,
              item_name: order.item_name,
              supplier_id: order.supplier_id,
              po_number: order.po_number,
              expected_date: order.expected_date,
              backordered: order.backordered,
              tbd_expected: order.tbd_expected,
              status: order.status,
              deceased_name: order.deceased_name,
            }}
            onDone={onRefresh}
            onCreated={onRefresh}
          />

          {order.status !== "ARRIVED" && (
            onArriveClick
              ? <Button size="sm" variant="default" onClick={() => onArriveClick(order)}>Mark Delivered</Button>
              : <ArrivalModal order={order} onCompleted={onRefresh} triggerLabel="Mark Delivered" />
          )}
        </div>
      </div>
    </HoloPanel>
  );
}
