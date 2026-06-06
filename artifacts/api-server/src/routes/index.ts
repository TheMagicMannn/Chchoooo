import { Router, type IRouter } from "express";
import healthRouter from "./health";
import domainsRouter from "./domains";
import tokensRouter from "./tokens";
import ingestRouter from "./ingest";
import dashboardRouter from "./dashboard";
import analyticsRouter from "./analytics";
import webhooksRouter from "./webhooks";
import alertRulesRouter from "./alert_rules";
import billingRouter from "./billing";
import stripeBillingRouter from "./stripe_billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/domains", domainsRouter);
router.use("/tokens", tokensRouter);
router.use("/ingest", ingestRouter);
router.use("/dashboard", dashboardRouter);
router.use("/analytics", analyticsRouter);
router.use("/webhooks", webhooksRouter);
router.use("/alerts", alertRulesRouter);
router.use("/billing", billingRouter);
router.use("/stripe", stripeBillingRouter);

export default router;
