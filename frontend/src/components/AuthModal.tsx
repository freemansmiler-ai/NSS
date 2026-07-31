"use client";

import { useState, useEffect } from "react";
import { UserSession } from "@/lib/auth";
import { Dialog } from "@/components/ui/dialog";
import { User, Lock, Mail, Phone, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";

import { clearFavoriteIds } from "@/lib/favorites";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserSession) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [role, setRole] = useState<"TENANT" | "LANDLORD">("TENANT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [registeredUser, setRegisteredUser] = useState<UserSession | null>(null);
  const [resendStatus, setResendStatus] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  // Real-time cross-device verification status sync (e.g., registered on computer, verified on phone)
  useEffect(() => {
    if (!registeredUser || registeredUser.isEmailVerified) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/check-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: registeredUser.email }),
        });
        const data = await res.json();
        if (res.ok && data.verified && data.user) {
          if (data.token) {
            try {
              localStorage.setItem("nss_token", data.token);
            } catch {}
          }
          onSuccess(data.user);
          setRegisteredUser(null);
          setResendStatus("");
          setResendError("");
          setError("");
          onClose();
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [registeredUser, onSuccess, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = tab === "LOGIN" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      tab === "LOGIN"
        ? { email, password }
        : { email, password, fullName, phoneNumber, role };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        throw new Error(
          res.ok
            ? "Server returned an invalid response."
            : `Server Error (${res.status}): ${rawText || "Please make sure the backend server is running."}`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      if (data.token) {
        try {
          localStorage.setItem("nss_token", data.token);
        } catch {}
      }

      if (tab === "REGISTER" && data.user) {
        clearFavoriteIds();
        setRegisteredUser(data.user);
        onSuccess(data.user);
      } else {
        onSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredUser?.email || resendLoading) return;
    setResendLoading(true);
    setResendStatus("");
    setResendError("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredUser.email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend verification email.");
      }

      setResendStatus(data.message || "A new verification email has been sent!");
    } catch (err: any) {
      setResendError(err.message || "Failed to resend verification link.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleModalClose = () => {
    setRegisteredUser(null);
    setResendStatus("");
    setResendError("");
    setError("");
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleModalClose} maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Post-Registration Success Notice */}
        {registeredUser ? (
          <div className="py-4 space-y-4 text-center">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Account Created!</h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                We&apos;ve sent a verification email to <strong className="text-emerald-400">{registeredUser.email}</strong>.
                Please check your email inbox to verify your account and activate all features.
              </p>
            </div>

            {resendStatus && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-semibold">
                {resendStatus}
              </div>
            )}

            {resendError && (
              <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {resendError}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? "animate-spin" : ""}`} />
                <span>{resendLoading ? "Requesting..." : "Resend Verification Email"}</span>
              </button>

              <button
                type="button"
                onClick={handleModalClose}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md"
              >
                Continue using DirectStay
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setTab("LOGIN")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  tab === "LOGIN"
                    ? "bg-slate-800 text-emerald-400 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab("REGISTER")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  tab === "REGISTER"
                    ? "bg-slate-800 text-emerald-400 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                {tab === "LOGIN" ? "Welcome back to NSS DirectStay" : "Join NSS DirectStay Ghana"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {tab === "LOGIN"
                  ? "Access direct landlord phone lines and GhanaPostGPS addresses"
                  : "Register as a National Service Personnel or Landlord"}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {tab === "REGISTER" && (
                <>
                  {/* Role Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      I am a:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole("TENANT")}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                          role === "TENANT"
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        NSP / Renter
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("LANDLORD")}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                          role === "LANDLORD"
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        Landlord / Owner
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kwame Mensah"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Primary Phone / WhatsApp Line
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0241234567 or +233240000000"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-500 transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <span>{loading ? "Processing..." : tab === "LOGIN" ? "Sign In" : "Register Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </Dialog>
  );
}
