from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Avg, Count
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import *
from .serializers import *
from .permissions import *
import json
import random
import string
import uuid
from datetime import timedelta

# ---------- AUTH ----------
class AuthViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        # ✅ FIX: Find the user regardless of uppercase/lowercase, or by email
        from django.db.models import Q
        from django.contrib.auth import get_user_model
        User = get_user_model()

        user_obj = User.objects.filter(
            Q(username__iexact=username) | Q(email__iexact=username)
        ).first()

        user = None
        if user_obj:
            # Authenticate using the EXACT username from the database
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


# ✅ NEW: derive course IDs a student is enrolled in (no Enrollment model exists)
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

    # ✅ NEW: Endpoint for uploading the student's verification photo
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_avatar(self, request, pk=None):
        user = self.get_object()
        
        # Security: Users can only update their own avatar
        if str(request.user.id) != str(user.id) and request.user.role not in ['ADMIN', 'REGISTRAR']:
            return Response({'error': 'You can only update your own profile photo.'}, status=status.HTTP_403_FORBIDDEN)

        # The frontend sends a base64 string (data:image/jpeg;base64,...)
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
                'avatar_updated_at': user.avatar_updated_at
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 👇 NEW: Password Reset Endpoints 👇

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def request_password_reset(self, request):
        email = request.data.get('email', '').strip()
        
        if not email:
            return Response({"error": "Please provide an email address."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.filter(student_id__iexact=email).first()

        if not user:
            return Response({"error": "User with this email or Student ID not found."}, status=status.HTTP_404_NOT_FOUND)

        PasswordResetOTP.objects.filter(email=user.email).delete()
        otp = str(random.randint(100000, 999999))
        PasswordResetOTP.objects.create(email=user.email, otp_code=otp)

        try:
            send_mail(
                'Unified Smart Campus - Password Reset',
                f'Hello {user.full_name or user.username},\n\nYour password reset code is: {otp}\n\nThis code expires in 10 minutes.',
settings.EMAIL_HOST_USER,  # 👈 FROM address (Your Gmail)
                [user.email],              # 👈 TO address (The student)
                fail_silently=False,
            )
        except Exception as e:
            print(f"Email failed to send: {e}")
            return Response({"error": "Failed to send email. Please contact ICT."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        
        # ✅ NEW: Students only see courses in their department
        if user.role == 'STUDENT':
            dept = (getattr(user, 'department', None) or '').strip()
            if dept:
                return Course.objects.filter(department__iexact=dept)
            return Course.objects.all() # Show all if no department set

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

        # ✅ CHECK: Already enrolled?
        if Grade.objects.filter(student=student, course=course).exists():
            return Response({'error': 'You are already enrolled in this course.'}, status=status.HTTP_400_BAD_REQUEST)

        if course.enrolled_students_count >= course.capacity:
            return Response({'error': 'Course is full'}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ 1. Increment counter
        course.enrolled_students_count += 1
        course.save()

        # ✅ 2. Create the Grade record (the bridge)
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
            return qs.filter(course_id__in=_student_course_ids(user))
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


# ---------- FACILITY BOOKING ----------
class FacilityBookingViewSet(BaseViewSet):
    queryset = FacilityBooking.objects.all()
    serializer_class = FacilityBookingSerializer


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
        if dropout_probability > 0.5: classification = 'HIGH_RISK'
        elif dropout_probability > 0.3: classification = 'MODERATE_RISK'

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
                'questionText': f'Sample {difficulty} question on {topic} #{i+1}',
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
    template = _KB_JSON.get("fallback", "")
    if template:
        return template.replace("{query}", query)
    return (
        f"The AI service is temporarily unavailable.\n\n"
        f"Try asking about: exit exam, grading, clearance, registration, "
        f"fees, library, or dorms.\n\nRegistrar: +251 33 222 0120"
    )


_SHORT_MESSAGES = {
    "what", "huh", "sorry", "?", "??", "???", "what?", "ok", "okay", "k",
    "yes", "no", "nah", "hmm", "umm", "er",
}

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

2. When the user asks a question, you MUST:
   a) FIRST, look for the answer in [STUDENT CONTEXT].
   b) If the answer is there, use it EXACTLY. Do NOT paraphrase.
   c) If the answer is NOT in [STUDENT CONTEXT], check the <context> block (MAU knowledge base).
   d) If neither has the answer, say: "I don't have that information. Please contact the registrar at +251 33 222 0120."

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
@_perm_classes([permissions.IsAuthenticated])
def ai_chat(request):
    message = (request.data.get("message") or "").strip()
    if not message:
        return Response({"error": "message required"}, status=status.HTTP_400_BAD_REQUEST)

    history = request.data.get("history") or []

    # ✅ CRITICAL FIX: Skip offline checks if the message has student context
    has_student_context = "[STUDENT CONTEXT]" in message

    if not has_student_context:
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

    # ✅ NEW: Only instructors/admin can review events
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