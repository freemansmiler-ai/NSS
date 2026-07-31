"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Clock, Mail, ArrowRight, Loader2, Home } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"LOADING" | "SUCCESS" | "EXPIRED" | "INVALID" | "ALREADY_VERIFIED">("LOADING");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const [verifiedUser, setVerifiedUser] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setStatus("INVALID");
      setMessage("No verification token was provided in the URL link.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          if (data.token) {
            try { localStorage.setItem("nss_token", data.token); } catch {}
          }
          if (data.user) {
            setVerifiedUser(data.user);
          }
          if (data.status === "ALREADY_VERIFIED") {
            setStatus("ALREADY_VERIFIED");
          } else {
            setStatus("SUCCESS");
          }
          setMessage(data.message || "Your email address has been verified successfully.");
        } else {
          if (data.status === "EXPIRED") {
            setStatus("EXPIRED");
          } else {
            setStatus("INVALID");
          }
          setMessage(data.error || "The verification link is invalid or expired.");
        }
      } catch (err: any) {
        setStatus("INVALID");
        setMessage(err?.message || "An unexpected network error occurred while verifying.");
      }
    }

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail || resendLoading) return;

    setResendLoading(true);
    setResendMessage("");
    setResendError("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to request a new verification email.");
      }

      setResendMessage(data.message || "A new verification email has been sent to your inbox.");
    } catch (err: any) {
      setResendError(err.message || "Unable to resend verification email. Please try again later.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
        {/* LOGO */}
        <div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            NSS DirectStay Ghana
          </span>
        </div>

        {/* LOADING STATE */}
        {status === "LOADING" && (
          <div className="py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white">Verifying your email...</h2>
            <p className="text-xs text-slate-400">Please wait while we confirm your verification token.</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "SUCCESS" && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Your email has been verified successfully.</h2>
            <p className="text-xs text-emerald-400 font-semibold leading-relaxed">
              {verifiedUser ? `Welcome, ${verifiedUser.fullName}! You are now automatically logged in.` : message}
            </p>
            <p className="text-xs text-slate-400">Your account is fully active. You can now browse listings, contact landlords directly, and view GhanaPostGPS addresses.</p>

            <Link
              href="/"
              className="mt-4 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-500 transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Continue using NSS DirectStay</span>
            </Link>
          </div>
        )}

        {/* ALREADY VERIFIED STATE */}
        {status === "ALREADY_VERIFIED" && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto border border-teal-500/30 shadow-lg shadow-teal-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Email Already Verified</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{message}</p>

            <Link
              href="/"
              className="mt-4 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-500 transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Return to Application</span>
            </Link>
          </div>
        )}

        {/* EXPIRED TOKEN STATE */}
        {status === "EXPIRED" && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Clock className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Verification Link Expired</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{message}</p>

            <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enter your email address to receive another verification email:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {resendMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  {resendMessage}
                </div>
              )}

              {resendError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  {resendError}
                </div>
              )}

              <button
                type="submit"
                disabled={resendLoading}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 text-emerald-400 font-bold text-xs hover:bg-slate-700 transition border border-slate-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{resendLoading ? "Requesting..." : "Resend Verification Email"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* INVALID TOKEN STATE */}
        {status === "INVALID" && (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/30 shadow-lg shadow-rose-500/10">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Verification Link Invalid</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{message}</p>

            <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enter your email to request a new verification email:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {resendMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  {resendMessage}
                </div>
              )}

              {resendError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  {resendError}
                </div>
              )}

              <button
                type="submit"
                disabled={resendLoading}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 text-emerald-400 font-bold text-xs hover:bg-slate-700 transition border border-slate-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{resendLoading ? "Requesting..." : "Request Verification Email"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading verification page...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
