from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import *


# ---------- USER ----------
class UserSerializer(serializers.ModelSerializer):
    # Write-only password field for creating users
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name', 'email', 'role', 'is_active',
            'avatar_url', 'phone_number', 'student_id', 'academic_year',
            'semester', 'program', 'gpa', 'cgpa', 'outstanding_fees',
            'cost_sharing_balance', 'instructor_id', 'department',
            'specialization', 'office_hours', 'staff_id', 'library_section',
            'officer_id', 'bio',
            'password',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password', None) or 'password'
        validated_data.pop('full_name', None)
        validated_data.pop('id', None)
        user = User.objects.create_user(password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        validated_data.pop('full_name', None)
        validated_data.pop('id', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


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
        read_only_fields = ['id', 'uploaded_at']
        extra_kwargs = {
            'file_url': {'required': False, 'allow_blank': True, 'allow_null': True},
            'file_name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'file_size': {'required': False, 'allow_blank': True, 'allow_null': True},
            'file_data': {'required': False, 'allow_blank': True, 'allow_null': True},
            'chapter_week': {'required': False, 'allow_blank': True, 'allow_null': True},
            'instructor_name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'description': {'required': False, 'allow_blank': True},
        }


# ---------- ANNOUNCEMENT ----------
class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = '__all__'
        extra_kwargs = {
            'course': {'required': False, 'allow_null': True},
            'course_title': {'required': False, 'allow_blank': True},
            'posted_by': {'required': True, 'allow_blank': False},
            'posted_at': {'required': False, 'read_only': True},
        }


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
    question_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Question.objects.all(),
        required=False,
        write_only=True,
        source='questions',
    )

    class Meta:
        model = Exam
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'pushed_at']
        extra_kwargs = {
            'is_pushed': {'required': False},
            'pushed_at': {'required': False, 'read_only': True},
            'created_by': {'required': False, 'allow_blank': True, 'allow_null': True},
            'category': {'required': False, 'allow_blank': True, 'allow_null': True},
            'status': {'required': False},
        }

    def create(self, validated_data):
        import sys
        print("=" * 60, file=sys.stderr)
        print("[ExamSerializer.create] CALLED", file=sys.stderr)
        print("[ExamSerializer.create] keys:", list(validated_data.keys()), file=sys.stderr)
        questions = validated_data.pop('questions', [])
        print(f"[ExamSerializer.create] questions count: {len(questions)}", file=sys.stderr)
        exam = Exam.objects.create(**validated_data)
        exam.questions.set(questions)
        print(f"[ExamSerializer.create] exam {exam.id} now has {exam.questions.count()} questions", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        return exam

    def update(self, instance, validated_data):
        questions = validated_data.pop('questions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if questions is not None:
            instance.questions.set(questions)
        return instance


# ---------- EXAM ATTEMPT ----------
class ExamAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamAttempt
        fields = '__all__'
        read_only_fields = ['id', 'started_at']
        extra_kwargs = {
            'exam_title': {'required': False, 'allow_blank': True},
            'student_name': {'required': False, 'allow_blank': True},
            'submitted_at': {'required': False, 'allow_null': True},
            'score': {'required': False, 'allow_null': True},
            'status': {'required': False},
        }

    def create(self, validated_data):
        exam = validated_data.get('exam')
        student = validated_data.get('student')

        if exam and not validated_data.get('exam_title'):
            validated_data['exam_title'] = exam.exam_title

        if student and not validated_data.get('student_name'):
            validated_data['student_name'] = student.full_name or student.username

        return super().create(validated_data)


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
    video_source = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CampusMediaPost
        fields = [
            'id', 'title', 'description', 'category',
            'video_file', 'video_url', 'video_source',
            'thumbnail_url', 'posted_by', 'author_role',
            'posted_at', 'duration', 'views_count',
            'likes_count', 'featured', 'tags'
        ]
        read_only_fields = ['id', 'posted_at', 'views_count', 'likes_count']
        extra_kwargs = {
            'video_url': {'required': False, 'allow_blank': True, 'allow_null': True},
            'video_file': {'required': False},
            'duration': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def get_video_source(self, obj):
        if obj.video_file:
            return obj.video_file.url
        return obj.video_url


# ---------- ZOOM CLASS SESSION ----------
class ZoomClassSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZoomClassSession
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'course': {'required': False, 'allow_null': True},
            'passcode': {'required': False, 'allow_blank': True, 'allow_null': True},
            'topic': {'required': False, 'allow_blank': True, 'allow_null': True},
            'lecture_notes': {'required': False, 'allow_blank': True, 'allow_null': True},
            'recording_url': {'required': False, 'allow_blank': True, 'allow_null': True},
            'recording_duration': {'required': False, 'allow_blank': True, 'allow_null': True},
            'host_url': {'required': False, 'allow_blank': True, 'allow_null': True},
        }