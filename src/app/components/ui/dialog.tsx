import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { twMerge } from "tailwind-merge";
import { X } from "lucide-react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay(props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      {...props}
      className={twMerge(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out",
        props.className
      )}
    />
  );
}

export function DialogContent({ className, children, ...props }:
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        {...props}
        className={twMerge(
          "fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 holo-glass p-6 shadow-glass",
          className
        )}
      >
        {children}
        <DialogClose className="absolute right-4 top-4 text-white/70 hover:text-white">
          <X className="h-5 w-5" />
        </DialogClose>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ children }: { children?: React.ReactNode }) {
  return <div className="mb-4 space-y-1">{children}</div>;
}
export function DialogTitle({ children }: { children?: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}
export function DialogDescription({ children }: { children?: React.ReactNode }) {
  return <p className="text-sm text-white/70">{children}</p>;
}
