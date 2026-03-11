/**
 * Seed script — creates 500 dummy riders and 1000 dummy drivers.
 *
 * Usage (Docker must be running):
 *   node scripts/seed.js
 *
 * Default password for all seeded accounts: Password123!
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

// ─── Config ───────────────────────────────────────────────────────────────────
const PG_BASE = {
  host: 'localhost',
  port: 5432,
  user: 'ride',
  password: 'ride_secret',
};

const RIDER_COUNT  = 500;
const DRIVER_COUNT = 1000;
const BATCH_SIZE   = 100;
const PASSWORD     = 'Password123!';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  'James','John','Robert','Michael','William','David','Richard','Joseph',
  'Thomas','Charles','Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth',
  'Susan','Jessica','Sarah','Karen','Daniel','Matthew','Anthony','Mark','Donald',
  'Steven','Paul','Andrew','Kenneth','Joshua','Kevin','Brian','George','Timothy',
  'Ronald','Edward','Jason','Jeffrey','Ryan','Jacob','Gary','Nicholas','Eric',
  'Jonathan','Stephen','Larry','Justin','Scott','Brandon','Benjamin','Samuel',
  'Raymond','Gregory','Frank','Alexander','Patrick','Jack','Dennis','Jerry',
  'Tyler','Aaron','Jose','Adam','Nathan','Henry','Douglas','Zachary','Peter',
  'Kyle','Walter','Ethan','Jeremy','Harold','Terry','Sean','Austin','Gerald',
  'Carl','Keith','Roger','Arthur','Lawrence','Dylan','Jesse','Bryan','Joe',
  'Jordan','Billy','Bruce','Albert','Willie','Gabriel','Logan','Alan','Juan',
  'Wayne','Roy','Ralph','Randy','Eugene','Vincent','Russell','Louis','Philip',
];

const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis',
  'Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson',
  'Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White',
  'Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young',
  'Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green',
  'Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts',
  'Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins',
  'Reyes','Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Ortiz',
  'Morgan','Cooper','Peterson','Bailey','Reed','Kelly','Howard','Ramos','Kim',
  'Cox','Ward','Richardson','Watson','Brooks','Chavez','Wood','James','Bennett',
  'Gray','Mendoza','Ruiz','Hughes','Price','Alvarez','Castillo','Sanders','Patel',
  'Myers','Long','Ross','Foster','Jimenez',
];

const VEHICLE_MAKES  = ['Toyota','Honda','Ford','Chevrolet','Nissan','Hyundai','Kia','Volkswagen','BMW','Mercedes-Benz'];
const VEHICLE_MODELS = {
  Toyota:       ['Camry','Corolla','RAV4','Highlander','Prius'],
  Honda:        ['Civic','Accord','CR-V','Pilot','Odyssey'],
  Ford:         ['F-150','Escape','Explorer','Fusion','Mustang'],
  Chevrolet:    ['Malibu','Equinox','Tahoe','Silverado','Impala'],
  Nissan:       ['Altima','Sentra','Rogue','Pathfinder','Maxima'],
  Hyundai:      ['Elantra','Sonata','Tucson','Santa Fe','Accent'],
  Kia:          ['Optima','Forte','Sportage','Sorento','Soul'],
  Volkswagen:   ['Jetta','Passat','Tiguan','Golf','Atlas'],
  BMW:          ['3 Series','5 Series','X3','X5','7 Series'],
  'Mercedes-Benz': ['C-Class','E-Class','GLC','GLE','S-Class'],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomPhone() {
  return `+1${String(Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000)}`;
}

function randomPlate() {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const L = () => letters[Math.floor(Math.random() * letters.length)];
  const D = () => Math.floor(Math.random() * 10);
  return `${L()}${L()}${L()}-${D()}${D()}${D()}`;
}

function randomLicense() {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function randomRating() {
  // Realistic distribution: most drivers have 4.0–5.0
  return +(3.5 + Math.random() * 1.5).toFixed(2);
}

async function insertBatch(client, table, columns, rows) {
  if (!rows.length) return;
  const placeholders = rows.map(
    (_, ri) => `(${columns.map((_, ci) => `$${ri * columns.length + ci + 1}`).join(',')})`
  ).join(',');
  const values = rows.flatMap(r => columns.map(c => r[c]));
  await client.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`, values);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Hashing password…');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const authDb   = new Client({ ...PG_BASE, database: 'auth_db' });
  const driverDb = new Client({ ...PG_BASE, database: 'driver_db' });

  await authDb.connect();
  await driverDb.connect();
  console.log('Connected to auth_db and driver_db.');

  try {
    // ── 1. Seed 500 riders ──────────────────────────────────────────────────
    console.log(`\nSeeding ${RIDER_COUNT} riders into auth_db…`);
    const riderUsers = Array.from({ length: RIDER_COUNT }, (_, i) => ({
      id:            randomUUID(),
      email:         `rider${i + 1}@seed.local`,
      phone:         randomPhone(),
      password_hash: passwordHash,
      role:          'rider',
      is_active:     true,
      created_at:    new Date(),
      updated_at:    new Date(),
    }));

    const riderCols = ['id','email','phone','password_hash','role','is_active','created_at','updated_at'];
    for (let i = 0; i < riderUsers.length; i += BATCH_SIZE) {
      await insertBatch(authDb, 'users', riderCols, riderUsers.slice(i, i + BATCH_SIZE));
      process.stdout.write(`  riders: ${Math.min(i + BATCH_SIZE, RIDER_COUNT)}/${RIDER_COUNT}\r`);
    }
    console.log(`  riders: ${RIDER_COUNT}/${RIDER_COUNT} ✓`);

    // ── 2. Seed 1000 drivers (user record + driver record) ──────────────────
    console.log(`\nSeeding ${DRIVER_COUNT} drivers…`);
    const driverUsers   = [];
    const driverRecords = [];

    for (let i = 0; i < DRIVER_COUNT; i++) {
      const id    = randomUUID();
      const make  = pick(VEHICLE_MAKES);
      const model = pick(VEHICLE_MODELS[make]);

      driverUsers.push({
        id,
        email:         `driver${i + 1}@seed.local`,
        phone:         randomPhone(),
        password_hash: passwordHash,
        role:          'driver',
        is_active:     true,
        created_at:    new Date(),
        updated_at:    new Date(),
      });

      driverRecords.push({
        id,
        first_name:    pick(FIRST_NAMES),
        last_name:     pick(LAST_NAMES),
        license_no:    randomLicense(),
        vehicle_make:  make,
        vehicle_model: model,
        vehicle_plate: randomPlate(),
        rating:        randomRating(),
        is_available:  Math.random() < 0.6,   // 60% online
        is_verified:   Math.random() < 0.8,   // 80% verified
        created_at:    new Date(),
        updated_at:    new Date(),
      });
    }

    // Insert driver users into auth_db
    const driverUserCols = ['id','email','phone','password_hash','role','is_active','created_at','updated_at'];
    for (let i = 0; i < driverUsers.length; i += BATCH_SIZE) {
      await insertBatch(authDb, 'users', driverUserCols, driverUsers.slice(i, i + BATCH_SIZE));
      process.stdout.write(`  driver users in auth_db: ${Math.min(i + BATCH_SIZE, DRIVER_COUNT)}/${DRIVER_COUNT}\r`);
    }
    console.log(`  driver users in auth_db: ${DRIVER_COUNT}/${DRIVER_COUNT} ✓`);

    // Insert driver profiles into driver_db
    const driverCols = ['id','first_name','last_name','license_no','vehicle_make','vehicle_model','vehicle_plate','rating','is_available','is_verified','created_at','updated_at'];
    for (let i = 0; i < driverRecords.length; i += BATCH_SIZE) {
      await insertBatch(driverDb, 'drivers', driverCols, driverRecords.slice(i, i + BATCH_SIZE));
      process.stdout.write(`  driver profiles in driver_db: ${Math.min(i + BATCH_SIZE, DRIVER_COUNT)}/${DRIVER_COUNT}\r`);
    }
    console.log(`  driver profiles in driver_db: ${DRIVER_COUNT}/${DRIVER_COUNT} ✓`);

    // ── Summary ─────────────────────────────────────────────────────────────
    const { rows: [{ count: totalUsers }] } = await authDb.query('SELECT COUNT(*) FROM users');
    const { rows: [{ count: totalDrivers }] } = await driverDb.query('SELECT COUNT(*) FROM drivers');

    console.log('\n─── Seed complete ───────────────────────────────');
    console.log(`  auth_db  → users   : ${totalUsers}`);
    console.log(`  driver_db → drivers: ${totalDrivers}`);
    console.log(`  Password for all accounts: ${PASSWORD}`);
    console.log('─────────────────────────────────────────────────\n');
  } finally {
    await authDb.end();
    await driverDb.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
