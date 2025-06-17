# PostgreSQL Setup for Denimora E-commerce

## 🚀 Quick Start

### New Machine Setup

#### 🍎 macOS

1. **Install PostgreSQL**:
   ```bash
   brew install postgresql@14
   ```

2. **Clone and Setup Project**:
   ```bash
   git clone <repository-url>
   cd denimora
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Run Automated Setup**:
   ```bash
   python setup_postgresql_complete.py --fresh-install --restore-data
   ```

#### 🪟 Windows

1. **Install PostgreSQL**:
   - Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
   - Run installer with these settings:
     - Port: `5432` (default)
     - Superuser password: Remember this!
     - Install pgAdmin 4: ✅ Yes

2. **Clone and Setup Project**:
   ```cmd
   git clone <repository-url>
   cd denimora
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Manual Setup** (automated script not yet available for Windows):
   ```cmd
   # Follow Manual Setup section below
   ```

### Manual Setup

#### 🍎 macOS Setup

1. **Initialize Database**:
   ```bash
   # Stop existing PostgreSQL
   brew services stop postgresql@14
   
   # Remove old data (optional)
   rm -rf /opt/homebrew/var/postgresql@14
   
   # Initialize fresh database
   /opt/homebrew/bin/initdb -D /opt/homebrew/var/postgresql@14 --auth=md5 --username=denimora
   
   # Configure port
   echo "port = 5433" >> /opt/homebrew/var/postgresql@14/postgresql.conf
   
   # Start PostgreSQL
   /opt/homebrew/bin/pg_ctl -D /opt/homebrew/var/postgresql@14 -l /opt/homebrew/var/log/postgresql@14.log start
   ```

2. **Create Database**:
   ```bash
   PGPASSWORD=admin psql -p 5433 -U denimora postgres -c "CREATE DATABASE denimora_db;"
   PGPASSWORD=admin psql -p 5433 -U denimora postgres -c "ALTER USER denimora PASSWORD 'admin';"
   ```

#### 🪟 Windows Setup

1. **Create Database User** (using pgAdmin or command line):
   
   **Option A: Using pgAdmin** (Recommended for beginners):
   - Open pgAdmin 4
   - Connect to PostgreSQL server (localhost)
   - Right-click "Login/Group Roles" → Create → Login/Group Role
   - Name: `denimora`, Password: `admin`
   - Privileges tab: ✅ Can login, ✅ Create databases
   - Right-click "Databases" → Create → Database
   - Name: `denimora_db`, Owner: `denimora`

   **Option B: Using Command Line**:
   ```cmd
   # Open Command Prompt as Administrator
   # Navigate to PostgreSQL bin directory (usually):
   cd "C:\Program Files\PostgreSQL\14\bin"
   
   # Connect as superuser (enter your superuser password when prompted)
   psql -U postgres
   
   # In PostgreSQL shell, run:
   CREATE USER denimora WITH PASSWORD 'admin';
   CREATE DATABASE denimora_db OWNER denimora;
   GRANT ALL PRIVILEGES ON DATABASE denimora_db TO denimora;
   ALTER USER denimora CREATEDB;
   \q
   ```

2. **Configure Database Connection**:
   ```cmd
   # Test connection (enter password: admin)
   psql -U denimora -d denimora_db -h localhost
   # If connected successfully, type \q to quit
   ```

#### 🔄 Cross-Platform Django Setup

3. **Setup Django** (same for both macOS and Windows):
   ```bash
   # macOS/Linux
   source venv/bin/activate
   
   # Windows
   venv\Scripts\activate
   
   # Install PostgreSQL adapter
   pip install psycopg2-binary==2.9.10
   
   # Run migrations
   python manage.py migrate
   
   # Restore data (if migrating from SQLite)
   python manage.py loaddata sqlite_backup.json
   
   # Create superuser
   python manage.py createsuperuser
   ```

## 🔧 Configuration

### Database Credentials
- **Database**: `denimora_db`
- **Username**: `denimora`
- **Password**: `admin`
- **Host**: `localhost`
- **Port**: `5433` (macOS development) / `5432` (Windows/production)

### Files Created
- `database_config.py` - Database configuration
- `verify_postgresql.py` - Setup verification
- `backup_and_test.py` - Backup and testing utilities

## 🧪 Testing & Verification

