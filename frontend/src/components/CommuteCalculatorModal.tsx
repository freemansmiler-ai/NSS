"use client";

import { useState } from "react";
import { POPULAR_NSP_WORKPLACES, WorkplaceHotspot } from "@/lib/haversine";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin, Check, Search, Sparkles } from "lucide-react";

interface CommuteCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWorkplace: WorkplaceHotspot | null;
  onSelectWorkplace: (workplace: WorkplaceHotspot | null) => void;
}

export default function CommuteCalculatorModal({
  isOpen,
  onClose,
  selectedWorkplace,
  onSelectWorkplace,
}: CommuteCalculatorModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHotspots = POPULAR_NSP_WORKPLACES.filter(
    (h) =>
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>NSP Haversine Commute Engine</span>
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-white">Select Your NSS Workplace / Posting Hub</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pick your posting place to instantly rank properties by commute distance, trotro travel time, and trotro route accessibility.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search posting location (e.g. Legon, Ministries, KNUST, Spintex)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Selected workplace badge banner */}
        {selectedWorkplace && (
          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-400">Currently Active Target</p>
                <p className="font-bold text-slate-100">{selectedWorkplace.name} ({selectedWorkplace.city})</p>
              </div>
            </div>
            <button
              onClick={() => onSelectWorkplace(null)}
              className="text-[11px] text-slate-400 hover:text-rose-400 underline"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Workplace Hotspots List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {filteredHotspots.map((hotspot) => {
            const isSelected = selectedWorkplace?.id === hotspot.id;
            return (
              <div
                key={hotspot.id}
                onClick={() => {
                  onSelectWorkplace(hotspot);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-500 text-white"
                    : "bg-slate-950 border-slate-800/80 text-slate-200 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-emerald-500 text-slate-950" : "bg-slate-900 text-emerald-400 border border-slate-800"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{hotspot.name}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        {hotspot.region}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{hotspot.description}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </Dialog>
  );
}
