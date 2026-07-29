import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config/firebase.js";
import { env } from "../config/env.js";

const DISCORD_API = "https://discord.com/api/v10";
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export const ruleQuestions = [
  { id: "do", title: "Příkaz /do", question: "Jak bys správně použil příkaz /do? Uveď vlastní příklad." },
  { id: "me", title: "Příkaz /me", question: "K čemu slouží příkaz /me a co pomocí něj nesmíš ovládat?" },
  { id: "metagaming", title: "Metagaming", question: "Co je metagaming a jak by ses zachoval, kdybys získal důležitou informaci na Discordu?" },
  { id: "powergaming", title: "Powergaming", question: "Vysvětli powergaming a popiš správné odzbrojení jiné postavy." },
  { id: "fearrp", title: "FearRP", question: "Jak se zachová neozbrojená postava obklíčená několika ozbrojenými lidmi?" },
  { id: "combat-logging", title: "Combat Logging", question: "Co musíš udělat, pokud ti během rozehrané scény spadne hra?" }
];

function serialize(snapshot) {
  const data = snapshot.data();
  const convert = value => value?.toDate?.().toISOString?.() ?? value ?? null;
  return {
    id: snapshot.id,
    ...data,
    createdAt: convert(data.createdAt),
    updatedAt: convert(data.updatedAt),
    decidedAt: convert(data.decidedAt),
    requestedAt: convert(data.requestedAt),
    claimedAt: convert(data.claimedAt)
  };
}

async function profileFor(discordId) {
  const ref = db.collection("whitelistProfiles").doc(discordId);
  const snapshot = await ref.get();
  if (snapshot.exists) return { ref, data: snapshot.data() };
  const data = { formAttemptsRemaining: 3, interviewAttemptsRemaining: 3, completed: false };
  await ref.set({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return { ref, data };
}

export async function getPlayerWhitelist(discordId) {
  const profile = await profileFor(discordId);
  const applications = await db.collection("whitelistApplications")
    .where("discordId", "==", discordId).limit(50).get();
  const interviews = await db.collection("whitelistInterviews")
    .where("discordId", "==", discordId).limit(50).get();
  const applicationItems = applications.docs.map(serialize)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  const interviewItems = interviews.docs.map(serialize)
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)).slice(0, 10);
  const latest = applicationItems[0] || null;
  let nextFormAt = null;
  if (latest?.status === "rejected" && latest.decidedAt) {
    nextFormAt = new Date(new Date(latest.decidedAt).getTime() + DAY_MS).toISOString();
  }
  return {
    profile: profile.data,
    latestApplication: latest,
    applications: applicationItems,
    interviews: interviewItems,
    nextFormAt,
    questions: ruleQuestions
  };
}

