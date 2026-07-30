import "dotenv/config";

const requiredInProduction = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY"
];

if (process.env.NODE_ENV === "production") {
  const missing = requiredInProduction.filter(key => !process.env[key]);
  if (missing.length) {
    throw new Error(`Chybí povinné proměnné prostředí: ${missing.join(", ")}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  publicOrigin: process.env.PUBLIC_ORIGIN || "http://localhost:8000",
  adminKey: process.env.API_ADMIN_KEY || "",
  discordToken: process.env.DISCORD_TOKEN || "",
  discordClientId: process.env.DISCORD_CLIENT_ID || "",
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET || "",
  discordGuildId: process.env.DISCORD_GUILD_ID || "",
  discordAdminRoleId: process.env.DISCORD_ADMIN_ROLE_ID || "",
  discordAutoRoleId: process.env.DISCORD_AUTO_ROLE_ID || "",
  discordOwnerId: process.env.DISCORD_OWNER_ID || "1531972762065829938",
  discordAdminRoleIds: (process.env.DISCORD_ADMIN_ROLE_IDS || "1531972762065829938,1531973545888841870,1531974140691480677,1531974942265180180,1531975985820471379,1531976340310458408,1531976917933359244").split(",").map(value => value.trim()).filter(Boolean),
  discordApprovedRoleId: process.env.DISCORD_APPROVED_ROLE_ID || "1531978138459050144",
  discordWhitelistWebhook: process.env.DISCORD_WHITELIST_WEBHOOK || "",
  discordInterviewWebhook: process.env.DISCORD_INTERVIEW_WEBHOOK || "",
  discordInterviewChannelId: process.env.DISCORD_INTERVIEW_CHANNEL_ID || "1532064600265195571",
  discordDecisionChannelId: process.env.DISCORD_DECISION_CHANNEL_ID || "1532064135288717382",
  discordRedirectUri: process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/auth/discord/callback",
  sessionSecret: process.env.SESSION_SECRET || "",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || "deadstonerp-315bd.firebasestorage.app"
};
