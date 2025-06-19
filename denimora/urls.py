from django.urls import path, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.urls import re_path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('accounts/', include('accounts.urls', namespace='accounts')),
    path('products/', include('products.urls', namespace='products')),
    path('cart/', include('cart.urls', namespace='cart')),
    path('orders/', include('orders.urls', namespace='orders')),
    # API URLs
    path('api/', include('api.urls')),
    path('api/communications/', include('communications.urls', namespace='communications')),
]

# Serve media files in all environments (including production on Render)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Additional explicit media serving for production
if not settings.DEBUG:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]

# Serve static files only in development (WhiteNoise handles this in production)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


