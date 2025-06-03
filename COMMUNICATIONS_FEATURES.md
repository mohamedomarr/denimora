# Email Communications System

## Overview

The Denimora e-commerce platform now includes a comprehensive email communications system that captures and manages user interactions across all touchpoints. This system consolidates email data from subscriptions, contact forms, and orders into a unified management interface.

## Features Implemented

### 1. **Email Subscription Management**
- **Newsletter Popup**: Captures emails from the homepage popup
- **Footer Subscriptions**: Ready for footer newsletter forms
- **Source Tracking**: Identifies where each subscription originated
- **Reactivation**: Handles re-subscription of previously unsubscribed users
- **Status Management**: Active/inactive subscription states

### 2. **Contact Message System**
- **Contact Form Processing**: Captures messages from the contact form
- **Message Status Tracking**: New, Read, Replied, Archived states
- **Admin Notes**: Internal notes for customer service
- **Response Management**: Track communication history

### 3. **Consolidated Email List**
- **Multi-Source Integration**: Combines emails from subscriptions, messages, and orders
- **Activity Tracking**: Counts subscriptions, messages, and orders per email
- **Source History**: JSON field tracking all interaction sources
- **User Linking**: Links emails to registered user accounts when available

### 4. **Order Integration**
- **Automatic Collection**: All order emails automatically added to consolidated list
- **Historical Sync**: Management command to sync existing orders
- **Real-time Updates**: New orders instantly update email records

## Database Models

### EmailSubscription
```python
- email: EmailField (unique)
- source: CharField (popup, order, footer, manual)
- is_active: BooleanField
- subscribed_at: DateTimeField
- unsubscribed_at: DateTimeField (nullable)
- user: ForeignKey to User (nullable)
```

### ContactMessage
```python
- name: CharField
- email: EmailField
- message: TextField
- status: CharField (new, read, replied, archived)
- submitted_at: DateTimeField
- updated_at: DateTimeField
- user: ForeignKey to User (nullable)
- admin_notes: TextField
```

### EmailList
```python
- email: EmailField (unique)
- name: CharField
- sources: JSONField (list of sources)
- subscription_count: PositiveIntegerField
- message_count: PositiveIntegerField
- order_count: PositiveIntegerField
- is_active: BooleanField
- first_seen: DateTimeField
- last_activity: DateTimeField
- user: ForeignKey to User (nullable)
```

## API Endpoints

### Email Subscription
- **POST** `/api/communications/subscribe/`
  ```json
  {
    "email": "user@example.com",
    "source": "popup"  // optional, defaults to "popup"
  }
  ```

### Contact Messages
- **POST** `/api/communications/contact/`
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Your message here"
  }
  ```

### Unsubscribe
- **POST** `/api/communications/unsubscribe/`
  ```json
  {
    "email": "user@example.com"
  }
  ```

## Admin Interface Features

### Email Subscriptions Admin
- **List View**: Email, source, status, subscription date, linked user
- **Filters**: Source, active status, subscription date
- **Search**: Email, username, first name, last name
- **Actions**: 
  - Export to CSV
  - Bulk activate/deactivate subscriptions
- **Date Hierarchy**: Navigate by subscription date

### Contact Messages Admin
- **List View**: Name, email, status, submission date, message preview, linked user
- **Filters**: Status, submission date
- **Search**: Name, email, message content, username
- **Editable**: Status (inline editing)
- **Actions**:
  - Mark as read/replied/archived
  - Export to CSV
- **Admin Notes**: Internal tracking field

### Email List Admin
- **List View**: Email, name, sources, activity counts, status, last activity
- **Filters**: Active status, activity counts, first seen date
- **Search**: Email, name, username
- **Editable**: Active status (inline editing)
- **Actions**:
  - Export to CSV
  - Bulk activate/deactivate emails
- **Statistics**: Shows subscription, message, and order counts

## Management Commands

### Sync Order Emails
```bash
# Dry run to see what would be synced
python manage.py sync_order_emails --dry-run

