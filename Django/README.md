# Django REST API Projects

This repository contains two Django REST API projects for learning and development purposes.

## Projects Overview

### 1. Profiles REST API
A simple REST API for managing user profiles and status updates.

**Features:**
- User registration and authentication
- Profile management
- Status updates and feeds
- User search functionality
- Token-based authentication

### 2. Recipe App API
A more advanced REST API for managing recipes with Docker support.

**Features:**
- Recipe creation and management
- Ingredients and tags system
- User authentication
- Image upload for recipes
- Docker containerization
- PostgreSQL database
- CI/CD pipeline with GitHub Actions

## Technology Stack

**Common Technologies:**
- **Python** - Programming language
- **Django** - Web framework
- **Django REST Framework** - For building REST APIs
- **Token Authentication** - Secure API access

**Profiles API:**
- **SQLite** - Database (simple setup)

**Recipe API:**
- **PostgreSQL** - Database (production-ready)
- **Docker** - Containerization
- **Docker Compose** - Multi-container setup

## Quick Start Guide

### Option 1: Profiles API (Simple Setup)

```bash
# Clone repository
git clone https://github.com/mohammadrezachegini/Django-REST-APIs.git
cd Django-REST-APIs/Django-ProfilesRESTAPI

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Run server
python manage.py runserver
```

Access at: `http://127.0.0.1:8000/`

### Option 2: Recipe API (Docker Setup)

```bash
# Clone repository
git clone https://github.com/mohammadrezachegini/Django-REST-APIs.git
cd Django-REST-APIs/Django-Recipe-App-API

# Build and start with Docker
docker-compose up --build

# Create admin user (in new terminal)
docker-compose run --rm app sh -c "python manage.py createsuperuser"
```

Access at: `http://127.0.0.1:8000/`

## API Endpoints

### Authentication (Both Projects)
```bash
# Login and get token
POST /api/auth/token/
POST /api/login/  # Profiles API alternative
```

### Profiles API Endpoints
```bash
# User Management
POST /api/profile/              # Create user
GET /api/profile/               # List users
GET /api/profile/<id>/          # Get user
PUT /api/profile/<id>/          # Update user
DELETE /api/profile/<id>/       # Delete user

# Status Updates
GET /api/feed/                  # List status updates
POST /api/feed/                 # Create status
PUT /api/feed/<id>/             # Update status
DELETE /api/feed/<id>/          # Delete status
```

### Recipe API Endpoints
```bash
# Recipes
GET /api/recipe/recipes/        # List recipes
POST /api/recipe/recipes/       # Create recipe
GET /api/recipe/recipes/<id>/   # Get recipe
PUT /api/recipe/recipes/<id>/   # Update recipe
DELETE /api/recipe/recipes/<id>/ # Delete recipe

# Ingredients & Tags
GET /api/recipe/ingredients/    # List ingredients
POST /api/recipe/ingredients/   # Create ingredient
GET /api/recipe/tags/          # List tags
POST /api/recipe/tags/         # Create tag
```

## Example Usage

### 1. Create User (Profiles API)
```bash
curl -X POST http://127.0.0.1:8000/api/profile/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Login and Get Token
```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john@example.com",
    "password": "password123"
  }'
```

### 3. Create Recipe (Recipe API)
```bash
curl -X POST http://127.0.0.1:8000/api/recipe/recipes/ \
  -H "Authorization: Token your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Chocolate Cake",
    "description": "Delicious cake recipe",
    "time_minutes": 45,
    "price": 12.50
  }'
```

## Project Structure

```
Django-REST-APIs/
├── Django-ProfilesRESTAPI/         # Simple profile management
│   ├── profiles_api/               # Main app
│   ├── profiles_project/           # Project settings
│   ├── manage.py
│   └── requirements.txt
│
├── Django-Recipe-App-API/          # Advanced recipe management
│   ├── app/                        # Django application
│   │   ├── core/                   # User management
│   │   ├── recipe/                 # Recipe features
│   │   └── manage.py
│   ├── Dockerfile                  # Docker setup
│   ├── docker-compose.yaml
│   └── requirements.txt
```

## Which Project to Choose?

### Choose Profiles API if you want:
- Simple setup and learning
- Basic user management
- SQLite database
- Quick prototyping
- Learning Django REST basics

### Choose Recipe API if you want:
- Production-ready setup
- Docker containerization
- PostgreSQL database
- Advanced features
- CI/CD pipeline
- Image upload functionality

## Development Workflow

### For Profiles API:
```bash
# Activate virtual environment
source venv/bin/activate

# Run development server
python manage.py runserver

# Run tests
python manage.py test
```

### For Recipe API:
```bash
# Start development environment
docker-compose up

# Run tests
docker-compose run --rm app sh -c "python manage.py test"

# Check code quality
docker-compose run --rm app sh -c "flake8"
```

## Testing APIs

**Browser Testing:**
- Visit `http://127.0.0.1:8000/api/` for browsable API interface
- Django REST Framework provides interactive testing

**Command Line Testing:**
- Use `curl` commands (examples provided above)
- Test authentication and CRUD operations

**Tools:**
- **Postman** - GUI API testing
- **HTTPie** - Command line HTTP client
- **Python requests** - Programmatic testing

## Common Commands

### Profiles API:
```bash
python manage.py migrate          # Apply database changes
python manage.py createsuperuser  # Create admin user
python manage.py runserver        # Start development server
```

### Recipe API (Docker):
```bash
docker-compose up --build         # Build and start
docker-compose down               # Stop containers
docker-compose logs               # View logs
docker-compose run --rm app sh -c "command"  # Run commands
```

## Troubleshooting

**Common Issues:**

1. **Import errors**: Check virtual environment is activated
2. **Database errors**: Run migrations with `python manage.py migrate`
3. **Permission denied**: Ensure correct authentication token
4. **Port already in use**: Change port or stop other services
5. **Docker issues**: Ensure Docker is running and ports are available

## Learning Path

**Beginner**: Start with Profiles API
1. Set up virtual environment
2. Learn basic Django concepts
3. Understand REST API principles
4. Practice CRUD operations

**Intermediate**: Move to Recipe API
1. Learn Docker containerization
2. Work with PostgreSQL
3. Understand advanced Django features
4. Practice with CI/CD pipelines

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Docker Documentation](https://docs.docker.com/)
- [API Testing with Postman](https://learning.postman.com/)

