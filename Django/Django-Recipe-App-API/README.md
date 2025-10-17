# Django-Recipe-App-API

## Overview
Django-Recipe-App-API is a web application built using Django and Django REST framework to manage recipes. This project includes functionalities for creating, updating, retrieving, and deleting recipes, as well as managing ingredients and tags associated with recipes.

## Features
- **Recipe Management:** Create, read, update, and delete recipes.
- **Ingredient Management:** Add, view, update, and delete ingredients for recipes.
- **Tag Management:** Categorize recipes with tags.
- **Authentication:** Secure user authentication using token-based authentication.
- **Docker Support:** Run the application in a Docker container.

## Requirements
- Python 3.x
- Django 3.x
- Django REST framework
- Docker (optional, for containerization)

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/mohammadrezachegini/Django-Recipe-App-API.git
    cd Django-Recipe-App-API
    ```

2. **Create and activate a virtual environment:**
    ```sh
    python3 -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. **Install the required packages:**
    ```sh
    pip install -r requirements.txt
    ```

4. **Apply migrations:**
    ```sh
    python manage.py migrate
    ```

5. **Create a superuser (optional, for admin access):**
    ```sh
    python manage.py createsuperuser
    ```

6. **Run the development server:**
    ```sh
    python manage.py runserver
    ```

## Docker Setup (Optional)

1. **Build and run the Docker container:**
    ```sh
    docker-compose up --build
    ```

2. **Apply migrations inside the Docker container:**
    ```sh
    docker-compose run app sh -c "python manage.py migrate"
    ```

## Usage

- **Access the API:**
  Open your browser and navigate to `http://127.0.0.1:8000/` to access the browsable API interface.

- **Authentication:**
  Obtain a token by sending a POST request with valid credentials to `/api/auth/token/`.

- **Manage Recipes:**
  Use the token to perform CRUD operations on recipes via `/api/recipes/`.

## API Endpoints

- **Authentication:**
  - `POST /api/auth/token/` - Obtain a token for an existing user.

- **Recipe Management:**
  - `GET /api/recipes/` - List all recipes.
  - `POST /api/recipes/` - Create a new recipe.
  - `GET /api/recipes/<id>/` - Retrieve a specific recipe.
  - `PUT /api/recipes/<id>/` - Update a recipe.
  - `DELETE /api/recipes/<id>/` - Delete a recipe.

- **Ingredient Management:**
  - `GET /api/ingredients/` - List all ingredients.
  - `POST /api/ingredients/` - Create a new ingredient.
  - `GET /api/ingredients/<id>/` - Retrieve a specific ingredient.
  - `PUT /api/ingredients/<id>/` - Update an ingredient.
  - `DELETE /api/ingredients/<id>/` - Delete an ingredient.

- **Tag Management:**
  - `GET /api/tags/` - List all tags.
  - `POST /api/tags/` - Create a new tag.
  - `GET /api/tags/<id>/` - Retrieve a specific tag.
  - `PUT /api/tags/<id>/` - Update a tag.
  - `DELETE /api/tags/<id>/` - Delete a tag.

## Project Structure

- `app/`: Contains the main app code including models, views, serializers, and URLs.
- `.github/`: GitHub workflows and actions configurations.
- `Dockerfile`: Instructions to build the Docker image.
- `docker-compose.yaml`: Docker Compose configuration.
- `requirements.txt`: Lists the Python dependencies for the project.
- `requirements.dev.txt`: Lists the development dependencies.
- `manage.py`: Django's command-line utility for administrative tasks.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Django](https://www.djangoproject.com/)
- [Django REST framework](https://www.django-rest-framework.org/)
- [Docker](https://www.docker.com/)
