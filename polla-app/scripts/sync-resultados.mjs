// Actualiza marcadores reales (corre en el cron). Mismo upsert que el seed.
import { sincronizarFixtures } from './_fixtures.mjs';

const n = await sincronizarFixtures();
console.log(`Sync OK: ${n} partidos`);
