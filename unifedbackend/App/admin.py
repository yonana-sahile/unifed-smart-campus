from django.contrib import admin
from .models import *  # ✅ Imports all models from App/models.py


# ---------- USER ----------
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'full_name', 'email', 'role', 'is_active', 'phone_number']
    search_fields = ['username', 'full_name', 'email', 'student_id', 'instructor_id', 'staff_id']
    list_filter = ['role', 'is_active', 'academic_year', 'semester']
    readonly_fields = ['last_login', 'date_joined']
    fieldsets = (
        ('Personal Information', {
            'fields': ('full_name', 'email', 'phone_number', 'avatar_url', 'bio')
        }),
        ('Account Credentials', {
            'fields': ('username', 'password', 'is_active', 'is_staff', 'is_superuser')
        }),
        ('Role & Academic', {
            'fields': ('role', 'student_id', 'instructor_id', 'staff_id', 'officer_id')
        }),
        ('Student Details', {
            'fields': ('academic_year', 'semester', 'program', 'gpa', 'cgpa', 'outstanding_fees',
                       'cost_sharing_balance'),
            'classes': ('collapse',)
        }),
        ('Instructor Details', {
            'fields': ('department', 'specialization', 'office_hours'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
    )


# ---------- COURSE ----------
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['course_code', 'course_title', 'instructor', 'department', 'semester', 'academic_year',
                    'enrolled_students_count', 'capacity']
    search_fields = ['course_code', 'course_title', 'department']
    list_filter = ['semester', 'academic_year', 'department']
    raw_id_fields = ['instructor']
    ordering = ['-academic_year', 'semester', 'course_code']


# ---------- COURSE MATERIAL ----------
@admin.register(CourseMaterial)
class CourseMaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'file_type', 'uploaded_at']
    search_fields = ['title', 'course__course_code']
    list_filter = ['file_type', 'uploaded_at']
    raw_id_fields = ['course']
    ordering = ['-uploaded_at']


# ---------- ANNOUNCEMENT ----------
@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'posted_by', 'posted_at']
    search_fields = ['title', 'content', 'posted_by']
    list_filter = ['posted_at', 'course']
    raw_id_fields = ['course']
    ordering = ['-posted_at']


# ---------- ASSIGNMENT ----------
@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'due_date', 'max_score']
    search_fields = ['title', 'course__course_code']
    list_filter = ['due_date', 'course']
    raw_id_fields = ['course']
    ordering = ['-created_at']


# ---------- SUBMISSION ----------
@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'assignment_title', 'assignment', 'status', 'score', 'submitted_at']
    search_fields = ['student_name', 'assignment_title', 'file_name']
    list_filter = ['status', 'submitted_at', 'assignment']
    raw_id_fields = ['student', 'assignment', 'course']
    ordering = ['-submitted_at']


# ---------- QUESTION ----------
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'question_type', 'marks']
    search_fields = ['question_text']
    list_filter = ['question_type', 'marks']
    ordering = ['question_type', 'marks']


# ---------- EXAM ----------
@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['exam_title', 'course', 'exam_date', 'duration_minutes', 'total_marks', 'status']
    search_fields = ['exam_title', 'course__course_code']
    list_filter = ['status', 'exam_date', 'course']
    raw_id_fields = ['course', 'questions']
    ordering = ['-exam_date']


# ---------- EXAM ATTEMPT ----------
@admin.register(ExamAttempt)
class ExamAttemptAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'exam_title', 'score', 'status', 'started_at', 'submitted_at']
    search_fields = ['student_name', 'exam_title']
    list_filter = ['status', 'started_at']
    raw_id_fields = ['student', 'exam']
    ordering = ['-started_at']


# ---------- GRADE ----------
@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'course_code', 'total_grade', 'letter_grade', 'grade_point', 'status']
    search_fields = ['student_name', 'course_code']
    list_filter = ['status', 'semester', 'letter_grade']
    raw_id_fields = ['student', 'course']
    ordering = ['-created_at']


# ---------- TRANSCRIPT ----------
@admin.register(Transcript)
class TranscriptAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'cgpa', 'total_credits', 'verification_code', 'is_approved', 'generated_date']
    search_fields = ['student_name', 'verification_code']
    list_filter = ['is_approved', 'generated_date']
    raw_id_fields = ['student', 'grades']
    ordering = ['-generated_date']


# ---------- ATTENDANCE RECORD ----------
@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'course_code', 'attendance_percentage', 'meets_minimum', 'last_updated']
    search_fields = ['student_name', 'course_code']
    list_filter = ['meets_minimum', 'last_updated']
    raw_id_fields = ['student', 'course']
    ordering = ['-last_updated']


# ---------- INSTRUCTOR EVALUATION ----------
@admin.register(InstructorEvaluation)
class InstructorEvaluationAdmin(admin.ModelAdmin):
    list_display = ['student', 'instructor_name', 'course_code', 'overall_rating', 'semester', 'submitted_at']
    search_fields = ['student__full_name', 'instructor_name', 'course_code']
    list_filter = ['overall_rating', 'semester', 'submitted_at']
    raw_id_fields = ['student', 'instructor', 'course']
    ordering = ['-submitted_at']


