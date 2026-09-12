"use client";

import React from "react";
import { CheckCircle2, FileText, Crosshair } from "lucide-react";
import { VerificationType, VERIFICATION_CONFIG } from "@/lib/game/verification";

interface VerificationBadgeProps {
  type?: VerificationType | string;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

export function VerificationBadge({
  type = "SELF_REPORT",
  size = "sm",
  showDescription = false,
}: VerificationBadgeProps) {
  const safeType = (type as VerificationType) || "SELF_REPORT";
  const config = VERIFICATION_CONFIG[safeType] || VERIFICATION_CONFIG.SELF_REPORT;

  const renderIcon = () => {
    switch (safeType) {
      case "SELF_REPORT":
        return <CheckCircle2 className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />;
      case "EVIDENCE":
        return <FileText className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />;
      case "FOCUS_SESSION":
        return <Crosshair className={size === "sm" ? "w-3 h-3 text-amber-400" : "w-4 h-4 text-amber-400"} />;
      default:
        return <CheckCircle2 className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />;
    }
  };

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1"
      : size === "md"
      ? "px-2.5 py-1 text-xs gap-1.5"
      : "px-3 py-1.5 text-sm gap-2";

  return (
    <div className="inline-flex flex-col gap-0.5">
      <span
        className={`inline-flex items-center font-mono uppercase tracking-widest font-semibold rounded-xs border transition-all ${config.badgeBg} ${config.badgeBorder} ${config.badgeText} ${config.glowClass} ${sizeClasses}`}
        title={config.description}
        aria-label={`Verification Method: ${config.name} (${config.ratingStars})`}
      >
        {renderIcon()}
        <span>{config.name}</span>
        <span className="text-amber-400 font-bold ml-0.5" aria-hidden="true">
          {config.ratingStars}
        </span>
      </span>
      {showDescription && (
        <span className="text-[10px] font-mono text-slate-400 leading-tight">
          {config.description}
        </span>
      )}
    </div>
  );
}
