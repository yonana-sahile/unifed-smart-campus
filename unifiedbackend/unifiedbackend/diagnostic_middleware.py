import sys
import traceback

class AdminErrorDiagnosticMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception:
            if request.path.startswith('/admin/'):
                print("\n========== ADMIN 500 TRACEBACK ==========", flush=True)
                print(f"PATH: {request.method} {request.path}", flush=True)
                traceback.print_exc(file=sys.stdout)
                print("========== END TRACEBACK ==========\n", flush=True)
            raise