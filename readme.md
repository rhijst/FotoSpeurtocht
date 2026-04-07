# API Endpoints Overview

This document lists all currently available endpoints for the Photo Prestiges microservices.

---

## Register Service (Auth)

Base URL: http://localhost:3001

### Health Check
GET /status

Response:
{
  "status": "running"
}

---

### Register User
POST /auth/register

Body:
{
  "email": "user@example.com",
  "password": "Password123!",
  "role": "participant"
}

Response:
{
  "id": "user-id",
  "email": "user@example.com",
  "role": "participant"
}

---

### Login
POST /auth/login

Body:
{
  "email": "user@example.com",
  "password": "Password123!"
}

Response:
{
  "token": "JWT_TOKEN"
}

---

## Target Service

Base URL: http://localhost:3002

### Health Check
GET /status

Response:
{
  "status": "Target service running"
}

---

### Create Target
POST /targets  
Authentication: Required (Bearer Token)  
Content-Type: multipart/form-data

Fields:
- title (string)
- description (string)
- locationName (string)
- lat (number)
- lng (number)
- radius (number)
- deadline (date)
- image (file)

---

### Get All Targets
GET /targets

Response:
Returns all targets.

---

### Delete Target
DELETE /targets/{targetId}  
Authentication: Required (Bearer Token)  
Authorization: Only owner can delete

---

### Get Image
GET /uploads/{filename}

Example:
http://localhost:3002/uploads/example.jpg

---

## Notes

- All protected routes require a JWT token from the Register Service.
- Include the token in headers:

Authorization: Bearer <JWT_TOKEN>
