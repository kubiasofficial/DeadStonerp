import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "../config/env.js";
import {
  createContent,
  deleteContent,
  getSiteSettings,
  listAdminContent,
  listPublished,
  updateContent,
  uploadContentImage,
  updateSiteSettings
} from "../services/content-service.js";
import { requireAdmin, requireDiscordAdmin, requireFullAccess, requireSession } from "./middleware.js";
import { registerDiscordAuth } from "./discord-auth.js";
import {
  adjustAttempts, claimApplication, claimInterview, decideApplication, decideInterview,
  getPlayerWhitelist, listAdminApplications, listAdminInterviews, listGrantedAccess,
  requestInterview, revokeAccess, submitApplication
} from "../services/whitelist-service.js";
import {
  acknowledgeCharacterEdit, adminUpdateCharacter, createCharacter, decideCharacter,
  deleteCharacter, listAdminCharacters, listApprovedCharacters, listMyCharacters,
  updateMyCharacter
} from "../services/character-service.js";
import { getLeadership } from "../services/leadership-service.js";
import {
  addMessage, claimTicket, closeTicket, createFeedback, createTicket, feedbackReputation,
  getTicket, getTicketSettings, listAdminTickets, listEligibleFactionMembers, listFeedback,
  listMyFactionInvitations, respondFactionInvitation,
  listMyTickets, prepareTicketUpload, setPriority, transferTicket, updateTicketSettings
} from "../services/ticket-service.js";
import { createAtlasEntry, deleteAtlasEntry, getAtlas, updateAtlasEntry } from "../services/atlas-service.js";

