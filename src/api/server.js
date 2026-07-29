import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "../config/env.js";
import {
  createContent,
  getSiteSettings,
  listPublished,
  updateSiteSettings
} from "../services/content-service.js";
import { requireAdmin, requireDiscordAdmin, requireSession } from "./middleware.js";
import { registerDiscordAuth } from "./discord-auth.js";
import {
  adjustAttempts, claimApplication, claimInterview, decideApplication, decideInterview,
  getPlayerWhitelist, listAdminApplications, listAdminInterviews, listGrantedAccess,
  requestInterview, revokeAccess, submitApplication
} from "../services/whitelist-service.js";

export function createApiServer() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({
    origin: env.publicOrigin.split(",").map(value => value.trim()),
    credentials: true
  }));
  app.use(express.json({ limit: "100kb" }));
  registerDiscordAuth(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "deadstone-platform", time: new Date().toISOString() });
  });

  app.get("/api/site", async (_req, res, next) => {
    try {
      res.json({ data: await getSiteSettings() });
    } catch (error) { next(error); }
  });

  app.get("/api/news", async (req, res, next) => {
    try {
      res.json({ data: await listPublished("news", req.query.limit) });
    } catch (error) { next(error); }
  });

  app.get("/api/towns", async (req, res, next) => {
    try {
      res.json({ data: await listPublished("towns", req.query.limit) });
    } catch (error) { next(error); }
  });

  app.get("/api/whitelist/me", requireSession, async (req, res, next) => {
    try {
      res.json({ data: await getPlayerWhitelist(req.user.id) });
    } catch (error) { next(error); }
  });

  app.post("/api/whitelist/applications", requireSession, async (req, res, next) => {
    try { res.status(201).json({ data: await submitApplication(req.user, req.body) }); }
    catch (error) { next(error); }
  });

  app.post("/api/whitelist/interviews", requireSession, async (req, res, next) => {
    try { res.status(201).json({ data: await requestInterview(req.user) }); }
    catch (error) { next(error); }
  });

  app.get("/api/admin/whitelist/applications", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await listAdminApplications(String(req.query.status || "pending")) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/admin/whitelist/applications/:id", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await decideApplication(req.params.id, req.user, req.body.decision, req.body.reason) }); }
    catch (error) { next(error); }
  });

  app.post("/api/admin/whitelist/applications/:id/claim", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await claimApplication(req.params.id, req.user) }); }
    catch (error) { next(error); }
  });

  app.get("/api/admin/whitelist/interviews", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await listAdminInterviews(String(req.query.status || "waiting")) }); }
    catch (error) { next(error); }
  });

  app.post("/api/admin/whitelist/interviews/:id/claim", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await claimInterview(req.params.id, req.user) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/admin/whitelist/interviews/:id", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await decideInterview(req.params.id, req.user, req.body.decision, req.body.reason) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/admin/whitelist/attempts/:discordId", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await adjustAttempts(req.params.discordId, req.body.type, req.body.amount) }); }
    catch (error) { next(error); }
  });

  app.get("/api/admin/whitelist/access", requireDiscordAdmin, async (_req, res, next) => {
    try { res.json({ data: await listGrantedAccess() }); }
    catch (error) { next(error); }
  });

  app.post("/api/admin/whitelist/access/:discordId/revoke", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await revokeAccess(req.params.discordId, req.user) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/admin/site", requireAdmin, async (req, res, next) => {
    try {
      res.json({ data: await updateSiteSettings(req.body, "api-admin") });
    } catch (error) { next(error); }
  });

  app.post("/api/admin/:collection", requireAdmin, async (req, res, next) => {
    try {
      if (!["news", "towns"].includes(req.params.collection)) {
        return res.status(404).json({ error: "Nepovolený typ obsahu." });
      }
      res.status(201).json({
        data: await createContent(req.params.collection, req.body, "api-admin")
      });
    } catch (error) { next(error); }
  });

  app.use((_req, res) => res.status(404).json({ error: "Endpoint nebyl nalezen." }));
  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(error.status || 500).json({
      error: env.nodeEnv === "production" && !error.status ? "Interní chyba serveru." : error.message
    });
  });
  return app;
}
