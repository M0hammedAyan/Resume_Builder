# Resume Builder Authentication API

Complete Node.js + Express authentication system with JWT tokens.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your values:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/resume-builder
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

4. Start MongoDB (if running locally)

5. Run the server:
```bash
npm run dev
```

## API Endpoints

### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

### Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   └── authController.js  # Auth logic (register, login, getMe)
├── middleware/
│   └── auth.js            # JWT verification middleware
├── models/
│   └── User.js            # User model with password hashing
├── routes/
│   └── auth.js            # Auth routes
├── .env.example           # Environment variables template
├── package.json           # Dependencies
└── server.js              # Express app entry point
```

## Features

✅ User registration with email validation
✅ Password hashing with bcrypt (12 rounds)
✅ JWT token generation
✅ Login with email/password
✅ Protected routes with JWT middleware
✅ Get current user endpoint
✅ Proper error handling
✅ Environment variables for secrets
✅ CORS enabled

## Using Protected Routes

To protect any route, add the `protect` middleware:

```javascript
const { protect } = require('./middleware/auth')

router.get('/protected-route', protect, (req, res) => {
  // req.user is available here
  res.json({ user: req.user })
})
```

## Testing with cURL

Register:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Get Me:
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
