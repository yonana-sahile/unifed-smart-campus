from rest_framework import permissions


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'STUDENT'


class IsInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'INSTRUCTOR'


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class IsRegistrar(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'REGISTRAR'


class IsAuditor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'AUDITOR'


class IsDormManager(permissions.BasePermission):
    """Only administrative staff may configure dormitory inventory."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('ADMIN', 'REGISTRAR')


class CanManageBooking(permissions.BasePermission):
    """Owner, same-department head, or admin can modify/cancel a booking."""
    message = "You do not have permission to modify this booking."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or getattr(user, "role", None) in ("ADMIN", "REGISTRAR"):
            return True
        if getattr(user, "role", None) == "DEPARTMENT_HEAD":
            bd = (getattr(obj, "department", "") or "").strip().lower()
            ud = (getattr(user, "department", "") or "").strip().lower()
            if bd and ud and bd == ud:
                return True
        return str(getattr(obj, "requested_by_id", None)) == str(user.id)

class IsMaterialManager(permissions.BasePermission):
    """Allows only Material Managers and Admins to modify MMS data."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('MATERIAL_MANAGER', 'ADMIN')


class IsIoTManager(permissions.BasePermission):
    """Allows only Admins (and potentially Material Managers) to modify IoT devices."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('ADMIN', 'MATERIAL_MANAGER')


class IsInstructorOrManager(permissions.BasePermission):
    """
    Allows Instructors to create requisitions,
    but only Managers/Admins to update or delete them.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Everyone can read (GET)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Instructors can only create (POST)
        if request.method == 'POST' and request.user.role == 'INSTRUCTOR':
            return True

        # Only Managers/Admins can edit or delete
        return request.user.role in ('MATERIAL_MANAGER', 'ADMIN')
