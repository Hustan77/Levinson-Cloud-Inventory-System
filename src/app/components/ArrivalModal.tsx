"use client";

/**
 * LANDMARK: ArrivalModal — tolerant props
 * - onClose is now optional; defaults to a no-op (so older call-sites compile)
 * - triggerLabel?: string is accepted (ignored) for backward compatibility
 * - Title present for a11y; parent controls z-index/backdrop
 */

import React, { useState } from "react";
import { HoloPanel } from "./HoloPanel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { VOrderEnriched } from "../../lib/types";

export function ArrivalModal({
  order,
  onCompleted,
  onClose,
  // Back-compat only: previously some code passed a label to render a trigger button.
  // The new modal is controlled by the parent; we accept this prop to avoid TS errors.
  triggerLabel, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
  order: VOrderEnriched;
  onCompleted?: () => void;
  onClose?: () => void;         // made optional
  triggerLabel?: string;        // back-compat, ignored
}) {
  const [receivedBy, setReceivedBy] = useState("");

  async function submit() {
    const res = await fetch(`/api/orders/${order.id}/arrive`, {
      method: "PATCH",
      body: JSON.stringify({ received_by: receivedBy }),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    onCompleted?.();
  }

  // No-op close if parent didn't pass one (back-compat)
  const close = onClose ?? (() => {});

  return (
    <HoloPanel railColor="emerald" className="w-full max-w-xl">
      {/* LANDMARK: Title present for a11y */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/90 text-base">Mark Delivered</div>
        <Button variant="outline" onClick={close}>Close</Button>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-white/70">{order.item_name ?? `Order #${order.id}`}</div>
        <div className="space-y-1">
          <div className="label-xs">Received by</div>
          <Input
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
            placeholder="Your name"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={submit}>Save</Button>
      </div>
    </HoloPanel>
  );
}