export function createApiServer() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({
    origin: env.publicOrigin.split(",").map(value => value.trim()),
    credentials: true
  }));
  app.use(express.json({ limit: "48mb" }));
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

  app.get("/api/leadership", async (_req, res, next) => {
    try {
      res.set("Cache-Control", "public, max-age=60, s-maxage=300");
      res.json({ data: await getLeadership() });
    } catch (error) { next(error); }
  });

  app.get("/api/atlas", async (_req, res, next) => {
    try {
      res.set("Cache-Control", "public, max-age=60, s-maxage=300");
      res.json({ data: await getAtlas(true) });
    } catch (error) { next(error); }
  });

  app.get("/api/admin/atlas", requireDiscordAdmin, async (_req, res, next) => {
    try { res.json({ data: await getAtlas(false) }); }
    catch (error) { next(error); }
  });

  app.post("/api/admin/atlas/:kind", requireDiscordAdmin, async (req, res, next) => {
    try { res.status(201).json({ data: await createAtlasEntry(req.params.kind, req.body, req.user) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/admin/atlas/:kind/:id", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await updateAtlasEntry(req.params.kind, req.params.id, req.body, req.user) }); }
    catch (error) { next(error); }
  });

  app.delete("/api/admin/atlas/:kind/:id", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await deleteAtlasEntry(req.params.kind, req.params.id, req.user) }); }
    catch (error) { next(error); }
  });

  app.get("/api/support/faction-members", requireSession, async (_req, res, next) => {
    try { res.json({ data: await listEligibleFactionMembers() }); }
    catch (error) { next(error); }
  });

  app.get("/api/support/faction-invitations", requireSession, async (req, res, next) => {
    try { res.json({ data: await listMyFactionInvitations(req.user.id) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/support/faction-invitations/:id", requireSession, async (req, res, next) => {
    try { res.json({ data: await respondFactionInvitation(req.user, req.params.id, req.body.response) }); }
    catch (error) { next(error); }
  });

  app.post("/api/tickets", requireSession, async (req, res, next) => {
    try { res.status(201).json({ data: await createTicket(req.user, req.body) }); }
    catch (error) { next(error); }
  });

  app.post("/api/tickets/upload", requireSession, async (req, res, next) => {
    try { res.json({ data: await prepareTicketUpload(req.user, req.body) }); }
    catch (error) { next(error); }
  });

  app.get("/api/tickets/mine", requireSession, async (req, res, next) => {
    try { res.json({ data: await listMyTickets(req.user.id) }); }
    catch (error) { next(error); }
  });

  app.get("/api/tickets/:id", requireSession, async (req, res, next) => {
    try { res.json({ data: await getTicket(req.params.id, req.user, false) }); }
    catch (error) { next(error); }
  });

  app.post("/api/tickets/:id/messages", requireSession, async (req, res, next) => {
    try { res.status(201).json({ data: await addMessage(req.params.id, req.user, req.body, false) }); }
    catch (error) { next(error); }
  });

  app.post("/api/feedback", requireSession, async (req, res, next) => {
    try { res.status(201).json({ data: await createFeedback(req.user, req.body) }); }
    catch (error) { next(error); }
  });

  app.get("/api/admin/tickets", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await listAdminTickets(req.user, req.user.roles, String(req.query.status || "waiting")) }); }
    catch (error) { next(error); }
  });

  app.get("/api/admin/tickets/settings", requireDiscordAdmin, async (_req, res, next) => {
    try { res.json({ data: await getTicketSettings() }); }
    catch (error) { next(error); }
  });

  app.patch("/api/admin/tickets/settings", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await updateTicketSettings(req.user, req.body.access) }); }
    catch (error) { next(error); }
  });

  app.get("/api/admin/tickets/reputation", requireDiscordAdmin, async (_req, res, next) => {
    try { res.json({ data: await feedbackReputation() }); }
    catch (error) { next(error); }
  });

  app.get("/api/admin/tickets/feedback", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await listFeedback(req.user.roles) }); }
    catch (error) { next(error); }
  });

  app.get("/api/admin/tickets/:id", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await getTicket(req.params.id, req.user, true) }); }
    catch (error) { next(error); }
  });

  app.post("/api/admin/tickets/:id/claim", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await claimTicket(req.params.id, req.user, req.user.roles, Boolean(req.body.force)) }); }
    catch (error) { next(error); }
  });

  app.post("/api/admin/tickets/:id/messages", requireDiscordAdmin, async (req, res, next) => {
    try { res.status(201).json({ data: await addMessage(req.params.id, req.user, req.body, true) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/admin/tickets/:id/priority", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await setPriority(req.params.id, req.user, req.body.priority) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/admin/tickets/:id/transfer", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await transferTicket(req.params.id, req.user, req.body.assigneeId, req.body.assigneeName) }); }
    catch (error) { next(error); }
  });

  app.post("/api/admin/tickets/:id/close", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await closeTicket(req.params.id, req.user, req.body.reason, req.body.message) }); }
    catch (error) { next(error); }
  });

  app.get("/api/characters", requireFullAccess, async (_req, res, next) => {
    try { res.json({ data: await listApprovedCharacters() }); }
    catch (error) { next(error); }
  });

  app.get("/api/characters/mine", requireFullAccess, async (req, res, next) => {
    try { res.json({ data: await listMyCharacters(req.user.id) }); }
    catch (error) { next(error); }
  });

  app.post("/api/characters", requireFullAccess, async (req, res, next) => {
    try { res.status(201).json({ data: await createCharacter(req.user, req.body) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/characters/:id", requireFullAccess, async (req, res, next) => {
    try { res.json({ data: await updateMyCharacter(req.user, req.params.id, req.body) }); }
    catch (error) { next(error); }
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

  app.get("/api/admin/content/:collection", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await listAdminContent(req.params.collection) }); }
    catch (error) { next(error); }
  });

  app.get("/api/admin/characters", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await listAdminCharacters(String(req.query.status || "pending")) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/admin/characters/:id/decision", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await decideCharacter(req.params.id, req.user, req.body.decision, req.body.reason) }); }
    catch (error) { next(error); }
  });

  app.post("/api/admin/characters/:id/acknowledge", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await acknowledgeCharacterEdit(req.params.id, req.user) }); }
    catch (error) { next(error); }
  });

  app.patch("/api/admin/characters/:id", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await adminUpdateCharacter(req.params.id, req.body, req.user) }); }
    catch (error) { next(error); }
  });

  app.delete("/api/admin/characters/:id", requireDiscordAdmin, async (req, res, next) => {
    try { res.json({ data: await deleteCharacter(req.params.id, req.user) }); }
    catch (error) { next(error); }
  });

  app.post("/api/admin/content/:collection", requireDiscordAdmin, async (req, res, next) => {
    try {
      res.status(201).json({
        data: await createContent(req.params.collection, req.body, `discord:${req.user.id}`)
      });
    } catch (error) { next(error); }
  });

  app.patch("/api/admin/content/:collection/:id", requireDiscordAdmin, async (req, res, next) => {
    try {
      res.json({
        data: await updateContent(req.params.collection, req.params.id, req.body, `discord:${req.user.id}`)
      });
    } catch (error) { next(error); }
  });

  app.delete("/api/admin/content/:collection/:id", requireDiscordAdmin, async (req, res, next) => {
    try {
      res.json({
        data: await deleteContent(req.params.collection, req.params.id, `discord:${req.user.id}`)
      });
    } catch (error) { next(error); }
  });

  app.post("/api/admin/content-upload", requireDiscordAdmin, async (req, res, next) => {
    try { res.status(201).json({ data: await uploadContentImage(req.body.dataUrl, req.body.folder) }); }
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
