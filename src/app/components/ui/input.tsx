import * as React from "react";
import { twMerge } from "tailwind-merge";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={twMerge(
          "flex h-9 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-cyan-300",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
