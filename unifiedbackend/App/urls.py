# File: unifiedbackend/App/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'auth', views.AuthViewSet, basename='auth')
router.register(r'users', views.UserViewSet)
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'materials', views.CourseMaterialViewSet, basename='coursematerial')
router.register(r'questions', views.QuestionViewSet)
router.register(r'announcements', views.AnnouncementViewSet)
router.register(r'assignments', views.AssignmentViewSet, basename='assignment')
router.register(r'submissions', views.SubmissionViewSet, basename='submission')
router.register(r'exams', views.ExamViewSet, basename='exam')
router.register(r'exam-attempts', views.ExamAttemptViewSet, basename='examattempt')
router.register(r'grades', views.GradeViewSet, basename='grade')
router.register(r'transcripts', views.TranscriptViewSet, basename='transcript')
router.register(r'attendance', views.AttendanceRecordViewSet, basename='attendance')
router.register(r'attendance-sessions', views.AttendanceSessionViewSet, basename='attendance-session')
router.register(r'library-resources', views.LibraryResourceViewSet)
router.register(r'payments', views.PaymentTransactionViewSet)
router.register(r'scholarships', views.ScholarshipViewSet)
router.register(r'course-outlines', views.CourseOutlineFormViewSet)
router.register(r'evaluations', views.InstructorEvaluationViewSet)
router.register(r'moe-admissions', views.MoEAdmissionRecordViewSet)
router.register(r'certificates', views.CertificateRecordViewSet)
router.register(r'audit-logs', views.AuditLogViewSet)
router.register(r'settings', views.SystemSettingsViewSet)
router.register(r'clearances', views.StudentClearanceViewSet)
router.register(r'facilities', views.FacilityViewSet, basename='facility')
router.register(r'facility-bookings', views.FacilityBookingViewSet, basename='facility-booking')
router.register(r'campus-alerts', views.CampusAlertViewSet)
router.register(r'media-posts', views.CampusMediaPostViewSet)
router.register(r'zoom-sessions', views.ZoomClassSessionViewSet)
router.register(r'ai', views.AIViewSet, basename='ai')

# ✅ Monitoring
router.register(r'monitoring-events', views.ExamMonitoringEventViewSet, basename='monitoring-events')
router.register(r'monitoring-settings', views.ExamMonitoringSettingViewSet, basename='monitoring-settings')

# ✅ Face Verification
router.register(r'face-verification', views.FaceVerificationViewSet, basename='face-verification')

# ✅ Dormitory Management
router.register(r'dormitories/dorm-blocks', views.DormBlockViewSet, basename='dorm-block')
router.register(r'dormitories/dorm-rooms', views.DormRoomViewSet, basename='dorm-room')
router.register(r'dormitories/dorm-assignments', views.DormAssignmentViewSet, basename='dorm-assignment')
router.register(r'dormitories/dorm-maintenance', views.DormMaintenanceRequestViewSet, basename='dorm-maintenance')

router.register(r'mms/inventory', views.MaterialInventoryItemViewSet, basename='mms-inventory')
router.register(r'mms/requisitions', views.MaterialRequisitionViewSet, basename='mms-requisitions')
router.register(r'mms/assets', views.FixedAssetItemViewSet, basename='mms-assets')
router.register(r'mms/receiving', views.GoodsReceivingRecordViewSet, basename='mms-receiving')
router.register(r'mms/vendors', views.UniversityVendorViewSet, basename='mms-vendors')
router.register(r'mms/purchase-orders', views.PurchaseOrderViewSet, basename='mms-purchase-orders')
router.register(r'mms/disposals', views.AssetDisposalRecordViewSet, basename='mms-disposals')
router.register(r'mms/hazardous-materials', views.HazardousMaterialRecordViewSet, basename='mms-hazardous-materials')
router.register(r'mms/bin-cards', views.StockBinCardEntryViewSet, basename='mms-bin-cards')
router.register(r'mms/budgets', views.DepartmentStoreBudgetViewSet, basename='mms-budgets')
router.register(r'mms/donations', views.DonationGrantAssetViewSet, basename='mms-donations')
router.register(r'mms/transfers', views.InterStoreTransferRecordViewSet, basename='mms-transfers')
router.register(r'mms/returns', views.PropertyReturnRecordViewSet, basename='mms-returns')
router.register(r'mms/gate-passes', views.CampusGatePassRecordViewSet, basename='mms-gate-passes')
router.register(r'mms/maintenance', views.MaintenanceWorkOrderViewSet, basename='mms-maintenance')
router.register(r'mms/audits', views.PhysicalAuditEntryViewSet, basename='mms-audits')

router.register(r'iot/devices', views.SmartIoTDeviceViewSet, basename='iot-devices')
router.register(r'iot/cameras', views.SecurityCameraFeedViewSet, basename='iot-cameras')
router.register(r'iot/biometrics', views.BiometricAttendanceEventViewSet, basename='iot-biometrics')
router.register(r'iot/alerts', views.IoTHardwareAlertViewSet, basename='iot-alerts')

urlpatterns = [
    path('ai/chat/', views.ai_chat, name='ai-chat'),
    path('ai/transcribe/', views.ai_transcribe, name='ai-transcribe'),
    path('ai/speak/', views.ai_speak, name='ai-speak'),
    path('', include(router.urls)),
]
