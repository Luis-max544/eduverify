# File Uploads Specification — EduVerify

---

## Storage

Files stored on disk at `backend/uploads/`. Served statically at `/uploads/*`.

```
backend/uploads/
  avatars/    ← profile photos: {userId}.{ext}
  banners/    ← channel banners: {userId}.{ext}
```

Express config: `app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))`

Future migration path: swap `diskStorage` for a custom storage engine that writes to Cloudflare R2 or AWS S3 — only `middleware/upload.js` changes.

---

## Multer Configuration (`middleware/upload.js`)

```js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function makeStorage(subfolder) {
  return multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(process.cwd(), 'uploads', subfolder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${req.user.sub}${ext}`);  // overwrites previous file for same user
    }
  });
}

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Use JPEG, PNG o WebP.'));
  }
}

export const uploadAvatar = multer({
  storage: makeStorage('avatars'),
  limits: { fileSize: 2 * 1024 * 1024 },  // 2MB
  fileFilter
}).single('avatar');

export const uploadBanner = multer({
  storage: makeStorage('banners'),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter
}).single('banner');
```

---

## Endpoints

### `POST /api/users/me/avatar`
- Content-Type: `multipart/form-data`
- Field: `avatar`
- Max: 2MB
- After upload: update `users.avatar_path = 'avatars/{userId}.{ext}'`
- Response: `{ avatar_url: '/uploads/avatars/1.jpg' }`

### `POST /api/users/me/banner`
- Content-Type: `multipart/form-data`
- Field: `banner`
- Max: 5MB
- After upload: update `users.banner_path = 'banners/{userId}.{ext}'`
- Response: `{ banner_url: '/uploads/banners/1.jpg' }`

---

## Frontend changes (replacing base64)

### Before (Configuracion.jsx, PanelProfesor.jsx)
```js
const reader = new FileReader();
reader.readAsDataURL(file);
reader.onload = (e) => {
  localStorage.setItem(`eduverify_foto_${email}`, e.target.result);
};
```

### After
```js
const formData = new FormData();
formData.append('avatar', file);
const data = await apiFetch('/users/me/avatar', {
  method: 'POST',
  headers: {},  // let browser set Content-Type with boundary
  body: formData
});
setUsuario(prev => ({ ...prev, avatar_url: data.avatar_url }));
```

Note: `apiFetch` sets `Content-Type: application/json` by default — override with empty `headers: {}` when sending FormData, so the browser sets the correct multipart boundary automatically.

---

## URL construction in frontend

```js
// In api.js or a helper
export function mediaUrl(path) {
  if (!path) return null;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `${base}/uploads/${path}`;
}
```

Usage: `<img src={mediaUrl(usuario.avatar_path)} />`

Or: the API can return the full URL directly (`avatar_url: 'http://localhost:3001/uploads/avatars/1.jpg'`), which is simpler for the frontend.
