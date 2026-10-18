"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

/** `side="right"` renders the same dialog as a full-height sheet. */
function DialogContent({
  className,
  children,
  side = "center",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: "center" | "right" | "bottom" }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="animate-fade fixed inset-0 z-[70] bg-night/45 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-[71] flex flex-col bg-white text-night shadow-pop outline-none",
          side === "center" &&
            "animate-in left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl",
          side === "right" && "animate-sheet inset-y-0 right-0 w-[min(28rem,92vw)]",
          side === "bottom" && "animate-sheet-up inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full text-slate-text transition-colors hover:bg-mist hover:text-night">
          <X size={20} aria-hidden />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("border-b border-hairline px-6 pb-5 pr-16 pt-6", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-xl font-bold tracking-tight", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("mt-1 text-sm text-slate-text", className)} {...props} />;
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription };
