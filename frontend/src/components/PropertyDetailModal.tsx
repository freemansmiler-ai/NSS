"use client";

import { useState } from "react";
import { UserSession } from "@/lib/auth";
import { PropertyData } from "@/lib/sample-data";
import { WorkplaceHotspot, analyzeCommute } from "@/lib/haversine";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import DynamicMap from "./DynamicMap";
import {
  MapPin,
  Phone,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
  Navigation,
  Layers,
  CalendarCheck,
  CheckCircle2,
  Lock,
  Map
} from "lucide-react";

interface PropertyDetailModalProps {
  property: PropertyData | null;
  user?: UserSession | null;
  selectedWorkplace?: WorkplaceHotspot | null;
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess?: (updatedUser: UserSession) => void;
}

const PAYSTACK_PUBLIC_KEY = "pk_test_e58c19239890c021e8d0f7b6ded1cc22d4fa7982";

export default function PropertyDetailModal({
  property,
  user,
  selectedWorkplace,
  isOpen,
  onClose,
  onUnlockSuccess,
}: PropertyDetailModalProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [copiedGps, setCopiedGps] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  if (!property) return null;

  const isUnlocked = Boolean(user?.isUnlocked || user?.role === "LANDLORD" || user?.role === "ADMIN");

  const handleCopyGps = () => {
    if (!isUnlocked) return;
    navigator.clipboard.writeText(property.exactGhanaPostGps);
    setCopiedGps(true);
    setTimeout(() => setCopiedGps(false), 2000);
  };

  const loadPaystackScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).PaystackPop) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUnlockPayment = async () => {
    setUnlockLoading(true);
    const loaded = await loadPaystackScript();
    if (!loaded) {
      alert("Failed to load Paystack payment gateway. Please check your internet connection.");
      setUnlockLoading(false);
      return;
    }

    const paystackPop = (window as any).PaystackPop;
    const ref = "NSS_UNLOCK_" + Math.floor(Math.random() * 1000000000 + 1);
    const email = user?.email || "tenant@nssdirectstay.gh";

    const handleSuccessCallback = async (reference: string) => {
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "UNLOCK_CONTACTS",
            paymentRef: reference,
          }),
        });
        const data = await res.json();
        if (data.user && onUnlockSuccess) {
          onUnlockSuccess(data.user);
        }
      } catch {}
      setUnlockLoading(false);
    };

    try {
      if (paystackPop && typeof paystackPop.setup === "function") {
        const handler = paystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email,
          amount: 2000, // GH₵ 20.00 in pesewas
          currency: "GHS",
          ref,
          callback: (response: any) => {
            handleSuccessCallback(response.reference || response.trxref || ref);
          },
          onClose: () => {
            setUnlockLoading(false);
          },
        });
        handler.openIframe();
      } else {
        const paystack = new paystackPop();
        paystack.newTransaction({
          key: PAYSTACK_PUBLIC_KEY,
          email,
          amount: 2000,
          currency: "GHS",
          ref,
          onSuccess: (transaction: any) => {
            handleSuccessCallback(transaction.reference || ref);
          },
          onCancel: () => {
            setUnlockLoading(false);
          },
        });
      }
    } catch (err: any) {
      console.error("Paystack popup error:", err);
      alert("Could not initialize Paystack inline window. Please try again.");
      setUnlockLoading(false);
    }
  };

  const commuteInfo = selectedWorkplace
    ? analyzeCommute(
        { latitude: selectedWorkplace.latitude, longitude: selectedWorkplace.longitude },
        { latitude: property.latitude, longitude: property.longitude }
      )
    : null;

  const propertyTypeLabel =
    property.propertyType === "SINGLE_ROOM" ? "Single Room" : "Chamber & Hall";
  const facilityLabel =
    property.facilityType === "SELF_CONTAIN" ? "Self Contain" : "Shared Facilities";
  const leasePeriodLabel =
    property.minLeasePeriod === "TEN_MONTHS"
      ? "10 Months (NSP Year)"
      : property.minLeasePeriod === "ONE_YEAR"
      ? "1 Year Lease"
      : "2+ Years";

  const whatsappMessage = encodeURIComponent(
    `Hello! I found your property "${property.title}" on NSS DirectStay. Is it still available for NSP rental?`
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {(property.isNewlyListed || (new Date().getTime() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 7) && (
                <Badge variant="default" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold flex items-center gap-1 border-0">
                  ✨ Newly Listed
                </Badge>
              )}
              <Badge variant="default">{propertyTypeLabel}</Badge>
              <Badge variant="outline">{facilityLabel}</Badge>
              <Badge variant="accent">{leasePeriodLabel}</Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {property.title}
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{property.generalArea}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              GH₵ {property.pricePerMonth}
            </span>
            <p className="text-xs text-slate-400">per month</p>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="space-y-3">
          <div className="relative h-64 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={property.images[selectedImageIdx] || property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Direct Landlord Listing</span>
            </div>
          </div>

          {property.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    selectedImageIdx === idx ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-slate-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Direct Landlord Contact Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 justify-center font-bold text-lg">
                {property.landlord?.fullName?.[0] || "L"}
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-base">
                  {property.landlord?.fullName || "Verified Landlord"}
                </h4>
                <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Direct Property Owner</span>
                </p>
              </div>
            </div>

            <Badge variant={isUnlocked ? "default" : "secondary"} className="py-1">
              {isUnlocked ? "Unlocked Contacts" : "Contacts Locked"}
            </Badge>
          </div>

          {isUnlocked ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href={`tel:${property.contactPhone}`}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 text-slate-100 font-bold text-sm hover:bg-slate-700 transition border border-slate-700"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call {property.contactPhone}</span>
              </a>

              <a
                href={`https://wa.me/${property.contactWhatsapp}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/30"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
              <p className="text-xs text-amber-300 font-semibold">
                Landlord Call Line, WhatsApp, Street Address & Interactive Location Map are locked. Pay a one-time unlocking fee of GH₵ 20.00 to unlock full property details for all listings.
              </p>
              <button
                onClick={handleUnlockPayment}
                disabled={unlockLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:from-amber-400 hover:to-orange-400 transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-slate-950" />
                <span>{unlockLoading ? "Opening Paystack..." : "Pay GH₵ 20.00 to Unlock GPS, Street Address & Map"}</span>
              </button>
            </div>
          )}
        </div>

        {/* GhanaPostGPS & Location Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Exact Location & Address</span>
            </h4>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">GhanaPostGPS Address</p>
                {isUnlocked ? (
                  <p className="font-mono text-emerald-400 font-bold text-base">{property.exactGhanaPostGps}</p>
                ) : (
                  <p className="font-mono text-amber-400/80 font-bold text-base blur-[2px]">GA-***-****</p>
                )}
              </div>
              {isUnlocked ? (
                <button
                  onClick={handleCopyGps}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5"
                >
                  {copiedGps ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedGps ? "Copied" : "Copy GPS"}</span>
                </button>
              ) : (
                <button
                  onClick={handleUnlockPayment}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold hover:bg-amber-500/30 border border-amber-500/40"
                >
                  Unlock GPS
                </button>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Street Address & Landmark:</p>
              {isUnlocked ? (
                <p className="text-sm font-semibold text-slate-200">{property.exactStreetAddress}</p>
              ) : (
                <p className="text-xs font-bold text-amber-400/90 flex items-center gap-1 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 mt-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Street Address & Landmark Locked (Pay GH₵ 20.00)</span>
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">General Area:</p>
              <p className="text-sm font-semibold text-slate-200">{property.generalArea}</p>
            </div>
          </div>

          {/* Commute Math Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>NSP Commute Math Analysis</span>
            </h4>

            {commuteInfo ? (
              <div className="space-y-2">
                <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between font-bold ${commuteInfo.badgeColor}`}>
                  <span>{commuteInfo.badgeLabel}</span>
                  <span>Target: {selectedWorkplace?.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-slate-400 text-[10px]">Road Distance</p>
                    <p className="font-bold text-white text-sm">~{commuteInfo.estRoadKm} km</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-slate-400 text-[10px]">Trotro Travel Time</p>
                    <p className="font-bold text-emerald-400 text-sm">~{commuteInfo.estTrotroMinutes} mins</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  Straight-line distance: {commuteInfo.straightLineKm} km. Trotro estimate includes regular Ghanaian stop times.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                <p>Select your workplace from the NSP Commute Calculator at the top bar to calculate direct distance and trotro commute time to this room.</p>
              </div>
            )}
          </div>
        </div>

        {/* Property Description */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-slate-200">Room & Compound Description</h4>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
            {property.description}
          </p>
        </div>

        {/* Amenities Checklist */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-200">Amenities & Compound Features</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {property.amenities.map((amenity, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-200 font-medium"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Location Map (Locked vs Unlocked) */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-slate-200 flex items-center justify-between">
            <span>Interactive Location Map</span>
            {!isUnlocked && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[10px] flex items-center gap-1 font-bold">
                <Lock className="w-3 h-3" />
                <span>Map Locked</span>
              </Badge>
            )}
          </h4>

          {isUnlocked ? (
            <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-800">
              <DynamicMap
                properties={[property]}
                selectedProperty={property}
                workplaceCoord={selectedWorkplace ? { latitude: selectedWorkplace.latitude, longitude: selectedWorkplace.longitude } : null}
                center={[property.latitude, property.longitude]}
                zoom={14}
              />
            </div>
          ) : (
            <div className="h-64 w-full rounded-2xl bg-slate-950 border border-amber-500/30 p-6 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Map className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-sm text-white">Interactive Location Map is Locked</h5>
                <p className="text-xs text-slate-400 max-w-sm">
                  Pay a one-time fee of GH₵ 20.00 to unlock interactive location map pins, exact street address, and direct landlord phone numbers.
                </p>
              </div>
              <button
                onClick={handleUnlockPayment}
                disabled={unlockLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:from-amber-400 hover:to-orange-400 transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{unlockLoading ? "Opening Paystack..." : "Pay GH₵ 20.00 to Unlock Map & Address"}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </Dialog>
  );
}
