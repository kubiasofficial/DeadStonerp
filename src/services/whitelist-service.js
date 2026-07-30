import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config/firebase.js";
import { env } from "../config/env.js";

const DISCORD_API = "https://discord.com/api/v10";
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export const ruleQuestions = [
  { id: "respekt", title: "Respekt", question: "Jaký je rozdíl mezi konfliktem postav a konfliktem skutečných hráčů?" },
  { id: "mikrofon", title: "Používání mikrofonu", question: "Jaké požadavky musí splňovat mikrofon hráče na Deadstone Roleplay?" },
  { id: "dodrzovani-rp", title: "Dodržování roleplaye", question: "Jak se máš po připojení na server chovat a proč roleplay není soutěž o vítězství?" },
  { id: "vhodna-postava", title: "Vhodná postava", question: "Jaké vlastnosti má mít uvěřitelná postava zasazená do roku 1899?" },
  { id: "vyuzivani-chyb", title: "Využívání chyb", question: "Co uděláš, když objevíš chybu hry nebo serveru, která by ti mohla poskytnout výhodu?" },
  { id: "obchazeni-trestu", title: "Obcházení trestů", question: "Uveď příklad obcházení trestu a vysvětli, proč je takové jednání zakázané." },
  { id: "neznalost-pravidel", title: "Neznalost pravidel", question: "Omlouvá neznalost pravidel jejich porušení a jak má hráč sledovat jejich změny?" },
  { id: "prikaz-me", title: "Příkaz /me", question: "K čemu slouží příkaz /me a co pomocí něj nesmíš určit nebo ovládat?" },
  { id: "prikaz-do", title: "Příkaz /do", question: "Vysvětli rozdíl mezi příkazy /me a /do a uveď správný příklad použití /do." },
  { id: "prikaz-doc", title: "Příkaz /doc", question: "Kdy se používá příkaz /doc a jak bys pomocí něj rozehrál delší činnost?" },
  { id: "prikaz-stopa", title: "Příkaz /stopa", question: "Jak má vypadat správná RP stopa a jaké informace naopak nesmí prozradit?" },
  { id: "prikaz-try", title: "Příkaz /try", question: "Kdy je vhodné použít /try a proč jím nelze rozhodnout výsledek přestřelky?" },
  { id: "prikaz-roll", title: "Příkaz /roll", question: "Za jakých podmínek se používá /roll a proč jeho výsledek nenahrazuje roleplay?" },
  { id: "ic-ooc", title: "IC a OOC", question: "Vysvětli rozdíl mezi IC a OOC informací a uveď příklad, kdy OOC informaci nesmíš použít." },
  { id: "metagaming", title: "Metagaming", question: "Co je metagaming a jak se zachováš, když na streamu zjistíš polohu jiného hráče?" },
  { id: "powergaming", title: "Powergaming", question: "Co je powergaming a proč nesmíš jiné postavě předem určit výsledek své akce?" },
  { id: "failrp", title: "FailRP", question: "Vysvětli pojem FailRP a uveď alespoň dva příklady nereálného jednání." },
  { id: "fearrp", title: "FearRP", question: "Jak se má postava zachovat, když jí z bezprostřední blízkosti někdo míří revolverem?" },
  { id: "combat-logging", title: "Combat Logging", question: "Co je combat logging a co musíš udělat, pokud se během RP situace odpojíš kvůli technickému problému?" },
  { id: "stream-sniping", title: "Stream Sniping", question: "Co je stream sniping a proč poskytuje nefér herní výhodu?" },
  { id: "ghosting", title: "Ghosting", question: "Co znamená ghosting a kdy postava nesmí předávat získané informace?" },
  { id: "baiting", title: "Baiting", question: "Co je baiting a proč nelze bezdůvodně provokovat ostatní pouze kvůli vyvolání konfliktu?" },
  { id: "common-sense", title: "Common Sense", question: "Jak máš postupovat v situaci, kterou pravidla výslovně nepopisují?" },
  { id: "ck-vyznam", title: "Character Kill", question: "Co znamená Character Kill a co se stane s postavou po jeho vykonání?" },
  { id: "ck-majetek", title: "CK a majetek", question: "Co je před CK zakázáno udělat s majetkem postavy a proč zákaz platí i pro darování přátelům?" },
  { id: "ck-nova-postava", title: "Nová postava po CK", question: "Jaká omezení platí pro novou postavu během prvních 14 dnů po CK?" },
  { id: "ck-cizi-postavy", title: "CK cizí postavy", question: "Jaké podmínky musí být splněny před vykonáním CK cizí postavy a jak dlouho schválení platí?" },
  { id: "ck-odvolani", title: "Odvolání proti CK", question: "Do kdy může oběť podat odvolání proti CK a co musí po vykonání CK zůstat na místě?" },
  { id: "selfck", title: "SelfCK", question: "Jaké podmínky platí pro SelfCK a k jakým účelům nesmí být nikdy použito?" },
  { id: "situacni-ck", title: "Situační CK", question: "Co je Situační CK a proč běžný konflikt nebo jednorázová přestřelka nestačí jako důvod?" },
  { id: "gross-definice", title: "Gross Roleplay", question: "Co je Gross Roleplay a proč povaha postavy neomlouvá porušování jeho pravidel?" },
  { id: "gross-souhlas", title: "Souhlas s Gross RP", question: "Jakým způsobem se uděluje souhlas s Gross RP a co se stane, když jej hráč odvolá?" },
  { id: "gross-novy-hrac", title: "Nový účastník Gross RP", question: "Jak musí skupina postupovat, pokud se do probíhající Gross RP situace zapojí další hráč?" },
  { id: "gross-zakazane", title: "Zakázaný Gross RP", question: "Uveď alespoň tři druhy obsahu, které jsou zakázané i tehdy, když by s nimi všichni hráči souhlasili." },
  { id: "gross-vyjimky", title: "Výjimky Gross RP", question: "Jaké výjimky platí pro trvalé následky při CK a pro skalpování indiánskými kmeny?" },
  { id: "gross-administrace", title: "Zásah administrace", question: "Kdy může administrace Gross RP ukončit a jak musí účastníci na její rozhodnutí reagovat?" }
];

