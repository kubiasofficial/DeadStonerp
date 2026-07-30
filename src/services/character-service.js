import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config/firebase.js";
import { env } from "../config/env.js";

const DISCORD_API = "https://discord.com/api/v10";

function serialize(snapshot) {
  const data = snapshot.data();
  const date = value => value?.toDate?.().toISOString?.() || value || null;
  return {
    id: snapshot.id,
    ...data,
    createdAt: date(data.createdAt),
    updatedAt: date(data.updatedAt),
    decidedAt: date(data.decidedAt),
    lastEditedAt: date(data.lastEditedAt)
  };
}

function validateCharacter(input) {
  const name = String(input.name || "").trim();
  const birthYear = Number(input.birthYear);
  const origin = String(input.origin || "").trim();
  const lore = String(input.lore || "").trim();
  if (name.length < 5 || name.length > 80 || !name.includes(" ")) {
    throw Object.assign(new Error("Zadejte jméno i příjmení postavy."), { status: 400 });
  }
  if (!Number.isInteger(birthYear) || birthYear < 1800 || birthYear > 1899) {
    throw Object.assign(new Error("Rok narození musí být v rozsahu 1800–1899."), { status: 400 });
  }
  if (origin.length < 2 || origin.length > 100) {
    throw Object.assign(new Error("Doplňte původ postavy."), { status: 400 });
  }
  if (lore.length < 50 || lore.length > 10000) {
    throw Object.assign(new Error("Lore musí obsahovat 50 až 10 000 znaků."), { status: 400 });
  }
  return { name, birthYear, origin, lore };
}

export async function listApprovedCharacters() {
  const snapshot = await db.collection("characters").where("status", "==", "approved").limit(200).get();
  return snapshot.docs.map(serialize).sort((a, b) => a.name.localeCompare(b.name, "cs"));
}

export async function listMyCharacters(discordId) {
  const snapshot = await db.collection("characters").where("ownerDiscordId", "==", discordId).limit(50).get();
  return snapshot.docs.map(serialize).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function createCharacter(user, input) {
  const values = validateCharacter(input);
  const ref = db.collection("characters").doc();
  await ref.set({
    ...values,
    ownerDiscordId: user.id,
    ownerDiscordName: user.username,
    ownerAvatar: user.avatar || null,
    status: "pending",
    editReviewPending: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
  return serialize(await ref.get());
}

export async function updateMyCharacter(user, id, input) {
  const values = validateCharacter(input);
  const ref = db.collection("characters").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw Object.assign(new Error("Postava nebyla nalezena."), { status: 404 });
  const current = snapshot.data();
  if (current.ownerDiscordId !== user.id) throw Object.assign(new Error("Tuto postavu nemůžete upravit."), { status: 403 });
  const wasApproved = current.status === "approved";
  await ref.update({
    ...values,
    status: wasApproved ? "approved" : "pending",
    rejectionReason: null,
    editReviewPending: wasApproved,
    lastEditedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
  return serialize(await ref.get());
}

export async function listAdminCharacters(filter = "pending") {
  let snapshot;
  if (filter === "edited") {
    snapshot = await db.collection("characters").where("editReviewPending", "==", true).limit(100).get();
  } else {
    snapshot = await db.collection("characters").where("status", "==", filter).limit(100).get();
  }
  return snapshot.docs.map(serialize).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function sendDm(discordId, content) {
  try {
    const channelResponse = await fetch(`${DISCORD_API}/users/@me/channels`, {
      method: "POST",
      headers: { Authorization: `Bot ${env.discordToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient_id: discordId })
    });
    if (!channelResponse.ok) return false;
    const channel = await channelResponse.json();
    const response = await fetch(`${DISCORD_API}/channels/${channel.id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${env.discordToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    return response.ok;
  } catch (error) {
    console.error("Zprávu o postavě se nepodařilo odeslat:", error.message);
    return false;
  }
}

export async function decideCharacter(id, admin, decision, reason = "") {
  if (!["approved", "rejected"].includes(decision)) throw Object.assign(new Error("Neplatný verdikt."), { status: 400 });
  if (decision === "rejected" && String(reason).trim().length < 3) {
    throw Object.assign(new Error("U zamítnutí je povinný důvod."), { status: 400 });
  }
  const ref = db.collection("characters").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw Object.assign(new Error("Postava nebyla nalezena."), { status: 404 });
  const character = snapshot.data();
  await ref.update({
    status: decision,
    rejectionReason: decision === "rejected" ? String(reason).trim() : null,
    editReviewPending: false,
    decidedBy: admin.id,
    decidedByName: admin.username,
    decidedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
  if (decision === "rejected") {
    await sendDm(character.ownerDiscordId,
      `Postava **${character.name}** byla zamítnuta. Důvod: ${String(reason).trim()}\nUprav ji na webu Deadstone a odešli znovu ke schválení.`);
  } else {
    await sendDm(character.ownerDiscordId,
      `Postava **${character.name}** byla schválena a nyní je uvedena mezi občany státu Deadstone.`);
  }
  return serialize(await ref.get());
}

export async function acknowledgeCharacterEdit(id, admin) {
  const ref = db.collection("characters").doc(id);
  if (!(await ref.get()).exists) throw Object.assign(new Error("Postava nebyla nalezena."), { status: 404 });
  await ref.update({
    editReviewPending: false,
    editReviewedBy: admin.id,
    editReviewedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
  return serialize(await ref.get());
}

export async function adminUpdateCharacter(id, input, admin) {
  const values = validateCharacter(input);
  const ref = db.collection("characters").doc(id);
  if (!(await ref.get()).exists) throw Object.assign(new Error("Postava nebyla nalezena."), { status: 404 });
  await ref.update({
    ...values,
    editReviewPending: false,
    adminEditedBy: admin.id,
    updatedAt: FieldValue.serverTimestamp()
  });
  return serialize(await ref.get());
}

export async function deleteCharacter(id, admin) {
  const ref = db.collection("characters").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw Object.assign(new Error("Postava nebyla nalezena."), { status: 404 });
  await ref.delete();
  return { id, deleted: true, deletedBy: admin.id };
}
