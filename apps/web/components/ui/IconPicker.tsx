"use client";

import { ImageIcon } from "lucide-react";

import { FileUploadField } from "@/components/ui/FileUploadField";
import { portalIconMap, portalIconOptions, isUploadedIcon } from "@/lib/icon-options";

interface IconPickerProps {
  value: string;
  folder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function IconPicker({
  value,
  folder,
  disabled = false,
  onChange,
}: IconPickerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
        {portalIconOptions.map((option) => {
          const Icon = portalIconMap[option.value];
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-2 text-xs transition ${
                selected
                  ? "border-cyan-300 bg-cyan-400/15 text-cyan-100"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-300/40"
              }`}
            >
              <Icon size={24} />
              <span className="line-clamp-1">{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
        <div className="mb-3 flex items-center gap-3 text-sm font-bold text-slate-200">
          {isUploadedIcon(value) ? (
            <img
              src={value}
              alt=""
              className="size-10 rounded-xl border border-white/10 object-contain"
            />
          ) : (
            <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-200">
              <ImageIcon size={22} />
            </span>
          )}
          <span>آپلود آیکن اختصاصی</span>
        </div>
        <FileUploadField
          value={isUploadedIcon(value) ? value : ""}
          onChange={onChange}
          folder={folder}
          accept="image/*"
          disabled={disabled}
          placeholder="/uploads/icons/icon.png"
        />
      </div>
    </div>
  );
}
