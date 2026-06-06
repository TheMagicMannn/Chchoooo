import { getUncachableStripeClient } from '../stripeClient';

async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log('Creating Proof of Human subscription products in Stripe...');

    const growthSearch = await stripe.products.search({ query: "name:'Growth' AND active:'true'" });
    if (growthSearch.data.length > 0) {
      console.log('Growth product already exists:', growthSearch.data[0].id);
    } else {
      const growth = await stripe.products.create({
        name: 'Growth',
        description: 'Up to 1,000,000 events/month. 5 sites, 90-day retention, advanced fingerprinting.',
        metadata: { plan: 'growth' },
      });
      const growthPrice = await stripe.prices.create({
        product: growth.id,
        unit_amount: 4999,
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      console.log(`✓ Growth created: ${growth.id} — price ${growthPrice.id} ($49.99/mo)`);
    }

    const enterpriseSearch = await stripe.products.search({ query: "name:'Enterprise' AND active:'true'" });
    if (enterpriseSearch.data.length > 0) {
      console.log('Enterprise product already exists:', enterpriseSearch.data[0].id);
    } else {
      const enterprise = await stripe.products.create({
        name: 'Enterprise',
        description: 'Up to 20,000,000 events/month. Unlimited sites, custom retention, ML fingerprinting, SLA.',
        metadata: { plan: 'enterprise' },
      });
      const enterprisePrice = await stripe.prices.create({
        product: enterprise.id,
        unit_amount: 49900,
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      console.log(`✓ Enterprise created: ${enterprise.id} — price ${enterprisePrice.id} ($499/mo)`);
    }

    console.log('\nAll products ready. Stripe webhooks will sync them to the database.');
  } catch (err: any) {
    console.error('Error creating products:', err.message);
    process.exit(1);
  }
}

createProducts();
