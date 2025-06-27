#!/usr/bin/env python3
"""
Test script for GitHub storage backend
"""
import os
import django
from django.core.files.base import ContentFile

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'denimora.settings')
django.setup()

def test_github_storage():
    """Test GitHub storage functionality"""
    print("🧪 Testing GitHub Storage Backend...")
    
    try:
        # Import storage
        from storage.github_storage import GitHubMediaStorage
        storage = GitHubMediaStorage()
        
        print(f"✅ Storage initialized successfully")
        print(f"📊 GitHub Token: {storage.github_token[:10]}..." if storage.github_token else "❌ No token")
        print(f"📊 Repository: {storage.repo_owner}/{storage.repo_name}")
        print(f"📊 Branch: {storage.branch}")
        print(f"📊 Base Path: {storage.base_path}")
        
        # Test with a small text file
        test_content = "Hello from Denimora Django app! This is a test upload."
        test_file = ContentFile(test_content.encode('utf-8'))
        test_filename = "test_upload.txt"
        
        print(f"\n🔄 Testing file upload...")
        print(f"📁 File: {test_filename}")
        print(f"📄 Content: {test_content}")
        
        # Try to save the file
        saved_name = storage.save(test_filename, test_file)
        print(f"✅ File uploaded successfully: {saved_name}")
        
        # Get the URL
        file_url = storage.url(saved_name)
        print(f"🔗 File URL: {file_url}")
        
        # Test if file exists
        exists = storage.exists(saved_name)
        print(f"📋 File exists check: {exists}")
        
        # Test file size
        try:
            size = storage.size(saved_name)
            print(f"📏 File size: {size} bytes")
        except Exception as e:
            print(f"⚠️ Could not get file size: {e}")
        
        print(f"\n🎉 GitHub storage test completed successfully!")
        print(f"🌐 Check your GitHub repository at: https://github.com/{storage.repo_owner}/{storage.repo_name}")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_github_storage() 