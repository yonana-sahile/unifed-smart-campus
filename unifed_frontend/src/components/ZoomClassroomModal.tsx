import { useState, useEffect, useRef, FormEvent } from "react";
import type { User, ZoomClassSession, ZoomChatMessage, ZoomAttendee } from "../types";
import { CampusDatabase } from "../services/api";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, Users, MessageSquare, Hand, X, Copy,
  Check, ExternalLink, ShieldCheck, CircleDot, Send, ChevronLeft, ChevronRight,
  PhoneOff, BookOpen, LayoutGrid, Presentation, PenTool, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WhiteboardCanvas } from "./WhiteboardCanvas";
import { JitsiMeeting } from "@jitsi/react-sdk";

interface ZoomClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ZoomClassSession;
  currentUser: User;
  onSessionUpdated?: (updated: ZoomClassSession) => void;
}

export function ZoomClassroomModal({
  isOpen, onClose, session: initialSession, currentUser, onSessionUpdated,
}: ZoomClassroomModalProps) {
  const [session, setSession] = useState<ZoomClassSession>(initialSession);
  const isInstructor = currentUser.role === "INSTRUCTOR" || currentUser.role === "DEPARTMENT_HEAD";

const [isMuted, setIsMuted] = useState(true);
const [isVideoOn, setIsVideoOn] = useState(true);
const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
const [recordingError, setRecordingError] = useState<string | null>(null);
const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

const recordingStreamRef = useRef<MediaStream | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const [viewMode, setViewMode] = useState<"speaker" | "gallery" | "whiteboard">("speaker");
  const [activeDrawer, setActiveDrawer] = useState<"chat" | "participants" | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; left: number }[]>([]);

  // PDF Presenter state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Jitsi live video state + per-open refresh counter
  const [showJitsi, setShowJitsi] = useState(true);
  const [jitsiOpenCount, setJitsiOpenCount] = useState(0);
// Jitsi External API reference
const jitsiCleanupRef = useRef<(() => void) | null>(null);
const jitsiApiRef = useRef<any>(null);

const [jitsiParticipants, setJitsiParticipants] = useState<
  {
    id: string;
    displayName: string;
    role: string;
    isMuted: boolean;
    isVideoMuted: boolean;
  }[]
>([]);
const [isJitsiModerator, setIsJitsiModerator] = useState(false);
const jitsiLocalParticipantIdRef = useRef<string | null>(null);
const chatBottomRef = useRef<HTMLDivElement>(null);
const [copiedId, setCopiedId] = useState(false);
const streamRef = useRef<MediaStream | null>(null);
const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
const [elapsedSeconds, setElapsedSeconds] = useState(0);
useEffect(() => {
  if (isOpen) {
    setJitsiOpenCount((c) => c + 1);
  } else {
    jitsiCleanupRef.current?.();
    jitsiCleanupRef.current = null;
    jitsiApiRef.current = null;
    setJitsiParticipants([]);
    setIsJitsiModerator(false);
jitsiLocalParticipantIdRef.current = null;
  }
}, [isOpen]);

useEffect(() => {
  if (viewMode !== "speaker" || !showJitsi) {
    jitsiCleanupRef.current?.();
    jitsiCleanupRef.current = null;
    jitsiApiRef.current = null;
    setJitsiParticipants([]);
    setIsJitsiModerator(false);
jitsiLocalParticipantIdRef.current = null;
  }
}, [viewMode, showJitsi]);


