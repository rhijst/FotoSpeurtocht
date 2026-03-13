# Target Service

The **Target Service** is responsible for managing photo targets in the Photo Prestiges application.
A target represents the **original photo challenge** created by a target owner. Participants must try to recreate this photo as accurately as possible.

This service allows users to create, view, and delete targets. Each target includes an image, location information, and a deadline.

The service is part of a **microservices architecture** and communicates with other services such as the Register Service (authentication) and Score Service.


# Features

* Create a new photo target
* Upload a target image
* Retrieve all available targets
* Delete a target (only by the owner)
* Store target metadata in MongoDB
* Serve uploaded images via URL
* JWT-based authentication


# Technologies

* Node.js
* Express
* MongoDB
* Mongoose
* Multer (file uploads)
* JSON Web Tokens (JWT)
* Docker
* Docker Compose


# Environment Variables

Create a `.env` file in the project root.

Example:

PORT=3002
MONGO_URI=mongodb://mongo:27017/targetdb
JWT_SECRET=supersecret
APP_URL=http://localhost:3002


# Running the Service

## Start with Docker

Build and start the containers:

docker compose up --build

The service will be available at:

http://localhost:3002

---

# API Endpoints

## Health Check

GET /status

Response:

{
"status": "Target service running"
}


# Create Target

POST /targets

Authentication required (JWT).

Headers:

Authorization: Bearer <token>

Content-Type:

multipart/form-data

Fields:

* title: (string)
* description: (string)
* locationName: (string)
* lat: (number)
* lng: (number)
* radius: (number)
* deadline: (date)
* image: (file)

Example response:

{
"_id": "target-id",
"ownerId": "user-id",
"title": "Example Target",
"description": "Example description",
"coordinates": {
"lat": 50,
"lng": 50
},
"radius": 50,
"imageUrl": "http://localhost:3002/uploads/example.jpg",
"deadline": "2026-05-06T00:00:00.000Z"
}


# Get All Targets

GET /targets

Returns all available targets.


# Delete Target

DELETE /targets/{targetId}

Authentication required.

Only the owner of the target is allowed to delete it.


# Image Storage

Uploaded images are stored in the `uploads/` directory.

Images are served via:

/uploads/{filename}

Example:

http://localhost:3002/uploads/example.jpg

A Docker volume is used to persist uploaded images between container restarts.


# Database Schema

Targets are stored in MongoDB with the following structure:

* ownerId
* title
* description
* locationName
* coordinates (lat, lng)
* radius
* imageUrl
* deadline
* createdAt
* updatedAt


# Role in the System

The Target Service is responsible for managing competitions.

Other services interact with it as follows:

Register Service
→ provides authentication tokens

Score Service
→ calculates similarity scores for submitted images

Clock Service
→ monitors deadlines for targets

Mail Service
→ sends notifications about deadlines and results


# Development

Install dependencies:

npm install

Run locally:

npm run dev


# Testing

The API can be tested using:

* Postman
* Insomnia
* curl

Example:

curl -X GET http://localhost:3002/status
