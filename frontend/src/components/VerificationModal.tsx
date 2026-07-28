"use client";

import { UserSession } from "@/lib/auth";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Shield,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession | null;
  onVerifiedSuccess?: (updatedUser?: UserSession) => void;
}

export default function VerificationModal({
  isOpen,
  onClose,
  user,
}: VerificationModalProps) {
  const isVerified = user?.isVerified;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Verification System</span>
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-white">Account Verification</h2>
          <p className="text-xs text-slate-400 mt-1">
            NSS DirectStay enables System Administrators to directly verify users (both Tenants and Landlords) from the Admin Dashboard.
          </p>
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-2xl border space-y-3 ${
          isVerified
            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
            : "bg-slate-900 border-slate-800 text-slate-300"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-bold text-sm">
              <UserCheck className={`w-5 h-5 ${isVerified ? "text-emerald-400" : "text-slate-400"}`} />
              <span>{user?.fullName || "User Account"}</span>
            </div>
            <Badge variant={isVerified ? "default" : "secondary"}>
              {isVerified ? "Admin Verified" : "Pending Verification"}
            </Badge>
          </div>

          <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
            <p><strong className="text-slate-200">Email:</strong> {user?.email || "N/A"}</p>
            <p><strong className="text-slate-200">Role:</strong> {user?.role || "TENANT"}</p>
            <p>
              <strong className="text-slate-200">Verification Status:</strong>{" "}
              {isVerified ? (
                <span className="text-emerald-400 font-bold">Verified by System Administrator</span>
              ) : (
                <span className="text-amber-400 font-bold">Pending Admin Approval</span>
              )}
            </p>
          </div>
        </div>

        {user?.role === "ADMIN" ? (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <p className="text-xs text-slate-300">
              As a System Administrator, you can verify or unverify any user directly from the Admin Dashboard.
            </p>
            <Link
              href="/admin"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-500 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>Go to Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-200">How User Verification Works:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>Admins inspect user accounts (Tenants and Landlords) and click <strong className="text-emerald-400">Verify</strong>.</li>
              <li>Verification requires direct Admin account verification.</li>
              <li>Landlords pay GH₵ 30.00 via Paystack when posting a room listing (active for 90 days).</li>
            </ul>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
