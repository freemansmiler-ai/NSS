"use client";

import { useState } from "react";
import { UserSession } from "@/lib/auth";
import { Sheet } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  PlusCircle,
  User,
  LogOut,
  Menu,
  ShieldCheck,
  Navigation,
  Sparkles,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  user: UserSession | null;
  onOpenAuth: () => void;
  onOpenPostProperty: () => void;
  onOpenCommuteCalc: () => void;
  onOpenVerification: () => void;
  onLogout: () => void;
}

export default function Navbar({
  user,
  onOpenAuth,
  onOpenPostProperty,
  onOpenCommuteCalc,
  onOpenVerification,
  onLogout,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLandlordOrAdmin = user?.role === "LANDLORD" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo & Platform Name */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-emerald-400">
                  NSS DirectStay
                </span>
                <Badge variant="default" className="hidden sm:inline-flex text-[10px] uppercase font-bold py-0.5">
                  Ghana 🇬🇭
                </Badge>
              </div>
              <p className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Zero Agent Fees • Verified Landlords</span>
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isLandlordOrAdmin && (
            <Link
              href="/landlord"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/40 hover:bg-teal-500/25 transition shadow-sm"
            >
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>Landlord Dashboard</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition shadow-sm"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          {user && (
            <button
              onClick={onOpenVerification}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Account Status</span>
            </button>
          )}

          {user && (
            <button
              onClick={onOpenCommuteCalc}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 transition shadow-sm"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>NSP Commute Distance</span>
            </button>
          )}

          <button
            onClick={onOpenPostProperty}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 hover:to-teal-500 transition shadow-lg shadow-emerald-500/25 font-bold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isAdmin ? "Post Room (Free Admin)" : "Post Room (GH₵ 30.00)"}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200">{user.fullName}</span>
                <span className="text-[10px] font-medium text-emerald-400 uppercase">{user.role}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-lg shadow-emerald-500/25"
            >
              <User className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <button
              onClick={onOpenCommuteCalc}
              className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              title="NSP Commute Distance"
            >
              <Navigation className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Sheet */}
      <Sheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="NSS DirectStay Navigation"
        side="right"
      >
        <div className="flex flex-col gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              <span>NSS Direct Stay Ghana</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Direct room listings with exact GhanaPostGPS & direct Landlord WhatsApp numbers. No House Agent Fees!
            </p>
          </div>

          {isLandlordOrAdmin && (
            <Link
              href="/landlord"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-300 font-bold text-sm"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-teal-400" />
                <span>Landlord Dashboard</span>
              </div>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-sm"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Admin Dashboard</span>
              </div>
            </Link>
          )}

          {user && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenVerification();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-100 font-semibold text-sm hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <span>Account Verification Status</span>
              </div>
            </button>
          )}

          {user && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenCommuteCalc();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-100 font-semibold text-sm hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Navigation className="w-5 h-5 text-emerald-400" />
                <span>NSP Commute Distance Calculator</span>
              </div>
            </button>
          )}

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenPostProperty();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm"
          >
            <div className="flex items-center gap-3">
              <PlusCircle className="w-5 h-5" />
              <span>{isAdmin ? "Post Room (Free Admin)" : "Post Room (GH₵ 30.00)"}</span>
            </div>
          </button>

          {user ? (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="font-bold text-sm text-white">{user.fullName}</p>
                <p className="text-xs text-emerald-400 uppercase font-semibold">{user.role}</p>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAuth();
              }}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm mt-2"
            >
              <User className="w-4 h-4" />
              <span>Sign In / Create Account</span>
            </button>
          )}
        </div>
      </Sheet>
    </header>
  );
}
