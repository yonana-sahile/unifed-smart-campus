import { useState, useEffect } from "react";
import {
  User,
  SmartIoTDevice,
  SecurityCameraFeed,
  BiometricAttendanceEvent,
  IoTHardwareAlert
} from "../types";
import { CampusDatabase } from "../services/api";
import { EthiopianFlag, UniversitySeal } from "./UniversityHeader";
import {
  Cpu,
  Video,
  Cctv,
  Fingerprint,
  Radio,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Zap,
  Lock,
  Unlock,
  Bell,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Play,
  Maximize2,
  Sliders,
  Power,
  Wifi,
  Eye,
  Camera,
  Server,
  Layers,
  Sparkles,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SmartCampusHardwareHubProps {
  user: User;
}

export function SmartCampusHardwareHub({ user }: SmartCampusHardwareHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "CAMERAS" | "TELEMETRY" | "BIOMETRIC" | "ALERTS" | "SIMULATOR"
  >("CAMERAS");

  // ✅ FIXED: Initialize with empty arrays, not Promises
  const [cameras, setCameras] = useState<SecurityCameraFeed[]>([]);
  const [devices, setDevices] = useState<SmartIoTDevice[]>([]);
  const [biometrics, setBiometrics] = useState<BiometricAttendanceEvent[]>([]);
  const [alerts, setAlerts] = useState<IoTHardwareAlert[]>([]);

  const [selectedCampus, setSelectedCampus] = useState<"ALL" | "Tulu Awulia (Main)" | "Masha Campus">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCameraModal, setActiveCameraModal] = useState<SecurityCameraFeed | null>(null);

  // Hardware Simulation State
  const [simulatedDevice, setSimulatedDevice] = useState<string>("");
  const [simMetricValue, setSimMetricValue] = useState<number>(24);
  const [simTriggerAlarm, setSimTriggerAlarm] = useState<boolean>(false);

  // ✅ FIXED: Async loadData to correctly resolve Promises
  const loadData = async () => {
    try {
      const [cams, devs, bios, alrts] = await Promise.all([
        CampusDatabase.getCameraFeeds().catch(() => []),
        CampusDatabase.getIoTDevices().catch(() => []),
        CampusDatabase.getBiometricEvents().catch(() => []),
        CampusDatabase.getHardwareAlerts().catch(() => []),
      ]);

      setCameras(Array.isArray(cams) ? cams : []);
      setDevices(Array.isArray(devs) ? devs : []);
      setBiometrics(Array.isArray(bios) ? bios : []);
      setAlerts(Array.isArray(alrts) ? alrts : []);
    } catch (err) {
      console.error("[HardwareHub] loadData failed:", err);
    }
  };

  useEffect(() => {
    void loadData();

    const handleUpdate = () => void loadData();
    window.addEventListener("uscms_cameras_changed", handleUpdate);
    window.addEventListener("uscms_iot_devices_changed", handleUpdate);
    window.addEventListener("uscms_biometric_changed", handleUpdate);
    window.addEventListener("uscms_hardware_alerts_changed", handleUpdate);

    return () => {
      window.removeEventListener("uscms_cameras_changed", handleUpdate);
      window.removeEventListener("uscms_iot_devices_changed", handleUpdate);
      window.removeEventListener("uscms_biometric_changed", handleUpdate);
      window.removeEventListener("uscms_hardware_alerts_changed", handleUpdate);
    };
  }, []);

  // Ensure the simulated device dropdown selects the first device once loaded
  useEffect(() => {
    if (!simulatedDevice && devices.length > 0) {
      setSimulatedDevice(devices[0].id);
    }
  }, [devices, simulatedDevice]);

  // ✅ FIXED: Async handler for relay toggle
  const handleToggleRelay = async (deviceId: string, currentRelay?: SmartIoTDevice["relayState"]) => {
    let nextState: SmartIoTDevice["relayState"] = "UNLOCKED";
    if (currentRelay === "LOCKED") nextState = "UNLOCKED";
    else if (currentRelay === "UNLOCKED") nextState = "LOCKED";
    else if (currentRelay === "SIREN_OFF") nextState = "SIREN_ON";
    else if (currentRelay === "SIREN_ON") nextState = "SIREN_OFF";

    try {
      await CampusDatabase.updateDeviceRelay(deviceId, nextState);
      await loadData();
    } catch (err) {
      console.error("Failed to toggle relay:", err);
    }
  };

  // ✅ FIXED: Async handler for alert acknowledgment
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await CampusDatabase.acknowledgeHardwareAlert(alertId, user.fullName);
      await loadData();
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    }
  };

  // ✅ FIXED: Async handler for simulated hardware tap
  const handleSimulateHardwareTap = async () => {
    const target = devices.find((d) => d.id === simulatedDevice) || devices[0];
    if (!target) return; // Guard clause if no devices exist yet

    const newEvent: BiometricAttendanceEvent = {
      id: `BIO-SIM-${Date.now()}`,
      deviceId: target.id,
      deviceCode: target.deviceCode,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      method: "FACIAL_RECOGNITION",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      direction: "ENTRY",
      gateName: target.roomOrZone,
      matchedScorePercent: 99.8,
      authStatus: "GRANTED"
    };

    try {
      await CampusDatabase.addBiometricEvent(newEvent);
      await loadData();
      alert(`Hardware Sensor Signal Ingested: Access Granted for ${user.fullName} at [${target.name}]!`);
    } catch (err) {
      console.error("Failed to simulate tap:", err);
      alert("Failed to transmit simulated signal.");
    }
  };

  const filteredCameras = cameras.filter((cam) => {
    const matchesCampus = selectedCampus === "ALL" || cam.campus === selectedCampus;
    const matchesSearch =
      cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.deviceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.buildingBlock.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCampus && matchesSearch;
  });

  const filteredDevices = devices.filter((dev) => {
    const matchesCampus = selectedCampus === "ALL" || dev.campus === selectedCampus;
    const matchesSearch =
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.deviceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.buildingBlock.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCampus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                IoT EDGE MESH ONLINE · 100% OPERATIONAL
              </span>
              <span className="text-xs text-slate-400 font-mono">MQTT Broker: mqtt.mau.edu.et:1883</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <Cpu className="w-6 h-6 text-indigo-400" />
              Unified Smart Campus Hardware & IoT Central Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              የስማርት ካምፓስ የሃርድዌር፣ አይኦቲ እና የደህንነት ካሜራዎች ማዕከል · Real-time CCTV streams, biometric facial recognition turnstiles, environmental micro-sensors, and remote actuator triggers.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-center min-w-[90px]">
              <span className="text-[10px] text-slate-400 block font-mono">LIVE CAMERAS</span>
              <strong className="text-xl font-bold font-mono tabular-nums text-emerald-400">
                {cameras.filter((c) => c.status === "ONLINE").length}/{cameras.length}
              </strong>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-center min-w-[90px]">
              <span className="text-[10px] text-slate-400 block font-mono">IoT NODES</span>
              <strong className="text-xl font-bold font-mono tabular-nums text-indigo-400">
                {devices.length}
              </strong>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-center min-w-[90px]">
              <span className="text-[10px] text-slate-400 block font-mono">HARDWARE ALERTS</span>
              <strong className="text-xl font-bold font-mono tabular-nums text-amber-400">
                {alerts.filter((a) => !a.isAcknowledged).length}
              </strong>
            </div>
          </div>
        </div>

        {/* Subtab Navigation Bar */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveSubTab("CAMERAS")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === "CAMERAS"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Video className="w-4 h-4" />
            Security Cameras & AI Vision ({cameras.length})
          </button>

          <button
            onClick={() => setActiveSubTab("TELEMETRY")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === "TELEMETRY"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Radio className="w-4 h-4" />
            IoT Telemetry & Sensors ({devices.length})
          </button>

          <button
            onClick={() => setActiveSubTab("BIOMETRIC")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === "BIOMETRIC"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            Biometric Gate Access ({biometrics.length})
          </button>

          <button
            onClick={() => setActiveSubTab("ALERTS")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === "ALERTS"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Bell className="w-4 h-4" />
            Edge Hardware Alerts ({alerts.filter((a) => !a.isAcknowledged).length})
          </button>

          <button
            onClick={() => setActiveSubTab("SIMULATOR")}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-2 ml-auto ${
              activeSubTab === "SIMULATOR"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-amber-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Hardware Signal Simulator
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search device code, IP, building, zone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["ALL", "Tulu Awulia (Main)", "Masha Campus"].map((cmp) => (
            <button
              key={cmp}
              onClick={() => setSelectedCampus(cmp as any)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                selectedCampus === cmp
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {cmp}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: SECURITY CAMERAS & AI VISION */}
      {activeSubTab === "CAMERAS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCameras.map((cam) => (
            <div
              key={cam.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Camera Video Simulation Box */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                <img
                  src={cam.streamUrl}
                  alt={cam.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity duration-300"
                />

                {/* Scanline / Grid overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/60 pointer-events-none" />

                {/* Live Badge & Timestamp */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white flex items-center gap-1.5 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE REC
                  </span>
                  <span className="font-mono text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                    {cam.fps} FPS · {cam.resolution}
                  </span>
                </div>

                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => setActiveCameraModal(cam)}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/90 transition backdrop-blur-xs"
                    title="Fullscreen Feed"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* AI Detection Overlay Tags */}
                {cam.aiObjectDetection && (
                  <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-white">
                    <div className="flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded backdrop-blur-xs border border-white/10">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>
                        AI Vision: {cam.aiObjectDetection.peopleCount} Pedestrians ·{" "}
                        {cam.aiObjectDetection.vehiclesCount} Vehicles
                      </span>
                    </div>

                    {cam.motionDetected && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/80 text-white font-bold animate-pulse">
                        MOTION DETECTED
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Feed Meta Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {cam.name}
                    </h3>
                    <p className="text-xs text-slate-400">{cam.amharicName}</p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {cam.deviceCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Zone / Location:</span>
                    <span className="font-medium truncate block">{cam.roomOrZone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Campus & Block:</span>
                    <span className="font-medium truncate block">
                      {cam.campus} · {cam.buildingBlock}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span>IP: {cam.ipAddress}</span>
                    <span>·</span>
                    <span>MAC: {cam.macAddress}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    {cam.protocol}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: IoT TELEMETRY & MICRO-SENSORS */}
      {activeSubTab === "TELEMETRY" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((dev) => (
            <div
              key={dev.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      {dev.deviceType === "ENVIRONMENTAL_SENSOR" && <Activity className="w-4 h-4" />}
                      {dev.deviceType === "FIRE_SMOKE_DETECTOR" && <Flame className="w-4 h-4" />}
                      {dev.deviceType === "RFID_GATE_TURNSTILE" && <Lock className="w-4 h-4" />}
                      {dev.deviceType === "SMART_POWER_METER" && <Zap className="w-4 h-4" />}
                      {dev.deviceType === "RFID_STORE_SCANNER" && <Radio className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                        {dev.name}
                      </h3>
                      <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                        {dev.deviceCode}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {dev.status}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {dev.roomOrZone} · {dev.buildingBlock}
                </div>

                {/* Telemetry Sensor Readout Grid */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {dev.telemetry.map((t, idx) => (
                    <div key={idx} className="text-center p-1.5">
                      <span className="text-[10px] text-slate-400 block truncate">{t.metric}</span>
                      <strong className="text-sm font-mono font-bold text-slate-900 dark:text-white tabular-nums block mt-0.5">
                        {t.value} <span className="text-[10px] font-normal text-slate-400">{t.unit}</span>
                      </strong>
                    </div>
                  ))}
                </div>

                {/* Signal & Firmware */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                  <div>Proto: {dev.protocol}</div>
                  <div className="text-right">Signal: {dev.signalDbm || -50} dBm</div>
                </div>
              </div>

              {/* Relay Actuator Button */}
              {dev.relayState && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[10px]">Actuator State:</span>
                    <strong
                      className={`font-mono text-xs font-bold ${
                        dev.relayState === "LOCKED" || dev.relayState === "SIREN_ON"
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {dev.relayState}
                    </strong>
                  </div>

                  <button
                    onClick={() => handleToggleRelay(dev.id, dev.relayState)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors shadow-xs"
                  >
                    <Power className="w-3.5 h-3.5" />
                    Toggle Relay
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: BIOMETRIC GATE ACCESS & ATTENDANCE */}
      {activeSubTab === "BIOMETRIC" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Live Biometric Attendance & Security Gate Ingress Ledger
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Integrated facial recognition scanners and Mifare RFID turnstile telemetry across campus gates.
              </p>
            </div>
            <button
              onClick={() => handleSimulateHardwareTap()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              Simulate Gate Tap
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Subject Name & Role</th>
                  <th className="py-3 px-4">Gate Location</th>
                  <th className="py-3 px-4">Biometric Method</th>
                  <th className="py-3 px-4 text-center">Match Confidence</th>
                  <th className="py-3 px-4 text-right">Access Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {biometrics.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {ev.timestamp}
                    </td>

                    <td className="py-3 px-4">
                      <strong className="text-slate-900 dark:text-white font-medium block">
                        {ev.userName}
                      </strong>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ev.userRole}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        {ev.gateName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Device: {ev.deviceCode}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {ev.method.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {ev.matchedScorePercent}%
                    </td>

                    <td className="py-3 px-4 text-right">
                      {ev.authStatus === "GRANTED" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Access Granted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Denied / Locked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EDGE HARDWARE ALERTS */}
      {activeSubTab === "ALERTS" && (
        <div className="space-y-3">
          {alerts.map((al) => (
            <div
              key={al.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                al.severity === "CRITICAL" || al.severity === "EMERGENCY"
                  ? "bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-900/60"
                  : al.severity === "WARNING"
                  ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg mt-0.5 ${
                    al.severity === "CRITICAL" || al.severity === "EMERGENCY"
                      ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                      : al.severity === "WARNING"
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        al.severity === "CRITICAL"
                          ? "bg-red-600 text-white"
                          : al.severity === "WARNING"
                          ? "bg-amber-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {al.severity}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {al.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {al.message}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-2">
                    <span>Node: {al.deviceCode}</span>
                    <span>·</span>
                    <span>{al.zone}</span>
                    <span>·</span>
                    <span>{al.timestamp}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {al.isAcknowledged ? (
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Acknowledged by {al.acknowledgedBy}
                  </span>
                ) : (
                  <button
                    onClick={() => handleAcknowledgeAlert(al.id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    Acknowledge Alert
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: HARDWARE SIGNAL SIMULATOR (CREATIVE LAB) */}
      {activeSubTab === "SIMULATOR" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              Interactive Hardware Signal Ingestion Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Simulate real-world IoT telemetry injections, smoke detection thresholds, and door barrier triggers without physical test hardware.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Edge Node
              </label>
              <select
                value={simulatedDevice}
                onChange={(e) => setSimulatedDevice(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.deviceCode}] {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Simulated Metric Reading: {simMetricValue}°C / ppm
              </label>
              <input
                type="range"
                min="10"
                max="80"
                value={simMetricValue}
                onChange={(e) => setSimMetricValue(parseInt(e.target.value))}
                className="w-full accent-indigo-600 mt-2"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSimulateHardwareTap}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4 animate-spin" />
                Transmit Simulated Signal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN CAMERA MODAL */}
      <AnimatePresence>
        {activeCameraModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden text-white"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Video className="w-5 h-5 text-emerald-400" />
                    {activeCameraModal.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    RTSP Stream: rtsp://10.140.10.101:554/live/ch0 · {activeCameraModal.resolution}
                  </span>
                </div>
                <button
                  onClick={() => setActiveCameraModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="relative aspect-video bg-black flex items-center justify-center">
                <img
                  src={activeCameraModal.streamUrl}
                  alt={activeCameraModal.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-red-600 px-2 py-0.5 rounded text-xs font-bold font-mono">
                  LIVE 4K PTZ
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
