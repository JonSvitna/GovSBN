"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings/reset-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">GovSBN</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Reset link sent</h1>
            <p className="text-sm text-slate-500 mt-2">
              Check your email at <strong>{email}</strong> for a password reset link.
            </p>
            <Link href="/auth/login" className="btn-secondary inline-flex mt-6 gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <Link href="/auth/login" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Forgot password?</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Enter your email and we&apos;ll send a reset link.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@agency.gov"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
