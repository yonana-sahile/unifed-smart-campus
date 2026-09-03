import { useState, useEffect, FormEvent } from "react";
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
  CheckCircle2,
  Sparkles,
  HardDrive,
  Users,
  Filter,
  Check,
  Clock,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LibraryStaffDashboardProps {
  user: User;
  onLogout: () => void;
}

export function LibraryStaffDashboard({ user, onLogout }: LibraryStaffDashboardProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "upload" | "analytics" | "reports">("catalog");
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Upload Form State
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newIsbn, setNewIsbn] = useState("");
  const [newCategory, setNewCategory] = useState<any>("Software Engineering");
  const [newResourceType, setNewResourceType] = useState<any>("BOOK");
  const [newAccessLevel, setNewAccessLevel] = useState<any>("PUBLIC");
  const [newDescription, setNewDescription] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Preview / Details Modal State
  const [previewResource, setPreviewResource] = useState<LibraryResource | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // ✅ FIXED: Async data loading with proper error handling
  const loadData = async () => {
    try {
      const resourcesData = await CampusDatabase.getLibraryResources();
      setResources(Array.isArray(resourcesData) ? resourcesData : []);
    } catch (error) {
      console.error("Failed to load library resources:", error);
      setResources([]);
    }
  };

  // ✅ FIXED: Async upload handler
  const handleUploadResource = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthor) {
      alert("Please specify the title and author of the resource.");
      return;
    }

    setUploading(true);

    try {
      const newRes: LibraryResource = {
        id: "LIB_" + Date.now(),
        title: newTitle,
        author: newAuthor,
        isbn: newIsbn || undefined,
        category: newCategory,
        resourceType: newResourceType,
        fileSize: newResourceType === "VIDEO" ? "380 MB" : "12.4 MB",
        downloadsCount: 0,
        accessLevel: newAccessLevel,
        uploadedBy: user.fullName,
        uploadedAt: new Date().toISOString(),
        description: newDescription || "Official curriculum learning material uploaded for student and faculty access."
      };

      const updated = [newRes, ...resources];
      await CampusDatabase.saveLibraryResources(updated);
      setResources(updated);

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

      // Reset form
      setNewTitle("");
      setNewAuthor("");
      setNewIsbn("");
      setNewDescription("");
      setUploadFileName("");
      setActiveTab("catalog");
    } catch (error) {
      console.error("Failed to upload resource:", error);
      alert("Failed to upload resource. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ FIXED: Async delete handler
  const handleDeleteResource = async (resourceId: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}" from the digital library catalog?`)) {
      try {
        const updated = resources.filter((r) => r.id !== resourceId);
        await CampusDatabase.saveLibraryResources(updated);
        setResources(updated);

        await CampusDatabase.addAuditLog(
          user.id,
          user.fullName,
          "LIBRARY_STAFF",
          "Delete E-Resource",
          "LibraryResource",
          resourceId,
          `Removed resource "${title}" from the digital library catalog.`
        );
      } catch (error) {
        console.error("Failed to delete resource:", error);
        alert("Failed to delete resource. Please try again.");
      }
    }
  };

  // ✅ FIXED: Async download handler
  const handleDownloadResource = async (resourceId: string, title: string, fileSize: string) => {
    try {
      const updated = resources.map((r) =>
        r.id === resourceId ? { ...r, downloadsCount: r.downloadsCount + 1 } : r
      );
      await CampusDatabase.saveLibraryResources(updated);
      setResources(updated);
      alert(`Simulating secure download for "${title}" (${fileSize})`);
    } catch (error) {
      console.error("Failed to update download count:", error);
      alert("Download simulation failed. Please try again.");
    }
  };

  const filteredResources = Array.isArray(resources) ? resources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.isbn && r.isbn.includes(searchQuery));
    const matchesCategory = selectedCategory === "ALL" || r.category === selectedCategory;
    const matchesType = selectedType === "ALL" || r.resourceType === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  }) : [];

  const totalDownloads = Array.isArray(resources) ? resources.reduce((sum, r) => sum + r.downloadsCount, 0) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#071526] flex flex-col font-sans" id="library_dashboard_main">
      <UniversityTopBar
        user={user}
        onLogout={onLogout}
        portalTitle="University Library & Digital E-Resource Repository"
        portalSubtitle="Directorate of Academic Learning Assets & Institutional Repositories"
        badgeText="LIBRARY STAFF"
        badgeType="faculty"
      />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#071526] text-slate-300 flex flex-col border-r border-slate-800/80 shrink-0">
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest">
              Library Operations
            </span>
          </div>

          <nav className="p-3.5 flex-1 space-y-1">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "catalog"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>E-Resource Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab("upload")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "upload"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Upload Book / Video</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "analytics"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Repository Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === "reports"
                  ? "bg-primary text-white border border-amber-400/20 shadow-xs"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Dissemination Reports</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs font-mono text-slate-400 space-y-1">
            <p>Staff ID: <span className="text-amber-400">{user.staffId || "LIB_091"}</span></p>
            <p>Storage: <span className="text-emerald-400">78.5 GB / 100 GB</span></p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {/* TAB 1: E-RESOURCE CATALOG */}
          {activeTab === "catalog" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <BookOpen className="w-6 h-6 text-primary" />
                    <span>Digital Library Catalog & E-Resources</span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                    Manage textbooks, scientific papers, video lectures, and national curriculum directives for Mekdela Amba University.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Resource</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by title, author, or ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary dark:text-white"
                  />
                </div>

                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-hidden dark:text-white"
                  >
                    <option value="ALL">All Disciplines / Categories</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="General Engineering">General Engineering</option>
                    <option value="National Curriculum">National Curriculum</option>
                  </select>
                </div>

                <div>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-hidden dark:text-white"
                  >
                    <option value="ALL">All Media Types</option>
                    <option value="BOOK">Digital Textbooks (PDF / ePub)</option>
                    <option value="VIDEO">Recorded Lectures (MP4)</option>
                    <option value="ARTICLE">Curriculum & Articles</option>
                    <option value="LECTURE_NOTE">Faculty Lecture Slides</option>
                  </select>
                </div>
              </div>

              {/* Resource Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredResources.map((res) => (
                  <motion.div
                    key={res.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition group"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            res.resourceType === "BOOK"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : res.resourceType === "VIDEO"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          }`}
                        >
                          {res.resourceType} • {res.fileSize}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {res.downloadsCount} DLs
                        </span>
                      </div>

                      <div>
                        <h3 className="font-serif font-bold text-slate-900 dark:text-white text-sm line-clamp-2 group-hover:text-primary transition">
                          {res.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          By <span className="font-medium text-slate-700 dark:text-slate-300">{res.author}</span>
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {res.description}
                      </p>

                      {res.isbn && (
                        <p className="text-[10px] font-mono text-slate-400">
                          ISBN: {res.isbn}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                      <button
                        onClick={() => setPreviewResource(res)}
                        className="text-primary hover:underline font-semibold flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Metadata</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownloadResource(res.id, res.title, res.fileSize)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Download asset"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(res.id, res.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title="Remove from catalog"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD RESOURCE */}
          {activeTab === "upload" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Upload className="w-6 h-6 text-primary" />
                  <span>Upload & Catalog New Digital Asset</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  Add textbooks, scientific publications, laboratory guides, or lecture video recordings to the centralized repository.
                </p>
              </div>

              <form onSubmit={handleUploadResource} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Resource Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Operating Systems Principles"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-medium dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Primary Author / Instructor *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Andrew S. Tanenbaum"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-medium dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      ISBN / DOI Identifier (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 978-0131405622"
                      value={newIsbn}
                      onChange={(e) => setNewIsbn(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-mono dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Discipline Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-medium dark:text-white"
                    >
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="General Engineering">General Engineering</option>
                      <option value="National Curriculum">National Curriculum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Media Type
                    </label>
                    <select
                      value={newResourceType}
                      onChange={(e) => setNewResourceType(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-medium dark:text-white"
                    >
                      <option value="BOOK">Digital Book (PDF / ePub)</option>
                      <option value="VIDEO">Video Lecture (MP4)</option>
                      <option value="ARTICLE">Research Article / PDF</option>
                      <option value="LECTURE_NOTE">Faculty Slides / Presentation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Access Level
                    </label>
                    <select
                      value={newAccessLevel}
                      onChange={(e) => setNewAccessLevel(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs font-medium dark:text-white"
                    >
                      <option value="PUBLIC">Public (Campus-Wide)</option>
                      <option value="STUDENTS_ONLY">Enrolled Students Only</option>
                      <option value="FACULTY_ONLY">Faculty & Staff Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Resource Summary & Abstract
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a brief synopsis of the topic covered, target audience, and edition details..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 mt-1 rounded-xl text-xs dark:text-white"
                  />
                </div>

                {/* File Attachment selector */}
                <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/40">
                  <Upload className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {uploadFileName ? uploadFileName : "Select or drag file to attach"}
                  </p>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setUploadFileName(e.target.files[0].name);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">PDF, EPUB, MP4, PPTX up to 500MB (PostgreSQL / File Storage)</p>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Cataloging Resource...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Publish into Digital Library</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: REPOSITORY ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <BarChart2 className="w-6 h-6 text-primary" />
                  <span>E-Resource Utilization & Analytics</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  Track student engagement, textbook reading volume, and digital asset retrieval metrics.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Total Catalog Items</span>
                  <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white mt-1">{resources.length}</p>
                  <span className="text-[11px] text-emerald-600 font-semibold">Across 5 departments</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Student Downloads</span>
                  <p className="text-3xl font-serif font-bold text-primary mt-1">{totalDownloads}</p>
                  <span className="text-[11px] text-slate-500 font-medium">Recorded semester total</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Storage Utilized</span>
                  <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white mt-1">78.5 GB</p>
                  <span className="text-[11px] text-amber-600 font-semibold">78.5% of 100 GB SSD</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Active Readers</span>
                  <p className="text-3xl font-serif font-bold text-emerald-700 mt-1">845</p>
                  <span className="text-[11px] text-emerald-600 font-semibold">Concurrent active sessions</span>
                </div>
              </div>

              {/* Download Ranking Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-slate-900 dark:text-white text-base">Top Downloaded & Accessed Titles</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {resources
                    .sort((a, b) => b.downloadsCount - a.downloadsCount)
                    .map((r, index) => (
                      <div key={r.id} className="py-3 flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <div>
                            <strong className="text-slate-900 dark:text-white block text-sm">{r.title}</strong>
                            <span className="text-slate-400 text-[11px]">{r.author} • {r.category}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-primary text-sm">{r.downloadsCount}</span>
                          <span className="text-slate-400 text-[11px] block">downloads</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DISSEMINATION REPORTS */}
          {activeTab === "reports" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileText className="w-6 h-6 text-primary" />
                  <span>Library Dissemination & Audit Report</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  Official reporting dossier for library resource allocation, student usage statistics, and curriculum alignment.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs space-y-6">
                <div className="text-center space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Mekdela Amba University • Library Directorate
                  </p>
                  <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                    Semester II Digital Repository Summary Dossier
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">Report Period: AY 2025/2026</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p>TOTAL E-BOOKS: <span className="font-bold text-slate-800 dark:text-white">{Array.isArray(resources) ? resources.filter(r => r.resourceType === "BOOK").length : 0}</span></p>
                    <p>TOTAL VIDEO LECTURES: <span className="font-bold text-slate-800 dark:text-white">{Array.isArray(resources) ? resources.filter(r => r.resourceType === "VIDEO").length : 0}</span></p>
                  </div>
                  <div className="text-right">
                    <p>TOTAL DOWNLOADS: <span className="font-bold text-emerald-600">{totalDownloads}</span></p>
                    <p>ACTIVE ENROLLMENT REACH: <span className="font-bold text-slate-800 dark:text-white">100%</span></p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  This report certifies that the digital collection maintained by the Directorate of Library Services complies with standard academic requirements set by the Ethiopian Ministry of Education.
                </p>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={async () => {
                      try {
                        await CampusDatabase.addAuditLog(
                          user.id,
                          user.fullName,
                          "LIBRARY_STAFF",
                          "Generate Library Report",
                          "Report",
                          "LIB_REP_2026",
                          "Generated and downloaded official digital library usage and dissemination report."
                        );
                        alert("Official Library Summary PDF Report successfully exported!");
                      } catch (error) {
                        console.error("Failed to generate report:", error);
                        alert("Failed to generate report. Please try again.");
                      }
                    }}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Report (PDF)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Metadata Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-serif font-bold text-slate-900 dark:text-white text-base">Resource Details</h3>
              <button onClick={() => setPreviewResource(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <p><strong className="text-slate-600 dark:text-slate-400">Title:</strong> <span className="font-semibold text-slate-900 dark:text-white">{previewResource.title}</span></p>
              <p><strong className="text-slate-600 dark:text-slate-400">Author:</strong> <span className="text-slate-800 dark:text-slate-200">{previewResource.author}</span></p>
              <p><strong className="text-slate-600 dark:text-slate-400">Category:</strong> <span className="text-slate-800 dark:text-slate-200">{previewResource.category}</span></p>
              <p><strong className="text-slate-600 dark:text-slate-400">Type:</strong> <span className="font-mono text-primary font-bold">{previewResource.resourceType} ({previewResource.fileSize})</span></p>
              <p><strong className="text-slate-600 dark:text-slate-400">Access Level:</strong> <span className="text-slate-800 dark:text-slate-200">{previewResource.accessLevel}</span></p>
              <p><strong className="text-slate-600 dark:text-slate-400">Uploaded By:</strong> <span className="text-slate-800 dark:text-slate-200">{previewResource.uploadedBy}</span></p>
              <p><strong className="text-slate-600 dark:text-slate-400">Synopsis:</strong></p>
              <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">{previewResource.description}</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPreviewResource(null)}
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold py-2 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <AcademicFooter />
    </div>
  );
}
