export type UserRole =
  | "STUDENT"
  | "INSTRUCTOR"
  | "REGISTRAR"
  | "DEPARTMENT_HEAD"
  | "ADMIN"
  | "DEAN"
  | "AUDITOR"
  | "LIBRARY_STAFF"
  | "FINANCE_OFFICER"
  | "MATERIAL_MANAGER";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  phoneNumber?: string;
  // Role-specific fields
  studentId?: string;
  academicYear?: number;
  semester?: number;
  program?: string;
  gpa?: number;
  cgpa?: number;
  outstandingFees?: number;
  costSharingBalance?: number;
  instructorId?: string;
  department?: string;
  specialization?: string;
  officeHours?: string;
  staffId?: string;
  librarySection?: string;
  officerId?: string;
}

export interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  description: string;
  department: string;
  instructorId: string;
  instructorName: string;
  semester: string;
  academicYear: number;
  capacity: number;
  enrolledStudentsCount: number;
  prerequisites: string[];
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  fileType: "PDF" | "Video" | "Document" | "Slide";
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileData?: string; // base64 Data URL for download
  chapterWeek?: string;
  instructorName?: string;
  uploadedAt: string;
  description: string;
}

export interface Announcement {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  content: string;
  postedBy: string;
  postedAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  dueDate: string;
  maxScore: number;
  description: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  fileUrl?: string;
  fileName?: string;
  score?: number;
  feedback?: string;
  status: "PENDING" | "GRADED";
}

export interface Question {
  questionText: string;
  questionType: "MCQ" | "TF" | "short_answer";
  options: string[];
  correctAnswer: string;
  marks: number;
}

export interface Exam {
  id: string;
  courseId: string;
  courseTitle: string;
  examTitle: string;
  examDate: string;
  durationMinutes: number;
  totalMarks: number;
  instructions: string;
  questions: Question[];
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "CLOSED" | "GRADED" | "ARCHIVED";
  // Push portal fields
  isPushed?: boolean;
  pushedAt?: string;
  createdBy?: string;
  category?: "MID_EXAM" | "FINAL_EXAM" | "QUIZ" | "PRACTICE" | "TEST" | "EXAM" | string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  answers: { [questionIndex: number]: string };
  score?: number;
  status: "IN_PROGRESS" | "SUBMITTED";
  startedAt: string;
  submittedAt?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  creditHours: number;
  continuousAssessmentScore: number; // Max 50
  midExamScore: number; // Max 20
  finalExamScore: number; // Max 30
  totalGrade: number; // Max 100
  letterGrade: string; // A, B, C, D, F
  gradePoint: number; // Scale 4.0
  semester: string;
  status: "CALCULATED" | "SUBMITTED" | "APPROVED" | "RETURNED";
  comments?: string;
}

export interface Transcript {
  id: string;
  studentId: string;
  studentName: string;
  generatedDate: string;
  cgpa: number;
  totalCredits: number;
  verificationCode: string;
  grades: Grade[];
  isApproved: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseCode: string;
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
  lastUpdated: string;
  meetsMinimum: boolean; // 80% threshold required for exam & grading
}

export interface AttendanceCheckIn {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  status: "PRESENT" | "LATE";
  method: string;
  checkedInAt: string;
  ipAddress?: string;
}

export interface AttendanceSession {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  instructorId: string;
  instructorName: string;
  title: string;
  topic?: string;
  location?: string;
  sessionDate: string;
  startedAt: string;
  expiresAt: string;
  endedAt?: string;
  checkInCode: string | null;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  lateAfterMinutes: number;
  totalsApplied: boolean;
  checkIns: AttendanceCheckIn[];
  checkedInCount: number;
  secondsRemaining: number;
  isExpired: boolean;
}

export interface InstructorEvaluation {
  id: string;
  studentId: string;
  instructorId: string;
  instructorName: string;
  courseId: string;
  courseCode: string;
  ratings: {
    clarity: number;
    punctuality: number;
    helpfulness: number;
    assessmentFairness: number;
    overallRating: number;
  };
  comments: string;
  semester: string;
  submittedAt: string;
}

