# Authentication and Authorization

This document describes the authentication and authorization mechanisms used in the WebSCADA system.

## Overview

WebSCADA uses a multi-layered authentication approach:

1. **User Authentication**: JWT-based authentication for web users
2. **API Key Authentication**: Long-lived keys for devices and integrations
3. **OAuth 2.0**: Third-party authentication (Google, GitHub)
4. **Session Management**: Redis-based session storage

## User Authentication

### JWT (JSON Web Tokens)

**Flow:**
```
┌──────────┐                ┌──────────┐
│  Client  │                │  Backend │
└────┬─────┘                └────┬─────┘
     │                           │
     │ POST /api/auth/login      │
     │ { email, password }       │
     ├──────────────────────────>│
     │                           │ Verify credentials
     │                           │ Generate JWT
     │                           │
     │ { token, user }           │
     │<──────────────────────────┤
     │                           │
     │ GET /api/devices          │
     │ Authorization: Bearer ... │
     ├──────────────────────────>│
     │                           │ Verify JWT
     │                           │ Extract user
     │ { devices: [...] }        │
     │<──────────────────────────┤
```

### Login Endpoint

**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  },
  "expiresIn": 3600
}
```

### JWT Token Structure

```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1700000000,
  "exp": 1700003600
}
```

**Token Expiration:**
- Access Token: 1 hour
- Refresh Token: 7 days

### Refresh Token Flow

**POST** `/api/auth/refresh`

**Request:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:**
```json
{
  "token": "new-access-token",
  "expiresIn": 3600
}
```

### Logout

**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Effect:**
- Invalidates refresh token
- Adds access token to Redis blacklist
- Clears session data

## API Key Authentication

### Creating API Keys

**POST** `/api/settings/api-keys`

**Request:**
```json
{
  "name": "Production Device Integration",
  "permissions": ["devices:read", "devices:write", "telemetry:write"],
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "id": "key-123",
  "name": "Production Device Integration",
  "key": "wss_api_1234567890abcdefghijklmnopqrstuvwxyz",
  "permissions": ["devices:read", "devices:write", "telemetry:write"],
  "createdAt": "2025-11-25T10:00:00Z",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Important**: The API key is shown only once. Store it securely.

### Using API Keys

**Headers:**
```
X-API-Key: wss_api_1234567890abcdefghijklmnopqrstuvwxyz
```

**Example:**
```bash
curl -H "X-API-Key: wss_api_1234567890abcdefghijklmnopqrstuvwxyz" https://api.example.com/devices
```

### API Key Permissions

Available permissions:
- `devices:read` - Read device data
- `devices:write` - Create/update devices
- `devices:delete` - Delete devices
- `telemetry:read` - Read telemetry data
- `telemetry:write` - Write telemetry data
- `alarms:read` - Read alarms
- `alarms:write` - Acknowledge/update alarms
- `users:read` - Read user data (admin only)
- `users:write` - Create/update users (admin only)

## OAuth 2.0 Integration

### Supported Providers

- Google
- GitHub
- Microsoft (future)

### OAuth Flow

**GET** `/api/oauth/google`

Redirects to Google OAuth consent screen.

**Callback:** `/api/oauth/google/callback`

**Query Parameters:**
```
?code=authorization-code&state=random-state
```

**Flow:**
```
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent
3. User authorizes application
4. Google redirects to callback with code
5. Backend exchanges code for access token
6. Backend creates/updates user account
7. Backend generates JWT token
8. Redirect to frontend with token
```

### OAuth Endpoints

**GET** `/api/oauth/:provider`
- Initiates OAuth flow
- Redirects to provider

**GET** `/api/oauth/:provider/callback`
- Handles OAuth callback
- Exchanges code for token
- Creates/updates user
- Returns JWT

## Role-Based Access Control (RBAC)

### User Roles

1. **Admin**
   - Full system access
   - User management
   - System configuration

2. **Operator**
   - Device management
   - View telemetry
   - Acknowledge alarms

3. **Viewer**
   - Read-only access
   - View devices and telemetry
   - Cannot modify anything

### Permission Checking

**Backend (Fastify):**
```typescript
// Middleware
async function requireRole(role: UserRole) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || request.user.role !== role) {
      return reply.code(403).send({ error: 'Insufficient permissions' });
    }
  };
}

// Usage
app.delete('/api/users/:id', {
  preHandler: requireRole('admin'),
}, async (request, reply) => {
  // Only admins can delete users
});
```

**Frontend (React):**
```typescript
function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  return user?.permissions.includes(permission) ?? false;
}

// Usage
function DeleteButton({ userId }: Props) {
  const canDelete = usePermission('users:delete');

  if (!canDelete) return null;

  return <button onClick={() => deleteUser(userId)}>Delete</button>;
}
```

## Session Management

### Session Storage (Redis)

**Structure:**
```
session:{userId}:{sessionId} -> {
  userId: string;
  createdAt: Date;
  lastActive: Date;
  ipAddress: string;
  userAgent: string;
}
```

**TTL:** 7 days (sliding expiration)

### Active Sessions Endpoint

**GET** `/api/auth/sessions`

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-123",
      "createdAt": "2025-11-20T10:00:00Z",
      "lastActive": "2025-11-25T15:30:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "current": true
    }
  ]
}
```

### Revoke Session

**DELETE** `/api/auth/sessions/:sessionId`

Revokes a specific session, logging the user out from that device.

## Security Best Practices

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Password Hashing

Using **bcrypt** with 10 rounds:

```typescript
import bcrypt from 'bcrypt';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Rate Limiting

