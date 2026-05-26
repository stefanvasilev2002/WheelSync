// seed4.mjs — mileage logs already inserted; reset vehicles then add fuel/service/defects/reminders

const BASE = 'https://wheelsync-api-mwes.onrender.com/api';

const req = async (method, path, body, token) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  return json.data;
};
const post = (p, b, t) => req('POST', p, b, t);
const put  = (p, b, t) => req('PUT',  p, b, t);
const login = async (e, p) => (await post('/auth/login', { email: e, password: p })).token;

async function main() {
  console.log('Logging in...');
  const adm = await login('admin@wheelsync.mk', 'Admin123!');
  const fm1 = await login('marko.petrovski@transport.mk',    'Password123!');
  const fm2 = await login('elena.dimitrievska@logistika.mk', 'Password123!');
  const dt1 = await login('aleksandar.nikolovski@transport.mk', 'Password123!');
  const dt2 = await login('jovana.stojanovska@transport.mk',    'Password123!');
  const dt3 = await login('petar.spirovski@transport.mk',       'Password123!');
  const dt4 = await login('boris.stefanovski@logistika.mk',     'Password123!');
  const dt5 = await login('ana.ristovska@logistika.mk',         'Password123!');
  console.log('OK');

  // ── Reset vehicle currentMileage below first fuel log entry ───────────────
  // First fuel entries: v1=82000, v2=120000, v3=44000, v5=194000, v6=60000
  console.log('Resetting vehicle mileages for fuel log insertion...');
  const resets = [
    [1, 'Mercedes-Benz', 'Sprinter 316 CDI', 2021, '1HGBH41JXMN109186', 'SK-1234-AB', 'Bela',     '2.2 CDI',    'DIESEL', 81999, 1],
    [2, 'Volkswagen',    'Crafter 35 TDI',   2020, '2T1BURHE0JC068800', 'SK-5678-CD', 'Sina',     '2.0 TDI',    'DIESEL', 119999, 1],
    [3, 'Ford',          'Transit Custom',   2022, '3VWFE21C04M000001', 'SK-9012-EF', 'Srebrena', '2.0 EcoBlue','DIESEL', 43999, 1],
    [4, 'Toyota',        'Hilux 2.4 D-4D',  2023, '4T1BF3EK8AU567890', 'SK-2468-KL', 'Crna',     '2.4 D-4D',   'DIESEL', 11999, 1],
    [5, 'Iveco',         'Daily 35S14',      2019, '5YFBURHE0HP709746', 'SK-3456-GH', 'Bela',     '2.3 HPI',    'DIESEL', 193999, 2],
    [6, 'Renault',       'Master dCi 150',   2021, '6G1ZD5ST7KL100001', 'SK-7890-IJ', 'Zolta',    '2.3 dCi',    'DIESEL', 59999, 2],
  ];
  for (const [id, make, model, year, vin, licensePlate, color, engineType, fuelType, currentMileage, companyId] of resets)
    await put(`/vehicles/${id}`, { make, model, year, vin, licensePlate, color, engineType, fuelType, currentMileage, companyId }, adm);
  console.log('  Reset done');

  // ── Fuel logs (add in ascending mileage order per vehicle) ────────────────
  console.log('Fuel logs...');
  const fuel = [
    [1, '2026-01-05', 'DIESEL',  65.5,  75.50, 82000,  'OKTA Skopje - Avtopat',    dt1],
    [1, '2026-02-03', 'DIESEL',  72.0,  76.00, 82890,  'Makpetrol Gevgelija',       dt1],
    [1, '2026-03-07', 'DIESEL',  68.5,  76.50, 84100,  'OKTA Tetovo',               dt1],
    [1, '2026-03-20', 'DIESEL',  80.0,  77.00, 85200,  'NIS Petrol Beograd',        dt1],
    [2, '2026-01-08', 'DIESEL',  70.0,  75.50, 120000, 'Makpetrol Prilep',          dt2],
    [2, '2026-02-10', 'DIESEL',  75.5,  76.00, 121540, 'OKTA Kavadarci',            dt2],
    [2, '2026-03-01', 'DIESEL',  82.0,  76.50, 122800, 'Lukonaft Kumanovo',         dt2],
    [3, '2026-02-05', 'DIESEL',  45.0,  75.50, 44000,  'Makpetrol Skopje',          dt3],
    [3, '2026-03-10', 'DIESEL',  48.5,  76.50, 44900,  'OKTA Skopje Centar',        dt3],
    [5, '2026-01-10', 'DIESEL',  90.0,  75.00, 194000, 'EKO Solun',                 dt4],
    [5, '2026-02-08', 'DIESEL',  95.0,  76.00, 195200, 'Lukonaft Nis',              dt4],
    [5, '2026-03-05', 'DIESEL', 100.0,  77.00, 196800, 'INA Zagreb',                dt4],
    [6, '2026-01-20', 'DIESEL',  55.0,  75.50, 60000,  'Makpetrol Skopje',          dt5],
    [6, '2026-02-15', 'DIESEL',  60.0,  76.00, 61100,  'OKTA Kicevo',               dt5],
    [6, '2026-03-12', 'DIESEL',  58.5,  76.50, 62400,  'Makpetrol Strumica',        dt5],
  ];
  for (const [vehicleId, date, fuelType, quantityLiters, pricePerLiter, mileageAtRefuel, location, tok] of fuel)
    await post('/fuel', { vehicleId, date, fuelType, quantityLiters, pricePerLiter, mileageAtRefuel, location }, tok);
  console.log(`  ${fuel.length} fuel logs done`);

  // ── Service records ───────────────────────────────────────────────────────
  console.log('Service records...');
  const svc = [
    [1, 'OIL_CHANGE',           '2026-01-15', 82350,  'Avtoservis Janovski - Skopje',        3200,  'CONFIRMED', fm1],
    [1, 'TECHNICAL_INSPECTION', '2026-02-20', 83600,  'JP Makedonija pat - Tehnicki pregled', 1800,  'CONFIRMED', fm1],
    [1, 'FILTER_CHANGE',        '2026-03-15', 85000,  'Avtoservis Janovski - Skopje',         1200,  'PENDING',   fm1],
    [2, 'OIL_CHANGE',           '2026-01-25', 120780, 'VW Servis Skopje',                     3800,  'CONFIRMED', fm1],
    [2, 'TIRE_CHANGE',          '2026-03-02', 124500, 'Avtoservis Petkov',                    8500,  'CONFIRMED', fm1],
    [3, 'FILTER_CHANGE',        '2026-02-10', 44450,  'Ford Ovlasten Servis Skopje',           2100,  'CONFIRMED', fm1],
    [3, 'OIL_CHANGE',           '2026-03-20', 45200,  'Ford Ovlasten Servis Skopje',           2800,  'PENDING',   fm1],
    [4, 'OIL_CHANGE',           '2026-03-25', 12000,  'Toyota Ovlasten Servis Skopje',         3500,  'PENDING',   fm1],
    [5, 'ENGINE_REPAIR',        '2026-02-01', 195200, 'Iveco Ovlasten Servis - Skopje',       45000, 'CONFIRMED', fm2],
    [5, 'OIL_CHANGE',           '2026-03-10', 198700, 'Avtoservis Balkan',                    4200,  'CONFIRMED', fm2],
    [6, 'TECHNICAL_INSPECTION', '2026-01-28', 61100,  'JP Makedonija pat - Tehnicki pregled', 1800,  'CONFIRMED', fm2],
    [6, 'TIRE_CHANGE',          '2026-02-20', 62400,  'Renault Servis Skopje',                7200,  'CONFIRMED', fm2],
  ];
  for (const [vehicleId, serviceType, date, mileage, location, cost, status, tok] of svc)
    await post('/service-records', { vehicleId, serviceType, date, mileage, location, cost, status }, tok);
  console.log(`  ${svc.length} service records done`);

  // ── Defects ───────────────────────────────────────────────────────────────
  console.log('Defects...');
  const def = [
    [1, 'Abenje na kocnici',                  'Se slusha shkrip pri kochenje, prednite plochki treba zamena',  'HIGH',   dt1],
    [1, 'Puknatina na vetrobransko staklo',   'Puknatina dolna strana 15sm, ne go poprechuva vidot',           'MEDIUM', dt1],
    [2, 'Neispravna klimatizacija',            'Klimata ne ladi, potrebno dopolnuvanje na freon',               'MEDIUM', dt2],
    [2, 'Izgorena zadna leva svetilka',        'Zadna leva stop svetilka ne raboti',                            'HIGH',   dt2],
    [3, 'Tekenje na maslo',                    'Maslo pod voziloto, malo tekenje od zaptivkata',                'HIGH',   dt3],
    [4, 'Grebnati.na na predniot branik',      'Lesna grebnati.na pri manevriranje vo skladi.shteto',           'LOW',    adm],
    [5, 'Vibracii pri vozenje',                'Pri brzina nad 80kmh vibracii na volanot',                      'MEDIUM', dt4],
    [5, 'Osteten.o stranichno ogledalo desno', 'Ogledalo osteten.o, potrebna zamena',                           'LOW',    dt4],
    [6, 'Slaba baterija',                      'Teshko palenje nautro, baterijata treba proverka',              'MEDIUM', dt5],
    [6, 'Greshka senzor pritisok gumi',        'TPMS indikatorot postojano sveti',                              'LOW',    dt5],
  ];
  for (const [vehicleId, title, description, priority, tok] of def)
    await post('/defects', { vehicleId, title, description, priority }, tok);
  console.log(`  ${def.length} defects done`);

  // ── Maintenance reminders ─────────────────────────────────────────────────
  console.log('Reminders...');
  const rem = [
    [{ vehicleId: 1, serviceType: 'OIL_CHANGE',           intervalType: 'BOTH',    mileageInterval: 15000, dateIntervalMonths: 12, lastServiceDate: '2026-01-15', lastServiceMileage: 82350,  warningThresholdKm: 1000, warningThresholdDays: 14 }, fm1],
    [{ vehicleId: 1, serviceType: 'TECHNICAL_INSPECTION', intervalType: 'DATE',    dateIntervalMonths: 12, lastServiceDate: '2026-02-20', warningThresholdDays: 30 }, fm1],
    [{ vehicleId: 2, serviceType: 'OIL_CHANGE',           intervalType: 'MILEAGE', mileageInterval: 15000, lastServiceMileage: 120780, warningThresholdKm: 1000 }, fm1],
    [{ vehicleId: 2, serviceType: 'TIRE_CHANGE',          intervalType: 'DATE',    dateIntervalMonths: 6,  lastServiceDate: '2026-03-02', warningThresholdDays: 20 }, fm1],
    [{ vehicleId: 3, serviceType: 'OIL_CHANGE',           intervalType: 'MILEAGE', mileageInterval: 10000, lastServiceMileage: 44450, warningThresholdKm: 800 }, fm1],
    [{ vehicleId: 3, serviceType: 'FILTER_CHANGE',        intervalType: 'DATE',    dateIntervalMonths: 12, lastServiceDate: '2026-02-10', warningThresholdDays: 30 }, fm1],
    [{ vehicleId: 4, serviceType: 'OIL_CHANGE',           intervalType: 'MILEAGE', mileageInterval: 10000, lastServiceMileage: 2000, warningThresholdKm: 500 }, fm1],
    [{ vehicleId: 5, serviceType: 'OIL_CHANGE',           intervalType: 'BOTH',    mileageInterval: 10000, dateIntervalMonths: 12, lastServiceDate: '2025-03-01', lastServiceMileage: 185000, warningThresholdKm: 3000, warningThresholdDays: 30 }, fm2],
    [{ vehicleId: 5, serviceType: 'TECHNICAL_INSPECTION', intervalType: 'DATE',    dateIntervalMonths: 12, lastServiceDate: '2025-04-01', warningThresholdDays: 30 }, fm2],
    [{ vehicleId: 6, serviceType: 'OIL_CHANGE',           intervalType: 'BOTH',    mileageInterval: 15000, dateIntervalMonths: 12, lastServiceDate: '2026-01-28', lastServiceMileage: 60000,  warningThresholdKm: 1000, warningThresholdDays: 14 }, fm2],
    [{ vehicleId: 6, serviceType: 'TIRE_CHANGE',          intervalType: 'DATE',    dateIntervalMonths: 6,  lastServiceDate: '2026-02-20', warningThresholdDays: 20 }, fm2],
  ];
  for (const [body, tok] of rem)
    await post('/reminders', body, tok);
  console.log(`  ${rem.length} reminders done`);

  console.log('\n✅  Database fully seeded!');
  console.log('  ADMIN         admin@wheelsync.mk                       Admin123!');
  console.log('  FLEET_MANAGER marko.petrovski@transport.mk             Password123!');
  console.log('  FLEET_MANAGER elena.dimitrievska@logistika.mk          Password123!');
  console.log('  DRIVER        aleksandar.nikolovski@transport.mk       Password123!');
  console.log('  DRIVER        jovana.stojanovska@transport.mk          Password123!');
  console.log('  DRIVER        petar.spirovski@transport.mk             Password123!');
  console.log('  DRIVER        boris.stefanovski@logistika.mk           Password123!');
  console.log('  DRIVER        ana.ristovska@logistika.mk               Password123!');
}

main().catch(e => { console.error('ERR', e.message); process.exit(1); });
