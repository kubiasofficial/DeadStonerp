import crypto from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db, storageBucket } from "../config/firebase.js";
import { env } from "../config/env.js";

const DISCORD_API = "https://discord.com/api/v10";
const STATUS_PARENTS = {
  waiting: "1532300903598788699",
  in_progress: "1532301023161487402",
  closed: "1532301099145363516"
};
const OWNER_ROLE = "1531972762065829938";
const HEAD_ADMIN_ROLE = "1531973545888841870";
const MAX_OPEN = 3;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"],
  ["application/pdf", "pdf"], ["text/plain", "txt"]
]);
const CATEGORIES = {
  bug: { label: "Bug Report", sensitive: false },
  player_report: { label: "Nahlášení hráče", sensitive: true },
  ck: { label: "CK Tickety", sensitive: true },
  general: { label: "Obecná pomoc", sensitive: false },
  partnership: { label: "Partnerství", sensitive: false },
  leadership: { label: "Kontakt s vedením", sensitive: true },
  faction: { label: "Žádost o frakci", sensitive: true },
  other: { label: "Ostatní", sensitive: false }
};

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

const now = () => Timestamp.now();
const clean = (value, max = 5000) => String(value ?? "").trim().slice(0, max);
const docData = doc => ({ id: doc.id, ...doc.data() });

async function discord(path, options = {}) {
  const response = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${env.discordToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Discord API ${response.status}: ${detail.slice(0, 250)}`);
  }
  return response.status === 204 ? null : response.json();
}

async function dm(discordId, content) {
  try {
    const channel = await discord("/users/@me/channels", {
      method: "POST", body: JSON.stringify({ recipient_id: discordId })
    });
    await discord(`/channels/${channel.id}/messages`, {
      method: "POST", body: JSON.stringify({ content })
    });
  } catch (error) {
    console.warn("Ticket DM se nepodařila odeslat:", error.message);
  }
}

async function audit(ticketId, actor, action, details = {}) {
  await db.collection("tickets").doc(ticketId).collection("audit").add({
    action, details, actorId: actor?.id || "system",
    actorName: actor?.username || "Systém", createdAt: now()
  });
}

async function permissionsFor(categoryKey) {
  const settings = await getTicketSettings();
  const configured = settings.access?.[categoryKey];
  const roleIds = configured?.length ? configured : env.discordAdminRoleIds;
  const deny = "1024";
  const allow = "274878024768";
  return [
    { id: env.discordGuildId, type: 0, deny },
    ...roleIds.map(id => ({ id, type: 0, allow }))
  ];
}

async function postDiscordTicket(ticket) {
  if (!env.discordToken || !env.discordGuildId) return null;
  const suffix = ticket.category === "ck" ? "ck" : ticket.category.replaceAll("_", "-");
  const channel = await discord(`/guilds/${env.discordGuildId}/channels`, {
    method: "POST",
    body: JSON.stringify({
      name: `${ticket.number.toLowerCase()}-${suffix}`,
      type: 0,
      parent_id: STATUS_PARENTS.waiting,
      topic: `Deadstone ticket ${ticket.number} | web-ticket:${ticket.id}`,
      permission_overwrites: await permissionsFor(ticket.category)
    })
  });
  await discord(`/channels/${channel.id}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content: `<@${ticket.authorId}>`,
      allowed_mentions: { users: [ticket.authorId] },
      embeds: [{
        color: 0xb97832,
        title: `📩 Nový ticket ${ticket.number}`,
        fields: [
          { name: "Autor", value: `<@${ticket.authorId}>`, inline: true },
          { name: "Kategorie", value: ticket.categoryLabel, inline: true },
          { name: "Požadavek", value: ticket.description.slice(0, 1000) || "Přiložený soubor" }
        ],
        footer: { text: "Deadstone · Úřad podpory · 1899" },
        timestamp: new Date().toISOString()
      }]
    })
  });
  return channel.id;
}