export interface CourseOutlineForm {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  department: string;
  syllabus: string;
  learningObjectives: string[];
  weeklySchedule: {
    week: number;
    topic: string;
    deliverables: string;
  }[];
  assessmentPolicy: {
    continuousAssessment: number; // 50
    midExam: number; // 20
    finalExam: number; // 30
  };
  approvedByDeptHead: boolean;
  updatedAt: string;
}

export interface LibraryResource {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category: "Computer Science" | "Software Engineering" | "Mathematics" | "General Engineering" | "National Curriculum";
  resourceType: "BOOK" | "VIDEO" | "ARTICLE" | "LECTURE_NOTE";
  fileUrl?: string;
  fileSize: string;
  downloadsCount: number;
  accessLevel: "PUBLIC" | "STUDENTS_ONLY" | "FACULTY_ONLY";
  uploadedBy: string;
  uploadedAt: string;
  description: string;
}

export interface PaymentTransaction {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentMethod: "TELEBIRR" | "CBE_BIRR" | "AWASH_BANK" | "DIRECT_DEPOSIT";
  paymentType: "TUITION" | "COST_SHARING" | "DORMITORY" | "ID_CARD" | "REGISTRATION";
  referenceNumber: string;
  status: "VERIFIED" | "PENDING" | "REJECTED";
  receiptNumber: string;
  timestamp: string;
  verifiedBy?: string;
}

export interface Scholarship {
  id: string;
  studentId: string;
  studentName: string;
  scholarshipType: "MERIT_BASED" | "NEED_BASED" | "MOE_SPECIAL_GRANT" | "FEMALE_ENGINEERING_INCENTIVE";
  amount: number;
  semester: string;
  academicYear: number;
  status: "ISSUED" | "APPLIED";
  issuedDate: string;
}

export interface MoEAdmissionRecord {
  id: string;
  nationalExamRoll: string;
  fullName: string;
  gender: "M" | "F";
  departmentAssigned: string;
  nationalExamScore: number;
  status: "ADMITTED" | "VERIFIED" | "REGISTERED";
  batchYear: number;
  faydaNationalId: string;
}

export interface CertificateRecord {
  id: string;
  studentId: string;
  studentName: string;
  certificateType: "COMPLETION" | "ENROLLMENT" | "DEAN_HONOR_ROLL" | "DEGREE_ATTESTATION";
  issueDate: string;
  verificationCode: string;
  program: string;
  isIssued: boolean;
}

export interface AIRiskPrediction {
  studentId: string;
  studentName: string;
  program: string;
  cgpa: number;
  attendancePercentage: number;
  continuousAssessmentAvg: number;
  dropoutProbability: number; // 0.00 to 1.00 via Logistic Regression
  classification: "NOT_AT_RISK" | "MODERATE_RISK" | "HIGH_RISK";
  keyRiskFactors: string[];
  recommendedAction: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  ipAddress: string;
  description: string;
}

export interface SystemSettings {
  semesterDates: {
    start: string;
    end: string;
  };
  registrationDeadline: string;
  examPeriod: {
    start: string;
    end: string;
  };
  gradingScale: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  academicYearFrozen: boolean;
}

export interface ClearanceDepartmentStatus {
  department: "LIBRARY" | "FINANCE" | "DORMITORY" | "DEPARTMENT_LAB" | "REGISTRAR";
  departmentName: string;
  status: "PENDING" | "CLEARED" | "REJECTED";
  officerName?: string;
  clearedAt?: string;
  remarks?: string;
  duesAmount?: number;
}

export interface StudentClearance {
  id: string;
  studentId: string;
  studentName: string;
  program: string;
  academicYear: number;
  reason: "GRADUATION" | "END_OF_YEAR" | "WITHDRAWAL" | "TRANSFER";
  initiatedDate: string;
  overallStatus: "IN_PROGRESS" | "APPROVED" | "BLOCKED";
  digitalStampHash?: string;
  stages: ClearanceDepartmentStatus[];
}

export interface FacilityBooking {
  id: string;
  facilityName: string;
  facilityCode: string;
  campus: "Tulu Awulia (Main)" | "Masha Campus";
  roomType: "LAB" | "AUDITORIUM" | "SEMINAR_ROOM" | "LIBRARY_CUBICLE";
  bookedBy: string;
  bookedByRole: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: "CONFIRMED" | "PENDING" | "CANCELLED";
  capacity: number;
  resourcesEquipped: string[];
}

