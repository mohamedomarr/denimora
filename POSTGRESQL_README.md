# PostgreSQL Setup for Denimora E-commerce

## 🚀 Quick Start

### New Machine Setup (macOS)

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

### Manual Setup

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

3. **Setup Django**:
   ```bash
   pip install psycopg2-binary==2.9.10
   python manage.py migrate
   python manage.py loaddata sqlite_backup.json  # if restoring data
   python manage.py createsuperuser
   ```

## 🔧 Configuration

### Database Credentials
- **Database**: `denimora_db`
- **Username**: `denimora`
- **Password**: `admin`
- **Host**: `localhost`
- **Port**: `5433` (development) / `5432` (production)

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

1. **Install pgAdmin**: `brew install --cask pgadmin4`
2. **Create Server Connection**:
   - Host: `localhost`
   - Port: `5433`
   - Database: `denimora_db`
   - Username: `denimora`
   - Password: `admin`

## 🚨 Troubleshooting

### Common Issues

**Connection Refused**:
```bash
brew services restart postgresql@14
lsof -i :5433  # Check port usage
```

**Authentication Failed**:
```bash
PGPASSWORD=admin psql -U denimora -h localhost -p 5433 denimora_db -c "SELECT 1;"
```

**Django Migration Errors**:
```bash
python manage.py check --database default
python manage.py showmigrations
```

### Useful Commands

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

1. **Use Standard Port**: Change port to `5432` in production
2. **Secure Passwords**: Use environment variables for credentials
3. **SSL Configuration**: Enable SSL for remote connections
4. **Backup Strategy**: Set up automated backups

For detailed documentation, see `POSTGRESQL_SETUP_GUIDE.md`

---

**Last Updated**: March 2025  
**Quick Reference**: PostgreSQL 14 + Django 4.2 + Python 3.8+ 