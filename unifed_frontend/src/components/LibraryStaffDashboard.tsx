import { useState, useEffect, FormEvent, useMemo } from "react";
import type { User, LibraryResource } from "../types";
import { CampusDatabase } from "../services/api";
import { UniversityTopBar, AcademicFooter } from "./UniversityHeader";
import {
  BookOpen,
  Video,
  FileText,
  Upload,
  Search,
  Download,
  BarChart2,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  HardDrive,
  Users,
  Clock,
  Layers,
  X,
  RefreshCw,
  TrendingUp,
  Award,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Tab = "catalog" | "upload" | "analytics" | "reports";

export function LibraryStaffDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("catalog");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newIsbn, setNewIsbn] = useState("");
  const [newCategory, setNewCategory] = useState<any>("Software Engineering");
  const [newResourceType, setNewResourceType] = useState<any>("BOOK");
  const [newAccessLevel, setNewAccessLevel] = useState<any>("PUBLIC");
  const [newDescription, setNewDescription] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  const [previewResource, setPreviewResource] = useState<LibraryResource | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await CampusDatabase.getLibraryResources();
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load library resources:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------- STATS ----------
  const stats = useMemo(() => {
    const total = resources.length;
    const books = resources.filter((r) => r.resourceType === "BOOK").length;
    const videos = resources.filter((r) => r.resourceType === "VIDEO").length;
    const totalDownloads = resources.reduce((sum, r) => sum + (r.downloadsCount || 0), 0);
    const avgDownloads = total > 0 ? Math.round(totalDownloads / total) : 0;
    return { total, books, videos, totalDownloads, avgDownloads };
  }, [resources]);

  // ✅ FIXED: uses POST via addLibraryResource instead of PUT saveLibraryResources
  const handleUploadResource = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthor) {
      alert("Please specify the title and author of the resource.");
      return;
    }
    setUploading(true);
    try {
      const payload: any = {
        title: newTitle,
        author: newAuthor,
        isbn: newIsbn || "",
        category: newCategory,
        resource_type: newResourceType,
        file_size: newResourceType === "VIDEO" ? "380 MB" : "12.4 MB",
        downloads_count: 0,
        access_level: newAccessLevel,
        uploaded_by: user.fullName,
        description:
          newDescription ||
          "Official curriculum learning material uploaded for student and faculty access.",
      };

      const created: any = await (CampusDatabase as any).addLibraryResource(payload);

      const newRes: LibraryResource = {
        id: String(created?.id ?? "LIB_" + Date.now()),
        title: created?.title ?? payload.title,
        author: created?.author ?? payload.author,
        isbn: created?.isbn ?? payload.isbn,
        category: created?.category ?? payload.category,
        resourceType:
          created?.resource_type ?? created?.resourceType ?? payload.resource_type,
        fileSize: created?.file_size ?? created?.fileSize ?? payload.file_size,
        downloadsCount:
          created?.downloads_count ?? created?.downloadsCount ?? 0,
        accessLevel:
          created?.access_level ?? created?.accessLevel ?? payload.access_level,
        uploadedBy:
          created?.uploaded_by ?? created?.uploadedBy ?? payload.uploaded_by,
        uploadedAt:
          created?.uploaded_at ?? created?.uploadedAt ?? new Date().toISOString(),
        description: created?.description ?? payload.description,
      };

      setResources((prev) => [newRes, ...prev]);

      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "LIBRARY_STAFF",
        "Upload E-Resource",
        "LibraryResource",
        newRes.id,
        `Cataloged and published new ${newResourceType.toLowerCase()}: "${newTitle}" by ${newAuthor}`
      );

      alert(`Resource "${newTitle}" successfully added to the University Digital Repository!`);
      setNewTitle("");
      setNewAuthor("");
      setNewIsbn("");
      setNewDescription("");
      setUploadFileName("");
      setActiveTab("catalog");
    } catch (error: any) {
      console.error("Failed to upload resource:", error);
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      alert("Failed to upload resource: " + detail);
    } finally {
      setUploading(false);
    }
  };

  // ✅ FIXED: uses DELETE /library-resources/{id}/ instead of PUT
  const handleDeleteResource = async (resourceId: string, title: string) => {
    if (
      window.confirm(`Are you sure you want to remove "${title}" from the digital library catalog?`)
    ) {
      try {
        const numericId = String(resourceId).replace(/^LIB_/, "");
        await (CampusDatabase as any).deleteLibraryResource(numericId);

        setResources((prev) => prev.filter((r) => r.id !== resourceId));

        await CampusDatabase.addAuditLog(
          user.id,
          user.fullName,
          "LIBRARY_STAFF",
          "Delete E-Resource",
          "LibraryResource",
          resourceId,
          `Removed resource "${title}" from the digital library catalog.`
        );
      } catch (error: any) {
        console.error("Failed to delete resource:", error);
        const detail = error?.response?.data
          ? JSON.stringify(error.response.data)
          : error?.message || "Unknown error";
        alert("Failed to delete resource: " + detail);
      }
    }
  };

  // ✅ FIXED: uses PATCH /library-resources/{id}/ instead of PUT
  const handleDownloadResource = async (
    resourceId: string,
    title: string,
    fileSize: string
  ) => {
    try {
      const current = resources.find((r) => r.id === resourceId);
      const nextCount = (current?.downloadsCount ?? 0) + 1;
      const numericId = String(resourceId).replace(/^LIB_/, "");

      await (CampusDatabase as any).updateLibraryResource(numericId, {
        downloads_count: nextCount,
      });

      setResources((prev) =>
        prev.map((r) =>
          r.id === resourceId ? { ...r, downloadsCount: nextCount } : r
        )
      );

      alert(`Simulating secure download for "${title}" (${fileSize})`);
    } catch (error: any) {
      console.error("Failed to update download count:", error);
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || "Unknown error";
      alert("Download failed: " + detail);
    }
  };

  const handleDownloadReport = async () => {
    setGeneratingReport(true);
    try {
      const report = buildReport();
      downloadTextFile(
        `MAU_Library_Report_${new Date().toISOString().split("T")[0]}.txt`,
        report
      );
      await CampusDatabase.addAuditLog(
        user.id,
        user.fullName,
        "LIBRARY_STAFF",
        "Generate Library Report",
        "Report",
        "LIB_REP_" + Date.now(),
        "Generated and downloaded official digital library usage and dissemination report."
      );
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const buildReport = () => {
    const lines: string[] = [];
    const now = new Date().toLocaleString();
    lines.push("=".repeat(70));
    lines.push("  MEKDELA AMBA UNIVERSITY");
    lines.push("  Library & Digital E-Resource Repository");
    lines.push("  OFFICIAL DISSEMINATION & USAGE REPORT");
    lines.push("=".repeat(70));
    lines.push("");
    lines.push(`Generated: ${now}`);
    lines.push(`Prepared by: ${user.fullName}`);
    lines.push("");
    lines.push("-".repeat(70));
    lines.push("1. COLLECTION SUMMARY");
    lines.push("-".repeat(70));
    lines.push("");
    lines.push(`  Total Resources ....... ${stats.total}`);
    lines.push(`  Digital Books ......... ${stats.books}`);
    lines.push(`  Video Lectures ........ ${stats.videos}`);
    lines.push(`  Total Downloads ....... ${stats.totalDownloads}`);
    lines.push(`  Avg Downloads/Item .... ${stats.avgDownloads}`);
    lines.push("");
    lines.push("-".repeat(70));
    lines.push("2. TOP PERFORMING TITLES");
    lines.push("-".repeat(70));
    lines.push("");
    resources
      .slice()
      .sort((a, b) => b.downloadsCount - a.downloadsCount)
      .slice(0, 10)
      .forEach((r, i) => {
        lines.push(`  ${i + 1}. ${r.title}`);
        lines.push(`     ${r.author} • ${r.category} • ${r.downloadsCount} downloads`);
      });
    lines.push("");
    lines.push("-".repeat(70));
    lines.push("3. CERTIFICATION");
    lines.push("-".repeat(70));
    lines.push("");
    lines.push("  This report certifies that the digital collection maintained by the");
    lines.push("  Directorate of Library Services complies with standard academic");
    lines.push("  requirements set by the Ethiopian Ministry of Education.");
    lines.push("");
    lines.push("=".repeat(70));
    return lines.join("\n");
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.isbn && r.isbn.includes(searchQuery));
    const matchesCategory = selectedCategory === "ALL" || r.category === selectedCategory;
    const matchesType = selectedType === "ALL" || r.resourceType === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const navItems: { id: Tab; label: string; shortLabel: string; Icon: typeof BookOpen }[] = [
    { id: "catalog", label: "E-Resource Catalog", shortLabel: "Catalog", Icon: BookOpen },
    { id: "upload", label: "Upload Resource", shortLabel: "Upload", Icon: Upload },
    { id: "analytics", label: "Repository Analytics", shortLabel: "Analytics", Icon: BarChart2 },
    { id: "reports", label: "Dissemination Reports", shortLabel: "Reports", Icon: FileText },
  ];

  const goToTab = (id: string) => {
    setActiveTab(id as Tab);
    setIsMobileNavOpen(false);
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col font-sans"
      id="library_dashboard_main"
    >
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="University Library & Digital E-Resource Repository"
        portalSubtitle="Directorate of Academic Learning Assets & Institutional Repositories"
        badgeText="LIBRARY STAFF"
        badgeType="faculty"
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        isMobileNavOpen={isMobileNavOpen}
      />

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
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
                    <p className="text-[10px] font-mono text-amber-400 font-bold">LIBRARY STAFF</p>
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
                    Library Operations
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
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400">
                <p>
                  Staff ID: <span className="text-amber-400">{user.staffId || "LIB_091"}</span>
                </p>
                <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                  Storage: <span className="text-emerald-400">78.5 GB / 100 GB</span>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            <Icon
              className={`w-3.5 h-3.5 ${
                activeTab === id ? "text-amber-300" : "text-amber-400/80"
              }`}
            />
            <span>{shortLabel}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex min-w-0">
        <aside className="hidden md:flex md:w-64 bg-[#071526] text-slate-300 flex-col border-r border-slate-800/80 shrink-0">
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{user.fullName}</h4>
              <p className="text-[10px] font-mono text-amber-400 font-bold">LIBRARY STAFF</p>
            </div>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            <div className="pb-1 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Library Operations
              </span>
            </div>
            {navItems.map(({ id, label, Icon }) => (
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
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <p>
              Staff ID: <span className="text-amber-400">{user.staffId || "LIB_091"}</span>
            </p>
            <p>
              Storage: <span className="text-emerald-400">78.5 GB / 100 GB</span>
            </p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#071526] via-[#0b2136] to-[#0d2942]">
            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-20 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

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
                    <span>DIGITAL REPOSITORY • AY 2025/2026</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white tracking-tight leading-tight">
                    Library Command Center
                  </h1>
                  <p className="text-slate-300/90 text-sm max-w-2xl leading-relaxed">
                    Manage the entire digital repository — textbooks, lecture videos,
                    curriculum articles, and institutional research.
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

          <div className="px-4 sm:px-6 md:px-8 -mt-16 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Layers}
                label="Total Resources"
                value={String(stats.total)}
                sub="Digital collection"
                accent="from-blue-500 to-indigo-600"
                delay={0.05}
              />
              <StatCard
                icon={BookOpen}
                label="Books & Papers"
                value={String(stats.books)}
                sub="Textbooks & articles"
                accent="from-violet-500 to-purple-600"
                delay={0.1}
              />
              <StatCard
                icon={Video}
                label="Video Lectures"
                value={String(stats.videos)}
                sub="Recorded sessions"
                accent="from-emerald-500 to-teal-600"
                delay={0.15}
              />
              <StatCard
                icon={Download}
                label="Total Downloads"
                value={String(stats.totalDownloads)}
                sub={`${stats.avgDownloads} avg / item`}
                accent="from-amber-500 to-orange-600"
                delay={0.2}
              />
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8 py-8 space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === "catalog" && (
                <motion.div
                  key="catalog"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-slate-900">
                        Digital Library Catalog
                      </h2>
                      <p className="text-sm text-slate-500">
                        {filteredResources.length} of {resources.length} resources shown
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-primary/30 flex items-center space-x-1.5 self-start md:self-auto transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload Resource</span>
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search by title, author, or ISBN…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full py-2 px-3 text-xs border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    >
                      <option value="ALL">All Disciplines</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="General Engineering">General Engineering</option>
                      <option value="National Curriculum">National Curriculum</option>
                    </select>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full py-2 px-3 text-xs border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    >
                      <option value="ALL">All Media Types</option>
                      <option value="BOOK">Digital Books</option>
                      <option value="VIDEO">Video Lectures</option>
                      <option value="ARTICLE">Articles</option>
                      <option value="LECTURE_NOTE">Lecture Slides</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredResources.map((res, i) => (
                      <motion.div
                        key={res.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-indigo-600 opacity-0 group-hover:opacity-100 transition" />

                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                                res.resourceType === "BOOK"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : res.resourceType === "VIDEO"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {res.resourceType} • {res.fileSize}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0 flex items-center space-x-1">
                              <Download className="w-3 h-3" />
                              <span>{res.downloadsCount}</span>
                            </span>
                          </div>

                          <div>
                            <h3 className="font-display font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-primary transition">
                              {res.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              By{" "}
                              <span className="font-medium text-slate-700">{res.author}</span>
                            </p>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {res.description}
                          </p>

                          {res.isbn && (
                            <p className="text-[10px] font-mono text-slate-400">
                              ISBN: {res.isbn}
                            </p>
                          )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 text-xs">
                          <button
                            onClick={() => setPreviewResource(res)}
                            className="text-primary hover:underline font-semibold flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() =>
                                handleDownloadResource(res.id, res.title, res.fileSize)
                              }
                              className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteResource(res.id, res.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {filteredResources.length === 0 && (
                      <div className="col-span-full text-center py-16 text-slate-400 text-sm">
                        No resources match your search.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "upload" && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="max-w-2xl mx-auto space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center space-x-2">
                      <Upload className="w-6 h-6 text-primary" />
                      <span>Upload & Catalog New Asset</span>
                    </h2>
                    <p className="text-sm text-slate-500">
                      Add textbooks, scientific publications, laboratory guides, or lecture
                      recordings to the centralized repository.
                    </p>
                  </div>

                  <form
                    onSubmit={handleUploadResource}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Resource Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Distributed Operating Systems Principles"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Author / Instructor *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Andrew S. Tanenbaum"
                          value={newAuthor}
                          onChange={(e) => setNewAuthor(e.target.value)}
                          className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          ISBN / DOI (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 978-0131405622"
                          value={newIsbn}
                          onChange={(e) => setNewIsbn(e.target.value)}
                          className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Category
                        </label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                        >
                          <option value="Software Engineering">Software Engineering</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="General Engineering">General Engineering</option>
                          <option value="National Curriculum">National Curriculum</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Media Type
                        </label>
                        <select
                          value={newResourceType}
                          onChange={(e) => setNewResourceType(e.target.value)}
                          className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                        >
                          <option value="BOOK">Digital Book (PDF/ePub)</option>
                          <option value="VIDEO">Video Lecture (MP4)</option>
                          <option value="ARTICLE">Research Article</option>
                          <option value="LECTURE_NOTE">Lecture Slides</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Access Level
                        </label>
                        <select
                          value={newAccessLevel}
                          onChange={(e) => setNewAccessLevel(e.target.value)}
                          className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                        >
                          <option value="PUBLIC">Public (Campus-Wide)</option>
                          <option value="STUDENTS_ONLY">Students Only</option>
                          <option value="FACULTY_ONLY">Faculty Only</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Resource Summary
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Brief synopsis of the topic, target audience, and edition details…"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
                      />
                    </div>

                    <div className="p-4 border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-xl text-center space-y-2 bg-slate-50/50 transition">
                      <Upload className="w-8 h-8 text-primary mx-auto" />
                      <p className="text-xs text-slate-600 font-medium">
                        {uploadFileName || "Select or drag file to attach"}
                      </p>
                      <input
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setUploadFileName(e.target.files[0].name);
                          }
                        }}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer w-full"
                      />
                      <p className="text-[10px] text-slate-400">
                        PDF, EPUB, MP4, PPTX up to 500MB
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={uploading}
                      className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white font-bold py-3.5 rounded-xl text-xs transition shadow-lg shadow-primary/30 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Cataloging Resource…</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Publish into Digital Library</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {activeTab === "analytics" && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center space-x-2">
                      <BarChart2 className="w-6 h-6 text-primary" />
                      <span>Repository Analytics</span>
                    </h2>
                    <p className="text-sm text-slate-500">
                      Track student engagement and digital asset retrieval metrics
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                      icon={Layers}
                      label="Total Catalog Items"
                      value={String(stats.total)}
                      sub="Across 5 departments"
                      accent="from-blue-500 to-indigo-600"
                    />
                    <MetricCard
                      icon={Download}
                      label="Total Downloads"
                      value={String(stats.totalDownloads)}
                      sub={`${stats.avgDownloads} avg / item`}
                      accent="from-emerald-500 to-teal-600"
                    />
                    <MetricCard
                      icon={HardDrive}
                      label="Storage Utilized"
                      value="78.5 GB"
                      sub="78.5% of 100 GB SSD"
                      accent="from-amber-500 to-orange-600"
                    />
                    <MetricCard
                      icon={Users}
                      label="Active Readers"
                      value="845"
                      sub="Concurrent sessions"
                      accent="from-violet-500 to-purple-600"
                    />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <h3 className="font-display font-bold text-slate-900">
                        Top Downloaded Titles
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {resources
                        .slice()
                        .sort((a, b) => b.downloadsCount - a.downloadsCount)
                        .slice(0, 8)
                        .map((r, index) => (
                          <div
                            key={r.id}
                            className="py-3 flex justify-between items-center gap-3 text-xs"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                  index === 0
                                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                                    : index === 1
                                    ? "bg-slate-300 text-slate-700"
                                    : index === 2
                                    ? "bg-amber-700 text-white"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <strong className="text-slate-900 block text-sm truncate">
                                  {r.title}
                                </strong>
                                <span className="text-slate-400 text-[11px] truncate block">
                                  {r.author} • {r.category}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-primary text-sm">
                                {r.downloadsCount}
                              </span>
                              <span className="text-slate-400 text-[11px] block">downloads</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "reports" && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="max-w-3xl mx-auto space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center space-x-2">
                      <FileText className="w-6 h-6 text-primary" />
                      <span>Dissemination & Audit Report</span>
                    </h2>
                    <p className="text-sm text-slate-500">
                      Official reporting dossier for library resource allocation and usage
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="text-center space-y-1 border-b border-slate-100 pb-4">
                      <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Mekdela Amba University • Library Directorate
                      </p>
                      <h3 className="font-display font-bold text-lg text-slate-900">
                        Semester II Digital Repository Summary
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Report Period: AY 2025/2026
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="space-y-2">
                        <p>
                          TOTAL E-BOOKS:{" "}
                          <span className="font-bold text-slate-800">{stats.books}</span>
                        </p>
                        <p>
                          TOTAL VIDEO LECTURES:{" "}
                          <span className="font-bold text-slate-800">{stats.videos}</span>
                        </p>
                      </div>
                      <div className="space-y-2 sm:text-right">
                        <p>
                          TOTAL DOWNLOADS:{" "}
                          <span className="font-bold text-emerald-600">
                            {stats.totalDownloads}
                          </span>
                        </p>
                        <p>
                          ACTIVE ENROLLMENT:{" "}
                          <span className="font-bold text-slate-800">100%</span>
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      This report certifies that the digital collection maintained by the
                      Directorate of Library Services complies with standard academic
                      requirements set by the Ethiopian Ministry of Education.
                    </p>

                    <div className="pt-4 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownloadReport}
                        disabled={generatingReport}
                        className="bg-gradient-to-r from-primary to-indigo-600 hover:opacity-95 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-primary/30 flex items-center space-x-2 justify-center disabled:opacity-50 transition"
                      >
                        {generatingReport ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Generating…</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download Report</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {previewResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewResource(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="relative bg-gradient-to-br from-[#071526] via-[#0b2136] to-[#0d2942] p-6 text-white overflow-hidden">
                <div className="absolute -top-20 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold text-amber-300 tracking-wider">
                      RESOURCE DETAILS
                    </span>
                    <h3 className="font-display font-bold text-lg mt-1 line-clamp-2">
                      {previewResource.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setPreviewResource(null)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-3 text-xs">
                <Detail label="Author" value={previewResource.author} />
                <Detail label="Category" value={previewResource.category} />
                <Detail
                  label="Type"
                  value={`${previewResource.resourceType} (${previewResource.fileSize})`}
                />
                <Detail label="Access Level" value={previewResource.accessLevel} />
                <Detail label="Uploaded By" value={previewResource.uploadedBy} />
                <Detail label="Downloads" value={String(previewResource.downloadsCount)} />
                {previewResource.isbn && <Detail label="ISBN" value={previewResource.isbn} />}
                <div>
                  <span className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
                    Synopsis
                  </span>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed text-xs">
                    {previewResource.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setPreviewResource(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
  icon: typeof BookOpen;
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

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-hidden"
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${accent} opacity-10 rounded-full blur-2xl -mr-8 -mt-8`}
      />
      <div className="relative space-y-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          <strong className="block text-xl font-display font-bold text-slate-900 mt-1 font-mono">
            {value}
          </strong>
          <span className="block text-[11px] text-slate-500 mt-0.5">{sub}</span>
        </div>
      </div>
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[10px] uppercase font-mono text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value}</span>
    </div>
  );
}