const WHITELIST_QUESTION_COUNT = 5;

function randomRuleQuestions() {
  return [...ruleQuestions]
    .map(question => ({ question, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, WHITELIST_QUESTION_COUNT)
    .map(item => item.question);
}

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
    questions: randomRuleQuestions()
  };
}

export async function submitApplication(user, input) {
  const required = ["discovery", "roleplayPlan", "serverYear"];
  if (required.some(key => String(input[key] || "").trim().length < 3)) {
    throw Object.assign(new Error("Vyplňte všechny základní otázky."), { status: 400 });
  }
  const allowedQuestionIds = new Set(ruleQuestions.map(question => question.id));
  const submittedQuestionIds = new Set((input.ruleAnswers || []).map(answer => String(answer.id)));
  if (!Array.isArray(input.ruleAnswers) || input.ruleAnswers.length !== WHITELIST_QUESTION_COUNT ||
      submittedQuestionIds.size !== WHITELIST_QUESTION_COUNT ||
      input.ruleAnswers.some(answer =>
        !allowedQuestionIds.has(String(answer.id)) ||
        String(answer.answer || "").trim().length < 20)) {
    throw Object.assign(new Error("Zodpověz všech 5 náhodně vybraných otázek alespoň 20 znaky."), { status: 400 });
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
    console.error("Discord soukromou zprávu se nepodařilo odeslat:", error.message);
    return false;
  }
}

async function sendWebhook(url, embed) {
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] })
    });
    if (!response.ok) console.error(`Discord webhook odmítl zprávu (${response.status}).`);
    return response.ok;
  } catch (error) {
    console.error("Discord webhook se nepodařilo odeslat:", error.message);
    return false;
  }
}

async function sendChannelEmbed(channelId, embed, mentionedUserId = "") {
  if (!channelId || !env.discordToken) return false;
  try {
    const response = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${env.discordToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        content: mentionedUserId ? `<@${mentionedUserId}>` : undefined,
        embeds: [embed],
        allowed_mentions: mentionedUserId ? { users: [mentionedUserId] } : { parse: [] }
      })
    });
    if (!response.ok) console.error(`Discord zprávu do kanálu se nepodařilo odeslat (${response.status}).`);
    return response.ok;
  } catch (error) {
    console.error("Discord zprávu do kanálu se nepodařilo odeslat:", error.message);
    return false;
  }
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
  const interviewEmbed = {
    color: 0xA66B2B,
    title: "Žádost o pohovor",
    description: `Občan <@${user.id}> (**${user.username}**) žádá o výslech ohledně vstupu do státu.`,
    fields: [{ name: "Pokus", value: `${attempt}/3`, inline: true }],
    footer: { text: "Deadstone Roleplay · Whitelist" },
    timestamp: new Date().toISOString()
  };
  if (env.discordInterviewChannelId) {
    await sendChannelEmbed(env.discordInterviewChannelId, interviewEmbed, user.id);
  } else {
    await sendWebhook(env.discordInterviewWebhook, interviewEmbed);
  }
  return { id: ref.id, attempt, status: "waiting" };
}

export async function listAdminInterviews(status = "waiting") {
  const snapshot = await db.collection("whitelistInterviews")
    .where("status", "==", status).limit(100).get();
  return snapshot.docs.map(serialize).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
}

