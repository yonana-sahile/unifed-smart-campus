from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
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
        # ✅ FIX: Allow base64 image strings for avatar_url
        extra_kwargs = {
            'avatar_url': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

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
    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ['id', 'submitted_at']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


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
        questions = validated_data.pop('questions', [])
        exam = Exam.objects.create(**validated_data)
        exam.questions.set(questions)
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
# ✅ FIXED: Removed broken validate_student / validate_exam methods.
#    DRF's PrimaryKeyRelatedField already converts "19" → <User>, "15" → <Exam>
#    BEFORE these validators run, so they were always raising "Invalid ... reference".
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

        # Auto-fill human-readable copies so the model's non-blank CharFields pass
        if exam and not validated_data.get('exam_title'):
            validated_data['exam_title'] = exam.exam_title

        if student and not validated_data.get('student_name'):
            validated_data['student_name'] = (
                getattr(student, 'full_name', None) or student.username or 'Student'
            )

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


# ---------- LIVE ATTENDANCE ----------
class AttendanceCheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceCheckIn
        fields = [
            'id', 'session', 'student', 'student_name', 'status',
            'method', 'checked_in_at', 'ip_address',
        ]
        read_only_fields = ['id', 'checked_in_at']


class AttendanceSessionSerializer(serializers.ModelSerializer):
    check_ins = serializers.SerializerMethodField()
    checked_in_count = serializers.SerializerMethodField()
    seconds_remaining = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)
    check_in_code = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'course', 'course_code', 'course_title',
            'instructor', 'instructor_name', 'title', 'topic', 'location',
            'session_date', 'started_at', 'expires_at', 'ended_at',
            'check_in_code', 'status', 'late_after_minutes',
            'totals_applied', 'check_ins', 'checked_in_count',
            'seconds_remaining', 'is_expired',
        ]
        read_only_fields = [
            'id', 'course_code', 'course_title', 'instructor_name',
            'session_date', 'started_at', 'expires_at', 'ended_at',
            'status', 'totals_applied',
        ]

    def _request_user(self):
        return self.context.get('request').user if self.context.get('request') else None

    def get_check_in_code(self, obj):
        """Only instructors/staff may read the code. Students must be given it in class."""
        user = self._request_user()
        if user and getattr(user, 'role', None) == 'STUDENT':
            return None
        return obj.check_in_code

    def get_check_ins(self, obj):
        qs = obj.check_ins.all()
        user = self._request_user()
        if user and getattr(user, 'role', None) == 'STUDENT':
            qs = qs.filter(student=user)
        return AttendanceCheckInSerializer(qs, many=True).data

    def get_checked_in_count(self, obj):
        return obj.check_ins.count()

    def get_seconds_remaining(self, obj):
        if obj.status != 'OPEN':
            return 0
        return max(0, int((obj.expires_at - timezone.now()).total_seconds()))


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


# ---------- FACILITY (Phase 3) ----------
class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


# ---------- FACILITY BOOKING (Phase 3) ----------
class FacilityBookingSerializer(serializers.ModelSerializer):
    facility_name = serializers.CharField(source='facility.name', read_only=True)
    facility_code = serializers.CharField(source='facility.facility_code', read_only=True)
    facility_campus = serializers.CharField(source='facility.campus', read_only=True)
    requester_name = serializers.CharField(source='requested_by.full_name', read_only=True, allow_null=True)
    approver_name = serializers.CharField(source='approved_by.full_name', read_only=True, allow_null=True)

    class Meta:
        model = FacilityBooking
        fields = [
            'id', 'facility', 'facility_name', 'facility_code', 'facility_campus',
            'requested_by', 'requester_name', 'approved_by', 'approver_name',
            'department', 'date', 'start_time', 'end_time', 'purpose',
            'expected_attendees', 'status', 'rejection_reason',
            'created_at', 'updated_at', 'approved_at',
        ]
        read_only_fields = [
            'id', 'requested_by', 'approved_by', 'department',
            'status', 'rejection_reason', 'created_at', 'updated_at', 'approved_at',
        ]

    def validate_facility(self, facility):
        if not facility.is_active:
            raise serializers.ValidationError('This facility is inactive and cannot be booked.')
        return facility

    def validate(self, data):
        facility = data.get('facility') or (self.instance.facility if self.instance else None)
        date = data.get('date') or (self.instance.date if self.instance else None)
        start_time = data.get('start_time') or (self.instance.start_time if self.instance else None)
        end_time = data.get('end_time') or (self.instance.end_time if self.instance else None)
        expected = data.get('expected_attendees')
        if expected is None and self.instance:
            expected = self.instance.expected_attendees

        if not (facility and date and start_time and end_time):
            return data

        if end_time <= start_time:
            raise serializers.ValidationError({'end_time': 'End time must be after start time.'})

        from datetime import datetime, timedelta
        from django.utils import timezone as _tz

        now = _tz.now()
        start_dt = _tz.make_aware(datetime.combine(date, start_time))
        end_dt = _tz.make_aware(datetime.combine(date, end_time))

        if start_dt < now - timedelta(minutes=1):
            raise serializers.ValidationError({'date': 'Bookings cannot start in the past.'})

        if facility.maintenance_until and facility.maintenance_until > now and start_dt < facility.maintenance_until:
            raise serializers.ValidationError({
                'facility': f'{facility.name} is under maintenance until {facility.maintenance_until.strftime("%Y-%m-%d %H:%M")}.',
            })

        if expected and facility.capacity and expected > facility.capacity:
            raise serializers.ValidationError({
                'expected_attendees': f'Exceeds facility capacity of {facility.capacity}.',
            })

        overlapping = FacilityBooking.objects.filter(
            facility=facility,
            date=date,
            status__in=['PENDING', 'APPROVED'],
        ).exclude(pk=self.instance.pk if self.instance else None)

        for b in overlapping:
            b_start = _tz.make_aware(datetime.combine(b.date, b.start_time))
            b_end = _tz.make_aware(datetime.combine(b.date, b.end_time))
            if start_dt < b_end and end_dt > b_start:
                raise serializers.ValidationError({
                    'date': f'Overlaps with existing booking: {b.purpose} ({b.start_time}-{b.end_time}).',
                })

        return data


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


