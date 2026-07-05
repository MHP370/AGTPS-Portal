"use client";

import { Upload } from "lucide-react";
import { useId, useState } from "react";

import { useUploadImage } from "@/hooks/useUploadFile";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface FileUploadFieldProps {
  value: string;
  folder: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function FileUploadField({
  value,
  folder,
  disabled = false,
  placeholder,
  onChange,
}: FileUploadFieldProps) {
  const inputId = useId();
  const uploadImage = useUploadImage();
  const [error, setError] = useState("");

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");

    try {
      const result = await uploadImage.mutateAsync({
        folder,
        file,
      });

      onChange(result.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "آپلود فایل انجام نشد.",
      );
    }
  }

  const isDisabled = disabled || uploadImage.isPending;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isDisabled}
          placeholder={placeholder}
          dir="ltr"
        />

        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isDisabled}
          onChange={handleFileChange}
        />

        <Button
          type="button"
          variant="secondary"
          disabled={isDisabled}
          onClick={() => {
            document.getElementById(inputId)?.click();
          }}
          className="shrink-0 gap-2"
        >
          <Upload size={18} />
          {uploadImage.isPending ? "آپلود..." : "انتخاب فایل"}
        </Button>
      </div>

      {error && (
        <p className="text-xs leading-5 text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
