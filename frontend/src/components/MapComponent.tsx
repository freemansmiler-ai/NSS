"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PropertyData } from "@/lib/sample-data";
import { Coordinates } from "@/lib/haversine";
import { ExternalLink, Phone, MapPin } from "lucide-react";

interface MapProps {
  properties: PropertyData[];
  selectedProperty?: PropertyData | null;
  workplaceCoord?: Coordinates | null;
  onSelectProperty?: (property: PropertyData) => void;
  center?: [number, number];
  zoom?: number;
}

// Custom Leaflet DivIcon for property pins
function createCustomIcon(price: number, isSelected: boolean, type: string) {
  const isChamber = type === "CHAMBER_AND_HALL";
  const bgGradient = isSelected
    ? "from-emerald-600 to-teal-700 text-white shadow-xl scale-110 border-2 border-white ring-4 ring-emerald-500/30"
    : isChamber
    ? "from-indigo-600 to-blue-700 text-white shadow-lg border border-white/40"
    : "from-slate-900 to-emerald-950 text-emerald-400 border border-emerald-500/40 shadow-md";

  return L.divIcon({
    className: "custom-leaflet-pin",
    html: `
      <div class="bg-gradient-to-r ${bgGradient} px-2.5 py-1 rounded-full font-bold text-xs flex items-center gap-1 transition-all transform hover:scale-105 cursor-pointer whitespace-nowrap">
        <span>GH₵ ${price}</span>
      </div>
    `,
    iconSize: [80, 30],
    iconAnchor: [40, 15],
  });
}

// Custom Leaflet DivIcon for workplace target pin
function createWorkplaceIcon(name: string) {
  return L.divIcon({
    className: "custom-workplace-pin",
    html: `
      <div class="bg-amber-500 text-slate-950 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-xl border-2 border-white animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
        <span class="truncate max-w-[120px]">${name}</span>
      </div>
    `,
    iconSize: [140, 32],
    iconAnchor: [70, 16],
  });
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({
  properties,
  selectedProperty,
  workplaceCoord,
  onSelectProperty,
  center = [5.64, -0.17],
  zoom = 12,
}: MapProps) {
  const currentCenter = selectedProperty
    ? [selectedProperty.latitude, selectedProperty.longitude] as [number, number]
    : center;

  return (
    <div className="w-full h-full min-h-[350px] rounded-2xl overflow-hidden shadow-inner border border-slate-800 relative z-0">
      <MapContainer
        center={currentCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ height: "100%", width: "100%" }}
      >
        <ChangeView center={currentCenter} zoom={zoom} />
        
        {/* OpenStreetMap dark/emerald friendly tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Workplace Pin */}
        {workplaceCoord && (
          <Marker
            position={[workplaceCoord.latitude, workplaceCoord.longitude]}
            icon={createWorkplaceIcon("Workplace")}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-slate-900 font-sans">
                <p className="font-bold text-xs uppercase tracking-wider text-amber-600">Your NSP Workplace</p>
                <p className="text-sm font-semibold text-slate-800">Target Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Properties Pins */}
        {properties.map((property) => {
          const isSelected = selectedProperty?.id === property.id;
          return (
            <Marker
              key={property.id}
              position={[property.latitude, property.longitude]}
              icon={createCustomIcon(property.pricePerMonth, isSelected, property.propertyType)}
              eventHandlers={{
                click: () => onSelectProperty?.(property),
              }}
            >
              <Popup className="custom-popup">
                <div className="w-64 p-1 font-sans text-slate-950">
                  <div className="h-28 w-full rounded-lg overflow-hidden mb-2 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                      GH₵ {property.pricePerMonth} / mo
                    </div>
                  </div>
                  <h4 className="font-bold text-sm leading-tight text-slate-900 line-clamp-1">
                    {property.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{property.generalArea}</span>
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                      {property.exactGhanaPostGps}
                    </span>
                    <a
                      href={`https://wa.me/${property.contactWhatsapp}?text=${encodeURIComponent(
                        `Hello, I saw your room listing "${property.title}" on NSS DirectStay. Is it still available?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition"
                    >
                      <Phone className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