const handleJitsiApiReady = (api: any) => {
  jitsiCleanupRef.current?.();

  jitsiApiRef.current = api;
  jitsiLocalParticipantIdRef.current = null;
  setIsJitsiModerator(false);

  const refreshParticipants = async () => {
    try {
      const result = await api.getRoomsInfo();

      if (jitsiApiRef.current !== api) return;

      const participants = (result.rooms ?? []).flatMap(
        (room: any) => room.participants ?? []
      );

      setJitsiParticipants(
        participants.map((participant: any) => ({
          id: String(participant.id),
          displayName: participant.displayName || "Unknown participant",
          role: participant.role || "participant",
          isMuted: Boolean(participant.audioMuted),
          isVideoMuted: Boolean(participant.videoMuted),
        }))
      );

      const localId = jitsiLocalParticipantIdRef.current;

      if (localId) {
        const localParticipant = participants.find(
          (participant: any) => String(participant.id) === localId
        );

        setIsJitsiModerator(
          localParticipant?.role === "moderator"
        );
      }
    } catch (error) {
      console.error("[JITSI] Failed to load participants:", error);
    }
  };

  const handleVideoConferenceJoined = (event: any) => {
    jitsiLocalParticipantIdRef.current = String(event.id);
    void refreshParticipants();
  };

  const handleVideoConferenceLeft = () => {
    jitsiLocalParticipantIdRef.current = null;
    setIsJitsiModerator(false);
    setJitsiParticipants([]);
  };

  const handleParticipantRoleChanged = (event: any) => {
    const localId = jitsiLocalParticipantIdRef.current;

    if (!localId || String(event.id) !== localId) return;

    const moderator = event.role === "moderator";

    setIsJitsiModerator(moderator);

    console.info("[JITSI] Local participant role:", event.role);
  };

  const handleParticipantJoined = () => {
    void refreshParticipants();
  };

  const handleParticipantLeft = (participant: any) => {
    setJitsiParticipants((previous) =>
      previous.filter((item) => item.id !== String(participant.id))
    );
  };

  const handleDisplayNameChange = (participant: any) => {
    setJitsiParticipants((previous) =>
      previous.map((item) =>
        item.id === String(participant.id)
          ? {
              ...item,
              displayName:
                participant.displayname ||
                participant.displayName ||
                item.displayName,
            }
          : item
      )
    );
  };

const handleParticipantMuted = () => {
  // Refresh participant audio and video states
  // directly from the Jitsi meeting API.
  void refreshParticipants();
};

  const handleAudioMuteChanged = (event: any) => {
    setIsMuted(event.muted);
  };

  const handleVideoMuteChanged = (event: any) => {
    setIsVideoOn(!event.muted);
  };

  const handleScreenSharingChanged = (event: any) => {
    setIsScreenSharing(event.on);
  };

  const listeners: [string, (...args: any[]) => void][] = [
    ["videoConferenceJoined", handleVideoConferenceJoined],
    ["videoConferenceLeft", handleVideoConferenceLeft],
    ["participantRoleChanged", handleParticipantRoleChanged],
    ["participantJoined", handleParticipantJoined],
    ["participantLeft", handleParticipantLeft],
    ["displayNameChange", handleDisplayNameChange],
    ["participantMuted", handleParticipantMuted],
    ["audioMuteStatusChanged", handleAudioMuteChanged],
    ["videoMuteStatusChanged", handleVideoMuteChanged],
    ["screenSharingStatusChanged", handleScreenSharingChanged],
  ];

  listeners.forEach(([event, callback]) => {
    api.addListener(event, callback);
  });

  jitsiCleanupRef.current = () => {
    listeners.forEach(([event, callback]) => {
      api.removeListener(event, callback);
    });

    if (jitsiApiRef.current === api) {
      jitsiApiRef.current = null;
      jitsiLocalParticipantIdRef.current = null;
      setIsJitsiModerator(false);
    }
  };

  void refreshParticipants();

  api.isAudioMuted()
    .then((muted: boolean) => {
      if (jitsiApiRef.current === api) setIsMuted(muted);
    })
    .catch(console.error);

  api.isVideoMuted()
    .then((muted: boolean) => {
      if (jitsiApiRef.current === api) setIsVideoOn(!muted);
    })
    .catch(console.error);
};


  const sampleSlides = [
    {
      title: "1. Microservices Architectural Principles",
      subtitle: "Decoupling monolithic domains into resilient, independently deployable services",
      diagram: "API Gateway -> [Auth Service] [Course Catalog] [SIS Engine] [Kafka Bus]",
      points: [
        "Single Responsibility Principle applied at application boundary",
        "Polyglot persistence: Relational SQL for SIS, NoSQL for Document logs",
        "Resilience engineering via Resilience4j & Circuit Breaker patterns"
      ]
    },
    {
      title: "2. API Gateway & Reverse Proxy Ingress Routing",
      subtitle: "Centralizing SSL termination, JWT Token Verification & Rate Limiting",
      diagram: "Client Request -> [Kong / Spring Cloud Gateway] -> Internal Private VPC",
      points: [
        "Uniform Authentication header injection",
        "Cross-Cutting Concerns: Logging, Metrics, Dynamic Rate Limiting",
        "Path-based routing: /api/v1/courses -> Course Service Cluster"
      ]
    },
    {
      title: "3. Asynchronous Messaging via Apache Kafka",
      subtitle: "Event-driven distributed state synchronization without tight coupling",
      diagram: "[Producer: Grade Service] ===> [Kafka Topic: grade-published] ===> [Consumer: Student Notifier]",
      points: [
        "Zero data loss via distributed commit-log replication",
        "Consumer Group scaling across high-load semester registration periods",
        "Outbox pattern preventing distributed two-phase commit overhead"
      ]
    },
  ];


  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => setElapsedSeconds((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isOpen) return;
    setSession(initialSession);
    setPdfUrl(initialSession.presentationPdfUrl ?? null);
setPdfName(initialSession.presentationPdfName ?? "");
    if (typeof (initialSession as any).jitsiEnabled === "boolean") {
      setShowJitsi((initialSession as any).jitsiEnabled);
    }
    const currentAttendees = initialSession.activeAttendees || [];
    const deduped = Array.from(
      new Map(currentAttendees.map((a) => [String(a.id), a])).values()
    );
    const exists = deduped.some((a) => String(a.id) === String(currentUser.id));
    if (!exists) {
      const newAtt: ZoomAttendee = {
        id: String(currentUser.id),
        name: currentUser.fullName + (isInstructor ? " (Instructor)" : ""),
        avatarUrl: (currentUser as any).avatarUrl,
        role: isInstructor ? "INSTRUCTOR" : "STUDENT",
        joinedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isMuted: true,
        isVideoOn: true,
        isHandRaised: false
      };
      const nextAttendees = [...deduped, newAtt];
      const updated = { ...initialSession, activeAttendees: nextAttendees };
      setSession(updated);
      CampusDatabase.updateZoomSession(String(initialSession.id), { activeAttendees: nextAttendees })
        .then((res) => { if (onSessionUpdated) onSessionUpdated(res); })
        .catch((err) => console.error("Failed to register attendee:", err));
    } else if (deduped.length !== currentAttendees.length) {
      setSession({ ...initialSession, activeAttendees: deduped });
    }
  }, [isOpen, initialSession.id, currentUser.id]);

  useEffect(() => {
    if (activeDrawer === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [session.chatMessages?.length, activeDrawer]);
// Sync shared classroom PDF from the backend every 5 seconds
useEffect(() => {
  if (!isOpen) return;

  let cancelled = false;

  const syncPresentation = async () => {
    try {
      const sessions = await CampusDatabase.getZoomSessions();

      if (cancelled) return;

      const latest = sessions.find(
        (item: any) => String(item.id) === String(initialSession.id)
      );

      if (!latest) return;

      const nextUrl = latest.presentationPdfUrl ?? null;
      const nextName = latest.presentationPdfName ?? "";

      setPdfUrl((current) =>
        current === nextUrl ? current : nextUrl
      );

      setPdfName((current) =>
        current === nextName ? current : nextName
      );

      setSession((current) => ({
        ...current,
        presentationPdfUrl: nextUrl,
        presentationPdfName: nextName,
      }));
    } catch (error) {
      console.error("[PDF] Presentation sync failed:", error);
    }
  };

  void syncPresentation();

  const intervalId = window.setInterval(() => {
    void syncPresentation();
  }, 5000);

  return () => {
    cancelled = true;
    window.clearInterval(intervalId);
  };
}, [isOpen, initialSession.id]);
const handlePdfUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    alert("Please select a valid PDF file.");
    e.target.value = "";
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    alert("PDF file is too large. Maximum allowed size is 20 MB.");
    e.target.value = "";
    return;
  }

  try {
    const updatedSession =
      await CampusDatabase.uploadZoomSessionPresentation(
        String(session.id),
        file
      );

    setSession(updatedSession);
    setPdfUrl(updatedSession.presentationPdfUrl ?? null);
    setPdfName(updatedSession.presentationPdfName ?? file.name);
    setCurrentSlideIndex(0);

    onSessionUpdated?.(updatedSession);

    alert("PDF uploaded successfully. It is now saved for this classroom.");
  } catch (error: any) {
    console.error("[PDF] Upload failed:", error);

    alert(
      error?.response?.data?.error ||
      error?.response?.data?.detail ||
      "PDF upload failed. Please try again."
    );
  } finally {
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  }
};
 const handleClearPdf = async () => {
  try {
    const updatedSession =
      await CampusDatabase.clearZoomSessionPresentation(
        String(session.id)
      );

    setSession(updatedSession);
    setPdfUrl(null);
    setPdfName("");
    setCurrentSlideIndex(0);

    onSessionUpdated?.(updatedSession);

    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }

    alert("Shared PDF removed successfully.");
  } catch (error: any) {
    console.error("[PDF] Clear failed:", error);

    alert(
      error?.response?.data?.error ||
      error?.response?.data?.detail ||
      "Could not remove the shared PDF. Please try again."
    );
  }
};

