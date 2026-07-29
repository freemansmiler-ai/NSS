"use client";

import { useState } from "react";
import { UserSession } from "@/lib/auth";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Building2, ShieldCheck, Check, CreditCard, Sparkles, Upload, X, Image as ImageIcon } from "lucide-react";

interface LandlordPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser?: UserSession | null;
}

const AVAILABLE_AMENITIES = [
  "ECG Prepaid Meter",
  "ECG Postpaid Meter",
  "Private Bathroom",
  "Polytank Water Supply",
  "Personal Kitchenette",
  "Fenced Gate & Security Lighting",
  "Tiled Floor",
  "Own Balcony",
  "Compound Car Parking",
  "Standby Generator",
  "Shared ECG Meter"
];

import { openPaystackPopup } from "@/lib/paystack";
import { GHANA_REGIONS } from "@/lib/ghana-regions-cities";

export default function LandlordPostModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
}: LandlordPostModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("GAR");

  const [formData, setFormData] = useState({
    title: "",
    propertyType: "SINGLE_ROOM",
    facilityType: "SELF_CONTAIN",
    pricePerMonth: "",
    minLeasePeriod: "TEN_MONTHS",
    generalArea: "East Legon",
    exactGhanaPostGps: "",
    exactStreetAddress: "",
    latitude: "5.65",
    longitude: "-0.17",
    description: "",
    amenities: ["ECG Prepaid Meter", "Polytank Water Supply"],
    contactPhone: "",
    contactWhatsapp: "",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"
  });

  const isAdmin = currentUser?.role === "ADMIN";

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgUrl = event.target?.result as string;
        if (!imgUrl) return resolve("");
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.75));
          } else {
            resolve(imgUrl);
          }
        };
        img.onerror = () => resolve(imgUrl);
        img.src = imgUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeviceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const fileList = Array.from(files);
      const compressedList = await Promise.all(fileList.map((file) => compressImage(file)));
      const validImages = compressedList.filter((img) => Boolean(img));
      setUploadedImages((prev) => [...prev, ...validImages]);
    } catch {
      // Fallback if compression encounters an error
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const submitListingToBackend = async (paymentRef: string) => {
    try {
      const finalImages = uploadedImages.length > 0 ? uploadedImages : [formData.imageUrl];

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          pricePerMonth: Number(formData.pricePerMonth),
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          images: finalImages,
          paymentRef,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit property listing.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to post listing.");
    } finally {
      setLoading(false);
    }
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // If Admin, list room for free
    if (isAdmin) {
      await submitListingToBackend("ADMIN_FREE");
      return;
    }

    // Otherwise, Landlord pays GHc 30.00 via Paystack
    const email = currentUser?.email || "landlord@nssdirectstay.gh";

    const opened = await openPaystackPopup({
      email,
      amount: 3000, // GH₵ 30.00 in pesewas
      onSuccess: async (ref) => {
        await submitListingToBackend(ref);
      },
      onClose: () => {
        setLoading(false);
        setError("Paystack payment cancelled. Payment of GH₵ 30.00 is required to publish room.");
      },
    });

    if (!opened) {
      setError("Failed to load Paystack inline SDK. Please check your internet connection.");
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Direct Landlord Room Portal</span>
            </Badge>

            {isAdmin ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold">
                Admin Free Listing (GH₵ 0.00)
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 font-bold flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-amber-400" />
                <span>Paystack Fee: GH₵ 30.00 / 90 Days</span>
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-bold text-white">Post Room Listing for NSP Personnel</h2>
          <p className="text-xs text-slate-400 mt-1">
            List your room directly with exact GhanaPostGPS address & phone numbers.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Upload Room Pictures from Device */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Upload Room Pictures (From Local Device)</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">Multiple files supported</span>
            </div>

            <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950/60">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleDeviceFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-1.5 text-slate-400">
                <Upload className="w-6 h-6 text-emerald-400 animate-bounce" />
                <p className="text-xs font-bold text-slate-200">Click or Drag & Drop images from your phone/computer</p>
                <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP photo files</p>
              </div>
            </div>

            {/* Display Uploaded Previews */}
            {uploadedImages.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[11px] font-bold text-slate-300">Selected Device Photos ({uploadedImages.length}):</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 shrink-0 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Upload preview ${index}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Listing Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Spacious Self-Contain Single Room near Legon Campus"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Property & Facility Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Room Layout Type *
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="SINGLE_ROOM">Single Room</option>
                <option value="CHAMBER_AND_HALL">Chamber & Hall</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Facility Setup *
              </label>
              <select
                value={formData.facilityType}
                onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="SELF_CONTAIN">Self Contain (Private Washroom)</option>
                <option value="SHARED_FACILITY">Shared Facilities</option>
              </select>
            </div>
          </div>

          {/* Price & Lease Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Monthly Rent (GH₵) *
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 350"
                value={formData.pricePerMonth}
                onChange={(e) => setFormData({ ...formData, pricePerMonth: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Minimum Lease Period *
              </label>
              <select
                value={formData.minLeasePeriod}
                onChange={(e) => setFormData({ ...formData, minLeasePeriod: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="TEN_MONTHS">10 Months (NSP Year Standard)</option>
                <option value="ONE_YEAR">1 Year Lease</option>
                <option value="TWO_YEARS">2+ Years Lease</option>
              </select>
            </div>
          </div>

          {/* Location & GhanaPostGPS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Region in Ghana *
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => {
                  const regCode = e.target.value;
                  setSelectedRegion(regCode);
                  const reg = GHANA_REGIONS.find((r) => r.code === regCode);
                  if (reg && reg.cities.length > 0) {
                    setFormData((prev) => ({ ...prev, generalArea: reg.cities[0] }));
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                {GHANA_REGIONS.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name} ({region.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                City / Suburb / Town *
              </label>
              <select
                value={formData.generalArea}
                onChange={(e) => setFormData({ ...formData, generalArea: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                {(GHANA_REGIONS.find((r) => r.code === selectedRegion)?.cities || []).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                GhanaPostGPS Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GA-042-8910"
                value={formData.exactGhanaPostGps}
                onChange={(e) => setFormData({ ...formData, exactGhanaPostGps: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Exact Street Address / Landmark Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Off Atomic Junction Road, 2nd house behind Total Filling Station"
              value={formData.exactStreetAddress}
              onChange={(e) => setFormData({ ...formData, exactStreetAddress: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Contact Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number (Call Line) *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +233244123456"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                WhatsApp Line (Intl Format) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 233244123456"
                value={formData.contactWhatsapp}
                onChange={(e) => setFormData({ ...formData, contactWhatsapp: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Property Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe compound water supply, security, proximity to trotro stations..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Amenities Multi-select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Room & Compound Amenities
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_AMENITIES.map((amenity) => {
                const isChecked = formData.amenities.includes(amenity);
                return (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-2.5 rounded-xl border text-xs text-left flex items-center justify-between transition ${
                      isChecked
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span>{amenity}</span>
                    {isChecked && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>
              {loading
                ? "Processing..."
                : isAdmin
                ? "Publish Free (Admin)"
                : "Pay GH₵ 30.00 & Post Room"}
            </span>
          </button>
        </div>
      </form>
    </Dialog>
  );
}
