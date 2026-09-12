"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorldBackground } from "@/components/world/WorldBackground";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { signupAction } from "@/lib/auth/actions";
import { soundscape } from "@/lib/audio/soundscape";
import { Sparkles, ArrowLeft, Radio, AlertCircle, Loader2, User, Mail, Lock, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client validation
    if (!username.trim()) {
      setError("Please enter your survivor callsign / username.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid transmission frequency / email.");
      return;
    }
    if (password.length < 6) {
      setError("Passcode must contain at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passcode confirmation does not match.");
      return;
    }

    setLoading(true);
    soundscape.playHover();

    try {
      const res = await signupAction({
        username,
        email,
        password,
        confirmPassword,
      });

      if (!res.success) {
        soundscape.playGlitch();
        setError(res.error || "Registration rejected by dimensional gateway.");
        setLoading(false);
      } else {
        soundscape.playInversion();
        router.push(res.redirectUrl || "/onboarding");
      }
    } catch (err) {
      soundscape.playGlitch();
      setError("Failed to establish frequency link. Check your connection.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      {/* 80s Supernatural Liminal Woods Ambiance */}
      <WorldBackground mode="landing" />

      {/* Main Registration Terminal */}
      <div className="relative z-20 w-full max-w-md">
        <Card variant="default" glow className="border-red-900/60 bg-black/80 shadow-[0_0_35px_rgba(239,68,68,0.25)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xs bg-red-950/60 border border-red-700 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-white text-xl tracking-widest font-cinzel neon-glow-red">
                  CREATE ACCOUNT
                </CardTitle>
                <CardDescription className="text-red-300/80 font-mono text-[11px] tracking-widest">
                  START YOUR JOURNEY IN THE OTHER SIDE
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Supernatural Alert Banner */}
            <div className="flex items-center gap-2 px-3 py-2 bg-red-950/40 border border-red-900/50 rounded-xs text-[11px] font-mono text-red-300">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
              <span>Create your player account to begin.</span>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="p-3 bg-red-950/80 border border-red-600 rounded-xs flex items-start gap-2.5 text-xs font-mono text-red-200 animate-shake"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Username / Callsign */}
              <div className="space-y-1">
                <label
                  htmlFor="signup-username"
                  className="block text-[11px] font-mono uppercase tracking-wider text-slate-300"
                >
                  USERNAME
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="e.g. ARIA-7"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/90 border border-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xs text-sm font-mono text-slate-100 placeholder:text-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email / Transmission Frequency */}
              <div className="space-y-1">
                <label
                  htmlFor="signup-email"
                  className="block text-[11px] font-mono uppercase tracking-wider text-slate-300"
                >
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/90 border border-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xs text-sm font-mono text-slate-100 placeholder:text-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password / Clearance Code */}
              <div className="space-y-1">
                <label
                  htmlFor="signup-password"
                  className="block text-[11px] font-mono uppercase tracking-wider text-slate-300"
                >
                  PASSWORD (MIN. 6 CHARACTERS)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/90 border border-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xs text-sm font-mono text-slate-100 placeholder:text-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-[11px] font-mono uppercase tracking-wider text-slate-300"
                >
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/90 border border-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xs text-sm font-mono text-slate-100 placeholder:text-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  id="signup-submit-btn"
                  type="submit"
                  variant="portal-red"
                  size="lg"
                  glow
                  disabled={loading}
                  className="w-full tracking-widest font-extrabold uppercase"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-red-200" />
                      CREATING ACCOUNT...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      SIGN UP
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Links & Alternate Navigation */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2 text-center text-xs font-mono">
              <p className="text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4"
                >
                  LOG IN HERE
                </Link>
              </p>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-1 text-slate-400 hover:text-slate-300 py-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>BACK TO HOME</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
