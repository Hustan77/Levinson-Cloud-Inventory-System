import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { twMerge } from "tailwind-merge";

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={twMerge("text-sm text-white/80", className)}
    {...props}
  />
));
Label.displayName = "Label";
