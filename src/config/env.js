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
  discordGuildId: process.env.DISCORD_GUILD_ID || "",
  discordAdminRoleId: process.env.DISCORD_ADMIN_ROLE_ID || "",
  discordAutoRoleId: process.env.DISCORD_AUTO_ROLE_ID || "",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
};
