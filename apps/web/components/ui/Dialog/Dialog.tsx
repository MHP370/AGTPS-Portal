"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
}: DialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />

        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <DialogPrimitive.Title className="text-xl font-semibold">
              {title}
            </DialogPrimitive.Title>

            <DialogPrimitive.Close asChild>
              <button className="rounded-lg p-2 hover:bg-slate-800">
                <X size={18} />
              </button>
            </DialogPrimitive.Close>
          </div>

          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
