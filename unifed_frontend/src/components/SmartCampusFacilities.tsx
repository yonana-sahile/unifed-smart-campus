import { useState, FormEvent } from "react";
import type { User, FacilityBooking } from "../types";
import { CampusDatabase } from "../services/api"
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Cpu,
  Users,
  CheckCircle2,
  Plus,
  QrCode,
  Sparkles,
  Shield,
  Search,
  Filter,
  Layers,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";

interface SmartCampusFacilitiesProps {
  user: User;
}

export function SmartCampusFacilities({ user }: SmartCampusFacilitiesProps) {
  const [bookings, setBookings] = useState<FacilityBooking[]>(CampusDatabase.getFacilityBookings());
  const [selectedCampus, setSelectedCampus] = useState<"ALL" | "Tulu Awulia (Main)" | "Masha Campus">("ALL");
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [selectedPass, setSelectedPass] = useState<FacilityBooking | null>(null);

  // New Booking Form State
  const [facilityName, setFacilityName] = useState("ICT High Performance GPU Computing Lab 1");
  const [facilityCode, setFacilityCode] = useState("TULU-ICT-L1");
  const [campus, setCampus] = useState<"Tulu Awulia (Main)" | "Masha Campus">("Tulu Awulia (Main)");
  const [roomType, setRoomType] = useState<"LAB" | "AUDITORIUM" | "SEMINAR_ROOM" | "LIBRARY_CUBICLE">("LAB");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("17:00");
  const [purpose, setPurpose] = useState("");
  const [capacity, setCapacity] = useState(40);

  const availableFacilities = [
    {
      name: "ICT High Performance GPU Computing Lab 1",
      code: "TULU-ICT-L1",
      campus: "Tulu Awulia (Main)" as const,
      type: "LAB" as const,
      capacity: 45,
      specs: "20x RTX 4090 GPUs, 1 Gbps Fiber, Dual 4K Displays"
    },
    {
      name: "Software Engineering Project Lab 2",
      code: "TULU-SE-L2",
      campus: "Tulu Awulia (Main)" as const,
      type: "LAB" as const,
      capacity: 50,
      specs: "Linux Workstations, Local GitLab CI Server, Whiteboard walls"
    },
    {
      name: "Advanced Embedded Systems & IoT Lab",
      code: "TULU-ENG-IOT",
      campus: "Tulu Awulia (Main)" as const,
      type: "LAB" as const,
      capacity: 30,
      specs: "Oscilloscopes, Soldering Stations, Raspberry Pi & ESP32 Benches"
    },
    {
      name: "Central Engineering Auditorium",
      code: "TULU-ENG-AUD",
      campus: "Tulu Awulia (Main)" as const,
      type: "AUDITORIUM" as const,
      capacity: 250,
      specs: "Dual 4K Laser Projectors, Live Streaming Camera Rig, Wireless Mics"
    },
    {
      name: "Masha Campus Multi-Purpose Conference Hall",
      code: "MASHA-MPH-01",
      campus: "Masha Campus" as const,
      type: "SEMINAR_ROOM" as const,
      capacity: 80,
      specs: "Surround Sound System, Video Conferencing Telepresence"
    }
  ];

  const handleCreateBooking = (e: FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      alert("Please enter the academic purpose of the facility reservation.");
      return;
    }

    const newBooking = CampusDatabase.addFacilityBooking({
      facilityName,
      facilityCode,
      campus,
      roomType,
      bookedBy: user.fullName,
      bookedByRole: user.role,
      department: user.department || user.program || "Software Engineering",
      date: bookingDate,
      startTime,
      endTime,
      purpose,
      status: "CONFIRMED",
      capacity,
      resourcesEquipped: ["Standard Network Backbone", "Smart Board", "Power Backup UPS"]
    });

    CampusDatabase.addAuditLog(
      user.id,
      user.fullName,
      user.role,
      "FACILITY_RESERVED",
      "FACILITY_BOOKING",
      newBooking.id,
      `Reserved ${facilityName} for ${bookingDate} (${startTime} - ${endTime}).`
    );

    setBookings(CampusDatabase.getFacilityBookings());
    setShowBookingModal(false);
    setPurpose("");
    setSelectedPass(newBooking);
  };

  const filteredBookings = bookings.filter((b) => {
    if (selectedCampus === "ALL") return true;
    return b.campus === selectedCampus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-900 via-primary to-blue-900 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <h2 className="font-serif font-bold text-xl sm:text-2xl tracking-tight">
              Smart Campus Labs & Facility Hub
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-cyan-100 max-w-2xl">
            Real-time conflict-free reservation system for High-Performance GPU Labs, Hardware Test Benches, and Engineering Auditoriums across Tulu Awulia and Masha campuses.
          </p>
        </div>

        <button
          onClick={() => setShowBookingModal(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center space-x-2 transition shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Reserve Lab / Hall</span>
        </button>
      </div>

      {/* Filter Tabs & Campus Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Campus:</span>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setSelectedCampus("ALL")}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedCampus === "ALL"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            All Campuses
          </button>
          <button
            onClick={() => setSelectedCampus("Tulu Awulia (Main)")}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedCampus === "Tulu Awulia (Main)"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Tulu Awulia (Main)
          </button>
          <button
            onClick={() => setSelectedCampus("Masha Campus")}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedCampus === "Masha Campus"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Masha Campus
          </button>
        </div>
      </div>

      {/* Available Labs Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availableFacilities.slice(0, 3).map((f) => (
          <div
            key={f.code}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                {f.code}
              </span>
              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Available</span>
              </span>
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100">{f.name}</h4>
              <p className="text-xs text-slate-500 mt-1">{f.specs}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5" />
                <span>Max {f.capacity} Seats</span>
              </span>
              <span className="font-semibold text-primary">{f.campus}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Scheduled Bookings */}
      <div className="space-y-3">
        <h4 className="font-serif font-bold text-base text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span>Confirmed Facility Schedules & Passes</span>
        </h4>

        <div className="grid grid-cols-1 gap-3">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{b.facilityName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {b.facilityCode}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold">Purpose:</span> {b.purpose}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{b.date}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{b.startTime} - {b.endTime}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Booked by: <strong className="text-slate-800 dark:text-slate-200">{b.bookedBy}</strong> ({b.bookedByRole})</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <button
                  onClick={() => setSelectedPass(b)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-primary" />
                  <span>Security Pass</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Creation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-6 h-6 text-primary" />
                <h3 className="font-serif font-bold text-lg">Reserve Academic Facility / Lab</h3>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">Select Target Facility</label>
                <select
                  value={facilityCode}
                  onChange={(e) => {
                    const sel = availableFacilities.find((f) => f.code === e.target.value);
                    if (sel) {
                      setFacilityCode(sel.code);
                      setFacilityName(sel.name);
                      setCampus(sel.campus);
                      setRoomType(sel.type);
                      setCapacity(sel.capacity);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-primary"
                >
                  {availableFacilities.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.name} ({f.campus} - {f.capacity} Seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Academic / Research Purpose
                </label>
                <textarea
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="E.g., Senior Capstone Model Training, AI Deep Learning Workshop, Defense Practice..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold cursor-pointer shadow-md"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Security QR Pass Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-primary/40 space-y-4 text-center"
          >
            <div className="flex justify-center">
              <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 border border-cyan-200 dark:border-cyan-800">
                <QrCode className="w-16 h-16" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Authorized Lab Security Pass
              </span>
              <h3 className="font-serif font-bold text-base">{selectedPass.facilityName}</h3>
              <p className="text-xs text-primary font-mono font-bold">{selectedPass.facilityCode}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs space-y-1.5 text-left font-mono">
              <div>
                <span className="text-slate-500">Holder:</span> <strong className="text-slate-900 dark:text-white">{selectedPass.bookedBy}</strong>
              </div>
              <div>
                <span className="text-slate-500">Date:</span> <strong>{selectedPass.date}</strong> ({selectedPass.startTime} - {selectedPass.endTime})
              </div>
              <div>
                <span className="text-slate-500">Pass Hash:</span> <span className="text-emerald-600 font-bold">{selectedPass.id}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPass(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              Dismiss Pass
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
