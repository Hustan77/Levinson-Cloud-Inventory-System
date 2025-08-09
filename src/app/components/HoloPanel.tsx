"use client";

/**
 * LANDMARK: HoloPanel — glass slab + optional neon rail
 * - Accepts rail (boolean) and railColor (string key) to color the left neon rail.
 * - Backwards compatible: if callers only pass `rail`, it still works.
 * - `railColor` supports: cyan, amber, rose, purple, emerald (defaults to cyan).
 */

import React from "react";
import clsx from "clsx";

type RailKey = "cyan" | "amber" | "rose" | "purple" | "emerald";

const RAIL_COLORS: Record<RailKey, { glow: string; solid: string; grad: string }> = {
  cyan:    { glow: "0 0 24px rgba(34,211,238,.6)", solid: "#22d3ee", grad: "from-cyan-400/90 to-cyan-300/60" },
  amber:   { glow: "0 0 24px rgba(251,191,36,.6)", solid: "#fbbf24", grad: "from-amber-400/90 to-amber-300/60" },
  rose:    { glow: "0 0 24px rgba(244,63,94,.6)",  solid: "#f43f5e", grad: "from-rose-400/90 to-rose-300/60" },
  purple:  { glow: "0 0 24px rgba(168,85,247,.6)", solid: "#a855f7", grad: "from-purple-400/90 to-purple-300/60" },
  emerald: { glow: "0 0 24px rgba(16,185,129,.6)", solid: "#10b981", grad: "from-emerald-400/90 to-emerald-300/60" },
};

export function HoloPanel({
  children,
  rail = true,
  railColor = "cyan",
  className,
}: {
  children: React.ReactNode;
  rail?: boolean;
  railColor?: RailKey | string; // allow custom hex/css too
  className?: string;
}) {
  const preset = (["cyan","amber","rose","purple","emerald"] as RailKey[]).includes(
    railColor as RailKey
  )
    ? (railColor as RailKey)
    : ("cyan" as RailKey);

  const cfg = RAIL_COLORS[preset];

  const customColor =
    !(["cyan","amber","rose","purple","emerald"] as string[]).includes(railColor as string) &&
    typeof railColor === "string"
      ? railColor
      : null;

  return (
    <div
      className={clsx(
        "relative rounded-2xl border border-white/10 bg-white/5",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,.08)]",
        "backdrop-blur-md p-4 md:p-5",
        "transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-0.5",
        className
      )}
    >
      {rail && (
        <div
          aria-hidden
          className={clsx(
            "absolute left-0 top-3 bottom-3 w-[6px] rounded-full",
            customColor ? "" : `bg-gradient-to-b ${cfg.grad}`
          )}
          style={{
            background: customColor ? customColor : undefined,
            boxShadow: customColor ? `0 0 24px ${customColor}` : cfg.glow,
          }}
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,.06), inset 0 12px 32px rgba(255,255,255,.05)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