const handleToggleRecording = async () => {
  if (!isInstructor) {
    console.warn("[SECURITY] Non-instructor attempted to record. Blocked.");
    return;
  }

  // STOP RECORDING
  if (isRecording) {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (recordingTimerRef.current !== null) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
    return;
  }

  // START RECORDING
  try {
    setRecordingError(null);
    setRecordingBlob(null);
    setRecordingUrl(null);

    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Your browser does not support screen recording.");
    }

    // Ask instructor to select the Jitsi meeting tab.
    // Enable tab audio in the browser sharing prompt when available.
    const displayStream =
      await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 30,
        },
        audio: true,
      });

    recordingStreamRef.current = displayStream;

    if (!displayStream.getVideoTracks().length) {
      throw new Error("No video track was selected.");
    }

    recordedChunksRef.current = [];

    const supportedMimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];

    const mimeType = supportedMimeTypes.find((type) =>
      MediaRecorder.isTypeSupported(type)
    );

    const recorder = mimeType
      ? new MediaRecorder(displayStream, { mimeType })
      : new MediaRecorder(displayStream);

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      console.error("[RECORDING] Recorder error:", event);
      setRecordingError("A recording error occurred.");
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: recorder.mimeType || "video/webm",
      });

      if (blob.size > 0) {
        setRecordingBlob(blob);

        const previewUrl = URL.createObjectURL(blob);
        setRecordingUrl(previewUrl);
      } else {
        setRecordingError("The recording is empty.");
      }

      displayStream.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;

      if (recordingTimerRef.current !== null) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      setIsRecording(false);
    };

    // Stop automatically if the instructor ends browser sharing.
    displayStream.getVideoTracks()[0].addEventListener(
      "ended",
      () => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }
    );

    recorder.start(1000);

    setIsRecording(true);
    setRecordingDuration(0);

    recordingTimerRef.current = window.setInterval(() => {
      setRecordingDuration((previous) => previous + 1);
    }, 1000);

  } catch (error: any) {
    console.error("[RECORDING] Failed to start:", error);

    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;

    setIsRecording(false);

    setRecordingError(
      error?.message || "Could not start recording."
    );
  }
};


// Stop recording resources when the classroom component unmounts.
useEffect(() => {
  return () => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    recordingStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    recordingStreamRef.current = null;
  };
}, []);

