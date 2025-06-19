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
    'denimora.co',
    'denimora.netlify.app',
]

# Add WhiteNoise middleware for static files
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Database
DATABASES = {
    'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
}

# Static files for production
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files configuration
# Option A: Use Cloudinary (recommended)
if os.environ.get('CLOUDINARY_URL'):
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    
    INSTALLED_APPS = INSTALLED_APPS + ['cloudinary', 'cloudinary_storage']
    
    # Cloudinary configuration from environment variable
    cloudinary.config(
        cloudinary_url=os.environ.get('CLOUDINARY_URL')
    )
    
    # Use Cloudinary for media storage
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
        'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
        'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
    }
    MEDIA_URL = '/media/'  # Cloudinary will handle the actual URLs
else:
    # Option B: Fallback to local media files served through Django
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CORS settings for production - update with your frontend domain
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # For development
    "https://denimora.netlify.app",  # Replace with your actual Netlify URL
    "https://denimora.co",  # Add your custom domain if you have one
]

CORS_ALLOW_CREDENTIALS = True

# CSRF settings - update with your actual domain
CSRF_TRUSTED_ORIGINS = [
    "https://*.onrender.com",  # This allows any subdomain on onrender.com
    "https://denimora.netlify.app",  # Replace with your actual Netlify URL
    "https://denimora.co",  # Add your custom domain if you have one
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