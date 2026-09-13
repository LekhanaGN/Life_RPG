"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorldBackground } from "@/components/world/WorldBackground";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { loginAction } from "@/lib/auth/actions";
import { soundscape } from "@/lib/audio/soundscape";
import { ShieldCheck, ArrowLeft, Radio, AlertCircle, Loader2, Mail, Lock, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your registered email address or callsign/username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    soundscape.playHover();

    try {
      const res = await loginAction({
        email: email.trim(),
        password,
      });

      if (!res.success) {
        soundscape.playGlitch();
        setError(res.error || "Invalid credentials.");
        setLoading(false);
      } else {
        soundscape.playRestoration();
        router.push(res.redirectUrl || "/right-side");
      }
    } catch (err) {
      soundscape.playGlitch();
      setError("Failed to establish portal handshake. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      {/* Dynamic Cyber / Forest Ambience */}
      <WorldBackground mode="landing" />

      {/* Main Authentication Terminal */}
      <div className="relative z-20 w-full max-w-md">
        <Card variant="cyan" glow className="border-cyan-500/50 bg-black/85 shadow-[0_0_35px_rgba(6,182,212,0.25)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xs bg-cyan-950/60 border border-cyan-500 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-white text-xl tracking-widest font-cinzel neon-glow-cyan">
                  LOG IN
                </CardTitle>
                <CardDescription className="text-cyan-300/80 font-mono text-[11px] tracking-widest">
                  ENTER THE OTHER SIDE
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Status Broadcast */}
            <div className="flex items-center gap-2 px-3 py-2 bg-cyan-950/40 border border-cyan-900/50 rounded-xs text-[11px] font-mono text-cyan-300">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
              <span>Enter your email or callsign and password to continue.</span>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="p-3 bg-red-950/80 border border-red-600 rounded-xs flex items-start gap-2.5 text-xs font-mono text-red-200 animate-shake"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Username */}
              <div className="space-y-1">
                <label
                  htmlFor="login-email"
                  className="block text-[11px] font-mono uppercase tracking-wider text-slate-300"
                >
                  EMAIL ADDRESS OR USERNAME
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
                    name="identifier"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="you@example.com or callsign"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xs text-sm font-mono text-slate-100 placeholder:text-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-mono uppercase tracking-wider text-slate-300"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xs text-sm font-mono text-slate-100 placeholder:text-slate-600 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <Button
                  id="login-submit-btn"
                  type="submit"
                  variant="portal-cyan"
                  size="lg"
                  glow
                  disabled={loading}
                  className="w-full tracking-widest font-extrabold uppercase border-cyan-500 text-cyan-100 hover:text-black hover:bg-cyan-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-cyan-200" />
                      LOGGING IN...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      LOG IN
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Links */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2.5 text-center text-xs font-mono">
              <div className="p-2.5 rounded-xs bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Don&apos;t have an account?</span>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider underline underline-offset-4"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Sign Up
                </Link>
              </div>

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
