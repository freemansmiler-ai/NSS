"use client";

import { useState, useEffect } from "react";
import { UserSession } from "@/lib/auth";
import { PropertyData, INITIAL_PROPERTIES, INITIAL_LANDLORDS } from "@/lib/sample-data";
import { Badge } from "@/components/ui/badge";
import LandlordPostModal from "@/components/LandlordPostModal";
import {
  ShieldCheck,
  Users,
  Building2,
  Home,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  RefreshCw,
  ArrowLeft,
  Key,
  CreditCard,
  SlidersHorizontal,
  PlusCircle,
  UserCheck,
  UserPlus,
  ShieldAlert,
  Calendar,
  Lock,
  LogOut,
  X
} from "lucide-react";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  totalTenants: number;
  totalLandlords: number;
  totalAdmins: number;
  verifiedUsers: number;
  totalProperties: number;
  singleRooms: number;
  chamberAndHall: number;
  activeListings: number;
  paystackConfigured: boolean;
}

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<PropertyData[]>([]);

  const [activeTab, setActiveTab] = useState<"PROPERTIES" | "USERS" | "SYSTEM">("PROPERTIES");
  const [userSearch, setUserSearch] = useState("");
  const [propSearch, setPropSearch] = useState("");

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isPostRoomOpen, setIsPostRoomOpen] = useState(false);

  // Add User Form State
  const [newUserForm, setNewUserForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "password123",
    role: "TENANT",
    isVerified: true,
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState("");

  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      let meUser: UserSession | null = null;
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const contentType = meRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const meData = await meRes.json();
            meUser = meData.user || null;
          }
        }
      } catch {}

      if (!meUser || meUser.role !== "ADMIN") {
        setError("Access Denied. Administrator privileges required to access this dashboard.");
        setCurrentUser(meUser);
        setLoading(false);
        return;
      }
      setCurrentUser(meUser);

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("nss_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const statsRes = await fetch("/api/admin/stats", { headers });
        if (statsRes.ok) {
          const contentType = statsRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const statsData = await statsRes.json();
            setStats(statsData.stats);
            setUsers(statsData.users || []);
            setProperties(statsData.properties || []);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // Fallback data from API properties endpoint if stats route unavailable
      try {
        const propsRes = await fetch("/api/properties?includeInactive=true");
        if (propsRes.ok) {
          const propsData = await propsRes.json();
          if (propsData.properties && Array.isArray(propsData.properties)) {
            setProperties(propsData.properties);
          }
        }
      } catch {}
      setStats({
        totalUsers: INITIAL_LANDLORDS.length,
        totalTenants: 0,
        totalLandlords: INITIAL_LANDLORDS.length,
        totalAdmins: 1,
        verifiedUsers: INITIAL_LANDLORDS.length,
        totalProperties: INITIAL_PROPERTIES.length,
        singleRooms: INITIAL_PROPERTIES.filter(p => p.propertyType === "SINGLE_ROOM").length,
        chamberAndHall: INITIAL_PROPERTIES.filter(p => p.propertyType === "CHAMBER_AND_HALL").length,
        activeListings: INITIAL_PROPERTIES.filter(p => p.isActive).length,
        paystackConfigured: true,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      }
    } catch {}
  };

  const handleToggleVerifyUser = async (userId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: nextStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isVerified: nextStatus } : u))
        );
      }
    } catch {}
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user account from the system?")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {}
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user.");

      setUsers((prev) => [data.user, ...prev]);
      setIsAddUserOpen(false);
      setNewUserForm({
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "password123",
        role: "TENANT",
        isVerified: true,
      });
    } catch (err: any) {
      setAddUserError(err.message || "Failed to add user.");
    } finally {
      setAddUserLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(userSearch))
  );

  const filteredProperties = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(propSearch.toLowerCase()) ||
      p.generalArea.toLowerCase().includes(propSearch.toLowerCase()) ||
      p.exactGhanaPostGps.toLowerCase().includes(propSearch.toLowerCase())
  );

  const handleToggleDelistProperty = async (propertyId: string, currentActive: boolean) => {
    const nextStatus = !currentActive;
    const actionLabel = nextStatus ? "relist" : "delist";
    if (!confirm(`Are you sure you want to ${actionLabel} this property listing?`)) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nss_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (res.ok) {
        setProperties((prev) =>
          prev.map((p) => (p.id === propertyId ? { ...p, isActive: nextStatus } : p))
        );
      } else {
        const data = await res.json();
        alert(data.error || `Failed to ${actionLabel} property.`);
      }
    } catch (err: any) {
      alert(err.message || "Network error occurred.");
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to permanently delete this room listing from the database?")) return;

    // Optimistically remove from state for snappy UX response
    setProperties((prev) => prev.filter((p) => p.id !== propertyId));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nss_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete property.");
        // Reload data if server call failed
        loadAdminData();
      }
    } catch {
      // Keep optimistic delete applied locally
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold animate-pulse">Loading Admin Command Center...</p>
      </div>
    );
  }

  const handleAdminDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@nssdirectstay.gh",
          password: "password123",
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        setError("");
        await loadAdminData();
        return;
      }
    } catch {}
    setLoading(false);
  };

  if (error || !currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
        <p className="text-xs text-slate-400 max-w-md mb-6">
          {error || "Your account does not possess System Administrator privileges."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleAdminDemoLogin}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold hover:from-emerald-400 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign In as System Admin</span>
          </button>

          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold hover:bg-slate-800 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Main Platform</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white">NSS DirectStay Admin</span>
                <Badge variant="default" className="text-[10px] uppercase font-bold py-0.5">
                  Command Center
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">System Monitoring, User Verification & Moderation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPostRoomOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 transition shadow-lg shadow-emerald-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Room Free</span>
            </button>

            <button
              onClick={loadAdminData}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 transition"
            >
              <Home className="w-4 h-4 text-emerald-400" />
              <span>Main Platform</span>
            </Link>

            <div className="flex items-center gap-3 border-l border-slate-800 pl-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200">{currentUser.fullName}</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase">ADMINISTRATOR</span>
              </div>
              <button
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  try {
                    localStorage.removeItem("nss_user");
                    localStorage.removeItem("nss_token");
                  } catch {}
                  window.location.href = "/";
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition text-xs font-bold"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Platform Users</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">{users.length}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">
                {users.filter((u) => u.role === "TENANT").length} Tenants
              </span>
              <span>•</span>
              <span className="text-teal-400 font-semibold">
                {users.filter((u) => u.role === "LANDLORD").length} Landlords
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Verified Accounts</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">
              {users.filter((u) => u.isVerified).length}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold">
              Verified by Administrator
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Room Listings</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">{properties.length}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">
                {properties.filter((p) => p.propertyType === "SINGLE_ROOM").length} Single Rooms
              </span>
              <span>•</span>
              <span className="text-cyan-400 font-semibold">
                {properties.filter((p) => p.propertyType === "CHAMBER_AND_HALL").length} Chamber & Hall
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Paystack Gateway</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-base font-bold text-white">GH₵ 30.00 / 90 Days</p>
            </div>
            <p className="text-[11px] text-slate-400">93-Day Auto Delist Enforced</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-md">
          <button
            onClick={() => setActiveTab("USERS")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === "USERS"
                ? "bg-slate-800 text-emerald-400 shadow-md border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manage Users ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("PROPERTIES")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === "PROPERTIES"
                ? "bg-slate-800 text-emerald-400 shadow-md border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Room Listings ({properties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("SYSTEM")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === "SYSTEM"
                ? "bg-slate-800 text-emerald-400 shadow-md border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>System Rules</span>
          </button>
        </div>

        {/* Tab 1: Users Management & Verification Table */}
        {activeTab === "USERS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search users by name, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() => setIsAddUserOpen(!isAddUserOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add New User</span>
              </button>
            </div>

            {/* Inline Add User Form Modal Card */}
            {isAddUserOpen && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <UserPlus className="w-4 h-4" />
                    <span>Add New User (Tenant, Landlord, or Admin)</span>
                  </div>
                  <button
                    onClick={() => setIsAddUserOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {addUserError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                    {addUserError}
                  </div>
                )}

                <form onSubmit={handleCreateUserSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ama Serwaa"
                      value={newUserForm.fullName}
                      onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+233240000000"
                      value={newUserForm.phoneNumber}
                      onChange={(e) => setNewUserForm({ ...newUserForm, phoneNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">User Role *</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="TENANT">TENANT</option>
                      <option value="LANDLORD">LANDLORD</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="password123"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={addUserLoading}
                      className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs hover:from-emerald-400 transition"
                    >
                      {addUserLoading ? "Creating..." : "Save New User"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">User Details</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Admin Verification</th>
                      <th className="p-4">Change Role</th>
                      <th className="p-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredUsers.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <p className="font-bold text-slate-100">{usr.fullName}</p>
                          <p className="text-slate-400 text-[11px]">{usr.email}</p>
                        </td>
                        <td className="p-4 text-slate-300 font-mono">{usr.phoneNumber || "N/A"}</td>
                        <td className="p-4">
                          <Badge
                            variant={
                              usr.role === "ADMIN"
                                ? "destructive"
                                : usr.role === "LANDLORD"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {usr.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Badge variant={usr.isVerified ? "default" : "outline"} className="py-0.5">
                              {usr.isVerified ? "Verified" : "Unverified"}
                            </Badge>
                            <button
                              onClick={() => handleToggleVerifyUser(usr.id, Boolean(usr.isVerified))}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                usr.isVerified
                                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
                              }`}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{usr.isVerified ? "Unverify" : "Verify User"}</span>
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={usr.role}
                            onChange={(e) => handleUpdateUserRole(usr.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="TENANT">TENANT</option>
                            <option value="LANDLORD">LANDLORD</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(usr.id)}
                            className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Properties Management Table */}
        {activeTab === "PROPERTIES" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search properties, area, GhanaPostGPS..."
                  value={propSearch}
                  onChange={(e) => setPropSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() => setIsPostRoomOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 transition shadow-md shadow-emerald-500/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ List Room Free (Admin)</span>
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Property</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Monthly Rent</th>
                      <th className="p-4">GhanaPostGPS</th>
                      <th className="p-4">Tag</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Admin Moderation</th>
                      <th className="p-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredProperties.map((prop) => (
                      <tr key={prop.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-bold text-slate-100 flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={(prop.images && prop.images.length > 0 && prop.images[0]) ? prop.images[0] : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80"}
                            alt={prop.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80";
                            }}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
                          />
                          <span className="line-clamp-1">{prop.title}</span>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-800 px-2 py-1 rounded text-[11px] font-medium">
                            {prop.propertyType === "SINGLE_ROOM" ? "Single Room" : "Chamber & Hall"}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-emerald-400">GH₵ {prop.pricePerMonth}</td>
                        <td className="p-4 font-mono font-bold text-slate-300">{prop.exactGhanaPostGps}</td>
                        <td className="p-4">
                          {prop.isNewlyListed ? (
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-lg">
                              ✨ Newly Listed
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Standard</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge variant={prop.isActive ? "default" : "secondary"}>
                            {prop.isActive ? "Active (Listed)" : "Delisted"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleDelistProperty(prop.id, Boolean(prop.isActive))}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                              prop.isActive
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{prop.isActive ? "Delist Room" : "Relist Room"}</span>
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteProperty(prop.id)}
                            className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition"
                            title="Permanently Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: System Environment Config & Business Rules */}
        {activeTab === "SYSTEM" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Paystack Payment Gateway Config</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Public Key:</span>
                  <span className="font-mono text-emerald-400 font-bold truncate max-w-[200px]">
                    pk_test_e58c19239890c021e8d0f7b6ded1cc22d4fa7982
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Landlord Listing Fee:</span>
                  <span className="font-bold text-white">GH₵ 30.00 per room</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Admin Listing Fee:</span>
                  <span className="font-bold text-emerald-400">FREE (GH₵ 0.00)</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>90-Day Listing & 93-Day Delisting Policy</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active Room Availability:</span>
                  <span className="font-bold text-emerald-400">90 Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Landlord Renewal Fee:</span>
                  <span className="font-bold text-white">GH₵ 30.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Automatic Database Delisting:</span>
                  <span className="font-bold text-rose-400">Past 93 Days</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <LandlordPostModal
        isOpen={isPostRoomOpen}
        onClose={() => setIsPostRoomOpen(false)}
        onSuccess={() => loadAdminData()}
        currentUser={currentUser}
      />
    </div>
  );
}
