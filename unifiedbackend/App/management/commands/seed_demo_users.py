from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

DEMO_USERS = [
    {"username": "tadesse", "email": "tadesse@mau.edu.et", "full_name": "Tadesse G.", "role": "STUDENT",
     "student_id": "MAU1402271"},
    {"username": "teach1", "email": "chalachew@mau.edu.et", "full_name": "Dr. Chalachew", "role": "INSTRUCTOR",
     "instructor_id": "INST101"},
    {"username": "melkamu", "email": "registrar@mau.edu.et", "full_name": "Almaz Kebede", "role": "REGISTRAR",
     "staff_id": "REG001"},
    {"username": "fekadu", "email": "dephead@mau.edu.et", "full_name": "Dr. Befekadu", "role": "DEPARTMENT_HEAD",
     "staff_id": "DH101"},
    {"username": "getachew", "email": "dean@mau.edu.et", "full_name": "Prof. Getachew", "role": "DEAN",
     "staff_id": "DEAN001"},
    {"username": "selamawit", "email": "admin@mau.edu.et", "full_name": "Selamawit T.", "role": "ADMIN",
     "staff_id": "ADMIN001"},
    {"username": "alemayehu", "email": "library@mau.edu.et", "full_name": "Alemayehu B.", "role": "LIBRARY_STAFF",
     "staff_id": "LIB001"},
    {"username": "meron", "email": "finance@mau.edu.et", "full_name": "Meron Desta", "role": "FINANCE_OFFICER",
     "officer_id": "FIN001"},
    {"username": "material", "email": "material@mau.edu.et", "full_name": "Solomon Kassa", "role": "MATERIAL_MANAGER",
     "staff_id": "MMS001"},
    {"username": "tolossa", "email": "tolossa.seme@moe.gov.et", "full_name": "Dr. Tolossa Seme", "role": "AUDITOR",
     "staff_id": "MOE001"},
]


class Command(BaseCommand):
    help = "Create demo users with password 'password'"

    def handle(self, *args, **options):
        User = get_user_model()
        for u in DEMO_USERS:
            if User.objects.filter(username=u["username"]).exists():
                self.stdout.write(self.style.WARNING(f"skip {u['username']} (exists)"))
                continue

            # ✅ FIX: Pop full_name and split it into first_name and last_name
            data = u.copy()
            full_name = data.pop("full_name", "")
            name_parts = full_name.split(" ", 1)
            data["first_name"] = name_parts[0]
            if len(name_parts) > 1:
                data["last_name"] = name_parts[1]

            try:
                User.objects.create_user(password="password", is_active=True, **data)
                self.stdout.write(self.style.SUCCESS(f"created {u['username']} -> {u['role']}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to create {u['username']}: {e}"))

        self.stdout.write(self.style.SUCCESS("Done."))