export interface CampusAlert {
  id: string;
  title: string;
  message: string;
  category: "ACADEMIC" | "EMERGENCY" | "WEATHER" | "FACILITY" | "FINANCE";
  severity: "INFO" | "WARNING" | "CRITICAL";
  targetAudience: "ALL" | "STUDENTS" | "FACULTY" | "STAFF";
  senderName: string;
  timestamp: string;
  activeUntil: string;
  channelsSent: ("PORTAL" | "TELEGRAM" | "SMS")[];
}

export interface CampusMediaPost {
  id: string;
  title: string;
  description: string;
  category: "CAMPUS_NEWS" | "RESEARCH_INNOVATION" | "GRADUATION_CEREMONY" | "TECH_EXPO" | "PRESIDENTIAL_ADDRESS" | "STUDENT_LIFE";
  videoUrl: string;
  thumbnailUrl: string;
  postedBy: string;
  authorRole: string;
  postedAt: string;
  duration: string;
  viewsCount: number;
  likesCount: number;
  featured?: boolean;
  tags: string[];
}

export interface ZoomAttendee {
  id: string;
  name: string;
  avatarUrl?: string;
  role: "INSTRUCTOR" | "STUDENT";
  joinedAt: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isHandRaised?: boolean;
}

export interface ZoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "INSTRUCTOR" | "STUDENT";
  message: string;
  timestamp: string;
}

export interface ZoomClassSession {
  id: string;
  courseId: string | null;
  courseCode: string;
  courseTitle: string;
  title: string;
  topic: string;
  instructorId: string;
  instructorName: string;
  startTime: string;
  durationMinutes: number;
  meetingId: string;
  passcode: string;
  joinUrl: string;
  hostUrl?: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";
  lectureNotes?: string;
  recordingUrl?: string;
  recordingDuration?: string;
  activeAttendees: ZoomAttendee[];
  chatMessages: ZoomChatMessage[];
}

export interface AIChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}

// ============================================================
// DORMITORY MANAGEMENT (Feature 15)
// ============================================================

export type DormGenderType = "M" | "F";

export interface DormBlock {
  id: string;
  blockName: string;
  genderType: DormGenderType;
  totalRooms: number;
  occupiedRooms?: number;
  availableRooms?: number;
  totalBeds?: number;
  occupiedBeds?: number;
}

export interface DormRoom {
  id: string;
  block: string;
  blockName?: string;
  genderType?: DormGenderType;
  roomNumber: string;
  capacity: number;
  currentOccupantsCount: number;
  availableBeds: number;
  isAvailable: boolean;
}

export interface DormAssignment {
  id: string;
  student: string;
  studentName: string;
  room: string;
  roomNumber: string;
  blockName: string;
  genderType?: DormGenderType;
  assignedDate: string;
  academicYear: string;
  status: "ACTIVE" | "TERMINATED";
}

export type DormMaintenanceStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED";

export interface DormMaintenanceRequest {
  id: string;
  room: string;
  roomNumber: string;
  blockName: string;
  reportedBy: string;
  reportedByName: string;
  issueDescription: string;
  status: DormMaintenanceStatus;
  createdAt: string;
}

export interface DormBlockStats {
  id: string;
  blockName: string;
  genderType: DormGenderType;
  totalRooms: number;
  availableRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
}

export interface DormStats {
  totalBlocks: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  activeAssignments: number;
  openMaintenance: number;
  pendingMaintenance: number;
  byBlock: DormBlockStats[];
}

// ============================================================
// READING LIST (Feature 14)
// ============================================================

export type ReadingStatus = "SAVED" | "READING" | "FINISHED";

export interface ReadingListItem {
  id: string;
  userId: string;
  resourceId: string;
  status: ReadingStatus;
  shelf: string;
  progressPercent: number;
  lastLocation?: string;
  note?: string;
  rating?: number;
  savedAt: string;
  lastOpenedAt?: string;
  finishedAt?: string;
}

