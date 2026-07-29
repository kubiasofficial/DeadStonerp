import { env } from "../config/env.js";

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
