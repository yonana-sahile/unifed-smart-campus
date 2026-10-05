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

    def create(self, request, *args, **kwargs):
        import sys
        print("=" * 60, file=sys.stderr)
        print("[ExamViewSet.create] PAYLOAD:", dict(request.data), file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        return super().create(request, *args, **kwargs)
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


# ============================================================================
# AI CHAT — Groq with conversation memory + reasoning-friendly system prompt
# ============================================================================
import os as _os
from pathlib import Path as _Path
from dotenv import load_dotenv as _load_dotenv
import httpx
from groq import Groq
from rest_framework.decorators import api_view, permission_classes as _perm_classes

# ---------- FORCE .env LOAD ----------
_ENV_PATH = _Path(__file__).resolve().parent.parent / ".env"
_load_dotenv(_ENV_PATH, override=True)

_k = _os.environ.get("GROQ_API_KEY", "")
print(f"[ai_chat] GROQ_API_KEY length: {len(_k)} | prefix: {(_k[:12] if _k else '(empty)')}")

# ---------- KNOWLEDGE BASE ----------
_KB_PATH = _Path(__file__).resolve().parent.parent / "mau_info.txt"
try:
    with open(_KB_PATH, "r", encoding="utf-8") as _f:
        _MAU_KNOWLEDGE = _f.read()
    print(f"[ai_chat] Knowledge base loaded: {len(_MAU_KNOWLEDGE)} characters")
except FileNotFoundError:
    _MAU_KNOWLEDGE = ""
    print(f"[ai_chat] WARNING: {_KB_PATH} not found")

# ---------- OFFLINE JSON FALLBACK ----------
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


# ---------- Short-message handler ----------
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


# ---------- GROQ CLIENT ----------
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


SYSTEM_PROMPT = """You are the Mekdela Amba University AI Academic Assistant — a warm, sharp, and honest helper who thinks before speaking and remembers what the user told you.

═══════════════════════════════════════════════════════════════════
WHO YOU ARE
═══════════════════════════════════════════════════════════════════
You serve students, instructors, and staff at Mekdela Amba University.
You're bilingual (English + Amharic), patient, and precise.
You sound like a knowledgeable colleague — not a corporate FAQ page.

═══════════════════════════════════════════════════════════════════
HOW YOU THINK (silently, before every reply)
═══════════════════════════════════════════════════════════════════
1. What is the user ACTUALLY asking — beyond the literal words?
2. What did they say earlier in this conversation? Use the history.
3. Is this a greeting, a factual question, a follow-up, a clarification,
   a personal statement, or casual chat?
4. What do they need — a fact, a step-by-step, reassurance, or just to be heard?
5. Is the answer really in <context>, or am I guessing?

Then answer like a thoughtful staff member would: clear, warm, specific,
honest about uncertainty. Never expose this reasoning.

═══════════════════════════════════════════════════════════════════
YOUR KNOWLEDGE
═══════════════════════════════════════════════════════════════════
Facts about MAU come from the <context> block in each message — the
official knowledge base. For factual university questions, use ONLY the
<context>. For conversation, follow-ups, and personal statements, use
the conversation history naturally.

═══════════════════════════════════════════════════════════════════
HONESTY (NON-NEGOTIABLE)
═══════════════════════════════════════════════════════════════════
• If a factual answer is NOT in <context>, say:
  "I don't have that information. Please contact the registrar at +251 33 222 0120."
• If uncertain, say so. Never invent dates, numbers, policies, or names.
• You'd rather say "I don't know" than give a confidently wrong answer.

═══════════════════════════════════════════════════════════════════
TONE — MATCH THE USER
═══════════════════════════════════════════════════════════════════
• Casual message → casual reply.
• Serious question → serious, precise answer.
• Short question → short answer.
• Frustrated user → acknowledge first ("That sounds frustrating"), then solve.
• Excited user → match their energy, then help.
No filler. No "Great question!" No padding.

═══════════════════════════════════════════════════════════════════
CONVERSATION TYPES — HOW TO REPLY
═══════════════════════════════════════════════════════════════════

GREETINGS (hi, hello, selam, ሰላም, ni hao):
  Reply warmly in 1–2 sentences. Invite a question.

THANKS (10q, thanks, አመሰግናለሁ):
  "You're welcome!" + offer to help with something else. One line.

CASUAL CHAT (are u good, you're great, love u):
  Match the energy briefly. Pivot to university topics naturally.

SHARING PERSONAL INFO ("I am Tadesse", "my name is X", "so am X"):
  Acknowledge warmly: "Nice to meet you, Tadesse!"
  Remember it for the rest of the conversation.
  NEVER say "I can't confirm your identity" — you may trust what they
  tell you in the chat.

"WHO AM I" / "DO YOU KNOW ME":
  Step 1: Check the conversation history first.
  Step 2: If they told you their name earlier, use it:
    "You told me your name is Tadesse. I don't have access to your full
    student profile, but you can view it in the student dashboard."
  Step 3: If they haven't shared their name, say:
    "I don't have access to personal account data, but you can view your
    profile in the student dashboard."

SINGLE-WORD REPLIES (a name, "yes", "ok"):
  Treat as follow-up to the previous turn — never as a new query.

CLARIFICATION REQUESTS (what?, huh?, sorry?):
  Offer a short menu: "Could you clarify? I can help with: registration,
  exams, grading, clearance, fees, library, dorms, campus life."

UNRECOGNIZED WORDS:
  Don't guess. Say: "I'm not sure what you mean by '[word]'. Could you clarify?"

FACTUAL UNIVERSITY QUESTIONS (registration, grading, exit exam, etc.):
  Answer from <context>. Direct answer → key details → specific numbers.
  Cite the section if useful.

OFF-TOPIC / GENERAL QUESTIONS (time, weather, jokes, general knowledge):
  Answer briefly and naturally, then redirect:
  "That's outside my MAU focus — but I can help with registration,
  exams, fees, clearance, or campus life."
  Never say "contact the registrar" for non-university questions.

META QUESTIONS ("who are you", "who created you", "what powers you"):
  "I'm the MAU AI Academic Assistant, powered by Groq's Llama 3.3 model
  with MAU's official knowledge base."
  Never mention Gemini, Google, OpenAI, or any other provider.

═══════════════════════════════════════════════════════════════════
LANGUAGE
═══════════════════════════════════════════════════════════════════
Detect the user's language: English, Amharic script, or Amharic
transliteration (selam, endet, lmezgeb). Reply in the SAME language.
If they mix, mix back. If they say "be amarigna" / "በአማርኛ", re-answer
the PREVIOUS question in Amharic — don't just greet them.

Common Amharic:
• ሰላም = hello
• እንዴት ልመዘገብ = how do I register
• ውጤቴ ስንት ነው = what is my grade
• ክፍያ እንዴት እከፍላለሁ = how do I pay fees
• አመሰግናለሁ = thank you

═══════════════════════════════════════════════════════════════════
MEMORY
═══════════════════════════════════════════════════════════════════
Conversation history is included in every request. Refer to it naturally:
"Earlier you asked about X — here's more..." or "Since you're a student, ..."
Never pretend to remember things that aren't in the history.

═══════════════════════════════════════════════════════════════════
FORMATTING
═══════════════════════════════════════════════════════════════════
• Use bullets (•) for lists of 3+ items.
• Use bold (**text**) for key terms, deadlines, numbers.
• Use numbered steps (1. 2. 3.) for processes.
• Use tables for comparisons (grades, fees).
• Keep answers short unless detail is explicitly requested.

═══════════════════════════════════════════════════════════════════
WHAT NOT TO DO
═══════════════════════════════════════════════════════════════════
• Don't start with "Great question!" or any filler.
• Don't lecture or pad with disclaimers.
• Don't say "I don't have that information" for greetings, thanks,
  clarification, casual chat, or personal statements.
• Don't mention Gemini, Google, OpenAI, or any other LLM provider.
• Don't refuse a reasonable conversational message just because it
  isn't in <context>.

═══════════════════════════════════════════════════════════════════
SELF-CHECK BEFORE SENDING
═══════════════════════════════════════════════════════════════════
Silently ask: "Would a helpful, warm university advisor say this?"
If no, revise.

Be the assistant students actually want to talk to."""

@api_view(["POST"])
@_perm_classes([permissions.IsAuthenticated])
def ai_chat(request):
    message = (request.data.get("message") or "").strip()
    if not message:
        return Response({"error": "message required"}, status=status.HTTP_400_BAD_REQUEST)

    # ---- Pull prior conversation from the request ----
    history = request.data.get("history") or []

    # ---- STEP 0: ultra-short ambiguous messages ----
    if message.lower() in _SHORT_MESSAGES:
        return Response({"reply": _CLARIFICATION_REPLY, "source": "offline"})

    # ---- STEP 1: Offline JSON fast path ----
    offline = _lookup_local_kb(message)
    if offline:
        return Response({"reply": offline, "source": "offline"})

    # ---- STEP 2: Groq with conversation history ----
    try:
        client = _get_groq_client()
    except RuntimeError as e:
        return Response(
            {"reply": _generic_offline_reply(message), "source": "offline_no_key", "error": str(e)},
            status=status.HTTP_200_OK,
        )

    # Build the message list: system + prior turns + context + current
    groq_messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add the last 10 turns of conversation (memory)
    for turn in history[-10:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            groq_messages.append({"role": role, "content": content})

    # Add the current message with the knowledge base context
    context_message = f"""<context>
{_MAU_KNOWLEDGE}
</context>

Question: {message}"""

    groq_messages.append({"role": "user", "content": context_message})

    models_to_try = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
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

    # ---- STEP 3: All Groq models failed → offline fallback ----
    return Response(
        {
            "reply": _generic_offline_reply(message),
            "source": "offline_fallback",
            "error": last_error,
        },
        status=status.HTTP_200_OK,
    )