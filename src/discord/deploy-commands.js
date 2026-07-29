import { REST, Routes } from "discord.js";
import { env } from "../config/env.js";
import { commandsJson } from "./commands.js";

if (!env.discordToken || !env.discordClientId || !env.discordGuildId) {
  throw new Error("Pro registraci příkazů nastavte DISCORD_TOKEN, DISCORD_CLIENT_ID a DISCORD_GUILD_ID.");
}

const rest = new REST({ version: "10" }).setToken(env.discordToken);
await rest.put(
  Routes.applicationGuildCommands(env.discordClientId, env.discordGuildId),
  { body: commandsJson }
);
console.log(`Registrováno ${commandsJson.length} Discord příkazů.`);
