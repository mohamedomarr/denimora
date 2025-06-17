import os
import dj_database_url
from .settings import *

# Production settings
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')

# Allowed hosts
ALLOWED_HOSTS = [
    'your-app-name.onrender.com',  # Replace with your actual Render URL
    'your-domain.com',  # Replace with your actual domain
    'www.your-domain.com',  # Replace with your actual domain
]

# Database
DATABASES = {
    'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
}

# Static files for production
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.com",  # Replace with your actual domain
    "https://www.your-domain.com",  # Replace with your actual domain
]

CORS_ALLOW_CREDENTIALS = False

# CSRF settings
CSRF_TRUSTED_ORIGINS = [
    "https://your-domain.com",  # Replace with your actual domain
    "https://www.your-domain.com",  # Replace with your actual domain
]

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Email settings (optional)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@your-domain.com') 