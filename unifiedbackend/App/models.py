from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


# ---------- USER ----------
class User(AbstractUser):
    ROLE_CHOICES = (
        ('STUDENT', 'Student'),
        ('INSTRUCTOR', 'Instructor'),
        ('REGISTRAR', 'Registrar'),
        ('DEPARTMENT_HEAD', 'Department Head'),
        ('ADMIN', 'Admin'),
        ('DEAN', 'Dean'),
        ('AUDITOR', 'Auditor'),
        ('LIBRARY_STAFF', 'Library Staff'),
        ('FINANCE_OFFICER', 'Finance Officer'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    is_active = models.BooleanField(default=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    # Role-specific fields
    student_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    academic_year = models.IntegerField(blank=True, null=True)
    semester = models.IntegerField(blank=True, null=True)
    program = models.CharField(max_length=100, blank=True, null=True)
    gpa = models.FloatField(blank=True, null=True)
    cgpa = models.FloatField(blank=True, null=True)
    outstanding_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cost_sharing_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    instructor_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)
    office_hours = models.CharField(max_length=100, blank=True, null=True)

    staff_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    library_section = models.CharField(max_length=100, blank=True, null=True)
    officer_id = models.CharField(max_length=20, blank=True, null=True, unique=True)

    bio = models.TextField(blank=True, null=True)

    # ✅ ADD THIS PROPERTY
    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.full_name} ({self.role})"

# ---------- COURSE ----------
class Course(models.Model):
    course_code = models.CharField(max_length=20, unique=True)
    course_title = models.CharField(max_length=200)
    credit_hours = models.IntegerField()
    description = models.TextField()
    department = models.CharField(max_length=100)
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses_taught',
                                   limit_choices_to={'role__in': ['INSTRUCTOR']})
    semester = models.CharField(max_length=10)
    academic_year = models.IntegerField()
    capacity = models.IntegerField(default=40)
    enrolled_students_count = models.IntegerField(default=0)
    prerequisites = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.course_code} - {self.course_title}"


# ---------- COURSE MATERIAL ----------
class CourseMaterial(models.Model):
    FILE_TYPE_CHOICES = (
        ('PDF', 'PDF'),
        ('Video', 'Video'),
        ('Document', 'Document'),
        ('Slide', 'Slide'),
    )

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=200)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    file_url = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# ---------- ANNOUNCEMENT ----------
class Announcement(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='announcements')
    course_title = models.CharField(max_length=200)
    title = models.CharField(max_length=200)
    content = models.TextField()
    posted_by = models.CharField(max_length=100)
    posted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# ---------- ASSIGNMENT ----------
class Assignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=200)
    due_date = models.DateTimeField()
    max_score = models.IntegerField(default=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# ---------- SUBMISSION ----------
class Submission(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('GRADED', 'Graded'),
    )

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    assignment_title = models.CharField(max_length=200)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions',
                                limit_choices_to={'role': 'STUDENT'})
    student_name = models.CharField(max_length=100)
    submitted_at = models.DateTimeField(auto_now_add=True)
    file_url = models.URLField(max_length=500, blank=True, null=True)
    file_name = models.CharField(max_length=200, blank=True, null=True)
    score = models.FloatField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    def __str__(self):
        return f"{self.student_name} - {self.assignment_title}"


# ---------- QUESTION ----------
class Question(models.Model):
    QUESTION_TYPE_CHOICES = (
        ('MCQ', 'Multiple Choice'),
        ('TF', 'True/False'),
        ('short_answer', 'Short Answer'),
    )

    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    options = models.JSONField(default=list)
    correct_answer = models.CharField(max_length=500)
    marks = models.IntegerField(default=5)

    def __str__(self):
        return self.question_text[:50]


# ---------- EXAM ----------
class Exam(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('ACTIVE', 'Active'),
        ('CLOSED', 'Closed'),
        ('GRADED', 'Graded'),
        ('ARCHIVED', 'Archived'),
    )

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exams')
    course_title = models.CharField(max_length=200)
    exam_title = models.CharField(max_length=200)
    exam_date = models.DateTimeField()
    duration_minutes = models.IntegerField()
    total_marks = models.IntegerField()
    instructions = models.TextField()
    questions = models.ManyToManyField(Question, related_name='exams')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.exam_title


# ---------- EXAM ATTEMPT ----------
class ExamAttempt(models.Model):
    STATUS_CHOICES = (
        ('IN_PROGRESS', 'In Progress'),
        ('SUBMITTED', 'Submitted'),
    )

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    exam_title = models.CharField(max_length=200)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_attempts',
                                limit_choices_to={'role': 'STUDENT'})
    student_name = models.CharField(max_length=100)
    answers = models.JSONField(default=dict)
    score = models.FloatField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.student_name} - {self.exam_title}"


