// Pobla polla_partidos una vez. Uso (PowerShell):
//   $env:FOOTBALL_DATA_TOKEN="..."; $env:SUPABASE_URL="..."; $env:SUPABASE_SERVICE_KEY="..."
//   node scripts/seed-partidos.mjs
import { sincronizarFixtures } from './_fixtures.mjs';

const n = await sincronizarFixtures();
console.log(`Seed OK: ${n} partidos`);
