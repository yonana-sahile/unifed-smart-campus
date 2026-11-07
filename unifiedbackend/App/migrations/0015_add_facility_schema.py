from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [('App', '0014_attendancesession_attendancecheckin')]

    operations = [
        migrations.CreateModel(
            name='Facility',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('facility_code', models.CharField(max_length=20, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('campus', models.CharField(choices=[('Tulu Awulia (Main)', 'Tulu Awulia (Main)'), ('Masha Campus', 'Masha Campus')], max_length=50)),
                ('building', models.CharField(blank=True, max_length=100)),
                ('room_number', models.CharField(blank=True, max_length=20)),
                ('facility_type', models.CharField(choices=[('LAB', 'Lab'), ('AUDITORIUM', 'Auditorium'), ('SEMINAR_ROOM', 'Seminar Room'), ('LECTURE_HALL', 'Lecture Hall'), ('LIBRARY_CUBICLE', 'Library Cubicle'), ('CONFERENCE_ROOM', 'Conference Room'), ('MEETING_ROOM', 'Meeting Room')], max_length=20)),
                ('capacity', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('maintenance_until', models.DateTimeField(blank=True, null=True)),
                ('maintenance_reason', models.CharField(blank=True, max_length=255)),
                ('department', models.CharField(blank=True, max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['facility_code']},
        ),
        migrations.RemoveField(model_name='facilitybooking', name='booked_by'),
        migrations.RemoveField(model_name='facilitybooking', name='booked_by_role'),
        migrations.RemoveField(model_name='facilitybooking', name='campus'),
        migrations.RemoveField(model_name='facilitybooking', name='capacity'),
        migrations.RemoveField(model_name='facilitybooking', name='facility_code'),
        migrations.RemoveField(model_name='facilitybooking', name='facility_name'),
        migrations.RemoveField(model_name='facilitybooking', name='resources_equipped'),
        migrations.RemoveField(model_name='facilitybooking', name='room_type'),
        migrations.AddField(model_name='facilitybooking', name='approved_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='facilitybooking', name='approved_by', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='facility_bookings_approved', to=settings.AUTH_USER_MODEL)),
        migrations.AddField(model_name='facilitybooking', name='created_at', field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now), preserve_default=False),
        migrations.AddField(model_name='facilitybooking', name='expected_attendees', field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name='facilitybooking', name='facility', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='bookings', to='App.facility')),
        migrations.AddField(model_name='facilitybooking', name='rejection_reason', field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name='facilitybooking', name='requested_by', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='facility_bookings_requested', to=settings.AUTH_USER_MODEL)),
        migrations.AddField(model_name='facilitybooking', name='updated_at', field=models.DateTimeField(auto_now=True)),
        migrations.AlterField(model_name='facilitybooking', name='department', field=models.CharField(blank=True, max_length=100)),
        migrations.AlterField(model_name='facilitybooking', name='status', field=models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected'), ('CANCELLED', 'Cancelled'), ('COMPLETED', 'Completed')], default='PENDING', max_length=20)),
    ]
