from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import *  # ✅ Imports all models from App/models.py


# ---------- USER ----------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['id', 'username', 'email', 'role', 'is_active']
    search_fields = ['username', 'email']
    list_filter = ['role', 'is_active']


# ---------- COURSE ----------
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['course_code', 'course_title', 'department', 'semester', 'academic_year']
    search_fields = ['course_code', 'course_title', 'department']
    list_filter = ['semester', 'academic_year', 'department']
    ordering = ['-academic_year', 'semester', 'course_code']


# ---------- COURSE MATERIAL ----------
@admin.register(CourseMaterial)
class CourseMaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'file_type', 'uploaded_at']
    search_fields = ['title']
    list_filter = ['file_type', 'uploaded_at']


# ---------- ANNOUNCEMENT ----------
@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'posted_at']
    search_fields = ['title', 'content']
    list_filter = ['posted_at']


# ---------- ASSIGNMENT ----------
@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'due_date', 'max_score']
    search_fields = ['title']
    list_filter = ['due_date']


# ---------- SUBMISSION ----------
@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'status', 'score', 'submitted_at']
    search_fields = ['student_name']
    list_filter = ['status', 'submitted_at']


# ---------- QUESTION ----------
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'question_type', 'marks']
    search_fields = ['question_text']
    list_filter = ['question_type', 'marks']


# ---------- EXAM ----------
@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['exam_title', 'exam_date', 'duration_minutes', 'total_marks', 'status']
    search_fields = ['exam_title']
    list_filter = ['status', 'exam_date']


# ---------- EXAM ATTEMPT ----------
@admin.register(ExamAttempt)
class ExamAttemptAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'exam_title', 'score', 'status', 'started_at']
    search_fields = ['student_name', 'exam_title']
    list_filter = ['status', 'started_at']


# ---------- GRADE ----------
@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'course_code', 'total_grade', 'letter_grade', 'status']
    search_fields = ['student_name', 'course_code']
    list_filter = ['status', 'semester', 'letter_grade']


# ---------- TRANSCRIPT ----------
@admin.register(Transcript)
class TranscriptAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'cgpa', 'total_credits', 'is_approved', 'generated_date']
    search_fields = ['student_name', 'verification_code']
    list_filter = ['is_approved', 'generated_date']


# ---------- ATTENDANCE RECORD ----------
@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'course_code', 'attendance_percentage', 'meets_minimum']
    search_fields = ['student_name', 'course_code']
    list_filter = ['meets_minimum']


# ---------- INSTRUCTOR EVALUATION ----------
@admin.register(InstructorEvaluation)
class InstructorEvaluationAdmin(admin.ModelAdmin):
    list_display = ['instructor_name', 'course_code', 'overall_rating', 'submitted_at']
    search_fields = ['instructor_name', 'course_code']
    list_filter = ['overall_rating', 'semester']


# ---------- COURSE OUTLINE ----------
@admin.register(CourseOutlineForm)
class CourseOutlineFormAdmin(admin.ModelAdmin):
    list_display = ['course_code', 'course_title', 'department', 'approved_by_dept_head']
    search_fields = ['course_code', 'course_title']
    list_filter = ['approved_by_dept_head']


# ---------- LIBRARY RESOURCE ----------
@admin.register(LibraryResource)
class LibraryResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'resource_type', 'access_level', 'downloads_count']
    search_fields = ['title', 'author']
    list_filter = ['resource_type', 'access_level']


# ---------- PAYMENT TRANSACTION ----------
@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'amount', 'payment_method', 'status', 'timestamp']
    search_fields = ['student_name', 'reference_number']
    list_filter = ['status', 'payment_method']


# ---------- SCHOLARSHIP ----------
@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'scholarship_type', 'amount', 'status']
    search_fields = ['student_name', 'scholarship_type']
    list_filter = ['scholarship_type', 'status']


# ---------- MOE ADMISSION RECORD ----------
@admin.register(MoEAdmissionRecord)
class MoEAdmissionRecordAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'national_exam_roll', 'gender', 'status']
    search_fields = ['full_name', 'national_exam_roll']
    list_filter = ['status', 'gender']


# ---------- CERTIFICATE RECORD ----------
@admin.register(CertificateRecord)
class CertificateRecordAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'certificate_type', 'is_issued', 'issue_date']
    search_fields = ['student_name', 'verification_code']
    list_filter = ['certificate_type', 'is_issued']


# ---------- AUDIT LOG ----------
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user_name', 'action', 'entity_type', 'timestamp']
    search_fields = ['user_name', 'action']
    list_filter = ['action', 'entity_type']
    readonly_fields = ['user', 'user_name', 'user_role', 'action', 'entity_type', 'entity_id', 'timestamp', 'ip_address', 'description']

    def has_add_permission(self, request):
        return False


# ---------- SYSTEM SETTINGS ----------
@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['semester_start', 'semester_end', 'academic_year_frozen']
    list_filter = ['academic_year_frozen']

    def has_delete_permission(self, request, obj=None):
        return False


# ---------- STUDENT CLEARANCE ----------
@admin.register(StudentClearance)
class StudentClearanceAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'program', 'reason', 'overall_status']
    search_fields = ['student_name']
    list_filter = ['overall_status', 'reason']


# ---------- FACILITY BOOKING ----------
@admin.register(FacilityBooking)
class FacilityBookingAdmin(admin.ModelAdmin):
    list_display = ['facility_name', 'campus', 'room_type', 'date', 'status']
    search_fields = ['facility_name']
    list_filter = ['status', 'campus', 'room_type']


# ---------- CAMPUS ALERT ----------
@admin.register(CampusAlert)
class CampusAlertAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'severity', 'timestamp']
    search_fields = ['title']
    list_filter = ['category', 'severity']


# ---------- CAMPUS MEDIA POST ----------
@admin.register(CampusMediaPost)
class CampusMediaPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'posted_by', 'featured', 'posted_at']
    search_fields = ['title']
    list_filter = ['category', 'featured']


# ---------- CUSTOM ADMIN SITE ----------
admin.site.site_header = "Unified Smart Campus Management System"
admin.site.site_title = "USCMS Admin Portal"
admin.site.index_title = "Welcome to Mekdela Amba University Smart Campus Administration"