import { PrismaClient, IncidentType, Priority, IncidentStatus, IncidentEventKind, FeedTag, ResponderKind, ResponderStatus, TimeOfDay } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DISTRICTS = [
  { code: 'ЦАО', name: 'Центральный', lat: 55.7558, lng: 37.6173, score: 7.8 },
  { code: 'САО', name: 'Северный', lat: 55.8389, lng: 37.5253, score: 5.2 },
  { code: 'СВАО', name: 'Северо-Восточный', lat: 55.8636, lng: 37.6206, score: 6.4 },
  { code: 'ВАО', name: 'Восточный', lat: 55.7878, lng: 37.7755, score: 5.9 },
  { code: 'ЮВАО', name: 'Юго-Восточный', lat: 55.7034, lng: 37.7549, score: 6.1 },
  { code: 'ЮАО', name: 'Южный', lat: 55.6201, lng: 37.6308, score: 7.0 },
  { code: 'ЮЗАО', name: 'Юго-Западный', lat: 55.6593, lng: 37.5340, score: 5.5 },
  { code: 'ЗАО', name: 'Западный', lat: 55.7280, lng: 37.4435, score: 8.2 },
  { code: 'СЗАО', name: 'Северо-Западный', lat: 55.8295, lng: 37.4416, score: 4.8 },
];

const RESPONDERS = [
  { code: 'ДПС-7', label: 'Экипаж ДПС № 7', kind: ResponderKind.DPS },
  { code: 'ДПС-12', label: 'Экипаж ДПС № 12', kind: ResponderKind.DPS },
  { code: 'ДПС-19', label: 'Экипаж ДПС № 19', kind: ResponderKind.DPS },
  { code: 'СП-4', label: 'Скорая помощь № 4', kind: ResponderKind.AMBULANCE },
  { code: 'СП-11', label: 'Скорая помощь № 11', kind: ResponderKind.AMBULANCE },
  { code: 'СП-22', label: 'Скорая помощь № 22', kind: ResponderKind.AMBULANCE },
  { code: 'ЭВ-3', label: 'Эвакуатор № 3', kind: ResponderKind.TOW },
  { code: 'ИНС-1', label: 'Дорожный инспектор № 1', kind: ResponderKind.INSPECTOR },
];

