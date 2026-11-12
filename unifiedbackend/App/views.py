from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Avg, Count, Q, F
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import *
from .serializers import *
from .permissions import *
import json
import random
import secrets
import string
import uuid
from datetime import timedelta


# ---------- AUTH ----------
class AuthViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        from django.db.models import Q
        from django.contrib.auth import get_user_model
        User = get_user_model()

        user_obj = User.objects.filter(
            Q(username__iexact=username) | Q(email__iexact=username)
        ).first()

        user = None
        if user_obj:
            user = authenticate(username=user_obj.username, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------- GENERIC BASE VIEWSET ----------
class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()


def _student_course_ids(user):
    sub = Submission.objects.filter(student=user).values_list('course_id', flat=True)
    grd = Grade.objects.filter(student=user).values_list('course_id', flat=True)
    at = ExamAttempt.objects.filter(student=user).values_list('exam__course_id', flat=True)
    return set(list(sub) + list(grd) + list(at))


# ---------- USER ----------
class UserViewSet(BaseViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=True, methods=['put'], permission_classes=[permissions.IsAuthenticated])
    def update_user(self, request, pk=None):
        user = self.get_object()
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_avatar(self, request, pk=None):
        if request.user.role in ('ADMIN', 'REGISTRAR'):
            user = self.get_object()
        else:
            user = request.user

        image_data = request.data.get('image')
        if not image_data:
            return Response({'error': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user.avatar_url = image_data
            user.avatar_updated_at = timezone.now()
            user.save()
            return Response({
                'message': 'Profile photo updated successfully',
                'avatar_url': user.avatar_url,
                'avatar_updated_at': user.avatar_updated_at,
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def request_password_reset(self, request):
        email = request.data.get('email', '').strip()

        if not email:
            return Response({"error": "Please provide an email address."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.filter(student_id__iexact=email).first()

        if not user:
            return Response({"error": "User with this email or Student ID not found."},
                            status=status.HTTP_404_NOT_FOUND)

        PasswordResetOTP.objects.filter(email=user.email).delete()
        otp = str(random.randint(100000, 999999))
        PasswordResetOTP.objects.create(email=user.email, otp_code=otp)

        try:
            send_mail(
                'Unified Smart Campus - Password Reset',
                f'Hello {user.full_name or user.username},\n\nYour password reset code is: {otp}\n\nThis code expires in 10 minutes.',
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Email failed to send: {e}")
            return Response({"error": "Failed to send email. Please contact ICT."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "OTP sent successfully", "email": user.email})

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def confirm_password_reset(self, request):
        email = request.data.get('email', '').strip()
        otp = request.data.get('otp', '').strip()
        new_password = request.data.get('new_password')

        if not email or not otp or not new_password:
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.filter(student_id__iexact=email).first()

        if not user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        reset_record = PasswordResetOTP.objects.filter(email=user.email).last()

        if not reset_record:
            return Response({"error": "No OTP requested for this account."}, status=status.HTTP_400_BAD_REQUEST)

        if reset_record.is_expired():
            reset_record.delete()
            return Response({"error": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        if reset_record.otp_code != otp:
            return Response({"error": "Invalid OTP code."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        reset_record.delete()

        return Response({"message": "Password reset successful."})


# ---------- COURSE ----------
class CourseViewSet(BaseViewSet):
    serializer_class = CourseSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Course.objects.none()
        if user.role == 'INSTRUCTOR':
            return Course.objects.filter(instructor=user)
        if user.role in ('DEPARTMENT_HEAD', 'DEAN'):
            dept = (getattr(user, 'department', None) or '').strip()
            if not dept:
                return Course.objects.none()
            return Course.objects.filter(instructor__department__iexact=dept)

        if user.role == 'STUDENT':
            dept = (getattr(user, 'department', None) or '').strip()
            if dept:
                return Course.objects.filter(department__iexact=dept)
            return Course.objects.all()

        return Course.objects.all()

    def _guard_instructor_change(self, request):
        if 'instructor' not in request.data:
            return None

        if request.user.role not in ('DEPARTMENT_HEAD', 'DEAN', 'REGISTRAR', 'ADMIN'):
            return Response(
                {'error': 'Only a Department Head, Dean, Registrar, or Admin can reassign a course.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.user.role == 'DEPARTMENT_HEAD':
            new_instructor_id = request.data['instructor']
            dept = (getattr(request.user, 'department', None) or '').strip()
            try:
                new_instructor = User.objects.get(pk=new_instructor_id, role='INSTRUCTOR')
            except (User.DoesNotExist, ValueError, TypeError):
                return Response(
                    {'error': 'The specified user is not an instructor.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if (new_instructor.department or '').strip().lower() != dept.lower():
                return Response(
                    {'error': f'You can only assign instructors from your department ({dept}).'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        return None

    def update(self, request, *args, **kwargs):
        denied = self._guard_instructor_change(request)
        if denied:
            return denied
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        denied = self._guard_instructor_change(request)
        if denied:
            return denied
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        student = request.user

        if student.role != 'STUDENT':
            return Response({'error': 'Only students can enroll'}, status=status.HTTP_403_FORBIDDEN)

        if Grade.objects.filter(student=student, course=course).exists():
            return Response({'error': 'You are already enrolled in this course.'}, status=status.HTTP_400_BAD_REQUEST)

        if course.enrolled_students_count >= course.capacity:
            return Response({'error': 'Course is full'}, status=status.HTTP_400_BAD_REQUEST)

        course.enrolled_students_count += 1
        course.save()

        Grade.objects.create(
            student=student,
            student_name=student.full_name,
            course=course,
            course_title=course.course_title,
            course_code=course.course_code,
            credit_hours=course.credit_hours,
            semester=course.semester,
            continuous_assessment_score=0,
            mid_exam_score=0,
            final_exam_score=0,
            total_grade=0,
            status='CALCULATED'
        )

        return Response({'message': 'Enrolled successfully'})


# ---------- COURSE MATERIAL ----------
class CourseMaterialViewSet(BaseViewSet):
    serializer_class = CourseMaterialSerializer

    def get_queryset(self):
        user = self.request.user
        qs = CourseMaterial.objects.all().order_by('-uploaded_at')
        if not user.is_authenticated:
            return qs.none()
        if user.role == 'INSTRUCTOR':
            return qs.filter(course__instructor=user)
        if user.role == 'STUDENT':
            return qs.filter(course_id__in=_student_course_ids(user))
        return qs


# ---------- ANNOUNCEMENT ----------
class AnnouncementViewSet(BaseViewSet):
    queryset = Announcement.objects.all().order_by('-posted_at')
    serializer_class = AnnouncementSerializer


# ---------- ASSIGNMENT ----------
class AssignmentViewSet(BaseViewSet):
    serializer_class = AssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Assignment.objects.all()
        if not user.is_authenticated:
            return qs.none()
        if user.role == 'INSTRUCTOR':
            return qs.filter(course__instructor=user)
        if user.role == 'STUDENT':
            return qs.filter(course_id__in=_student_course_ids(user))
        return qs


# ---------- SUBMISSION ----------
class SubmissionViewSet(BaseViewSet):
    serializer_class = SubmissionSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = Submission.objects.all()
        if not user.is_authenticated:
            return qs.none()
        if user.role == 'STUDENT':
            return qs.filter(student=user)
        if user.role == 'INSTRUCTOR':
            return qs.filter(course__instructor=user)
        return qs

    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        if file and not serializer.validated_data.get('file_name'):
            serializer.validated_data['file_name'] = file.name
        serializer.save()


# ---------- QUESTION ----------
class QuestionViewSet(BaseViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

    def create(self, request, *args, **kwargs):
        import sys
        print("=" * 60, file=sys.stderr)
        print("[ExamViewSet.create] PAYLOAD:", dict(request.data), file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        return super().create(request, *args, **kwargs)


# ---------- EXAM ----------
class ExamViewSet(BaseViewSet):
    serializer_class = ExamSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Exam.objects.all().order_by('-created_at')
        if not user.is_authenticated:
            return qs.none()

        if user.role == 'INSTRUCTOR':
            return qs.filter(course__instructor=user)

        if user.role == 'STUDENT':
            dept = (getattr(user, 'department', None) or '').strip()
            enrolled = _student_course_ids(user)

            if dept:
                return qs.filter(
                    Q(course_id__in=enrolled) | Q(course__department__iexact=dept),
                    is_pushed=True,
                ).distinct()

            return qs.filter(course_id__in=enrolled, is_pushed=True)

        return qs

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit_attempt(self, request, pk=None):
        exam = self.get_object()
        student = request.user

        if student.role != 'STUDENT':
            return Response({'error': 'Only students can submit exam attempts'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ExamAttemptSerializer(data={
            'exam': exam.id,
            'exam_title': exam.exam_title,
            'student': student.id,
            'student_name': student.full_name,
            'answers': request.data.get('answers', {}),
            'status': 'SUBMITTED',
            'submitted_at': timezone.now()
        })

        if serializer.is_valid():
            attempt = serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def push(self, request, pk=None):
        exam = self.get_object()
        is_pushed = bool(request.data.get('is_pushed', True))

        exam.is_pushed = is_pushed
        exam.status = 'ACTIVE' if is_pushed else 'DRAFT'
        if is_pushed:
            exam.pushed_at = timezone.now()
            if not exam.created_by:
                exam.created_by = request.user.full_name
        else:
            exam.pushed_at = None
        exam.save()

        return Response(self.get_serializer(exam).data)


# ---------- EXAM ATTEMPT ----------
class ExamAttemptViewSet(BaseViewSet):
    serializer_class = ExamAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ExamAttempt.objects.all().order_by('-submitted_at')
        user = self.request.user
        if user.role == 'STUDENT':
            return qs.filter(student=user, status='SUBMITTED')
        if user.role == 'INSTRUCTOR':
            return qs.filter(exam__course__instructor=user)
        return qs


# ---------- GRADE ----------
class GradeViewSet(BaseViewSet):
    serializer_class = GradeSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Grade.objects.all()
        if not user.is_authenticated:
            return qs.none()
        if user.role == 'STUDENT':
            return qs.filter(student=user)
        if user.role == 'INSTRUCTOR':
            return qs.filter(course__instructor=user)
        return qs

    def _lock_if_approved(self):
        grade = self.get_object()
        if grade.status == 'APPROVED':
            return Response(
                {'error': 'This grade is APPROVED and locked. Contact the registrar to amend.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def update(self, request, *args, **kwargs):
        denied = self._lock_if_approved()
        if denied:
            return denied
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        denied = self._lock_if_approved()
        if denied:
            return denied
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        grade = self.get_object()
        user = request.user

        if user.role not in ('REGISTRAR', 'DEAN', 'DEPARTMENT_HEAD'):
            return Response(
                {'error': 'Only a Registrar, Dean, or Department Head can approve grades.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if grade.status == 'APPROVED':
            return Response({'error': 'This grade is already APPROVED.'}, status=status.HTTP_400_BAD_REQUEST)

        if grade.status != 'SUBMITTED':
            return Response(
                {'error': f'Only SUBMITTED grades can be approved. Current status: {grade.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grade.status = 'APPROVED'
        grade.save()
        return Response({'message': 'Grade approved'})


# ---------- TRANSCRIPT ----------
class TranscriptViewSet(BaseViewSet):
    queryset = Transcript.objects.all()
    serializer_class = TranscriptSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Transcript.objects.none()
        if user.role == 'STUDENT':
            return Transcript.objects.filter(student=user)
        return Transcript.objects.all()


# ---------- ATTENDANCE RECORD ----------
class AttendanceRecordViewSet(BaseViewSet):
    serializer_class = AttendanceRecordSerializer

    def get_queryset(self):
        user = self.request.user
        qs = AttendanceRecord.objects.all()
        if not user.is_authenticated:
            return qs.none()
        if user.role == 'INSTRUCTOR':
            return qs.filter(course__instructor=user)
        if user.role == 'STUDENT':
            return qs.filter(student=user)
        return qs


# ============================================================================
# LIVE ATTENDANCE CHECK-IN
# ============================================================================

ATTENDANCE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'


def _generate_attendance_code():
    return ''.join(secrets.choice(ATTENDANCE_CODE_ALPHABET) for _ in range(6))


def _can_manage_course(user, course):
    if user.role in ('ADMIN', 'REGISTRAR'):
        return True
    if user.role == 'INSTRUCTOR':
        return course.instructor_id == user.id
    if user.role == 'DEPARTMENT_HEAD':
        return (user.department or '').strip().lower() == (course.department or '').strip().lower()
    return False


def _ensure_attendance_records(course):
    student_ids = (
        Grade.objects.filter(course=course, student__role='STUDENT')
        .values_list('student_id', flat=True)
        .distinct()
    )
    for student in User.objects.filter(id__in=list(student_ids)):
        AttendanceRecord.objects.get_or_create(
            student=student,
            course=course,
            defaults={
                'student_name': student.full_name or student.username,
                'course_code': course.course_code,
            },
        )


def _finalize_attendance_session(session):
    if session.totals_applied:
        return

    checked_in_ids = set(session.check_ins.values_list('student_id', flat=True))
    for record in AttendanceRecord.objects.filter(course=session.course):
        record.total_sessions += 1
        if record.student_id in checked_in_ids:
            record.attended_sessions += 1
        record.save()

    session.totals_applied = True
    session.save(update_fields=['totals_applied'])


class AttendanceSessionViewSet(BaseViewSet):
    serializer_class = AttendanceSessionSerializer

    def get_queryset(self):
        user = self.request.user
        qs = AttendanceSession.objects.all().order_by('-started_at')
        if not user.is_authenticated:
            return qs.none()

        if user.role == 'STUDENT':
            course_ids = set(
                Grade.objects.filter(student=user).values_list('course_id', flat=True)
            )
            return qs.filter(Q(course_id__in=course_ids) | Q(check_ins__student=user)).distinct()

        if user.role == 'INSTRUCTOR':
            return qs.filter(Q(instructor=user) | Q(course__instructor=user)).distinct()

        if user.role == 'DEPARTMENT_HEAD':
            dept = (getattr(user, 'department', None) or '').strip()
            if not dept:
                return qs.none()
            return qs.filter(course__department__iexact=dept)

        return qs

    def _deny_students(self):
        if self.request.user.role == 'STUDENT':
            return Response(
                {'error': 'Only instructors and academic staff can manage attendance sessions.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def create(self, request, *args, **kwargs):
        denied = self._deny_students()
        if denied:
            return denied
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        denied = self._deny_students()
        if denied:
            return denied
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        denied = self._deny_students()
        if denied:
            return denied
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        denied = self._deny_students()
        if denied:
            return denied
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='open')
    def open_session(self, request):
        if request.user.role not in ('INSTRUCTOR', 'DEPARTMENT_HEAD', 'ADMIN', 'REGISTRAR'):
            return Response(
                {'error': 'Only instructors and academic staff can open a session.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        course_id = request.data.get('course') or request.data.get('courseId')
        if not course_id:
            return Response({'error': 'course is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(pk=course_id)
        except (Course.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not _can_manage_course(request.user, course):
            return Response(
                {'error': 'You are not allowed to open attendance for this course.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            duration_minutes = int(request.data.get('duration_minutes', 15))
        except (TypeError, ValueError):
            duration_minutes = 15
        duration_minutes = max(1, min(duration_minutes, 120))

        try:
            late_after_minutes = int(request.data.get('late_after_minutes', 10))
        except (TypeError, ValueError):
            late_after_minutes = 10
        late_after_minutes = max(0, min(late_after_minutes, duration_minutes))

        for stale in AttendanceSession.objects.filter(course=course, status='OPEN'):
            stale.status = 'CLOSED'
            stale.ended_at = timezone.now()
            stale.save(update_fields=['status', 'ended_at'])
            _finalize_attendance_session(stale)

        code = _generate_attendance_code()
        for _ in range(25):
            if not AttendanceSession.objects.filter(status='OPEN', check_in_code=code).exists():
                break
            code = _generate_attendance_code()

        session = AttendanceSession.objects.create(
            course=course,
            course_code=course.course_code,
            course_title=course.course_title,
            instructor=request.user,
            instructor_name=request.user.full_name or request.user.username,
            title=(request.data.get('title') or 'Live Class Attendance')[:200],
            topic=request.data.get('topic') or '',
            location=(request.data.get('location') or '')[:100],
            expires_at=timezone.now() + timedelta(minutes=duration_minutes),
            check_in_code=code,
            late_after_minutes=late_after_minutes,
        )

        _ensure_attendance_records(course)

        return Response(
            self.get_serializer(session).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='close')
    def close_session(self, request, pk=None):
        session = self.get_object()

        if not _can_manage_course(request.user, session.course):
            return Response(
                {'error': 'You are not allowed to close this session.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if session.status == 'OPEN':
            session.status = 'CLOSED'
            session.ended_at = timezone.now()
            session.save(update_fields=['status', 'ended_at'])

        _finalize_attendance_session(session)
        return Response(self.get_serializer(session).data)

    @action(detail=False, methods=['post'], url_path='check-in')
    def check_in(self, request):
        if request.user.role != 'STUDENT':
            return Response(
                {'error': 'Only students can check in to a class session.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        code = str(request.data.get('code') or '').strip().upper()
        if not code:
            return Response({'error': 'Enter the check-in code.'}, status=status.HTTP_400_BAD_REQUEST)

        session = (
            AttendanceSession.objects
            .filter(check_in_code=code, status='OPEN')
            .order_by('-started_at')
            .first()
        )
        if session is None:
            return Response(
                {'error': 'Invalid or closed check-in code. Ask your instructor for the current code.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if session.expires_at <= timezone.now():
            session.status = 'CLOSED'
            session.ended_at = timezone.now()
            session.save(update_fields=['status', 'ended_at'])
            _finalize_attendance_session(session)
            return Response(
                {'error': 'This check-in window has expired. Ask your instructor to open a new session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if session.check_ins.filter(student=request.user).exists():
            return Response(
                {'error': 'You have already checked in to this session.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_registered = Grade.objects.filter(
            student=request.user, course=session.course
        ).exists()
        if not is_registered:
            return Response(
                {'error': 'You are not registered for this course.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        record, _created = AttendanceRecord.objects.get_or_create(
            student=request.user,
            course=session.course,
            defaults={
                'student_name': request.user.full_name or request.user.username,
                'course_code': session.course_code,
            },
        )

        late_cutoff = session.started_at + timedelta(minutes=session.late_after_minutes)
        attendance_status = 'LATE' if timezone.now() > late_cutoff else 'PRESENT'

        forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
        ip_address = (
                         forwarded.split(',')[0].strip()
                         if forwarded
                         else request.META.get('REMOTE_ADDR')
                     ) or None

        checkin = AttendanceCheckIn.objects.create(
            session=session,
            student=request.user,
            student_name=request.user.full_name or request.user.username,
            status=attendance_status,
            method='CODE',
            ip_address=ip_address,
        )

        return Response(
            {
                'message': (
                    f'Checked in successfully as {attendance_status.title()}. '
                    'Your ledger updates when the instructor closes the session.'
                ),
                'check_in': AttendanceCheckInSerializer(checkin).data,
                'session': {
                    'id': session.id,
                    'course_code': session.course_code,
                    'course_title': session.course_title,
                    'title': session.title,
                    'status': session.status,
                    'expires_at': session.expires_at,
                },
                'attendance': AttendanceRecordSerializer(record).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['get'], url_path='active')
    def active(self, request):
        qs = self.get_queryset().filter(
            status='OPEN', expires_at__gt=timezone.now()
        )
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=['get'], url_path='live')
    def live(self, request, pk=None):
        session = self.get_object()
        return Response(self.get_serializer(session).data)


# ---------- INSTRUCTOR EVALUATION ----------
class InstructorEvaluationViewSet(BaseViewSet):
    queryset = InstructorEvaluation.objects.all()
    serializer_class = InstructorEvaluationSerializer


# ---------- COURSE OUTLINE ----------
class CourseOutlineFormViewSet(BaseViewSet):
    queryset = CourseOutlineForm.objects.all()
    serializer_class = CourseOutlineFormSerializer


# ---------- LIBRARY RESOURCE ----------
class LibraryResourceViewSet(BaseViewSet):
    queryset = LibraryResource.objects.all()
    serializer_class = LibraryResourceSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def download(self, request, pk=None):
        resource = self.get_object()
        resource.downloads_count += 1
        resource.save()
        return Response({'downloads_count': resource.downloads_count})


# ---------- PAYMENT TRANSACTION ----------
class PaymentTransactionViewSet(BaseViewSet):
    queryset = PaymentTransaction.objects.all()
    serializer_class = PaymentTransactionSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify(self, request, pk=None):
        payment = self.get_object()
        payment.status = 'VERIFIED'
        payment.verified_by = request.user.full_name
        payment.save()
        return Response({'message': 'Payment verified'})


# ---------- SCHOLARSHIP ----------
class ScholarshipViewSet(BaseViewSet):
    queryset = Scholarship.objects.all()
    serializer_class = ScholarshipSerializer


# ---------- MOE ADMISSION ----------
class MoEAdmissionRecordViewSet(BaseViewSet):
    queryset = MoEAdmissionRecord.objects.all()
    serializer_class = MoEAdmissionRecordSerializer


# ---------- CERTIFICATE ----------
class CertificateRecordViewSet(BaseViewSet):
    queryset = CertificateRecord.objects.all()
    serializer_class = CertificateRecordSerializer


# ---------- AUDIT LOG ----------
class AuditLogViewSet(BaseViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer


# ---------- SYSTEM SETTINGS ----------
class SystemSettingsViewSet(BaseViewSet):
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer


# ---------- STUDENT CLEARANCE ----------
class StudentClearanceViewSet(BaseViewSet):
    queryset = StudentClearance.objects.all()
    serializer_class = StudentClearanceSerializer


# ---------- FACILITY (Phase 3) ----------
class FacilityViewSet(BaseViewSet):
    serializer_class = FacilitySerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Facility.objects.none()
        if user.role in ('ADMIN', 'REGISTRAR'):
            return Facility.objects.all()
        dept = (getattr(user, 'department', None) or '').strip().lower()
        if not dept:
            return Facility.objects.filter(is_active=True)
        return Facility.objects.filter(Q(department__iexact=dept) | Q(department=''))

    def _can_manage(self):
        return self.request.user.role in ('ADMIN', 'DEPARTMENT_HEAD', 'REGISTRAR')

    def create(self, request, *args, **kwargs):
        if not self._can_manage():
            return Response({'error': 'Only admins and department heads can create facilities.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not self._can_manage():
            return Response({'error': 'Only admins and department heads can edit facilities.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self._can_manage():
            return Response({'error': 'Only admins and department heads can delete facilities.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


# ---------- FACILITY BOOKING (Phase 3) ----------
class FacilityBookingViewSet(BaseViewSet):
    serializer_class = FacilityBookingSerializer

    def get_queryset(self):
        user = self.request.user
        qs = FacilityBooking.objects.select_related('facility', 'requested_by', 'approved_by')
        if not user.is_authenticated:
            return qs.none()
        if user.role == 'STUDENT':
            return qs.filter(requested_by=user)
        if user.role == 'INSTRUCTOR':
            dept = (getattr(user, 'department', '') or '').strip().lower()
            return qs.filter(Q(requested_by=user) | Q(facility__department__iexact=dept))
        if user.role == 'DEPARTMENT_HEAD':
            dept = (getattr(user, 'department', '') or '').strip().lower()
            if dept:
                return qs.filter(Q(department__iexact=dept) | Q(facility__department__iexact=dept))
            return qs
        return qs

    def perform_create(self, serializer):
        serializer.save(
            requested_by=self.request.user,
            department=getattr(self.request.user, 'department', '') or '',
            status='PENDING',
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        booking = self.get_object()
        if request.user.role not in ('DEPARTMENT_HEAD', 'ADMIN', 'REGISTRAR'):
            return Response({'error': 'Only department heads can approve bookings.'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status != 'PENDING':
            return Response({'error': f'Only PENDING bookings can be approved. Current: {booking.status}.'},
                            status=status.HTTP_400_BAD_REQUEST)
        booking.status = 'APPROVED'
        booking.approved_by = request.user
        booking.approved_at = timezone.now()
        booking.save()
        return Response(FacilityBookingSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        booking = self.get_object()
        if request.user.role not in ('DEPARTMENT_HEAD', 'ADMIN', 'REGISTRAR'):
            return Response({'error': 'Only department heads can reject bookings.'}, status=status.HTTP_403_FORBIDDEN)
        if booking.status != 'PENDING':
            return Response({'error': f'Only PENDING bookings can be rejected. Current: {booking.status}.'},
                            status=status.HTTP_400_BAD_REQUEST)
        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response({'error': 'Rejection reason is required.'}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = 'REJECTED'
        booking.rejection_reason = reason[:255]
        booking.approved_by = request.user
        booking.approved_at = timezone.now()
        booking.save()
        return Response(FacilityBookingSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if request.user.role not in ('ADMIN', 'REGISTRAR'):
            if booking.requested_by_id != request.user.id:
                is_dept_head = (
                    request.user.role == 'DEPARTMENT_HEAD'
                    and (booking.department or '').strip().lower() == (
                            getattr(request.user, 'department', '') or '').strip().lower()
                )
                if not is_dept_head:
                    return Response({'error': 'You can only cancel your own bookings.'},
                                    status=status.HTTP_403_FORBIDDEN)
        if booking.status in ('CANCELLED', 'COMPLETED'):
            return Response({'error': f'Cannot cancel a {booking.status} booking.'}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = 'CANCELLED'
        booking.save()
        return Response(FacilityBookingSerializer(booking, context={'request': request}).data)


# ---------- CAMPUS ALERT ----------
class CampusAlertViewSet(BaseViewSet):
    queryset = CampusAlert.objects.all()
    serializer_class = CampusAlertSerializer


# ---------- CAMPUS MEDIA POST ----------
class CampusMediaPostViewSet(BaseViewSet):
    queryset = CampusMediaPost.objects.all()
    serializer_class = CampusMediaPostSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def view(self, request, pk=None):
        post = self.get_object()
        post.views_count += 1
        post.save()
        return Response({'views_count': post.views_count})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        post.likes_count += 1
        post.save()
        return Response({'likes_count': post.likes_count})

    def create(self, request, *args, **kwargs):
        if hasattr(request.data, 'dict'):
            data = request.data.dict()
        else:
            data = dict(request.data)

        if request.FILES.get('video_file'):
            data['video_file'] = request.FILES['video_file']

        raw_tags = data.get('tags')
        if isinstance(raw_tags, str):
            try:
                data['tags'] = json.loads(raw_tags)
            except (TypeError, ValueError):
                data['tags'] = [raw_tags] if raw_tags else []

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        print("CampusMediaPost create() validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------- ZOOM CLASS SESSION ----------
class ZoomClassSessionViewSet(BaseViewSet):
    queryset = ZoomClassSession.objects.all().order_by('-start_time')
    serializer_class = ZoomClassSessionSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start(self, request, pk=None):
        session = self.get_object()
        session.status = 'LIVE'
        session.save()
        return Response(self.get_serializer(session).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def end(self, request, pk=None):
        session = self.get_object()
        session.status = 'COMPLETED'
        recording_url = request.data.get('recording_url', '')
        recording_duration = request.data.get('recording_duration', '')
        if recording_url:
            session.recording_url = recording_url
        if recording_duration:
            session.recording_duration = recording_duration
        session.save()
        return Response(self.get_serializer(session).data)


# ---------- AI ----------
class AIViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def predict_risk(self, request):
        raw_id = request.data.get('studentId') or request.data.get('student_id')
        if not raw_id:
            return Response({'error': 'studentId is required.'}, status=status.HTTP_400_BAD_REQUEST)

        raw_id = str(raw_id).strip()

        student = User.objects.filter(role='STUDENT', student_id__iexact=raw_id).first()
        if student is None:
            student = User.objects.filter(role='STUDENT', username__iexact=raw_id).first()
        if student is None and raw_id.isdigit():
            student = User.objects.filter(role='STUDENT', id=int(raw_id)).first()

        if student is None:
            return Response({'error': f"Student '{raw_id}' not found"}, status=status.HTTP_404_NOT_FOUND)

        attendance = AttendanceRecord.objects.filter(student=student)
        avg_attendance = (attendance.aggregate(Avg('attendance_percentage'))['attendance_percentage__avg'] or 0)

        grades = Grade.objects.filter(student=student)
        avg_grade = (grades.aggregate(Avg('total_grade'))['total_grade__avg'] or 0)

        dropout_probability = 0.0
        if avg_attendance < 80: dropout_probability += 0.3
        if avg_grade < 60: dropout_probability += 0.4
        if (student.outstanding_fees or 0) > 5000: dropout_probability += 0.2

        classification = 'NOT_AT_RISK'
        if dropout_probability > 0.5:
            classification = 'HIGH_RISK'
        elif dropout_probability > 0.3:
            classification = 'MODERATE_RISK'

        student_name = f"{student.first_name or ''} {student.last_name or ''}".strip()
        if not student_name: student_name = student.username

        return Response({
            'student_id': student.student_id or student.id,
            'student_name': student_name,
            'program': student.program,
            'cgpa': student.cgpa,
            'attendance_percentage': avg_attendance,
            'continuous_assessment_avg': avg_grade,
            'dropout_probability': dropout_probability,
            'classification': classification,
            'key_risk_factors': ['Low attendance', 'Poor grades'] if dropout_probability > 0.3 else [],
            'recommended_action': 'Academic intervention required' if dropout_probability > 0.3 else 'Continue monitoring'
        })

    @action(detail=False, methods=['post'])
    def generate_exam(self, request):
        topic = request.data.get('topic')
        num_questions = request.data.get('numberOfQuestions', 4)
        difficulty = request.data.get('difficulty', 'Medium')

        questions = []
        for i in range(num_questions):
            questions.append({
                'questionText': f'Sample {difficulty} question on {topic} #{i + 1}',
                'questionType': 'MCQ',
                'options': ['Option A', 'Option B', 'Option C', 'Option D'],
                'correctAnswer': 'Option A',
                'marks': 5
            })
        return Response({'success': True, 'questions': questions})


# ============================================================================
# AI CHAT — Groq with conversation memory + reasoning-friendly system prompt
# ============================================================================
import os as _os
from pathlib import Path as _Path
from dotenv import load_dotenv as _load_dotenv
import httpx
from groq import Groq
from rest_framework.decorators import api_view, permission_classes as _perm_classes

_ENV_PATH = _Path(__file__).resolve().parent.parent / ".env"
_load_dotenv(_ENV_PATH, override=True)

_k = _os.environ.get("GROQ_API_KEY", "")
print(f"[ai_chat] GROQ_API_KEY loaded: {'yes' if _k else 'NO (missing)'}")
_KB_PATH = _Path(__file__).resolve().parent.parent / "mau_info.txt"
try:
    with open(_KB_PATH, "r", encoding="utf-8") as _f:
        _MAU_KNOWLEDGE = _f.read()
    print(f"[ai_chat] Knowledge base loaded: {len(_MAU_KNOWLEDGE)} characters")
except FileNotFoundError:
    _MAU_KNOWLEDGE = ""
    print(f"[ai_chat] WARNING: {_KB_PATH} not found")

_KB_JSON_PATH = _Path(__file__).resolve().parent.parent / "aiKnowledge.json"
try:
    if _KB_JSON_PATH.exists():
        _KB_JSON = json.loads(_KB_JSON_PATH.read_text(encoding="utf-8"))
        print(f"[ai_chat] Offline KB loaded: {len(_KB_JSON.get('topics', []))} topics")
    else:
        _KB_JSON = {"topics": [], "fallback": ""}
        print(f"[ai_chat] WARNING: {_KB_JSON_PATH} not found")
except Exception as _e:
    _KB_JSON = {"topics": [], "fallback": ""}
    print(f"[ai_chat] ERROR loading aiKnowledge.json: {_e}")


def _lookup_local_kb(query: str):
    lower = query.lower().strip()
    for topic in _KB_JSON.get("topics", []):
        for kw in topic.get("keywords", []):
            if kw.lower() in lower:
                return topic.get("reply")
    return None


def _generic_offline_reply(query: str) -> str:
    return (
        "I'm having a bit of trouble reaching my knowledge base right now, "
        "so I can't answer that properly. Try again in a minute — I'll be back."
    )


_SHORT_MESSAGES = {
    "what", "huh", "sorry", "?", "??", "???", "what?", "ok", "okay", "k",
    "yes", "no", "nah", "hmm", "umm", "er",
}
_GREETINGS = {
    "hi", "hello", "hey", "selam", "salam", "good morning",
    "good afternoon", "good evening", "thanks", "thank you", "bye",
}

_GREETING_REPLY = (
    "Hello! 👋 I'm your MAU Academic Copilot. "
    "Ask me about courses, grades, exams, fees, clearance — "
    "or upload a PDF to study from."
)
_CLARIFICATION_REPLY = (
    "Could you clarify what you'd like help with? I can answer questions about:\n\n"
    "• Course registration\n"
    "• Exams and grading\n"
    "• Digital clearance\n"
    "• Fees and payments\n"
    "• Library and dorms\n"
    "• Campus life"
)

_groq_client = None


def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = _os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(f"GROQ_API_KEY is not set in {_ENV_PATH}")
        _http_client = httpx.Client(
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                ),
                "Accept": "application/json",
            },
            timeout=60.0,
            trust_env=False,
        )
        _groq_client = Groq(api_key=api_key, http_client=_http_client)
    return _groq_client


SYSTEM_PROMPT = """You are the MAU Smart Academic Copilot.

═══════════════════════════════════════════════════════════════════
CRITICAL RULES — FOLLOW THESE EXACTLY
═══════════════════════════════════════════════════════════════════

1. The user's message may contain a [STUDENT CONTEXT] block with their REAL data:
   - CGPA, department, program, outstanding fees
   - Enrolled courses
   - Current grades
   - Pending assignments
1.3. Identity questions are ALWAYS answered directly. Never fall back on
   these. They are always in scope, even if [STUDENT CONTEXT] has no info
   about you.

   Examples of identity questions:
   • "who are you" / "who are u" / "what are you"
   • "who created you" / "who built you" / "who made you"
   • "what can you do" / "what do you do" / "how can you help"
   • "what are your capabilities"

   Examples of correct answers:

   User: "who are you?"
   You: "I'm the MAU Smart Academic Copilot — your AI advisor for
        courses, grades, exams, and PDF study help."

   User: "who created you?"
   You: "I was built as part of the Unified Smart Campus project at
        Mekdela Amba University, to help students with academic questions."

   User: "what can you do?"
   You: "I can answer questions about your grades, courses, assignments,
        fees, clearance, exams, and any PDF lecture notes you upload."

   These are NEVER fallback questions. Answer them like a person would.
2. When the user asks a question, you MUST:
   a) FIRST, look for the answer in [STUDENT CONTEXT].
   b) If the answer is there, use it EXACTLY. Do NOT paraphrase.
   c) If the answer is NOT in [STUDENT CONTEXT], check the <context> block (MAU knowledge base).
   d) Before using this fallback: if [STUDENT CONTEXT], [UPLOADED MATERIAL],
      or <context> contains the answer, answer from those first. Fallback
      is only for genuine gaps.

      When you don't know something, don't perform a fallback. Just talk.

      You're a real academic advisor sitting across from the student. If
      you don't know the answer, you say so — plainly, briefly, and without
      ceremony. Then, if something nearby genuinely helps, you mention it
      in passing. You don't list options. You don't offer "here's what I
      can help with." You don't end every message with a contact.

      Some questions don't have nearby help. Some do. Read the question and
      respond to *it*, not to a script.

      Here's how this sounds in practice:

      Student: "What's the scholarship deadline?"
      You: "Not sure — that one changes every semester and I don't track
           it. If it's about eligibility or the fee-waiver side, I can
           help with that. The registrar would have the actual date."

      Student: "Who won the World Cup?"
      You: "That's outside what I do — I stick to your courses, grades,
           exams, and MAU stuff. Anything on that side I can help with?"

      Student: "How do I appeal a grade?"
      You: "I don't have the appeal steps in front of me, but it usually
           runs through the registrar and your department head. I *can*
           walk you through how your grade was calculated, if that's
           useful."

      Student: "What's the deadline for graduation applications?"
      You: "I don't have that date. The registrar's office handles
           graduation timelines — they'd know."

      Notice what's NOT happening in those replies:
      • No numbered steps.
      • No "Here's what I can help with:" list.
      • No closing contact block on every message.
      • No fake warmth ("I'd be happy to assist!").
      • Variation — some replies offer nearby help, some just name the
        office, some redirect. That's what makes it feel real.

      If a question is completely outside MAU (sports, politics, general
      trivia), just say it's not your area and pivot back. Don't lecture.

      If the question is close to something you know but you're missing
      the specific detail, say what you DO know and name the gap — that's
      more useful than a full refusal.

      Keep your replies short when you don't know — 1 to 3 sentences is
      usually enough. Long fallbacks sound like a bot covering for
      missing knowledge.

      Never quote this rule. Never structure your reply to match these
      examples. They're calibration, not a script.

2.5. If the message contains an [UPLOADED MATERIAL: ...] block, this is a PDF the
   student uploaded. It is split into [Page N] sections, e.g.:
       [UPLOADED MATERIAL: lecture.pdf]
       [Page 1] ...text...
       [Page 2] ...text...
   When the user asks about the PDF ("summarize this", "extract key terms",
   "what does page 3 say", "explain X"), you MUST answer FROM THIS BLOCK.
   - Quote/cite page numbers: "On page 3, ..."
   - If the answer is not in the uploaded pages, say:
     "That isn't covered in the uploaded pages (I can see pages 1–N)."
   - NEVER fall back to rule 2d for PDF questions — the PDF IS the source.
3. NEVER ignore [STUDENT CONTEXT]. This is the MOST IMPORTANT instruction.

═══════════════════════════════════════════════════════════════════
EXAMPLES OF CORRECT BEHAVIOR
═══════════════════════════════════════════════════════════════════

Example 1:
[STUDENT CONTEXT]
CGPA: 3.67
[QUESTION]
What is my CGPA?

Correct: "Your current CGPA is 3.67."
Wrong: "Grading at MAU: Continuous Assessment 50%..."

Example 2:
[STUDENT CONTEXT]
Grades: sw1234: 72% (C), sng1212: 45% (F)
[QUESTION]
What is my grade in sw1234?

Correct: "Your grade in sw1234 is 72% (C)."
Wrong: "Grading at MAU: Continuous Assessment 50%..."

Example 3:
[STUDENT CONTEXT]
Enrolled Courses: sw1234 - Software, sng1212 - Programming II
[QUESTION]
What courses am I enrolled in?

Correct: "You are enrolled in: sw1234 - Software, sng1212 - Programming II."
Wrong: Any generic grading rules.

Example 4:
[STUDENT CONTEXT]
Outstanding Fees: 0 ETB
[QUESTION]
Do I have outstanding fees?

Correct: "You have no outstanding fees. Your account is fully cleared."
Wrong: Any generic answer.

═══════════════════════════════════════════════════════════════════
WHO YOU ARE
═══════════════════════════════════════════════════════════════════
You serve students at Mekdela Amba University.
You're bilingual (English + Amharic), patient, and precise.

═══════════════════════════════════════════════════════════════════
TONE
═══════════════════════════════════════════════════════════════════
• Warm, direct, and specific.
• No filler. No "Great question!"
• Use bullets (•) for lists, bold (**text**) for emphasis.

═══════════════════════════════════════════════════════════════════
LANGUAGE
═══════════════════════════════════════════════════════════════════
Detect English, Amharic script, or Amharic transliteration. Reply in the same language.

═══════════════════════════════════════════════════════════════════
SELF-CHECK BEFORE SENDING
═══════════════════════════════════════════════════════════════════
Silently ask: "Did I use [STUDENT CONTEXT] if it was provided?"
If no, revise.

Be the academic advisor every student wishes they had."""


@api_view(["POST"])
@_perm_classes([permissions.AllowAny])
def ai_chat(request):
    message = (request.data.get("message") or "").strip()
    if not message:
        return Response({"error": "message required"}, status=status.HTTP_400_BAD_REQUEST)

    history = request.data.get("history") or []
    print(f"[ai_chat] message length = {len(message)}")
    print(f"[ai_chat] has [STUDENT CONTEXT] = {'[STUDENT CONTEXT]' in message}")
    print(f"[ai_chat] has [UPLOADED MATERIAL] = {'[UPLOADED MATERIAL]' in message}")
    print(f"[ai_chat] first 300 chars: {message[:300]!r}")
    has_student_context = "[STUDENT CONTEXT]" in message

    if not has_student_context:
        if message.lower() in _GREETINGS:
            return Response({"reply": _GREETING_REPLY, "source": "offline_greeting"})
        if message.lower() in _SHORT_MESSAGES:
            return Response({"reply": _CLARIFICATION_REPLY, "source": "offline"})

        offline = _lookup_local_kb(message)
        if offline:
            return Response({"reply": offline, "source": "offline"})
    try:
        client = _get_groq_client()
    except RuntimeError as e:
        return Response(
            {"reply": _generic_offline_reply(message), "source": "offline_no_key", "error": str(e)},
            status=status.HTTP_200_OK,
        )

    groq_messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for turn in history[-10:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            groq_messages.append({"role": role, "content": content})

    if has_student_context:
        groq_messages.append({"role": "user", "content": message})
    else:
        context_message = f"""<context>
{_MAU_KNOWLEDGE}
</context>

Question: {message}"""
        groq_messages.append({"role": "user", "content": context_message})

    models_to_try = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
    ]

    last_error = None
    for model_name in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=groq_messages,
                temperature=0.5,
                max_tokens=900,
            )
            return Response({"reply": completion.choices[0].message.content, "source": "groq"})
        except Exception as e:
            print(f"[ai_chat] Groq failed on {model_name}: {type(e).__name__}: {e}")
            last_error = f"{model_name}: {e}"
            continue

    return Response(
        {
            "reply": _generic_offline_reply(message),
            "source": "offline_fallback",
            "error": last_error,
        },
        status=status.HTTP_200_OK,
    )


# ---------- EXAM MONITORING EVENT ----------
import rest_framework.serializers as drf_serializers


class ExamMonitoringEventViewSet(viewsets.ModelViewSet):
    queryset = ExamMonitoringEvent.objects.all()
    serializer_class = ExamMonitoringEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return ExamMonitoringEvent.objects.filter(attempt__student=user)
        return ExamMonitoringEvent.objects.all()

    def perform_create(self, serializer):
        attempt = serializer.validated_data.get('attempt')
        if not attempt:
            raise drf_serializers.ValidationError({"attempt": "Attempt ID is required."})
        if self.request.user.role == 'STUDENT' and attempt.student != self.request.user:
            raise permissions.PermissionDenied("You can only log events for your own exam attempts.")
        serializer.save()

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def review(self, request, pk=None):
        event = self.get_object()

        if request.user.role == 'STUDENT':
            return Response({'error': 'Only instructors can review events.'}, status=status.HTTP_403_FORBIDDEN)

        event.review_status = request.data.get('review_status', event.review_status)
        event.is_resolved = request.data.get('is_resolved', event.is_resolved)
        event.instructor_notes = request.data.get('instructor_notes', event.instructor_notes)
        event.reviewed_by = request.user
        event.save()

        return Response(self.get_serializer(event).data)


# ✅ NEW: EXAM MONITORING SETTINGS
class ExamMonitoringSettingViewSet(viewsets.ModelViewSet):
    queryset = ExamMonitoringSetting.objects.all()
    serializer_class = ExamMonitoringSettingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return ExamMonitoringSetting.objects.all()
        if user.role == 'INSTRUCTOR':
            return ExamMonitoringSetting.objects.filter(exam__course__instructor=user)
        return ExamMonitoringSetting.objects.all()

    def create(self, request, *args, **kwargs):
        if request.user.role == 'STUDENT':
            return Response({'error': 'Students cannot modify settings.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role == 'STUDENT':
            return Response({'error': 'Students cannot modify settings.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)


# ---------- FACE VERIFICATION ----------
class FaceVerificationViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def request_token(self, request):
        if request.user.role != 'STUDENT':
            return Response({'error': 'Only students can verify.'}, status=status.HTTP_403_FORBIDDEN)

        exam_id = request.data.get('exam_id')
        if not exam_id:
            return Response({'error': 'exam_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found.'}, status=status.HTTP_404_NOT_FOUND)

        token_str = str(uuid.uuid4())
        expires_at = timezone.now() + timedelta(minutes=10)

        FaceVerificationToken.objects.create(
            student=request.user,
            exam=exam,
            token=token_str,
            expires_at=expires_at,
        )

        return Response({
            'token': token_str,
            'expires_at': expires_at,
            'message': 'Verification token issued. You may now start the exam.'
        })


# ============================================================================
# VOICE AI — Speech-to-Text + Text-to-Speech (server-side Groq key)
# ============================================================================
from django.http import HttpResponse


@api_view(["POST"])
@_perm_classes([permissions.AllowAny])
def ai_transcribe(request):
    audio_file = request.FILES.get("file")
    if not audio_file:
        return Response(
            {"error": "No audio file uploaded."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if audio_file.size > 25 * 1024 * 1024:
        return Response(
            {"error": "Audio file too large (max 25 MB)."},
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )

    language = (request.data.get("language") or "en").strip()
    model = (request.data.get("model") or "whisper-large-v3-turbo").strip()

    api_key = _os.environ.get("GROQ_API_KEY")
    if not api_key:
        return Response(
            {"error": "Server is missing GROQ_API_KEY."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        files = {
            "file": (
                audio_file.name or "audio.webm",
                audio_file.read(),
                audio_file.content_type or "audio/webm",
            )
        }
        data = {"model": model, "language": language, "response_format": "json"}
        with httpx.Client(timeout=60.0) as client:
            r = client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {api_key}"},
                files=files,
                data=data,
            )
        if r.status_code != 200:
            print(f"[ai_transcribe] Groq {r.status_code}: {r.text[:200]}")
            return Response(
                {"error": f"Groq STT failed ({r.status_code})."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"text": (r.json().get("text") or "").strip()})
    except Exception as e:
        print(f"[ai_transcribe] Exception: {type(e).__name__}: {e}")
        return Response(
            {"error": "Speech-to-text service unavailable."},
            status=status.HTTP_502_BAD_GATEWAY,
        )


@api_view(["POST"])
@_perm_classes([permissions.AllowAny])
def ai_speak(request):
    text = (request.data.get("text") or "").strip()
    if not text:
        return Response(
            {"error": "text required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(text) > 200:
        text = text[:200]

    voice = (request.data.get("voice") or "troy").strip()
    model = (request.data.get("model") or "canopylabs/orpheus-v1-english").strip()

    api_key = _os.environ.get("GROQ_API_KEY")
    if not api_key:
        return Response(
            {"error": "Server is missing GROQ_API_KEY."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        with httpx.Client(timeout=60.0) as client:
            r = client.post(
                "https://api.groq.com/openai/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "input": text,
                    "voice": voice,
                    "response_format": "wav",
                },
            )
        if r.status_code != 200:
            print(f"[ai_speak] Groq {r.status_code}: {r.text[:200]}")
            return Response(
                {"error": f"Groq TTS failed ({r.status_code})."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return HttpResponse(r.content, content_type="audio/wav")
    except Exception as e:
        print(f"[ai_speak] Exception: {type(e).__name__}: {e}")
        return Response(
            {"error": "Text-to-speech service unavailable."},
            status=status.HTTP_502_BAD_GATEWAY,
        )


# ---------- DORMITORY MANAGEMENT ----------
DORM_MANAGER_ROLES = ('ADMIN', 'REGISTRAR')


def _is_dorm_manager(user):
    return getattr(user, 'role', None) in DORM_MANAGER_ROLES


def _sync_block_total_rooms(block_id):
    if not block_id:
        return
    block = DormBlock.objects.filter(pk=block_id).first()
    if block is None:
        return
    block.total_rooms = block.rooms.count()
    block.save(update_fields=['total_rooms'])


class DormBlockViewSet(BaseViewSet):
    queryset = DormBlock.objects.all().order_by('block_name')
    serializer_class = DormBlockSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'stats'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsDormManager()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def stats(self, request):
        rooms = list(DormRoom.objects.select_related('block').all())
        blocks = list(DormBlock.objects.all().order_by('block_name'))

        total_beds = sum(room.capacity for room in rooms)
        occupied_beds = sum(room.current_occupants_count for room in rooms)
        available_beds = max(0, total_beds - occupied_beds)
        occupancy_rate = round((occupied_beds / total_beds) * 100, 1) if total_beds else 0.0

        by_block = []
        for block in blocks:
            block_rooms = [room for room in rooms if room.block_id == block.id]
            beds = sum(room.capacity for room in block_rooms)
            occupied = sum(room.current_occupants_count for room in block_rooms)
            by_block.append({
                'id': block.id,
                'block_name': block.block_name,
                'gender_type': block.gender_type,
                'total_rooms': len(block_rooms),
                'available_rooms': len([r for r in block_rooms if r.is_available]),
                'total_beds': beds,
                'occupied_beds': occupied,
                'available_beds': max(0, beds - occupied),
                'occupancy_rate': round((occupied / beds) * 100, 1) if beds else 0.0,
            })

        return Response({
            'total_blocks': len(blocks),
            'total_rooms': len(rooms),
            'total_beds': total_beds,
            'occupied_beds': occupied_beds,
            'available_beds': available_beds,
            'occupancy_rate': occupancy_rate,
            'active_assignments': DormAssignment.objects.filter(status='ACTIVE').count(),
            'open_maintenance': DormMaintenanceRequest.objects.exclude(status='RESOLVED').count(),
            'pending_maintenance': DormMaintenanceRequest.objects.filter(status='PENDING').count(),
            'by_block': by_block,
        })


class DormRoomViewSet(BaseViewSet):
    queryset = DormRoom.objects.select_related('block').all().order_by('block__block_name', 'room_number')
    serializer_class = DormRoomSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'available_rooms'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsDormManager()]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='available-rooms')
    def available_rooms(self, request):
        rooms = (
            DormRoom.objects.filter(is_available=True, current_occupants_count__lt=F('capacity'))
            .select_related('block')
            .order_by('block__block_name', 'room_number')
        )
        return Response(self.get_serializer(rooms, many=True).data)

    def perform_create(self, serializer):
        room = serializer.save()
        _sync_block_total_rooms(room.block_id)

    def perform_update(self, serializer):
        previous_block_id = serializer.instance.block_id
        room = serializer.save()
        _sync_block_total_rooms(previous_block_id)
        _sync_block_total_rooms(room.block_id)

    def perform_destroy(self, instance):
        block_id = instance.block_id
        instance.delete()
        _sync_block_total_rooms(block_id)


class DormAssignmentViewSet(BaseViewSet):
    serializer_class = DormAssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = DormAssignment.objects.select_related('student', 'room__block').order_by('-assigned_date')
        if not user.is_authenticated:
            return qs.none()
        if user.role == 'STUDENT':
            return qs.filter(student=user)
        if _is_dorm_manager(user):
            return qs
        return qs.none()

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'my_assignment', 'assign_room'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsDormManager()]

    @action(detail=False, methods=['get'], url_path='my-assignment')
    def my_assignment(self, request):
        assignment = (
            DormAssignment.objects
            .select_related('room__block')
            .filter(student=request.user, status='ACTIVE')
            .order_by('-assigned_date')
            .first()
        )
        if assignment is None:
            return Response(None)
        return Response(self.get_serializer(assignment).data)

    @action(detail=False, methods=['post'], url_path='assign-room')
    def assign_room(self, request):
        if request.user.role not in ('STUDENT',) and not _is_dorm_manager(request.user):
            return Response(
                {'error': 'Only students and dormitory administrators can assign rooms.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = {
            'student': request.user.id if request.user.role == 'STUDENT' else request.data.get('student'),
            'room': request.data.get('room'),
        }
        if request.data.get('assigned_date'):
            payload['assigned_date'] = request.data.get('assigned_date')
        if request.data.get('academic_year'):
            payload['academic_year'] = request.data.get('academic_year')

        serializer = self.get_serializer(data=payload)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        student = serializer.validated_data.get('student')
        room = serializer.validated_data.get('room')
        if student is None:
            return Response({'error': 'A student is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if getattr(student, 'role', None) != 'STUDENT':
            return Response({'error': 'Selected user is not a student.'}, status=status.HTTP_400_BAD_REQUEST)

        assigned_date = serializer.validated_data.get('assigned_date') or timezone.localdate()
        academic_year = serializer.validated_data.get('academic_year') or (
            f"{timezone.now().year}/{timezone.now().year + 1}"
        )

        from django.db import transaction

        with transaction.atomic():
            room = DormRoom.objects.select_for_update().select_related('block').get(pk=room.pk)
            existing = (
                DormAssignment.objects
                .select_for_update()
                .filter(student=student, status='ACTIVE')
                .first()
            )

            if existing and existing.room_id == room.id:
                return Response(self.get_serializer(existing).data, status=status.HTTP_200_OK)

            active_count = (
                DormAssignment.objects
                .filter(room=room, status='ACTIVE')
                .exclude(pk=existing.pk if existing else None)
                .count()
            )
            if active_count >= room.capacity or not room.is_available:
                return Response(
                    {'error': 'This room is already full. Choose another available room.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            created = existing is None
            if existing:
                existing.room = room
                existing.assigned_date = assigned_date
                existing.academic_year = academic_year
                existing.save()
                assignment = existing
            else:
                assignment = DormAssignment.objects.create(
                    student=student,
                    student_name=getattr(student, 'full_name', None) or student.username,
                    room=room,
                    assigned_date=assigned_date,
                    academic_year=academic_year,
                )

        return Response(
            self.get_serializer(assignment).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='terminate')
    def terminate(self, request, pk=None):
        assignment = self.get_object()
        if assignment.status == 'TERMINATED':
            return Response(self.get_serializer(assignment).data)
        assignment.status = 'TERMINATED'
        assignment.save(update_fields=['status'])
        return Response(self.get_serializer(assignment).data)


class DormMaintenanceRequestViewSet(BaseViewSet):
    serializer_class = DormMaintenanceRequestSerializer

    def get_queryset(self):
        user = self.request.user
        qs = DormMaintenanceRequest.objects.select_related('room__block', 'reported_by').order_by('-created_at')
        if not user.is_authenticated:
            return qs.none()
        if user.role == 'STUDENT':
            return qs.filter(reported_by=user)
        if _is_dorm_manager(user):
            return qs
        return qs.none()

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'create'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsDormManager()]

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)


# =====================================================================
# MATERIAL MANAGEMENT SYSTEM (MMS) VIEWSETS
# =====================================================================

class MaterialInventoryItemViewSet(BaseViewSet):
    queryset = MaterialInventoryItem.objects.all().order_by('-id')
    serializer_class = MaterialInventoryItemSerializer

    def perform_create(self, serializer):
        item = serializer.save()
        # Re-derive totals server-side; ignore any client-supplied values.
        item.total_value_etb = (item.quantity_in_stock or 0) * (item.unit_cost_etb or 0)
        if item.quantity_in_stock <= 0:
            item.status = 'OUT_OF_STOCK'
        elif item.quantity_in_stock <= (item.min_threshold or 0):
            item.status = 'LOW_STOCK'
        else:
            item.status = 'IN_STOCK'
        item.last_restocked = timezone.localdate()
        item.save(update_fields=['total_value_etb', 'status', 'last_restocked'])

    @action(detail=True, methods=['post'], url_path='adjust-stock')
    def adjust_stock(self, request, pk=None):
        item = self.get_object()
        try:
            delta = int(request.data.get('delta', 0))
        except (TypeError, ValueError):
            return Response({'error': 'delta must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)
        if delta == 0:
            return Response({'error': 'delta cannot be zero.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = (request.data.get('reason') or 'Manual adjustment')[:255]
        performed_by = request.data.get('performed_by') or request.user.full_name

        new_qty = max(0, (item.quantity_in_stock or 0) + delta)
        item.quantity_in_stock = new_qty
        item.total_value_etb = new_qty * (item.unit_cost_etb or 0)
        if new_qty == 0:
            item.status = 'OUT_OF_STOCK'
        elif new_qty <= (item.min_threshold or 0):
            item.status = 'LOW_STOCK'
        else:
            item.status = 'IN_STOCK'
        item.save()

        # Append a bin-card ledger entry so the digital ledger stays accurate.
        try:
            prev = (
                StockBinCardEntry.objects
                .filter(item=item)
                .order_by('-timestamp')
                .first()
            )
            prev_balance = prev.balance_stock if prev else (new_qty - delta)
            StockBinCardEntry.objects.create(
                item=item,
                item_code=item.item_code,
                item_name=item.name,
                voucher_type='AUDIT_ADJUSTMENT',
                voucher_number=f"ADJ-{int(timezone.now().timestamp())}",
                warehouse_location=item.warehouse_location,
                quantity_in=max(0, delta),
                quantity_out=max(0, -delta),
                balance_stock=prev_balance + delta,
                performed_by=performed_by,
                remarks=reason,
            )
        except Exception as e:
            print(f"❌ [adjust_stock] bin-card log failed: {e}")

        return Response(self.get_serializer(item).data)


class MaterialRequisitionViewSet(BaseViewSet):
    queryset = MaterialRequisition.objects.all().order_by('-id')
    serializer_class = MaterialRequisitionSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        items_data = data.pop('items', [])

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            requisition = serializer.save()
            for item_data in items_data:
                RequisitionItem.objects.create(requisition=requisition, **item_data)
            return Response(self.get_serializer(requisition).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FixedAssetItemViewSet(BaseViewSet):
    queryset = FixedAssetItem.objects.all().order_by('-id')
    serializer_class = FixedAssetItemSerializer


class GoodsReceivingRecordViewSet(BaseViewSet):
    queryset = GoodsReceivingRecord.objects.all().order_by('-id')
    serializer_class = GoodsReceivingRecordSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        items_data = data.pop('items', [])

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            record = serializer.save()
            for item_data in items_data:
                GoodsReceivingItem.objects.create(grn=record, **item_data)
            return Response(self.get_serializer(record).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UniversityVendorViewSet(BaseViewSet):
    queryset = UniversityVendor.objects.all().order_by('-id')
    serializer_class = UniversityVendorSerializer


class PurchaseOrderViewSet(BaseViewSet):
    queryset = PurchaseOrder.objects.all().order_by('-id')
    serializer_class = PurchaseOrderSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        items_data = data.pop('items', [])

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            po = serializer.save()
            for item_data in items_data:
                PurchaseOrderItem.objects.create(po=po, **item_data)
            return Response(self.get_serializer(po).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AssetDisposalRecordViewSet(BaseViewSet):
    queryset = AssetDisposalRecord.objects.all().order_by('-id')
    serializer_class = AssetDisposalRecordSerializer


class HazardousMaterialRecordViewSet(BaseViewSet):
    queryset = HazardousMaterialRecord.objects.all().order_by('-id')
    serializer_class = HazardousMaterialRecordSerializer


class StockBinCardEntryViewSet(BaseViewSet):
    queryset = StockBinCardEntry.objects.all().order_by('-timestamp')
    serializer_class = StockBinCardEntrySerializer


class DepartmentStoreBudgetViewSet(BaseViewSet):
    queryset = DepartmentStoreBudget.objects.all().order_by('-id')
    serializer_class = DepartmentStoreBudgetSerializer


class DonationGrantAssetViewSet(BaseViewSet):
    queryset = DonationGrantAsset.objects.all().order_by('-id')
    serializer_class = DonationGrantAssetSerializer


class InterStoreTransferRecordViewSet(BaseViewSet):
    queryset = InterStoreTransferRecord.objects.all().order_by('-id')
    serializer_class = InterStoreTransferRecordSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        items_data = data.pop('items', [])

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            transfer = serializer.save()
            for item_data in items_data:
                InterStoreTransferItem.objects.create(transfer=transfer, **item_data)
            return Response(self.get_serializer(transfer).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PropertyReturnRecordViewSet(BaseViewSet):
    queryset = PropertyReturnRecord.objects.all().order_by('-id')
    serializer_class = PropertyReturnRecordSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        items_data = data.pop('items', [])

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            record = serializer.save()
            for item_data in items_data:
                PropertyReturnItem.objects.create(return_record=record, **item_data)
            return Response(self.get_serializer(record).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CampusGatePassRecordViewSet(BaseViewSet):
    queryset = CampusGatePassRecord.objects.all().order_by('-id')
    serializer_class = CampusGatePassRecordSerializer


class MaintenanceWorkOrderViewSet(BaseViewSet):
    queryset = MaintenanceWorkOrder.objects.all().order_by('-id')
    serializer_class = MaintenanceWorkOrderSerializer


class PhysicalAuditEntryViewSet(BaseViewSet):
    queryset = PhysicalAuditEntry.objects.all().order_by('-id')
    serializer_class = PhysicalAuditEntrySerializer


# =====================================================================
# HARDWARE & IOT VIEWSETS
# =====================================================================

class SmartIoTDeviceViewSet(BaseViewSet):
    queryset = SmartIoTDevice.objects.all().order_by('-id')
    serializer_class = SmartIoTDeviceSerializer

    @action(detail=True, methods=['post'])
    def toggle_relay(self, request, pk=None):
        device = self.get_object()
        new_state = request.data.get('relayState')
        if new_state:
            device.relayState = new_state
            device.save()
            return Response({'status': 'Relay updated', 'relayState': new_state})
        return Response({'error': 'relayState required'}, status=status.HTTP_400_BAD_REQUEST)


class SecurityCameraFeedViewSet(BaseViewSet):
    queryset = SecurityCameraFeed.objects.all().order_by('-id')
    serializer_class = SecurityCameraFeedSerializer


class BiometricAttendanceEventViewSet(BaseViewSet):
    queryset = BiometricAttendanceEvent.objects.all().order_by('-timestamp')
    serializer_class = BiometricAttendanceEventSerializer


class IoTHardwareAlertViewSet(BaseViewSet):
    queryset = IoTHardwareAlert.objects.all().order_by('-timestamp')
    serializer_class = IoTHardwareAlertSerializer

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        alert.isAcknowledged = True
        alert.acknowledgedBy = request.user.full_name
        alert.save()
        return Response({'status': 'Alert acknowledged'})
