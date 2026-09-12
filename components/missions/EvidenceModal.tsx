"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { DbMission } from "@/lib/missions/types";
import { soundscape } from "@/lib/audio/soundscape";
import { VerificationBadge } from "./VerificationBadge";

interface EvidenceModalProps {
  mission: DbMission | null;
  isOpen: boolean;
  onClose: () => void;
  onEvidenceSubmitted: (mission: DbMission) => void;
  onProceedToComplete?: (mission: DbMission) => void;
}

export function EvidenceModal({
  mission,
  isOpen,
  onClose,
  onEvidenceSubmitted,
  onProceedToComplete,
}: EvidenceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset when opened/closed
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setPreviewUrl(null);
      setDescription("");
      setError(null);
      setSubmissionSuccess(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !mission) return null;

  const handleFileChange = (selectedFile: File | null) => {
    setError(null);
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    // Client-side file checks
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file format. Please choose a JPEG, PNG, or WEBP photo.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB limit. Please choose a smaller photo.");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !description.trim()) {
      setError("Please either attach an image or enter a short observation note.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      if (description.trim()) {
        formData.append("description", description.trim());
      }

      const res = await fetch(`/api/missions/${mission.id}/evidence`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Evidence rejected by verification buffer.");
        soundscape.playGlitch();
        return;
      }

      soundscape.playRestoration();
      setSubmissionSuccess(true);
      onEvidenceSubmitted(mission);
    } catch (err) {
      console.error("[Evidence Submission Error]:", err);
      setError("Communication failed. The Other Side resisted the evidence transmission.");
      soundscape.playGlitch();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isSubmitting ? onClose : undefined}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-slate-950 border border-emerald-500/50 rounded-xs shadow-[0_0_30px_rgba(16,185,129,0.2)] p-6 z-10 space-y-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evidence-modal-title"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <VerificationBadge type="EVIDENCE" size="sm" />
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                  PROOF OF WORK
                </span>
              </div>
              <h3
                id="evidence-modal-title"
                className="text-lg font-orbitron font-bold text-slate-100 uppercase tracking-wide"
              >
                SUBMIT PROOF
              </h3>
              <p className="text-xs font-mono text-slate-400 truncate max-w-sm">
                Mission: <span className="text-slate-200">{mission.title}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!submissionSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
                  Photo Proof (Optional, JPEG, PNG, WEBP up to 5MB)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-900/40 rounded-xs p-4 text-center cursor-pointer transition-colors group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />

                  {previewUrl ? (
                    <div className="space-y-2">
                      <img
                        src={previewUrl}
                        alt="Evidence preview"
                        className="max-h-40 mx-auto rounded-xs border border-emerald-500/40 object-contain"
                      />
                      <p className="text-xs font-mono text-emerald-300 truncate">
                        {file?.name} ({(file!.size / 1024).toFixed(1)} KB)
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        Click to change photo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <div className="flex justify-center gap-3 text-slate-400 group-hover:text-emerald-400 transition-colors">
                        <Upload className="w-6 h-6" />
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-mono text-slate-300">
                        Upload a photo or take a picture
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        Camera capture supported on mobile devices
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Observation Note */}
              <div>
                <label
                  htmlFor="evidence-description"
                  className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1"
                >
                  Written Note (Optional)
                </label>
                <textarea
                  id="evidence-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any notes about what you completed..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xs p-2.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  maxLength={1000}
                />
              </div>

              {/* Error Banner */}
              {error && (
                <div
                  className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xs flex items-center gap-2 text-xs font-mono"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-xs bg-slate-900 border border-slate-700 text-xs font-mono uppercase text-slate-300 hover:text-slate-100 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xs bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-black font-extrabold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>UPLOADING...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>SUBMIT PROOF</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Post-Submission Confirmation State */
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-orbitron font-bold text-emerald-300 uppercase tracking-wide">
                  PROOF SUBMITTED
                </h4>
                <p className="text-xs font-mono text-slate-300">
                  Your proof of work has been recorded.
                </p>
              </div>

              {/* Signal Integrity Gauge */}
              <div className="p-3 bg-slate-900/80 border border-emerald-600/40 rounded-xs space-y-1.5 max-w-sm mx-auto">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400 uppercase">PROOF INTEGRITY</span>
                  <span className="text-emerald-400 font-bold">100%</span>
                </div>
                <div className="text-sm font-mono text-emerald-400 tracking-widest" aria-hidden="true">
                  ██████████
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  Proof saved. You can now complete your mission.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xs bg-slate-900 border border-slate-700 text-xs font-mono uppercase text-slate-300 hover:text-slate-100"
                >
                  CLOSE
                </button>
                {onProceedToComplete && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onProceedToComplete(mission);
                    }}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xs bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-black font-extrabold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-black" />
                    <span>COMPLETE MISSION</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
