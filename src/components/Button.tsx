import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary` is violet with ink text — one per view. `secondary` is bordered, `ghost` is text only. */
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-violet text-bg hover:bg-violet-hover",
  secondary: "border border-border bg-surface text-ink hover:border-border-strong hover:bg-surface-raised",
  ghost: "text-ink-muted hover:bg-surface hover:text-ink",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

/**
 * The exact classes `<Button>` renders with, for the rare case where the button element
 * itself comes from outside this file (the SDK's `<LoginButton className>`) and still has
 * to look like every other button in the app instead of drifting from it over time.
 */
export function buttonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string): string {
  return cx(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-card font-medium transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    className,
  );
}

/** The only button. Violet primary, ink text, 8px radius; never white, never a gradient. */
export function Button({ variant = "primary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return <button className={buttonClassName(variant, size, className)} type={type} {...rest} />;
}