async function moveDiscordChannel(channelId, status) {
  if (!channelId) return;
  await discord(`/channels/${channelId}`, {
    method: "PATCH", body: JSON.stringify({ parent_id: STATUS_PARENTS[status], lock_permissions: false })
  });
}

function validateAttachments(files = []) {
  if (!Array.isArray(files) || files.length > 5) fail(400, "Ke zprávě lze přiložit nejvýše 5 souborů.");
  return files.map(file => {
    if (file?.path) return { staged: true, path: clean(file.path, 500), name: clean(file.name, 100), mime: clean(file.mime, 100), size: Number(file.size || 0), url: clean(file.url, 2000) };
    const match = clean(file.dataUrl, 12_000_000).match(/^data:([^;]+);base64,(.+)$/s);
    if (!match || !ALLOWED_TYPES.has(match[1])) fail(400, "Povolené jsou pouze JPG, PNG, WEBP, PDF a TXT.");
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 8 * 1024 * 1024) fail(400, "Jeden soubor může mít nejvýše 8 MB.");
    return { buffer, mime: match[1], ext: ALLOWED_TYPES.get(match[1]), name: clean(file.name, 100) };
  });
}

async function uploadAttachments(ticketId, messageId, files, uploaderId) {
  const valid = validateAttachments(files);
  return Promise.all(valid.map(async (file, index) => {
    if (file.staged) {
      if (!file.path.startsWith(`ticket-staging/${uploaderId}/`) || !ALLOWED_TYPES.has(file.mime) || file.size > 8 * 1024 * 1024) fail(400, "Neplatná nahraná příloha.");
      const object = storageBucket.file(file.path);
      const [exists] = await object.exists();
      if (!exists) fail(400, "Nahraná příloha nebyla nalezena.");
      const [metadata] = await object.getMetadata();
      if (Number(metadata.size || 0) > 8 * 1024 * 1024 || metadata.contentType !== file.mime) fail(400, "Příloha neprošla bezpečnostní kontrolou.");
      return { name: file.name, mime: file.mime, size: Number(metadata.size), path: file.path, url: file.url };
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || `priloha-${index + 1}.${file.ext}`;
    const path = `tickets/${ticketId}/${messageId}/${crypto.randomUUID()}-${safeName}`;
    const object = storageBucket.file(path);
    await object.save(file.buffer, { contentType: file.mime, metadata: { cacheControl: "private,max-age=0" } });
    const [url] = await object.getSignedUrl({ action: "read", expires: "01-01-2036" });
    return { name: safeName, mime: file.mime, size: file.buffer.length, path, url };
  }));
}

export async function prepareTicketUpload(user, payload) {
  const name = clean(payload.name, 100).replace(/[^a-zA-Z0-9._-]/g, "-");
  const mime = clean(payload.mime, 100);
  const size = Number(payload.size || 0);
  if (!name || !ALLOWED_TYPES.has(mime)) fail(400, "Tento typ souboru není povolen.");
  if (!size || size > 8 * 1024 * 1024) fail(400, "Jeden soubor může mít nejvýše 8 MB.");
  const path = `ticket-staging/${user.id}/${crypto.randomUUID()}-${name}`;
  const object = storageBucket.file(path);
  const [uploadUrl] = await object.getSignedUrl({
    action: "write", expires: Date.now() + 15 * 60 * 1000, contentType: mime
  });
  const [url] = await object.getSignedUrl({ action: "read", expires: "01-01-2036" });
  return { uploadUrl, attachment: { name, mime, size, path, url } };
}

async function nextTicketNumber(transaction) {
  const ref = db.collection("system").doc("ticketCounter");
  const snapshot = await transaction.get(ref);
  const value = Number(snapshot.data()?.value || 0) + 1;
  transaction.set(ref, { value, updatedAt: now() }, { merge: true });
  return `DS-${String(value).padStart(6, "0")}`;
}

export async function getTicketSettings() {
  const snapshot = await db.collection("settings").doc("tickets").get();
  return { access: snapshot.data()?.access || {}, archiveDays: 14 };
}

export async function updateTicketSettings(actor, access) {
  if (!actor.roles?.includes(OWNER_ROLE)) fail(403, "Nastavení přístupu může měnit pouze Owner.");
  const safe = {};
  for (const key of Object.keys(CATEGORIES)) {
    safe[key] = [...new Set((access?.[key] || []).filter(id => env.discordAdminRoleIds.includes(id)))];
  }
  await db.collection("settings").doc("tickets").set({ access: safe, updatedAt: now(), updatedBy: actor.id }, { merge: true });
  return getTicketSettings();
}

export async function createTicket(user, payload) {
  const category = clean(payload.category, 30);
  if (!CATEGORIES[category]) fail(400, "Vyber platnou kategorii ticketu.");
  const description = clean(payload.description, 6000);
  const hasAttachment = Array.isArray(payload.attachments) && payload.attachments.length;
  if (description.length < 20 && !hasAttachment) fail(400, "Popis musí mít alespoň 20 znaků, případně přilož soubor.");
  const open = await db.collection("tickets").where("authorId", "==", user.id)
    .where("status", "in", ["waiting", "in_progress"]).get();
  if (open.size >= MAX_OPEN) fail(409, "Můžeš mít současně nejvýše 3 otevřené tickety.");
  if (open.docs.some(doc => doc.data().category === category)) fail(409, "V této kategorii už máš otevřený ticket.");

  const ref = db.collection("tickets").doc();
  let number;
  await db.runTransaction(async transaction => {
    number = await nextTicketNumber(transaction);
    transaction.set(ref, {
      number, category, categoryLabel: CATEGORIES[category].label,
      sensitive: CATEGORIES[category].sensitive,
      authorId: user.id, authorName: user.username, authorAvatar: user.avatar || "",
      description, fields: payload.fields && typeof payload.fields === "object" ? payload.fields : {},
      status: "waiting", priority: "normal", assignedTo: null, assignedName: "",
      discordChannelId: null, closeReason: "", closingMessage: "",
      createdAt: now(), updatedAt: now(), closedAt: null, archiveAfter: null
    });
  });
  const attachments = await uploadAttachments(ref.id, "opening", payload.attachments || [], user.id);
  await ref.collection("messages").add({
    authorId: user.id, authorName: user.username, authorType: "player",
    type: "reply", content: description, attachments, createdAt: now(), source: "web"
  });
  const ticket = { id: ref.id, number, category, categoryLabel: CATEGORIES[category].label, authorId: user.id, description };
  try {
    const discordChannelId = await postDiscordTicket(ticket);
    if (discordChannelId) await ref.update({ discordChannelId });
  } catch (error) {
    console.error("Discord ticket kanál se nepodařilo vytvořit:", error);
  }
  await audit(ref.id, user, "ticket_created", { category, number });
  if (category === "faction" && Array.isArray(payload.fields?.members)) {
    for (const memberId of payload.fields.members.slice(0, 20)) {
      if (memberId === user.id) continue;
      const invitationRef = db.collection("factionInvitations").doc(`${ref.id}_${memberId}`);
      await invitationRef.set({
        ticketId: ref.id, ticketNumber: number, factionName: clean(payload.fields.factionName, 150),
        invitedId: memberId, invitedById: user.id, invitedByName: user.username,
        status: "pending", createdAt: now(), respondedAt: null
      });
      await dm(memberId, `🏛️ **${user.username}** tě pozval do připravované frakce **${clean(payload.fields.factionName, 150) || number}**. Účast potvrď nebo odmítni na stránce podpory:\n${env.publicOrigin.split(",")[0]}/podpora.html`);
    }
  }
  return { id: ref.id, number };
}

export async function listMyFactionInvitations(userId) {
  const snapshot = await db.collection("factionInvitations").where("invitedId", "==", userId).get();
  return snapshot.docs.map(docData).filter(item => item.status === "pending");
}

export async function respondFactionInvitation(user, invitationId, response) {
  if (!["accepted", "declined"].includes(response)) fail(400, "Neplatná odpověď.");
  const ref = db.collection("factionInvitations").doc(invitationId);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data().invitedId !== user.id) fail(404, "Pozvánka nebyla nalezena.");
  if (snapshot.data().status !== "pending") fail(409, "Na tuto pozvánku už bylo odpovězeno.");
  await ref.update({ status: response, respondedAt: now() });
  await audit(snapshot.data().ticketId, user, "faction_invitation_responded", { response });
  return { status: response };
}

