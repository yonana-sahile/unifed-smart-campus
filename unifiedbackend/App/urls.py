# File: unifiedbackend/App/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'auth', views.AuthViewSet, basename='auth')
router.register(r'users', views.UserViewSet)
router.register(r'courses', views.CourseViewSet, basename='course')                     # ← ADD basename
router.register(r'materials', views.CourseMaterialViewSet, basename='coursematerial')  # ← ADD basename
router.register(r'questions', views.QuestionViewSet)
router.register(r'announcements', views.AnnouncementViewSet)
router.register(r'assignments', views.AssignmentViewSet, basename='assignment')        # ← ADD basename
router.register(r'submissions', views.SubmissionViewSet, basename='submission')        # ← ADD basename
router.register(r'exams', views.ExamViewSet, basename='exam')                          # ← ADD basename
router.register(r'exam-attempts', views.ExamAttemptViewSet, basename='examattempt')
router.register(r'grades', views.GradeViewSet, basename='grade')                       # ← ADD basename
router.register(r'transcripts', views.TranscriptViewSet)
router.register(r'attendance', views.AttendanceRecordViewSet, basename='attendance')   # ← ADD basename
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
router.register(r'facility-bookings', views.FacilityBookingViewSet)
router.register(r'campus-alerts', views.CampusAlertViewSet)
router.register(r'media-posts', views.CampusMediaPostViewSet)
router.register(r'zoom-sessions', views.ZoomClassSessionViewSet)
router.register(r'ai', views.AIViewSet, basename='ai')

# ✅ Monitoring
router.register(r'monitoring-events', views.ExamMonitoringEventViewSet, basename='monitoring-events')
router.register(r'monitoring-settings', views.ExamMonitoringSettingViewSet, basename='monitoring-settings')

# ✅ Face Verification
router.register(r'face-verification', views.FaceVerificationViewSet, basename='face-verification')

urlpatterns = [
    path('ai/chat/', views.ai_chat, name='ai-chat'),
    path('', include(router.urls)),
]