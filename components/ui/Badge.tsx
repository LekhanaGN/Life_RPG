"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "cyan" | "crimson" | "amber" | "purple" | "slate";
  pulse?: boolean;
}

export function Badge({
  className,
  variant = "slate",
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    cyan: "bg-cyan-950/60 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.25)]",
    crimson: "bg-red-950/60 text-red-300 border-red-600/60 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
    amber: "bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.25)]",
    purple: "bg-purple-950/60 text-purple-300 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.25)]",
    slate: "bg-slate-900/80 text-slate-300 border-slate-700/60",
  };

  const pulseStyles = {
    cyan: "bg-cyan-400 shadow-[0_0_6px_#22d3ee]",
    crimson: "bg-red-500 shadow-[0_0_6px_#ef4444]",
    amber: "bg-amber-400 shadow-[0_0_6px_#f59e0b]",
    purple: "bg-purple-400 shadow-[0_0_6px_#a855f7]",
    slate: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider border rounded-xs",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full animate-ping mr-0.5",
            pulseStyles[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}
