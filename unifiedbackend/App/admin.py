from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import *


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ['id', 'username', 'full_name', 'email', 'role', 'is_active']
    search_fields = ['username', 'email', 'student_id', 'instructor_id', 'staff_id']
    list_filter = ['role', 'is_active', 'is_staff', 'is_superuser']
    readonly_fields = ['last_login', 'date_joined']

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone_number', 'avatar_url', 'bio')}),
        ('Role', {'fields': ('role', 'student_id', 'instructor_id', 'staff_id', 'officer_id')}),
        ('Academic', {'fields': ('department', 'academic_year', 'semester', 'program', 'gpa', 'cgpa',
                                  'outstanding_fees', 'cost_sharing_balance')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('username', 'password1', 'password2')}),
        ('Role', {'fields': ('role', 'department', 'student_id', 'instructor_id', 'staff_id', 'officer_id')}),
    )


# ---------- ALL OTHER ADMINS ----------
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['course_code', 'course_title', 'instructor', 'department', 'semester', 'academic_year']
    search_fields = ['course_code', 'course_title']
    list_filter = ['semester', 'academic_year', 'department']
    raw_id_fields = ['instructor']

@admin.register(CourseMaterial)
class CourseMaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'file_type', 'uploaded_at']
    list_filter = ['file_type']
    raw_id_fields = ['course']

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'posted_by', 'posted_at']
    raw_id_fields = ['course']

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'due_date', 'max_score']
    raw_id_fields = ['course']

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'assignment_title', 'status', 'score', 'submitted_at']
    list_filter = ['status']
    raw_id_fields = ['student', 'assignment', 'course']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'question_type', 'marks']

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['exam_title', 'course', 'exam_date', 'duration_minutes', 'total_marks', 'status']
    list_filter = ['status', 'exam_date', 'course']
    raw_id_fields = ['course', 'questions']

@admin.register(ExamAttempt)
class ExamAttemptAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'exam_title', 'score', 'status', 'started_at']
    raw_id_fields = ['student', 'exam']

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'course_code', 'total_grade', 'letter_grade', 'status']
    raw_id_fields = ['student', 'course']

@admin.register(Transcript)
class TranscriptAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'cgpa', 'total_credits', 'verification_code', 'is_approved']
    raw_id_fields = ['student', 'grades']

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'course_code', 'attendance_percentage', 'meets_minimum']
    raw_id_fields = ['student', 'course']


# ---------- LIVE ATTENDANCE SESSION ----------
class AttendanceCheckInInline(admin.TabularInline):
    model = AttendanceCheckIn
    extra = 0
    readonly_fields = ['student', 'student_name', 'status', 'method', 'checked_in_at', 'ip_address']
    can_delete = False


@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = [
        'course_code', 'title', 'instructor_name', 'session_date',
        'status', 'check_in_code', 'expires_at',
    ]
    search_fields = ['course_code', 'course_title', 'title', 'instructor_name']
    list_filter = ['status', 'session_date', 'course']
    raw_id_fields = ['course', 'instructor']
    readonly_fields = ['started_at', 'ended_at', 'totals_applied']
    inlines = [AttendanceCheckInInline]
    ordering = ['-started_at']


@admin.register(AttendanceCheckIn)
class AttendanceCheckInAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'session', 'status', 'method', 'checked_in_at']
    search_fields = ['student_name', 'session__course_code']
    list_filter = ['status', 'method', 'checked_in_at']
    raw_id_fields = ['session', 'student']
    ordering = ['-checked_in_at']


# ---------- INSTRUCTOR EVALUATION ----------
@admin.register(InstructorEvaluation)
class InstructorEvaluationAdmin(admin.ModelAdmin):
    list_display = ['student', 'instructor_name', 'course_code', 'overall_rating']
    raw_id_fields = ['student', 'instructor', 'course']

@admin.register(CourseOutlineForm)
class CourseOutlineFormAdmin(admin.ModelAdmin):
    list_display = ['course_code', 'course_title', 'department', 'approved_by_dept_head']
    raw_id_fields = ['course']

