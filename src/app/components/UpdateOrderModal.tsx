"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { UpdateOrderSchema, VOrderEnriched } from "../../lib/types";

export function UpdateOrderModal({ order, onUpdated }: { order: VOrderEnriched; onUpdated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [po, setPo] = useState(order.po_number);
  const [backordered, setBackordered] = useState(order.backordered);
  const [tbd, setTbd] = useState(order.tbd_expected);
  const [expected, setExpected] = useState(order.expected_date ?? "");

  useEffect(() => {
    setPo(order.po_number);
    setBackordered(order.backordered);
    setTbd(order.tbd_expected);
    setExpected(order.expected_date ?? "");
  }, [order]);

  const showDate = !backordered || (backordered && !tbd);

  async function submit() {
    const payload = {
      po_number: po,
      expected_date: showDate ? (expected || null) : null,
      backordered,
      tbd_expected: backordered ? tbd : false
    };
    try { UpdateOrderSchema.parse(payload); } catch (e) { alert("Invalid update"); return; }

    const res = await fetch(`/api/orders/${order.id}`, { method: "PATCH", body: JSON.stringify(payload) });
    if (res.ok) { setOpen(false); onUpdated?.(); }
    else { alert("Update failed: " + (await res.text())); }
  }

  if (order.status === "ARRIVED") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline">Update</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Update Order — PO {order.po_number}</DialogTitle></DialogHeader>

        <div className="grid gap-3">
          <div>
            <div className="text-sm">PO#</div>
            <Input className="mt-1" value={po} onChange={(e) => setPo(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant={backordered ? "default" : "outline"} onClick={() => { setBackordered(true); setTbd(false); setExpected(""); }}>Backordered</Button>
            {!backordered ? null : (
              <Button variant={tbd ? "default" : "outline"} onClick={() => { setTbd(true); setExpected(""); }}>TBD</Button>
            )}
            <Button variant={(!backordered || !tbd) ? "default" : "outline"} onClick={() => { if (backordered) setTbd(false); }}>
              Date
            </Button>
          </div>

          {showDate && (
            <Input className="mt-1" type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!po}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
