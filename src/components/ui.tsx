import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const buttonSizes: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-teal-500 to-teal-600 text-white shadow-sm shadow-teal-600/25 hover:shadow-teal-600/35 hover:from-teal-400 hover:to-teal-500",
  secondary:
    "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300",
  ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
  danger: "bg-white border border-red-200 text-red-600 hover:bg-red-50",
};

/** Shared button look, reusable on <Link> and other non-<button> elements. */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(
    "inline-flex items-center justify-center gap-1.5 font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none",
    buttonSizes[size],
    buttonVariants[variant]
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={cn(buttonClasses(variant, size), className)} {...props} />;
}

/** Shared card look, reusable on <Link> and other non-<div> elements. */
export function cardClasses(interactive = false) {
  return cn(
    "bg-white border border-gray-200/80 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
    interactive &&
      "transition-all duration-150 hover:border-teal-200 hover:shadow-[0_8px_24px_-4px_rgba(13,148,136,0.12)]"
  );
}

export function Card({
  className,
  interactive,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={cn(cardClasses(interactive), className)} {...props} />;
}

const fieldBase =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, "cursor-pointer", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, className)} {...props} />;
}

export function Label({
  className,
  size = "md",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { size?: "sm" | "md" }) {
  return (
    <label
      className={cn(
        "block font-medium text-gray-700",
        size === "sm" ? "text-xs mb-1" : "text-sm mb-1.5",
        className
      )}
      {...props}
    />
  );
}