const INCIDENT_SEED = [
  { id: 'INC-2735', type: IncidentType.ACCIDENT, priority: Priority.HIGH, title: 'ДТП с пострадавшими', address: 'ТТК, внутреннее кольцо, 14 км', districtCode: 'ЦАО', lat: 55.770, lng: 37.594, source: 'Камера КП-184', injured: 2, lanes: '2/4', avgSpeedKmh: 8, eta: '12 мин' },
  { id: 'INC-2736', type: IncidentType.WORKS, priority: Priority.MED, title: 'Дорожные работы', address: 'Ленинский пр-т, 38', districtCode: 'ЮЗАО', lat: 55.696, lng: 37.575, source: 'ЦОДД-плановое', lanes: '1/3', avgSpeedKmh: 22 },
  { id: 'INC-2737', type: IncidentType.CLOSURE, priority: Priority.HIGH, title: 'Полное перекрытие', address: 'Тверская, 12', districtCode: 'ЦАО', lat: 55.762, lng: 37.605, source: 'Регламент', lanes: '0/2', avgSpeedKmh: 0 },
  { id: 'INC-2738', type: IncidentType.CAMERA, priority: Priority.LOW, title: 'Камера не отвечает', address: 'МКАД, 67 км', districtCode: 'СЗАО', lat: 55.825, lng: 37.420, source: 'АСУДД' },
  { id: 'INC-2739', type: IncidentType.WEATHER, priority: Priority.MED, title: 'Гололёд', address: 'Кутузовский пр-т', districtCode: 'ЗАО', lat: 55.737, lng: 37.524, source: 'Метеосенсор', avgSpeedKmh: 35 },
  { id: 'INC-2740', type: IncidentType.ACCIDENT, priority: Priority.MED, title: 'Столкновение двух ТС', address: 'Садовое кольцо, Смоленская', districtCode: 'ЦАО', lat: 55.747, lng: 37.582, source: 'Звонок 112', injured: 0, lanes: '1/3', avgSpeedKmh: 12 },
  { id: 'INC-2741', type: IncidentType.ACCIDENT, priority: Priority.HIGH, title: 'Опрокидывание грузовика', address: 'МКАД, 22 км, внешняя', districtCode: 'ЗАО', lat: 55.739, lng: 37.434, source: 'Патруль ДПС', injured: 1, lanes: '1/4', avgSpeedKmh: 5, eta: '25 мин' },
  { id: 'INC-2742', type: IncidentType.WORKS, priority: Priority.LOW, title: 'Замена дорожного покрытия', address: 'Профсоюзная, 84', districtCode: 'ЮЗАО', lat: 55.659, lng: 37.534, source: 'ЦОДД-плановое', lanes: '2/3' },
  { id: 'INC-2743', type: IncidentType.ACCIDENT, priority: Priority.HIGH, title: 'Мото-ДТП', address: 'Варшавское ш., 42', districtCode: 'ЮАО', lat: 55.638, lng: 37.624, source: 'Камера КП-191', injured: 1, lanes: '1/3', avgSpeedKmh: 18 },
  { id: 'INC-2744', type: IncidentType.WEATHER, priority: Priority.MED, title: 'Сильный туман', address: 'Алтуфьевское ш.', districtCode: 'СВАО', lat: 55.880, lng: 37.585, source: 'Метеосенсор' },
  { id: 'INC-2745', type: IncidentType.CAMERA, priority: Priority.LOW, title: 'Сбой видеосигнала', address: 'Хорошёвское ш.', districtCode: 'САО', lat: 55.786, lng: 37.502, source: 'АСУДД' },
  { id: 'INC-2746', type: IncidentType.ACCIDENT, priority: Priority.MED, title: 'Касательное столкновение', address: 'Энтузиастов, 19', districtCode: 'ВАО', lat: 55.760, lng: 37.745, source: 'Звонок 112', injured: 0, lanes: '1/3', avgSpeedKmh: 14 },
  { id: 'INC-2747', type: IncidentType.CLOSURE, priority: Priority.MED, title: 'Аварийное перекрытие', address: 'Рязанский пр-т, 56', districtCode: 'ЮВАО', lat: 55.711, lng: 37.787, source: 'Аварийная служба', lanes: '0/3', avgSpeedKmh: 0 },
  { id: 'INC-2748', type: IncidentType.WORKS, priority: Priority.LOW, title: 'Уборка снега', address: 'Дмитровское ш.', districtCode: 'САО', lat: 55.860, lng: 37.534, source: 'ЦОДД-плановое' },
  { id: 'INC-2749', type: IncidentType.ACCIDENT, priority: Priority.LOW, title: 'Заглохший автомобиль', address: 'Третье кольцо, 9 км', districtCode: 'ЦАО', lat: 55.760, lng: 37.620, source: 'Звонок 112', avgSpeedKmh: 24 },
  { id: 'INC-2750', type: IncidentType.WEATHER, priority: Priority.LOW, title: 'Ливень', address: 'Можайское ш.', districtCode: 'ЗАО', lat: 55.715, lng: 37.380, source: 'Метеосенсор', avgSpeedKmh: 30 },
  { id: 'INC-2751', type: IncidentType.CAMERA, priority: Priority.LOW, title: 'Перезагрузка камеры', address: 'Лобачевского, 76', districtCode: 'ЗАО', lat: 55.679, lng: 37.487, source: 'АСУДД' },
  { id: 'INC-2752', type: IncidentType.ACCIDENT, priority: Priority.MED, title: 'Наезд на ограждение', address: 'Каширское ш., 31', districtCode: 'ЮАО', lat: 55.630, lng: 37.677, source: 'Камера КП-198', injured: 0, lanes: '1/3', avgSpeedKmh: 16 },
];

