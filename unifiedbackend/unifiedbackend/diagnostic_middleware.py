import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("django.request")


class AdminErrorDiagnosticMiddleware(MiddlewareMixin):

    def process_exception(self, request, exception):
        if request.path.startswith("/admin/"):
            logger.exception(
                "ADMIN ERROR: %s %s",
                request.method,
                request.path,
                exc_info=(
                    type(exception),
                    exception,
                    exception.__traceback__,
                ),
            )

        return None