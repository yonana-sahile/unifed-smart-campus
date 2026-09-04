import random
import string

def generate_verification_code():
    """Generate a random verification code for transcripts and certificates"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))

def generate_receipt_number():
    """Generate a random receipt number for payments"""
    return 'MAU-REC-' + ''.join(random.choices(string.digits, k=8))

def calculate_gpa(grades):
    """Calculate GPA from list of grades"""
    if not grades:
        return 0.0
    total_points = sum(g.grade_point * g.credit_hours for g in grades)
    total_credits = sum(g.credit_hours for g in grades)
    return round(total_points / total_credits, 2) if total_credits > 0 else 0.0
