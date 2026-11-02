import traceback
from django.http import HttpResponse


class AdminErrorDiagnosticMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
        except Exception:
            if request.path.startswith('/admin/'):
                return HttpResponse(
                    "<h3>EXCEPTION ESCAPED VIEW:</h3><pre>" + traceback.format_exc() + "</pre>",
                    content_type="text/html",
                    status=500,
                )
            raise

        if response.status_code >= 500 and request.path.startswith('/admin/'):
            return HttpResponse(
                "<h3>NO TRACEBACK CAPTURED AT VIEW LEVEL</h3>"
                "<p>The 500 was returned without an exception escaping the view. "
                "This means the error is in Django's admin form/template rendering, "
                "or in a signal handler.</p>"
                "<p>Path: " + request.path + "</p>",
                content_type="text/html",
                status=500,
            )

        return response