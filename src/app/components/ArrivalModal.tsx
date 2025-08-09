"use client";

import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArriveSchema, VOrderEnriched } from "../../lib/types";

export function ArrivalModal({
  order,
  onCompleted,
  triggerLabel = "Mark Delivered"
}: {
  order: VOrderEnriched;
  onCompleted?: () => void;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [receivedBy, setReceivedBy] = useState("");

  async function submit() {
    const payload = { received_by: receivedBy, arrived_at: new Date().toISOString() };
    try { ArriveSchema.parse(payload); } catch { alert("Please fill 'Received by'."); return; }
    const res = await fetch(`/api/orders/${order.id}/arrive`, { method: "PATCH", body: JSON.stringify(payload) });
    if (res.ok) { setOpen(false); onCompleted?.(); }
    else { alert("Failed: " + (await res.text())); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>{triggerLabel}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Mark Delivered — PO {order.po_number}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <label className="text-sm">Received By</label>
          <Input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder="Your name" />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!receivedBy}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