export interface ReadingShelf {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// MATERIAL MANAGEMENT SYSTEM (MMS) TYPES
// -------------------------------------------------------------

export type MaterialCategory =
  | "ICT_ELECTRONICS"
  | "LAB_APPARATUS"
  | "CHEMICALS_REAGENTS"
  | "OFFICE_STATIONERY"
  | "FURNITURE"
  | "ENGINEERING_TOOLS"
  | "DORMITORY_SUPPLIES"
  | "CLINICAL_MEDICAL";

export interface MaterialInventoryItem {
  id: string;
  itemCode: string;
  name: string;
  amharicName?: string;
  category: MaterialCategory;
  description: string;
  quantityInStock: number;
  unit: string;
  minThreshold: number;
  unitCostETB: number;
  totalValueETB: number;
  warehouseLocation: string;
  shelfBin: string;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  lastRestocked: string;
  supplier?: string;
  specs?: string;
}

export interface RequisitionItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantityRequested: number;
  quantityApproved?: number;
  unit: string;
}

export interface MaterialRequisition {
  id: string;
  requisitionNumber: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  department: string;
  requestedDate: string;
  urgency: "ROUTINE" | "URGENT" | "CRITICAL";
  purpose: string;
  items: RequisitionItem[];
  status: "PENDING_APPROVAL" | "APPROVED" | "DISPATCHED" | "REJECTED";
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  dispatchVoucherNumber?: string;
  remarks?: string;
}

export interface GoodsReceivingItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantityReceived: number;
  unitCostETB: number;
  totalCostETB: number;
}

export interface GoodsReceivingRecord {
  id: string;
  grnNumber: string;
  poNumber: string;
  invoiceNumber: string;
  supplierName: string;
  supplierTIN?: string;
  receivedDate: string;
  receivedBy: string;
  warehouseLocation: string;
  items: GoodsReceivingItem[];
  totalAmountETB: number;
  status: "VERIFIED_STOCKED" | "INSPECTED";
  notes?: string;
}

export interface FixedAssetItem {
  id: string;
  assetTag: string;
  serialNumber: string;
  name: string;
  category: MaterialCategory;
  model: string;
  purchaseDate: string;
  purchaseCostETB: number;
  currentValueETB: number;
  custodianName: string;
  custodianDepartment: string;
  location: string;
  buildingBlock?: string;
  roomNumber?: string;
  condition: "EXCELLENT" | "GOOD" | "NEEDS_REPAIR" | "DAMAGED" | "DISPOSED";
  depreciationMethod?: "STRAIGHT_LINE";
  usefulLifeYears?: number;
  salvageValueETB?: number;
  accumulatedDepreciationETB?: number;
}

export interface InterStoreTransferItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
}

export interface InterStoreTransferRecord {
  id: string;
  transferNumber: string;
  sourceWarehouse: string;
  destinationWarehouse: string;
  initiatedBy: string;
  initiatedDate: string;
  receivedBy?: string;
  receivedDate?: string;
  reason: string;
  items: InterStoreTransferItem[];
  status: "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  gatePassRef?: string;
  remarks?: string;
}

export interface PropertyReturnItem {
  itemId?: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  condition: "REUSABLE_GOOD" | "MINOR_REPAIR_NEEDED" | "SCRAP_UNUSABLE";
  restockDecision: "RESTOCK_TO_STORE" | "SEND_TO_MAINTENANCE" | "SCRAP_DISPOSAL";
}

export interface PropertyReturnRecord {
  id: string;
  voucherNumber: string;
  returnerId: string;
  returnerName: string;
  returnerType: "FACULTY" | "STUDENT" | "DEPARTMENT" | "CONTRACTOR";
  department: string;
  returnDate: string;
  receivedBy: string;
  warehouseLocation: string;
  reason: "SEMESTER_COMPLETION" | "GRADUATION_CLEARANCE" | "PROJECT_CONCLUDED" | "DEFECTIVE_EXCHANGE";
  clearanceId?: string;
  items: PropertyReturnItem[];
  status: "VERIFIED" | "PENDING_ASSESSMENT";
  notes?: string;
}

