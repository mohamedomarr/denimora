# PostgreSQL Setup Guide for Denimora E-commerce

This guide provides complete instructions for setting up PostgreSQL for the Denimora Django e-commerce application across different environments (development, production, and new machines).

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Server Setup](#production-server-setup)
4. [Database Configuration](#database-configuration)
5. [Data Migration](#data-migration)
6. [Testing & Verification](#testing--verification)
7. [pgAdmin Setup](#pgadmin-setup)
8. [Troubleshooting](#troubleshooting)
9. [Backup & Restore](#backup--restore)

---

## 🔧 Prerequisites

### Required Software
- **Python 3.8+** (tested with Python 3.13)
- **PostgreSQL 14+** (recommended: PostgreSQL 14.17)
- **pip** (Python package manager)
- **virtualenv** or **venv**

### System Requirements
- **macOS**: Homebrew installed
- **Ubuntu/Debian**: APT package manager
- **Windows**: PostgreSQL installer or WSL2
- **RAM**: Minimum 4GB (8GB+ recommended)
- **Storage**: At least 2GB free space

---

## 🍎 Local Development Setup (macOS)

### Step 1: Install PostgreSQL

```bash
# Install PostgreSQL using Homebrew
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Verify installation
brew services list | grep postgresql
```

### Step 2: Initialize Database (Fresh Installation)

```bash
# Stop any running PostgreSQL services
brew services stop postgresql@14

# Remove existing data (if any) - CAUTION: This deletes all data
rm -rf /opt/homebrew/var/postgresql@14

# Initialize fresh database with custom user
/opt/homebrew/bin/initdb -D /opt/homebrew/var/postgresql@14 --auth=md5 --username=denimora

# Configure PostgreSQL to use custom port (optional, to avoid conflicts)
echo "port = 5433" >> /opt/homebrew/var/postgresql@14/postgresql.conf

# Start PostgreSQL
/opt/homebrew/bin/pg_ctl -D /opt/homebrew/var/postgresql@14 -l /opt/homebrew/var/log/postgresql@14.log start
```

### Step 3: Create Database and User

```bash
# Connect to PostgreSQL and create database
/opt/homebrew/bin/psql -p 5433 -U denimora postgres -c "CREATE DATABASE denimora_db;"

# Set password for denimora user
/opt/homebrew/bin/psql -p 5433 -U denimora postgres -c "ALTER USER denimora PASSWORD 'admin';"

# Grant privileges
/opt/homebrew/bin/psql -p 5433 -U denimora postgres -c "GRANT ALL PRIVILEGES ON DATABASE denimora_db TO denimora;"
```

---

## 🐧 Production Server Setup (Ubuntu/Debian)

### Step 1: Install PostgreSQL

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### Step 2: Configure PostgreSQL User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell, run:
CREATE USER denimora WITH PASSWORD 'admin';
CREATE DATABASE denimora_db OWNER denimora;
GRANT ALL PRIVILEGES ON DATABASE denimora_db TO denimora;
ALTER USER denimora CREATEDB;
\q
```

### Step 3: Configure Authentication

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add or modify these lines:
local   denimora_db     denimora                                md5
host    denimora_db     denimora        127.0.0.1/32            md5
host    denimora_db     denimora        ::1/128                 md5

# Edit postgresql.conf for remote connections (if needed)
sudo nano /etc/postgresql/14/main/postgresql.conf

# Uncomment and modify:
listen_addresses = 'localhost'  # or '*' for all addresses
port = 5432

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## ⚙️ Database Configuration

### Step 1: Create Database Configuration File

Create `database_config.py` in your project root:

```python
# database_config.py
import os

# Database configuration for Denimora project
DATABASE_CONFIG = {
    'NAME': 'denimora_db',
    'USER': 'denimora',
    'PASSWORD': 'admin',  # Change this in production!
    'HOST': 'localhost',
    'PORT': '5433',  # Use 5432 for standard installation
}

# Production environment variables (optional)
if os.getenv('DJANGO_ENV') == 'production':
    DATABASE_CONFIG.update({
        'PASSWORD': os.getenv('DB_PASSWORD', 'admin'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    })
```

### Step 2: Update Django Settings

In `denimora/settings.py`, update the DATABASES configuration:

```python
# denimora/settings.py
import os
from pathlib import Path

# Import database configuration
try:
    from database_config import DATABASE_CONFIG
    USE_POSTGRESQL = True
except ImportError:
    USE_POSTGRESQL = False
    print("Warning: database_config.py not found, using SQLite fallback")

# Database configuration
if USE_POSTGRESQL:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            **DATABASE_CONFIG
        }
    }
else:
    # SQLite fallback
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
```

### Step 3: Install Python Dependencies

```bash
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install PostgreSQL adapter
pip install psycopg2-binary==2.9.10

# Update requirements file
echo "psycopg2-binary==2.9.10" >> requirements.txt
```

---

## 📊 Data Migration

### Step 1: Backup Existing SQLite Data (if applicable)

```bash
# Activate virtual environment
source venv/bin/activate

# Create backup of existing SQLite data
python manage.py dumpdata --natural-foreign --natural-primary \
    --exclude contenttypes --exclude auth.permission \
    --exclude sessions.session --exclude admin.logentry \
    > sqlite_backup.json

echo "SQLite data backed up to sqlite_backup.json"
```

### Step 2: Run Django Migrations

```bash
# Check database connection
python manage.py check --database default

# Create and run migrations
python manage.py makemigrations
python manage.py migrate

# Verify migration status
python manage.py showmigrations
```

### Step 3: Load Data (if migrating from SQLite)

```bash
# Load backed up data
python manage.py loaddata sqlite_backup.json

# Verify data integrity
python manage.py shell -c "
from django.contrib.auth.models import User
from products.models import Product, Category
from orders.models import Order

print(f'Users: {User.objects.count()}')
print(f'Products: {Product.objects.count()}')
print(f'Categories: {Category.objects.count()}')
print(f'Orders: {Order.objects.count()}')
"
```

### Step 4: Create Superuser

```bash
# Create admin user
python manage.py createsuperuser --username denimora_admin --email admin@denimora.com

# Or create non-interactively
python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='denimora_admin').exists():
    user = User.objects.create_superuser('denimora_admin', 'admin@denimora.com', 'admin123')
    print('Superuser created successfully')
else:
    print('Superuser already exists')
"
```

---

## ✅ Testing & Verification

### Step 1: Run Verification Script

```bash
# Test database connection and setup
python verify_postgresql.py

# Test Django server
python manage.py runserver --noreload &
SERVER_PID=$!

# Test HTTP response
sleep 3
curl -I http://localhost:8000/

# Stop server
kill $SERVER_PID
```

---

## 🔍 pgAdmin Setup

### Step 1: Install pgAdmin

#### macOS:
```bash
brew install --cask pgadmin4
```

#### Ubuntu/Debian:
```bash
# Add repository
curl https://www.pgadmin.org/static/packages_pgadmin_org.pub | sudo apt-key add
sudo sh -c 'echo "deb https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" > /etc/apt/sources.list.d/pgadmin4.list'

# Install
sudo apt update
sudo apt install pgadmin4
```

### Step 2: Configure pgAdmin Connection

1. **Open pgAdmin** and create a new server
2. **General Tab:**
   - Name: `Denimora PostgreSQL`

3. **Connection Tab:**
   - Host name/address: `localhost`
   - Port: `5433` (or `5432` for standard installation)
   - Maintenance database: `denimora_db`
   - Username: `denimora`
   - Password: `admin`

4. **SSL Tab:**
   - SSL mode: `Prefer` or `Disable`

5. **Click Save** to establish connection

---

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. Connection Refused
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux

# Restart PostgreSQL
brew services restart postgresql@14   # macOS
sudo systemctl restart postgresql     # Linux
```

#### 2. Authentication Failed
```bash
# Reset user password
psql -U postgres -c "ALTER USER denimora PASSWORD 'admin';"

# Check authentication configuration
cat /opt/homebrew/var/postgresql@14/pg_hba.conf  # macOS
```

#### 3. Port Conflicts
```bash
# Find process using port
lsof -i :5432

# Use alternative port
echo "port = 5433" >> postgresql.conf
```

---

## 💾 Backup & Restore

### Database Backup

```bash
# Create backup directory
mkdir -p backups

# Full database backup
PGPASSWORD=admin pg_dump -U denimora -h localhost -p 5433 denimora_db > backups/denimora_$(date +%Y%m%d_%H%M%S).sql

# Django fixture backup
python manage.py dumpdata --natural-foreign --natural-primary \
    --exclude contenttypes --exclude auth.permission \
    --exclude sessions.session --exclude admin.logentry \
    > backups/django_data_$(date +%Y%m%d_%H%M%S).json
```

### Database Restore

```bash
# Restore from SQL dump
PGPASSWORD=admin psql -U denimora -h localhost -p 5433 denimora_db < backups/denimora_backup.sql

# Restore Django fixtures
python manage.py loaddata backups/django_data_backup.json
```

---

## 📝 Quick Reference

### Essential Commands

```bash
# Start PostgreSQL
brew services start postgresql@14           # macOS
sudo systemctl start postgresql            # Linux

# Connect to database
PGPASSWORD=admin psql -U denimora -h localhost -p 5433 denimora_db

# Django commands
python manage.py check --database default
python manage.py migrate
python manage.py runserver

# Backup database
PGPASSWORD=admin pg_dump -U denimora -h localhost -p 5433 denimora_db > backup.sql
```

### Default Credentials

- **Database**: `denimora_db`
- **Username**: `denimora`
- **Password**: `admin`
- **Host**: `localhost`
- **Port**: `5433` (development) / `5432` (production)

### Important Files

- `database_config.py` - Database configuration
- `verify_postgresql.py` - Setup verification script
- `Requirements.txt` - Python dependencies including psycopg2-binary

---

**Last Updated**: March 2025  
**Version**: 1.0  
**Compatible with**: PostgreSQL 14+, Django 4.2+, Python 3.8+ 