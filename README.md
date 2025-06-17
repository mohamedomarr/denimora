# Denimora E-commerce

This is a decoupled e-commerce application with a Django backend and React frontend.

## Project Structure

- **Django Backend**: RESTful API server with JWT authentication
- **React Frontend**: Client-side application consuming the API

## Setup and Installation

### Backend (Django)

1. Navigate to the project root:
   ```
   cd /path/to/denimora
   ```

2. Create and activate a virtual environment:
   ```
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r Requirements.txt
   ```

4. **Database Setup** (Choose one):
   
   **Option A: PostgreSQL (Recommended for Production)**
   - Follow the [PostgreSQL Migration Guide](POSTGRESQL_MIGRATION.md)
   - Or run the automated setup: `python setup_postgresql.py`
   
   **Option B: SQLite (Development)**
   - Run migrations: `python manage.py migrate`

5. Run the development server:
   ```
   python manage.py runserver
   ```

The Django API will be available at http://localhost:8000/api/

## Database Configuration

This project supports both SQLite (for development) and PostgreSQL (for production):

- **SQLite**: Default configuration, no additional setup required
- **PostgreSQL**: See [POSTGRESQL_MIGRATION.md](POSTGRESQL_MIGRATION.md) for migration guide

### Environment Variables

For PostgreSQL, you can configure the database using environment variables:
```bash
export DB_NAME=denimora_db
export DB_USER=denimora_user
export DB_PASSWORD=denimora_password
export DB_HOST=localhost
export DB_PORT=5432
```

### Frontend (React)

1. Navigate to the React frontend directory:
   ```
   cd /path/to/denimora/React-Front-End
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The React application will be available at http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/token/`: Get JWT token pair (access and refresh tokens)
- `POST /api/token/refresh/`: Refresh access token
- `POST /api/users/register/`: Register a new user

### Products
- `GET /api/products/`: List all products (can filter by category)
- `GET /api/products/categories/`: List all categories
- `GET /api/products/{id}/{slug}/`: Get a specific product

### Cart
- `GET /api/cart/`: Get current cart
- `POST /api/cart/add/`: Add item to cart
- `DELETE /api/cart/remove/`: Remove item from cart
- `POST /api/cart/clear/`: Clear the cart

### Orders
- `GET /api/orders/`: List user orders (authenticated)
- `GET /api/orders/{id}/`: Get order details (authenticated)
- `POST /api/orders/create/`: Create a new order

### User Profile
- `GET /api/users/profile/`: Get user profile (authenticated)
- `PUT /api/users/profile/update/`: Update user profile (authenticated)

### Health Check
- `GET /api/health/`: Simple health check endpoint 