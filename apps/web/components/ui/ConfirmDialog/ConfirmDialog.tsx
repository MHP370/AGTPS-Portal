"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description?: string;

  confirmText?: string;
  cancelText?: string;

  loading?: boolean;

  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,

  confirmText = "تایید",
  cancelText = "انصراف",

  loading = false,

  onConfirm,
}: Props) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />

        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {title}
            </h2>

            <DialogPrimitive.Close asChild>
              <button className="rounded-lg p-2 hover:bg-slate-800">
                <X size={18} />
              </button>
            </DialogPrimitive.Close>
          </div>

          {description && (
            <p className="mb-6 text-sm text-slate-400">
              {description}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelText}
            </Button>

            <Button
              variant="danger"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "در حال انجام..." : confirmText}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
