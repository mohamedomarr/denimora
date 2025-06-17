import os
import dj_database_url
from .settings import *

# Production settings
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')

# Allowed hosts - you'll need to update these with your actual Render URL
ALLOWED_HOSTS = [
    '.onrender.com',  # This allows any subdomain on onrender.com
    'localhost',
    '127.0.0.1',
]

# Database
DATABASES = {
    'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
}

# Static files for production
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# CORS settings for production - update with your frontend domain
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # For development
    # Add your production frontend URL here
]

CORS_ALLOW_CREDENTIALS = True

# CSRF settings - update with your actual domain
CSRF_TRUSTED_ORIGINS = [
    "https://*.onrender.com",  # This allows any subdomain on onrender.com
]

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('DENIMORA_EMAIL_USERNAME')
EMAIL_HOST_PASSWORD = os.environ.get('DENIMORA_EMAIL_PASSWORD')
DEFAULT_FROM_EMAIL = f"Denimora <{os.environ.get('DENIMORA_EMAIL_USERNAME', 'noreply@denimora.com')}>"

# Use the environment variable or fallback to localhost for development
SITE_URL = os.environ.get('SITE_URL', 'http://localhost:8000') 