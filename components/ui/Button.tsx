"use client";

import React from "react";
import { soundscape } from "@/lib/audio/soundscape";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "portal-red" | "portal-cyan" | "corrupted" | "arcade" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
  playAudio?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "arcade",
      size = "md",
      glow = true,
      playAudio = true,
      children,
      onMouseEnter,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (playAudio) soundscape.playHover();
      onMouseEnter?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (playAudio) soundscape.playGlitch();
      onClick?.(e);
    };

    const baseStyles =
      "relative inline-flex items-center justify-center font-orbitron uppercase tracking-widest transition-all duration-300 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

    const sizeStyles = {
      sm: "px-4 py-1.5 text-xs rounded-sm",
      md: "px-6 py-2.5 text-sm rounded-sm",
      lg: "px-8 py-3.5 text-base font-bold rounded-sm tracking-[0.2em]",
      xl: "px-10 py-4.5 text-lg font-black rounded-sm tracking-[0.25em]",
    };

    const variantStyles = {
      "portal-red": cn(
        "text-white bg-red-950/40 border-2 border-red-600/90 hover:bg-red-600 hover:text-black hover:border-red-400 focus-visible:ring-red-500",
        glow && "shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_35px_rgba(239,68,68,0.9),inset_0_0_15px_rgba(255,255,255,0.4)]"
      ),
      "portal-cyan": cn(
        "text-cyan-200 bg-cyan-950/40 border-2 border-cyan-500/90 hover:bg-cyan-400 hover:text-black hover:border-cyan-200 focus-visible:ring-cyan-400",
        glow && "shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.85),inset_0_0_15px_rgba(255,255,255,0.4)]"
      ),
      corrupted: cn(
        "text-red-300 bg-black/80 border-2 border-red-800 hover:border-red-500 hover:bg-red-950/80 hover:text-red-100 focus-visible:ring-red-600",
        glow && "shadow-[0_0_20px_rgba(153,27,27,0.5)] hover:shadow-[0_0_30px_rgba(220,38,38,0.8)]"
      ),
      arcade: cn(
        "text-slate-200 bg-slate-900/80 border border-slate-700 hover:border-slate-400 hover:bg-slate-800 hover:text-white focus-visible:ring-slate-400",
        glow && "hover:shadow-[0_0_15px_rgba(148,163,184,0.3)]"
      ),
      ghost:
        "text-slate-400 bg-transparent border border-transparent hover:border-slate-700 hover:text-slate-200 focus-visible:ring-slate-500",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        {...props}
      >
        {/* Retro scanline sheen effect */}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        
        {/* Corner decorative notch markings */}
        <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-current opacity-70 pointer-events-none" />
        <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-current opacity-70 pointer-events-none" />
        <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-current opacity-70 pointer-events-none" />
        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-current opacity-70 pointer-events-none" />
      </button>
    );
  }
);

Button.displayName = "Button";
