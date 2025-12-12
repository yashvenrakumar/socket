# Socket Backend

Backend application built with Node.js and TypeScript, featuring a clean architecture with routers, middleware, controllers, models, services, and utilities.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (Swagger, etc.)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models
│   ├── routers/         # Route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── dist/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── nodemon.json
```

## Features

- ✅ TypeScript for type safety
- ✅ Express.js web framework
- ✅ Socket.IO for real-time communication
- ✅ Swagger/OpenAPI documentation
- ✅ Nodemon for development
- ✅ Standardized response utility
- ✅ Error handling middleware
- ✅ Request logging
- ✅ Clean architecture (Router → Controller → Service → Model)
- ✅ Room-based Socket.IO messaging by conversationId

## Installation

```bash
npm install
```

## Development

Run the development server with nodemon:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Production

Run the compiled JavaScript:

```bash
npm start
```

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/api-docs`
- Health Check: `http://localhost:3000/health`

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update user by ID
- `DELETE /api/users/:id` - Delete user by ID

### Webhooks

- `POST /api/webhooks` - Receive webhook event from third party

### Socket.IO

- `GET /api/socket/stats` - Get Socket.IO connection statistics

## Environment Variables

Create a `.env` file in the root directory:

```
PORT=3000
NODE_ENV=development
```

## Architecture

### Router
Defines API routes and connects them to controllers. Includes Swagger annotations.

### Controller
Handles HTTP requests and responses. Validates input and calls services.

### Service
Contains business logic. Interacts with models and data sources.

### Model
Defines data structures and types.

### Middleware
- Request Logger: Logs all incoming requests
- Error Handler: Centralized error handling
- Not Found Handler: Handles 404 errors

### Utils
- ResponseUtil: Standardized API response format
- Logger: Logging utility

## Example Request

### Users

```bash
# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Get all users
curl http://localhost:3000/api/users

# Get user by ID
curl http://localhost:3000/api/users/1
```

### Webhooks

```bash
# Receive a webhook event (Payment example)
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment.completed",
    "source": "stripe",
    "data": {
      "payment_id": "pay_1234567890",
      "amount": 1000,
      "currency": "usd",
      "status": "completed"
    },
    "metadata": {
      "version": "1.0",
      "signature": "sig_abc123"
    }
  }'

# Receive a webhook event (User example)
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user.created",
    "source": "auth0",
    "data": {
      "user_id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }'
```

## Socket.IO Real-Time Events

The backend uses Socket.IO to broadcast webhook events to connected clients based on `conversationId`. Events are organized into rooms where multiple users can subscribe to the same conversation.

### Architecture Flow

```
Third Party Events → POST /api/webhooks → Backend Processes → Socket.IO Room (conversationId) → Connected Clients
```

### Room-Based Messaging

- Each `conversationId` creates a unique Socket.IO room
- Multiple users can join the same room (same `conversationId`)
- Webhook events are automatically emitted to the appropriate room
- Supports high-volume event processing (10,000+ events)

### Frontend Integration Example

```javascript
import io from 'socket.io-client';

// Connect to Socket.IO server
const socket = io('http://localhost:3000');

// Join a conversation room
socket.emit('join-conversation', '123'); // conversationId = 123

// Listen for webhook events in this conversation
socket.on('webhook-event', (event) => {
  console.log('Received webhook event:', event);
  // Handle the event
});

// Listen for join confirmation
socket.on('joined-conversation', (data) => {
  console.log('Joined conversation:', data.conversationId);
});

// Leave a conversation
socket.emit('leave-conversation', '123');

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### Socket.IO Events

**Client → Server:**
- `join-conversation` - Join a conversation room by conversationId
- `leave-conversation` - Leave a conversation room
- `ping` - Health check

**Server → Client:**
- `webhook-event` - Webhook event received for the conversation
- `joined-conversation` - Confirmation of joining a room
- `left-conversation` - Confirmation of leaving a room
- `pong` - Response to ping
- `error` - Error message

### Example Scenario

```
conversationId=123  →  Room 123  →  Socket A, B, C (3 users)
conversationId=234  →  Room 234  →  Socket D (1 user)
conversationId=555  →  Room 555  →  Socket E, F (2 users)
```

When a webhook event with `conversationId=123` is received:
- All 3 users (A, B, C) in Room 123 will receive the event
- Users in other rooms will NOT receive this event

### Get Socket.IO Statistics

```bash
curl http://localhost:3000/api/socket/stats
```

### Chat JSON Database

Save a chat message into `src/database/db.json` grouped by `conversationId`:

```bash
curl -X 'POST' \
  'http://localhost:3000/api/chat/messages' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "conversationId": "conv-123",
  "message": "Hello from REST API",
  "username": "Agent-1",
  "socketId": "abcd1234",
  "file": {
    "id": "string",
    "name": "string",
    "type": "string",
    "size": 0,
    "url": "string",
    "thumbnailUrl": "string"
  }
}'
```

Get all conversations and their messages:

```bash
curl -X 'GET' \
  'http://localhost:3000/api/chat/messages' \
  -H 'accept: application/json'
```

Get messages for a specific `conversationId`:

```bash
curl -X 'GET' \
  'http://localhost:3000/api/chat/messages?conversationId=conv-123' \
  -H 'accept: application/json'
```

Get all conversations and their full message arrays (`conversations` object exactly as stored in `src/database/db.json`):

```bash
curl -X 'GET' \
  'http://localhost:3000/api/chat/conversations' \
  -H 'accept: application/json'
```

Get aggregated analytics derived from `src/database/db.json`:

```bash
curl -X 'GET' \
  'http://localhost:3000/api/chat/analytics' \
  -H 'accept: application/json'
```

Get chat messages for a specific conversation ID:

```bash
curl -X 'GET' \
  'http://localhost:3000/api/chat/conversations/conv-123' \
  -H 'accept: application/json'
```

### Feedback

Submit feedback for a conversation:

```bash
curl -X 'POST' \
  'http://localhost:3000/api/chat/feedback' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "conversationId": "conv-123",
  "username": "Agent-1",
  "rating": 4,
  "description": "Great service, very helpful!"
}'
```

Get all feedback or filter by conversation ID (using query parameter):

```bash
# Get all feedback
curl -X 'GET' \
  'http://localhost:3000/api/chat/feedback' \
  -H 'accept: application/json'

# Get feedback for a specific conversation
curl -X 'GET' \
  'http://localhost:3000/api/chat/feedback?conversationId=conv-123' \
  -H 'accept: application/json'
```

Get feedback for a specific conversation ID (using path parameter):

```bash
curl -X 'GET' \
  'http://localhost:3000/api/chat/feedback/conv-123' \
  -H 'accept: application/json'
```

