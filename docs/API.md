# TaskZip API Documentation

Base URL: `http://localhost:4000`

## Authentication
### Register
**POST** `/auth/register`

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Test User",
  "phone": "+123456789" 
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "isEmailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "profile": {
      "id": "uuid",
      "userId": "uuid",
      "fullName": "Test User",
      "avatarPath": null,
      "avatarUrl": null,
      "phone": "+123456789",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "accessToken": "jwt"
}
```

### Login
**POST** `/auth/login`

Request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response: same shape as register.

### Forgot password
**POST** `/auth/forgot-password`

Request body:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "message": "If the account exists, a reset link has been sent."
}
```

### Reset password
**POST** `/auth/reset-password`

Request body:
```json
{
  "token": "reset-token",
  "newPassword": "newPassword123"
}
```

Response: same shape as register.

### Current user
**GET** `/auth/me`

Headers:
```
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "isEmailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "profile": {
      "id": "uuid",
      "userId": "uuid",
      "fullName": "Test User",
      "avatarPath": null,
      "avatarUrl": null,
      "phone": "+123456789",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Profile
### Upload avatar
**POST** `/profile/avatar`

Headers:
```
Authorization: Bearer <accessToken>
```

Form data:
- `avatar` (file): jpg, jpeg, png, webp (max 5MB)

Response:
```json
{
  "profile": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "Test User",
    "avatarPath": "avatars/uuid/file.png",
    "avatarUrl": "https://<supabase>/storage/v1/object/public/...",
    "phone": "+123456789",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Admin
### Ping
**GET** `/admin/ping`

Headers:
```
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "message": "Admin access granted"
}
```

## Health
### Test connections
**GET** `/health/test`

Response:
```json
{
  "status": "ok",
  "database": {
    "ok": true,
    "latencyMs": 3
  },
  "supabase": {
    "ok": true,
    "error": null
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error responses
All errors return:
```json
{
  "message": "Human-readable message"
}
```
