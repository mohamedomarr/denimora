#!/usr/bin/env python3
"""
PostgreSQL Setup Script for Denimora Project

This script helps set up PostgreSQL database and migrate data from SQLite.
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def run_command(command, description):
    """Run a shell command and handle errors."""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"✗ Error: {description} failed")
        print(f"Error output: {e.stderr}")
        return None

def check_postgresql():
    """Check if PostgreSQL is installed and running."""
    print("Checking PostgreSQL installation...")
    
    # Check if psql is available
    result = run_command("which psql", "Checking psql availability")
    if not result:
        print("PostgreSQL is not installed or not in PATH")
        print("Please install PostgreSQL first:")
        print("  macOS: brew install postgresql")
        print("  Ubuntu: sudo apt-get install postgresql postgresql-contrib")
        print("  Windows: Download from https://www.postgresql.org/download/")
        return False
    
    # Check if PostgreSQL service is running
    result = run_command("pg_isready", "Checking PostgreSQL service")
    if not result:
        print("PostgreSQL service is not running")
        print("Start it with:")
        print("  macOS: brew services start postgresql")
        print("  Ubuntu: sudo systemctl start postgresql")
        return False
    
    return True

def create_database():
    """Create PostgreSQL database and user."""
    print("\nCreating PostgreSQL database and user...")
    
    commands = [
        "createuser -s denimora_user 2>/dev/null || echo 'User already exists'",
        "createdb -O denimora_user denimora_db 2>/dev/null || echo 'Database already exists'",
        "psql -d denimora_db -c \"ALTER USER denimora_user WITH PASSWORD 'denimora_password';\" 2>/dev/null || echo 'Password already set'"
    ]
    
    for cmd in commands:
        run_command(cmd, f"Executing: {cmd.split()[0]}")

def install_requirements():
    """Install Python requirements including psycopg2."""
    print("\nInstalling Python requirements...")
    run_command("pip install -r Requirements.txt", "Installing requirements")

def migrate_database():
    """Run Django migrations."""
    print("\nRunning Django migrations...")
    run_command("python manage.py makemigrations", "Creating migrations")
    run_command("python manage.py migrate", "Applying migrations")

def export_sqlite_data():
    """Export data from SQLite database."""
    print("\nExporting data from SQLite...")
    if not os.path.exists('db.sqlite3'):
        print("No SQLite database found. Skipping data export.")
        return False
    
    run_command("python manage.py dumpdata --natural-foreign --natural-primary > data_backup.json", 
                "Exporting SQLite data")
    return True

def import_postgresql_data():
    """Import data into PostgreSQL database."""
    print("\nImporting data into PostgreSQL...")
    if not os.path.exists('data_backup.json'):
        print("No backup data found. Skipping data import.")
        return
    
    run_command("python manage.py loaddata data_backup.json", "Importing data")

def main():
    """Main setup function."""
    print("=== Denimora PostgreSQL Setup ===")
    
    # Check if we're in the right directory
    if not os.path.exists('manage.py'):
        print("Error: This script must be run from the Django project root directory")
        sys.exit(1)
    
    # Step 1: Check PostgreSQL
    if not check_postgresql():
        print("\nPlease install and start PostgreSQL, then run this script again.")
        sys.exit(1)
    
    # Step 2: Install requirements
    install_requirements()
    
    # Step 3: Create database
    create_database()
    
    # Step 4: Export SQLite data (if exists)
    has_sqlite_data = export_sqlite_data()
    
    # Step 5: Run migrations
    migrate_database()
    
    # Step 6: Import data (if available)
    if has_sqlite_data:
        import_postgresql_data()
    
    print("\n=== Setup Complete ===")
    print("Your Django project is now configured to use PostgreSQL!")
    print("\nEnvironment variables used:")
    print("  DB_NAME=denimora_db")
    print("  DB_USER=denimora_user") 
    print("  DB_PASSWORD=denimora_password")
    print("  DB_HOST=localhost")
    print("  DB_PORT=5432")
    print("\nYou can now run: python manage.py runserver")

if __name__ == "__main__":
    main() 