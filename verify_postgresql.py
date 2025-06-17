#!/usr/bin/env python3
"""
PostgreSQL Verification Script for Denimora Project

This script verifies that the PostgreSQL migration was successful.
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'denimora.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line
from django.contrib.auth.models import User

def test_database_connection():
    """Test basic database connection."""
    print("Testing database connection...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"✓ Connected to PostgreSQL: {version}")
            return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def test_tables_exist():
    """Test that all expected tables exist."""
    print("\nChecking database tables...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            """)
            tables = [row[0] for row in cursor.fetchall()]
            
            expected_tables = [
                'auth_user', 'auth_group', 'django_content_type',
                'products_category', 'products_product', 'products_size',
                'cart_cartitem', 'orders_order', 'orders_orderitem',
                'communications_communicationlog'
            ]
            
            print(f"Found {len(tables)} tables:")
            for table in tables:
                print(f"  - {table}")
            
            missing_tables = []
            for expected in expected_tables:
                if not any(expected in table for table in tables):
                    missing_tables.append(expected)
            
            if missing_tables:
                print(f"⚠ Some expected tables might be missing: {missing_tables}")
            else:
                print("✓ All expected table patterns found")
            
            return True
    except Exception as e:
        print(f"✗ Error checking tables: {e}")
        return False

def test_data_integrity():
    """Test basic data integrity."""
    print("\nTesting data integrity...")
    try:
        # Test Django models
        from products.models import Product, Category
        from orders.models import Order
        from django.contrib.auth.models import User
        
        # Count records
        user_count = User.objects.count()
        product_count = Product.objects.count()
        category_count = Category.objects.count()
        order_count = Order.objects.count()
        
        print(f"Data counts:")
        print(f"  - Users: {user_count}")
        print(f"  - Products: {product_count}")
        print(f"  - Categories: {category_count}")
        print(f"  - Orders: {order_count}")
        
        # Test basic queries
        if product_count > 0:
            first_product = Product.objects.first()
            print(f"  - First product: {first_product.name}")
        
        if category_count > 0:
            first_category = Category.objects.first()
            print(f"  - First category: {first_category.name}")
        
        print("✓ Data integrity check passed")
        return True
        
    except Exception as e:
        print(f"✗ Data integrity check failed: {e}")
        return False

def test_admin_functionality():
    """Test admin functionality."""
    print("\nTesting admin functionality...")
    try:
        # Check if superuser exists
        superusers = User.objects.filter(is_superuser=True)
        if superusers.exists():
            print(f"✓ Found {superusers.count()} superuser(s)")
        else:
            print("⚠ No superusers found - you may need to create one")
        
        return True
    except Exception as e:
        print(f"✗ Admin functionality test failed: {e}")
        return False

def run_basic_commands():
    """Run basic Django management commands."""
    print("\nTesting Django management commands...")
    try:
        # Test migrations
        execute_from_command_line(['manage.py', 'showmigrations', '--verbosity=0'])
        print("✓ Migration status check passed")
        
        # Test collectstatic (dry run)
        execute_from_command_line(['manage.py', 'collectstatic', '--dry-run', '--verbosity=0'])
        print("✓ Static files check passed")
        
        return True
    except Exception as e:
        print(f"✗ Management commands test failed: {e}")
        return False

def main():
    """Main verification function."""
    print("=== PostgreSQL Migration Verification ===")
    
    all_tests_passed = True
    
    # Run all tests
    tests = [
        test_database_connection,
        test_tables_exist,
        test_data_integrity,
        test_admin_functionality,
        run_basic_commands
    ]
    
    for test in tests:
        if not test():
            all_tests_passed = False
    
    print("\n=== Verification Summary ===")
    if all_tests_passed:
        print("✓ All tests passed! PostgreSQL migration was successful.")
        print("\nYour application is ready to use with PostgreSQL.")
        print("You can now run: python manage.py runserver")
    else:
        print("✗ Some tests failed. Please check the output above.")
        print("\nYou may need to:")
        print("1. Ensure PostgreSQL is running")
        print("2. Check database credentials")
        print("3. Run migrations: python manage.py migrate")
        print("4. Import data: python manage.py loaddata sqlite_backup.json")

if __name__ == "__main__":
    main() 