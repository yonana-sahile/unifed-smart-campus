from django.db import migrations
from django.utils import timezone
from datetime import timedelta


FACILITIES = [
    ('LAB-SE-101', 'Software Lab 101', 'Tulu Awulia (Main)', 'Block A', 'A-201', 'LAB', 40, 'Informatics', None, ''),
    ('LAB-SE-102', 'Networks Lab 102', 'Tulu Awulia (Main)', 'Block A', 'A-202', 'LAB', 32, 'Informatics', None, ''),
    ('LAB-SE-103', 'AI & ML Lab 103', 'Tulu Awulia (Main)', 'Block A', 'A-301', 'LAB', 28, 'Informatics', 'MAINT_5D', 'Projector replacement'),
    ('HALL-201', 'Main Lecture Hall 201', 'Tulu Awulia (Main)', 'Main Building', 'M-201', 'LECTURE_HALL', 120, 'Informatics', None, ''),
    ('HALL-202', 'Lecture Hall 202', 'Tulu Awulia (Main)', 'Main Building', 'M-202', 'LECTURE_HALL', 90, 'Informatics', None, ''),
    ('SEM-01', 'Seminar Room 01', 'Tulu Awulia (Main)', 'Block B', 'B-101', 'SEMINAR_ROOM', 24, 'Informatics', None, ''),
    ('CONF-01', 'Department Conference Room', 'Tulu Awulia (Main)', 'Block B', 'B-102', 'CONFERENCE_ROOM', 16, 'Informatics', None, ''),
    ('LAB-SW-101', 'SW Project Lab 101', 'Tulu Awulia (Main)', 'Block C', 'C-101', 'LAB', 24, 'sw', None, ''),
    ('LAB-SW-102', 'SW Testing Lab 102', 'Tulu Awulia (Main)', 'Block C', 'C-102', 'LAB', 20, 'sw', None, ''),
    ('LAB-MS-201', 'Masha Software Lab 201', 'Masha Campus', 'Block M1', 'M1-101', 'LAB', 30, 'Informatics', None, ''),
]


def seed(apps, schema_editor):
    Facility = apps.get_model('App', 'Facility')
    now = timezone.now()
    for (code, name, campus, building, room, ftype, cap, dept, maint, reason) in FACILITIES:
        maintenance_until = (now + timedelta(days=5)) if maint == 'MAINT_5D' else None
        Facility.objects.update_or_create(
            facility_code=code,
            defaults={'name': name, 'campus': campus, 'building': building, 'room_number': room, 'facility_type': ftype, 'capacity': cap, 'department': dept, 'is_active': True, 'maintenance_until': maintenance_until, 'maintenance_reason': reason}
        )


def unseed(apps, schema_editor):
    Facility = apps.get_model('App', 'Facility')
    Facility.objects.filter(facility_code__in=[f[0] for f in FACILITIES]).delete()


class Migration(migrations.Migration):

    dependencies = [('App', '0015_add_facility_schema')]

    operations = [migrations.RunPython(seed, unseed)]