# ---------- GRADE ----------
class Grade(models.Model):
    STATUS_CHOICES = (
        ('CALCULATED', 'Calculated'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('RETURNED', 'Returned'),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grades',
                                limit_choices_to={'role': 'STUDENT'})
    student_name = models.CharField(max_length=100)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='grades')
    course_title = models.CharField(max_length=200)
    course_code = models.CharField(max_length=20)
    credit_hours = models.IntegerField()
    continuous_assessment_score = models.FloatField(default=0)
    mid_exam_score = models.FloatField(default=0)
    final_exam_score = models.FloatField(default=0)
    total_grade = models.FloatField(default=0)
    letter_grade = models.CharField(max_length=2, blank=True)
    grade_point = models.FloatField(default=0)
    semester = models.CharField(max_length=10)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CALCULATED')
    comments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.total_grade >= 90:
            self.letter_grade = 'A'
            self.grade_point = 4.0
        elif self.total_grade >= 80:
            self.letter_grade = 'B'
            self.grade_point = 3.0
        elif self.total_grade >= 70:
            self.letter_grade = 'C'
            self.grade_point = 2.0
        elif self.total_grade >= 60:
            self.letter_grade = 'D'
            self.grade_point = 1.0
        else:
            self.letter_grade = 'F'
            self.grade_point = 0.0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student_name} - {self.course_code}"


# ---------- TRANSCRIPT ----------
class Transcript(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transcripts',
                                limit_choices_to={'role': 'STUDENT'})
    student_name = models.CharField(max_length=100)
    generated_date = models.DateTimeField(auto_now_add=True)
    cgpa = models.FloatField()
    total_credits = models.IntegerField()
    verification_code = models.CharField(max_length=50, unique=True)
    grades = models.ManyToManyField(Grade, related_name='transcripts')
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.student_name} - {self.verification_code}"


# ---------- ATTENDANCE RECORD ----------
class AttendanceRecord(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance',
                                limit_choices_to={'role': 'STUDENT'})
    student_name = models.CharField(max_length=100)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='attendance')
    course_code = models.CharField(max_length=20)
    total_sessions = models.IntegerField(default=0)
    attended_sessions = models.IntegerField(default=0)
    attendance_percentage = models.FloatField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    meets_minimum = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.total_sessions > 0:
            self.attendance_percentage = (self.attended_sessions / self.total_sessions) * 100
            self.meets_minimum = self.attendance_percentage >= 80
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student_name} - {self.course_code}"


# ---------- INSTRUCTOR EVALUATION ----------
class InstructorEvaluation(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='evaluations',
                                limit_choices_to={'role': 'STUDENT'})
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='evaluations_received',
                                   limit_choices_to={'role': 'INSTRUCTOR'})
    instructor_name = models.CharField(max_length=100)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='evaluations')
    course_code = models.CharField(max_length=20)
    clarity = models.IntegerField(default=0)
    punctuality = models.IntegerField(default=0)
    helpfulness = models.IntegerField(default=0)
    assessment_fairness = models.IntegerField(default=0)
    overall_rating = models.FloatField(default=0)
    comments = models.TextField(blank=True, null=True)
    semester = models.CharField(max_length=10)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.overall_rating = (self.clarity + self.punctuality + self.helpfulness + self.assessment_fairness) / 4
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.username} -> {self.instructor_name}"


# ---------- COURSE OUTLINE ----------
class CourseOutlineForm(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='outlines')
    course_code = models.CharField(max_length=20)
    course_title = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    syllabus = models.TextField()
    learning_objectives = models.JSONField(default=list)
    weekly_schedule = models.JSONField(default=list)
    continuous_assessment = models.IntegerField(default=50)
    mid_exam = models.IntegerField(default=20)
    final_exam = models.IntegerField(default=30)
    approved_by_dept_head = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.course_code} - Outline"


