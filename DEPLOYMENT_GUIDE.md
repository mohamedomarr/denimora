# Denimora Deployment Guide

Complete guide for deploying the Denimora e-commerce application with PostgreSQL to production servers.

## 🚀 Deployment Options

### Option 1: VPS/Cloud Server (Recommended)
- **DigitalOcean Droplet** ($10-20/month)
- **AWS EC2** (t3.small or t3.medium)
- **Google Cloud Compute Engine**
- **Linode** or **Vultr**

### Option 2: Platform as a Service
- **Heroku** (with PostgreSQL add-on)
- **Railway** 
- **Render**
- **PythonAnywhere**

### Option 3: Traditional Web Hosting
- **A2 Hosting** (VPS with Django support)
- **Bluehost** (VPS plans)

---

## 🖥️ VPS Deployment (Ubuntu 22.04)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3 python3-pip python3-venv nginx git postgresql postgresql-contrib

# Create application user
sudo adduser denimora
sudo usermod -aG sudo denimora
sudo su - denimora
```

### Step 2: PostgreSQL Configuration

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE USER denimora WITH PASSWORD 'your-secure-password';
CREATE DATABASE denimora_db OWNER denimora;
GRANT ALL PRIVILEGES ON DATABASE denimora_db TO denimora;
ALTER USER denimora CREATEDB;
\q

# Configure authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: local   denimora_db     denimora                                md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 3: Application Deployment

```bash
# Clone repository
git clone https://github.com/your-username/denimora.git
cd denimora

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn

# Configure database
cp database_config.py.example database_config.py
nano database_config.py
# Update with production credentials

# Environment variables
cat > .env << EOF
DJANGO_ENV=production
DEBUG=False
SECRET_KEY=your-very-long-secret-key-here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DB_PASSWORD=your-secure-password
EOF

# Run migrations
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### Step 4: Gunicorn Configuration

```bash
# Create Gunicorn service
sudo nano /etc/systemd/system/denimora.service
```

```ini
[Unit]
Description=Denimora Django Application
After=network.target

[Service]
User=denimora
Group=denimora
WorkingDirectory=/home/denimora/denimora
Environment="PATH=/home/denimora/denimora/venv/bin"
EnvironmentFile=/home/denimora/denimora/.env
ExecStart=/home/denimora/denimora/venv/bin/gunicorn --workers 3 --bind unix:/home/denimora/denimora/denimora.sock denimora.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable denimora
sudo systemctl start denimora
sudo systemctl status denimora
```

### Step 5: Nginx Configuration

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/denimora
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        root /home/denimora/denimora;
    }
    
    location /media/ {
        root /home/denimora/denimora;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/denimora/denimora/denimora.sock;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/denimora /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: SSL Certificate (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## ☁️ Heroku Deployment

### Step 1: Prepare for Heroku

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create app
heroku create denimora-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev
```

### Step 2: Configuration Files

**Procfile**:
```
web: gunicorn denimora.wsgi
release: python manage.py migrate
```

**runtime.txt**:
```
python-3.11.7
```

**requirements.txt** (add production dependencies):
```
gunicorn==21.2.0
dj-database-url==2.1.0
whitenoise==6.6.0
```

### Step 3: Django Settings for Heroku

```python
# denimora/settings.py (add production settings)
import dj_database_url
import os

# Production settings
if os.getenv('DJANGO_ENV') == 'production':
    DEBUG = False
    
    # Database
    DATABASES['default'] = dj_database_url.parse(os.environ.get('DATABASE_URL'))
    
    # Static files
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
    
    # Security
    SECURE_SSL_REDIRECT = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
```

### Step 4: Deploy

```bash
# Set environment variables
heroku config:set DJANGO_ENV=production
heroku config:set SECRET_KEY=your-secret-key
heroku config:set DEBUG=False

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Create superuser
heroku run python manage.py createsuperuser
```

---

## 🔧 Production Configuration

### Environment Variables

Create `.env` file:
```bash
DJANGO_ENV=production
DEBUG=False
SECRET_KEY=your-very-long-secret-key-here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database
DB_NAME=denimora_db
DB_USER=denimora
DB_PASSWORD=your-secure-password
DB_HOST=localhost
DB_PORT=5432

# Security
SECURE_SSL_REDIRECT=True
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_TYPE_NOSNIFF=True
```

### Database Security

```sql
-- Create read-only user for backups
CREATE USER denimora_readonly WITH PASSWORD 'readonly-password';
GRANT CONNECT ON DATABASE denimora_db TO denimora_readonly;
GRANT USAGE ON SCHEMA public TO denimora_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO denimora_readonly;
```

### Backup Strategy

**Automated Daily Backups**:
```bash
#!/bin/bash
# /home/denimora/backup.sh

BACKUP_DIR="/home/denimora/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# PostgreSQL backup
PGPASSWORD=your-password pg_dump -U denimora -h localhost denimora_db | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Django fixtures backup
cd /home/denimora/denimora
source venv/bin/activate
python manage.py dumpdata --natural-foreign --natural-primary \
    --exclude contenttypes --exclude auth.permission \
    --exclude sessions.session --exclude admin.logentry \
    > $BACKUP_DIR/django_$DATE.json

# Keep only last 7 days
find $BACKUP_DIR -name "postgres_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "django_*.json" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Cron job**:
```bash
crontab -e
# Add: 0 2 * * * /home/denimora/backup.sh >> /home/denimora/backup.log 2>&1
```

---

## 🔍 Monitoring & Maintenance

### Log Monitoring

```bash
# Application logs
sudo journalctl -u denimora -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Performance Monitoring

**Install monitoring tools**:
```bash
# System monitoring
sudo apt install htop iotop

# Database monitoring
sudo apt install postgresql-contrib
```

**Database performance queries**:
```sql
-- Check connection count
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('denimora_db'));

-- Check table sizes
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size 
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Security Checklist

- [ ] Use strong passwords for all accounts
- [ ] Enable SSL/TLS certificates
- [ ] Configure firewall (ufw)
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup encryption
- [ ] Environment variable security
- [ ] Database connection limits

### Scaling Considerations

**Horizontal Scaling**:
- Load balancer (Nginx upstream)
- Multiple application servers
- Shared database server
- Redis for caching/sessions

**Vertical Scaling**:
- Increase server resources
- Optimize database queries
- Enable Django caching
- Use CDN for static files

---

## 🚨 Troubleshooting

### Common Production Issues

**Application won't start**:
```bash
sudo systemctl status denimora
sudo journalctl -u denimora --no-pager
```

**Database connection errors**:
```bash
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname='denimora_db';"
```

**Nginx errors**:
```bash
sudo nginx -t
sudo systemctl status nginx
```

**SSL certificate issues**:
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

### Emergency Recovery

**Restore from backup**:
```bash
# Stop application
sudo systemctl stop denimora

# Restore database
gunzip -c backup.sql.gz | psql -U denimora denimora_db

# Restore Django data
python manage.py loaddata backup.json

# Start application
sudo systemctl start denimora
```

---

## 📝 Maintenance Schedule

### Daily
- Monitor application logs
- Check system resources
- Verify backup completion

### Weekly
- Review security logs
- Update dependencies
- Performance analysis

### Monthly
- Security updates
- Database maintenance
- Backup testing
- SSL certificate check

---

**For detailed setup instructions, see `POSTGRESQL_SETUP_GUIDE.md`**  
**For quick reference, see `POSTGRESQL_README.md`**

---

**Last Updated**: March 2025  
**Deployment Guide**: Production-ready PostgreSQL + Django deployment 