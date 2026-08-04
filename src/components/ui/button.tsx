"use client";

import { type ButtonHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand text-black hover:bg-brand-strong",
  secondary:
    "bg-surface-raised text-foreground border border-border hover:border-foreground-subtle",
  ghost: "text-foreground-muted hover:bg-surface-raised hover:text-foreground",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /**
   * Runs on click and shows a spinner + disables the button until it
   * resolves. Use this instead of (or alongside) a plain onClick whenever
   * the action is async — every clickable action in AI Nazar should give
   * visible feedback while in flight, never leave the UI static.
   */
  onClickAsync?: () => Promise<unknown>;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      onClickAsync,
      onClick,
      loading: loadingProp,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const [internalLoading, setInternalLoading] = useState(false);
    const loading = loadingProp ?? internalLoading;

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (event) => {
      onClick?.(event);
      if (!onClickAsync) return;
      setInternalLoading(true);
      try {
        await onClickAsync();
      } finally {
        setInternalLoading(false);
      }
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {loading && <Spinner className={variant === "primary" ? "text-black" : undefined} />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
