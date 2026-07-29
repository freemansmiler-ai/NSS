"use client";

import { useState } from "react";
import { UserSession } from "@/lib/auth";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Headphones,
  MessageSquare,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  X
} from "lucide-react";

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserSession | null;
  defaultSubject?: string;
}

export default function ContactSupportModal({
  isOpen,
  onClose,
  user,
  defaultSubject = "Support Request regarding Room Listing or Payment",
}: ContactSupportModalProps) {
  const [senderName, setSenderName] = useState(user?.fullName || "");
  const [senderEmail, setSenderEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const supportPhone = "0557208794";
  const internationalPhone = "+233557208794";
  const supportEmail = "freemanasses@gmail.com";

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const emailSubject = encodeURIComponent(subject || "NSS DirectStay Support Request");
    const emailBody = encodeURIComponent(
      `Name: ${senderName || "User"}\nEmail: ${senderEmail || "N/A"}\nPhone/Role: ${user?.role || "User"}\n\nMessage:\n${message}`
    );

    const mailtoUrl = `mailto:${supportEmail}?subject=${emailSubject}&body=${emailBody}`;
    window.open(mailtoUrl, "_blank");

    setSentNotice("Email client opened! Your message has been prepared for freemanasses@gmail.com");
    setTimeout(() => {
      setSentNotice(null);
      setMessage("");
    }, 4000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello NSS DirectStay Support! I need help with room listings or payment. (User: ${user?.fullName || "Guest"})`
  );
  const whatsappUrl = `https://wa.me/${internationalPhone.replace("+", "")}?text=${whatsappMessage}`;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold">
                <Headphones className="w-3.5 h-3.5" />
                <span>24/7 Live Support</span>
              </Badge>
            </div>
            <h2 className="text-xl font-extrabold text-white">Contact Customer Support</h2>
            <p className="text-xs text-slate-400 mt-1">
              Need assistance with room listings, Paystack payments, or account verification? Reach out directly via WhatsApp, direct phone call, or email.
            </p>
          </div>
        </div>

        {/* Support Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* WhatsApp Chat Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/40 transition flex items-center gap-3.5 group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 group-hover:scale-105 transition">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300">WhatsApp Chat</p>
              <p className="text-[11px] text-slate-400 font-mono">{supportPhone}</p>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">Fastest Response →</span>
            </div>
          </a>

          {/* Direct Phone Call Button */}
          <a
            href={`tel:${supportPhone}`}
            className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/40 hover:bg-teal-900/40 transition flex items-center gap-3.5 group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30 group-hover:scale-105 transition">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-300">Direct Phone Line</p>
              <p className="text-[11px] text-slate-400 font-mono">{supportPhone}</p>
              <span className="text-[10px] text-teal-400 font-semibold uppercase">Tap to Call Now →</span>
            </div>
          </a>
        </div>

        {/* Email Support Form */}
        <form onSubmit={handleSendEmail} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Send Direct Email to Support</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
              {supportEmail}
            </span>
          </div>

          {sentNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{sentNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Your Name</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Your Email</label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Issue with Paystack payment or listing renewal"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">How can we help you?</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or inquiry in detail..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-500 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
            <span>Send Email to freemanasses@gmail.com</span>
          </button>
        </form>

        {/* Footer actions */}
        <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official NSS DirectStay Support</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