export async function submitApplication(user, input) {
  const required = ["discovery", "roleplayPlan", "serverYear"];
  if (required.some(key => String(input[key] || "").trim().length < 3)) {
    throw Object.assign(new Error("Vyplňte všechny základní otázky."), { status: 400 });
  }
  if (!Array.isArray(input.ruleAnswers) || input.ruleAnswers.length !== ruleQuestions.length ||
      input.ruleAnswers.some(answer => String(answer.answer || "").trim().length < 20)) {
    throw Object.assign(new Error("Každou otázku z pravidel zodpovězte alespoň 20 znaky."), { status: 400 });
  }

  const result = await db.runTransaction(async transaction => {
    const profileRef = db.collection("whitelistProfiles").doc(user.id);
    const profileSnapshot = await transaction.get(profileRef);
    const profile = profileSnapshot.exists
      ? profileSnapshot.data()
      : { formAttemptsRemaining: 3, interviewAttemptsRemaining: 3, completed: false };
    if (profile.completed) throw Object.assign(new Error("Whitelist již máte dokončený."), { status: 409 });
    if ((profile.formAttemptsRemaining ?? 3) <= 0) {
      throw Object.assign(new Error("Nemáte žádný zbývající pokus."), { status: 429 });
    }
    const previous = await transaction.get(db.collection("whitelistApplications")
      .where("discordId", "==", user.id).limit(50));
    if (previous.docs.some(doc => ["pending", "claimed"].includes(doc.data().status))) {
      throw Object.assign(new Error("Jedna žádost již čeká na vyhodnocení."), { status: 409 });
    }
    const latestDoc = previous.docs.sort((a, b) =>
      (b.data().createdAt?.toMillis?.() || 0) - (a.data().createdAt?.toMillis?.() || 0))[0];
    const latestData = latestDoc?.data();
    if (latestData?.status === "rejected" && latestData.decidedAt &&
        Date.now() - latestData.decidedAt.toMillis() < DAY_MS) {
      throw Object.assign(new Error("Další žádost lze podat až 24 hodin po zamítnutí."), { status: 429 });
    }
    const attempt = 4 - (profile.formAttemptsRemaining ?? 3);
    const ref = db.collection("whitelistApplications").doc();
    transaction.set(ref, {
      discordId: user.id,
      discordName: user.username,
      avatar: user.avatar,
      attempt,
      status: "pending",
      discovery: String(input.discovery).trim(),
      roleplayPlan: String(input.roleplayPlan).trim(),
      serverYear: String(input.serverYear).trim(),
      ruleAnswers: input.ruleAnswers.map(item => ({
        id: String(item.id),
        question: String(item.question),
        answer: String(item.answer).trim()
      })),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    transaction.set(profileRef, {
      formAttemptsRemaining: (profile.formAttemptsRemaining ?? 3) - 1,
      interviewAttemptsRemaining: profile.interviewAttemptsRemaining ?? 3,
      completed: Boolean(profile.completed),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    return { id: ref.id, attempt };
  });
  return result;
}

export async function listAdminApplications(status = "pending") {
  const snapshot = await db.collection("whitelistApplications")
    .where("status", "==", status).limit(100).get();
  return snapshot.docs.map(serialize).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function claimApplication(applicationId, admin) {
  const ref = db.collection("whitelistApplications").doc(applicationId);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw Object.assign(new Error("Žádost nebyla nalezena."), { status: 404 });
    if (snapshot.data().status !== "pending") {
      throw Object.assign(new Error("Žádost již někdo převzal."), { status: 409 });
    }
    transaction.update(ref, {
      status: "claimed",
      claimedBy: admin.id,
      claimedByName: admin.username,
      claimedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
  });
  return { id: applicationId, status: "claimed" };
}

async function sendDiscordDm(discordId, content) {
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
}

async function sendWebhook(url, embed) {
  if (!url) return false;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });
  return response.ok;
}

export async function decideApplication(applicationId, admin, decision, reason = "") {
  if (!["approved", "rejected"].includes(decision)) throw Object.assign(new Error("Neplatný verdikt."), { status: 400 });
  if (decision === "rejected" && String(reason).trim().length < 3) {
    throw Object.assign(new Error("U zamítnutí je povinný důvod."), { status: 400 });
  }
  const ref = db.collection("whitelistApplications").doc(applicationId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw Object.assign(new Error("Žádost nebyla nalezena."), { status: 404 });
  const application = snapshot.data();
  if (application.status !== "claimed") throw Object.assign(new Error("Žádost musí být nejdříve převzata."), { status: 409 });
  if (application.claimedBy !== admin.id) throw Object.assign(new Error("Žádost převzal jiný administrátor."), { status: 403 });
  await ref.update({
    status: decision,
    reason: String(reason).trim(),
    decidedBy: admin.id,
    decidedByName: admin.username,
    decidedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
  if (decision === "approved") {
    await sendDiscordDm(application.discordId, "Ahoj, tvá žádost byla schválena. Budeme se na tebe těšit u pohovoru.");
  }
  return { id: applicationId, status: decision };
}

export async function requestInterview(user) {
  const approved = await db.collection("whitelistApplications")
    .where("discordId", "==", user.id).limit(50).get();
  const approvedApplication = approved.docs.find(doc => doc.data().status === "approved");
  if (!approvedApplication) throw Object.assign(new Error("Nejdříve musí být schválen formulář."), { status: 403 });
  const profile = await profileFor(user.id);
  if ((profile.data.interviewAttemptsRemaining ?? 3) <= 0) {
    throw Object.assign(new Error("Nemáte žádný pokus o pohovor."), { status: 429 });
  }
  const active = await db.collection("whitelistInterviews")
    .where("discordId", "==", user.id).limit(50).get();
  const activeDoc = active.docs.filter(doc => ["waiting", "claimed"].includes(doc.data().status))
    .sort((a, b) => (b.data().requestedAt?.toMillis?.() || 0) - (a.data().requestedAt?.toMillis?.() || 0))[0];
  if (activeDoc) {
    const current = activeDoc.data();
    if (current.status === "claimed" || Date.now() - current.requestedAt.toMillis() < HOUR_MS) {
      throw Object.assign(new Error("Žádost o pohovor je stále aktivní."), { status: 409 });
    }
    await activeDoc.ref.update({ status: "expired", updatedAt: FieldValue.serverTimestamp() });
  }
  const attempt = 4 - (profile.data.interviewAttemptsRemaining ?? 3);
  const ref = db.collection("whitelistInterviews").doc();
  await ref.set({
    discordId: user.id,
    discordName: user.username,
    avatar: user.avatar,
    applicationId: approvedApplication.id,
    attempt,
    status: "waiting",
    requestedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
  await sendWebhook(env.discordInterviewWebhook, {
    color: 0xA66B2B,
    title: "Žádost o pohovor",
    description: `Občan **${user.username}** žádá o výslech ohledně vstupu do státu.`,
    fields: [{ name: "Pokus", value: `${attempt}/3`, inline: true }],
    footer: { text: "Deadstone Roleplay · Whitelist" },
    timestamp: new Date().toISOString()
  });
  return { id: ref.id, attempt, status: "waiting" };
}

export async function listAdminInterviews(status = "waiting") {
  const snapshot = await db.collection("whitelistInterviews")
    .where("status", "==", status).limit(100).get();
  return snapshot.docs.map(serialize).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
}

export async function claimInterview(interviewId, admin) {
  const ref = db.collection("whitelistInterviews").doc(interviewId);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw Object.assign(new Error("Pohovor nebyl nalezen."), { status: 404 });
    if (snapshot.data().status !== "waiting") throw Object.assign(new Error("Pohovor již někdo převzal."), { status: 409 });
    transaction.update(ref, {
      status: "claimed",
      claimedBy: admin.id,
      claimedByName: admin.username,
      claimedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
  });
  return { id: interviewId, status: "claimed" };
}

async function changeDiscordRole(discordId, roleId, method) {
  const response = await fetch(`${DISCORD_API}/guilds/${env.discordGuildId}/members/${discordId}/roles/${roleId}`, {
    method,
    headers: { Authorization: `Bot ${env.discordToken}` }
  });
  if (!response.ok) throw new Error(`Discord roli se nepodařilo změnit (${response.status}).`);
}

export async function decideInterview(interviewId, admin, decision, reason = "") {
  if (!["approved", "rejected"].includes(decision)) throw Object.assign(new Error("Neplatný verdikt."), { status: 400 });
  const ref = db.collection("whitelistInterviews").doc(interviewId);
  let interview;
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw Object.assign(new Error("Pohovor nebyl nalezen."), { status: 404 });
    interview = snapshot.data();
    if (interview.status !== "claimed") throw Object.assign(new Error("Pohovor musí být nejdříve převzat."), { status: 409 });
    if (interview.claimedBy !== admin.id) throw Object.assign(new Error("Pohovor převzal jiný administrátor."), { status: 403 });
    const profileRef = db.collection("whitelistProfiles").doc(interview.discordId);
    const profileSnapshot = await transaction.get(profileRef);
    const profile = profileSnapshot.data() || { interviewAttemptsRemaining: 3 };
    transaction.update(ref, {
      status: decision,
      reason: String(reason).trim(),
      decidedBy: admin.id,
      decidedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    transaction.set(profileRef, {
      interviewAttemptsRemaining: Math.max(0, (profile.interviewAttemptsRemaining ?? 3) - 1),
      completed: decision === "approved",
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
  if (decision === "approved") {
    await changeDiscordRole(interview.discordId, env.discordApprovedRoleId, "PUT");
    await changeDiscordRole(interview.discordId, env.discordAutoRoleId, "DELETE");
  }
  const approved = decision === "approved";
  await sendWebhook(env.discordWhitelistWebhook, {
    color: approved ? 0x4F7B45 : 0x8A2D22,
    title: approved ? "Platný list ke vstupu" : "Vstup do státu zamítnut",
    description: approved
      ? `**${interview.discordName}** právě vstupuje do státu s platným listem!`
      : `**${interview.discordName}** právě usedl na loď a odplouvá. Vstup do státu mu byl zamítnut!`,
    footer: { text: "Deadstone Roleplay · 1899" },
    timestamp: new Date().toISOString()
  });
  return { id: interviewId, status: decision };
}

export async function adjustAttempts(discordId, type, amount) {
  const field = type === "interview" ? "interviewAttemptsRemaining" : "formAttemptsRemaining";
  const ref = db.collection("whitelistProfiles").doc(discordId);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.data()?.[field] ?? 3;
    transaction.set(ref, {
      [field]: Math.max(0, Math.min(99, current + Number(amount || 0))),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
  return { ok: true };
}
