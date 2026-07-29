import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName("server")
    .setDescription("Zobrazí aktuální stav Deadstone serveru."),
  new SlashCommandBuilder()
    .setName("pravidla")
    .setDescription("Pošle odkaz na pravidla serveru."),
  new SlashCommandBuilder()
    .setName("status-nastavit")
    .setDescription("Aktualizuje veřejný stav serveru.")
    .addStringOption(option => option.setName("stav").setDescription("Online, offline nebo údržba").setRequired(true)
      .addChoices(
        { name: "Online", value: "online" },
        { name: "Offline", value: "offline" },
        { name: "Údržba", value: "maintenance" }
      ))
    .addIntegerOption(option => option.setName("hraci").setDescription("Počet online hráčů").setMinValue(0))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("novinka")
    .setDescription("Publikuje novinku pro web.")
    .addStringOption(option => option.setName("nadpis").setDescription("Nadpis novinky").setRequired(true).setMaxLength(100))
    .addStringOption(option => option.setName("text").setDescription("Krátký text novinky").setRequired(true).setMaxLength(1000))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
];

export const commandsJson = commandDefinitions.map(command => command.toJSON());