export interface CampusGatePassRecord {
  id: string;
  gatePassNumber: string;
  bearerName: string;
  bearerRole: string;
  bearerIdCard: string;
  vehiclePlateNumber?: string;
  destination: string;
  purpose: "INTER_CAMPUS_TRANSFER" | "EXTERNAL_REPAIR_CALIBRATION" | "FIELD_RESEARCH" | "DISPOSAL_WRITE_OFF";
  authorizedBy: string;
  authorizedDate: string;
  validUntil: string;
  itemsDescription: string;
  itemCount: number;
  securityExitTimestamp?: string;
  gateName: "MAIN_GATE_1" | "EAST_GATE_COMMERCIAL" | "SCIENCE_GATE_3";
  guardName?: string;
  status: "AUTHORIZED" | "CHECKED_OUT" | "EXPIRED" | "REVOKED";
}

export interface MaintenanceWorkOrder {
  id: string;
  orderNumber: string;
  assetId?: string;
  assetTag?: string;
  equipmentName: string;
  location: string;
  reportedBy: string;
  reportedDepartment: string;
  reportedDate: string;
  faultDescription: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CAMPUS_HALTING";
  status: "REPORTED" | "DIAGNOSIS" | "IN_REPAIR" | "REPAIRED" | "BEYOND_ECONOMIC_REPAIR";
  assignedTechnician?: string;
  completionDate?: string;
  estimatedCostETB: number;
  actualCostETB?: number;
  technicianNotes?: string;
}

export interface PhysicalAuditEntry {
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouse: string;
  systemStock: number;
  physicalCount: number;
  variance: number;
  unitCostETB: number;
  varianceValueETB: number;
  auditDate: string;
  auditorName: string;
  discrepancyReason?: string;
  reconciliationStatus: "PENDING_REVIEW" | "RECONCILED" | "WRITE_OFF_APPROVED";
}

export interface UniversityVendor {
  id: string;
  vendorCode: string;
  name: string;
  tradeName?: string;
  tinNumber: string;
  vatNumber?: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  category: MaterialCategory;
  ratingScore: number;
  activeContractsCount: number;
  totalSuppliedValueETB: number;
  status: "ACTIVE" | "UNDER_REVIEW" | "SUSPENDED";
  bankAccountDetails?: string;
}

export interface PurchaseOrderItem {
  itemId?: string;
  itemCode: string;
  itemName: string;
  quantityOrdered: number;
  unit: string;
  unitPriceETB: number;
  lineTotalETB: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  vendorTIN: string;
  department: string;
  budgetCode: string;
  issueDate: string;
  deliveryDeadline: string;
  items: PurchaseOrderItem[];
  subtotalETB: number;
  vatAmountETB: number;
  grandTotalETB: number;
  status: "DRAFT" | "FINANCE_APPROVED" | "ISSUED_TO_VENDOR" | "PARTIALLY_DELIVERED" | "COMPLETED_M19" | "CANCELLED";
  paymentTerms: string;
  approvedBy?: string;
  grnReference?: string;
  notes?: string;
}

export interface AssetDisposalRecord {
  id: string;
  disposalRef: string;
  assetId?: string;
  assetTag: string;
  equipmentName: string;
  category: MaterialCategory;
  initialPurchaseCostETB: number;
  bookValueETB: number;
  disposalMethod: "PUBLIC_AUCTION" | "COMMUNITY_DONATION" | "HAZARDOUS_DESTRUCTION" | "SCRAP_METAL" | "TRADE_IN";
  committeeApprovedDate: string;
  committeeChairman: string;
  reservePriceETB: number;
  winningBidETB?: number;
  buyerName?: string;
  buyerReceiptNo?: string;
  status: "APPRAISAL" | "TENDER_PUBLISHED" | "AUCTIONED" | "REMITTED_TO_TREASURY";
  technicalJustification: string;
}

export interface HazardousMaterialRecord {
  id: string;
  itemId?: string;
  itemCode: string;
  chemicalName: string;
  amharicName?: string;
  casNumber: string;
  unClass: "FLAMMABLE_LIQUID_3" | "CORROSIVE_8" | "TOXIC_6_1" | "OXIDIZER_5_1" | "HAZARDOUS_COMPOUND";
  storageLocation: string;
  currentVolume: number;
  unit: string;
  maxAllowableThreshold: number;
  storageTempCelsius: string;
  msdsUrl?: string;
  ppeRequired: string[];
  emergencyNeutralizer: string;
  expirationDate: string;
  inspectionStatus: "SAFE" | "EXPIRING_SOON" | "CRITICAL_ACTION_REQUIRED";
}