# ---------- LIBRARY RESOURCE ----------
class LibraryResource(models.Model):
    CATEGORY_CHOICES = (
        ('Computer Science', 'Computer Science'),
        ('Software Engineering', 'Software Engineering'),
        ('Mathematics', 'Mathematics'),
        ('General Engineering', 'General Engineering'),
        ('National Curriculum', 'National Curriculum'),
    )
    RESOURCE_TYPE_CHOICES = (
        ('BOOK', 'Book'),
        ('VIDEO', 'Video'),
        ('ARTICLE', 'Article'),
        ('LECTURE_NOTE', 'Lecture Note'),
    )
    ACCESS_LEVEL_CHOICES = (
        ('PUBLIC', 'Public'),
        ('STUDENTS_ONLY', 'Students Only'),
        ('FACULTY_ONLY', 'Faculty Only'),
    )

    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=20, blank=True, null=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES)
    file_url = models.URLField(max_length=500, blank=True, null=True)
    file_size = models.CharField(max_length=50)
    downloads_count = models.IntegerField(default=0)
    access_level = models.CharField(max_length=20, choices=ACCESS_LEVEL_CHOICES, default='PUBLIC')
    uploaded_by = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField()

    def __str__(self):
        return f"{self.title} - {self.author}"


# ---------- PAYMENT TRANSACTION ----------
class PaymentTransaction(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('TELEBIRR', 'Telebirr'),
        ('CBE_BIRR', 'CBE Birr'),
        ('AWASH_BANK', 'Awash Bank'),
        ('BANK_TRANSFER', 'Bank Transfer'),
    )
    PAYMENT_TYPE_CHOICES = (
        ('TUITION', 'Tuition'),
        ('COST_SHARING', 'Cost Sharing'),
        ('DORMITORY', 'Dormitory'),
        ('ID_CARD', 'ID Card'),
        ('REGISTRATION', 'Registration'),
    )
    STATUS_CHOICES = (
        ('VERIFIED', 'Verified'),
        ('PENDING', 'Pending'),
        ('REJECTED', 'Rejected'),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments',
                                limit_choices_to={'role': 'STUDENT'})
    student_name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    reference_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    receipt_number = models.CharField(max_length=50, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    verified_by = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.student_name} - {self.amount} ETB"


# ---------- SCHOLARSHIP ----------
class Scholarship(models.Model):
    SCHOLARSHIP_TYPE_CHOICES = (
        ('MERIT_BASED', 'Merit Based'),
        ('NEED_BASED', 'Need Based'),
        ('MOE_SPECIAL_GRANT', 'MoE Special Grant'),
        ('FEMALE_INCENTIVE', 'Female Engineering Incentive'),
    )
    STATUS_CHOICES = (
        ('ISSUED', 'Issued'),
        ('APPLIED', 'Applied'),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scholarships',
                                limit_choices_to={'role': 'STUDENT'})
    student_name = models.CharField(max_length=100)
    scholarship_type = models.CharField(max_length=30, choices=SCHOLARSHIP_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    semester = models.CharField(max_length=20)
    academic_year = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    issued_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.student_name} - {self.scholarship_type}"


# ---------- MOE ADMISSION RECORD ----------
class MoEAdmissionRecord(models.Model):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
    )
    STATUS_CHOICES = (
        ('ADMITTED', 'Admitted'),
        ('VERIFIED', 'Verified'),
        ('REGISTERED', 'Registered'),
    )

    national_exam_roll = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    department_assigned = models.CharField(max_length=100)
    national_exam_score = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ADMITTED')
    batch_year = models.IntegerField()
    fayda_national_id = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return f"{self.full_name} - {self.national_exam_roll}"


# ---------- CERTIFICATE RECORD ----------
class CertificateRecord(models.Model):
    CERTIFICATE_TYPE_CHOICES = (
        ('COMPLETION', 'Completion'),
        ('ENROLLMENT', 'Enrollment'),
        ('DEAN_HONOR_ROLL', 'Dean Honor Roll'),
        ('DEGREE_ATTESTATION', 'Degree Attestation'),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates',
                                limit_choices_to={'role': 'STUDENT'})
    student_name = models.CharField(max_length=100)
    certificate_type = models.CharField(max_length=30, choices=CERTIFICATE_TYPE_CHOICES)
    issue_date = models.DateField(auto_now_add=True)
    verification_code = models.CharField(max_length=50, unique=True)
    program = models.CharField(max_length=100)
    is_issued = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.student_name} - {self.certificate_type}"


# ---------- AUDIT LOG ----------
class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='audit_logs')
    user_name = models.CharField(max_length=100)
    user_role = models.CharField(max_length=50)
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    description = models.TextField()

    def __str__(self):
        return f"{self.user_name} - {self.action}"