# Actually sync the emails
python manage.py sync_order_emails
```

## Frontend Integration

### Newsletter Popup
- **Location**: Homepage popup modal
- **Trigger**: Automatic or user-initiated
- **Validation**: Real-time email format validation
- **Feedback**: Success/error messages
- **API Integration**: Calls `/api/communications/subscribe/`

### Contact Form
- **Location**: Homepage contact section
- **Validation**: Name (3+ chars), email format, message (500 chars max)
- **Error Handling**: Field-specific error display
- **Success Feedback**: Confirmation message
- **API Integration**: Calls `/api/communications/contact/`

### Order Processing
- **Automatic**: Every order automatically adds email to system
- **Source Tracking**: Marked as "order" source
- **User Linking**: Links to authenticated users
- **Activity Counting**: Increments order count for existing emails

## Data Flow

### New Email Subscription
1. User enters email in popup
2. Frontend validates format
3. API call to `/api/communications/subscribe/`
4. Creates/updates `EmailSubscription` record
5. Adds/updates `EmailList` entry with source and counts
6. Returns success/error response

### Contact Form Submission
1. User fills contact form
2. Frontend validates all fields
3. API call to `/api/communications/contact/`
4. Creates `ContactMessage` record
5. Adds/updates `EmailList` entry with source and counts
6. Returns success/error response

### Order Email Collection
1. Order creation process
2. Automatic call to `add_to_email_list()` utility
3. Creates/updates `EmailList` entry
4. Increments order count
5. Links to user if authenticated

## Export Features

### CSV Export Options
- **Email Subscriptions**: Email, source, status, date, user
- **Contact Messages**: Name, email, message, status, date, user, admin notes
- **Email List**: Email, name, sources, activity counts, status, dates

### Export File Naming
- Format: `{type}_{YYYYMMDD_HHMMSS}.csv`
- Examples: 
  - `email_subscriptions_20231203_143022.csv`
  - `contact_messages_20231203_143045.csv`
  - `email_list_20231203_143102.csv`

## Security & Privacy

### Data Protection
- **Email Validation**: Server-side validation using Django's EmailValidator
- **Sanitization**: All inputs sanitized and validated
- **CSRF Protection**: All endpoints protected against CSRF attacks
- **Permission Classes**: Uses AllowAny for public forms

### Privacy Features
- **Unsubscribe**: Users can unsubscribe via API
- **Data Tracking**: Transparent source tracking
- **User Control**: Admin can deactivate emails
- **Soft Deletes**: Unsubscribe sets inactive flag rather than deleting

## Future Enhancements

### Planned Features
1. **Email Templates**: Newsletter and notification templates
2. **Bulk Email Sending**: Integration with email service providers
3. **Segmentation**: Advanced filtering and segmentation tools
4. **Analytics**: Email engagement tracking
5. **Automation**: Automated welcome series and follow-ups
6. **GDPR Compliance**: Enhanced privacy controls
7. **Double Opt-in**: Email confirmation for subscriptions

### Integration Opportunities
- **Newsletter Service**: Mailchimp, SendGrid, etc.
- **CRM Integration**: Customer relationship management
- **Analytics**: Google Analytics event tracking
- **Marketing Automation**: Automated email campaigns

## Usage Statistics

After implementation:
- **16 existing order emails** automatically synced to consolidated list
- **All future orders** will automatically capture emails
- **Subscription popup** now functional with database storage
- **Contact form** now saves all messages for admin review
- **Comprehensive admin interface** for email management

## File Structure

```
communications/
├── models.py              # Database models
├── admin.py              # Admin interface configuration
├── views.py              # API views
├── urls.py               # URL patterns
├── utils.py              # Utility functions
├── management/
│   └── commands/
│       └── sync_order_emails.py  # Management command
└── migrations/
    └── 0001_initial.py   # Database migration
```

## Testing

### API Testing Examples
```bash
# Test subscription
curl -X POST "http://localhost:8000/api/communications/subscribe/" \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "source": "popup"}'

# Test contact form
curl -X POST "http://localhost:8000/api/communications/contact/" \
     -H "Content-Type: application/json" \
     -d '{"name": "John Doe", "email": "john@example.com", "message": "Test message"}'
```

### Admin Access
1. Navigate to `/admin/`
2. Login with admin credentials
3. Access "Communications" section:
   - Email Subscriptions
   - Contact Messages
   - Email List

This implementation provides a complete email communications infrastructure that grows with your business needs while maintaining data integrity and user privacy. 