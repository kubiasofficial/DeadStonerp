import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits
} from "discord.js";
import { env } from "../config/env.js";
import {
  createContent,
  getSiteSettings,
  updateSiteSettings
} from "../services/content-service.js";

function isAdmin(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  return Boolean(env.discordAdminRoleId && interaction.member?.roles?.cache?.has(env.discordAdminRoleId));
}

async function replyServer(interaction) {
  const data = await getSiteSettings();
  const status = data?.status || "offline";
  const labels = { online: "ONLINE", offline: "OFFLINE", maintenance: "ÚDRŽBA" };
  const colors = { online: 0x71845a, offline: 0x782d20, maintenance: 0xb0864c };
  const embed = new EmbedBuilder()
    .setColor(colors[status] || colors.offline)
    .setTitle("Deadstone Roleplay")
    .addFields(
      { name: "Stav serveru", value: labels[status] || status, inline: true },
      { name: "Hráčů online", value: `${data?.playersOnline ?? 0} / ${data?.playersMax ?? 128}`, inline: true },
      { name: "Verze", value: data?.version || "neuvedena", inline: true }
    )
    .setFooter({ text: "Deadstone · 1899" })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}

async function setStatus(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "Tento příkaz je pouze pro správce.", ephemeral: true });
  }
  const status = interaction.options.getString("stav", true);
  const playersOnline = interaction.options.getInteger("hraci");
  const patch = { status };
  if (playersOnline !== null) patch.playersOnline = playersOnline;
  await updateSiteSettings(patch, `discord:${interaction.user.id}`);
  await interaction.reply({
    content: `Stav serveru byl nastaven na **${status}**${playersOnline === null ? "" : `, hráčů online: **${playersOnline}**`}.`,
    ephemeral: true
  });
}

async function publishNews(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: "Tento příkaz je pouze pro správce.", ephemeral: true });
  }
  const title = interaction.options.getString("nadpis", true);
  const text = interaction.options.getString("text", true);
  const item = await createContent("news", {
    title,
    text,
    published: true,
    authorDiscordId: interaction.user.id
  }, `discord:${interaction.user.id}`);
  await interaction.reply({ content: `Novinka **${item.title}** byla publikována na web.`, ephemeral: true });
}

export function createDiscordBot() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, readyClient => {
    console.log(`Discord bot přihlášen jako ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    try {
      if (interaction.commandName === "server") return await replyServer(interaction);
      if (interaction.commandName === "pravidla") {
        return await interaction.reply(`Pravidla Deadstone: ${env.publicOrigin.split(",")[0]}/pravidla/`);
      }
      if (interaction.commandName === "status-nastavit") return await setStatus(interaction);
      if (interaction.commandName === "novinka") return await publishNews(interaction);
    } catch (error) {
      console.error("Chyba Discord příkazu:", error);
      const payload = { content: "Příkaz se nepodařilo dokončit.", ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
      else await interaction.reply(payload);
    }
  });

  return {
    client,
    async start() {
      if (!env.discordToken) {
        console.warn("DISCORD_TOKEN není nastaven; Discord bot nebude spuštěn.");
        return;
      }
      await client.login(env.discordToken);
    }
  };
}