// Release temporary browser recording URLs when they are replaced.
useEffect(() => {
  return () => {
    if (recordingUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(recordingUrl);
    }
  };
}, [recordingUrl]);

  const handleEmojiReaction = async (emoji: string) => {
    const id = Date.now();
    const left = Math.random() * 80 + 10;
    setFloatingEmojis((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2500);

    const newMsg: ZoomChatMessage = {
      id: "emoji-" + id,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderRole: isInstructor ? "INSTRUCTOR" : "STUDENT",
      message: `Reacted with ${emoji}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const updatedMessages = [...(session.chatMessages || []), newMsg];
    const updated = { ...session, chatMessages: updatedMessages };
    setSession(updated);

    try {
      const res = await CampusDatabase.updateZoomSession(String(session.id), { chatMessages: updatedMessages });
      if (onSessionUpdated) onSessionUpdated(res);
    } catch (err) {
      console.error("Failed to save reaction:", err);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg: ZoomChatMessage = {
      id: "msg-" + Date.now(),
      senderId: String(currentUser.id),
      senderName: currentUser.fullName,
      senderRole: isInstructor ? "INSTRUCTOR" : "STUDENT",
      message: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    const updatedMessages = [...(session.chatMessages || []), newMsg];
    const updated = { ...session, chatMessages: updatedMessages };
    setSession(updated);
    try {
      const res = await CampusDatabase.updateZoomSession(String(session.id), { chatMessages: updatedMessages });
      if (onSessionUpdated) onSessionUpdated(res);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
    setChatInput("");
  };

  const handleToggleHandRaise = async () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    const updatedAttendees = (session.activeAttendees || []).map((a) =>
      String(a.id) === String(currentUser.id) ? { ...a, isHandRaised: nextState } : a
    );
    let updatedMessages = session.chatMessages || [];
    if (nextState) {
      updatedMessages = [...updatedMessages, {
        id: "sys-" + Date.now(),
        senderId: "system",
        senderName: "Classroom System",
        senderRole: "INSTRUCTOR" as const,
        message: `✋ ${currentUser.fullName} raised a hand to ask a question`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }];
    }
    const updated = { ...session, activeAttendees: updatedAttendees, chatMessages: updatedMessages };
    setSession(updated);
    try {
      const res = await CampusDatabase.updateZoomSession(String(session.id), {
        activeAttendees: updatedAttendees,
        chatMessages: updatedMessages
      });
      if (onSessionUpdated) onSessionUpdated(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLowerAllHands = async () => {
    if (!isInstructor) {
      console.warn("[SECURITY] Non-instructor attempted to lower hands. Blocked.");
      return;
    }
    const updatedAttendees = (session.activeAttendees || []).map((a) => ({ ...a, isHandRaised: false }));
    const updated = { ...session, activeAttendees: updatedAttendees };
    setSession(updated);
    try {
      const res = await CampusDatabase.updateZoomSession(String(session.id), { activeAttendees: updatedAttendees });
      if (onSessionUpdated) onSessionUpdated(res);
    } catch (err) {
      console.error(err);
    }
  };


const handleMuteAll = async () => {
  if (!isInstructor) {
    console.warn("[SECURITY] Non-instructor attempted to mute all. Blocked.");
    return;
  }

  const api = jitsiApiRef.current;

  if (!api) {
    alert("The live meeting is not connected.");
    return;
  }
if (!isJitsiModerator) {
  alert("You are not a Jitsi moderator. Mute All is unavailable.");
  return;
}
  try {
    // Mute audio for everyone in the Jitsi meeting.
    // Requires the current Jitsi participant to be a moderator.
    api.executeCommand("muteEveryone", "audio");

    console.info("[JITSI] Mute All command sent.");
  } catch (error) {
    console.error("[JITSI] Failed to send Mute All command:", error);
    alert("Could not send the Mute All command.");
  }
};


const handleEndSessionForEveryone = async () => {
  if (!isInstructor) {
    console.warn("[SECURITY] Non-instructor attempted to end session. Blocked.");
    return;
  }

  if (isRecording) {
    setRecordingError("Stop the recording before ending the class.");
    return;
  }

  if (isUploadingRecording) return;

  if (!confirm("End this classroom for everyone?")) return;

  let recordingUploaded = false;

  try {
    setRecordingError(null);
    setIsUploadingRecording(true);

    // 1. Upload the stopped browser recording first.
    if (recordingBlob) {
      await CampusDatabase.uploadZoomSessionRecording(
        String(session.id),
        recordingBlob,
        formatTimer(recordingDuration || elapsedSeconds)
      );

      recordingUploaded = true;

      // Prevent duplicate uploads if ending the class needs a retry.
      setRecordingBlob(null);
    }

    // 2. End the classroom using the dedicated backend endpoint.
    const res = await CampusDatabase.endZoomSession(
      String(session.id)
    );

    // 3. Update local state and notify the parent.
    setSession(res);
onSessionUpdated?.(res);

// Release the temporary browser recording URL.
if (recordingUrl?.startsWith("blob:")) {
  URL.revokeObjectURL(recordingUrl);
}

setRecordingUrl(null);
setRecordingBlob(null);
setRecordingError(null);

onClose();
  } catch (err: any) {
    console.error("[CLASSROOM] Failed to end session:", err);

    setRecordingError(
      recordingUploaded
        ? "Recording saved successfully, but the classroom could not be ended. Please try End Class again."
        : err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Could not save the recording or end the classroom. The session is still live."
    );
  } finally {
    setIsUploadingRecording(false);
  }
};
  const handleCopyMeetingDetails = () => {
    const text = `Mekdela Amba University - Zoom Live Lecture\nCourse: ${session.courseCode} - ${session.courseTitle}\nTopic: ${session.title}\nMeeting ID: ${session.meetingId}\nPasscode: ${session.passcode}\nJoin Link: ${session.joinUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-7xl h-[92vh] max-h-[900px] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 zoom-glass-deep border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 zoom-crimson-gradient text-red-100 border border-red-500/40 px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-wider shadow-sm shadow-red-900/30">
                <span className="w-2 h-2 rounded-full bg-red-100 zoom-live-dot" />
                <span>ZOOM CLASSROOM</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-slate-100 truncate max-w-[280px] sm:max-w-md">
                    {session.courseCode}: {session.title}
                  </span>
                  <span className="hidden md:inline-flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3 h-3" />
                    <span>AES-256</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-[300px] sm:max-w-lg">
                  Instructor: <span className="text-slate-200 font-medium">{session.instructorName}</span> • Meeting ID:{" "}
                  <span className="font-mono text-slate-300">{session.meetingId}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs font-mono text-slate-300" title="Session timer · not recording">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="font-bold">{formatTimer(elapsedSeconds)}</span>
                <span className="text-[9px] text-amber-300 font-bold bg-amber-950/40 px-1.5 py-0.5 rounded ml-1">DEMO</span>
              </div>
              <button
                type="button"
                onClick={handleCopyMeetingDetails}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={session.joinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-medium rounded-lg"
              >
                <span>Open in Zoom</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recording banner + download prompt */}
          {isRecording && (
            <div className="bg-red-950/80 border-b border-red-600/50 px-4 py-1.5 flex items-center justify-center space-x-2 text-xs shrink-0 z-40">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-200 font-semibold">
                Recording in progress — {formatTimer(recordingDuration)}
              </span>
              <span className="text-red-400 text-[10px]">
               (Selected tab/screen and available shared audio are being recorded)
              </span>
            </div>
          )}
                    {recordingError && (
            <div className="bg-red-950/80 border-b border-red-600/50 px-4 py-2 text-center text-xs text-red-300 shrink-0">
              Recording error: {recordingError}
              <button
                type="button"
                onClick={() => setRecordingError(null)}
                className="ml-3 underline hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}
          {recordingUrl && !isRecording && (
            <div className="bg-emerald-950/80 border-b border-emerald-600/50 px-4 py-1.5 flex items-center justify-center space-x-3 text-xs shrink-0 z-40">
              <span className="text-emerald-200 font-semibold">
                ✅ Recording ready · {formatTimer(recordingDuration)}
              </span>
              <a
                href={recordingUrl}
                download={`MAU-Lecture-${session.courseCode}-${new Date().toISOString().slice(0, 10)}.webm`}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-semibold text-[11px]"
              >
                ⬇ Download
              </a>
              <button
                onClick={() => setRecordingUrl(null)}
                className="text-emerald-400 hover:text-emerald-200 text-[11px] underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Floating Emoji Animation Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
              {floatingEmojis.map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 50, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -400, scale: [0.5, 1.2, 1.2, 1] }}
                  transition={{ duration: 2.5, ease: "easeOut" }}
                  className="absolute bottom-20 text-5xl drop-shadow-lg"
                  style={{ left: `${e.left}%` }}
                >
                  {e.emoji}
                </motion.div>
              ))}
            </div>

            <div className="flex-1 flex flex-col bg-slate-900/50 p-2 sm:p-4 overflow-y-auto">
              {/* Speaker View */}
              {viewMode === "speaker" && (
                <div className="flex-1 flex flex-col h-full space-y-3">
                  <div className="flex-1 relative rounded-xl bg-slate-950 border border-slate-800 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-semibold text-slate-200">
                          {isInstructor ? "You are sharing: Slides" : `${session.instructorName}'s Screen`}
                        </span>
{!showJitsi && !pdfUrl && (
  <span className="text-[10px] text-slate-400 font-mono">
    ({currentSlideIndex + 1}/{sampleSlides.length})
  </span>
)}
                      </div>
{!showJitsi && !pdfUrl && (
  <div className="flex items-center space-x-1">
    <button
      onClick={() => setCurrentSlideIndex((p) => Math.max(0, p - 1))}
      disabled={currentSlideIndex === 0}
      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
    >
      <ChevronLeft className="w-3.5 h-3.5" />
    </button>
    <button
      onClick={() => setCurrentSlideIndex((p) => Math.min(sampleSlides.length - 1, p + 1))}
      disabled={currentSlideIndex === sampleSlides.length - 1}
      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
    >
      <ChevronRight className="w-3.5 h-3.5" />
    </button>
  </div>
)}
                    </div>

                    <div className="flex-1 relative flex flex-col justify-center items-center bg-slate-950 overflow-hidden">
                      {showJitsi ? (
                        <div className="w-full h-full flex flex-col bg-black">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/95 border-b border-slate-800 text-[11px] shrink-0">
                            <span className="text-slate-400">
                              Live Room:{" "}
                              <span className="font-mono text-slate-200">
                               MAU-Classroom-{session.id}
                              </span>
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                              onClick={() => {
  jitsiCleanupRef.current?.();
  jitsiCleanupRef.current = null;
  jitsiApiRef.current = null;
  setJitsiParticipants([]);
  setJitsiOpenCount((c) => c + 1);
}}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                              >
                                Reload Video
                              </button>
                              <button
                                type="button"
onClick={() => {
  jitsiCleanupRef.current?.();
  jitsiCleanupRef.current = null;
  setJitsiParticipants([]);
  setShowJitsi(false);
}}
                                className="px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40"
                              >
                                Slides / PDF
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 w-full min-h-0">
                            <JitsiMeeting
                              key={`jitsi-${session.id}-${jitsiOpenCount}`}
                              domain="meet.jit.si"
                              onApiReady={handleJitsiApiReady}
                             roomName={`MAU-Classroom-${session.id}`}
                              configOverwrite={{
                                startWithAudioMuted: true,
                                startWithVideoMuted: false,
                                disableModeratorIndicator: true,
                                prejoinPageEnabled: false,
                                enableLobby: false,
                                enableUserRolesBasedOnToken: false,
                                requireDisplayName: false,
                              }}
                              interfaceConfigOverwrite={{
                                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                              }}
                              userInfo={{
                                displayName: currentUser.fullName,
                                email: currentUser.email,
                              }}
onReadyToClose={() => {
  jitsiCleanupRef.current?.();
  jitsiCleanupRef.current = null;
  setJitsiParticipants([]);
  setShowJitsi(false);
}}
                              getIFrameRef={(iframeRef) => {
                                iframeRef.style.height = "100%";
                                iframeRef.style.width = "100%";
                                iframeRef.style.border = "none";
                              }}
                            />
                          </div>
                        </div>
                      ) : pdfUrl ? (
                        <div className="w-full h-full flex flex-col">
                          <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs shrink-0">
                            <span className="text-slate-300 font-medium truncate">📄 {pdfName}</span>
                            {isInstructor && (
  <button
    onClick={handleClearPdf}
    className="text-red-400 hover:text-red-300 px-2 py-0.5 rounded bg-red-500/10"
  >
    Remove PDF
  </button>
)}
                          </div>
                          <iframe
                            src={`${pdfUrl}#toolbar=0&navpanes=0`}
                            className="w-full flex-1 border-none bg-white"
                            title="PDF Presentation"
                          />
                        </div>
                      ) : (
                        <div className="max-w-2xl w-full bg-slate-900/90 border border-slate-800/80 rounded-xl p-6 shadow-2xl">
                          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                              MAU Computer Science & Engineering
                            </span>
                            <span className="text-xs text-slate-400">Week 7 • Lecture 14</span>
                          </div>
                          <h2 className="text-xl font-bold text-white mb-1">
                            {sampleSlides[currentSlideIndex].title}
                          </h2>
                          <p className="text-xs text-slate-300 mb-4">
                            {sampleSlides[currentSlideIndex].subtitle}
                          </p>
                          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-blue-500/30 text-blue-300 font-mono text-xs my-3 text-center">
                            {sampleSlides[currentSlideIndex].diagram}
                          </div>
                          <div className="space-y-2 mt-4">
                            {sampleSlides[currentSlideIndex].points.map((pt, idx) => (
                              <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {!showJitsi && (
                      <div className="absolute top-12 right-4 w-44 sm:w-56 h-32 sm:h-40 rounded-xl overflow-hidden shadow-2xl border-2 border-blue-500/80 bg-slate-900">
                        <div className="flex-1 h-full relative flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xl mx-auto">
                            {currentUser.fullName.charAt(0)}
                          </div>
                        </div>
                        <div className="px-2 py-1 bg-slate-950/90 flex items-center justify-between text-[11px]">
                          <span className="truncate text-slate-200 font-medium">
                            {currentUser.fullName} (You)
                          </span>
                          {isMuted ? <MicOff className="w-3 h-3 text-red-400 shrink-0" /> : <Mic className="w-3 h-3 text-emerald-400 shrink-0" />}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Horizontal attendees */}
                  <div className="h-28 flex items-center space-x-2.5 overflow-x-auto pb-1 shrink-0">
                    {!showJitsi && (
                      <div className="w-36 h-24 rounded-xl zoom-glass zoom-video-tile border border-slate-700/50 p-1 flex flex-col justify-between shrink-0 overflow-hidden">
                        <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center font-bold text-xs text-white">
                              {currentUser.fullName.charAt(0)}
                            </div>
                            {isHandRaised && <span className="absolute -top-1 -right-2 text-sm">✋</span>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-1.5 py-0.5 bg-slate-900/90 rounded text-[10px]">
                          <span className="truncate text-slate-300 font-medium">You</span>
                          {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                        </div>
                      </div>
                    )}
                    {(session.activeAttendees || [])
                      .filter((a) => String(a.id) !== String(currentUser.id) && a.role === "STUDENT")
                      .map((att) => (
                        <div
                          key={att.id}
                          className="w-36 h-24 rounded-xl zoom-glass zoom-video-tile border border-slate-700/50 p-1 flex flex-col justify-between shrink-0 overflow-hidden"
                        >
                          <div className="flex-1 flex items-center justify-center">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                                {att.name.charAt(0)}
                              </div>
                              {att.isHandRaised && <span className="absolute -top-1 -right-2 text-sm">✋</span>}
                            </div>
                          </div>
                          <div className="flex items-center justify-between px-1.5 py-0.5 bg-slate-900/90 rounded text-[10px]">
                            <span className="truncate text-slate-300">{att.name}</span>
                            {att.isMuted ? <MicOff className="w-3 h-3 text-red-400 shrink-0" /> : <Mic className="w-3 h-3 text-emerald-400 shrink-0" />}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Gallery View */}
              {viewMode === "gallery" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr h-full">
                  {(session.activeAttendees || []).map((att) => (
                    <div
                      key={att.id}
                      className="rounded-xl zoom-glass zoom-video-tile border border-slate-800 p-3 flex flex-col justify-between min-h-[160px]"
                    >
                      <div className="flex-1 flex items-center justify-center">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-base text-slate-200">
                            {att.name.charAt(0)}
                          </div>
                          {att.isHandRaised && <span className="absolute -top-1 -right-2 text-base">✋</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 bg-slate-900/90 rounded-lg text-xs">
                        <span className="truncate text-slate-200 font-medium">{att.name}</span>
                        {att.isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Whiteboard View */}
              {viewMode === "whiteboard" && (
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <WhiteboardCanvas />
                </div>
              )}
            </div>

            {/* Side Drawer (Chat / Participants) */}
            {activeDrawer && (
              <div className="w-80 sm:w-96 border-l border-slate-800 bg-slate-900/95 flex flex-col shrink-0">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <span className="font-semibold text-sm text-slate-100 capitalize">{activeDrawer}</span>
                  <button
                    onClick={() => setActiveDrawer(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {activeDrawer === "chat" ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
                      {(session.chatMessages || []).map((msg) => (
                        <div key={msg.id} className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-semibold text-slate-200">{msg.senderName}</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <p className="text-slate-200 break-words">{msg.message}</p>
                        </div>
                      ))}
                      <div ref={chatBottomRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                    {isInstructor && (
                      <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                        <button
                          type="button"
                          onClick={handleMuteAll}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        >
                          Mute All
                        </button>
                        <button
                          type="button"
                          onClick={handleLowerAllHands}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        >
                          Lower Hands
                        </button>
                      </div>
                    )}
{/* Live Jitsi participants */}
<div className="pb-2 border-b border-slate-800">
  <div className="flex items-center justify-between mb-2">
    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
      Live Meeting
    </span>
    <span className="text-[10px] text-slate-400">
      {jitsiParticipants.length} connected
    </span>
  </div>

  {jitsiParticipants.length === 0 ? (
    <p className="text-[11px] text-slate-500 py-2">
      Waiting for live participants...
    </p>
  ) : (
    jitsiParticipants.map((participant) => (
      <div
        key={participant.id}
        className="flex items-center justify-between p-2 mb-1 rounded-xl bg-emerald-950/20 border border-emerald-800/30"
      >
        <div className="flex items-center space-x-2 truncate">
          <div className="w-7 h-7 rounded-full bg-emerald-900/60 flex items-center justify-center font-bold text-[11px] shrink-0">
            {participant.displayName.charAt(0).toUpperCase()}
          </div>
          <span className="truncate text-slate-200 font-medium">
            {participant.displayName}
          </span>
          {participant.role === "moderator" && (
            <span className="text-[9px] text-blue-300">Host</span>
          )}
        </div>

<div className="flex items-center gap-2 shrink-0">
  {participant.isMuted ? (
    <MicOff
      className="w-3.5 h-3.5 text-red-400"
      title="Microphone muted"
    />
  ) : (
    <Mic
      className="w-3.5 h-3.5 text-emerald-400"
      title="Microphone on"
    />
  )}

  {participant.isVideoMuted ? (
    <VideoOff
      className="w-3.5 h-3.5 text-red-400"
      title="Camera off"
    />
  ) : (
    <Video
      className="w-3.5 h-3.5 text-emerald-400"
      title="Camera on"
    />
  )}
</div>
      </div>
    ))
  )}
</div>

{/* Existing database attendees */}
<div className="pt-2">
  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
    Registered Attendees
  </p>

  {(session.activeAttendees || []).map((att) => (
    <div
      key={att.id}
      className="flex items-center justify-between p-2 mb-1 rounded-xl bg-slate-800/60 border border-slate-700/40"
    >
      <div className="flex items-center space-x-2 truncate">
        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
          {att.name.charAt(0)}
        </div>
        <span className="truncate text-slate-200 font-medium">{att.name}</span>
        {att.isHandRaised && <span>✋</span>}
      </div>
      {att.isMuted ? (
        <MicOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
      ) : (
        <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      )}
    </div>
  ))}
</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div className="px-3 sm:px-5 py-2.5 zoom-glass-deep border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setViewMode("speaker")}
                className={`p-2 rounded-xl border text-xs flex items-center space-x-1 ${
                  viewMode === "speaker"
                    ? "bg-blue-600/25 border-blue-500/50 text-blue-300"
                    : "bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
                title="Speaker / Presentation View"
              >
                <Presentation className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("gallery")}
                className={`p-2 rounded-xl border text-xs flex items-center space-x-1 ${
                  viewMode === "gallery"
                    ? "bg-blue-600/25 border-blue-500/50 text-blue-300"
                    : "bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
                title="Gallery View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("whiteboard")}
                className={`p-2 rounded-xl border text-xs flex items-center space-x-1 ${
                  viewMode === "whiteboard"
                    ? "bg-blue-600/25 border-blue-500/50 text-blue-300"
                    : "bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
                title="Whiteboard"
              >
                <PenTool className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => {
  jitsiApiRef.current?.executeCommand("toggleAudio");
}}
                className={`px-3 py-2 rounded-xl border text-xs font-medium flex flex-col items-center min-w-[56px] ${
                  isMuted
                    ? "bg-red-950/60 border-red-500/40 text-red-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4 mb-0.5" /> : <Mic className="w-4 h-4 mb-0.5" />}
                <span className="text-[10px]">{isMuted ? "Unmute" : "Mute"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
  jitsiApiRef.current?.executeCommand("toggleVideo");
}}
                className={`px-3 py-2 rounded-xl border text-xs font-medium flex flex-col items-center min-w-[56px] ${
                  !isVideoOn
                    ? "bg-red-950/60 border-red-500/40 text-red-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                {isVideoOn ? <Video className="w-4 h-4 mb-0.5" /> : <VideoOff className="w-4 h-4 mb-0.5" />}
                <span className="text-[10px]">{isVideoOn ? "Stop" : "Camera"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
  jitsiApiRef.current?.executeCommand("toggleShareScreen");
}}
                className={`px-3 py-2 rounded-xl border text-xs font-medium flex flex-col items-center min-w-[64px] ${
                  isScreenSharing
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                <MonitorUp className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Sharing</span>
              </button>
{!isInstructor && pdfUrl && (
  <button
    type="button"
    onClick={() => {
      jitsiCleanupRef.current?.();
      jitsiCleanupRef.current = null;
      jitsiApiRef.current = null;
      setJitsiParticipants([]);
      setShowJitsi(false);
      setViewMode("speaker");
    }}
    className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-medium flex flex-col items-center min-w-[54px]"
  >
    <FileText className="w-4 h-4 mb-0.5" />
    <span className="text-[10px]">View PDF</span>
  </button>
)}
{isInstructor && (
  <>
    <input
      ref={pdfInputRef}
      type="file"
      accept="application/pdf"
      onChange={handlePdfUpload}
      className="hidden"
    />

    <button
      type="button"
      onClick={() => {
        jitsiCleanupRef.current?.();
        jitsiCleanupRef.current = null;
        setJitsiParticipants([]);
        setShowJitsi(false);
        pdfInputRef.current?.click();
      }}
      className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex flex-col items-center min-w-[54px]"
    >
      <FileText className="w-4 h-4 mb-0.5" />
      <span className="text-[10px]">PDF</span>
    </button>
  </>
)}

              <button
                type="button"
                onClick={() => {
                  setShowJitsi((prev) => {
                    const next = !prev;
                    if (next) setJitsiOpenCount((c) => c + 1);
                    return next;
                  });
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-medium flex flex-col items-center min-w-[54px] ${
                  showJitsi
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Video className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Live</span>
              </button>

              <div className="hidden md:flex items-center space-x-1 px-2 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
                {["👍", "❤️", "😂", "🎉", "👏"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiReaction(emoji)}
                    className="hover:scale-125 transition-transform text-sm px-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleToggleHandRaise}
                className={`px-2.5 py-2 rounded-xl border text-xs font-medium flex flex-col items-center ${
                  isHandRaised
                    ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
                title="Raise Hand"
              >
                <Hand className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawer((d) => (d === "participants" ? null : "participants"))}
                className={`relative px-3 py-2 rounded-xl border text-xs font-medium flex flex-col items-center min-w-[60px] ${
                  activeDrawer === "participants"
                    ? "bg-blue-600/25 border-blue-500/50 text-blue-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Users className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">People</span>
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {Math.max(
  (session.activeAttendees || []).length,
  jitsiParticipants.length
)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawer((d) => (d === "chat" ? null : "chat"))}
                className={`relative px-3 py-2 rounded-xl border text-xs font-medium flex flex-col items-center min-w-[54px] ${
                  activeDrawer === "chat"
                    ? "bg-blue-600/25 border-blue-500/50 text-blue-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                <MessageSquare className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Chat</span>
                {(session.chatMessages?.length || 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {session.chatMessages?.length}
                  </span>
                )}
              </button>

              {isInstructor && (
<button
  type="button"
  onClick={handleToggleRecording}
  disabled={isUploadingRecording}
  className={`px-3 py-2 rounded-xl border text-xs font-medium flex flex-col items-center min-w-[54px] ${
    isUploadingRecording
      ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60"
      : isRecording
        ? "bg-red-600 border-red-500 text-white"
        : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
  }`}
>
                  <CircleDot className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">{isRecording ? "Stop" : "REC"}</span>
                </button>
              )}
            </div>

            <div>
              {isInstructor ? (
<button
  type="button"
  onClick={handleEndSessionForEveryone}
  disabled={isUploadingRecording}
  className={`px-3.5 py-2 rounded-xl text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm ${
    isUploadingRecording
      ? "bg-slate-700 cursor-not-allowed opacity-70"
      : "bg-red-600 hover:bg-red-500"
  }`}
>
  <PhoneOff className="w-4 h-4" />
  <span>{isUploadingRecording ? "Saving..." : "End Class"}</span>
</button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold flex items-center space-x-1.5"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Leave</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}