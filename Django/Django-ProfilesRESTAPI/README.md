# Django-ProfilesRESTAPI

## Overview
Django-ProfilesRESTAPI is a RESTful API project built using Django and Django REST framework. The API allows for the management of user profiles, including functionalities for user registration, profile updates, authentication, and CRUD operations on user data.

## Features
- **User Registration:** Create new user profiles.
- **User Authentication:** Secure user login using token-based authentication.
- **Profile Management:** Perform CRUD (Create, Read, Update, Delete) operations on user profiles.
- **Token Authentication:** Secure endpoints with token-based access.
- **Browsable API:** User-friendly API browsing and testing interface provided by Django REST framework.

## Requirements
- Python 3.x
- Django 3.x
- Django REST framework

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/mohammadrezachegini/Django-ProfilesRESTAPI.git
    cd Django-ProfilesRESTAPI
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

## Usage

- **Access the API:**
  Open your browser and navigate to `http://127.0.0.1:8000/` to access the browsable API interface.

- **Register a New User:**
  Send a POST request to `/api/profile/` with the required fields.

- **Authentication:**
  Obtain a token by sending a POST request with valid credentials to `/api/auth-token/`.

- **Manage Profiles:**
  Use the token to perform CRUD operations on user profiles via `/api/profile/`.

## API Endpoints

- **Registration:**
  - `POST /api/profile/` - Create a new user profile.

- **Authentication:**
  - `POST /api/auth-token/` - Obtain a token for an existing user.

- **Profile Management:**
  - `GET /api/profile/` - List all user profiles.
  - `GET /api/profile/<id>/` - Retrieve a specific user profile.
  - `PUT /api/profile/<id>/` - Update a user profile.
  - `DELETE /api/profile/<id>/` - Delete a user profile.

## Project Structure

- `profiles_api/`: Contains the main app code including models, views, serializers, and URLs.
- `profiles_project/`: The main project folder containing settings and configuration files.
- `requirements.txt`: Lists the Python dependencies for the project.
- `manage.py`: Django's command-line utility for administrative tasks.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Django](https://www.djangoproject.com/)
- [Django REST framework](https://www.django-rest-framework.org/)
