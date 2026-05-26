// seed5.mjs — add remaining reminders after BOTH constraint fix
// Already created: id=2 (v1 TECHNICAL_INSPECTION DATE), id=4 (v2 OIL_CHANGE MILEAGE)

const BASE = 'https://wheelsync-api-mwes.onrender.com/api';
const post = (p, b, t) => fetch(`${BASE}${p}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
  body: JSON.stringify(b)
}).then(r => r.json());
const login = async (e, p) => (await post('/auth/login', { email: e, password: p })).data.token;

async function main() {
  const fm1 = await login('marko.petrovski@transport.mk',    'Password123!');
  const fm2 = await login('elena.dimitrievska@logistika.mk', 'Password123!');

  const rem = [
    // v1 OIL_CHANGE BOTH (previously failed)
    [{ vehicleId: 1, serviceType: 'OIL_CHANGE',           intervalType: 'BOTH',    mileageInterval: 15000, dateIntervalMonths: 12, lastServiceDate: '2026-01-15', lastServiceMileage: 82350,  warningThresholdKm: 1000, warningThresholdDays: 14 }, fm1],
    // v2 TIRE_CHANGE DATE
    [{ vehicleId: 2, serviceType: 'TIRE_CHANGE',          intervalType: 'DATE',    dateIntervalMonths: 6,  lastServiceDate: '2026-03-02', warningThresholdDays: 20 }, fm1],
    // v3
    [{ vehicleId: 3, serviceType: 'OIL_CHANGE',           intervalType: 'MILEAGE', mileageInterval: 10000, lastServiceMileage: 44450, warningThresholdKm: 800 }, fm1],
    [{ vehicleId: 3, serviceType: 'FILTER_CHANGE',        intervalType: 'DATE',    dateIntervalMonths: 12, lastServiceDate: '2026-02-10', warningThresholdDays: 30 }, fm1],
    // v4
    [{ vehicleId: 4, serviceType: 'OIL_CHANGE',           intervalType: 'MILEAGE', mileageInterval: 10000, lastServiceMileage: 2000, warningThresholdKm: 500 }, fm1],
    // v5 (company 2) — due soon for demo
    [{ vehicleId: 5, serviceType: 'OIL_CHANGE',           intervalType: 'BOTH',    mileageInterval: 10000, dateIntervalMonths: 12, lastServiceDate: '2025-03-01', lastServiceMileage: 185000, warningThresholdKm: 3000, warningThresholdDays: 30 }, fm2],
    [{ vehicleId: 5, serviceType: 'TECHNICAL_INSPECTION', intervalType: 'DATE',    dateIntervalMonths: 12, lastServiceDate: '2025-04-01', warningThresholdDays: 30 }, fm2],
    // v6
    [{ vehicleId: 6, serviceType: 'OIL_CHANGE',           intervalType: 'BOTH',    mileageInterval: 15000, dateIntervalMonths: 12, lastServiceDate: '2026-01-28', lastServiceMileage: 60000,  warningThresholdKm: 1000, warningThresholdDays: 14 }, fm2],
    [{ vehicleId: 6, serviceType: 'TIRE_CHANGE',          intervalType: 'DATE',    dateIntervalMonths: 6,  lastServiceDate: '2026-02-20', warningThresholdDays: 20 }, fm2],
  ];

  let ok = 0, fail = 0;
  for (const [body, tok] of rem) {
    const r = await post('/reminders', body, tok);
    if (r.success) { ok++; console.log(`  ✓ v${body.vehicleId} ${body.serviceType} ${body.intervalType} → id=${r.data.id}`); }
    else           { fail++; console.log(`  ✗ v${body.vehicleId} ${body.serviceType}: ${r.message}`); }
  }
  console.log(`\n✅ Done — ${ok} created, ${fail} failed`);
}

main().catch(e => console.error('ERR', e.message));
