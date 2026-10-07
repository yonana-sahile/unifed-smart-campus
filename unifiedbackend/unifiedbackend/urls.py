from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# ✅ ADDED: JWT token endpoints
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# ✅ ADDED: AI viewset for the explicit predict-risk route
from App.views import AIViewSet

schema_view = get_schema_view(
    openapi.Info(
        title="Unified Smart Campus API",
        default_version='v1',
        description="API for Mekdela Amba University Smart Campus Management System",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="support@mau.edu.et"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # ✅ ADDED: explicit route for AI risk prediction.
    #    Must come BEFORE include('App.urls') so Django matches it first
    #    and doesn't fall through to the router.
    path(
        'api/ai/predict-risk/',
        AIViewSet.as_view({'post': 'predict_risk'}),
        name='ai-predict-risk',
    ),

    path('api/', include('App.urls')),  # ✅ Changed from 'api.urls' to 'App.urls'

    # ✅ ADDED: /api/token/ and /api/token/refresh/ for real JWT login
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)