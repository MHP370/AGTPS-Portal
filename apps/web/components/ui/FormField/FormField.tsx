import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  required = false,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-slate-200">
        {label}

        {required && (
          <span className="mr-1 text-red-500">*</span>
        )}
      </label>

      {children}

      {error ? (
        <p className="text-sm text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
