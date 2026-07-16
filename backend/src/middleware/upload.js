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

// PDF upload middleware
const ALLOWED_PDF = ['application/pdf'];

function makePdfStorage() {
  return multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(process.cwd(), 'uploads', 'pdfs');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const uniq = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      cb(null, `${uniq}.pdf`);
    },
  });
}

const pdfFilter = (req, file, cb) => {
  if (ALLOWED_PDF.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Solo se permiten archivos PDF'));
};

export const uploadPdf = multer({
  storage: makePdfStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: pdfFilter,
}).single('pdf');

// Course cover image upload (keyed by playlist id)
function makeCoverStorage() {
  return multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(process.cwd(), 'uploads', 'covers');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${req.params.id}${ext}`);
    },
  });
}

export const uploadCover = multer({
  storage: makeCoverStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).single('cover');
