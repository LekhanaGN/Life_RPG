"use client";

// @boundary between #client and #auth-service (#auth-boundary) -- "Future registration gate"
// @audit App.Auth.Signup -- "Phase 1 placeholder stub — user registration flow slated for Phase 2"
// @owns auth-team for App.Auth.Signup -- "Team responsible for registration"

import React from "react";
import Link from "next/link";
import { WorldBackground } from "@/components/world/WorldBackground";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      <WorldBackground mode="landing" />

      <div className="relative z-20 w-full max-w-md">
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xs bg-slate-900 border border-slate-700 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-white text-lg font-cinzel">
                  ENLIST SURVIVOR
                </CardTitle>
                <CardDescription>PHASE 2 REGISTRATION PROTOCOL</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xs text-xs font-mono text-slate-300 leading-relaxed">
              [SYSTEM NOTICE]: Registration and survivor profile creation will be activated when the PostgreSQL database layer is integrated.
            </div>

            <div className="pt-2">
              <Link href="/">
                <Button variant="portal-cyan" size="md" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  RETURN TO GATEWAY
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
