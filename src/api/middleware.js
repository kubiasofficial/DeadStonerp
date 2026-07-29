import { env } from "../config/env.js";
import { readSession } from "./discord-auth.js";

const DISCORD_API = "https://discord.com/api/v10";

export function requireSession(req, res, next) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: "Nejdříve se přihlaste přes Discord." });
  req.user = session;
  next();
}

export async function requireDiscordAdmin(req, res, next) {
  try {
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: "Nejdříve se přihlaste přes Discord." });
    const response = await fetch(`${DISCORD_API}/guilds/${env.discordGuildId}/members/${session.id}`, {
      headers: { Authorization: `Bot ${env.discordToken}` }
    });
    if (!response.ok) return res.status(403).json({ error: "Discord člen nebyl nalezen." });
    const member = await response.json();
    if (!env.discordAdminRoleIds.some(roleId => member.roles?.includes(roleId))) {
      return res.status(403).json({ error: "Nemáte administrátorskou roli." });
    }
    req.user = session;
    req.discordMember = member;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  const supplied = req.get("x-api-key");
  if (!env.adminKey || supplied !== env.adminKey) {
    return res.status(401).json({ error: "Neplatné administrátorské oprávnění." });
  }
  next();
}

export function validateWhitelist(req, res, next) {
  const { discordId, characterName, age, motivation } = req.body || {};
  if (!/^\d{15,22}$/.test(String(discordId || ""))) {
    return res.status(400).json({ error: "Discord ID není platné." });
  }
  if (String(characterName || "").trim().length < 3) {
    return res.status(400).json({ error: "Jméno postavy je příliš krátké." });
  }
  if (Number(age) < 16 || Number(age) > 100) {
    return res.status(400).json({ error: "Věk žadatele není v povoleném rozsahu." });
  }
  if (String(motivation || "").trim().length < 30) {
    return res.status(400).json({ error: "Motivace musí obsahovat alespoň 30 znaků." });
  }
  next();
}