export async function listMyTickets(userId) {
  const snapshot = await db.collection("tickets").where("authorId", "==", userId).get();
  return snapshot.docs.map(docData).sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.());
}

export async function getTicket(ticketId, user, admin = false) {
  const snapshot = await db.collection("tickets").doc(ticketId).get();
  if (!snapshot.exists) fail(404, "Ticket nebyl nalezen.");
  const ticket = docData(snapshot);
  if (!admin && ticket.authorId !== user.id) fail(403, "K tomuto ticketu nemáš přístup.");
  if (admin && !(await canSeeTicket(user.roles || [], ticket))) fail(403, "Tento citlivý ticket nemůžeš zobrazit.");
  const messages = await snapshot.ref.collection("messages").orderBy("createdAt", "asc").get();
  ticket.messages = messages.docs.map(docData).filter(message => admin || message.type !== "internal");
  if (admin) {
    const auditSnapshot = await snapshot.ref.collection("audit").orderBy("createdAt", "desc").limit(100).get();
    ticket.audit = auditSnapshot.docs.map(docData);
  }
  return ticket;
}

export async function addMessage(ticketId, user, payload, admin = false) {
  const ref = db.collection("tickets").doc(ticketId);
  const snapshot = await ref.get();
  if (!snapshot.exists) fail(404, "Ticket nebyl nalezen.");
  const ticket = docData(snapshot);
  if (!admin && ticket.authorId !== user.id) fail(403, "K tomuto ticketu nemáš přístup.");
  if (ticket.status === "closed") fail(409, "Uzavřený ticket už nelze doplňovat.");
  const type = admin && payload.internal ? "internal" : "reply";
  const content = clean(payload.content, 6000);
  if (content.length < 1 && !(payload.attachments || []).length) fail(400, "Napiš zprávu nebo přilož soubor.");
  const messageRef = ref.collection("messages").doc();
  const attachments = await uploadAttachments(ticketId, messageRef.id, payload.attachments || [], user.id);
  const message = {
    authorId: user.id, authorName: user.username, authorType: admin ? "admin" : "player",
    type, content, attachments, createdAt: now(), source: "web"
  };
  await messageRef.set(message);
  await ref.update({ updatedAt: now() });
  if (type === "reply" && ticket.discordChannelId) {
    const links = attachments.map(file => `[${file.name}](${file.url})`).join("\n");
    try {
      await discord(`/channels/${ticket.discordChannelId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: `**${admin ? "Vedení" : "Hráč"} · ${user.username}:**\n${content}${links ? `\n${links}` : ""}`.slice(0, 2000) })
      });
    } catch (error) { console.warn("Synchronizace zprávy do Discordu selhala:", error.message); }
  }
  if (admin && type === "reply") await dm(ticket.authorId, `📨 V ticketu **${ticket.number}** máš novou odpověď od vedení.\n${env.publicOrigin.split(",")[0]}/moje-tickety.html?ticket=${ticketId}`);
  await audit(ticketId, user, type === "internal" ? "internal_note_added" : "message_added");
  return { id: messageRef.id, ...message };
}

async function canSeeTicket(memberRoles, ticket) {
  if (!ticket.sensitive) return true;
  const settings = await getTicketSettings();
  const allowed = settings.access?.[ticket.category];
  return !allowed?.length || allowed.some(roleId => memberRoles.includes(roleId));
}

export async function listAdminTickets(user, memberRoles, status = "waiting") {
  const snapshot = await db.collection("tickets").where("status", "==", status).get();
  const visible = [];
  for (const doc of snapshot.docs) {
    const ticket = docData(doc);
    if (await canSeeTicket(memberRoles, ticket)) visible.push(ticket);
  }
  return visible.sort((a, b) => b.updatedAt?.toMillis?.() - a.updatedAt?.toMillis?.());
}

export async function claimTicket(ticketId, actor, memberRoles, force = false) {
  const ref = db.collection("tickets").doc(ticketId);
  const result = await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) fail(404, "Ticket nebyl nalezen.");
    const ticket = docData(snapshot);
    if (!(await canSeeTicket(memberRoles, ticket))) fail(403, "Tento citlivý ticket nemůžeš řešit.");
    const higher = memberRoles.includes(OWNER_ROLE) || memberRoles.includes(HEAD_ADMIN_ROLE);
    if (ticket.assignedTo && ticket.assignedTo !== actor.id && !(force && higher)) {
      fail(409, `Ticket už řeší ${ticket.assignedName}.`);
    }
    transaction.update(ref, {
      status: "in_progress", assignedTo: actor.id, assignedName: actor.username, updatedAt: now()
    });
    return ticket;
  });
  try { await moveDiscordChannel(result.discordChannelId, "in_progress"); } catch (error) { console.warn(error.message); }
  await audit(ticketId, actor, result.assignedTo ? "ticket_force_claimed" : "ticket_claimed", { previous: result.assignedName || "" });
  await dm(result.authorId, `📬 Tvůj ticket **${result.number}** převzal člen vedení **${actor.username}**.`);
  return getTicket(ticketId, actor, true);
}

export async function transferTicket(ticketId, actor, assigneeId, assigneeName) {
  const ref = db.collection("tickets").doc(ticketId);
  const snapshot = await ref.get();
  if (!snapshot.exists) fail(404, "Ticket nebyl nalezen.");
  const ticket = docData(snapshot);
  if (ticket.assignedTo !== actor.id && !actor.roles?.some(id => [OWNER_ROLE, HEAD_ADMIN_ROLE].includes(id))) fail(403, "Ticket může předat jeho řešitel nebo vyšší vedení.");
  await ref.update({ assignedTo: clean(assigneeId, 30), assignedName: clean(assigneeName, 100), updatedAt: now() });
  await audit(ticketId, actor, "ticket_transferred", { to: assigneeId, name: assigneeName });
  await dm(ticket.authorId, `📬 Ticket **${ticket.number}** byl předán členovi vedení **${clean(assigneeName, 100)}**.`);
  return { ok: true };
}

export async function setPriority(ticketId, actor, priority) {
  if (!["low", "normal", "high", "urgent"].includes(priority)) fail(400, "Neplatná priorita.");
  const ref = db.collection("tickets").doc(ticketId);
  const snapshot = await ref.get();
  if (!snapshot.exists) fail(404, "Ticket nebyl nalezen.");
  await ref.update({ priority, updatedAt: now() });
  await audit(ticketId, actor, "priority_changed", { priority });
  await dm(snapshot.data().authorId, `📌 U ticketu **${snapshot.data().number}** byla změněna priorita na **${priority}**.`);
  return { priority };
}

export async function closeTicket(ticketId, actor, reason, closingMessage) {
  const reasons = ["resolved", "rejected", "duplicate", "insufficient", "player_cancelled", "other"];
  if (!reasons.includes(reason)) fail(400, "Vyber důvod uzavření.");
  const ref = db.collection("tickets").doc(ticketId);
  const snapshot = await ref.get();
  if (!snapshot.exists) fail(404, "Ticket nebyl nalezen.");
  const ticket = docData(snapshot);
  if (!ticket.assignedTo) fail(409, "Ticket musí být před uzavřením převzat.");
  const archiveAfter = Timestamp.fromMillis(Date.now() + 14 * 86400000);
  await ref.update({ status: "closed", closeReason: reason, closingMessage: clean(closingMessage, 3000), closedAt: now(), archiveAfter, updatedAt: now() });
  try { await moveDiscordChannel(ticket.discordChannelId, "closed"); } catch (error) { console.warn(error.message); }
  await audit(ticketId, actor, "ticket_closed", { reason });
  await dm(ticket.authorId, `✅ Ticket **${ticket.number}** byl uzavřen. Výsledek: **${reason}**.${closingMessage ? `\n${clean(closingMessage, 1000)}` : ""}`);
  return { ok: true };
}

export async function createFeedback(user, payload) {
  const rating = payload.rating === "plus" ? "plus" : payload.rating === "minus" ? "minus" : null;
  if (!rating) fail(400, "Vyber +rep nebo -rep.");
  const targetId = clean(payload.targetId, 30);
  const targetName = clean(payload.targetName, 100);
  const note = clean(payload.note, 3000);
  if (!targetId || note.length < 20) fail(400, "Vyber člena vedení a napiš alespoň 20 znaků.");
  const ref = await db.collection("leadershipFeedback").add({
    authorId: user.id, authorName: user.username, targetId, targetName,
    rating, note, createdAt: now()
  });
  return { id: ref.id, message: "Děkujeme za zpětnou vazbu a bereme ji na vědomí." };
}

export async function listFeedback(actorRoles) {
  if (!actorRoles.some(id => [OWNER_ROLE, HEAD_ADMIN_ROLE].includes(id))) fail(403, "Detail zpětné vazby vidí pouze Owner a Head Administrator.");
  const snapshot = await db.collection("leadershipFeedback").orderBy("createdAt", "desc").limit(300).get();
  return snapshot.docs.map(docData);
}

export async function feedbackReputation() {
  const snapshot = await db.collection("leadershipFeedback").get();
  const result = {};
  snapshot.docs.forEach(doc => {
    const value = doc.data();
    result[value.targetId] ||= { id: value.targetId, name: value.targetName, plus: 0, minus: 0 };
    result[value.targetId][value.rating] += 1;
  });
  return Object.values(result).sort((a, b) => (b.plus - b.minus) - (a.plus - a.minus));
}

export async function syncDiscordTicketMessage(message) {
  if (!message.guildId || message.author.bot || !message.channelId) return;
  const snapshot = await db.collection("tickets").where("discordChannelId", "==", message.channelId).limit(1).get();
  if (snapshot.empty) return;
  const ticketRef = snapshot.docs[0].ref;
  await ticketRef.collection("messages").add({
    authorId: message.author.id, authorName: message.member?.displayName || message.author.username,
    authorType: "admin", type: "reply", content: clean(message.content, 6000),
    attachments: [...message.attachments.values()].slice(0, 5).map(file => ({
      name: file.name, mime: file.contentType || "", size: file.size, url: file.url, path: ""
    })),
    createdAt: now(), source: "discord", discordMessageId: message.id
  });
  await ticketRef.update({ updatedAt: now() });
  const ticket = snapshot.docs[0].data();
  await dm(ticket.authorId, `📨 V ticketu **${ticket.number}** máš novou odpověď od vedení.`);
}

export async function archiveExpiredTicketChannels() {
  const snapshot = await db.collection("tickets")
    .where("status", "==", "closed").where("archiveAfter", "<=", now()).limit(25).get();
  for (const document of snapshot.docs) {
    const ticket = docData(document);
    if (ticket.discordChannelId) {
      try { await discord(`/channels/${ticket.discordChannelId}`, { method: "DELETE" }); }
      catch (error) { console.warn(`Archivace ${ticket.number} selhala:`, error.message); continue; }
    }
    await document.ref.update({ discordChannelId: null, discordArchivedAt: now(), updatedAt: now() });
    await audit(document.id, null, "discord_channel_archived", { channelId: ticket.discordChannelId });
  }
  return snapshot.size;
}

export async function listEligibleFactionMembers() {
  const profiles = await db.collection("whitelistProfiles").where("completed", "==", true).limit(200).get();
  return profiles.docs.map(doc => ({
    id: doc.id, name: doc.data().discordName || doc.data().username || doc.id,
    avatar: doc.data().avatar || ""
  })).slice(0, 20);
}
