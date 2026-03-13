# Register Service

The **Register Service** is responsible for user registration and authentication for the Photo Prestiges platform.
It allows participants and target owners to create accounts and log in to receive a JWT token used for authentication in other services.

This service is part of a **microservices architecture** for the Photo Prestiges application.


## Features

* User registration
* Secure password hashing using bcrypt
* User login with JWT authentication
* Role support (`participant` or `owner`)
* MongoDB database storage
* Docker container support


## Technologies

* Node.js
* Express
* MongoDB
* Mongoose
* JWT (jsonwebtoken)
* bcrypt
* Docker
* Docker Compose


## Environment Variables

Create a `.env` file in the root of the service.

Example:

PORT=3001
MONGO_URI=mongodb://mongo:27017/registerdb
JWT_SECRET=supersecret


## Running with Docker

Start the service and database:

docker compose up --build

The service will be available at:

http://localhost:3001


## API Endpoints

### Health Check

GET /status

Response:

{
"status": "running"
}

--- 

### Register User

POST /auth/register

Example request body:

{
"email": "[user@example.com](mailto:user@example.com)",
"password": "Password123!",
"role": "participant"
}

Response:

{
"id": "user-id",
"email": "[user@example.com](mailto:user@example.com)",
"role": "participant"
}

--- 

### Login

POST /auth/login

Example request body:

{
"email": "[user@example.com](mailto:user@example.com)",
"password": "Password123!"
}

Response:

{
"token": "JWT_TOKEN"
}


## Database

Users are stored in MongoDB with the following structure:

* id
* email
* password_hash
* role
* createdAt
* updatedAt

## Service Role in the System

The Register Service is responsible for:

* managing user accounts
* authenticating users
* issuing JWT tokens

Other services in the system (Target Service, Score Service, etc.) will use these tokens to authorize requests.


## Development

Run the service locally:

npm install
npm run dev
