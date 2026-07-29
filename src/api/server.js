import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "../config/env.js";
import {
  createContent,
  getSiteSettings,
  listPublished,
  submitWhitelistApplication,
  updateSiteSettings
} from "../services/content-service.js";
import { requireAdmin, validateWhitelist } from "./middleware.js";
import { registerDiscordAuth } from "./discord-auth.js";

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

  app.post("/api/whitelist", validateWhitelist, async (req, res, next) => {
    try {
      res.status(201).json({ data: await submitWhitelistApplication(req.body) });
    } catch (error) { next(error); }
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
    res.status(500).json({
      error: env.nodeEnv === "production" ? "Interní chyba serveru." : error.message
    });
  });
  return app;
}
