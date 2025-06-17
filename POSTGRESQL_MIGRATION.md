# PostgreSQL Migration Guide for Denimora

This guide will help you migrate your Denimora Django project from SQLite to PostgreSQL while preserving all existing data and functionality.

## Prerequisites

1. **PostgreSQL Installation**
   - **macOS**: `brew install postgresql`
   - **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
   - **Windows**: Download from [PostgreSQL official website](https://www.postgresql.org/download/)

2. **Start PostgreSQL Service**
   - **macOS**: `brew services start postgresql`
   - **Ubuntu/Debian**: `sudo systemctl start postgresql`
   - **Windows**: PostgreSQL service should start automatically

## Migration Process

### Option 1: Automated Migration (Recommended)

1. **Install PostgreSQL dependencies**:
   ```bash
   pip install -r Requirements.txt
   ```

2. **Run the setup script**:
   ```bash
   python setup_postgresql.py
   ```

This script will:
- Check PostgreSQL installation
- Create database and user
- Export SQLite data
- Run migrations
- Import data to PostgreSQL

### Option 2: Manual Migration

If you prefer to do it manually or the automated script doesn't work:

#### Step 1: Install psycopg2
```bash
pip install psycopg2-binary==2.9.9
```

#### Step 2: Create PostgreSQL Database
```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE denimora_db;
CREATE USER denimora_user WITH PASSWORD 'denimora_password';
GRANT ALL PRIVILEGES ON DATABASE denimora_db TO denimora_user;
ALTER USER denimora_user CREATEDB;
\q
```

#### Step 3: Export SQLite Data
```bash
# First, ensure you're using SQLite settings
python manage.py dumpdata --natural-foreign --natural-primary > sqlite_backup.json
```

#### Step 4: Update Django Settings
The settings have already been updated to use PostgreSQL. The configuration uses these environment variables:
- `DB_NAME`: denimora_db (default)
- `DB_USER`: denimora_user (default)
- `DB_PASSWORD`: denimora_password (default)
- `DB_HOST`: localhost (default)
- `DB_PORT`: 5432 (default)

#### Step 5: Run Migrations
```bash
python manage.py migrate
```

#### Step 6: Import Data
```bash
python manage.py loaddata sqlite_backup.json
```

## Environment Variables

You can override the default database settings using environment variables:

```bash
export DB_NAME=your_db_name
export DB_USER=your_db_user
export DB_PASSWORD=your_db_password
export DB_HOST=your_db_host
export DB_PORT=your_db_port
```

## Verification

After migration, verify everything works:

1. **Check database connection**:
   ```bash
   python manage.py dbshell
   ```

2. **Run the development server**:
   ```bash
   python manage.py runserver
   ```

3. **Test your application**:
   - Visit `http://localhost:8000`
   - Check admin panel: `http://localhost:8000/admin/`
   - Test all functionality

## Troubleshooting

### Common Issues

1. **psycopg2 installation fails**:
   ```bash
   # On macOS
   brew install postgresql
   
   # On Ubuntu
   sudo apt-get install libpq-dev python3-dev
   
   # Then try again
   pip install psycopg2-binary
   ```

2. **Permission denied for database**:
   ```bash
   sudo -u postgres psql
   GRANT ALL PRIVILEGES ON DATABASE denimora_db TO denimora_user;
   ALTER USER denimora_user CREATEDB;
   ```

3. **Connection refused**:
   - Ensure PostgreSQL is running
   - Check if the service is listening on port 5432
   - Verify host and port settings

4. **Data import fails**:
   - Check if all migrations are applied
   - Ensure the backup file exists and is valid JSON
   - Try importing specific apps: `python manage.py loaddata --app=products sqlite_backup.json`

## Rollback Plan

If you need to rollback to SQLite:

1. **Backup PostgreSQL data**:
   ```bash
   python manage.py dumpdata --natural-foreign --natural-primary > postgresql_backup.json
   ```

2. **Update settings.py** to use SQLite:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.sqlite3',
           'NAME': BASE_DIR / 'db.sqlite3',
       }
   }
   ```

3. **Restore your original SQLite database** or run migrations on a fresh SQLite database

## Performance Considerations

PostgreSQL offers several advantages over SQLite:
- Better concurrent access
- Advanced indexing
- Full-text search capabilities
- Better performance for complex queries
- ACID compliance
- Better backup and recovery options

## Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Consider using connection pooling for production
- Enable SSL connections for production deployments

## Next Steps

After successful migration:
1. Update your deployment scripts
2. Configure database backups
3. Set up monitoring
4. Consider using connection pooling (django-environ, django-database-url)
5. Update your CI/CD pipeline to use PostgreSQL for testing

## Files Modified

- `Requirements.txt`: Added psycopg2-binary dependency
- `denimora/settings.py`: Updated database configuration
- `setup_postgresql.py`: Automated setup script (new)
- `migrate_to_postgresql.py`: Data migration script (new)
- `POSTGRESQL_MIGRATION.md`: This guide (new)

All existing functionality remains unchanged. The migration only affects the database backend. 