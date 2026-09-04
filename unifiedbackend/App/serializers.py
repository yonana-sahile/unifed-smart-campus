from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import *  # Imports all models from App/models.py


# ---------- USER ----------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name', 'email', 'role', 'is_active',
            'avatar_url', 'phone_number', 'student_id', 'academic_year',
            'semester', 'program', 'gpa', 'cgpa', 'outstanding_fees',
            'cost_sharing_balance', 'instructor_id', 'department',
            'specialization', 'office_hours', 'staff_id', 'library_section',
            'officer_id', 'bio'
        ]
        read_only_fields = ['id']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email', 'password', 'role', 'is_active']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


# ---------- COURSE ----------
class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.full_name', read_only=True)

    class Meta:
        model = Course
        fields = '__all__'


# ---------- COURSE MATERIAL ----------
class CourseMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseMaterial
        fields = '__all__'


# ---------- ANNOUNCEMENT ----------
class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = '__all__'


# ---------- ASSIGNMENT ----------
class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'


# ---------- SUBMISSION ----------
class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = '__all__'


# ---------- QUESTION ----------
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'


# ---------- EXAM ----------
class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Exam
        fields = '__all__'


# ---------- EXAM ATTEMPT ----------
class ExamAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamAttempt
        fields = '__all__'


# ---------- GRADE ----------
class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = '__all__'


# ---------- TRANSCRIPT ----------
class TranscriptSerializer(serializers.ModelSerializer):
    grades = GradeSerializer(many=True, read_only=True)

    class Meta:
        model = Transcript
        fields = '__all__'


# ---------- ATTENDANCE RECORD ----------
class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = '__all__'


# ---------- INSTRUCTOR EVALUATION ----------
class InstructorEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstructorEvaluation
        fields = '__all__'


# ---------- COURSE OUTLINE ----------
class CourseOutlineFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseOutlineForm
        fields = '__all__'


# ---------- LIBRARY RESOURCE ----------
class LibraryResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryResource
        fields = '__all__'


# ---------- PAYMENT TRANSACTION ----------
class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = '__all__'


# ---------- SCHOLARSHIP ----------
class ScholarshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scholarship
        fields = '__all__'


# ---------- MOE ADMISSION RECORD ----------
class MoEAdmissionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoEAdmissionRecord
        fields = '__all__'


# ---------- CERTIFICATE RECORD ----------
class CertificateRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificateRecord
        fields = '__all__'


# ---------- AUDIT LOG ----------
class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'


# ---------- SYSTEM SETTINGS ----------
class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = '__all__'


# ---------- STUDENT CLEARANCE ----------
class StudentClearanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentClearance
        fields = '__all__'


# ---------- FACILITY BOOKING ----------
class FacilityBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilityBooking
        fields = '__all__'


# ---------- CAMPUS ALERT ----------
class CampusAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampusAlert
        fields = '__all__'


# ---------- CAMPUS MEDIA POST ----------
class CampusMediaPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampusMediaPost
        fields = '__all__'