export async function listGrantedAccess() {
  const snapshot = await db.collection("whitelistProfiles")
    .where("completed", "==", true).limit(100).get();
  return Promise.all(snapshot.docs.map(async profileDoc => {
    const profile = profileDoc.data();
    const userDoc = await db.collection("discordUsers").doc(profileDoc.id).get();
    const user = userDoc.data() || {};
    const interviewSnapshot = await db.collection("whitelistInterviews")
      .where("discordId", "==", profileDoc.id).limit(50).get();
    const approved = interviewSnapshot.docs
      .filter(doc => doc.data().status === "approved")
      .sort((a, b) => (b.data().decidedAt?.toMillis?.() || 0) - (a.data().decidedAt?.toMillis?.() || 0))[0]?.data() || {};
    return {
      discordId: profileDoc.id,
      discordName: profile.discordName || approved.discordName || user.globalName || user.username || profileDoc.id,
      avatar: profile.avatar || approved.avatar || null,
      completedAt: profile.completedAt?.toDate?.().toISOString?.() || approved.decidedAt?.toDate?.().toISOString?.() || null
    };
  }));
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
  const existingSnapshot = await ref.get();
  if (!existingSnapshot.exists) throw Object.assign(new Error("Pohovor nebyl nalezen."), { status: 404 });
  const existing = existingSnapshot.data();
  if (existing.status === decision) {
    if (decision === "approved") {
      await changeDiscordRole(existing.discordId, env.discordApprovedRoleId, "PUT");
      await changeDiscordRole(existing.discordId, env.discordAutoRoleId, "DELETE");
    }
    return { id: interviewId, status: decision, alreadyCompleted: true };
  }
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
      discordName: interview.discordName,
      avatar: interview.avatar || null,
      completedAt: decision === "approved" ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
  if (decision === "approved") {
    await changeDiscordRole(interview.discordId, env.discordApprovedRoleId, "PUT");
    await changeDiscordRole(interview.discordId, env.discordAutoRoleId, "DELETE");
  }
  const approved = decision === "approved";
  const decisionEmbed = {
    color: approved ? 0x4F7B45 : 0x8A2D22,
    title: approved ? "Platný list ke vstupu" : "Vstup do státu zamítnut",
    description: approved
      ? `<@${interview.discordId}> (**${interview.discordName}**) právě vstupuje do státu s platným listem!`
      : `<@${interview.discordId}> (**${interview.discordName}**) právě usedl na loď a odplouvá. Vstup do státu mu byl zamítnut!`,
    footer: { text: "Deadstone Roleplay · 1899" },
    timestamp: new Date().toISOString()
  };
  if (env.discordDecisionChannelId) {
    await sendChannelEmbed(env.discordDecisionChannelId, decisionEmbed, interview.discordId);
  } else {
    await sendWebhook(env.discordWhitelistWebhook, decisionEmbed);
  }
  return { id: interviewId, status: decision };
}

export async function revokeAccess(discordId, admin) {
  const profileRef = db.collection("whitelistProfiles").doc(discordId);
  const profileSnapshot = await profileRef.get();
  if (!profileSnapshot.exists || !profileSnapshot.data().completed) {
    throw Object.assign(new Error("Hráč nemá aktivní plný přístup."), { status: 404 });
  }

  const [applications, interviews] = await Promise.all([
    db.collection("whitelistApplications").where("discordId", "==", discordId).limit(100).get(),
    db.collection("whitelistInterviews").where("discordId", "==", discordId).limit(100).get()
  ]);
  const batch = db.batch();
  batch.set(profileRef, {
    completed: false,
    completedAt: null,
    formAttemptsRemaining: 3,
    interviewAttemptsRemaining: 3,
    revokedBy: admin.id,
    revokedByName: admin.username,
    revokedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  applications.docs.filter(doc => ["approved", "claimed", "pending"].includes(doc.data().status))
    .forEach(doc => batch.update(doc.ref, {
      status: "access_revoked",
      revokedBy: admin.id,
      revokedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }));
  interviews.docs.filter(doc => ["approved", "claimed", "waiting"].includes(doc.data().status))
    .forEach(doc => batch.update(doc.ref, {
      status: "access_revoked",
      revokedBy: admin.id,
      revokedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }));
  await batch.commit();

  await changeDiscordRole(discordId, env.discordAutoRoleId, "PUT");
  await changeDiscordRole(discordId, env.discordApprovedRoleId, "DELETE");
  await sendDiscordDm(discordId, "Tvůj vstupní list do státu Deadstone byl administrací odebrán. Pro opětovný vstup musíš znovu projít whitelistovým formulářem a pohovorem.");
  return { discordId, completed: false, formAttemptsRemaining: 3, interviewAttemptsRemaining: 3 };
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
