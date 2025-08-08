import * as React from "react";
import { twMerge } from "tailwind-merge";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={twMerge(
        "inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-xs",
        className
      )}
    >
      {children}
    </span>
  );
}
