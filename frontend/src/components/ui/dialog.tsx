"use client";

import * as React from "react";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Dialog({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }: DialogProps) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          "w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto z-10 text-slate-100",
          maxWidth
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        {title && (
          <h2 className="text-xl font-bold text-slate-50 mb-4 pb-2 border-b border-slate-800 pr-8">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
