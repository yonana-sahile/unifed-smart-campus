import { useState, useEffect, useMemo } from "react";
import type { User, AuditLog } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter } from "./UniversityHeader";
import { SmartClearancePortal } from "./SmartClearancePortal";
import { SmartCampusFacilities } from "./SmartCampusFacilities";
import { SmartCampusAlerts } from "./SmartCampusAlerts";
import CampusMediaBroadcast from "./CampusMediaBroadcast";
import {
  Users,
  List,
  Activity,
  ShieldCheck,
  Cpu,
  Radio,
  Video,
  X,
  Search,
  Plus,
  RefreshCw,
  Check,
  TrendingUp,
  Server,
  Database,
  Zap,
  Shield,
  UserPlus,
  Power,
  AlertCircle,
  Clock,
  HardDrive,
  Wifi,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Tab = "users" | "audit" | "health" | "facilities" | "alerts" | "clearance" | "media";

export function AdminDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New user form
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<any>("STUDENT");
  const [creatingUser, setCreatingUser] = useState(false);

  // Search
  const [userSearch, setUserSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, logsData] = await Promise.all([
        CampusDatabase.getUsers().catch(() => []),
        CampusDatabase.getAuditLogs().catch(() => []),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setAuditLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: uses POST /api/users/ instead of PUT /api/users/
  const handleAddUser = async () => {
    if (!newUserFullName || !newUserEmail) {
      alert("Please fill in all user profile details.");
      return;
    }

    setCreatingUser(true);

    const payload: any = {
      username: newUserEmail.split("@")[0],
      email: newUserEmail,
      full_name: newUserFullName,
      role: newUserRole,
      is_active: true,
      password: "password",
    };

    if (newUserRole === "STUDENT") {
      payload.student_id = "MAU140" + Math.floor(Math.random() * 9000 + 1000);
    }
    if (newUserRole === "INSTRUCTOR") {
      payload.instructor_id = "INST" + Math.floor(Math.random() * 900 + 100);
    }

    try {
      const created: any = await CampusDatabase.addUser(payload);

      const newUserObj: User = created?.id
        ? created
        : {
            id: "U_NEW_" + Date.now(),
            username: payload.username,
            fullName: newUserFullName,
            email: newUserEmail,
            role: newUserRole,
            isActive: true,
            studentId: payload.student_id,
            instructorId: payload.instructor_id,
            avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          };

      setUsers((prev) => [...prev, newUserObj]);

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "ADMIN",
        "Create User Account",
        "User",
        String(newUserObj.id),
        `Provisioned new user account: ${newUserFullName} with role ${newUserRole}`
      );

      alert(`Successfully created user: ${newUserFullName}`);
      setNewUserFullName("");
      setNewUserEmail("");
      await loadData();
    } catch (error: any) {
      console.error("Failed to create user:", error);
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      alert("Failed to create user: " + detail);
    } finally {
      setCreatingUser(false);
    }
  };

  // ✅ FIXED: uses PATCH /api/users/{id}/ instead of PUT /api/users/
  const toggleUserStatus = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    try {
      const numericId = String(userId).replace(/^U_/, "");
      await CampusDatabase.patchUser(numericId, {
        is_active: !target.isActive,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
      );

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "ADMIN",
        target.isActive ? "Disable User" : "Enable User",
        "User",
        userId,
        `${target.isActive ? "Disabled" : "Enabled"} account: ${target.fullName}`
      );
    } catch (error: any) {
      console.error("Failed to toggle user status:", error);
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      alert("Failed to update user status: " + detail);
    }
  };

  // ---------- DERIVED STATS ----------
  const stats = useMemo(() => {
    const active = users.filter((u) => u.isActive).length;
    const disabled = users.length - active;
    const byRole: Record<string, number> = {};
    users.forEach((u) => {
      byRole[u.role] = (byRole[u.role] ?? 0) + 1;
    });
    return { total: users.length, active, disabled, byRole };
  }, [users]);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(
    (log) =>
      log.userName?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.description?.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const navItems: { id: Tab; label: string; shortLabel: string; Icon: typeof Users }[] = [
    { id: "users", label: "User Directory", shortLabel: "Users", Icon: Users },
    { id: "audit", label: "Audit Trail Ledger", shortLabel: "Audit", Icon: List },
    { id: "health", label: "Telemetry & Health", shortLabel: "Telemetry", Icon: Activity },
    { id: "clearance", label: "Clearance Overseer", shortLabel: "Clearance", Icon: ShieldCheck },
    { id: "facilities", label: "Campus Facilities", shortLabel: "Facilities", Icon: Cpu },
    { id: "alerts", label: "Broadcast Alerts", shortLabel: "Alerts", Icon: Radio },
    { id: "media", label: "Video & Media Screen", shortLabel: "Media", Icon: Video },
  ];

  const goToTab = (id: string) => {
    setActiveTab(id as Tab);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="admin_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="Central ICT & System Administration Directorate"
        portalSubtitle="Infrastructure Security, RBAC Provisioning & Server Telemetry"
        badgeText="SYSTEMS ADMIN"
        badgeType="admin"
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        isMobileNavOpen={isMobileNavOpen}
      />

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#071526] text-slate-300 shadow-2xl flex flex-col border-r border-slate-800 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
                    <p className="text-[10px] font-mono text-amber-400 font-bold">SYSTEMS ADMIN</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3 flex-1 overflow-y-auto space-y-1">
                <div className="pb-1 px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    ICT Administration
                  </span>
                </div>
                {navItems.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => goToTab(id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                      activeTab === id
                        ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${id === "alerts" ? "text-red-400" : "text-amber-400"}`} />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400">
                <p>Admin Root: <span className="text-amber-400">ICT-MAU-01</span></p>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                  SSL Mode: TLS 1.3 Strict
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE QUICK-NAV */}
      <div className="md:hidden sticky top-[48px] sm:top-[57px] z-30 bg-[#071526] border-b border-slate-800/90 px-2 py-1.5 overflow-x-auto flex items-center space-x-1.5 shadow-md shrink-0 scrollbar-none">
        {navItems.map(({ id, shortLabel, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 active:scale-95 ${
              activeTab === id
                ? "bg-primary text-white border border-amber-400/40 shadow-xs"
                : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${activeTab === id ? "text-amber-300" : "text-amber-400/80"}`} />
            <span>{shortLabel}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex min-w-0">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex md:w-64 bg-[#071526] text-slate-300 flex-col border-r border-slate-800/80 shrink-0">
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
              <p className="text-[10px] font-mono text-amber-400 font-bold">SYSTEMS ADMIN</p>
            </div>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            <div className="pb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                ICT Administration
              </span>
            </div>
            {navItems.slice(0, 3).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  activeTab === id
                    ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 text-amber-400" />
                <span>{label}</span>
              </button>
            ))}

            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Smart Operations
              </span>
            </div>
            {navItems.slice(3).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  activeTab === id
                    ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${id === "alerts" ? "text-red-400" : "text-amber-400"}`} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <p>Admin Root: <span className="text-amber-400">ICT-MAU-01</span></p>
            <p>SSL Mode: TLS 1.3 Strict</p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
              Uptime: 99.98%
            </p>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {/* HERO */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#071526] via-[#0b2136] to-[#0d2942]">
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-20 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative px-4 sm:px-6 md:px-8 pt-8 pb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-[11px] font-mono font-bold text-amber-300 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ALL SYSTEMS NOMINAL • UPTIME 99.98%</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white tracking-tight leading-tight">
                    ICT Command Center
                  </h1>
                  <p className="text-slate-300/90 text-sm max-w-2xl leading-relaxed">
                    Full control over user provisioning, audit trails, infrastructure telemetry,
                    and campus-wide services — everything admins need, in one console.
                  </p>
                </div>

                <motion.button
                  onClick={loadData}
                  disabled={loading}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="self-start inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white text-xs font-bold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  <span>{loading ? "Syncing…" : "Sync Data"}</span>
                </motion.button>
              </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-50 rounded-t-[3rem]" />
          </div>

          {/* FLOATING STAT CARDS */}
          <div className="px-4 sm:px-6 md:px-8 -mt-16 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Accounts"
                value={String(stats.total)}
                sub={`${Object.keys(stats.byRole).length} roles in use`}
                accent="from-blue-500 to-indigo-600"
                delay={0.05}
              />
              <StatCard
                icon={Check}
                label="Active Users"
                value={String(stats.active)}
                sub="Currently enabled"
                accent="from-emerald-500 to-teal-600"
                delay={0.1}
              />
              <StatCard
                icon={Power}
                label="Disabled"
                value={String(stats.disabled)}
                sub="Suspended accounts"
                accent="from-amber-500 to-orange-600"
                delay={0.15}
              />
              <StatCard
                icon={List}
                label="Audit Events"
                value={String(auditLogs.length)}
                sub="Total log entries"
                accent="from-violet-500 to-purple-600"
                delay={0.2}
              />
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8 py-8 space-y-8">
            <AnimatePresence mode="wait">
              {/* ==================== USERS ==================== */}
              {activeTab === "users" && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Provision form */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 h-fit">
                    <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                        <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-slate-900">
                          Provision New Account
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Create a new university user
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-xl p-3 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          placeholder="e.g. Martha Kebede"
                          value={newUserFullName}
                          onChange={(e) => setNewUserFullName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1.5">
                          University Email
                        </label>
                        <input
                          type="email"
                          className="w-full border border-slate-200 rounded-xl p-3 font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          placeholder="martha@mau.edu.et"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1.5">
                          Assigned System Role
                        </label>
                        <select
                          className="w-full border border-slate-200 rounded-xl p-3 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as any)}
                        >
                          <option value="STUDENT">Student</option>
                          <option value="INSTRUCTOR">Instructor Faculty</option>
                          <option value="REGISTRAR">Registrar Staff</option>
                          <option value="DEPARTMENT_HEAD">Department Head</option>
                          <option value="DEAN">College Dean</option>
                          <option value="ADMIN">System Administrator</option>
                        </select>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddUser}
                        disabled={creatingUser}
                        className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {creatingUser ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Creating…</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Create User Account</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* User list */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-display font-bold text-slate-900">Active Directory</h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {filteredUsers.length} of {users.length} accounts
                        </p>
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search users…"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-1 space-y-2">
                      {filteredUsers.map((u) => (
                        <motion.div
                          key={u.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="py-3 first:pt-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {u.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <strong className="text-slate-800 text-sm block truncate">
                                {u.fullName}
                              </strong>
                              <p className="text-[11px] text-slate-500 font-mono truncate">
                                {u.email}
                              </p>
                              <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {u.role}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold self-start sm:self-center shrink-0 flex items-center space-x-1.5 transition ${
                              u.isActive
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.isActive ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            <span>{u.isActive ? "Active" : "Disabled"}</span>
                          </button>
                        </motion.div>
                      ))}

                      {filteredUsers.length === 0 && (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          No users match your search.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ==================== AUDIT ==================== */}
              {activeTab === "audit" && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-slate-900">
                        Infrastructure Audit Trail
                      </h2>
                      <p className="text-sm text-slate-500">
                        {auditLogs.length} recorded events • real-time ledger
                      </p>
                    </div>
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search logs…"
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs md:text-sm min-w-[900px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Action</th>
                            <th className="p-4">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredAuditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/60 transition">
                              <td className="p-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                                <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="p-4 font-semibold text-slate-800">
                                {log.userName}
                              </td>
                              <td className="p-4">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {log.userRole}
                                </span>
                              </td>
                              <td className="p-4 text-primary font-bold font-mono text-[11px]">
                                {log.action}
                              </td>
                              <td className="p-4 text-slate-600 text-xs">{log.description}</td>
                            </tr>
                          ))}
                          {filteredAuditLogs.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-12 text-center text-slate-400 text-sm">
                                No audit events found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ==================== HEALTH ==================== */}
              {activeTab === "health" && (
                <motion.div
                  key="health"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900">
                      Virtual Infrastructure Telemetry
                    </h2>
                    <p className="text-sm text-slate-500">
                      Live system health metrics for all core services
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <HealthCard
                      icon={Zap}
                      label="Processor Load"
                      value="14.2%"
                      status="Nominal"
                      statusType="ok"
                      accent="from-blue-500 to-indigo-600"
                    />
                    <HealthCard
                      icon={HardDrive}
                      label="Memory Pool"
                      value="3.4 / 8 GB"
                      status="Healthy"
                      statusType="ok"
                      accent="from-emerald-500 to-teal-600"
                    />
                    <HealthCard
                      icon={Wifi}
                      label="API Ingress"
                      value="22 req/min"
                      status="Nominal"
                      statusType="ok"
                      accent="from-amber-500 to-orange-600"
                    />
                    <HealthCard
                      icon={Server}
                      label="Ingress Router"
                      value="Nginx :3000"
                      status="Bound"
                      statusType="ok"
                      accent="from-violet-500 to-purple-600"
                    />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center space-x-2">
                      <Database className="w-5 h-5 text-primary" />
                      <h3 className="font-display font-bold text-slate-900">
                        Service Status Overview
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <ServiceRow name="PostgreSQL Primary" status="Online" uptime="99.99%" />
                      <ServiceRow name="Redis Cache Layer" status="Online" uptime="99.98%" />
                      <ServiceRow name="Django API (Gunicorn)" status="Online" uptime="99.97%" />
                      <ServiceRow name="React Frontend (Nginx)" status="Online" uptime="100.00%" />
                      <ServiceRow name="Groq AI Bridge" status="Online" uptime="99.95%" />
                      <ServiceRow name="Zoom Integration" status="Online" uptime="99.91%" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 shadow-sm flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-emerald-900 text-lg">
                        All Systems Operational
                      </h3>
                      <p className="text-sm text-emerald-800/80 mt-1">
                        Every core service is responding within normal parameters. No incidents
                        reported in the last 24 hours. TLS 1.3 enforced across all endpoints.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ==================== CLEARANCE ==================== */}
              {activeTab === "clearance" && (
                <motion.div
                  key="clearance"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                >
                  <SmartClearancePortal user={user} isOfficerMode={true} />
                </motion.div>
              )}

              {/* ==================== FACILITIES ==================== */}
              {activeTab === "facilities" && (
                <motion.div
                  key="facilities"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                >
                  <SmartCampusFacilities user={user} />
                </motion.div>
              )}

              {/* ==================== ALERTS ==================== */}
              {activeTab === "alerts" && (
                <motion.div
                  key="alerts"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                >
                  <SmartCampusAlerts user={user} />
                </motion.div>
              )}

              {/* ==================== MEDIA ==================== */}
              {activeTab === "media" && (
                <motion.div
                  key="media"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                    <CampusMediaBroadcast />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AcademicFooter />
    </div>
  );
}

/* ==================== SUB-COMPONENTS ==================== */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delay = 0,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub: string;
  accent: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="relative bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/40 p-5 overflow-hidden"
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${accent} opacity-10 rounded-full blur-2xl -mr-10 -mt-10`}
      />
      <div className="relative space-y-3">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            {label}
          </span>
          <strong className="block text-2xl font-display font-bold text-slate-900 mt-1">
            {value}
          </strong>
          <span className="block text-[11px] text-slate-500 mt-0.5">{sub}</span>
        </div>
      </div>
    </motion.div>
  );
}

function HealthCard({
  icon: Icon,
  label,
  value,
  status,
  statusType,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  status: string;
  statusType: "ok" | "warning" | "error";
  accent: string;
}) {
  const statusColor =
    statusType === "ok"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : statusType === "warning"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg overflow-hidden relative"
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accent} opacity-20 rounded-full blur-2xl -mr-8 -mt-8`}
      />
      <div className="relative space-y-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">
            {label}
          </span>
          <strong className="block text-xl font-display font-bold font-mono mt-1">
            {value}
          </strong>
        </div>
        <span
          className={`inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusColor}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          <span>{status}</span>
        </span>
      </div>
    </motion.div>
  );
}

function ServiceRow({
  name,
  status,
  uptime,
}: {
  name: string;
  status: string;
  uptime: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center space-x-3">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm font-medium text-slate-700">{name}</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          {status}
        </span>
        <span className="text-xs font-mono text-slate-500 w-16 text-right">{uptime}</span>
      </div>
    </div>
  );
}