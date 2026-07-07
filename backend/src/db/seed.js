import 'dotenv/config';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db, pool } from '../config/db.js';
import {
  users, videos, comments, commentLikes,
  playlists, playlistVideos,
  profesorPlaylists, profesorPlaylistVideos,
  courseEnrollments, lessonProgress, courseReviews,
  subscriptions, notifications, favorites, history,
  quizzes, quizQuestions,
} from './schema.js';

// ─── CONFIG ──────────────────────────────────────────────────────────────────

faker.seed(42);

const SCALES = {
  medium:  { users: 100, videos: 500 },
  large:   { users: 300, videos: 1500 },
  massive: { users: 800, videos: 4000 },
};
const S = SCALES[process.env.SEED_SCALE] || SCALES.medium;

const DEMO_PASS = 'Demo1234!';
const CHUNK = 500;
const CATEGORIAS = ['Programación', 'Ciberseguridad', 'Matemáticas', 'Electrónica', 'Arte'];

const VIDEO_URLS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const pick    = (arr)     => faker.helpers.arrayElement(arr);
const pickN   = (arr, n)  => faker.helpers.arrayElements(arr, Math.min(n, arr.length));
const dur     = ()        => { const s = faker.number.int({ min: 60, max: 7200 }); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const dedup   = (...args) => args.join('|');

async function bulkInsert(table, rows) {
  const ids = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    if (chunk.length === 0) continue;
    const result = await db.insert(table).values(chunk);
    const firstId = Number(result[0].insertId);
    for (let j = 0; j < chunk.length; j++) ids.push(firstId + j);
  }
  return ids;
}

async function clean() {
  console.log('🧹 Limpiando tablas...');
  for (const t of [
    commentLikes, lessonProgress, courseEnrollments, courseReviews,
    profesorPlaylistVideos, playlistVideos,
    profesorPlaylists, playlists,
    favorites, history, notifications, subscriptions,
    comments, videos, users,
  ]) await db.delete(t);
}

// ─── GENERATORS ──────────────────────────────────────────────────────────────

function genUser(idx, hash, role) {
  const fn = faker.person.firstName();
  const ln = faker.person.lastName();
  return {
    nombre: `${fn} ${ln}`,
    email: idx === 0 ? 'demo@eduverify.com' : faker.internet.email({ firstName: fn, lastName: ln }).toLowerCase(),
    password_hash: hash,
    rol: role,
    premium: role !== 'estudiante' && faker.datatype.boolean(0.3),
    dark_mode: faker.datatype.boolean(0.3),
    avatar_path: faker.image.urlPicsumPhotos({ width: 200, height: 200 }),
    banner_path: faker.datatype.boolean(0.25) ? faker.image.urlPicsumPhotos({ width: 1200, height: 400 }) : null,
  };
}

function genVideo(authorId) {
  // ponytail: solo grabado, envivo es edge case
  return {
    usuario_id: authorId,
    titulo: faker.lorem.sentence({ min: 3, max: 8 }).slice(0, 255),
    descripcion: faker.lorem.paragraph(),
    url_video: pick(VIDEO_URLS),
    categoria: pick(CATEGORIAS),
    tipo: 'grabado',
    es_premium: faker.datatype.boolean(0.15),
    visible: faker.datatype.boolean(0.85),
    vistas: faker.number.int({ min: 0, max: 50000 }),
    duracion: dur(),
  };
}