```bash
# Verify setup
python verify_postgresql.py

# Test database
python backup_and_test.py test

# Create backup
python backup_and_test.py backup

# Verify all components
python backup_and_test.py verify
```

## 🔍 pgAdmin Connection

### Installation
- **macOS**: `brew install --cask pgadmin4`
- **Windows**: Included with PostgreSQL installer

### Create Server Connection
**For macOS (Port 5433)**:
- Host: `localhost`
- Port: `5433`
- Database: `denimora_db`
- Username: `denimora`
- Password: `admin`

**For Windows (Port 5432)**:
- Host: `localhost`
- Port: `5432`
- Database: `denimora_db`
- Username: `denimora`
- Password: `admin`

## 🚨 Troubleshooting

### Common Issues

#### 🍎 macOS Troubleshooting

**Connection Refused**:
```bash
brew services restart postgresql@14
lsof -i :5433  # Check port usage
```

**Authentication Failed**:
```bash
PGPASSWORD=admin psql -U denimora -h localhost -p 5433 denimora_db -c "SELECT 1;"
```

#### 🪟 Windows Troubleshooting

**PostgreSQL Service Not Running**:
```cmd
# Check service status
sc query postgresql-x64-14

# Start service
net start postgresql-x64-14

# Stop service
net stop postgresql-x64-14
```

**Connection Refused**:
```cmd
# Check if PostgreSQL is listening on port 5432
netstat -an | findstr :5432

# Check Windows Firewall if connecting remotely
```

**Authentication Failed**:
```cmd
# Test connection (will prompt for password)
psql -U denimora -d denimora_db -h localhost

# Or with password in command (not recommended for production)
set PGPASSWORD=admin
psql -U denimora -d denimora_db -h localhost
```

#### 🔄 Cross-Platform Issues

**Django Migration Errors**:
```bash
python manage.py check --database default
python manage.py showmigrations
```

**Python Path Issues**:
```bash
# Make sure you're in virtual environment
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# Verify Python packages
pip list | grep psycopg2
```

### Useful Commands

#### 🍎 macOS Commands

```bash
# Connect to database
PGPASSWORD=admin psql -U denimora -h localhost -p 5433 denimora_db

# Start PostgreSQL
brew services start postgresql@14

# Stop PostgreSQL
brew services stop postgresql@14

# Check PostgreSQL status
brew services list | grep postgresql

# View logs
tail -f /opt/homebrew/var/log/postgresql@14.log
```

#### 🪟 Windows Commands

```cmd
# Connect to database
set PGPASSWORD=admin
psql -U denimora -d denimora_db -h localhost

# Start PostgreSQL service
net start postgresql-x64-14

# Stop PostgreSQL service  
net stop postgresql-x64-14

# Check service status
sc query postgresql-x64-14

# View logs (in Event Viewer or PostgreSQL log directory)
# Usually: C:\Program Files\PostgreSQL\14\data\log\
```

## 📁 Project Structure

```
denimora/
├── database_config.py          # Database configuration
├── verify_postgresql.py        # Setup verification script
├── backup_and_test.py          # Backup and testing utilities
├── POSTGRESQL_SETUP_GUIDE.md   # Complete documentation
├── POSTGRESQL_README.md        # This quick reference
├── sqlite_backup.json          # SQLite data backup
└── backups/                    # Database backups directory
```

## 🌐 Production Deployment

### Cross-Platform Considerations

1. **Port Configuration**:
   - **macOS Development**: Port `5433`
   - **Windows/Production**: Port `5432` (standard)
   
2. **Security Settings**:
   - **Change default passwords**: Use strong, unique passwords
   - **Environment variables**: Store credentials securely
   - **SSL configuration**: Enable for remote connections
   
3. **Platform-Specific Notes**:
   - **Windows**: Use Windows services for auto-start
   - **macOS**: Use Homebrew services or launchd
   - **Linux**: Use systemd services
   
4. **Backup Strategy**: Set up automated backups regardless of platform

For detailed documentation, see `POSTGRESQL_SETUP_GUIDE.md`

---

**Last Updated**: March 2025  
**Quick Reference**: PostgreSQL 14 + Django 4.2 + Python 3.8+  
**Platform Support**: ✅ macOS, ✅ Windows, ✅ Linux 