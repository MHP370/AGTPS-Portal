"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  className,
}: DialogProps) {
  const reduceMotion = useReducedMotion();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl",
                  className,
                )}
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: 18, scale: 0.97, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, y: 10, scale: 0.98, filter: "blur(6px)" }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
                }
              >
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
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