const FEED_TEMPLATES: { tag: FeedTag; template: string }[] = [
  { tag: FeedTag.INCIDENT, template: 'Создан {id} — {title}' },
  { tag: FeedTag.DISPATCH, template: 'Экипаж {code} назначен на {id}' },
  { tag: FeedTag.CAMERA, template: 'Видео-подтверждение: камера {code}' },
  { tag: FeedTag.SENSOR, template: 'Снижение скорости ниже {speed} км/ч' },
  { tag: FeedTag.WEATHER, template: 'Метеосенсор: T° {temp}, влажность {humidity}%' },
  { tag: FeedTag.STATUS, template: 'Регламентное перекрытие — старт' },
  { tag: FeedTag.EVENT, template: 'Маркер {id} обновлён' },
];

async function main() {
  console.log('[seed] start');

  // Roles
  for (const r of [
    { id: 'viewer', description: 'Read-only operator console' },
    { id: 'operator', description: 'Acknowledge / resolve / route incidents' },
    { id: 'dispatcher', description: 'Escalate + assign responders' },
  ]) {
    await prisma.role.upsert({ where: { id: r.id }, update: {}, create: r });
  }

  // Users
  const hash = await bcrypt.hash('Passw0rd!', 12);
  const userSeeds = [
    { email: 'admin@moscow-roads.local', fullName: 'Администратор', shift: '14:00-22:00', roles: ['dispatcher', 'operator', 'viewer'] },
    { email: 'dispatcher@moscow-roads.local', fullName: 'Диспетчер Иванов', shift: '14:00-22:00', roles: ['dispatcher'] },
    { email: 'operator@moscow-roads.local', fullName: 'Оператор Петрова', shift: '07:00-15:00', roles: ['operator', 'viewer'] },
    { email: 'viewer@moscow-roads.local', fullName: 'Наблюдатель Сидоров', shift: '08:00-16:00', roles: ['viewer'] },
  ];
  for (const u of userSeeds) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: hash, fullName: u.fullName, shift: u.shift },
      create: { email: u.email, passwordHash: hash, fullName: u.fullName, shift: u.shift },
    });
    for (const r of u.roles) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: r } },
        update: {},
        create: { userId: user.id, roleId: r },
      });
    }
  }

  // Districts
  for (const d of DISTRICTS) {
    await prisma.district.upsert({
      where: { code: d.code },
      update: { name: d.name, lat: d.lat, lng: d.lng, score: d.score },
      create: d,
    });
  }

  // Responders
  for (const r of RESPONDERS) {
    await prisma.responder.upsert({ where: { code: r.code }, update: { label: r.label, kind: r.kind }, create: r });
  }

  // Cameras (20 cameras across districts)
  for (let i = 0; i < 20; i++) {
    const code = `KP-${184 + i}`;
    const d = DISTRICTS[i % DISTRICTS.length];
    const lat = d.lat + (i % 5 - 2) * 0.005;
    const lng = d.lng + (i % 4 - 1) * 0.006;
    await prisma.camera.upsert({
      where: { code },
      update: { label: `Камера ${code}`, districtCode: d.code, lat, lng, online: i % 7 !== 0 },
      create: { code, label: `Камера ${code}`, districtCode: d.code, lat, lng, online: i % 7 !== 0 },
    });
  }

  // Incidents (clear existing for idempotency on identifiers, then upsert)
  for (const inc of INCIDENT_SEED) {
    const reportedAt = new Date(Date.now() - Math.floor(Math.random() * 3_600_000));
    await prisma.incident.upsert({
      where: { id: inc.id },
      update: {
        type: inc.type,
        priority: inc.priority,
        title: inc.title,
        address: inc.address,
        districtCode: inc.districtCode,
        lat: inc.lat,
        lng: inc.lng,
        status: IncidentStatus.ACTIVE,
        source: inc.source ?? null,
        injured: inc.injured ?? null,
        lanes: inc.lanes ?? null,
        avgSpeedKmh: inc.avgSpeedKmh ?? null,
        eta: inc.eta ?? null,
      },
      create: {
        id: inc.id,
        type: inc.type,
        priority: inc.priority,
        title: inc.title,
        address: inc.address,
        districtCode: inc.districtCode,
        lat: inc.lat,
        lng: inc.lng,
        reportedAt,
        source: inc.source ?? null,
        injured: inc.injured ?? null,
        lanes: inc.lanes ?? null,
        avgSpeedKmh: inc.avgSpeedKmh ?? null,
        eta: inc.eta ?? null,
      },
    });
    // CREATED event
    const existing = await prisma.incidentEvent.findFirst({ where: { incidentId: inc.id, kind: IncidentEventKind.CREATED } });
    if (!existing) {
      await prisma.incidentEvent.create({
        data: { incidentId: inc.id, kind: IncidentEventKind.CREATED, comment: 'Инцидент создан автоматически', at: reportedAt },
      });
    }
  }

  // Assign one responder to each HIGH incident
  for (const inc of INCIDENT_SEED.filter(i => i.priority === Priority.HIGH)) {
    const responderCode = RESPONDERS[Math.floor(Math.random() * RESPONDERS.length)].code;
    await prisma.incidentResponder.upsert({
      where: { incidentId_responderCode: { incidentId: inc.id, responderCode } },
      update: { status: ResponderStatus.EN_ROUTE, eta: '8 мин' },
      create: { incidentId: inc.id, responderCode, status: ResponderStatus.EN_ROUTE, eta: '8 мин' },
    });
  }

  // Feed events (60 over last 60 min) — fresh each seed
  await prisma.feedEvent.deleteMany({});
  for (let i = 0; i < 60; i++) {
    const tpl = FEED_TEMPLATES[i % FEED_TEMPLATES.length];
    const inc = INCIDENT_SEED[i % INCIDENT_SEED.length];
    const r = RESPONDERS[i % RESPONDERS.length];
    const message = tpl.template
      .replace('{id}', inc.id)
      .replace('{title}', inc.title)
      .replace('{code}', r.code)
      .replace('{speed}', String(20 + (i % 15)))
      .replace('{temp}', String(-3 + (i % 8)))
      .replace('{humidity}', String(60 + (i % 30)));
    await prisma.feedEvent.create({
      data: {
        ts: new Date(Date.now() - i * 60_000),
        tag: tpl.tag,
        incidentId: tpl.tag === FeedTag.INCIDENT || tpl.tag === FeedTag.DISPATCH || tpl.tag === FeedTag.EVENT ? inc.id : null,
        message,
      },
    });
  }

  // KPI snapshots (720 — one every 5s for the last hour) — fresh each seed
  await prisma.kpiSnapshot.deleteMany({});
  const now = Date.now();
  const hour = new Date().getHours();
  const tod: TimeOfDay = hour >= 7 && hour < 10 ? TimeOfDay.PEAK : hour >= 17 && hour < 21 ? TimeOfDay.PEAK : hour >= 22 || hour < 6 ? TimeOfDay.NIGHT : TimeOfDay.DAY;
  for (let i = 720; i >= 0; i--) {
    const score = 4 + Math.sin(i / 30) * 1.5 + Math.random() * 0.8;
    await prisma.kpiSnapshot.create({
      data: {
        ts: new Date(now - i * 5_000),
        score: Number(score.toFixed(2)),
        activeIncidents: INCIDENT_SEED.length + Math.floor(Math.random() * 6) - 2,
        avgSpeedKmh: Number((45 - score * 1.8 + Math.random() * 3).toFixed(1)),
        camerasOnline: 18 + Math.floor(Math.random() * 3),
        timeOfDay: tod,
      },
    });
  }

  // Jam segments — last datapoint per district
  await prisma.jamSegment.deleteMany({});
  for (const d of DISTRICTS) {
    await prisma.jamSegment.create({
      data: { districtCode: d.code, avgScore: d.score, ts: new Date() },
    });
  }

  console.log('[seed] done');
}

main()
  .catch(e => {
    console.error('[seed] failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
