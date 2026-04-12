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
| [Mail-Service](#mail-service-port-3004) | 3004 | Async email notifications (RabbitMQ only) |
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

#### Get User By ID
```
GET /auth/users/:userId
Authorization: Bearer <token>
```
Response: User object.

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

#### Search Targets by Location Name
```
GET /targets/search?name=<location>
Authorization: Bearer <token>
```
Response: Array of matching target objects.

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

#### Get My Participations (Which targets did I join?)
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

#### Get My Submissions
```
GET /participants/submissions/me
Authorization: Bearer <token>
```
Response: Array of the authenticated user's submissions.

#### Get Submissions on My Targets
```
GET /participants/submissions/on-my-targets
Authorization: Bearer <token>
```
Response: Array of submissions made on targets owned by the authenticated user.

#### Delete a Submission
```
DELETE /participants/submissions/:id
Authorization: Bearer <token>
```
Response: `{ "message": "Submission deleted" }`

#### Remove Photo from Submission (reset to PENDING)
```
PATCH /participants/submissions/:id/remove-photo
Authorization: Bearer <token>
```
Removes the uploaded photo and resets submission status to `PENDING`.  
Response: Updated submission object.

---

### Scoring

#### Score Image by Upload
```
POST /score/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
Fields: `image` (file), `targetId`, optionally `language`, `limit`, `threshold`.

**Response:**
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
| GET | `/auth/users/:userId` | Get user by ID |

**RabbitMQ published:** `user.registered`

---

## Target-Service (Port 3002)

> Manages photo targets and stores reference images in MinIO. Only accessible internally via the gateway.

| Method | Path | Description |
|---|---|---|
| GET | `/status` | Health check |
| POST | `/targets` | Create a new target (multipart/form-data) |
| GET | `/targets` | Get all targets |
| GET | `/targets/search` | Search targets by location name |
| DELETE | `/targets/:id` | Delete a target (owner only) |

**RabbitMQ published:** `target.created`, `participant.join.result`  
**RabbitMQ consumed:** `participant.join.requested`, `target.deadline.reached`

---

## Score-Service (Port 3003)

> Analyzes submitted images using the Imagga AI API and calculates scores. Only accessible internally via the gateway.

| Method | Path | Description |
|---|---|---|
| GET | `/status` | Health check |
| POST | `/score/upload` | Score image by file upload |

**External API:** Imagga Tags API  
**RabbitMQ published:** `score.calculated`  
**RabbitMQ consumed:** `participant.submitted`, `target.created`

---

## Mail-Service (Port 3004)

> Sends email notifications via the Resend API. No HTTP endpoints — event-driven only.

**RabbitMQ consumed:**

| Event | Action |
|---|---|
| `user.registered` | Send welcome email |
| `deadline.reminder` | Send deadline reminder email |
| `contest.winner` | Send winner notification email |
| `contest.loser` | Send loser notification email |

---

## Register-Service (Port 3005)

> Tracks user participations and handles image submissions. Only accessible internally via the gateway.

| Method | Path | Description |
|---|---|---|
| GET | `/status` | Health check |
| POST | `/participants` | Join a target challenge |
| GET | `/participants/me` | Get current user's participations |
| POST | `/participants/submit` | Submit an image for a target |
| GET | `/participants/submissions/me` | Get current user's submissions |
| GET | `/participants/submissions/on-my-targets` | Get submissions on user's own targets |
| DELETE | `/participants/submissions/:id` | Delete a submission |
| PATCH | `/participants/submissions/:id/remove-photo` | Remove photo, reset status to PENDING |

**RabbitMQ published:** `participant.join.requested`, `participant.submitted`, `deadline.reminder`, `contest.winner`, `contest.loser`  
**RabbitMQ consumed:** `score.calculated`, `participant.join.result`, `target.deadline.reached`, `clock.reminder.tick`

---

## Clock-Service (Port 3006)

> Monitors target deadlines and publishes expiration events. No public HTTP endpoints.

| Method | Path | Description |
|---|---|---|
| GET | `/status` | Health check |

**RabbitMQ published:** `target.deadline.reached`, `clock.reminder.tick`  
**RabbitMQ consumed:** `target.created`

---

## RabbitMQ Events Reference

> Exchange: `events` (topic, durable). All queues are durable.

### Published Events

| Event / Routing Key | Publisher | Triggered By |
|---|---|---|
| `user.registered` | join-service | User registration |
| `target.created` | target-service | POST `/targets` |
| `participant.join.requested` | register-service | POST `/participants` |
| `participant.join.result` | target-service | Consuming `participant.join.requested` |
| `participant.submitted` | register-service | POST `/participants/submit` |
| `score.calculated` | score-service | Consuming `participant.submitted` |
| `target.deadline.reached` | clock-service | Scheduler (checks every 30s) |
| `clock.reminder.tick` | clock-service | Scheduler (48hr intervals before deadline) |
| `deadline.reminder` | register-service | Consuming `clock.reminder.tick` |
| `contest.winner` | register-service | Consuming `target.deadline.reached` |
| `contest.loser` | register-service | Consuming `target.deadline.reached` |

### Consumed Events

| Event / Routing Key | Consumer | Queue | Action |
|---|---|---|---|
| `user.registered` | mail-service | `mail-service.queue` | Send welcome email |
| `target.created` | score-service | `score-service.target.created` | Create baseline score for target image |
| `target.created` | clock-service | `clock-service.target.created` | Start tracking deadline |
| `participant.join.requested` | target-service | `target-service.participant.join` | Validate join request, publish `participant.join.result` |
| `participant.join.result` | register-service | `register-service.participant.result` | Update participant status (ACCEPTED/REJECTED) |
| `participant.submitted` | score-service | `score-service.submission` | Score submission image, publish `score.calculated` |
| `score.calculated` | register-service | `participant-service.score` | Update submission with calculated score |
| `target.deadline.reached` | register-service | `register-service.target.deadline.reached` | Determine winner, publish `contest.winner` / `contest.loser` |
| `target.deadline.reached` | target-service | `target-service.target.deadline` | Mark target `deadlineReached = true` |
| `clock.reminder.tick` | register-service | `register-service.clock.reminder.tick` | Publish `deadline.reminder` for participants without submission |
| `deadline.reminder` | mail-service | `mail-service.queue` | Send deadline reminder email |
| `contest.winner` | mail-service | `mail-service.queue` | Send winner notification email |
| `contest.loser` | mail-service | `mail-service.queue` | Send loser notification email |

---

## Key Data Flows

1. **User Registration** → `user.registered` → welcome email
2. **Target Creation** → `target.created` → score-service creates baseline, clock-service starts tracking deadline
3. **Joining a Target** → `participant.join.requested` → target-service validates → `participant.join.result` → register-service updates status
4. **Submitting a Photo** → `participant.submitted` → score-service evaluates → `score.calculated` → register-service stores score
5. **Deadline Reached** → `target.deadline.reached` → register-service determines winner → `contest.winner` / `contest.loser` → mail-service notifies participants
6. **Deadline Reminder** → `clock.reminder.tick` → register-service publishes `deadline.reminder` → mail-service sends reminder emails