# ---------- COURSE OUTLINE ----------
@admin.register(CourseOutlineForm)
class CourseOutlineFormAdmin(admin.ModelAdmin):
    list_display = ['course_code', 'course_title', 'department', 'approved_by_dept_head', 'updated_at']
    search_fields = ['course_code', 'course_title', 'department']
    list_filter = ['approved_by_dept_head', 'updated_at']
    raw_id_fields = ['course']
    ordering = ['-updated_at']


# ---------- LIBRARY RESOURCE ----------
@admin.register(LibraryResource)
class LibraryResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'resource_type', 'category', 'access_level', 'downloads_count', 'uploaded_at']
    search_fields = ['title', 'author', 'isbn']
    list_filter = ['resource_type', 'category', 'access_level', 'uploaded_at']
    ordering = ['-uploaded_at']


# ---------- PAYMENT TRANSACTION ----------
@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'amount', 'payment_method', 'payment_type', 'status', 'timestamp']
    search_fields = ['student_name', 'reference_number', 'receipt_number']
    list_filter = ['status', 'payment_method', 'payment_type', 'timestamp']
    raw_id_fields = ['student']
    ordering = ['-timestamp']


# ---------- SCHOLARSHIP ----------
@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'scholarship_type', 'amount', 'semester', 'academic_year', 'status']
    search_fields = ['student_name', 'scholarship_type']
    list_filter = ['scholarship_type', 'status', 'semester', 'academic_year']
    raw_id_fields = ['student']
    ordering = ['-academic_year', 'semester']


# ---------- MOE ADMISSION RECORD ----------
@admin.register(MoEAdmissionRecord)
class MoEAdmissionRecordAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'national_exam_roll', 'gender', 'department_assigned', 'national_exam_score', 'status']
    search_fields = ['full_name', 'national_exam_roll', 'fayda_national_id']
    list_filter = ['status', 'gender', 'batch_year', 'department_assigned']
    ordering = ['-batch_year', 'national_exam_roll']


# ---------- CERTIFICATE RECORD ----------
@admin.register(CertificateRecord)
class CertificateRecordAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'certificate_type', 'verification_code', 'is_issued', 'issue_date']
    search_fields = ['student_name', 'verification_code']
    list_filter = ['certificate_type', 'is_issued', 'issue_date']
    raw_id_fields = ['student']
    ordering = ['-issue_date']


# ---------- AUDIT LOG ----------
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user_name', 'action', 'entity_type', 'timestamp', 'ip_address']
    search_fields = ['user_name', 'action', 'description']
    list_filter = ['action', 'entity_type', 'timestamp']
    raw_id_fields = ['user']
    ordering = ['-timestamp']
    readonly_fields = ['user', 'user_name', 'user_role', 'action', 'entity_type', 'entity_id', 'timestamp',
                       'ip_address', 'description']

    def has_add_permission(self, request):
        return False


# ---------- SYSTEM SETTINGS ----------
@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['semester_start', 'semester_end', 'registration_deadline', 'academic_year_frozen', 'updated_at']
    list_filter = ['academic_year_frozen', 'updated_at']
    ordering = ['-updated_at']

    def has_delete_permission(self, request, obj=None):
        return False


# ---------- STUDENT CLEARANCE ----------
@admin.register(StudentClearance)
class StudentClearanceAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'program', 'reason', 'overall_status', 'initiated_date']
    search_fields = ['student_name', 'program']
    list_filter = ['overall_status', 'reason', 'academic_year']
    raw_id_fields = ['student']
    ordering = ['-initiated_date']


# ---------- FACILITY BOOKING ----------
@admin.register(FacilityBooking)
class FacilityBookingAdmin(admin.ModelAdmin):
    list_display = ['facility_name', 'campus', 'room_type', 'booked_by', 'date', 'status']
    search_fields = ['facility_name', 'facility_code', 'booked_by']
    list_filter = ['status', 'campus', 'room_type', 'date']
    ordering = ['-date', 'start_time']


# ---------- CAMPUS ALERT ----------
@admin.register(CampusAlert)
class CampusAlertAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'severity', 'target_audience', 'sender_name', 'timestamp', 'active_until']
    search_fields = ['title', 'message', 'sender_name']
    list_filter = ['category', 'severity', 'target_audience', 'timestamp']
    ordering = ['-timestamp']


# ---------- CAMPUS MEDIA POST ----------
@admin.register(CampusMediaPost)
class CampusMediaPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'posted_by', 'views_count', 'likes_count', 'featured', 'posted_at']
    search_fields = ['title', 'description', 'posted_by']
    list_filter = ['category', 'featured', 'posted_at']
    ordering = ['-posted_at']


# ---------- CUSTOM ADMIN SITE ----------
admin.site.site_header = "Unified Smart Campus Management System"
admin.site.site_title = "USCMS Admin Portal"
admin.site.index_title = "Welcome to Mekdela Amba University Smart Campus Administration"
