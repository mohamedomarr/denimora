# GitHub Storage Setup Guide for Denimora

## Overview
This guide will help you set up a custom Django storage backend that uploads all admin panel images directly to a GitHub repository instead of storing them locally.

## Benefits
- ✅ **Free Storage**: GitHub provides free storage for public repositories
- ✅ **Global CDN**: Images served via GitHub's CDN for faster loading
- ✅ **Version Control**: All uploaded images are version controlled
- ✅ **No Server Storage**: Your Django server doesn't store files locally
- ✅ **Easy Backup**: Files are automatically backed up in GitHub

## Step 1: Create GitHub Repository for Images

### 1.1 Create a New Repository
1. Go to GitHub and create a new repository
2. Name it something like `denimora-media` or `denimora-images`
3. Make it **public** (for free CDN access) or **private** (if you prefer)
4. Initialize with a README

### 1.2 Create GitHub Personal Access Token
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Click "Generate new token (classic)"
3. Give it a name like "Denimora Django Storage"
4. Set expiration (recommend 1 year)
5. Select these scopes:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories)
6. Copy the token (you won't see it again!)

## Step 2: Install Required Dependencies

```bash
pip install requests
```

Add to your `Requirements.txt`:
```
requests>=2.31.0
```

## Step 3: Update Django Settings

### 3.1 Add to `denimora/settings.py`:
```python
# GitHub Storage Configuration
GITHUB_STORAGE_TOKEN = 'your_github_token_here'  # Replace with your token
GITHUB_STORAGE_REPO_OWNER = 'your_username'      # Replace with your GitHub username
GITHUB_STORAGE_REPO_NAME = 'denimora-media'      # Replace with your repo name
GITHUB_STORAGE_BRANCH = 'main'                   # Branch to upload to
GITHUB_STORAGE_BASE_PATH = 'media/'              # Base path in repo

# Use GitHub storage for media files
DEFAULT_FILE_STORAGE = 'storage.github_storage.GitHubMediaStorage'
```

### 3.2 For Production (`denimora/production_settings.py`):
```python
import os

# GitHub Storage Configuration (using environment variables)
GITHUB_STORAGE_TOKEN = os.environ.get('GITHUB_STORAGE_TOKEN')
GITHUB_STORAGE_REPO_OWNER = os.environ.get('GITHUB_STORAGE_REPO_OWNER', 'your_username')
GITHUB_STORAGE_REPO_NAME = os.environ.get('GITHUB_STORAGE_REPO_NAME', 'denimora-media')
GITHUB_STORAGE_BRANCH = os.environ.get('GITHUB_STORAGE_BRANCH', 'main')
GITHUB_STORAGE_BASE_PATH = os.environ.get('GITHUB_STORAGE_BASE_PATH', 'media/')

# Use GitHub storage for media files
DEFAULT_FILE_STORAGE = 'storage.github_storage.GitHubMediaStorage'
```

## Step 4: Update Your Models (Optional)

Your existing models will work without changes! But if you want to optimize URLs:

```python
# products/models.py - Update the image_url property
@property
def image_url(self):
    if self.image and hasattr(self.image, 'url'):
        return self.image.url  # This will now return GitHub raw URL
    return '/static/Assets/Shop/default-product.jpg'
```

## Step 5: Test the Setup

### 5.1 Test Locally
```bash
# Start Django server
python manage.py runserver

# Go to admin panel
http://localhost:8000/admin/

# Try uploading a product image
# Check your GitHub repo - the image should appear there!
```

### 5.2 Check GitHub Repository
After uploading, your repo structure should look like:
```
denimora-media/
├── media/
│   └── products/
│       └── 2025/
│           └── 12/
│               └── 17/
│                   └── your_uploaded_image.jpg
```

### 5.3 Test Image URL
The image will be accessible at:
```
https://raw.githubusercontent.com/your_username/denimora-media/main/media/products/2025/12/17/your_uploaded_image.jpg
```

## Step 6: Environment Variables for Production

### 6.1 Render Backend Environment Variables:
```
GITHUB_STORAGE_TOKEN=your_github_token_here
GITHUB_STORAGE_REPO_OWNER=your_username
GITHUB_STORAGE_REPO_NAME=denimora-media
```

### 6.2 Update API Serializers
The serializers will automatically use the GitHub URLs, but you can update them:

```python
# api/products/serializers.py
def get_image_url(self, obj):
    if obj.image and hasattr(obj.image, 'url'):
        # This will now return the GitHub raw URL directly
        return obj.image.url
    return '/static/Assets/Shop/default-product.jpg'
```

## Step 7: Migration from Local Storage (Optional)

If you want to migrate existing images to GitHub:

### 7.1 Create Migration Script:
```python
# migrate_to_github.py
import os
from django.core.files.base import ContentFile
from products.models import Product, ProductImage

def migrate_existing_images():
    """Migrate existing local images to GitHub storage"""
    
    # Migrate main product images
    for product in Product.objects.all():
        if product.image:
            try:
                # Read existing file
                with open(product.image.path, 'rb') as f:
                    content = f.read()
                
                # Get current name
                current_name = product.image.name
                
                # Save to GitHub (this will upload to GitHub)
                product.image.save(
                    current_name,
                    ContentFile(content),
                    save=True
                )
                print(f"Migrated: {current_name}")
                
            except Exception as e:
                print(f"Failed to migrate {product.name}: {e}")
    
    # Migrate detail images
    for detail_image in ProductImage.objects.all():
        if detail_image.image:
            try:
                with open(detail_image.image.path, 'rb') as f:
                    content = f.read()
                
                current_name = detail_image.image.name
                detail_image.image.save(
                    current_name,
                    ContentFile(content),
                    save=True
                )
                print(f"Migrated detail image: {current_name}")
                
            except Exception as e:
                print(f"Failed to migrate detail image: {e}")

if __name__ == "__main__":
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'denimora.settings')
    django.setup()
    migrate_existing_images()
```

Run migration:
```bash
python migrate_to_github.py
```

## Features of GitHub Storage

### ✅ What Works:
- ✅ File upload via Django admin
- ✅ File deletion when model is deleted
- ✅ Public URLs for images
- ✅ Automatic path organization (by date)
- ✅ Version control of all uploads
- ✅ Free CDN via GitHub

### ⚠️ Limitations:
- File size limit: 100MB per file
- API rate limits: 5000 requests/hour
- Best for images, not large video files
- Requires internet connection for file operations

## Troubleshooting

### Issue: "Failed to upload file to GitHub"
**Solution:** Check your GitHub token permissions and repo access

### Issue: "File not found in GitHub repository"
**Solution:** Verify the repository name and branch are correct

### Issue: Images not loading in frontend
**Solution:** Check that the repository is public or the URLs are accessible

### Issue: Rate limit exceeded
**Solution:** GitHub limits API calls to 5000/hour. For high-volume sites, consider using GitHub LFS or a different solution.

## Security Notes

1. **Never commit your GitHub token to code**
2. **Use environment variables for production**
3. **Consider making the media repository private if needed**
4. **Regularly rotate your GitHub tokens**

## Alternative: GitHub LFS (Large File Storage)

For larger files or higher volume, consider GitHub LFS:
```bash
# In your media repository
git lfs track "*.jpg"
git lfs track "*.png"
git lfs track "*.gif"
```

This is now ready to use! Your uploaded images will go directly to GitHub and be served from there instead of your local server. 