# ---------- EXAM MONITORING EVENT ----------
class ExamMonitoringEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamMonitoringEvent
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']


# ✅ NEW: EXAM MONITORING SETTINGS
class ExamMonitoringSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamMonitoringSetting
        fields = '__all__'


# ---------- DORMITORY MANAGEMENT ----------
class DormBlockSerializer(serializers.ModelSerializer):
    occupied_rooms = serializers.SerializerMethodField()
    available_rooms = serializers.SerializerMethodField()
    total_beds = serializers.SerializerMethodField()
    occupied_beds = serializers.SerializerMethodField()

    class Meta:
        model = DormBlock
        fields = [
            'id', 'block_name', 'gender_type', 'total_rooms',
            'occupied_rooms', 'available_rooms', 'total_beds', 'occupied_beds',
        ]

    def get_occupied_rooms(self, obj):
        return obj.rooms.filter(current_occupants_count__gt=0).count()

    def get_available_rooms(self, obj):
        return obj.rooms.filter(is_available=True).count()

    def get_total_beds(self, obj):
        return sum(room.capacity for room in obj.rooms.all())

    def get_occupied_beds(self, obj):
        return sum(room.current_occupants_count for room in obj.rooms.all())


class DormRoomSerializer(serializers.ModelSerializer):
    block_name = serializers.CharField(source='block.block_name', read_only=True)
    gender_type = serializers.CharField(source='block.gender_type', read_only=True)
    available_beds = serializers.SerializerMethodField()

    class Meta:
        model = DormRoom
        fields = [
            'id', 'block', 'block_name', 'gender_type', 'room_number', 'capacity',
            'current_occupants_count', 'available_beds', 'is_available',
        ]
        read_only_fields = ['id', 'current_occupants_count', 'available_beds', 'is_available']

    def get_available_beds(self, obj):
        return max(0, obj.capacity - obj.current_occupants_count)


class DormAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    block_name = serializers.CharField(source='room.block.block_name', read_only=True)
    gender_type = serializers.CharField(source='room.block.gender_type', read_only=True)

    class Meta:
        model = DormAssignment
        fields = [
            'id', 'student', 'student_name', 'room', 'room_number', 'block_name',
            'gender_type', 'assigned_date', 'academic_year', 'status',
        ]
        read_only_fields = ['id', 'status']
        extra_kwargs = {
            'academic_year': {'required': False, 'allow_blank': True, 'allow_null': True},
            'assigned_date': {'required': False},
        }

    def get_student_name(self, obj):
        full_name = getattr(obj.student, 'full_name', None)
        return full_name or obj.student_name or getattr(obj.student, 'username', '')

    def validate(self, attrs):
        room = attrs.get('room') or getattr(self.instance, 'room', None)
        status_value = attrs.get('status') or getattr(self.instance, 'status', 'ACTIVE')
        if room is not None and status_value == 'ACTIVE':
            active = (
                DormAssignment.objects
                .filter(room=room, status='ACTIVE')
                .exclude(pk=getattr(self.instance, 'pk', None))
                .count()
            )
            if active >= room.capacity:
                raise serializers.ValidationError({'room': 'This room is already full.'})
        return attrs


class DormMaintenanceRequestSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    block_name = serializers.CharField(source='room.block.block_name', read_only=True)
    reported_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DormMaintenanceRequest
        fields = [
            'id', 'room', 'room_number', 'block_name', 'reported_by',
            'reported_by_name', 'issue_description', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'reported_by', 'created_at']
        extra_kwargs = {
            'room': {'required': True},
            'issue_description': {'required': True, 'allow_blank': False},
            'status': {'required': False},
        }

    def get_reported_by_name(self, obj):
        return (
            getattr(obj.reported_by, 'full_name', None)
            or getattr(obj.reported_by, 'username', '')
        )
