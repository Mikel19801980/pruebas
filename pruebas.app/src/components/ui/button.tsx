import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "orange" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 transition-all select-none cursor-pointer";

    const variants = {
      default: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900 shadow-sm",
      orange: "bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-600 shadow-md shadow-orange-500/20 font-semibold",
      outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100",
      ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
      destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
    };

    const sizes = {
      default: "h-11 px-4 py-2 text-sm",
      sm: "h-9 rounded-lg px-3 text-xs",
      lg: "h-13 rounded-xl px-6 text-base",
      icon: "h-11 w-11",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
