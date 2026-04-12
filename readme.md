# FotoSpeurtocht – API Endpoints Overview

A photo scavenger hunt application built as a Node.js microservices architecture. Users register, join photo challenges (targets), submit images, and receive AI-powered scores.

---

## Architecture

| Service | Port | Description |
|---|---|---|
| [Gateway](#gateway-port-3000) | 3000 | Public entry point – JWT auth, request routing |
| [Join-Service](#join-service-port-3001) | 3001 | User registration & credential verification |
| [Target-Service](#target-service-port-3002) | 3002 | Photo target CRUD & image storage |
| [Score-Service](#score-service-port-3003) | 3003 | AI-powered image scoring via Imagga |
| [Mail-Service](#mail-service) | 3004 | Async email notifications (RabbitMQ only) |
| [Register-Service](#register-service-port-3005) | 3005 | Participant management & submission handling |
| [Clock-Service](#clock-service-port-3006) | 3006 | Deadline scheduling |
| GUI | 8080 | Interface |

**Infrastructure:** MongoDB · MinIO (image storage) · RabbitMQ (async messaging)

---

## Authentication

All public-facing endpoints (except `/auth/login`, `/auth/register`, and `/status`) require a JWT Bearer token:

```
Authorization: Bearer <JWT_TOKEN>
```

Internal service-to-service communication uses the `x-internal-secret` header. Direct access to individual services from outside the gateway is not intended.

---

## Gateway (Port 3000)

> Public entry point. Verifies JWT tokens and proxies requests to the appropriate service.

### Health Check
```
GET /status
```
Response: `{ "status": "Gateway running" }`

---

### Authentication

#### Register
```
POST /auth/register
```
Body:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```
Response: `{ "id": "...", "email": "user@example.com" }`

#### Login
```
POST /auth/login
```
Body:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```
Response: `{ "token": "JWT_TOKEN" }`

---

### Targets

#### Create Target
```
POST /targets
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
Fields:

| Field | Type | Description |
|---|---|---|
| title | string | Name of the target |
| description | string | What participants need to photograph |
| locationName | string | Human-readable location name |
| lat | number | Latitude coordinate |
| lng | number | Longitude coordinate |
| radius | number | Allowed radius in meters |
| deadline | date | Submission deadline |
| image | file | Reference image for the target |

Response: Created target object with `imageUrl`, `coordinates`, `deadline`, etc.

#### Get All Targets
```
GET /targets
Authorization: Bearer <token>
```
Response: Array of all target objects.

#### Delete Target
```
DELETE /targets/:targetId
Authorization: Bearer <token>
```
Only the owner of a target can delete it.
Response: `{ "message": "Target and associated image deleted" }`

---

### Participants

#### Join a Target
```
POST /participants
Authorization: Bearer <token>
```
Body:
```json
{ "targetId": "..." }
```
Response: `{ "_id": "...", "userId": "...", "targetId": "...", "status": "PENDING" }`

#### Get My Participations (Which targets did i join?)
```
GET /participants/me
Authorization: Bearer <token>
```
Response: Array of the authenticated user's participations.

#### Submit Image for a Target
```
POST /participants/submit
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
Fields:

| Field | Type | Description |
|---|---|---|
| participationId | string | ID of the participation record |
| targetId | string | ID of the target |
| image | file | The submitted photo |

Response: `{ "_id": "...", "participationId": "...", "userId": "...", "targetId": "...", "imageUrl": "..." }`

---

### Scoring

#### Score Image by URL
```
POST /score/url
Authorization: Bearer <token>
```
Body:
```json
{
  "image_url": "https://...",
  "targetId": "...",
  "language": "en",
  "limit": 20,
  "threshold": 0
}
```

#### Score Image by Upload
```
POST /score/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
Fields: `image` (file), `targetId`, optionally `language`, `limit`, `threshold`.

**Response (both score endpoints):**
```json
{
  "similarity": 75.4,
  "speedBonus": 10,
  "finalScore": 62.3,
  "tags": [{ "tag": { "en": "dog" }, "confidence": 92.1 }]
}
```
Scoring formula: `similarity × 0.8 + speedBonus × 0.2`

---

## Join-Service (Port 3001)

> Handles user registration and credential verification. Only accessible internally via the gateway.

| Method | Path | Description |
|---|---|---|
| GET | `/status` | Health check |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/verify` | Verify credentials (internal only) |

**RabbitMQ events published:** `user.registered`

---

## Target-Service (Port 3002)

> Manages photo targets and stores reference images in MinIO. Only accessible internally via the gateway.

| Method | Path | Description |
|---|---|---|
| GET | `/status` | Health check |
| POST | `/targets` | Create a new target (multipart/form-data) |
| GET | `/targets` | Get all targets |
| DELETE | `/targets/:id` | Delete a target (owner only) |

**RabbitMQ events published:** `target.created`  
**RabbitMQ events consumed:** `participant.join.requested`, `participant.submitted`, deadline events

---

## Score-Service (Port 3003)

> Analyzes submitted images using the Imagga AI API and calculates scores. Only accessible internally via the gateway.

| Method | Path | Description |
|---|---|---|
| GET | `/status` | Health check |
| POST | `/score/url` | Score image by URL |
| POST | `/score/upload` | Score image by file upload |

**External API:** Imagga Tags API  
**RabbitMQ events consumed:** `participant.submitted` (triggers auto-scoring)

---

## Register-Service (Port 3005)

> Tracks user participations and handles image submissions. Only accessible internally via the gateway.

| Method | Path | Description |
|---|---|---|
| GET | `/status` | Health check |
| POST | `/participants` | Join a target challenge |
| GET | `/participants/me` | Get current user's participations |
| POST | `/participants/submit` | Submit an image for a target |

**RabbitMQ events published:** `participant.join.requested`, `participant.submitted`  
**RabbitMQ events consumed:** score results from score-service

---


## Clock-Service (Port 3006)

> Monitors target deadlines and publishes expiration events. No public HTTP endpoints.

| Method | Path | Description |
|---|---|---|
| GET | `/status` | Health check |

**RabbitMQ events published:** deadline expiration events  
**RabbitMQ events consumed:** `target.created`

---

## Mail-Service

> Sends email notifications via the Resend API. No HTTP endpoints — event-driven only.

**RabbitMQ events consumed:**
- `user.registered` – Welcome email
- `target.created` – Target creation confirmation
- `participant.submitted` – Submission confirmation
- Deadline events – Deadline warning/expiration emails
