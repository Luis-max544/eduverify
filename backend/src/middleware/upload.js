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
      cb(null, `${req.user.sub}${ext}`);
    },
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
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
}).single('avatar');

export const uploadBanner = multer({
  storage: makeStorage('banners'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).single('banner');
