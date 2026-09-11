from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Avg, Count
from django.utils import timezone
from .models import *
from .serializers import *
from .permissions import *
import json
import random
import string


# ---------- AUTH ----------
class AuthViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
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
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save()


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


# ---------- COURSE ----------
class CourseViewSet(BaseViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        course = self.get_object()
        student = request.user

        if student.role != 'STUDENT':
            return Response({'error': 'Only students can enroll'}, status=status.HTTP_403_FORBIDDEN)

        if course.enrolled_students_count >= course.capacity:
            return Response({'error': 'Course is full'}, status=status.HTTP_400_BAD_REQUEST)

        course.enrolled_students_count += 1
        course.save()

        return Response({'message': 'Enrolled successfully'})


# ---------- COURSE MATERIAL ----------
class CourseMaterialViewSet(BaseViewSet):
    queryset = CourseMaterial.objects.all().order_by('-uploaded_at')
    serializer_class = CourseMaterialSerializer


# ---------- ANNOUNCEMENT ----------
class AnnouncementViewSet(BaseViewSet):
    queryset = Announcement.objects.all().order_by('-posted_at')
    serializer_class = AnnouncementSerializer


# ---------- ASSIGNMENT ----------
class AssignmentViewSet(BaseViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer


# ---------- SUBMISSION ----------
class SubmissionViewSet(BaseViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer


# ---------- QUESTION ----------
class QuestionViewSet(BaseViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer


# ---------- EXAM ----------
class ExamViewSet(BaseViewSet):
    queryset = Exam.objects.all().order_by('-created_at')
    serializer_class = ExamSerializer

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

    # ✅ NEW: Dedicated push action for the instructor push portal.
    # Accepts { is_pushed: true/false } and flips the exam's status between
    # DRAFT and ACTIVE, recording the push timestamp.
    # The frontend calls POST /exams/{id}/push/ instead of PATCHing the
    # full exam object, which is cleaner and avoids the 405 bulk-PUT trap.
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
    queryset = ExamAttempt.objects.all().order_by('-submitted_at')
    serializer_class = ExamAttemptSerializer


# ---------- GRADE ----------
class GradeViewSet(BaseViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        grade = self.get_object()
        grade.status = 'APPROVED'
        grade.save()
        return Response({'message': 'Grade approved'})


# ---------- TRANSCRIPT ----------
class TranscriptViewSet(BaseViewSet):
    queryset = Transcript.objects.all()
    serializer_class = TranscriptSerializer


# ---------- ATTENDANCE RECORD ----------
class AttendanceRecordViewSet(BaseViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer


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
        student_id = request.data.get('student_id')
        try:
            student = User.objects.get(id=student_id, role='STUDENT')
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        attendance = AttendanceRecord.objects.filter(student=student)
        avg_attendance = attendance.aggregate(Avg('attendance_percentage'))['attendance_percentage__avg'] or 0

        grades = Grade.objects.filter(student=student)
        avg_grade = grades.aggregate(Avg('total_grade'))['total_grade__avg'] or 0

        dropout_probability = 0.0
        if avg_attendance < 80:
            dropout_probability += 0.3
        if avg_grade < 60:
            dropout_probability += 0.4
        if student.outstanding_fees > 5000:
            dropout_probability += 0.2

        classification = 'NOT_AT_RISK'
        if dropout_probability > 0.5:
            classification = 'HIGH_RISK'
        elif dropout_probability > 0.3:
            classification = 'MODERATE_RISK'

        return Response({
            'student_id': student.id,
            'student_name': student.full_name,
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

        return Response({
            'success': True,
            'questions': questions
        })
