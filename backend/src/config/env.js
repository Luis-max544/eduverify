import 'dotenv/config';

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'FRONTEND_URL'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not set — password reset emails will fail');
}

export const env = {
  port: Number(process.env.PORT) || 3001,
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  },
  jwtSecret: process.env.JWT_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  email: {
    from: process.env.EMAIL_FROM || 'EduVerify <onboarding@resend.dev>',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  geminiKey: process.env.GEMINI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-2.5-flash',
  minio: {
    endPoint:  process.env.MINIO_ENDPOINT  || 'localhost',
    port:      Number(process.env.MINIO_PORT) || 9000,
    useSSL:    process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket:    process.env.MINIO_BUCKET    || 'eduverify-media',
    publicUrl: process.env.MINIO_PUBLIC_URL || '',
  },
};
