import { createApiServer } from "./api/server.js";
import { env } from "./config/env.js";
import { createDiscordBot } from "./discord/bot.js";

const app = createApiServer();
const server = app.listen(env.port, () => {
  console.log(`Deadstone API běží na portu ${env.port}`);
});

const bot = createDiscordBot();
await bot.start();

async function shutdown(signal) {
  console.log(`${signal}: ukončuji služby…`);
  await bot.client.destroy();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
