import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create or update superuser from env vars (idempotent, safe on every deploy)"

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.getenv("DJANGO_SUPERUSER_USERNAME")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

        if not username or not password:
            self.stdout.write(self.style.WARNING(
                "DJANGO_SUPERUSER_USERNAME or PASSWORD not set — skipping."
            ))
            return

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_superuser": True,
                "is_staff": True,
            },
        )

        user.email = email or user.email
        user.is_superuser = True
        user.is_staff = True

        force_reset = os.getenv("DJANGO_SUPERUSER_FORCE_RESET", "False") == "True"
        if created or force_reset:
            user.set_password(password)

        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created superuser: {username}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' already exists — flags ensured."))
