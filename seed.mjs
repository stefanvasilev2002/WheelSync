// WheelSync — Production Database Seeder
// Run: node seed.mjs

const BASE = 'https://wheelsync-api-mwes.onrender.com/api';

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  }
  return json.data;
}

const post = (path, body, token) => req('POST', path, body, token);
const put  = (path, body, token) => req('PUT',  path, body, token);

async function login(email, password) {
  const data = await post('/auth/login', { email, password });
  return data.token;
}

async function register(body) {
  return post('/auth/register', body);
}

// ──────────────────────────────────────────────
async function main() {

  // ── 1. Admin login ──────────────────────────
  console.log('🔐 Logging in as admin...');
  const adm = await login('admin@wheelsync.mk', 'Admin123!');

  // ── 2. Companies ────────────────────────────
  console.log('🏢 Creating companies...');
  const c1 = await post('/companies', {
    name: 'Транспорт Македонија ДООЕЛ',
    address: 'бул. Александар Македонски 42, Скопје',
    phone: '+389 2 3101 500',
    contactPerson: 'Марко Петровски'
  }, adm);

  const c2 = await post('/companies', {
    name: 'Логистика Балкан АД',
    address: 'ул. Орце Николов 88, Скопје',
    phone: '+389 2 3220 800',
    contactPerson: 'Елена Димитриевска'
  }, adm);

  console.log(`  ✓ ${c1.name} [id=${c1.id}]`);
  console.log(`  ✓ ${c2.name} [id=${c2.id}]`);

  // ── 3. Users ────────────────────────────────
  console.log('👤 Registering users...');

  await register({ firstName: 'Марко',       lastName: 'Петровски',     email: 'marko.petrovski@transport.mk',       password: 'Password123!', phone: '+389 70 123 456', role: 'FLEET_MANAGER', companyId: c1.id });
  await register({ firstName: 'Елена',       lastName: 'Димитриевска',  email: 'elena.dimitrievska@logistika.mk',    password: 'Password123!', phone: '+389 70 234 567', role: 'FLEET_MANAGER', companyId: c2.id });
  const u_d1 = await register({ firstName: 'Александар', lastName: 'Николовски',  email: 'aleksandar.nikolovski@transport.mk', password: 'Password123!', phone: '+389 71 111 222', role: 'DRIVER',        companyId: c1.id });
  const u_d2 = await register({ firstName: 'Јована',     lastName: 'Стојановска', email: 'jovana.stojanovska@transport.mk',    password: 'Password123!', phone: '+389 71 333 444', role: 'DRIVER',        companyId: c1.id });
  const u_d3 = await register({ firstName: 'Петар',      lastName: 'Спировски',   email: 'petar.spirovski@transport.mk',       password: 'Password123!', phone: '+389 71 555 666', role: 'DRIVER',        companyId: c1.id });
  const u_d4 = await register({ firstName: 'Борис',      lastName: 'Стефановски', email: 'boris.stefanovski@logistika.mk',     password: 'Password123!', phone: '+389 72 111 222', role: 'DRIVER',        companyId: c2.id });
  const u_d5 = await register({ firstName: 'Ана',        lastName: 'Ристовска',   email: 'ana.ristovska@logistika.mk',         password: 'Password123!', phone: '+389 72 333 444', role: 'DRIVER',        companyId: c2.id });

  // register returns AuthResponse → userId, not id
  const [d1id, d2id, d3id, d4id, d5id] = [u_d1, u_d2, u_d3, u_d4, u_d5].map(u => u.userId);

  console.log(`  ✓ 2 fleet managers, 5 drivers registered`);

  // ── 4. Tokens ───────────────────────────────
  console.log('🔑 Logging in as each user...');
  const fm1 = await login('marko.petrovski@transport.mk',    'Password123!');
  const fm2 = await login('elena.dimitrievska@logistika.mk', 'Password123!');
  const dt1 = await login('aleksandar.nikolovski@transport.mk', 'Password123!');
  const dt2 = await login('jovana.stojanovska@transport.mk',    'Password123!');
  const dt3 = await login('petar.spirovski@transport.mk',       'Password123!');
  const dt4 = await login('boris.stefanovski@logistika.mk',     'Password123!');
  const dt5 = await login('ana.ristovska@logistika.mk',         'Password123!');

  // ── 5. Vehicles ─────────────────────────────
  console.log('🚛 Creating vehicles...');
  const v1 = await post('/vehicles', { make: 'Mercedes-Benz', model: 'Sprinter 316 CDI', year: 2021, vin: '1HGBH41JXMN109186', licensePlate: 'SK-1234-AB', color: 'Бела',     engineType: '2.2 CDI',    fuelType: 'DIESEL', currentMileage: 87340,  companyId: c1.id }, adm);
  const v2 = await post('/vehicles', { make: 'Volkswagen',    model: 'Crafter 35 TDI',   year: 2020, vin: '2T1BURHE0JC068800', licensePlate: 'SK-5678-CD', color: 'Сина',     engineType: '2.0 TDI',    fuelType: 'DIESEL', currentMileage: 124500, companyId: c1.id }, adm);
  const v3 = await post('/vehicles', { make: 'Ford',          model: 'Transit Custom',   year: 2022, vin: '3VWFE21C04M000001', licensePlate: 'SK-9012-EF', color: 'Сребрена', engineType: '2.0 EcoBlue', fuelType: 'DIESEL', currentMileage: 45200,  companyId: c1.id }, adm);
  const v4 = await post('/vehicles', { make: 'Toyota',        model: 'Hilux 2.4 D-4D',  year: 2023, vin: '4T1BF3EK8AU567890', licensePlate: 'SK-2468-KL', color: 'Crna',     engineType: '2.4 D-4D',   fuelType: 'DIESEL', currentMileage: 12000,  companyId: c1.id }, adm);
  const v5 = await post('/vehicles', { make: 'Iveco',         model: 'Daily 35S14',      year: 2019, vin: '5YFBURHE0HP709746', licensePlate: 'SK-3456-GH', color: 'Бела',     engineType: '2.3 HPI',    fuelType: 'DIESEL', currentMileage: 198700, companyId: c2.id }, adm);
  const v6 = await post('/vehicles', { make: 'Renault',       model: 'Master dCi 150',   year: 2021, vin: '6G1ZD5ST7KL100001', licensePlate: 'SK-7890-IJ', color: 'Жолта',    engineType: '2.3 dCi',    fuelType: 'DIESEL', currentMileage: 63800,  companyId: c2.id }, adm);

  console.log(`  ✓ 6 vehicles: [${[v1,v2,v3,v4,v5,v6].map(v=>v.id).join(', ')}]`);

  // ── 6. Assignments ──────────────────────────
  console.log('🔗 Assigning vehicles to drivers...');
  await post(`/vehicles/${v1.id}/assign`, { driverId: d1id, assignedDate: '2026-01-01' }, fm1);
  await post(`/vehicles/${v2.id}/assign`, { driverId: d2id, assignedDate: '2026-01-01' }, fm1);
  await post(`/vehicles/${v3.id}/assign`, { driverId: d3id, assignedDate: '2026-01-01' }, fm1);
  await post(`/vehicles/${v5.id}/assign`, { driverId: d4id, assignedDate: '2026-01-01' }, fm2);
  await post(`/vehicles/${v6.id}/assign`, { driverId: d5id, assignedDate: '2026-01-01' }, fm2);
  console.log('  ✓ 5 assignments done (v4 unassigned)');

  // ── 7. Mileage logs ─────────────────────────
  console.log('📍 Creating mileage logs...');
  const mileage = [
    [v1.id, '2026-01-05', 82000,  82350,  'Рута Скопје-Битола',                   dt1],
    [v1.id, '2026-01-15', 82350,  82890,  'Рута Скопје-Охрид',                    dt1],
    [v1.id, '2026-02-03', 82890,  83600,  'Рута Скопје-Гевгелија',                dt1],
    [v1.id, '2026-02-18', 83600,  84100,  'Локална достава',                      dt1],
    [v1.id, '2026-03-07', 84100,  85200,  'Рута Скопје-Тетово-Гостивар',          dt1],
    [v1.id, '2026-03-20', 85200,  87340,  'Меѓународен транспорт Скопје-Белград', dt1],
    [v2.id, '2026-01-08', 120000, 120780, 'Рута Скопје-Прилеп',                   dt2],
    [v2.id, '2026-01-22', 120780, 121540, 'Рута Скопје-Штип',                     dt2],
    [v2.id, '2026-02-10', 121540, 122800, 'Рута Скопје-Велес-Кавадарци',          dt2],
    [v2.id, '2026-03-01', 122800, 124500, 'Рута Скопје-Куманово-Врање',           dt2],
    [v3.id, '2026-02-05', 44000,  44450,  'Достава на стока во Скопје',           dt3],
    [v3.id, '2026-02-20', 44450,  44900,  'Рута Скопје-Тетово',                   dt3],
    [v3.id, '2026-03-10', 44900,  45200,  'Достава Аеродром-Центар',              dt3],
    [v5.id, '2026-01-10', 194000, 195200, 'Транспорт до Солун',                   dt4],
    [v5.id, '2026-02-08', 195200, 196800, 'Рута Скопје-Ниш',                      dt4],
    [v5.id, '2026-03-05', 196800, 198700, 'Транспорт Скопје-Загреб',              dt4],
    [v6.id, '2026-01-20', 60000,  61100,  'Локална достава Скопје',               dt5],
    [v6.id, '2026-02-15', 61100,  62400,  'Рута Скопје-Кичево',                   dt5],
    [v6.id, '2026-03-12', 62400,  63800,  'Рута Скопје-Струмица',                 dt5],
  ];
  for (const [vehicleId, date, startMileage, endMileage, note, tok] of mileage) {
    await post('/mileage', { vehicleId, date, startMileage, endMileage, note }, tok);
  }
  console.log(`  ✓ ${mileage.length} mileage logs`);

  // ── 8. Fuel logs ────────────────────────────
  console.log('⛽ Creating fuel logs...');
  const fuel = [
    [v1.id, '2026-01-05', 'DIESEL', 65.5,  75.50, 82000,  'ОКТА Скопје - Автопат',    dt1],
    [v1.id, '2026-02-03', 'DIESEL', 72.0,  76.00, 82890,  'Макпетрол Гевгелија',      dt1],
    [v1.id, '2026-03-07', 'DIESEL', 68.5,  76.50, 84100,  'ОКТА Тетово',              dt1],
    [v1.id, '2026-03-20', 'DIESEL', 80.0,  77.00, 85200,  'НИС Петрол Белград',       dt1],
    [v2.id, '2026-01-08', 'DIESEL', 70.0,  75.50, 120000, 'Макпетрол Прилеп',         dt2],
    [v2.id, '2026-02-10', 'DIESEL', 75.5,  76.00, 121540, 'ОКТА Кавадарци',           dt2],
    [v2.id, '2026-03-01', 'DIESEL', 82.0,  76.50, 122800, 'Луконафт Куманово',        dt2],
    [v3.id, '2026-02-05', 'DIESEL', 45.0,  75.50, 44000,  'Макпетрол Скопје',         dt3],
    [v3.id, '2026-03-10', 'DIESEL', 48.5,  76.50, 44900,  'ОКТА Скопје Центар',       dt3],
    [v5.id, '2026-01-10', 'DIESEL', 90.0,  75.00, 194000, 'EKO Солун',                dt4],
    [v5.id, '2026-02-08', 'DIESEL', 95.0,  76.00, 195200, 'Луконафт Ниш',             dt4],
    [v5.id, '2026-03-05', 'DIESEL', 100.0, 77.00, 196800, 'INA Загреб',               dt4],
    [v6.id, '2026-01-20', 'DIESEL', 55.0,  75.50, 60000,  'Макпетрол Скопје',         dt5],
    [v6.id, '2026-02-15', 'DIESEL', 60.0,  76.00, 61100,  'ОКТА Кичево',              dt5],
    [v6.id, '2026-03-12', 'DIESEL', 58.5,  76.50, 62400,  'Макпетрол Струмица',       dt5],
  ];
  for (const [vehicleId, date, fuelType, quantityLiters, pricePerLiter, mileageAtRefuel, location, tok] of fuel) {
    await post('/fuel', { vehicleId, date, fuelType, quantityLiters, pricePerLiter, mileageAtRefuel, location }, tok);
  }
  console.log(`  ✓ ${fuel.length} fuel logs`);

  // ── 9. Service records ──────────────────────
  console.log('🔧 Creating service records...');
  const services = [
    [v1.id, 'OIL_CHANGE',          '2026-01-15', 82350,  'Автосервис Јовановски - Скопје',         3200,  'CONFIRMED', 'Смена на масло и масловен филтер, Castrol 5W-40',                fm1],
    [v1.id, 'TECHNICAL_INSPECTION','2026-02-20', 83600,  'ЈП Македонија пат - Технички преглед',   1800,  'CONFIRMED', 'Редовен технички преглед, сите системи исправни',               fm1],
    [v1.id, 'FILTER_CHANGE',       '2026-03-15', 85000,  'Автосервис Јовановски - Скопје',         1200,  'PENDING',   'Замена на воздушен и кабински филтер',                          fm1],
    [v2.id, 'OIL_CHANGE',          '2026-01-25', 120780, 'VW Сервис Скопје',                       3800,  'CONFIRMED', 'Смена на масло VW 507.00, масловен и воздушен филтер',           fm1],
    [v2.id, 'TIRE_CHANGE',         '2026-03-02', 124500, 'Автосервис Петков',                      8500,  'CONFIRMED', 'Замена на предни гуми, Michelin Agilis 225/75R16',               fm1],
    [v3.id, 'FILTER_CHANGE',       '2026-02-10', 44450,  'Ford Овластен сервис Скопје',            2100,  'CONFIRMED', 'Смена на горивен и воздушен филтер',                            fm1],
    [v3.id, 'OIL_CHANGE',          '2026-03-20', 45200,  'Ford Овластен сервис Скопје',            2800,  'PENDING',   'Смена на масло Ford WSS-M2C913-D 5W-30',                        fm1],
    [v5.id, 'ENGINE_REPAIR',       '2026-02-01', 195200, 'Iveco Овластен сервис - Скопје',         45000, 'CONFIRMED', 'Поправка на турбина, замена на гарнитура на глава',             fm2],
    [v5.id, 'OIL_CHANGE',          '2026-03-10', 198700, 'Автосервис Балкан',                      4200,  'CONFIRMED', 'Смена на масло и сите филтри',                                  fm2],
    [v6.id, 'TECHNICAL_INSPECTION','2026-01-28', 61100,  'ЈП Македонија пат - Технички преглед',   1800,  'CONFIRMED', 'Годишен технички преглед',                                      fm2],
    [v6.id, 'TIRE_CHANGE',         '2026-02-20', 62400,  'Renault Сервис Скопје',                  7200,  'CONFIRMED', 'Сезонска замена на гуми - зимски со летни',                     fm2],
    [v4.id, 'OIL_CHANGE',          '2026-03-25', 12000,  'Toyota Овластен сервис Скопје',          3500,  'PENDING',   'Прв сервис по гаранција, смена на масло и филтри',              fm1],
  ];
  for (const [vehicleId, serviceType, date, mileage, location, cost, status, tok] of services) {
    await post('/service-records', { vehicleId, serviceType, date, mileage, location, cost, status }, tok);
  }
  console.log(`  ✓ ${services.length} service records`);

  // ── 10. Defects ─────────────────────────────
  console.log('⚠️  Creating defects...');
  const defects = [
    [v1.id, 'Абење на кочници',                  'Се слуша шкрипење при кочење, предните плочки потребно е да се заменат',              'HIGH',   dt1],
    [v1.id, 'Пукнатина на ветробранско стакло',  'Пукнатина долна страна, 15цм, не го попречува видот',                                 'MEDIUM', dt1],
    [v2.id, 'Неисправна климатизација',           'Климата не лади, потребно дополнување на фреон',                                       'MEDIUM', dt2],
    [v2.id, 'Изгорена задна лева светилка',       'Задна лева стоп светилка не работи',                                                   'HIGH',   dt2],
    [v3.id, 'Течење на масло',                    'Забележано масло под возилото по паркирање, мало течење од заптивката',               'HIGH',   dt3],
    [v4.id, 'Гребнатина на предниот браник',      'Лесна гребнатина при маневрирање во складиштето',                                    'LOW',    adm],
    [v5.id, 'Вибрации при возење',                'При брзина над 80кмч се јавуваат вибрации на воланот, веројатно небалансирани тркала', 'MEDIUM', dt4],
    [v5.id, 'Оштетено странично огледало десно',  'Огледалото е оштетено, потребна замена',                                               'LOW',    dt4],
    [v6.id, 'Слаба батерија',                     'Тешко палење наутро, батеријата треба проверка и евентуална замена',                  'MEDIUM', dt5],
    [v6.id, 'Грешка во сензор за притисок гуми',  'Индикаторот постојано свети, веројатно неисправен TPMS сензор',                      'LOW',    dt5],
  ];
  for (const [vehicleId, title, description, priority, tok] of defects) {
    await post('/defects', { vehicleId, title, description, priority }, tok);
  }
  console.log(`  ✓ ${defects.length} defects`);

  // ── 11. Maintenance reminders ───────────────
  console.log('🔔 Creating maintenance reminders...');
  const reminders = [
    // Company 1
    { vehicleId: v1.id, serviceType: 'OIL_CHANGE',           intervalType: 'BOTH',    mileageInterval: 15000, dateIntervalMonths: 12, lastServiceDate: '2026-01-15', lastServiceMileage: 82350,  warningThresholdKm: 1000, warningThresholdDays: 14 },
    { vehicleId: v1.id, serviceType: 'TECHNICAL_INSPECTION', intervalType: 'DATE',    dateIntervalMonths: 12, lastServiceDate: '2026-02-20',                                                     warningThresholdDays: 30 },
    { vehicleId: v2.id, serviceType: 'OIL_CHANGE',           intervalType: 'MILEAGE', mileageInterval: 15000,                         lastServiceMileage: 120780,                               warningThresholdKm: 1000 },
    { vehicleId: v2.id, serviceType: 'TIRE_CHANGE',          intervalType: 'DATE',    dateIntervalMonths: 6,  lastServiceDate: '2026-03-02',                                                     warningThresholdDays: 20 },
    { vehicleId: v3.id, serviceType: 'OIL_CHANGE',           intervalType: 'MILEAGE', mileageInterval: 10000,                         lastServiceMileage: 44450,                                warningThresholdKm: 800  },
    { vehicleId: v3.id, serviceType: 'FILTER_CHANGE',        intervalType: 'DATE',    dateIntervalMonths: 12, lastServiceDate: '2026-02-10',                                                     warningThresholdDays: 30 },
    { vehicleId: v4.id, serviceType: 'OIL_CHANGE',           intervalType: 'MILEAGE', mileageInterval: 10000,                         lastServiceMileage: 2000,                                 warningThresholdKm: 500  },
    // Company 2 — v5 TINS due soon (lastService 1 year ago) so email fires
    { vehicleId: v5.id, serviceType: 'OIL_CHANGE',           intervalType: 'BOTH',    mileageInterval: 10000, dateIntervalMonths: 12, lastServiceDate: '2025-03-01', lastServiceMileage: 185000, warningThresholdKm: 3000, warningThresholdDays: 30 },
    { vehicleId: v5.id, serviceType: 'TECHNICAL_INSPECTION', intervalType: 'DATE',    dateIntervalMonths: 12, lastServiceDate: '2025-04-01',                                                     warningThresholdDays: 30 },
    { vehicleId: v6.id, serviceType: 'OIL_CHANGE',           intervalType: 'BOTH',    mileageInterval: 15000, dateIntervalMonths: 12, lastServiceDate: '2026-01-28', lastServiceMileage: 60000,  warningThresholdKm: 1000, warningThresholdDays: 14 },
    { vehicleId: v6.id, serviceType: 'TIRE_CHANGE',          intervalType: 'DATE',    dateIntervalMonths: 6,  lastServiceDate: '2026-02-20',                                                     warningThresholdDays: 20 },
  ];
  for (const body of reminders) {
    const tok = [v1.id, v2.id, v3.id, v4.id].includes(body.vehicleId) ? fm1 : fm2;
    await post('/reminders', body, tok);
  }
  console.log(`  ✓ ${reminders.length} reminders`);

  // ── Done ────────────────────────────────────
  console.log(`
✅  Database seeded successfully!

Login credentials:
  Role          Email                                    Password
  ──────────────────────────────────────────────────────────────
  ADMIN         admin@wheelsync.mk                       Admin123!
  FLEET_MANAGER marko.petrovski@transport.mk             Password123!
  FLEET_MANAGER elena.dimitrievska@logistika.mk          Password123!
  DRIVER        aleksandar.nikolovski@transport.mk       Password123!
  DRIVER        jovana.stojanovska@transport.mk          Password123!
  DRIVER        petar.spirovski@transport.mk             Password123!
  DRIVER        boris.stefanovski@logistika.mk           Password123!
  DRIVER        ana.ristovska@logistika.mk               Password123!
`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
