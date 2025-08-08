import React from "react";

/** HoloPanel — base glass slab with neon rail */
export function HoloPanel({
  children,
  rail = true,
  className = ""
}: {
  children: React.ReactNode;
  rail?: boolean;
  className?: string;
}) {
  return (
    <section className={`relative holo-glass hover-lift ${rail ? "neon-rail pl-4" : ""} ${className}`}>
      <div className="p-4">{children}</div>
    </section>
  );
}
