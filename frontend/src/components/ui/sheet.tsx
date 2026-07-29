"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  side?: "left" | "right" | "bottom";
  children: React.ReactNode;
}

export function Sheet({ isOpen, onClose, title, side = "right", children }: SheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const sideStyles = {
    right: "top-0 right-0 h-full w-full max-w-xs sm:max-w-md border-l animate-in slide-in-from-right duration-300",
    left: "top-0 left-0 h-full w-full max-w-xs sm:max-w-md border-r animate-in slide-in-from-left duration-300",
    bottom: "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl border-t animate-in slide-in-from-bottom duration-300",
  };

  const content = (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      {/* Sheet Content Panel */}
      <div
        className={cn(
          "relative w-full bg-slate-900 border-slate-800 shadow-2xl p-6 flex flex-col z-50 text-slate-100 overflow-y-auto h-full",
          sideStyles[side]
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <h3 className="text-lg font-bold text-slate-50">{title || "Menu"}</h3>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
