import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from '../stripeClient.js';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL not set');

  console.log('Running Stripe schema migrations...');
  await runMigrations({ databaseUrl, schema: 'stripe' });
  console.log('Schema ready. Running backfill...');

  const sync = await getStripeSync();
  await sync.syncBackfill();
  console.log('Backfill complete.');
}

main().catch((err) => { console.error(err); process.exit(1); });