export interface StockBinCardEntry {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  timestamp: string;
  voucherType: "MODEL_19_RECEIPT" | "MODEL_20_ISSUE" | "MODEL_21_TRANSFER_IN" | "MODEL_21_TRANSFER_OUT" | "MODEL_23_RETURN" | "AUDIT_ADJUSTMENT";
  voucherNumber: string;
  warehouseLocation: string;
  quantityIn: number;
  quantityOut: number;
  balanceStock: number;
  performedBy: string;
  remarks: string;
}

export interface DepartmentStoreBudget {
  departmentId: string;
  departmentName: string;
  college: string;
  fiscalYear: string;
  allocatedBudgetETB: number;
  utilizedBudgetETB: number;
  reservedBudgetETB: number;
  remainingBudgetETB: number;
  hodApprover: string;
}

export interface DonationGrantAsset {
  id: string;
  grantCode: string;
  donorOrganization: string;
  projectName: string;
  assetTag: string;
  itemName: string;
  valueETB: number;
  projectPI: string;
  projectEndDate: string;
  handoverStatus: "IN_PROJECT_USE" | "UNIVERSITY_TRANSFERRED" | "SCHEDULED_HANDOVER";
  custodianLab: string;
}

// -------------------------------------------------------------
// UNIFIED SMART CAMPUS HARDWARE & IoT INTEGRATION SYSTEM
// -------------------------------------------------------------

export type IoTDeviceType =
  | "SECURITY_CAMERA"
  | "RFID_GATE_TURNSTILE"
  | "BIOMETRIC_ATTENDANCE"
  | "ENVIRONMENTAL_SENSOR"
  | "FIRE_SMOKE_DETECTOR"
  | "SMART_POWER_METER"
  | "RFID_STORE_SCANNER"
  | "AUDIO_PA_SPEAKER";

export type DeviceConnectivity = "MQTT" | "RTSP_STREAM" | "WIFI" | "ETHERNET" | "LORA_WAN" | "ZIGBEE";

export interface IoTTelemetryReading {
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  status: "NORMAL" | "WARNING" | "CRITICAL";
}

export interface SmartIoTDevice {
  id: string;
  deviceCode: string;
  name: string;
  amharicName?: string;
  deviceType: IoTDeviceType;
  campus: "Tulu Awulia (Main)" | "Masha Campus";
  buildingBlock: string;
  roomOrZone: string;
  ipAddress: string;
  macAddress: string;
  protocol: DeviceConnectivity;
  mqttTopic?: string;
  streamUrl?: string;
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE" | "TRIGGERED_ALARM";
  batteryLevel?: number;
  signalDbm?: number;
  firmwareVersion: string;
  lastHeartbeat: string;
  telemetry: IoTTelemetryReading[];
  relayState?: "OPEN" | "CLOSED" | "LOCKED" | "UNLOCKED" | "SIREN_ON" | "SIREN_OFF";
}

export interface SecurityCameraFeed extends SmartIoTDevice {
  deviceType: "SECURITY_CAMERA";
  fps: number;
  resolution: "1080p FHD" | "4K UHD" | "720p HD";
  nightVision: boolean;
  motionDetected: boolean;
  aiObjectDetection?: {
    vehiclesCount: number;
    peopleCount: number;
    suspiciousLoitering: boolean;
    unauthorizedPerimeterBreach: boolean;
  };
  ptzCapable: boolean;
}

export interface BiometricAttendanceEvent {
  id: string;
  deviceId: string;
  deviceCode: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  method: "FACIAL_RECOGNITION" | "FINGERPRINT" | "RFID_SMART_CARD";
  timestamp: string;
  direction: "ENTRY" | "EXIT";
  gateName: string;
  matchedScorePercent: number;
  authStatus: "GRANTED" | "DENIED_UNREGISTERED" | "DENIED_BLACKLISTED" | "DENIED_CURFEW";
}

export interface IoTHardwareAlert {
  id: string;
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  deviceType: IoTDeviceType;
  campus: "Tulu Awulia (Main)" | "Masha Campus";
  zone: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY";
  title: string;
  message: string;
  timestamp: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  autoActionTaken?: string;
}