function genComment(videoId, userId, parentId) {
  return {
    video_id: videoId,
    user_id: userId,
    parent_id: parentId || null,
    texto: faker.lorem.sentences({ min: 1, max: 3 }),
    likes: 0,
  };
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  console.log(`🌱 EduVerify Seed · ${process.env.SEED_SCALE || 'medium'} · ${S.users} usuarios · ${S.videos} videos\n`);

  await clean();

  const hash = await bcrypt.hash(DEMO_PASS, 10);

  // ── Users ──
  console.log('👤 Usuarios...');
  const userRows = [];
  const nEst = Math.floor(S.users * 0.65);
  const nProf = Math.floor(S.users * 0.22);
  const nCrea = S.users - nEst - nProf;
  for (const [count, role] of [[nEst, 'estudiante'], [nProf, 'profesor'], [nCrea, 'creador']]) {
    for (let i = 0; i < count; i++) userRows.push(genUser(userRows.length, hash, role));
  }
  const userIds = await bulkInsert(users, userRows);
  if (userRows[0].email !== 'demo@eduverify.com') throw new Error('Demo user no es el primero');
  const demoId = userIds[0];
  const students = userIds.filter((_, i) => userRows[i].rol === 'estudiante');
  const teachers = userIds.filter((_, i) => userRows[i].rol === 'profesor' || userRows[i].rol === 'creador');
  console.log(`   ✓ ${userIds.length} (${students.length} estudiantes, ${teachers.length} profesores/creadores)`);

  // El usuario demo es profesor para poder probar toda la funcionalidad
  await db.update(users).set({ rol: 'profesor' }).where(eq(users.email, 'demo@eduverify.com'));
  // actualizar arrays locales para el resto de la generación
  if (userRows[0].rol === 'estudiante') {
    userRows[0].rol = 'profesor';
    const si = students.indexOf(demoId);
    if (si !== -1) { students.splice(si, 1); teachers.push(demoId); }
  }

  // ── Videos ──
  console.log('🎬 Videos...');
  const videoRows = [];
  const vidsByAuthor = {};
  for (let i = 0; i < S.videos; i++) {
    const aid = pick(teachers);
    videoRows.push(genVideo(aid));
    (vidsByAuthor[aid] ||= []).push(i);
  }
  const videoIds = await bulkInsert(videos, videoRows);
  for (const [aid, indices] of Object.entries(vidsByAuthor)) vidsByAuthor[aid] = indices.map(i => videoIds[i]);
  console.log(`   ✓ ${videoIds.length}`);

  // ── Comments ──
  console.log('💬 Comentarios...');
  const topLevelRows = [];
  for (let vi = 0; vi < videoIds.length; vi++) {
    const n = faker.number.int({ min: 0, max: 15 });
    for (let ci = 0; ci < n; ci++) topLevelRows.push(genComment(videoIds[vi], pick(userIds), null));
  }
  const topLevelIds = await bulkInsert(comments, topLevelRows);

  // ponytail: respuestas solo 1 nivel de anidación
  const replyRows = [];
  for (let i = 0; i < topLevelIds.length; i++) {
    if (faker.datatype.boolean(0.25)) {
      replyRows.push(genComment(topLevelRows[i].video_id, pick(userIds), topLevelIds[i]));
    }
  }
  const replyIds = await bulkInsert(comments, replyRows);
  const commentIds = [...topLevelIds, ...replyIds];
  console.log(`   ✓ ${commentIds.length} (${replyIds.length} respuestas)`);

  // ── Comment Likes ──
  console.log('❤️  Likes...');
  const clRows = [];
  const clSeen = new Set();
  for (const cid of commentIds) {
    const n = faker.number.int({ min: 0, max: 50 });
    for (const uid of pickN(userIds, n)) {
      const key = dedup(cid, uid);
      if (!clSeen.has(key)) { clSeen.add(key); clRows.push({ comment_id: cid, user_id: uid }); }
    }
  }
  await bulkInsert(commentLikes, clRows);
  await pool.execute('UPDATE comments c SET likes = (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id)');
  console.log(`   ✓ ${clRows.length}`);

  // ── Student Playlists ──
  console.log('📂 Playlists...');
  const plRows = [];
  for (const uid of students) {
    const n = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < n; i++) plRows.push({ user_id: uid, nombre: faker.lorem.words({ min: 1, max: 3 }) });
  }
  const plIds = await bulkInsert(playlists, plRows);

  const pvRows = [];
  const pvSeen = new Set();
  for (let pi = 0; pi < plIds.length; pi++) {
    const n = faker.number.int({ min: 3, max: 15 });
    const shuffled = faker.helpers.shuffle([...videoIds]);
    for (let j = 0; j < Math.min(n, shuffled.length); j++) {
      const key = dedup(plIds[pi], shuffled[j]);
      if (!pvSeen.has(key)) { pvSeen.add(key); pvRows.push({ playlist_id: plIds[pi], video_id: shuffled[j] }); }
    }
  }
  await bulkInsert(playlistVideos, pvRows);
  console.log(`   ✓ ${plIds.length} playlists + ${pvRows.length} videos`);

  // ── Profesor Playlists (cursos) ──
  console.log('🎓 Cursos...');
  const ppRows = [];
  for (const uid of teachers) {
    const n = faker.number.int({ min: 2, max: 4 });
    for (let i = 0; i < n; i++) ppRows.push({ user_id: uid, nombre: faker.lorem.words({ min: 2, max: 5 }), descripcion: faker.lorem.paragraph() });
  }
  const ppIds = await bulkInsert(profesorPlaylists, ppRows);

  const ppvRows = [];
  for (let ppi = 0; ppi < ppIds.length; ppi++) {
    const myVids = vidsByAuthor[ppRows[ppi].user_id] || [];
    if (myVids.length === 0) continue;
    const n = faker.number.int({ min: 3, max: Math.min(myVids.length, 15) });
    const shuffled = faker.helpers.shuffle([...myVids]);
    for (let j = 0; j < n; j++) ppvRows.push({ playlist_id: ppIds[ppi], video_id: shuffled[j], orden: j });
  }
  await bulkInsert(profesorPlaylistVideos, ppvRows);
  console.log(`   ✓ ${ppIds.length} cursos + ${ppvRows.length} lecciones`);

  // ── Quizzes ──
  console.log('📝 Generando quizzes...');
  const quizRows = [];
  const questionRows = [];

  for (let ppi = 0; ppi < ppIds.length; ppi++) {
    const playlistId = ppIds[ppi];
    const myVids = vidsByAuthor[ppRows[ppi].user_id] || [];
    if (myVids.length < 2) continue;

    if (faker.datatype.boolean(0.3)) {
      const qCount = faker.number.int({ min: 3, max: 5 });
      quizRows.push({ playlist_id: playlistId, video_id: null, titulo: pick(['Examen final', 'Evaluación del curso', 'Certificación del módulo', 'Prueba integral', null]), min_aprobacion: pick([60, 70, 80]), qCount });
      for (let q = 0; q < qCount; q++) {
        const cat = pick(CATEGORIAS);
        const opciones = [faker.lorem.sentence(), faker.lorem.sentence(), faker.lorem.sentence(), faker.lorem.sentence()];
        questionRows.push({ quizRef: quizRows.length - 1, pregunta: `¿Cuál de las siguientes afirmaciones sobre ${cat.toLowerCase()} es correcta?`, opciones, correcta: faker.number.int({ min: 0, max: 3 }) });
      }
    }

    for (const vid of myVids.slice(0, Math.ceil(myVids.length * 0.2))) {
      const qCount = faker.number.int({ min: 2, max: 4 });
      quizRows.push({ playlist_id: playlistId, video_id: vid, titulo: null, min_aprobacion: pick([60, 70, 80]), qCount });
      for (let q = 0; q < qCount; q++) {
        const cat = pick(CATEGORIAS);
        const opciones = [faker.lorem.sentence(), faker.lorem.sentence(), faker.lorem.sentence()];
        questionRows.push({ quizRef: quizRows.length - 1, pregunta: `¿Cuál concepto describe mejor ${cat.toLowerCase()}?`, opciones, correcta: faker.number.int({ min: 0, max: 2 }) });
      }
    }
  }

  // Insert quizzes one by one to capture IDs (ponytail: ~40 inserts, negligible)
  const quizIds = [];
  for (const r of quizRows) {
    const { qCount, ...row } = r;
    const result = await db.insert(quizzes).values(row);
    quizIds.push(Number(result[0].insertId));
  }

  const qqRows = questionRows.map(q => ({
    quiz_id: quizIds[q.quizRef],
    pregunta: q.pregunta,
    opciones: JSON.stringify(q.opciones),
    correcta: q.correcta,
    orden: 0,
  }));
  if (qqRows.length > 0) await bulkInsert(quizQuestions, qqRows);
  console.log(`   ✓ ${quizIds.length} quizzes + ${qqRows.length} preguntas`);

  // ── Enrollments + Progress + Reviews ──
  console.log('📝 Inscripciones...');
  const ceRows = [];
  const ceSeen = new Set();
  for (const uid of students) {
    const n = faker.number.int({ min: 0, max: 8 });
    for (const ppid of pickN(ppIds, n)) {
      const key = dedup(uid, ppid);
      if (!ceSeen.has(key)) { ceSeen.add(key); ceRows.push({ user_id: uid, playlist_id: ppid }); }
    }
  }
  await bulkInsert(courseEnrollments, ceRows);

  const ppvByPlaylist = {};
  for (const r of ppvRows) (ppvByPlaylist[r.playlist_id] ||= []).push(r.video_id);

  const lpRows = [];
  const lpSeen = new Set();
  for (const ce of ceRows) {
    const vids = ppvByPlaylist[ce.playlist_id] || [];
    if (vids.length === 0) continue;
    const pct = faker.number.float({ min: 0.3, max: 0.8 });
    const n = Math.max(1, Math.floor(vids.length * pct));
    const shuffled = faker.helpers.shuffle([...vids]);
    for (let j = 0; j < Math.min(n, shuffled.length); j++) {
      const key = dedup(ce.user_id, ce.playlist_id, shuffled[j]);
      if (!lpSeen.has(key)) { lpSeen.add(key); lpRows.push({ user_id: ce.user_id, playlist_id: ce.playlist_id, video_id: shuffled[j] }); }
    }
  }
  await bulkInsert(lessonProgress, lpRows);

  const crRows = [];
  const crSeen = new Set();
  for (const ppid of ppIds) {
    const n = faker.number.int({ min: 0, max: 3 });
    for (const uid of pickN(students, n)) {
      const key = dedup(uid, ppid);
      if (!crSeen.has(key)) { crSeen.add(key); crRows.push({ playlist_id: ppid, user_id: uid, estrellas: faker.number.int({ min: 1, max: 5 }), texto: faker.lorem.paragraph() }); }
    }
  }
  await bulkInsert(courseReviews, crRows);
  console.log(`   ✓ ${ceRows.length} inscripciones, ${lpRows.length} completados, ${crRows.length} reseñas`);

  // ── Subscriptions ──
  console.log('🔔 Suscripciones...');
  const subRows = [];
  const subSeen = new Set();
  for (const uid of userIds) {
    const n = faker.number.int({ min: 0, max: 10 });
    for (const tid of pickN(teachers, n)) {
      if (uid === tid) continue;
      const key = dedup(uid, tid);
      if (!subSeen.has(key)) { subSeen.add(key); subRows.push({ subscriber_id: uid, professor_id: tid, notificaciones: faker.datatype.boolean(0.7) }); }
    }
  }
  await bulkInsert(subscriptions, subRows);
  console.log(`   ✓ ${subRows.length}`);

  // ── Notifications ──
  console.log('📬 Notificaciones...');
  const notifRows = [];
  for (const uid of userIds) {
    const n = faker.number.int({ min: 0, max: 5 });
    for (let i = 0; i < n; i++) notifRows.push({ user_id: uid, mensaje: faker.lorem.sentence(), leida: faker.datatype.boolean(0.4) });
  }
  await bulkInsert(notifications, notifRows);

  // ── Favorites ──
  console.log('⭐ Favoritos...');
  const favRows = [];
  const favSeen = new Set();
  for (const uid of userIds) {
    for (const vid of pickN(videoIds, faker.number.int({ min: 0, max: 30 }))) {
      const key = dedup(uid, vid);
      if (!favSeen.has(key)) { favSeen.add(key); favRows.push({ user_id: uid, video_id: vid }); }
    }
  }
  await bulkInsert(favorites, favRows);

  // ── History ──
  console.log('📜 Historial...');
  const histRows = [];
  const histSeen = new Set();
  for (const uid of userIds) {
    for (const vid of pickN(videoIds, faker.number.int({ min: 0, max: 50 }))) {
      const key = dedup(uid, vid);
      if (!histSeen.has(key)) { histSeen.add(key); histRows.push({ user_id: uid, video_id: vid }); }
    }
  }
  await bulkInsert(history, histRows);
  console.log(`   ✓ ${favRows.length} favoritos, ${histRows.length} historial`);

  // ── Self-check ──
  console.log('\n🔍 Verificando...');
  const checks = [
    ['users', userRows.length], ['videos', videoRows.length],
    ['comments', commentIds.length], ['comment_likes', clRows.length],
    ['playlists', plRows.length], ['playlist_videos', pvRows.length],
    ['profesor_playlists', ppRows.length], ['profesor_playlist_videos', ppvRows.length],
    ['course_enrollments', ceRows.length], ['lesson_progress', lpRows.length],
    ['course_reviews', crRows.length], ['subscriptions', subRows.length],
    ['notifications', notifRows.length], ['favorites', favRows.length],
    ['history', histRows.length],
    ['quizzes', quizIds.length], ['quiz_questions', qqRows.length],
  ];
  for (const [table, expected] of checks) {
    const [row] = await pool.execute(`SELECT COUNT(*) as c FROM ${table}`);
    const actual = Number(row[0].c);
    const ok = actual === expected;
    console.log(`   ${ok ? '✓' : '✗'} ${table}: ${actual} (esperado ${expected})`);
    if (!ok) throw new Error(`Count mismatch: ${table}: ${actual} vs ${expected}`);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ Seed completada en ${elapsed}s`);
  console.log(`   Login demo: demo@eduverify.com / ${DEMO_PASS}`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
