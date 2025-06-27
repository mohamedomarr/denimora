import base64
import os
import io
import requests
from urllib.parse import urljoin
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.utils.deconstruct import deconstructible


@deconstructible
class GitHubStorage(Storage):
    """
    Custom Django storage backend for GitHub repositories.
    Uploads files directly to a GitHub repository via GitHub API.
    """
    
    def __init__(self, **kwargs):
        # GitHub configuration
        self.github_token = getattr(settings, 'GITHUB_STORAGE_TOKEN', None)
        self.repo_owner = getattr(settings, 'GITHUB_STORAGE_REPO_OWNER', None)
        self.repo_name = getattr(settings, 'GITHUB_STORAGE_REPO_NAME', None)
        self.branch = getattr(settings, 'GITHUB_STORAGE_BRANCH', 'main')
        self.base_path = getattr(settings, 'GITHUB_STORAGE_BASE_PATH', 'media/')
        
        # API endpoints
        self.api_base = 'https://api.github.com'
        self.raw_base = f'https://raw.githubusercontent.com/{self.repo_owner}/{self.repo_name}/{self.branch}'
        
        if not all([self.github_token, self.repo_owner, self.repo_name]):
            raise ValueError("GitHub storage requires GITHUB_STORAGE_TOKEN, GITHUB_STORAGE_REPO_OWNER, and GITHUB_STORAGE_REPO_NAME settings")
    
    def _get_api_url(self, name):
        """Get GitHub API URL for file operations"""
        path = self._normalize_name(name)
        return f"{self.api_base}/repos/{self.repo_owner}/{self.repo_name}/contents/{path}"
    
    def _get_raw_url(self, name):
        """Get raw file URL for accessing the file"""
        path = self._normalize_name(name)
        return f"{self.raw_base}/{path}"
    
    def _normalize_name(self, name):
        """Normalize file path for GitHub"""
        # Remove leading slashes and ensure base_path
        name = name.lstrip('/')
        if self.base_path and not name.startswith(self.base_path):
            name = os.path.join(self.base_path, name)
        return name.replace('\\', '/')  # Ensure forward slashes
    
    def _get_headers(self):
        """Get headers for GitHub API requests"""
        return {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        }
    
    def _get_file_info(self, name):
        """Get file information from GitHub (for updates)"""
        url = self._get_api_url(name)
        response = requests.get(url, headers=self._get_headers())
        if response.status_code == 200:
            return response.json()
        return None
    
    def _save(self, name, content):
        """Save file to GitHub repository"""
        # Read content
        if hasattr(content, 'read'):
            file_content = content.read()
        else:
            file_content = content
            
        # Ensure content is bytes
        if isinstance(file_content, str):
            file_content = file_content.encode('utf-8')
        
        # Encode content as base64
        encoded_content = base64.b64encode(file_content).decode('utf-8')
        
        # Check if file already exists (for updates)
        existing_file = self._get_file_info(name)
        
        # Prepare request data
        data = {
            'message': f'Upload {os.path.basename(name)} via Django admin',
            'content': encoded_content,
            'branch': self.branch,
        }
        
        # Add SHA if file exists (required for updates)
        if existing_file:
            data['sha'] = existing_file['sha']
            data['message'] = f'Update {os.path.basename(name)} via Django admin'
        
        # Upload to GitHub
        url = self._get_api_url(name)
        response = requests.put(url, json=data, headers=self._get_headers())
        
        if response.status_code in [200, 201]:
            return name
        else:
            raise Exception(f"Failed to upload file to GitHub: {response.status_code} - {response.text}")
    
    def _open(self, name, mode='rb'):
        """Open file from GitHub repository"""
        url = self._get_raw_url(name)
        response = requests.get(url)
        
        if response.status_code == 200:
            return ContentFile(response.content)
        else:
            raise FileNotFoundError(f"File {name} not found in GitHub repository")
    
    def delete(self, name):
        """Delete file from GitHub repository"""
        existing_file = self._get_file_info(name)
        
        if not existing_file:
            return  # File doesn't exist, nothing to delete
        
        data = {
            'message': f'Delete {os.path.basename(name)} via Django admin',
            'sha': existing_file['sha'],
            'branch': self.branch,
        }
        
        url = self._get_api_url(name)
        response = requests.delete(url, json=data, headers=self._get_headers())
        
        if response.status_code not in [200, 204]:
            raise Exception(f"Failed to delete file from GitHub: {response.status_code} - {response.text}")
    
    def exists(self, name):
        """Check if file exists in GitHub repository"""
        file_info = self._get_file_info(name)
        return file_info is not None
    
    def listdir(self, path):
        """List directory contents in GitHub repository"""
        # GitHub API doesn't support traditional directory listing
        # This is a simplified implementation
        normalized_path = self._normalize_name(path)
        url = f"{self.api_base}/repos/{self.repo_owner}/{self.repo_name}/contents/{normalized_path}"
        
        response = requests.get(url, headers=self._get_headers())
        
        if response.status_code == 200:
            contents = response.json()
            if isinstance(contents, list):
                directories = []
                files = []
                for item in contents:
                    if item['type'] == 'dir':
                        directories.append(item['name'])
                    else:
                        files.append(item['name'])
                return directories, files
        
        return [], []
    
    def size(self, name):
        """Get file size from GitHub repository"""
        file_info = self._get_file_info(name)
        if file_info:
            return file_info.get('size', 0)
        raise FileNotFoundError(f"File {name} not found")
    
    def url(self, name):
        """Get public URL for the file"""
        return self._get_raw_url(name)
    
    def get_accessed_time(self, name):
        """GitHub doesn't provide access time"""
        raise NotImplementedError()
    
    def get_created_time(self, name):
        """GitHub doesn't provide creation time in a simple way"""
        raise NotImplementedError()
    
    def get_modified_time(self, name):
        """GitHub doesn't provide modification time in a simple way"""
        raise NotImplementedError()


class GitHubMediaStorage(GitHubStorage):
    """
    Specific storage for media files with media-specific configuration
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Override base path for media files
        self.base_path = getattr(settings, 'GITHUB_MEDIA_PATH', 'media/')


class GitHubStaticStorage(GitHubStorage):
    """
    Specific storage for static files with static-specific configuration
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Override base path for static files
        self.base_path = getattr(settings, 'GITHUB_STATIC_PATH', 'static/') 