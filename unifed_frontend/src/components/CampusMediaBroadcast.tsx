import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Tv,
  Plus,
  Trash2,
  Heart,
  Eye,
  Calendar,
  Tag,
  Share2,
  Check,
  X,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Video,
  Film,
  Award,
  Filter,
  Maximize2
} from "lucide-react";
import type { CampusMediaPost } from "../types";
// We DO NOT import CampusDatabase from services/api – we use local state only.

interface CampusMediaBroadcastProps {
  onAdminPostClick?: () => void;
}

export const CampusMediaBroadcast: React.FC<CampusMediaBroadcastProps> = ({
  onAdminPostClick
}) => {
  // ---------- HARDCODED MOCK DATA ----------
  const initialPosts: CampusMediaPost[] = [
    {
      id: "MED_01",
      title: "Mekdela Amba University 2026 Grand Convocation & Graduation Ceremony",
      description: "Live broadcast highlights of the 6th General Graduation Ceremony celebrating over 2,400 undergraduate and postgraduate scholars.",
      category: "GRADUATION_CEREMONY",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80",
      postedBy: "Selamawit T. (Lead Admin)",
      authorRole: "ADMIN",
      postedAt: "2026-08-28T09:00:00Z",
      duration: "14:20",
      viewsCount: 3840,
      likesCount: 520,
      featured: true,
      tags: ["Graduation2026", "TuluAwliya", "Convocation"]
    },
    {
      id: "MED_02",
      title: "Presidential Address: Vision 2030 for Digital AI Research & Tech Excellence",
      description: "University President Dr. Asmamaw Gebre delivers the institutional roadmap for advancing smart agro-tech innovations, renewable energy labs, and high-performance computing centers.",
      category: "PRESIDENTIAL_ADDRESS",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80",
      postedBy: "Office of the President & Public Relations",
      authorRole: "ADMIN",
      postedAt: "2026-08-25T11:30:00Z",
      duration: "18:45",
      viewsCount: 2910,
      likesCount: 410,
      featured: true,
      tags: ["PresidentialKeynote", "DigitalCampus", "AIInnovation"]
    },
    {
      id: "MED_03",
      title: "National Higher Education Tech Expo 2026 — Student Software Innovations Showcase",
      description: "Department of Software Engineering students showcase AI-driven disease prediction for Ethiopian highland crops, automated Afan Oromo/Amharic natural language translation models, and smart IoT campus grids.",
      category: "TECH_EXPO",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80",
      postedBy: "Dr. Birhanu Kebede (Dept. Head)",
      authorRole: "ADMIN",
      postedAt: "2026-08-20T14:15:00Z",
      duration: "11:10",
      viewsCount: 1980,
      likesCount: 360,
      featured: false,
      tags: ["TechExpo", "SoftwareEngineering", "StudentProjects"]
    },
    {
      id: "MED_04",
      title: "Masha Agricultural & High-Altitude Research Station Documentary",
      description: "A breathtaking tour of Mekdela Amba University's Masha Campus research facilities, highlighting climate-resilient wheat seed cultivation and smart drip irrigation research.",
      category: "RESEARCH_INNOVATION",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
      postedBy: "College of Agriculture & Environmental Science",
      authorRole: "ADMIN",
      postedAt: "2026-08-15T16:00:00Z",
      duration: "22:30",
      viewsCount: 1450,
      likesCount: 295,
      featured: false,
      tags: ["MashaCampus", "Agriculture", "EcoResearch"]
    }
  ];

  const [posts, setPosts] = useState<CampusMediaPost[]>(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeVideo, setActiveVideo] = useState<CampusMediaPost | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Post Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CampusMediaPost["category"]>("CAMPUS_NEWS");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState("08:30");
  const [tagsInput, setTagsInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [posterName, setPosterName] = useState("University Media Directorate");
  const [formSuccess, setFormSuccess] = useState(false);

  const categories = [
    { id: "ALL", label: "All Broadcasts", amharic: "ሁሉም ቪዲዮዎች" },
    { id: "GRADUATION_CEREMONY", label: "Graduations", amharic: "የምረቃ ስነ-ስርዓት" },
    { id: "PRESIDENTIAL_ADDRESS", label: "Presidential", amharic: "የፕሬዝዳንት ንግግር" },
    { id: "TECH_EXPO", label: "Tech Expo & AI", amharic: "የቴክኖሎጂ አውደ-ርዕይ" },
    { id: "RESEARCH_INNOVATION", label: "Research", amharic: "ምርምርና ፈጠራ" },
    { id: "STUDENT_LIFE", label: "Campus Life", amharic: "የተማሪዎች ቆይታ" },
  ];

  const filteredPosts =
    selectedCategory === "ALL"
      ? posts
      : posts.filter((p) => p.category === selectedCategory);

  const featuredPost = posts.find((p) => p.featured) || posts[0];

  // ---------- LOCAL STATE UPDATES (NO API CALLS) ----------
  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, likesCount: p.likesCount + 1 } : p
      )
    );
    setLikedPosts((prev) => ({ ...prev, [id]: true }));
  };

  const handleWatch = (post: CampusMediaPost) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, viewsCount: p.viewsCount + 1 } : p
      )
    );
    setActiveVideo(post);
  };

  const handleShare = (post: CampusMediaPost, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(window.location.href);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this broadcast?")) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (activeVideo?.id === id) {
        setActiveVideo(null);
      }
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter((t) => t.length > 0);

    const defaultThumbs: Record<string, string> = {
      GRADUATION_CEREMONY: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80",
      PRESIDENTIAL_ADDRESS: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80",
      TECH_EXPO: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80",
      RESEARCH_INNOVATION: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&auto=format&fit=crop&q=80",
      CAMPUS_NEWS: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80",
      STUDENT_LIFE: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80"
    };

    const finalThumb = thumbnailUrl.trim() || defaultThumbs[category] || defaultThumbs.CAMPUS_NEWS;

    const newPost: CampusMediaPost = {
      id: "MED_" + Date.now(),
      title: title.trim(),
      description: description.trim() || "Official Mekdela Amba University media broadcast.",
      category,
      videoUrl: videoUrl.trim(),
      thumbnailUrl: finalThumb,
      postedBy: posterName.trim() || "University Media Directorate",
      authorRole: "ADMIN",
      duration: duration.trim() || "10:00",
      featured: isFeatured,
      tags: tags.length > 0 ? tags : ["MAU", "CampusLive"],
      postedAt: new Date().toISOString(),
      viewsCount: 1,
      likesCount: 0,
    };

    setPosts((prev) => [newPost, ...prev]);
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setShowAdminModal(false);
      // Reset form
      setTitle("");
      setDescription("");
      setVideoUrl("");
      setThumbnailUrl("");
      setTagsInput("");
      setIsFeatured(false);
    }, 1200);
  };

  const getCategoryBadge = (cat: CampusMediaPost["category"]) => {
    switch (cat) {
      case "GRADUATION_CEREMONY":
        return { label: "Graduation", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
      case "PRESIDENTIAL_ADDRESS":
        return { label: "Presidential", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" };
      case "TECH_EXPO":
        return { label: "Tech Expo & AI", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" };
      case "RESEARCH_INNOVATION":
        return { label: "Research", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
      case "STUDENT_LIFE":
        return { label: "Campus Life", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
      default:
        return { label: "Campus News", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" };
    }
  };

  return (
    <section id="campus-media-screen" className="w-full relative py-12 px-4 sm:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Screen Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-300/80 dark:border-slate-800/80 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <Tv className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>MAU Digital Broadcast Network • የዩኒቨርሲቲው የሚዲያ ስክሪን</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
              Official Campus Video & Media Screen
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Live convocation broadcasts, presidential keynotes, student tech innovations, and academic documentaries straight from Tulu Awliya and Masha Campuses.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => {
                setShowAdminModal(true);
                onAdminPostClick?.();
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer group"
            >
              <div className="w-5 h-5 rounded-md bg-slate-950/20 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-slate-950 group-hover:scale-110 transition" />
              </div>
              <span>Admin: Post New Video / አዲስ ቪዲዮ ይለጥፉ</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
                selectedCategory === c.id
                  ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-sm font-bold"
                  : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <span>{c.label}</span>
              <span className="text-[10px] opacity-70">({c.amharic})</span>
            </button>
          ))}
        </div>

        {/* Featured Video Cinema Screen */}
        {featuredPost && (
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={featuredPost.thumbnailUrl}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-950/80 hidden lg:block" />
                <button
                  onClick={() => handleWatch(featuredPost)}
                  className="absolute z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition cursor-pointer group/play"
                  title="Watch Broadcast"
                >
                  <Play className="w-8 h-8 fill-slate-950 ml-1 group-hover/play:scale-110 transition" />
                </button>
                <div className="absolute bottom-4 left-4 z-10 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-white text-xs font-mono font-bold flex items-center space-x-1.5 border border-white/20">
                  <Film className="w-3 h-3 text-amber-400" />
                  <span>{featuredPost.duration}</span>
                </div>
                <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold tracking-wider uppercase flex items-center space-x-1.5 shadow-lg animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span>FEATURED BROADCAST</span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getCategoryBadge(featuredPost.category).color}`}>
                      {getCategoryBadge(featuredPost.category).label}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(featuredPost.postedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-white leading-snug group-hover:text-amber-400 transition">
                    {featuredPost.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-4">
                    {featuredPost.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {featuredPost.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <Eye className="w-4 h-4 text-blue-400" />
                      <span>{featuredPost.viewsCount.toLocaleString()} views</span>
                    </span>
                    <button
                      onClick={(e) => handleLike(featuredPost.id, e)}
                      className={`flex items-center space-x-1.5 transition cursor-pointer ${
                        likedPosts[featuredPost.id] ? "text-rose-500 font-bold" : "hover:text-rose-400"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedPosts[featuredPost.id] ? "fill-rose-500" : ""}`} />
                      <span>{featuredPost.likesCount + (likedPosts[featuredPost.id] ? 1 : 0)}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleWatch(featuredPost)}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow cursor-pointer"
                  >
                    <span>Watch Now</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Grid Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Video className="w-5 h-5 text-amber-500" />
              <span>Campus Video Library ({filteredPosts.length})</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Showing official broadcasts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPosts.map((post) => {
              const badge = getCategoryBadge(post.category);
              return (
                <div
                  key={post.id}
                  onClick={() => handleWatch(post)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer hover:-translate-y-1"
                >
                  <div className="relative aspect-video bg-slate-950 overflow-hidden">
                    <img
                      src={post.thumbnailUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                        <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-md ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-white text-[11px] font-mono font-bold">
                      {post.duration}
                    </div>
                    <button
                      onClick={(e) => handleDelete(post.id, e)}
                      title="Delete Video (Admin)"
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-primary dark:group-hover:text-amber-400 transition">
                        {post.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {post.description}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>{post.viewsCount}</span>
                        </span>
                        <button
                          onClick={(e) => handleLike(post.id, e)}
                          className={`flex items-center space-x-1 hover:text-rose-500 transition cursor-pointer ${
                            likedPosts[post.id] ? "text-rose-500 font-bold" : ""
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedPosts[post.id] ? "fill-rose-500" : ""}`} />
                          <span>{post.likesCount + (likedPosts[post.id] ? 1 : 0)}</span>
                        </button>
                      </div>
                      <button
                        onClick={(e) => handleShare(post, e)}
                        className="hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer flex items-center space-x-1"
                        title="Copy Link"
                      >
                        {copiedId === post.id ? (
                          <span className="text-emerald-500 font-bold flex items-center space-x-0.5 text-[11px]">
                            <Check className="w-3 h-3" />
                            <span>Copied!</span>
                          </span>
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* VIDEO PLAYER MODAL */}
      <AnimatePresence>
        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col font-sans max-h-[92vh]"
            >
              {/* Modal Top Bar */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadge(activeVideo.category).color}`}>
                    {getCategoryBadge(activeVideo.category).label}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-slate-100 truncate">
                    {activeVideo.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player Area */}
              <div className="relative aspect-video bg-black w-full">
                {activeVideo.videoUrl.includes("youtube.com") || activeVideo.videoUrl.includes("youtu.be") ? (
                  <iframe
                    src={
                      activeVideo.videoUrl.includes("embed")
                        ? activeVideo.videoUrl
                        : `https://www.youtube-nocookie.com/embed/${activeVideo.videoUrl.split("v=")[1]?.split("&")[0] || ""}?autoplay=1`
                    }
                    title={activeVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                    <img
                      src={activeVideo.thumbnailUrl}
                      alt={activeVideo.title}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-black/60">
                      <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg">
                        <Play className="w-8 h-8 fill-slate-950 ml-1" />
                      </div>
                      <p className="text-xs text-slate-300 max-w-md">
                        Simulated High-Definition University Optical Network Stream. Video stream configured for campus intranet.
                      </p>
                      <a
                        href={activeVideo.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center space-x-1.5"
                      >
                        <span>Open Direct Media Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Details & Interaction */}
              <div className="p-4 sm:p-6 bg-slate-900 text-slate-300 space-y-4 overflow-y-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <span className="text-xs text-amber-400 font-mono">
                      Posted by: {activeVideo.postedBy} ({activeVideo.authorRole})
                    </span>
                    <p className="text-xs text-slate-400">
                      Published on {new Date(activeVideo.postedAt).toLocaleDateString("en-US", { dateStyle: "full" })}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => handleLike(activeVideo.id, e)}
                      className={`px-3.5 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1.5 text-xs transition cursor-pointer ${
                        likedPosts[activeVideo.id]
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedPosts[activeVideo.id] ? "fill-rose-500 text-rose-500" : ""}`} />
                      <span>{activeVideo.likesCount + (likedPosts[activeVideo.id] ? 1 : 0)} Likes</span>
                    </button>

                    <button
                      onClick={(e) => handleShare(activeVideo, e)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 text-xs transition cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase font-mono">
                    Broadcast Overview
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeVideo.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {activeVideo.tags.map((t, idx) => (
                    <span key={idx} className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2.5 py-0.5 rounded font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN POST VIDEO MODAL */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden font-sans max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-primary to-slate-900 text-white flex items-center justify-between border-b border-amber-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base sm:text-lg">
                      Admin: Post Campus Video Broadcast
                    </h3>
                    <p className="text-xs text-amber-300 font-mono">
                      MAU Public Relations & Media Broadcasting System
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreatePost} className="p-6 sm:p-8 space-y-4 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
                {formSuccess ? (
                  <div className="p-8 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-base">
                      Broadcast Successfully Published!
                    </h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      The video has been published to the home media screen and is now accessible to students, faculty, and public visitors.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Video Title */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Broadcast Title / የቪዲዮው ርዕስ *
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Mekdela Amba University 2026 Academic Research Symposium"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-400 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Category & Duration Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Category / ዘርፍ *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-400 text-slate-900 dark:text-white"
                        >
                          <option value="GRADUATION_CEREMONY">Graduation Ceremony (የምረቃ ስነ-ስርዓት)</option>
                          <option value="PRESIDENTIAL_ADDRESS">Presidential Address (የፕሬዝዳንት ንግግር)</option>
                          <option value="TECH_EXPO">Tech Expo & AI Innovations (የቴክኖሎጂ አውደ-ርዕይ)</option>
                          <option value="RESEARCH_INNOVATION">Research & Agriculture (ምርምርና ፈጠራ)</option>
                          <option value="STUDENT_LIFE">Student Campus Life (የተማሪዎች ቆይታ)</option>
                          <option value="CAMPUS_NEWS">General Campus News (አጠቃላይ ዜና)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Video Duration (e.g., 14:20)
                        </label>
                        <input
                          type="text"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="12:45"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-400 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Video URL */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Video Stream URL / የቪዲዮ ሊንክ (YouTube or MP4) *
                      </label>
                      <input
                        type="url"
                        required
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-400 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Thumbnail URL */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Custom Thumbnail Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-...?auto=format&fit=crop&w=800"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-400 text-slate-900 dark:text-white"
                      />
                      <p className="text-[11px] text-slate-500">
                        Leave blank to use the institutional HD photography preset for this category.
                      </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Broadcast Description / ማብራሪያ
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide details about the campus event, speakers, key research findings, or ceremony agenda..."
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-400 text-slate-900 dark:text-white resize-none"
                      />
                    </div>

                    {/* Tags & Poster Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Tags (comma separated)
                        </label>
                        <input
                          type="text"
                          value={tagsInput}
                          onChange={(e) => setTagsInput(e.target.value)}
                          placeholder="MAU, Graduation2026, Tech"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-400 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Posting Authority
                        </label>
                        <input
                          type="text"
                          value={posterName}
                          onChange={(e) => setPosterName(e.target.value)}
                          placeholder="Selamawit T. (Lead Admin)"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-amber-400 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Featured Checkbox */}
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="featuredVideo"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary accent-amber-500 cursor-pointer"
                      />
                      <label htmlFor="featuredVideo" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        Set as Featured Broadcast on Main Screen (የዋናው ስክሪን ተመራጭ ቪዲዮ)
                      </label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3 flex items-center justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowAdminModal(false)}
                        className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center space-x-2"
                      >
                        <Video className="w-4 h-4" />
                        <span>Publish Video Broadcast</span>
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CampusMediaBroadcast;