# ---------- SYSTEM SETTINGS ----------
class SystemSettings(models.Model):
    semester_start = models.DateField()
    semester_end = models.DateField()
    registration_deadline = models.DateField()
    exam_start = models.DateField()
    exam_end = models.DateField()
    grade_a_threshold = models.IntegerField(default=90)
    grade_b_threshold = models.IntegerField(default=80)
    grade_c_threshold = models.IntegerField(default=70)
    grade_d_threshold = models.IntegerField(default=60)
    academic_year_frozen = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"System Settings - {self.semester_start}"


# ---------- STUDENT CLEARANCE ----------
class StudentClearance(models.Model):
    REASON_CHOICES = (
        ('GRADUATION', 'Graduation'),
        ('END_OF_YEAR', 'End of Year'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('TRANSFER', 'Transfer'),
    )
    OVERALL_STATUS_CHOICES = (
        ('IN_PROGRESS', 'In Progress'),
        ('APPROVED', 'Approved'),
        ('BLOCKED', 'Blocked'),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clearances',
                                limit_choices_to={'role': 'STUDENT'})
    student_name = models.CharField(max_length=100)
    program = models.CharField(max_length=100)
    academic_year = models.IntegerField()
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    initiated_date = models.DateTimeField(auto_now_add=True)
    overall_status = models.CharField(max_length=20, choices=OVERALL_STATUS_CHOICES, default='IN_PROGRESS')
    digital_stamp_hash = models.CharField(max_length=100, blank=True, null=True)
    stages = models.JSONField(default=list)

    def __str__(self):
        return f"{self.student_name} - {self.reason}"


# ---------- FACILITY BOOKING ----------
class FacilityBooking(models.Model):
    CAMPUS_CHOICES = (
        ('Tulu Awulia (Main)', 'Tulu Awulia (Main)'),
        ('Masha Campus', 'Masha Campus'),
    )
    ROOM_TYPE_CHOICES = (
        ('LAB', 'Lab'),
        ('AUDITORIUM', 'Auditorium'),
        ('SEMINAR_ROOM', 'Seminar Room'),
        ('LIBRARY_CUBICLE', 'Library Cubicle'),
    )
    STATUS_CHOICES = (
        ('CONFIRMED', 'Confirmed'),
        ('PENDING', 'Pending'),
        ('CANCELLED', 'Cancelled'),
    )

    facility_name = models.CharField(max_length=100)
    facility_code = models.CharField(max_length=20)
    campus = models.CharField(max_length=50, choices=CAMPUS_CHOICES)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    booked_by = models.CharField(max_length=100)
    booked_by_role = models.CharField(max_length=50)
    department = models.CharField(max_length=100)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    purpose = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    capacity = models.IntegerField(default=0)
    resources_equipped = models.JSONField(default=list)

    def __str__(self):
        return f"{self.facility_name} - {self.date}"


# ---------- CAMPUS ALERT ----------
class CampusAlert(models.Model):
    CATEGORY_CHOICES = (
        ('ACADEMIC', 'Academic'),
        ('EMERGENCY', 'Emergency'),
        ('WEATHER', 'Weather'),
        ('FACILITY', 'Facility'),
        ('FINANCE', 'Finance'),
    )
    SEVERITY_CHOICES = (
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('CRITICAL', 'Critical'),
    )
    TARGET_CHOICES = (
        ('ALL', 'All'),
        ('STUDENTS', 'Students'),
        ('FACULTY', 'Faculty'),
        ('STAFF', 'Staff'),
    )

    title = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='INFO')
    target_audience = models.CharField(max_length=20, choices=TARGET_CHOICES, default='ALL')
    sender_name = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    active_until = models.DateTimeField()
    channels_sent = models.JSONField(default=list)

    def __str__(self):
        return self.title


# ---------- CAMPUS MEDIA POST ----------
class CampusMediaPost(models.Model):
    CATEGORY_CHOICES = (
        ('CAMPUS_NEWS', 'Campus News'),
        ('RESEARCH_INNOVATION', 'Research Innovation'),
        ('GRADUATION_CEREMONY', 'Graduation Ceremony'),
        ('TECH_EXPO', 'Tech Expo'),
        ('PRESIDENTIAL_ADDRESS', 'Presidential Address'),
        ('STUDENT_LIFE', 'Student Life'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    video_url = models.URLField(max_length=500)
    thumbnail_url = models.URLField(max_length=500)
    posted_by = models.CharField(max_length=100)
    author_role = models.CharField(max_length=50)
    posted_at = models.DateTimeField(auto_now_add=True)
    duration = models.CharField(max_length=20)
    views_count = models.IntegerField(default=0)
    likes_count = models.IntegerField(default=0)
    featured = models.BooleanField(default=False)
    tags = models.JSONField(default=list)

    def __str__(self):
        return self.title
