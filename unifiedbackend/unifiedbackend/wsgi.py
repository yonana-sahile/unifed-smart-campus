import os
import sys
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'unifiedbackend.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()


def _safe_app(environ, start_response):
    try:
        return application(environ, start_response)
    except Exception:
        if '/admin/' in environ.get('PATH_INFO', ''):
            print("\n========== WSGI ADMIN 500 ==========", flush=True)
            print("PATH:", environ.get('REQUEST_METHOD'), environ.get('PATH_INFO'), flush=True)
            traceback.print_exc(file=sys.stdout)
            print("========== WSGI END ==========\n", flush=True)
        raise


application = _safe_app