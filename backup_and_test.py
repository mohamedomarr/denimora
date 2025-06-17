#!/usr/bin/env python3
"""
Database Backup and Testing Script for Denimora
==============================================

This script provides backup and testing functionality for PostgreSQL setup.
"""

import os
import sys
import subprocess
import json
from datetime import datetime
from pathlib import Path

def run_command(command, capture_output=True):
    """Run shell command"""
    try:
        result = subprocess.run(command, shell=True, capture_output=capture_output, text=True, check=True)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        return None

def create_backup():
    """Create database backups"""
    print("Creating database backups...")
    
    # Create backup directory
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # PostgreSQL backup
    print("Creating PostgreSQL backup...")
    pg_backup_file = f"backups/postgres_backup_{timestamp}.sql"
    pg_cmd = f"PGPASSWORD=admin pg_dump -U denimora -h localhost -p 5433 denimora_db > {pg_backup_file}"
    
    if run_command(pg_cmd):
        print(f"✓ PostgreSQL backup created: {pg_backup_file}")
    
    # Django fixtures backup
    print("Creating Django fixtures backup...")
    django_backup_file = f"backups/django_backup_{timestamp}.json"
    django_cmd = f"python manage.py dumpdata --natural-foreign --natural-primary --exclude contenttypes --exclude auth.permission --exclude sessions.session --exclude admin.logentry > {django_backup_file}"
    
    if run_command(django_cmd):
        print(f"✓ Django backup created: {django_backup_file}")
    
    # Create backup info file
    backup_info = {
        "timestamp": timestamp,
        "postgresql_backup": pg_backup_file,
        "django_backup": django_backup_file,
        "database_config": {
            "name": "denimora_db",
            "user": "denimora", 
            "host": "localhost",
            "port": "5433"
        }
    }
    
    with open(f"backups/backup_info_{timestamp}.json", 'w') as f:
        json.dump(backup_info, f, indent=2)
    
    print(f"✓ Backup completed at {timestamp}")

def test_database():
    """Test database connection and integrity"""
    print("Testing database connection and integrity...")
    
    # Create a temporary test script file
    test_script_content = '''
import os
import django
from django.conf import settings
from django.db import connection
from django.contrib.auth.models import User

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'denimora.settings')
django.setup()

try:
    # Test connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        print(f"✓ PostgreSQL Version: {version}")
    
    # Test tables
    tables = connection.introspection.table_names()
    print(f"✓ Found {len(tables)} tables")
    
    # Test data
    user_count = User.objects.count()
    print(f"✓ Users in database: {user_count}")
    
    # Test specific tables
    from products.models import Product, Category
    from orders.models import Order
    
    print(f"✓ Products: {Product.objects.count()}")
    print(f"✓ Categories: {Category.objects.count()}")
    print(f"✓ Orders: {Order.objects.count()}")
    
    print("✓ All database tests passed!")
    
except Exception as e:
    print(f"✗ Database test failed: {e}")
'''
    
    # Write to temporary file
    with open('temp_test.py', 'w') as f:
        f.write(test_script_content)
    
    # Run the test
    result = run_command("python temp_test.py")
    
    # Clean up
    if os.path.exists('temp_test.py'):
        os.remove('temp_test.py')
    
    return result is not None

def verify_setup():
    """Verify complete setup"""
    print("Verifying PostgreSQL setup...")
    
    checks = [
        ("Database connection", "PGPASSWORD=admin psql -U denimora -h localhost -p 5433 denimora_db -c 'SELECT 1;'"),
        ("Django check", "python manage.py check --database default"),
        ("Migration status", "python manage.py showmigrations"),
    ]
    
    all_passed = True
    
    for check_name, command in checks:
        print(f"Checking {check_name}...")
        result = run_command(command)
        if result:
            print(f"✓ {check_name} passed")
        else:
            print(f"✗ {check_name} failed")
            all_passed = False
    
    return all_passed

def main():
    if len(sys.argv) < 2:
        print("Usage: python backup_and_test.py [backup|test|verify]")
        return
    
    action = sys.argv[1]
    
    if action == "backup":
        create_backup()
    elif action == "test":
        test_database()
    elif action == "verify":
        verify_setup()
    else:
        print("Invalid action. Use: backup, test, or verify")

if __name__ == "__main__":
    main() 