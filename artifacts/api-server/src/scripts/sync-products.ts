import Stripe from 'stripe';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY not set');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL not set');

  const stripe = new Stripe(secretKey);
  const pool = new Pool({ connectionString: databaseUrl });

  console.log('Fetching products from Stripe...');
  const products = await stripe.products.list({ active: true, limit: 100 });
  console.log(`Found ${products.data.length} products`);

  const prices = await stripe.prices.list({ active: true, limit: 100 });
  console.log(`Found ${prices.data.length} prices`);

  const client = await pool.connect();
  try {
    for (const p of products.data) {
      await client.query(
        `INSERT INTO stripe.products (id, object, name, description, active, metadata, created, updated, livemode, _raw_data)
         VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7), to_timestamp($8), $9, $10)
         ON CONFLICT (id) DO UPDATE SET name=$3, description=$4, active=$5, metadata=$6, updated=to_timestamp($8)`,
        [p.id, p.object, p.name, p.description ?? null, p.active, JSON.stringify(p.metadata ?? {}), p.created, p.updated, p.livemode, JSON.stringify(p)]
      );
      console.log(`  ✓ Product: ${p.name} (${p.id})`);
    }

    for (const pr of prices.data) {
      await client.query(
        `INSERT INTO stripe.prices (id, object, product, unit_amount, currency, recurring, active, type, billing_scheme, metadata, created, livemode, _raw_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, to_timestamp($11), $12, $13)
         ON CONFLICT (id) DO UPDATE SET product=$3, unit_amount=$4, currency=$5, recurring=$6, active=$7`,
        [
          pr.id, pr.object, pr.product as string,
          pr.unit_amount, pr.currency,
          pr.recurring ? JSON.stringify(pr.recurring) : null,
          pr.active, pr.type, pr.billing_scheme,
          JSON.stringify(pr.metadata ?? {}), pr.created, pr.livemode, JSON.stringify(pr)
        ]
      );
      console.log(`  ✓ Price: ${pr.id} $${(pr.unit_amount ?? 0) / 100}/${pr.recurring?.interval ?? 'once'}`);
    }

    console.log('\nSync complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
