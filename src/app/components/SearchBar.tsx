import React from "react";
import { Input } from "./ui/input";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search..."
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="w-full">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
