import { FieldValue } from "firebase-admin/firestore";
import crypto from "node:crypto";
import { db, storageBucket } from "../config/firebase.js";

const publicCollections = new Set(["news", "towns"]);

function cleanId(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function serialize(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? data.createdAt ?? null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? data.updatedAt ?? null,
    publishedAt: data.publishedAt?.toDate?.().toISOString() ?? data.publishedAt ?? null
  };
}

export async function getSiteSettings() {
  const snapshot = await db.collection("settings").doc("public").get();
  return snapshot.exists ? serialize(snapshot) : null;
}

export async function updateSiteSettings(patch, actor = "api") {
  const ref = db.collection("settings").doc("public");
  await ref.set({ ...patch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await writeAudit(actor, "settings.update", "settings/public", patch);
  return getSiteSettings();
}

export async function listPublished(collection, limit = 20) {
  if (!publicCollections.has(collection)) throw new Error("Nepovolená kolekce.");
  const snapshot = await db.collection(collection)
    .where("published", "==", true)
    .orderBy("publishedAt", "desc")
    .limit(Math.min(Number(limit) || 20, 100))
    .get();
  return snapshot.docs.map(serialize);
}

export async function createContent(collection, input, actor = "api") {
  if (!publicCollections.has(collection)) throw new Error("Nepovolená kolekce.");
  const id = cleanId(input.slug || input.title || input.name) || db.collection(collection).doc().id;
  const ref = db.collection(collection).doc(id);
  await ref.set({
    ...input,
    slug: id,
    published: Boolean(input.published),
    publishedAt: input.published ? FieldValue.serverTimestamp() : null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  await writeAudit(actor, `${collection}.write`, `${collection}/${id}`, input);
  return serialize(await ref.get());
}

export async function listAdminContent(collection) {
  if (!publicCollections.has(collection)) throw new Error("Nepovolená kolekce.");
  const snapshot = await db.collection(collection).limit(100).get();
  return snapshot.docs.map(serialize).sort((a, b) =>
    new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

export async function updateContent(collection, id, input, actor = "api") {
  if (!publicCollections.has(collection)) throw new Error("Nepovolená kolekce.");
  const ref = db.collection(collection).doc(cleanId(id));
  if (!(await ref.get()).exists) throw Object.assign(new Error("Záznam nebyl nalezen."), { status: 404 });
  const patch = {
    ...input,
    updatedAt: FieldValue.serverTimestamp()
  };
  if (Object.hasOwn(input, "published")) {
    patch.published = Boolean(input.published);
    patch.publishedAt = input.published ? FieldValue.serverTimestamp() : null;
  }
  await ref.set(patch, { merge: true });
  await writeAudit(actor, `${collection}.update`, `${collection}/${id}`, input);
  return serialize(await ref.get());
}

export async function deleteContent(collection, id, actor = "api") {
  if (!publicCollections.has(collection)) throw new Error("Nepovolená kolekce.");
  const ref = db.collection(collection).doc(cleanId(id));
  const snapshot = await ref.get();
  if (!snapshot.exists) throw Object.assign(new Error("Záznam nebyl nalezen."), { status: 404 });
  await ref.delete();
  await writeAudit(actor, `${collection}.delete`, `${collection}/${id}`);
  return { id, deleted: true };
}

export async function uploadContentImage(dataUrl, folder = "content") {
  const match = String(dataUrl || "").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw Object.assign(new Error("Podporované formáty obrázku jsou JPG, PNG a WEBP."), { status: 400 });
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
    throw Object.assign(new Error("Obrázek smí mít maximálně 5 MB."), { status: 400 });
  }
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[match[1]];
  const safeFolder = ["news", "towns"].includes(folder) ? folder : "content";
  const token = crypto.randomUUID();
  const path = `${safeFolder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const file = storageBucket.file(path);
  await file.save(buffer, {
    resumable: false,
    contentType: match[1],
    metadata: {
      cacheControl: "public,max-age=31536000,immutable",
      metadata: { firebaseStorageDownloadTokens: token }
    }
  });
  return {
    imageUrl: `https://firebasestorage.googleapis.com/v0/b/${storageBucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`,
    path
  };
}

export async function submitWhitelistApplication(input) {
  const ref = db.collection("whitelistApplications").doc();
  await ref.set({
    discordId: String(input.discordId || ""),
    characterName: String(input.characterName || "").trim(),
    age: Number(input.age || 0),
    experience: String(input.experience || "").trim(),
    motivation: String(input.motivation || "").trim(),
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
  return { id: ref.id, status: "pending" };
}

export async function writeAudit(actor, action, target, metadata = {}) {
  await db.collection("auditLog").add({
    actor: String(actor),
    action,
    target,
    metadata,
    createdAt: FieldValue.serverTimestamp()
  });
}

export async function saveDiscordUser(user) {
  const ref = db.collection("discordUsers").doc(String(user.id));
  await ref.set({
    discordId: String(user.id),
    username: String(user.username || ""),
    globalName: String(user.global_name || user.username || ""),
    avatar: user.avatar || null,
    lastLoginAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}
