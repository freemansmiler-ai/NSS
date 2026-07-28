"use client";

import { useState, useEffect, useMemo } from "react";
import { UserSession } from "@/lib/auth";
import { PropertyData, INITIAL_PROPERTIES } from "@/lib/sample-data";
import { WorkplaceHotspot, POPULAR_NSP_WORKPLACES, analyzeCommute } from "@/lib/haversine";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import PropertyDetailModal from "@/components/PropertyDetailModal";
import CommuteCalculatorModal from "@/components/CommuteCalculatorModal";
import LandlordPostModal from "@/components/LandlordPostModal";
import AuthModal from "@/components/AuthModal";
import VerificationModal from "@/components/VerificationModal";
import DynamicMap from "@/components/DynamicMap";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Navigation,
  ShieldCheck,
  Map as MapIcon,
  Grid,
  X,
  Building2,
  Lock,
  ArrowRight,
  PlusCircle
} from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [properties, setProperties] = useState<PropertyData[]>(INITIAL_PROPERTIES);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isCommuteOpen, setIsCommuteOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);
  const [roleNotice, setRoleNotice] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("ALL");
  const [facilityTypeFilter, setFacilityTypeFilter] = useState("ALL");
  const [leasePeriodFilter, setLeasePeriodFilter] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [viewMode, setViewMode] = useState<"GRID" | "MAP" | "SPLIT">("GRID");

  // Selected NSP Workplace Hotspot for Commute Math
  const [selectedWorkplace, setSelectedWorkplace] = useState<WorkplaceHotspot | null>(
    POPULAR_NSP_WORKPLACES[0] // Default to UG Legon
  );

  const handleUpdateUser = (updatedUser: UserSession | null) => {
    setUser(updatedUser);
    if (updatedUser) {
      try {
        localStorage.setItem("nss_user", JSON.stringify(updatedUser));
      } catch {}
    } else {
      try {
        localStorage.removeItem("nss_user");
        localStorage.removeItem("nss_token");
      } catch {}
    }
  };

  // Check current auth session with Bearer token & localStorage fallback
  useEffect(() => {
    let hasLocalUser = false;
    try {
      const savedUser = localStorage.getItem("nss_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        hasLocalUser = true;
      }
    } catch {}

    const token = typeof window !== "undefined" ? localStorage.getItem("nss_token") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch("/api/auth/me", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          handleUpdateUser(data.user);
        } else if (!hasLocalUser) {
          handleUpdateUser(null);
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // Fetch properties from backend API (authenticated or guest)
  const loadProperties = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set("search", searchQuery);
      if (propertyTypeFilter !== "ALL") queryParams.set("propertyType", propertyTypeFilter);
      if (facilityTypeFilter !== "ALL") queryParams.set("facilityType", facilityTypeFilter);
      if (leasePeriodFilter !== "ALL") queryParams.set("minLeasePeriod", leasePeriodFilter);
      if (maxPrice < 1000) queryParams.set("maxPrice", maxPrice.toString());

      const res = await fetch(`/api/properties?${queryParams.toString()}`);
      const data = await res.json();
      if (data.properties && Array.isArray(data.properties)) {
        setProperties(data.properties);
      } else {
        setProperties(INITIAL_PROPERTIES);
      }
    } catch {
      setProperties(INITIAL_PROPERTIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [searchQuery, propertyTypeFilter, facilityTypeFilter, leasePeriodFilter, maxPrice, user]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    handleUpdateUser(null);
  };

  const handleOpenPostProperty = () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    if (user.role !== "LANDLORD" && user.role !== "ADMIN") {
      setRoleNotice(
        `Access Restricted: You are currently registered as a ${user.role}. Only registered Landlords and System Administrators can post room listings on NSS DirectStay.`
      );
      return;
    }

    setIsPostOpen(true);
  };

  // Filter properties in-memory & sort by commute distance if workplace active
  const filteredProperties = useMemo(() => {
    let list = properties.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.generalArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.exactGhanaPostGps.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.exactStreetAddress.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        propertyTypeFilter === "ALL" || p.propertyType === propertyTypeFilter;

      const matchesFacility =
        facilityTypeFilter === "ALL" || p.facilityType === facilityTypeFilter;

      const matchesLease =
        leasePeriodFilter === "ALL" || p.minLeasePeriod === leasePeriodFilter;

      const matchesPrice = p.pricePerMonth <= maxPrice;

      return matchesSearch && matchesType && matchesFacility && matchesLease && matchesPrice;
    });

    if (selectedWorkplace) {
      list = [...list].sort((a, b) => {
        const distA = analyzeCommute(
          { latitude: selectedWorkplace.latitude, longitude: selectedWorkplace.longitude },
          { latitude: a.latitude, longitude: a.longitude }
        ).estRoadKm;
        const distB = analyzeCommute(
          { latitude: selectedWorkplace.latitude, longitude: selectedWorkplace.longitude },
          { latitude: b.latitude, longitude: b.longitude }
        ).estRoadKm;
        return distA - distB;
      });
    }

    return list;
  }, [properties, searchQuery, propertyTypeFilter, facilityTypeFilter, leasePeriodFilter, maxPrice, selectedWorkplace]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold animate-pulse">Initializing NSS DirectStay Gateway...</p>
      </div>
    );
  }

  // Mandatory Authentication Wall for Unauthenticated Visitors
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
        <Navbar
          user={null}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenPostProperty={handleOpenPostProperty}
          onOpenCommuteCalc={() => setIsCommuteOpen(true)}
          onOpenVerification={() => setIsVerificationOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 text-center max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-4">
            <Badge variant="default" className="text-xs font-bold uppercase tracking-wider py-1">
              Protected Access Portal • Ghana 🇬🇭
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
              Sign In or Register to Access <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                NSS DirectStay Room Listings
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              NSS DirectStay provides open-access room rentals with zero house agent fees, verified GhanaPostGPS addresses, and direct Landlord Call & WhatsApp lines for National Service Personnel. Please sign in or create an account to access the platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto">
            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-sm hover:from-emerald-400 hover:to-teal-500 transition shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <span>Sign In / Create Account</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleOpenPostProperty}
              className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <span>List a Room (GH₵ 30.00)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-8 border-t border-slate-800/80 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="font-bold text-xs text-white">0% House Agent Fees</h4>
              <p className="text-[11px] text-slate-400 mt-1">Direct contact lines for room owners across Ghana.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <Navigation className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="font-bold text-xs text-white">Haversine Commute Math</h4>
              <p className="text-[11px] text-slate-400 mt-1">Calculates trotro time to your NSS workplace.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <Building2 className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="font-bold text-xs text-white">Verified Landlords Only</h4>
              <p className="text-[11px] text-slate-400 mt-1">Only registered Landlords & Admins can post room listings.</p>
            </div>
          </div>
        </main>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(u) => setUser(u)}
        />
      </div>
    );
  }

  // Authenticated Application View
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPostProperty={handleOpenPostProperty}
        onOpenCommuteCalc={() => setIsCommuteOpen(true)}
        onOpenVerification={() => setIsVerificationOpen(true)}
        onLogout={handleLogout}
      />

      {/* Role Access Restriction Banner Notice */}
      {roleNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{roleNotice}</span>
            </div>
            <button
              onClick={() => setRoleNotice(null)}
              className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950">
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authenticated Access • Welcome, {user.fullName} ({user.role})</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Direct Landlord Rooms for <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              National Service Personnel
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Find verified <strong className="text-emerald-400">Single Rooms</strong> & <strong className="text-emerald-400">Chamber & Hall</strong> units across Ghana. Direct Landlord Call & WhatsApp lines with zero agent fees.
          </p>

          {/* Quick Workplace Active Pill */}
          {selectedWorkplace && (
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 shadow-md">
              <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Sorting by commute distance to <strong className="text-white">{selectedWorkplace.name}</strong>
              </span>
              <button
                onClick={() => setIsCommuteOpen(true)}
                className="text-emerald-400 underline font-bold hover:text-emerald-300"
              >
                Change
              </button>
            </div>
          )}

          {/* Multi-Filter Bar Container */}
          <div className="max-w-4xl mx-auto p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-4 text-left">
            
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search by area, GhanaPostGPS code (e.g. GM-042-8910), or street address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Property Type
                </label>
                <select
                  value={propertyTypeFilter}
                  onChange={(e) => setPropertyTypeFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="SINGLE_ROOM">Single Room</option>
                  <option value="CHAMBER_AND_HALL">Chamber & Hall</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Facilities
                </label>
                <select
                  value={facilityTypeFilter}
                  onChange={(e) => setFacilityTypeFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Facilities</option>
                  <option value="SELF_CONTAIN">Self Contain</option>
                  <option value="SHARED_FACILITIES">Shared Facilities</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Min Lease
                </label>
                <select
                  value={leasePeriodFilter}
                  onChange={(e) => setLeasePeriodFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Any Period</option>
                  <option value="TEN_MONTHS">10 Months (NSP)</option>
                  <option value="ONE_YEAR">1 Year</option>
                  <option value="TWO_YEARS_PLUS">2+ Years</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Max Rent
                  </label>
                  <span className="text-xs font-extrabold text-emerald-400">GH₵ {maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-lg bg-slate-950"
                />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Main Listings Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>Available Room Listings</span>
              <Badge variant="default" className="text-xs font-extrabold">
                {filteredProperties.length} Verified Rooms
              </Badge>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any room to view full GhanaPostGPS code and contact landlord directly on WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode("GRID")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "GRID"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>

              <button
                onClick={() => setViewMode("SPLIT")}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "SPLIT"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Split Map</span>
              </button>

              <button
                onClick={() => setViewMode("MAP")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "MAP"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Full Map</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-4 animate-pulse">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-200">No matching rooms found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try adjusting your max price budget slider or clearing specific filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setPropertyTypeFilter("ALL");
                setFacilityTypeFilter("ALL");
                setLeasePeriodFilter("ALL");
                setMaxPrice(1000);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-emerald-400 text-xs font-bold hover:bg-slate-700"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === "GRID" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                user={user}
                selectedWorkplace={selectedWorkplace}
                onSelect={(p) => setSelectedProperty(p)}
                onOpenVerification={() => setIsVerificationOpen(true)}
                onUnlockSuccess={(u) => handleUpdateUser(u)}
              />
            ))}
          </div>
        ) : viewMode === "SPLIT" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[750px] overflow-y-auto pr-2">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  user={user}
                  selectedWorkplace={selectedWorkplace}
                  onSelect={(p) => setSelectedProperty(p)}
                  onOpenVerification={() => setIsVerificationOpen(true)}
                  onUnlockSuccess={(u) => handleUpdateUser(u)}
                />
              ))}
            </div>
            <div className="lg:col-span-6 h-[750px] sticky top-24 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <DynamicMap
                properties={filteredProperties}
                selectedProperty={selectedProperty}
                workplaceCoord={selectedWorkplace ? { latitude: selectedWorkplace.latitude, longitude: selectedWorkplace.longitude } : null}
                onSelectProperty={(p) => setSelectedProperty(p)}
              />
            </div>
          </div>
        ) : (
          <div className="h-[650px] w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <DynamicMap
              properties={filteredProperties}
              selectedProperty={selectedProperty}
              workplaceCoord={selectedWorkplace ? { latitude: selectedWorkplace.latitude, longitude: selectedWorkplace.longitude } : null}
              onSelectProperty={(p) => setSelectedProperty(p)}
            />
          </div>
        )}

      </main>

      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-200">NSS DirectStay Ghana</span>
              <p className="text-[11px] text-slate-500">Connecting National Service Personnel & Landlords Directly</p>
            </div>
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            <p>© 2026 NSS DirectStay Ghana. 100% Free & Open Access.</p>
            <p className="text-emerald-400 font-medium">Zero agent commission. Built for NSP personnel across Ghana.</p>
          </div>
        </div>
      </footer>

      <PropertyDetailModal
        property={selectedProperty}
        user={user}
        selectedWorkplace={selectedWorkplace}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
        onUnlockSuccess={(u) => handleUpdateUser(u)}
      />

      <CommuteCalculatorModal
        isOpen={isCommuteOpen}
        onClose={() => setIsCommuteOpen(false)}
        selectedWorkplace={selectedWorkplace}
        onSelectWorkplace={(w) => setSelectedWorkplace(w)}
      />

      <LandlordPostModal
        isOpen={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        onSuccess={() => {
          setSearchQuery("");
          setMaxPrice(1000);
          setPropertyTypeFilter("ALL");
          setFacilityTypeFilter("ALL");
          loadProperties();
        }}
        currentUser={user}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => handleUpdateUser(u)}
      />

      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        user={user}
        onVerifiedSuccess={(u) => u && handleUpdateUser(u)}
      />

    </div>
  );
}
