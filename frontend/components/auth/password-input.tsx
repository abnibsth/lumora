"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          className={cn(
            "min-h-[50px] w-full rounded-xl border bg-surface pl-4 pr-12 text-sm sm:text-base text-ink placeholder:text-muted/60 transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-red-400 bg-red-50/20" : "border-line",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          className="absolute right-1 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:text-forest focus-visible:outline-2 focus-visible:outline-forest disabled:opacity-50"
        >
          {showPassword ? (
            <EyeOff className="size-4.5" aria-hidden="true" />
          ) : (
            <Eye className="size-4.5" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
