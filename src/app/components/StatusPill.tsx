import React from "react";
import { Badge } from "./ui/badge";


export function StatusPill({ status }: { status: "PENDING"|"BACKORDERED"|"ARRIVED"|"SPECIAL" }) {
  const map = {
    PENDING: "text-amber-300 border-amber-300/30",
    BACKORDERED: "text-rose-300 border-rose-300/30",
    ARRIVED: "text-emerald-300 border-emerald-300/30",
    SPECIAL: "text-fuchsia-300 border-fuchsia-300/30"
  } as const;
  return <Badge className={map[status]}>{status}</Badge>;
}
