"use client";

import { useState, useEffect } from "react";
import { UserSession } from "@/lib/auth";
import { PropertyData } from "@/lib/sample-data";
import { Badge } from "@/components/ui/badge";
import LandlordPostModal from "@/components/LandlordPostModal";
import Landlord30DayChart from "@/components/Landlord30DayChart";
import ContactSupportModal from "@/components/ContactSupportModal";
import Navbar from "@/components/Navbar";
import { openPaystackPopup } from "@/lib/paystack";
import {
  Building2,
  Eye,
  Clock,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  MapPin,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  X,
  Search,
  SlidersHorizontal,
  Lock,
  Phone,
  MessageSquare,
  Trash2,
  Headphones
} from "lucide-react";
import Link from "next/link";

export default function LandlordDashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isPostRoomOpen, setIsPostRoomOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Check auth session
  useEffect(() => {
    let hasLocalUser = false;
    try {
      const savedUser = localStorage.getItem("nss_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
        hasLocalUser = true;
      }
    } catch {}

    const token = typeof window !== "undefined" ? localStorage.getItem("nss_token") : null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch("/api/auth/me", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        } else if (!hasLocalUser) {
          setCurrentUser(null);
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // Fetch properties owned ONLY by this landlord
  const loadLandlordProperties = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      // Enforce landlord privacy: query properties belonging strictly to this landlord
      queryParams.set("landlordId", currentUser.userId || "");
      queryParams.set("includeInactive", "true"); // include delisted grace-period properties so landlord can renew

      const res = await fetch(`/api/properties?${queryParams.toString()}`);
      const data = await res.json();
      if (data.properties && Array.isArray(data.properties)) {
        // Filter strictly in case landlordId was matched by email/id
        const myProps = data.properties.filter(
          (p: PropertyData) =>
            p.landlordId === currentUser.userId ||
            p.landlord?.email === currentUser.email ||
            p.landlord?.id === currentUser.userId
        );
        setProperties(myProps);
      } else {
        setProperties([]);
      }
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadLandlordProperties();
    }
  }, [currentUser]);

  const handleRenewListing = async (property: PropertyData) => {
    setRenewingId(property.id);
    const email = currentUser?.email || "landlord@nssdirectstay.gh";

    const handleSuccessCallback = async (reference: string) => {
      try {
        const res = await fetch(`/api/properties/${property.id}/renew`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentRef: reference }),
        });
        const data = await res.json();
        if (res.ok) {
          setActionNotice(`Success! ${property.title} listing has been renewed for another 90 days.`);
          await loadLandlordProperties();
        } else {
          alert(data.error || "Failed to renew listing.");
        }
      } catch (err: any) {
        alert(err.message || "Failed to process renewal.");
      } finally {
        setRenewingId(null);
      }
    };

    const opened = await openPaystackPopup({
      email,
      amount: 3000, // GH₵ 30.00 in pesewas
      onSuccess: (ref) => handleSuccessCallback(ref),
      onClose: () => setRenewingId(null),
    });

    if (!opened) {
      alert("Failed to initialize Paystack payment gateway. Please check your network connection.");
      setRenewingId(null);
    }
  };

  const handleDeleteLandlordProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to permanently delete this room listing from the system?")) return;

    setProperties((prev) => prev.filter((p) => p.id !== propertyId));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nss_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete property.");
        loadLandlordProperties();
      } else {
        setActionNotice("Property listing permanently deleted from the system.");
      }
    } catch {
      // Keep optimistic delete
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold animate-pulse">Loading Landlord Portal...</p>
      </div>
    );
  }

  const isLandlordOrAdmin = currentUser?.role === "LANDLORD" || currentUser?.role === "ADMIN";

  if (!currentUser || !isLandlordOrAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Landlord Dashboard Restricted</h1>
        <p className="text-xs text-slate-400 max-w-md mb-6">
          Access is restricted to registered Landlords and System Administrators. Please sign in as a Landlord to view your properties, tenant views, and listing validity.
        </p>

        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold hover:from-emerald-400 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Room Search</span>
        </Link>
      </div>
    );
  }

  const filteredProps = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.generalArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.exactGhanaPostGps.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTenantViews = properties.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const activeCount = properties.filter((p) => p.isActive).length;
  const expiredCount = properties.filter((p) => !p.isActive || (p.daysRemaining !== undefined && p.daysRemaining <= 0)).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <Navbar
        user={currentUser}
        onOpenAuth={() => {}}
        onOpenPostProperty={() => setIsPostRoomOpen(true)}
        onOpenCommuteCalc={() => {}}
        onOpenVerification={() => {}}
        onLogout={() => {
          localStorage.removeItem("nss_user");
          localStorage.removeItem("nss_token");
          window.location.href = "/";
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner Notice */}
        {actionNotice && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="p-1 text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-[10px] uppercase font-bold py-0.5">
                Landlord Command Center
              </Badge>
              <span className="text-xs text-slate-400">• Verified Property Owner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {currentUser.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your room listings, track tenant views, and renew 90-day property validity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPostRoomOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs hover:from-emerald-400 transition shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List New Property (GH₵ 30.00)</span>
            </button>

            <button
              onClick={loadLandlordProperties}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
              title="Refresh Listings"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>My Total Properties</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{properties.length}</p>
            <p className="text-[11px] text-slate-400">Exclusively listed under your account</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Tenant Views</span>
              <Eye className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-3xl font-extrabold text-teal-400">{totalTenantViews}</p>
            <p className="text-[11px] text-slate-400">Tenants who viewed your property details</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Active Listings</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-400">{activeCount}</p>
            <p className="text-[11px] text-emerald-400 font-semibold">Visible to tenants on search feed</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Expired / Needs Renewal</span>
              <Clock className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-3xl font-extrabold text-rose-400">{expiredCount}</p>
            <p className="text-[11px] text-rose-300 font-semibold">Requires GH₵ 30.00 payment to delist auto-delete</p>
          </div>
        </div>

        {/* 30-Day Performance Analytics Chart */}
        <Landlord30DayChart properties={properties} />

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search your properties by title, area, GPS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredProps.length}</strong> of <strong className="text-white">{properties.length}</strong> properties
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold animate-pulse">Loading your properties...</p>
          </div>
        ) : filteredProps.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No Properties Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {searchQuery
                ? "No properties match your current search query."
                : "You have not listed any properties yet. Post your first room to reach thousands of National Service Personnel!"}
            </p>
            <button
              onClick={() => setIsPostRoomOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold hover:from-emerald-400 transition shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Your First Property (GH₵ 30.00)</span>
            </button>
          </div>
        ) : (
          /* Properties Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProps.map((prop) => {
              const daysRemaining = prop.daysRemaining ?? 90;
              const daysUntilDeletion = prop.daysUntilDeletion ?? 93;
              const isExpired = prop.isExpired || !prop.isActive;

              return (
                <div
                  key={prop.id}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition"
                >
                  {/* Card Media Header */}
                  <div className="relative aspect-video bg-slate-950 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prop.images && prop.images.length > 0 ? prop.images[0] : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"}
                      alt={prop.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80";
                      }}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      {prop.isNewlyListed && (
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Newly Listed</span>
                        </span>
                      )}

                      <Badge variant={isExpired ? "destructive" : "default"} className="py-0.5 text-[10px]">
                        {isExpired ? "Expired / Delisted" : "Active"}
                      </Badge>
                    </div>

                    {/* Tenant Views Counter Overlay Badge */}
                    <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 text-xs font-bold text-teal-300 flex items-center gap-1.5 shadow-lg">
                      <Eye className="w-3.5 h-3.5 text-teal-400" />
                      <span>{prop.viewsCount || 0} Tenants Viewed</span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {prop.propertyType === "SINGLE_ROOM" ? "Single Room" : "Chamber & Hall"} • {prop.facilityType === "SELF_CONTAIN" ? "Self Contain" : "Shared"}
                        </span>
                        <span className="text-lg font-black text-emerald-400">GH₵ {prop.pricePerMonth}/mo</span>
                      </div>

                      <h3 className="font-bold text-base text-white line-clamp-2 leading-snug">{prop.title}</h3>

                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{prop.generalArea} • {prop.exactGhanaPostGps}</span>
                      </p>
                    </div>

                    {/* Validity & Countdown Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Listing Validity:</span>
                        </span>
                        {!isExpired ? (
                          <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                            {daysRemaining} Days Remaining
                          </span>
                        ) : (
                          <span className="font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/30">
                            {daysUntilDeletion} Days Left Before Permanent Deletion
                          </span>
                        )}
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isExpired
                              ? "bg-rose-500"
                              : daysRemaining <= 15
                              ? "bg-amber-400"
                              : "bg-gradient-to-r from-emerald-500 to-teal-400"
                          }`}
                          style={{ width: `${Math.min(100, (daysRemaining / 90) * 100)}%` }}
                        />
                      </div>

                      <p className="text-[10px] text-slate-400 leading-tight">
                        {!isExpired
                          ? "Available for 90 days. Renewal payment extends validity by 90 days."
                          : "Delisted from public search. Pay renewal fee within grace period to prevent deletion."}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleRenewListing(prop)}
                        disabled={renewingId === prop.id}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                          isExpired
                            ? "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20"
                            : "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
                        }`}
                      >
                        <CreditCard className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {renewingId === prop.id
                            ? "Processing..."
                            : isExpired
                            ? "Renew Listing (GH₵ 30.00)"
                            : "Extend Validity (GH₵ 30.00)"}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDeleteLandlordProperty(prop.id)}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition shrink-0"
                        title="Delete Property Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Contact Support Button */}
      <button
        onClick={() => setIsSupportOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-emerald-300/50"
        aria-label="Contact Customer Support"
      >
        <Headphones className="w-4 h-4 text-slate-950 animate-bounce" />
        <span className="hidden sm:inline">Landlord Support</span>
        <span className="sm:hidden">Support</span>
      </button>

      <LandlordPostModal
        isOpen={isPostRoomOpen}
        onClose={() => setIsPostRoomOpen(false)}
        onSuccess={() => loadLandlordProperties()}
        currentUser={currentUser}
      />

      <ContactSupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        user={currentUser}
        defaultSubject="Landlord Support Request regarding Room Listing or Payment"
      />
    </div>
  );
}
