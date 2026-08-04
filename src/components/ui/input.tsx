import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-surface-raised px-3 text-sm text-foreground placeholder:text-foreground-subtle",
        "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
