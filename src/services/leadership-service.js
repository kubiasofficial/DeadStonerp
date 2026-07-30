import { env } from "../config/env.js";

const DISCORD_API = "https://discord.com/api/v10";
const TEAM_ROLE_NAMES = [
  "owner",
  "head administrator",
  "administrator",
  "lead developer",
  "developer",
  "wl adder",
  "trainee"
];
let cache = { expiresAt: 0, data: null };

function normalizedRoleName(name) {
  return String(name || "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function avatarUrl(member) {
  if (member.avatar) {
    return `https://cdn.discordapp.com/guilds/${env.discordGuildId}/users/${member.user.id}/avatars/${member.avatar}.png?size=128`;
  }
  if (member.user.avatar) {
    return `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=128`;
  }
  const index = member.user.discriminator === "0"
    ? Number((BigInt(member.user.id) >> 22n) % 6n)
    : Number(member.user.discriminator || 0) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

async function discordGet(path) {
  const response = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bot ${env.discordToken}` }
  });
  if (!response.ok) throw new Error(`Discord API odmítlo načtení vedení (${response.status}).`);
  return response.json();
}

async function allGuildMembers() {
  const members = [];
  let after = "0";
  while (true) {
    const page = await discordGet(`/guilds/${env.discordGuildId}/members?limit=1000&after=${after}`);
    members.push(...page);
    if (page.length < 1000) break;
    after = page[page.length - 1].user.id;
  }
  return members;
}

export async function getLeadership() {
  if (cache.data && cache.expiresAt > Date.now()) return cache.data;
  const [allRoles, allMembers] = await Promise.all([
    discordGet(`/guilds/${env.discordGuildId}/roles`),
    allGuildMembers()
  ]);
  const roles = allRoles
    .filter(role => TEAM_ROLE_NAMES.includes(normalizedRoleName(role.name)))
    .sort((a, b) => b.position - a.position);
  const assigned = new Set();
  const data = roles.map(role => {
    const members = allMembers
      .filter(member => !member.user.bot && member.roles.includes(role.id) && !assigned.has(member.user.id))
      .map(member => {
        assigned.add(member.user.id);
        return {
          id: member.user.id,
          displayName: member.nick || member.user.global_name || member.user.username,
          username: member.user.username,
          avatar: avatarUrl(member)
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "cs"));
    return {
      id: role.id,
      name: role.name,
      color: role.color ? `#${role.color.toString(16).padStart(6, "0")}` : "#a77a3d",
      position: role.position,
      members
    };
  });
  cache = { data, expiresAt: Date.now() + 5 * 60 * 1000 };
  return data;
}
