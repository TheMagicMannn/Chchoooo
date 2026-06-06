import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export class StripeStorage {
  async getUser(clerkId: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
    return user ?? null;
  }

  async updateUserStripe(userId: string, data: { stripeCustomerId?: string; stripeSubscriptionId?: string; plan?: string }) {
    const [user] = await db.update(usersTable).set(data).where(eq(usersTable.id, userId)).returning();
    return user;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] ?? null;
  }

  async getActiveSubscriptionForCustomer(customerId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE customer = ${customerId} AND status = 'active' LIMIT 1`
    );
    return result.rows[0] ?? null;
  }

  async listPrices() {
    const result = await db.execute(
      sql`
        SELECT
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.metadata as price_metadata
        FROM stripe.products p
        JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        ORDER BY pr.unit_amount ASC
      `
    );
    return result.rows;
  }
}

export const stripeStorage = new StripeStorage();