@admin.register(LibraryResource)
class LibraryResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'resource_type', 'category', 'downloads_count']
    list_filter = ['resource_type', 'category', 'access_level']

@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'amount', 'payment_method', 'payment_type', 'status']
    list_filter = ['status', 'payment_method', 'payment_type']
    raw_id_fields = ['student']

@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'scholarship_type', 'amount', 'semester', 'status']
    list_filter = ['scholarship_type', 'status']
    raw_id_fields = ['student']

@admin.register(MoEAdmissionRecord)
class MoEAdmissionRecordAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'national_exam_roll', 'gender', 'department_assigned', 'status']

@admin.register(CertificateRecord)
class CertificateRecordAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'certificate_type', 'verification_code', 'is_issued']
    raw_id_fields = ['student']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user_name', 'action', 'entity_type', 'timestamp', 'ip_address']
    raw_id_fields = ['user']
    readonly_fields = ['user', 'user_name', 'user_role', 'action', 'entity_type', 'entity_id', 'timestamp',
                       'ip_address', 'description']

    def has_add_permission(self, request):
        return False

@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['semester_start', 'semester_end', 'registration_deadline', 'academic_year_frozen']
    list_filter = ['academic_year_frozen']

@admin.register(StudentClearance)
class StudentClearanceAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'program', 'reason', 'overall_status']
    raw_id_fields = ['student']

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ['facility_code', 'name', 'campus', 'facility_type', 'department', 'capacity', 'is_active']
    list_filter = ['campus', 'facility_type', 'department', 'is_active']
    search_fields = ['facility_code', 'name', 'building', 'room_number']
    ordering = ['facility_code']


@admin.register(FacilityBooking)
class FacilityBookingAdmin(admin.ModelAdmin):
    list_display = ['facility', 'requested_by', 'date', 'start_time', 'end_time', 'status', 'expected_attendees']
    list_filter = ['status', 'facility__campus', 'facility__facility_type']
    search_fields = ['facility__facility_code', 'facility__name', 'requested_by__username', 'requested_by__full_name', 'purpose']
    date_hierarchy = 'date'
    raw_id_fields = ['facility', 'requested_by', 'approved_by']


@admin.register(CampusAlert)
class CampusAlertAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'severity', 'target_audience', 'timestamp']
    list_filter = ['category', 'severity']

@admin.register(CampusMediaPost)
class CampusMediaPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'posted_by', 'views_count', 'featured']
    list_filter = ['category', 'featured']


# ---------- DORMITORY MANAGEMENT ----------
@admin.register(DormBlock)
class DormBlockAdmin(admin.ModelAdmin):
    list_display = ['block_name', 'gender_type', 'total_rooms', 'occupied_rooms']
    search_fields = ['block_name', 'gender_type']
    ordering = ['block_name']

    def occupied_rooms(self, obj):
        return obj.rooms.filter(current_occupants_count__gt=0).count()


# ---------- DORM ROOM ----------
@admin.register(DormRoom)
class DormRoomAdmin(admin.ModelAdmin):
    list_display = ['block', 'room_number', 'capacity', 'current_occupants_count', 'is_available']
    list_filter = ['block', 'is_available']
    search_fields = ['room_number', 'block__block_name']
    ordering = ['block__block_name', 'room_number']


# ---------- DORM ASSIGNMENT ----------
@admin.register(DormAssignment)
class DormAssignmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'student_name', 'room', 'assigned_date', 'academic_year', 'status']
    list_filter = ['status', 'academic_year']
    ordering = ['-assigned_date']


# ---------- DORM MAINTENANCE REQUEST ----------
@admin.register(DormMaintenanceRequest)
class DormMaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = ['room', 'reported_by', 'issue_description', 'status', 'created_at']
    list_filter = ['status', 'room']
    ordering = ['-created_at']


# ---------- CUSTOM ADMIN SITE ----------
admin.site.site_header = "Unified Smart Campus Management System"
admin.site.site_title = "USCMS Admin Portal"
admin.site.index_title = "Welcome to Mekdela Amba University Smart Campus Administration"