"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "cyan" | "crimson" | "corrupted";
  glow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", glow = false, children, ...props }, ref) => {
    const variantStyles = {
      default:
        "bg-slate-950/70 border border-slate-800/80 text-slate-100",
      cyan: cn(
        "bg-slate-950/80 border border-cyan-500/40 text-slate-100",
        glow && "shadow-[0_0_25px_rgba(6,182,212,0.15)]"
      ),
      crimson: cn(
        "bg-black/85 border border-red-800/60 text-slate-100",
        glow && "shadow-[0_0_30px_rgba(220,38,38,0.25)]"
      ),
      corrupted: cn(
        "bg-gradient-to-b from-purple-950/30 to-black/95 border border-red-600/50 text-red-100",
        glow && "shadow-[0_0_35px_rgba(185,28,28,0.35)]"
      ),
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative backdrop-blur-md p-6 rounded-sm transition-all duration-300",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {/* Retro HUD Corner Brackets */}
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-current opacity-60" />
        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-current opacity-60" />
        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-current opacity-60" />
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-current opacity-60" />

        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 pb-4 border-b border-white/10", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-orbitron font-bold tracking-wider uppercase text-base", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs font-mono uppercase tracking-widest text-slate-400", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-4", className)} {...props} />;
}
