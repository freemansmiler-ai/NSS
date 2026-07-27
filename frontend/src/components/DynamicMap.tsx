"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyData } from "@/lib/sample-data";
import { Coordinates } from "@/lib/haversine";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 text-slate-400">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium animate-pulse">Loading OpenStreetMap Ghana...</p>
    </div>
  ),
});

interface DynamicMapProps {
  properties: PropertyData[];
  selectedProperty?: PropertyData | null;
  workplaceCoord?: Coordinates | null;
  onSelectProperty?: (property: PropertyData) => void;
  center?: [number, number];
  zoom?: number;
}

export default function DynamicMap(props: DynamicMapProps) {
  return <MapComponent {...props} />;
}
