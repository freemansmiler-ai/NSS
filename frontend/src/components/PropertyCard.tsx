"use client";

import { useState } from "react";
import { UserSession } from "@/lib/auth";
import { PropertyData } from "@/lib/sample-data";
import { WorkplaceHotspot, analyzeCommute } from "@/lib/haversine";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  MessageSquare,
  Copy,
  Check,
  Navigation,
  Layers,
  CalendarCheck,
  Sparkles,
  Lock
} from "lucide-react";

interface PropertyCardProps {
  property: PropertyData;
  user: UserSession | null;
  selectedWorkplace?: WorkplaceHotspot | null;
  onSelect: (property: PropertyData) => void;
  onOpenVerification: () => void;
  onUnlockSuccess?: (updatedUser: UserSession) => void;
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_KEY;

export default function PropertyCard({
  property,
  user,
  selectedWorkplace,
  onSelect,
  onOpenVerification,
  onUnlockSuccess,
}: PropertyCardProps) {
  const [copiedGps, setCopiedGps] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  const isUnlocked = Boolean(user?.isUnlocked || user?.role === "LANDLORD" || user?.role === "ADMIN");

  const handleCopyGps = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUnlocked) {
      onOpenVerification();
      return;
    }
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

  const handleUnlockPayment = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      ? "10 Months (NSP)"
      : property.minLeasePeriod === "ONE_YEAR"
      ? "1 Year Lease"
      : "2+ Years";

  const whatsappMessage = encodeURIComponent(
    `Hello! I saw your listing "${property.title}" on NSS DirectStay. Is it still available for NSP rental?`
  );

  const isNewlyListed =
    property.isNewlyListed !== undefined
      ? property.isNewlyListed
      : (new Date().getTime() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 7;

  return (
    <Card
      onClick={() => onSelect(property)}
      className="group cursor-pointer overflow-hidden flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 relative"
    >
      <div>
        {/* Card Header Media */}
        <div className="relative h-52 w-full overflow-hidden bg-slate-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={(property.images && property.images.length > 0 && property.images[0]) ? property.images[0] : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"}
            alt={property.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80";
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5">
              {isNewlyListed && (
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-xl shadow-lg border border-emerald-400/50 flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3 fill-slate-950" />
                  Newly Listed
                </span>
              )}
              <Badge variant="default" className="backdrop-blur-md shadow-md">
                {propertyTypeLabel}
              </Badge>
            </div>
            <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 font-extrabold text-sm px-3 py-1 rounded-xl border border-emerald-500/40 shadow-lg">
              GH₵ {property.pricePerMonth} <span className="text-[10px] text-slate-300 font-normal">/mo</span>
            </span>
          </div>

          {/* Bottom Overlay Badges */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
            <span className="bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-700/60 flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-400" />
              {facilityLabel}
            </span>
            <span className="bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-700/60 flex items-center gap-1 text-slate-300">
              <CalendarCheck className="w-3 h-3 text-amber-400" />
              {leasePeriodLabel}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          <h3 className="font-bold text-base text-slate-100 group-hover:text-emerald-400 transition line-clamp-1 leading-snug">
            {property.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{property.generalArea}</span>
          </div>

          {/* GhanaPostGPS Box */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              {isUnlocked ? (
                <>
                  <span className="font-mono text-emerald-400 font-bold tracking-wide">
                    {property.exactGhanaPostGps}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">GhanaPostGPS</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-mono text-amber-400/80 font-bold tracking-widest blur-[2px]">
                    GA-***-****
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Locked</span>
                </>
              )}
            </div>

            {isUnlocked ? (
              <button
                onClick={handleCopyGps}
                className="p-1 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition flex items-center gap-1 text-[11px]"
                title="Copy GPS Address"
              >
                {copiedGps ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleUnlockPayment}
                className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold hover:bg-amber-500/25 transition"
              >
                Unlock (GH₵ 20.00)
              </button>
            )}
          </div>

          {/* Commute Distance Pill if Workplace Selected */}
          {commuteInfo && (
            <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${commuteInfo.badgeColor}`}>
              <div className="flex items-center gap-1.5 font-medium">
                <Navigation className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                <span>{commuteInfo.badgeLabel}</span>
              </div>
              <div className="font-bold text-[11px]">
                ~{commuteInfo.estRoadKm} km ({commuteInfo.estTrotroMinutes} min trotro)
              </div>
            </div>
          )}

          {/* Amenities preview */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {property.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-slate-800/60 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer Actions - Direct Landlord Contacts vs Locked State */}
      <div className="p-5 pt-0 mt-2 border-t border-slate-800/60">
        {isUnlocked ? (
          <div className="flex items-center justify-between gap-2">
            <a
              href={`tel:${property.contactPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 hover:text-white transition"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call</span>
            </a>

            <a
              href={`https://wa.me/${property.contactWhatsapp}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        ) : (
          <button
            onClick={handleUnlockPayment}
            disabled={unlockLoading}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:from-amber-400 hover:to-orange-400 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <Lock className="w-3.5 h-3.5 text-slate-950" />
            <span>{unlockLoading ? "Opening Paystack..." : "Unlock GPS & Contacts (GH₵ 20.00)"}</span>
          </button>
        )}
      </div>
    </Card>
  );
}
