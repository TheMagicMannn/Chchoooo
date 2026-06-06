import Stripe from 'stripe';
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "./stripeClient.js";

export class StripeStorage {
  async getUser(userId: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    return user ?? null;
  }

  async updateUserStripe(userId: string, data: { stripeCustomerId?: string; stripeSubscriptionId?: string; plan?: string }) {
    const [user] = await db.update(usersTable).set(data).where(eq(usersTable.id, userId)).returning();
    return user;
  }

  async getSubscription(customerId: string): Promise<Stripe.Subscription | null> {
    const stripe = await getUncachableStripeClient();
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    return subs.data[0] ?? null;
  }

  async listPrices() {
    const stripe = await getUncachableStripeClient();
    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, limit: 100 }),
    ]);

    const productMap = new Map(products.data.map((p) => [p.id, p]));

    return prices.data
      .filter((pr) => pr.recurring)
      .map((pr) => {
        const product = productMap.get(pr.product as string);
        return {
          product_id: pr.product as string,
          product_name: product?.name ?? "",
          product_description: product?.description ?? null,
          product_metadata: product?.metadata ?? {},
          price_id: pr.id,
          unit_amount: pr.unit_amount,
          currency: pr.currency,
          recurring: pr.recurring,
          price_metadata: pr.metadata ?? {},
        };
      })
      .sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0));
  }
}

export const stripeStorage = new StripeStorage();
