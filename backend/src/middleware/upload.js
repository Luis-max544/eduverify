import multer from 'multer';
import path from 'path';
import { minioClient, BUCKET } from '../config/minio.js';

const memory = multer({ storage: multer.memoryStorage() });

const imgFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipo de archivo no permitido. Use JPEG, PNG o WebP.'));
};

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Solo se permiten archivos PDF'));
};

const vttFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.vtt' || file.mimetype === 'text/vtt') cb(null, true);
  else cb(new Error('Solo se permiten archivos .vtt'));
};

export async function putToMinio(key, buffer, mimetype) {
  await minioClient.putObject(BUCKET, key, buffer, buffer.length, { 'Content-Type': mimetype });
  return key;
}

function ext(file) {
  return path.extname(file.originalname).toLowerCase() || '.jpg';
}

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imgFilter,
}).single('avatar');

export const uploadBanner = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imgFilter,
}).single('banner');

export const uploadCover = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imgFilter,
}).single('cover');

export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: pdfFilter,
}).single('pdf');

export const uploadThumbnail = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imgFilter,
}).single('thumbnail');

export const uploadSubtitles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: vttFilter,
}).single('subtitles');

// Key helpers
export const avatarKey  = (userId, file) => `avatars/${userId}${ext(file)}`;
export const bannerKey  = (userId, file) => `banners/${userId}${ext(file)}`;
export const coverKey   = (playlistId, file) => `covers/${playlistId}${ext(file)}`;
export const pdfKey     = (file) => `pdfs/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.pdf`;
export const thumbKey   = (videoId, file) => `thumbnails/${videoId}${ext(file)}`;
export const subsKey    = (videoId) => `subtitles/${videoId}.vtt`;