**Login Endpoint:**
- Max 5 attempts per 15 minutes per IP
- Account lockout after 10 failed attempts

**API Key Usage:**
- 1000 requests per hour per key
- Configurable per key

### Token Security

1. **JWT Signing**: HS256 algorithm with strong secret
2. **Refresh Token Rotation**: New refresh token on each use
3. **Token Blacklist**: Revoked tokens stored in Redis
4. **HTTPS Only**: All tokens transmitted over HTTPS
5. **HttpOnly Cookies**: Refresh tokens in HttpOnly cookies

## Multi-Factor Authentication (MFA)

### TOTP (Time-Based One-Time Password)

**Coming Soon**

Features:
- QR code generation for authenticator apps
- Backup codes for recovery
- Optional enforcement per user or organization

## Device Authentication

### Device Registration

**POST** `/api/devices/register`

**Request:**
```json
{
  "deviceId": "esp32-001",
  "name": "Temperature Sensor 1",
  "protocol": "mqtt",
  "registrationToken": "temp-registration-token"
}
```

**Response:**
```json
{
  "deviceId": "esp32-001",
  "apiKey": "wss_device_1234567890abcdefghijklmnopqrstuvwxyz",
  "mqttCredentials": {
    "username": "esp32-001",
    "password": "secure-password"
  }
}
```

### Device API Key Usage

**Device to Backend:**
```typescript
// HTTP
fetch('https://api.example.com/devices/esp32-001/telemetry', {
  method: 'POST',
  headers: {
    'X-API-Key': 'wss_device_1234567890abcdefghijklmnopqrstuvwxyz',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ temperature: 25.5 }),
});

// MQTT
// username: esp32-001
// password: secure-password
```

## Audit Logging

All authentication events are logged:

- User login/logout
- Failed login attempts
- API key creation/revocation
- Permission changes
- Session revocation

**Log Structure:**
```json
{
  "timestamp": "2025-11-25T10:00:00Z",
  "event": "user.login",
  "userId": "user-123",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "success": true
}
```

## Testing Authentication

### Example Test Suite

```typescript
import { describe, it, expect } from 'vitest';

describe('Authentication', () => {
  it('should login with valid credentials', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    });

    expect(response.status).toBe(401);
  });
});
```

## Troubleshooting

### Common Issues

**"Invalid token" errors:**
- Token may have expired (check `exp` claim)
- Token may be blacklisted (user logged out)
- Invalid signature (check JWT_SECRET)

**API key not working:**
- Key may have expired
- Insufficient permissions
- Rate limit exceeded

**OAuth callback fails:**
- Check redirect URI configuration
- Verify OAuth app credentials
- Ensure state parameter matches

---

**Last Updated**: 2025-11-25
