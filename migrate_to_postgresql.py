#!/usr/bin/env python3
"""
Data Migration Script from SQLite to PostgreSQL

This script handles the data migration process specifically for Django projects.
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'denimora.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.db import connections
from django.core.management.commands.dumpdata import Command as DumpDataCommand
from django.core.management.commands.loaddata import Command as LoadDataCommand

def backup_sqlite_data():
    """Create a backup of SQLite data."""
    print("Creating backup of SQLite data...")
    
    # Temporarily switch to SQLite for backup
    from django.conf import settings
    
    # Create backup with SQLite settings
    sqlite_db = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
    
    # Update database settings temporarily
    original_db = settings.DATABASES['default'].copy()
    settings.DATABASES['default'] = sqlite_db
    
    try:
        # Create data dump
        execute_from_command_line([
            'manage.py', 'dumpdata', 
            '--natural-foreign', 
            '--natural-primary',
            '--output=sqlite_backup.json'
        ])
        print("✓ SQLite data backed up to sqlite_backup.json")
        return True
    except Exception as e:
        print(f"✗ Error backing up SQLite data: {e}")
        return False
    finally:
        # Restore original database settings
        settings.DATABASES['default'] = original_db

def restore_to_postgresql():
    """Restore data to PostgreSQL."""
    print("Restoring data to PostgreSQL...")
    
    if not os.path.exists('sqlite_backup.json'):
        print("No backup file found. Skipping data restoration.")
        return False
    
    try:
        execute_from_command_line([
            'manage.py', 'loaddata', 'sqlite_backup.json'
        ])
        print("✓ Data successfully restored to PostgreSQL")
        return True
    except Exception as e:
        print(f"✗ Error restoring data to PostgreSQL: {e}")
        return False

def run_migrations():
    """Run Django migrations."""
    print("Running Django migrations...")
    
    try:
        execute_from_command_line(['manage.py', 'migrate'])
        print("✓ Migrations completed successfully")
        return True
    except Exception as e:
        print(f"✗ Error running migrations: {e}")
        return False

def main():
    """Main migration function."""
    print("=== Django SQLite to PostgreSQL Migration ===")
    
    # Check if SQLite database exists
    sqlite_path = BASE_DIR / 'db.sqlite3'
    if not sqlite_path.exists():
        print("No SQLite database found. Running fresh migrations...")
        run_migrations()
        return
    
    print(f"Found SQLite database: {sqlite_path}")
    
    # Step 1: Backup SQLite data
    if backup_sqlite_data():
        print("✓ SQLite backup completed")
    else:
        print("✗ SQLite backup failed")
        return
    
    # Step 2: Run migrations on PostgreSQL
    if run_migrations():
        print("✓ PostgreSQL migrations completed")
    else:
        print("✗ PostgreSQL migrations failed")
        return
    
    # Step 3: Restore data to PostgreSQL
    if restore_to_postgresql():
        print("✓ Data migration completed successfully")
        
        # Clean up backup file
        try:
            os.remove('sqlite_backup.json')
            print("✓ Backup file cleaned up")
        except:
            print("Note: You can manually remove sqlite_backup.json")
    else:
        print("✗ Data restoration failed")
        print("Note: sqlite_backup.json contains your data backup")

if __name__ == "__main__":
    main() 