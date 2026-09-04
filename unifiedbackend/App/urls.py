from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views  # ✅ This now imports from App

router = DefaultRouter()
router.register(r'auth', views.AuthViewSet, basename='auth')
router.register(r'users', views.UserViewSet)
router.register(r'courses', views.CourseViewSet)
router.register(r'materials', views.CourseMaterialViewSet)
router.register(r'announcements', views.AnnouncementViewSet)
router.register(r'assignments', views.AssignmentViewSet)
router.register(r'submissions', views.SubmissionViewSet)
router.register(r'exams', views.ExamViewSet)
router.register(r'exam-attempts', views.ExamAttemptViewSet)
router.register(r'grades', views.GradeViewSet)
router.register(r'transcripts', views.TranscriptViewSet)
router.register(r'attendance', views.AttendanceRecordViewSet)
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
router.register(r'ai', views.AIViewSet, basename='ai')

urlpatterns = [
    path('', include(router.urls)),
]
