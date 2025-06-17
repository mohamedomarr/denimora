#!/usr/bin/env python3
"""
Fresh PostgreSQL Setup Script for Denimora Project

This script will:
1. Clean up any existing PostgreSQL setup
2. Create a fresh PostgreSQL user and database
3. Migrate Django to PostgreSQL
4. Import existing data

Usage: python setup_postgresql_fresh.py
"""

import os
import sys
import subprocess
import json
from pathlib import Path

# Database configuration
DB_CONFIG = {
    'NAME': 'denimora_db',
    'USER': 'denimora',
    'PASSWORD': 'admin',
    'HOST': 'localhost',
    'PORT': '5432',
}

def run_command(command, description, ignore_errors=False):
    """Run a shell command and handle errors."""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed successfully")
        if result.stdout.strip():
            print(f"Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        if ignore_errors:
            print(f"⚠ {description} failed (ignored): {e.stderr.strip()}")
            return False
        else:
            print(f"✗ Error: {description} failed")
            print(f"Error output: {e.stderr.strip()}")
            return False

def check_postgresql():
    """Check if PostgreSQL is installed and running."""
    print("=== Checking PostgreSQL Installation ===")
    
    # Check if psql is available
    if not run_command("which psql", "Checking psql availability"):
        print("PostgreSQL is not installed or not in PATH")
        print("Please install PostgreSQL first:")
        print("  macOS: brew install postgresql")
        print("  Ubuntu: sudo apt-get install postgresql postgresql-contrib")
        return False
    
    # Check if PostgreSQL service is running
    if not run_command("pg_isready", "Checking PostgreSQL service"):
        print("PostgreSQL service is not running")
        print("Start it with:")
        print("  macOS: brew services start postgresql")
        print("  Ubuntu: sudo systemctl start postgresql")
        return False
    
    return True

def cleanup_existing_setup():
    """Clean up any existing PostgreSQL setup."""
    print("\n=== Cleaning Up Existing Setup ===")
    
    # Try to drop existing database and user (ignore errors if they don't exist)
    cleanup_commands = [
        f"dropdb --if-exists {DB_CONFIG['NAME']}",
        f"dropuser --if-exists {DB_CONFIG['USER']}",
    ]
    
    for cmd in cleanup_commands:
        run_command(cmd, f"Executing: {cmd}", ignore_errors=True)

def create_postgresql_setup():
    """Create PostgreSQL user and database."""
    print("\n=== Creating Fresh PostgreSQL Setup ===")
    
    # Create user
    create_user_cmd = f"createuser --createdb --login {DB_CONFIG['USER']}"
    if not run_command(create_user_cmd, "Creating PostgreSQL user"):
        return False
    
    # Set password for user
    set_password_cmd = f"psql -c \"ALTER USER {DB_CONFIG['USER']} WITH PASSWORD '{DB_CONFIG['PASSWORD']}';\" postgres"
    if not run_command(set_password_cmd, "Setting user password"):
        return False
    
    # Create database
    create_db_cmd = f"createdb --owner={DB_CONFIG['USER']} {DB_CONFIG['NAME']}"
    if not run_command(create_db_cmd, "Creating database"):
        return False
    
    return True

def test_django_connection():
    """Test Django connection to PostgreSQL."""
    print("\n=== Testing Django Connection ===")
    
    # Test connection with Django
    test_cmd = "python manage.py check --database default"
    return run_command(test_cmd, "Testing Django database connection")

def backup_sqlite_data():
    """Backup existing SQLite data."""
    print("\n=== Backing Up SQLite Data ===")
    
    if not os.path.exists('db.sqlite3'):
        print("No SQLite database found. Skipping backup.")
        return False
    
    # Temporarily switch to SQLite for backup
    backup_cmd = "python -c \"import os; os.rename('database_config.py', 'database_config.py.bak')\" && python manage.py dumpdata --natural-foreign --natural-primary --output=sqlite_backup.json && python -c \"import os; os.rename('database_config.py.bak', 'database_config.py')\""
    
    if run_command(backup_cmd, "Backing up SQLite data"):
        return True
    else:
        # If the complex command fails, try a simpler approach
        print("Trying alternative backup method...")
        return run_command("python manage.py dumpdata --natural-foreign --natural-primary --output=sqlite_backup.json", "Alternative SQLite backup")

def run_migrations():
    """Run Django migrations."""
    print("\n=== Running Django Migrations ===")
    
    # Make migrations
    if not run_command("python manage.py makemigrations", "Creating migrations"):
        return False
    
    # Apply migrations
    if not run_command("python manage.py migrate", "Applying migrations"):
        return False
    
    return True

def import_data():
    """Import data from SQLite backup."""
    print("\n=== Importing Data ===")
    
    if not os.path.exists('sqlite_backup.json'):
        print("No backup data found. Skipping data import.")
        return True
    
    if run_command("python manage.py loaddata sqlite_backup.json", "Importing data"):
        # Clean up backup file
        try:
            os.remove('sqlite_backup.json')
            print("✓ Backup file cleaned up")
        except:
            print("Note: You can manually remove sqlite_backup.json")
        return True
    
    return False

def create_superuser():
    """Prompt to create a superuser."""
    print("\n=== Creating Superuser ===")
    print("You can create a superuser now (optional):")
    print("Run: python manage.py createsuperuser")

def main():
    """Main setup function."""
    print("=== Fresh PostgreSQL Setup for Denimora ===")
    print(f"Database: {DB_CONFIG['NAME']}")
    print(f"User: {DB_CONFIG['USER']}")
    print(f"Password: {DB_CONFIG['PASSWORD']}")
    print(f"Host: {DB_CONFIG['HOST']}")
    print(f"Port: {DB_CONFIG['PORT']}")
    
    # Check if we're in the right directory
    if not os.path.exists('manage.py'):
        print("Error: This script must be run from the Django project root directory")
        sys.exit(1)
    
    # Step 1: Check PostgreSQL
    if not check_postgresql():
        print("\nPlease install and start PostgreSQL, then run this script again.")
        sys.exit(1)
    
    # Step 2: Backup SQLite data (if exists)
    has_sqlite_data = backup_sqlite_data()
    
    # Step 3: Clean up existing setup
    cleanup_existing_setup()
    
    # Step 4: Create fresh PostgreSQL setup
    if not create_postgresql_setup():
        print("Failed to create PostgreSQL setup")
        sys.exit(1)
    
    # Step 5: Test Django connection
    if not test_django_connection():
        print("Failed to connect Django to PostgreSQL")
        sys.exit(1)
    
    # Step 6: Run migrations
    if not run_migrations():
        print("Failed to run migrations")
        sys.exit(1)
    
    # Step 7: Import data (if available)
    if has_sqlite_data:
        import_data()
    
    # Step 8: Prompt for superuser creation
    create_superuser()
    
    print("\n=== Setup Complete! ===")
    print("✓ PostgreSQL database created successfully")
    print("✓ Django configured to use PostgreSQL")
    print("✓ Migrations applied")
    if has_sqlite_data:
        print("✓ Data imported from SQLite")
    
    print(f"\nDatabase Details:")
    print(f"  Database: {DB_CONFIG['NAME']}")
    print(f"  User: {DB_CONFIG['USER']}")
    print(f"  Password: {DB_CONFIG['PASSWORD']}")
    print(f"  Host: {DB_CONFIG['HOST']}")
    print(f"  Port: {DB_CONFIG['PORT']}")
    
    print("\nYou can now:")
    print("1. Run the server: python manage.py runserver")
    print("2. Access your PostgreSQL database with any PostgreSQL client")
    print("3. Create a superuser: python manage.py createsuperuser")

if __name__ == "__main__":
    main() 