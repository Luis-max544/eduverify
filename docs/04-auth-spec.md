# Auth Specification — EduVerify

---

## JWT

### Payload shape
```json
{
  "sub": 1,
  "email": "user@utn.edu",
  "rol": "profesor",
  "premium": false,
  "iat": 1720000000,
  "exp": 1720604800
}
```

### Lifetime
7 days (`7d` in jsonwebtoken). No refresh token in MVP — user re-logs in on expiry.

### Signing
`JWT_SECRET` from `.env`. HS256 algorithm.

### Client storage
`localStorage('eduverify_session')` → `{ token: "eyJ...", user: { ...snapshot } }`

On app init: read session, if token present call `GET /api/users/me` to get fresh user data. On 401, clear session and redirect to login.

---

## Traditional Auth Flow

### Register
1. Client sends `POST /api/auth/registro` with `{ nombre, correo, password, rol }`
2. Server validates: email format, password min 8 chars, rol in allowed values
3. Hash password: `bcrypt.hash(password, 10)`
4. Insert into `users` table
5. Return 201 with `{ message: "Usuario creado exitosamente" }`

### Login
1. Client sends `POST /api/auth/login` with `{ correo, password }`
2. Server finds user by email
3. If no user or `password_hash` is null (Google-only): return 401 `"Credenciales inválidas"`
4. `bcrypt.compare(password, user.password_hash)`
5. If mismatch: return 401
6. Sign JWT: `jwt.sign({ sub: user.id, email, rol, premium }, JWT_SECRET, { expiresIn: '7d' })`
7. Return 200 with `{ token, user }` (user excludes `password_hash`)

---

## Google OAuth Flow

### Client side (Login.jsx — unchanged)
Google Identity Services SDK renders the sign-in button. On credential response, calls `handleCredentialResponse`.

### Migration change
Instead of client-side JWT decode, send credential to server:
```js
// Login.jsx — after migration
const data = await apiFetch('/auth/google', {
  method: 'POST',
  body: JSON.stringify({ credential: response.credential })
});
```

### Server side (`routes/auth.js`)
1. Receive `{ credential }`
2. Verify via Google tokeninfo:
   ```
   GET https://oauth2.googleapis.com/tokeninfo?id_token=<credential>
   ```
3. If response not 200 or `aud` doesn't match `GOOGLE_CLIENT_ID` env var: return 401
4. Extract: `{ sub, name, email, picture }`
5. Upsert: find user by `google_sub` or `email`. If not found, create with `password_hash: null`.
6. Sign JWT and return same shape as traditional login.

Env var needed: `GOOGLE_CLIENT_ID` — the same client ID used in the frontend's Google SDK script tag.

---

## Password Reset Flow

### Step 1 — Request reset
1. Client: `POST /api/auth/cambiar-password` `{ email }`
2. Server: find user by email. If not found, return 200 anyway (no email enumeration).
3. Generate token: `crypto.randomBytes(32).toString('hex')`
4. Insert into `reset_tokens`: `{ user_id, token, expires_at: NOW() + 1h, used: false }`
5. Send email via Nodemailer with link:
   ```
   https://<FRONTEND_URL>/?action=reset&id=<user_id>&token=<token>
   ```
6. Return 200.

### Step 2 — Update password
1. URL params parsed in App.jsx's useEffect → `paramsReset` state → Login component shows new password form.
2. Client: `POST /api/auth/actualizar-password` `{ id, token, password }`
3. Server: find token in `reset_tokens` where `user_id = id`, `token = token`, `used = false`, `expires_at > NOW()`
4. If not found or expired: return 400 `"Token inválido o expirado"`
5. Hash new password, update `users.password_hash`
6. Mark token `used = true`
7. Return 200.

---

## Auth Middleware (`middleware/auth.js`)

```js
export function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Token requerido' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, email, rol, premium }
    next();
  } catch {
    res.status(401).json({ status: 'error', message: 'Token inválido o expirado' });
  }
}
```

### Role guard helper
```js
export function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ status: 'error', message: 'Acceso no autorizado' });
    }
    next();
  };
}
```

Usage: `router.post('/videos', verifyToken, requireRol('profesor', 'creador'), handler)`

---

## Error codes

| Status | Meaning |
|--------|---------|
| 401 | No token, invalid token, wrong credentials |
| 403 | Valid token but insufficient role |
| 400 | Invalid input (validation errors) |
| 404 | Resource not found |
| 409 | Conflict (email already registered) |
