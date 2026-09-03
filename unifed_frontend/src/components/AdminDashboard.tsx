import { useState, useEffect } from "react";
import type { User, AuditLog } from "../types";
import { CampusDatabase } from "../services/api"; // ✅ Changed from mockData
import { UniversityTopBar, AcademicFooter } from "./UniversityHeader";
import { SmartClearancePortal } from "./SmartClearancePortal";
import { SmartCampusFacilities } from "./SmartCampusFacilities";
import { SmartCampusAlerts } from "./SmartCampusAlerts";
import CampusMediaBroadcast from "./CampusMediaBroadcast";
import { Users, List, Activity, ShieldCheck, Cpu, Radio, Video } from "lucide-react";

export function AdminDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"users" | "audit" | "health" | "facilities" | "alerts" | "clearance" | "media">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<any>("STUDENT");

  useEffect(() => {
    loadData();
  }, []);

  // ✅ FIXED: Async data loading
  const loadData = async () => {
    try {
      const [usersData, logsData] = await Promise.all([
        CampusDatabase.getUsers(),
        CampusDatabase.getAuditLogs(),
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setAuditLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error("Failed to load admin data:", error);
      setUsers([]);
      setAuditLogs([]);
    }
  };

  // ✅ FIXED: Async add user
  const handleAddUser = async () => {
    if (!newUserFullName || !newUserEmail) {
      alert("Please fill in all user profile details.");
      return;
    }

    const newUserObj: User = {
      id: "U_NEW_" + Date.now(),
      username: newUserEmail.split("@")[0],
      fullName: newUserFullName,
      email: newUserEmail,
      role: newUserRole,
      isActive: true,
      studentId: newUserRole === "STUDENT" ? "MAU140" + Math.floor(Math.random() * 9000 + 1000) : undefined,
      instructorId: newUserRole === "INSTRUCTOR" ? "INST" + Math.floor(Math.random() * 900 + 100) : undefined,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    };

    try {
      const updatedUsers = [...users, newUserObj];
      await CampusDatabase.saveUsers(updatedUsers);
      setUsers(updatedUsers);

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "ADMIN",
        "Create User Account",
        "User",
        newUserObj.id,
        `Provisioned new user account: ${newUserFullName} with role ${newUserRole}`
      );

      alert(`Successfully created user: ${newUserFullName}`);
      setNewUserFullName("");
      setNewUserEmail("");
      await loadData();
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user. Please try again.");
    }
  };

  // ✅ FIXED: Async toggle user status
  const toggleUserStatus = async (userId: string) => {
    try {
      const updatedUsers = users.map((u) => {
        if (u.id === userId) {
          return { ...u, isActive: !u.isActive };
        }
        return u;
      });
      await CampusDatabase.saveUsers(updatedUsers);
      setUsers(updatedUsers);
      alert("User status updated successfully!");
    } catch (error) {
      console.error("Failed to toggle user status:", error);
      alert("Failed to update user status. Please try again.");
    }
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
      />

      <div className="flex-1 flex">
        <aside className="w-64 bg-[#071526] text-slate-300 flex flex-col border-r border-slate-800/80">
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest">
              ICT Administration
            </span>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "users"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>User Directory</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "audit"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <List className="w-4 h-4 text-amber-400" />
              <span>Audit Trail Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "health"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Telemetry & Health</span>
            </button>

            <div className="pt-3 pb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Smart Operations
              </span>
            </div>

            <button
              onClick={() => setActiveTab("clearance")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "clearance"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Clearance Overseer</span>
            </button>

            <button
              onClick={() => setActiveTab("facilities")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "facilities"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Campus Facilities</span>
            </button>

            <button
              onClick={() => setActiveTab("alerts")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "alerts"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Radio className="w-4 h-4 text-red-400" />
              <span>Broadcast Alerts</span>
            </button>

            <button
              onClick={() => setActiveTab("media")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "media"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Video className="w-4 h-4 text-amber-400" />
              <span>Video & Media Screen</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <p>Admin Root: <span className="text-amber-400">ICT-MAU-01</span></p>
            <p>SSL Mode: TLS 1.3 Strict</p>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
                  <h3 className="font-display font-bold text-slate-800 text-base">Provision New Account</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium">User Full Name</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 font-semibold"
                        placeholder="e.g. Martha Kebede"
                        value={newUserFullName}
                        onChange={(e) => setNewUserFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium">University Email Address</label>
                      <input
                        type="email"
                        className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 font-mono"
                        placeholder="martha@mau.edu.et"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium">Assigned System Role</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg p-2.5 mt-1 bg-white font-medium"
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
                    <button onClick={handleAddUser} className="w-full bg-primary hover:bg-primary-600 text-white py-2.5 rounded-lg font-semibold transition mt-2">
                      Create User Account
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-slate-800 text-base">Active Directory</h3>
                  <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-2 space-y-2">
                    {users.map((u) => (
                      <div key={u.id} className="py-2.5 first:pt-0 flex justify-between items-center text-xs md:text-sm">
                        <div>
                          <strong className="text-slate-800 text-sm">{u.fullName}</strong>
                          <p className="text-xs text-slate-500 font-mono">{u.email} • Role: {u.role}</p>
                        </div>
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            u.isActive ? "bg-emerald-50 text-success hover:bg-emerald-100" : "bg-red-50 text-danger hover:bg-red-100"
                          }`}
                        >
                          {u.isActive ? "Active" : "Disabled"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-6">
              <h3 className="text-xl font-display font-bold text-slate-900">Infrastructure Audit Trail</h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-mono text-xs">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="p-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-4 font-semibold text-slate-800">{log.userName}</td>
                        <td className="p-4">{log.userRole}</td>
                        <td className="p-4 text-primary font-bold">{log.action}</td>
                        <td className="p-4 text-slate-500">{log.ipAddress}</td>
                        <td className="p-4 text-slate-600 font-sans">{log.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "health" && (
            <div className="space-y-6">
              <h3 className="text-xl font-display font-bold text-slate-900">Virtual Infrastructure Telemetry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 text-white rounded-xl p-6 space-y-2 border border-slate-800 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Node Processor Load</span>
                  <div className="flex justify-between items-center">
                    <strong className="text-2xl font-display font-bold font-mono">14.2%</strong>
                    <span className="text-xs text-success font-mono font-bold">● Nominal</span>
                  </div>
                </div>
                <div className="bg-slate-900 text-white rounded-xl p-6 space-y-2 border border-slate-800 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Memory Pool Allocation</span>
                  <div className="flex justify-between items-center">
                    <strong className="text-2xl font-display font-bold font-mono">3.4 GB / 8 GB</strong>
                    <span className="text-xs text-success font-mono font-bold">● Healthy</span>
                  </div>
                </div>
                <div className="bg-slate-900 text-white rounded-xl p-6 space-y-2 border border-slate-800 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">API Ingress Frequency</span>
                  <div className="flex justify-between items-center">
                    <strong className="text-2xl font-display font-bold font-mono">22 req/m</strong>
                    <span className="text-xs text-success font-mono font-bold">● Nominal</span>
                  </div>
                </div>
                <div className="bg-slate-900 text-white rounded-xl p-6 space-y-2 border border-slate-800 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Service Ingress Routing</span>
                  <div className="flex justify-between items-center">
                    <strong className="text-2xl font-display font-bold font-mono">Nginx port 3000</strong>
                    <span className="text-xs text-success font-mono font-bold">● Bound</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "clearance" && (
            <div className="space-y-6">
              <SmartClearancePortal user={user} isOfficerMode={true} />
            </div>
          )}

          {activeTab === "facilities" && (
            <div className="space-y-6">
              <SmartCampusFacilities user={user} />
            </div>
          )}

          {activeTab === "alerts" && (
            <div className="space-y-6">
              <SmartCampusAlerts user={user} />
            </div>
          )}

          {activeTab === "media" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <CampusMediaBroadcast />
              </div>
            </div>
          )}
        </main>
      </div>

      <AcademicFooter />
    </div>
  );
}
