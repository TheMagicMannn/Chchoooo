import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { getUncachableStripeClient } from "../stripeClient";
import { stripeStorage } from "../stripeStorage";

const router = Router();

const APP_BASE_URL = process.env.APP_BASE_URL || `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost"}`;

const PLAN_BY_PRICE_NAME: Record<string, string> = {
  "Growth": "growth",
  "Enterprise": "enterprise",
};

router.get("/prices", async (_req, res) => {
  try {
    const prices = await stripeStorage.listPrices();
    res.json({ data: prices });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

router.post("/checkout", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { priceId } = req.body as { priceId: string };
    if (!priceId) return res.status(400).json({ error: "priceId required" });

    const user = await stripeStorage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const stripe = await getUncachableStripeClient();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      await stripeStorage.updateUserStripe(user.id, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${APP_BASE_URL}/billing?success=1`,
      cancel_url: `${APP_BASE_URL}/billing?canceled=1`,
      subscription_data: {
        metadata: { userId: user.id },
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to create checkout session" });
  }
});

router.post("/portal", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await stripeStorage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: "No billing account found. Please subscribe first." });
    }

    const stripe = await getUncachableStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${APP_BASE_URL}/billing`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to create portal session" });
  }
});

export default router;
