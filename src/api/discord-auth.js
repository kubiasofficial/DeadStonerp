import crypto from "node:crypto";
import { env } from "../config/env.js";
import { saveDiscordUser } from "../services/content-service.js";

const DISCORD_API = "https://discord.com/api/v10";
const SESSION_AGE = 60 * 60 * 24 * 7;

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map(part => {
    const index = part.indexOf("=");
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

function signature(value) {
  return crypto.createHmac("sha256", env.sessionSecret).update(value).digest("base64url");
}

function sessionToken(profile) {
  const payload = Buffer.from(JSON.stringify({
    ...profile,
    exp: Math.floor(Date.now() / 1000) + SESSION_AGE
  })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

function readSession(req) {
  if (!env.sessionSecret) return null;
  const token = cookies(req).deadstone_session;
  if (!token) return null;
  const [payload, provided] = token.split(".");
  if (!payload || !provided) return null;
  const expected = signature(payload);
  if (provided.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Date.now() / 1000 ? data : null;
  } catch {
    return null;
  }
}

function cookieOptions(maxAge = SESSION_AGE) {
  const production = env.nodeEnv === "production";
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    maxAge: maxAge * 1000,
    path: "/"
  };
}

function avatarUrl(user) {
  if (user.avatar) return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
  const index = user.discriminator === "0"
    ? Number((BigInt(user.id) >> 22n) % 6n)
    : Number(user.discriminator || 0) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export function registerDiscordAuth(app) {
  app.get("/auth/discord", (_req, res) => {
    if (!env.discordClientId || !env.discordClientSecret || !env.sessionSecret) {
      return res.status(503).send("Discord přihlášení zatím není nakonfigurováno.");
    }
    const state = crypto.randomBytes(24).toString("base64url");
    res.cookie("deadstone_oauth_state", state, { ...cookieOptions(600), sameSite: "lax" });
    const query = new URLSearchParams({
      client_id: env.discordClientId,
      response_type: "code",
      redirect_uri: env.discordRedirectUri,
      scope: "identify guilds.join",
      state,
      prompt: "consent"
    });
    res.redirect(`https://discord.com/oauth2/authorize?${query}`);
  });

  app.get("/auth/discord/callback", async (req, res, next) => {
    try {
      const state = cookies(req).deadstone_oauth_state;
      res.clearCookie("deadstone_oauth_state", cookieOptions(0));
      if (!state || state !== req.query.state || !req.query.code) {
        return res.status(400).send("Neplatný nebo expirovaný pokus o přihlášení.");
      }

      const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: env.discordClientId,
          client_secret: env.discordClientSecret,
          grant_type: "authorization_code",
          code: String(req.query.code),
          redirect_uri: env.discordRedirectUri
        })
      });
      if (!tokenResponse.ok) throw new Error(`Discord token exchange selhal (${tokenResponse.status}).`);
      const token = await tokenResponse.json();
      const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${token.access_token}` }
      });
      if (!userResponse.ok) throw new Error(`Načtení Discord profilu selhalo (${userResponse.status}).`);
      const user = await userResponse.json();

      const joinResponse = await fetch(`${DISCORD_API}/guilds/${env.discordGuildId}/members/${user.id}`, {
        method: "PUT",
        headers: { Authorization: `Bot ${env.discordToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token.access_token })
      });
      if (![201, 204].includes(joinResponse.status)) {
        throw new Error(`Přidání na Discord server selhalo (${joinResponse.status}).`);
      }
      if (env.discordAutoRoleId) {
        const roleResponse = await fetch(
          `${DISCORD_API}/guilds/${env.discordGuildId}/members/${user.id}/roles/${env.discordAutoRoleId}`,
          { method: "PUT", headers: { Authorization: `Bot ${env.discordToken}` } }
        );
        if (!roleResponse.ok) console.warn(`Automatická role nebyla přidána (${roleResponse.status}).`);
      }

      await saveDiscordUser(user);
      const profile = {
        id: user.id,
        username: user.global_name || user.username,
        avatar: avatarUrl(user)
      };
      res.cookie("deadstone_session", sessionToken(profile), cookieOptions());
      res.redirect(`${env.publicOrigin.split(",")[0].trim()}/?login=success`);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const session = readSession(req);
    if (!session) return res.status(401).json({ authenticated: false });
    res.json({
      authenticated: true,
      user: {
        id: session.id,
        username: session.username,
        avatar: session.avatar,
        owner: session.id === env.discordOwnerId
      }
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("deadstone_session", cookieOptions(0));
    res.status(204).end();
  });
}
