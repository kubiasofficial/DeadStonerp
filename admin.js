const apiBase = window.DEADSTONE_CONFIG?.apiBase?.replace(/\/$/, "") || location.origin;
const list = document.querySelector("#admin-list");
const tabs = document.querySelector("#admin-tabs");
const message = document.querySelector("#admin-message");
let section = "applications";
let status = "pending";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[character]);

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const body = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new Error(body.error || "Požadavek se nepodařil.");
  return body.data ?? body.user ?? body;
}

function notify(text, error = false) {
  message.textContent = text;
  message.className = `message${error ? " error" : ""}`;
  message.hidden = false;
}

const applicationTabs = [
  ["pending", "Čekající"], ["claimed", "Převzaté"], ["approved", "Schválené"], ["rejected", "Zamítnuté"]
];
const interviewTabs = [
  ["waiting", "Čekající"], ["claimed", "Převzaté"], ["approved", "Schválené"], ["rejected", "Zamítnuté"]
];
const characterTabs = [
  ["pending", "Čekající"], ["approved", "Schválené"], ["rejected", "Zamítnuté"], ["edited", "Upravené"]
];
const ticketTabs = [
  ["waiting", "Čekající"], ["in_progress", "Rozjednané"], ["closed", "Uzavřené"]
];

function renderTabs() {
  if (section === "atlas") {
    tabs.innerHTML = `<span class="status-badge">Kartografický úřad · lokace a regiony</span>`;
    return;
  }
  if (["reputation", "feedback", "ticket-settings"].includes(section)) {
    tabs.innerHTML = `<span class="status-badge">${section === "reputation" ? "Reputace vedení" : section === "feedback" ? "Důvěrná zpětná vazba" : "Oprávnění citlivých ticketů"}</span>`;
    return;
  }
  if (section === "access") {
    tabs.innerHTML = `<span class="status-badge approved">Aktivní vstupní listy</span>`;
    return;
  }
  const values = section === "applications" ? applicationTabs : section === "characters" ? characterTabs : section === "tickets" ? ticketTabs : interviewTabs;
  tabs.innerHTML = values.map(([value, label]) =>
    `<button class="tab ${status === value ? "active" : ""}" data-status="${value}">${label}</button>`).join("");
  tabs.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    status = button.dataset.status;
    load();
  }));
}

function ticketCard(item) {
  const priority = { low: "Nízká", normal: "Běžná", high: "Vysoká", urgent: "Naléhavá" }[item.priority] || item.priority;
  return `<article class="request-card">
    <div class="request-head">${item.authorAvatar ? `<img src="${escapeHtml(item.authorAvatar)}" alt="">` : ""}<div><h2>${escapeHtml(item.number)} · ${escapeHtml(item.categoryLabel)}</h2><p>${escapeHtml(item.authorName)} · priorita ${priority}${item.assignedName ? ` · řeší ${escapeHtml(item.assignedName)}` : ""}</p></div></div>
    <p>${escapeHtml(item.description)}</p>
    <div class="actions">
      <button class="button button-ghost" data-ticket-open="${item.id}">Otevřít</button>
      ${item.status === "waiting" ? `<button class="button" data-ticket-claim="${item.id}">Převzít</button>` : ""}
    </div>
  </article>`;
}

async function openAdminTicket(id) {
  const item = await api(`/api/admin/tickets/${id}`);
  list.innerHTML = `<button class="button button-ghost" id="ticket-back">← Zpět</button>
    <article class="request-card"><p class="eyebrow">${escapeHtml(item.number)} · ${escapeHtml(item.categoryLabel)}</p>
    <h2>${escapeHtml(item.authorName)}</h2><p>${escapeHtml(item.description)}</p>
    <div class="actions">
      <select id="ticket-priority"><option value="low">Nízká</option><option value="normal">Běžná</option><option value="high">Vysoká</option><option value="urgent">Naléhavá</option></select>
      <button class="button button-ghost" id="save-priority">Uložit prioritu</button>
      ${!item.assignedTo ? `<button class="button" id="claim-detail">Převzít</button>` : `<button class="button button-ghost" id="transfer-ticket">Předat</button>`}
    </div></article>
    <div class="request-list">${(item.messages || []).map(entry => `<article class="request-card ${entry.type === "internal" ? "internal-note" : ""}"><strong>${escapeHtml(entry.authorName)}</strong> ${entry.type === "internal" ? "· INTERNÍ" : ""}<p>${escapeHtml(entry.content)}</p>${(entry.attachments || []).map(file => `<a class="button button-ghost" target="_blank" href="${escapeHtml(file.url)}">${escapeHtml(file.name)}</a>`).join("")}</article>`).join("")}</div>
    ${item.status !== "closed" ? `<form class="content-editor" id="admin-reply"><h2>Nová zpráva</h2><textarea id="admin-reply-text"></textarea><label><input type="checkbox" id="admin-internal"> Interní poznámka – hráč ji neuvidí</label><div class="actions"><button class="button">Odeslat</button><button type="button" class="button reject" id="close-ticket">Uzavřít ticket</button></div></form>` : ""}
    <details class="request-card"><summary>Kompletní audit (${(item.audit || []).length})</summary>${(item.audit || []).map(entry => `<p>${escapeHtml(entry.action)} · ${escapeHtml(entry.actorName)}</p>`).join("")}</details>`;
  document.querySelector("#ticket-back").onclick = load;
  const priority = document.querySelector("#ticket-priority"); if (priority) priority.value = item.priority;
  document.querySelector("#save-priority")?.addEventListener("click", async () => {
    await api(`/api/admin/tickets/${id}/priority`, { method:"PATCH", body:JSON.stringify({ priority: priority.value }) }); notify("Priorita byla změněna.");
  });
  document.querySelector("#claim-detail")?.addEventListener("click", async () => {
    await api(`/api/admin/tickets/${id}/claim`, { method:"POST", body:"{}" }); openAdminTicket(id);
  });
  document.querySelector("#transfer-ticket")?.addEventListener("click", async () => {
    const assigneeId = prompt("Discord ID nového řešitele:"); if (!assigneeId) return;
    const assigneeName = prompt("Jméno nového řešitele:"); if (!assigneeName) return;
    await api(`/api/admin/tickets/${id}/transfer`, { method:"PATCH", body:JSON.stringify({ assigneeId, assigneeName }) }); openAdminTicket(id);
  });
  document.querySelector("#admin-reply")?.addEventListener("submit", async event => {
    event.preventDefault(); await api(`/api/admin/tickets/${id}/messages`, { method:"POST", body:JSON.stringify({ content:document.querySelector("#admin-reply-text").value, internal:document.querySelector("#admin-internal").checked }) }); openAdminTicket(id);
  });
  document.querySelector("#close-ticket")?.addEventListener("click", async () => {
    const reason = prompt("Výsledek: resolved / rejected / duplicate / insufficient / player_cancelled / other", "resolved"); if (!reason) return;
    const closingMessage = prompt("Závěrečná zpráva hráči (volitelné):", "") || "";
    await api(`/api/admin/tickets/${id}/close`, { method:"POST", body:JSON.stringify({ reason, message:closingMessage }) }); notify("Ticket byl uzavřen."); status="closed"; load();
  });
}

function bindTicketActions() {
  list.querySelectorAll("[data-ticket-open]").forEach(button => button.onclick = () => openAdminTicket(button.dataset.ticketOpen).catch(error => notify(error.message, true)));
  list.querySelectorAll("[data-ticket-claim]").forEach(button => button.onclick = async () => {
    try { await api(`/api/admin/tickets/${button.dataset.ticketClaim}/claim`, { method:"POST", body:"{}" }); status="in_progress"; notify("Ticket byl převzat."); load(); }
    catch (error) { notify(error.message, true); }
  });
}

async function renderReputation() {
  const data = await api("/api/admin/tickets/reputation");
  list.innerHTML = data.length ? data.map(item => `<article class="request-card"><h2>${escapeHtml(item.name)}</h2><p><span class="status-badge approved">+rep ${item.plus}</span> <span class="status-badge rejected">-rep ${item.minus}</span></p></article>`).join("") : "<p>Zatím nebyla odeslána žádná zpětná vazba.</p>";
}

async function renderFeedback() {
  const data = await api("/api/admin/tickets/feedback");
  list.innerHTML = data.length ? data.map(item => `<article class="request-card"><h2>${escapeHtml(item.targetName)} · ${item.rating === "plus" ? "+rep" : "-rep"}</h2><p>Autor: ${escapeHtml(item.authorName)}</p><p>${escapeHtml(item.note)}</p></article>`).join("") : "<p>Zatím nebyla odeslána žádná zpětná vazba.</p>";
}

const ticketCategoryLabels = { bug:"Bug Report",player_report:"Nahlášení hráče",ck:"CK Tickety",general:"Obecná pomoc",partnership:"Partnerství",leadership:"Kontakt s vedením",faction:"Žádost o frakci",other:"Ostatní" };
const adminRoleLabels = {
  "1531972762065829938":"Owner","1531973545888841870":"Head Administrator","1531974140691480677":"Administrator",
  "1531974942265180180":"Lead Developer","1531975985820471379":"Developer","1531976340310458408":"WL Adder","1531976917933359244":"Trainee"
};
async function renderTicketSettings() {
  const settings = await api("/api/admin/tickets/settings");
  list.innerHTML = `<form id="permission-form" class="content-editor"><p>Fajfkou urči, které role smějí vidět a řešit jednotlivé kategorie.</p>${Object.entries(ticketCategoryLabels).map(([key,label])=>`<fieldset class="request-card"><legend>${label}</legend>${Object.entries(adminRoleLabels).map(([id,name])=>`<label><input type="checkbox" data-category-access="${key}" value="${id}" ${(settings.access?.[key]||[]).includes(id)?"checked":""}> ${name}</label>`).join("")}</fieldset>`).join("")}<button class="button">Uložit oprávnění</button></form>`;
  document.querySelector("#permission-form").onsubmit = async event => {
    event.preventDefault(); const access={}; document.querySelectorAll("[data-category-access]").forEach(input=>{access[input.dataset.categoryAccess]||=[];if(input.checked)access[input.dataset.categoryAccess].push(input.value)});
    await api("/api/admin/tickets/settings",{method:"PATCH",body:JSON.stringify({access})});notify("Oprávnění ticketů byla uložena.");
  };
}

function answerRows(item) {
  return `
    <dt>Jak se dozvěděl</dt><dd>${escapeHtml(item.discovery)}</dd>
    <dt>Co chce RPit</dt><dd>${escapeHtml(item.roleplayPlan)}</dd>
    <dt>Rok serveru</dt><dd>${escapeHtml(item.serverYear)}</dd>
    ${(item.ruleAnswers || []).map(answer =>
      `<dt>${escapeHtml(answer.question)}</dt><dd>${escapeHtml(answer.answer)}</dd>`).join("")}`;
}

function applicationCard(item) {
  return `<article class="request-card">
    <div class="request-head"><img src="${escapeHtml(item.avatar)}" alt=""><div><h2>${escapeHtml(item.discordName)}</h2><p>ID ${escapeHtml(item.discordId)} · pokus ${item.attempt}/3</p></div></div>
    <dl>${answerRows(item)}</dl>
    ${item.reason ? `<div class="reason">${escapeHtml(item.reason)}</div>` : ""}
    <div class="actions">
      ${item.status === "pending" ? `<button class="button" data-claim-application="${item.id}">Převzít</button>` : ""}
      ${item.status === "claimed" ? `
      <button class="button approve" data-application="${item.id}" data-decision="approved">Schválit</button>
      <button class="button reject" data-application="${item.id}" data-decision="rejected">Zamítnout</button>` : ""}
      <button class="button button-ghost" data-attempt="${item.discordId}" data-type="form">Přidat pokus</button>
    </div>
  </article>`;
}

function interviewCard(item) {
  const claimedByMe = item.status === "claimed";
  return `<article class="request-card">
    <div class="request-head"><img src="${escapeHtml(item.avatar)}" alt=""><div><h2>${escapeHtml(item.discordName)}</h2><p>ID ${escapeHtml(item.discordId)} · pohovor ${item.attempt}/3</p></div></div>
    ${claimedByMe ? `<div class="message"><strong>Nápověda k pohovoru:</strong><br>Ověř vlastními slovy rozdíl IC/OOC, použití /me a /do, FearRP, metagaming, připravený charakter a zasazení roku 1899.</div>` : ""}
    ${item.reason ? `<div class="reason">${escapeHtml(item.reason)}</div>` : ""}
    <div class="actions">
      ${item.status === "waiting" ? `<button class="button" data-claim="${item.id}">Převzít</button>` : ""}
      ${item.status === "claimed" ? `<button class="button approve" data-interview="${item.id}" data-decision="approved">Prošel</button>
        <button class="button reject" data-interview="${item.id}" data-decision="rejected">Neprošel</button>` : ""}
      <button class="button button-ghost" data-attempt="${item.discordId}" data-type="interview">Přidat pokus</button>
    </div>
  </article>`;
}

function accessCard(item) {
  return `<article class="request-card">
    <div class="request-head">${item.avatar ? `<img src="${escapeHtml(item.avatar)}" alt="">` : ""}
      <div><h2>${escapeHtml(item.discordName)}</h2><p>ID ${escapeHtml(item.discordId)}</p></div></div>
    <p>Hráč má platný vstupní list a plný přístup do státu.</p>
    <div class="actions"><button class="button reject" data-revoke="${item.discordId}" data-name="${escapeHtml(item.discordName)}">Odebrat přístup</button></div>
  </article>`;
}

function characterCard(item) {
  return `<article class="request-card">
    <div class="request-head"><div><h2>${escapeHtml(item.name)}</h2><p>Hráč ${escapeHtml(item.ownerDiscordName)} · <@${escapeHtml(item.ownerDiscordId)}></p></div></div>
    ${item.editReviewPending ? `<div class="message">Hráč <strong>${escapeHtml(item.ownerDiscordName)}</strong> si upravil postavu <strong>${escapeHtml(item.name)}</strong>.</div>` : ""}
    <dl><dt>Rok narození</dt><dd>${item.birthYear}</dd><dt>Původ</dt><dd>${escapeHtml(item.origin)}</dd><dt>Lore</dt><dd>${escapeHtml(item.lore)}</dd></dl>
    ${item.rejectionReason ? `<div class="reason">${escapeHtml(item.rejectionReason)}</div>` : ""}
    <div class="actions">
      ${item.status === "pending" ? `<button class="button approve" data-character-decision="${item.id}" data-decision="approved">Schválit</button><button class="button reject" data-character-decision="${item.id}" data-decision="rejected">Zamítnout</button>` : ""}
      ${item.editReviewPending ? `<button class="button approve" data-character-ack="${item.id}">Zkontrolováno</button>` : ""}
      <button class="button button-ghost" data-character-edit="${item.id}">Upravit</button>
      <button class="button reject" data-character-delete="${item.id}">Smazat</button>
    </div>
  </article>`;
}

function bindCharacterActions(items) {
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  list.querySelectorAll("[data-character-decision]").forEach(button => button.addEventListener("click", async () => {
    const rejected = button.dataset.decision === "rejected";
    const reason = rejected ? prompt("Uveď důvod zamítnutí postavy:") : "";
    if (rejected && !reason) return;
    button.disabled = true;
    try {
      await api(`/api/admin/characters/${button.dataset.characterDecision}/decision`, {
        method: "PATCH", body: JSON.stringify({ decision: button.dataset.decision, reason })
      });
      notify(rejected ? "Postava byla zamítnuta a hráč dostal důvod do soukromé zprávy." : "Postava byla schválena.");
      load();
    } catch (error) { notify(error.message, true); }
  }));
  list.querySelectorAll("[data-character-ack]").forEach(button => button.addEventListener("click", async () => {
    try {
      await api(`/api/admin/characters/${button.dataset.characterAck}/acknowledge`, { method: "POST", body: "{}" });
      notify("Úprava byla označena jako zkontrolovaná."); load();
    } catch (error) { notify(error.message, true); }
  }));
  list.querySelectorAll("[data-character-edit]").forEach(button => button.addEventListener("click", async () => {
    const item = byId[button.dataset.characterEdit];
    const name = prompt("Jméno a příjmení:", item.name); if (!name) return;
    const birthYear = Number(prompt("Rok narození:", item.birthYear)); if (!birthYear) return;
    const origin = prompt("Původ:", item.origin); if (!origin) return;
    const lore = prompt("Lore:", item.lore); if (!lore) return;
    try {
      await api(`/api/admin/characters/${item.id}`, {
        method: "PATCH", body: JSON.stringify({ name, birthYear, origin, lore })
      });
      notify("Postava byla administrátorem upravena."); load();
    } catch (error) { notify(error.message, true); }
  }));
  list.querySelectorAll("[data-character-delete]").forEach(button => button.addEventListener("click", async () => {
    if (!confirm("Opravdu tuto postavu trvale smazat?")) return;
    try {
      await api(`/api/admin/characters/${button.dataset.characterDelete}`, { method: "DELETE" });
      notify("Postava byla smazána."); load();
    } catch (error) { notify(error.message, true); }
  }));
}

function contentLabel() {
  return section === "news" ? "novinku" : "město";
}

function renderContentManager(items) {
  const isNews = section === "news";
  tabs.innerHTML = `<span class="status-badge">${isNews ? "Redakce novinek" : "Městská kronika"}</span>`;
  list.innerHTML = `
    <form class="content-editor" id="content-editor">
      <input type="hidden" id="content-id">
      <h2 id="editor-title">${isNews ? "Nová novinka" : "Nové město"}</h2>
      <div class="editor-grid">
        <label>${isNews ? "Nadpis" : "Název města"}<input type="text" id="content-title" required maxlength="100"></label>
        <label>Obrázek<input type="file" id="content-image" accept="image/jpeg,image/png,image/webp"></label>
      </div>
      <label>Text<textarea id="content-text" required maxlength="3000"></textarea></label>
      <img class="content-preview" id="content-preview" alt="Náhled obrázku" hidden>
      <label><input type="checkbox" id="content-published"> Ihned publikovat na webu</label>
      <div class="actions"><button class="button approve" type="submit">Uložit</button><button class="button button-ghost" id="content-cancel" type="button" hidden>Zrušit úpravu</button></div>
    </form>
    <div class="request-list" id="content-items">
      ${items.length ? items.map(item => `<article class="request-card content-admin-card">
        ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="">` : `<div></div>`}
        <div><h2>${escapeHtml(isNews ? item.title : item.name)}</h2><p>${escapeHtml(item.text)}</p>
        <span class="status-badge ${item.published ? "approved" : ""}">${item.published ? "Publikováno" : "Skryto"}</span>
        <div class="actions"><button class="button button-ghost" data-edit-content="${item.id}">Upravit</button><button class="button reject" data-delete-content="${item.id}">Smazat</button></div></div>
      </article>`).join("") : "<p>Zatím zde nejsou žádné záznamy.</p>"}
    </div>`;
  const byId = Object.fromEntries(items.map(item => [item.id, item]));
  document.querySelector("#content-editor").addEventListener("submit", event => saveContent(event, byId));
  document.querySelector("#content-image").addEventListener("change", previewSelectedImage);
  document.querySelector("#content-cancel").addEventListener("click", resetContentForm);
  document.querySelectorAll("[data-edit-content]").forEach(button =>
    button.addEventListener("click", () => editContent(byId[button.dataset.editContent])));
  document.querySelectorAll("[data-delete-content]").forEach(button =>
    button.addEventListener("click", () => removeContent(button.dataset.deleteContent)));
}

function previewSelectedImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const preview = document.querySelector("#content-preview");
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
}

function editContent(item) {
  const isNews = section === "news";
  document.querySelector("#content-id").value = item.id;
  document.querySelector("#content-title").value = isNews ? item.title : item.name;
  document.querySelector("#content-text").value = item.text || "";
  document.querySelector("#content-published").checked = Boolean(item.published);
  document.querySelector("#editor-title").textContent = `Upravit: ${isNews ? item.title : item.name}`;
  document.querySelector("#content-cancel").hidden = false;
  const preview = document.querySelector("#content-preview");
  if (item.imageUrl) { preview.src = item.imageUrl; preview.hidden = false; }
  document.querySelector("#content-editor").scrollIntoView({ behavior: "smooth" });
}

function resetContentForm() {
  document.querySelector("#content-editor").reset();
  document.querySelector("#content-id").value = "";
  document.querySelector("#editor-title").textContent = section === "news" ? "Nová novinka" : "Nové město";
  document.querySelector("#content-preview").hidden = true;
  document.querySelector("#content-cancel").hidden = true;
}

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function saveContent(event, items) {
  event.preventDefault();
  const button = event.currentTarget.querySelector("[type=submit]");
  button.disabled = true;
  try {
    const id = document.querySelector("#content-id").value;
    const existing = items[id] || {};
    let imageUrl = existing.imageUrl || "";
    const file = document.querySelector("#content-image").files[0];
    if (file) {
      const uploaded = await api("/api/admin/content-upload", {
        method: "POST",
        body: JSON.stringify({ folder: section, dataUrl: await fileAsDataUrl(file) })
      });
      imageUrl = uploaded.imageUrl;
    }
    const title = document.querySelector("#content-title").value.trim();
    const payload = {
      ...(section === "news" ? { title } : { name: title }),
      text: document.querySelector("#content-text").value.trim(),
      imageUrl,
      published: document.querySelector("#content-published").checked
    };
    await api(id ? `/api/admin/content/${section}/${id}` : `/api/admin/content/${section}`, {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(payload)
    });
    notify(`${section === "news" ? "Novinka" : "Město"} bylo uloženo.`);
    load();
  } catch (error) {
    notify(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function removeContent(id) {
  if (!confirm(`Opravdu chceš tento záznam smazat?`)) return;
  try {
    await api(`/api/admin/content/${section}/${id}`, { method: "DELETE" });
    notify(`${section === "news" ? "Novinka" : "Město"} bylo smazáno.`);
    load();
  } catch (error) { notify(error.message, true); }
}

async function decideApplication(button) {
  const rejected = button.dataset.decision === "rejected";
  const reason = rejected ? prompt("Uveď důvod zamítnutí:") : "";
  if (rejected && !reason) return;
  button.disabled = true;
  try {
    await api(`/api/admin/whitelist/applications/${button.dataset.application}`, {
      method: "PATCH", body: JSON.stringify({ decision: button.dataset.decision, reason })
    });
    notify(rejected ? "Žádost byla zamítnuta." : "Žádost byla schválena.");
    load();
  } finally {
    button.disabled = false;
  }
}

async function decideInterview(button) {
  const rejected = button.dataset.decision === "rejected";
  const reason = rejected ? prompt("Uveď důvod zamítnutí pohovoru:") : "";
  if (rejected && !reason) return;
  button.disabled = true;
  try {
    await api(`/api/admin/whitelist/interviews/${button.dataset.interview}`, {
      method: "PATCH", body: JSON.stringify({ decision: button.dataset.decision, reason })
    });
    notify(rejected ? "Pohovor byl zamítnut." : "Pohovor byl schválen a Discord role změněny.");
    load();
  } finally {
    button.disabled = false;
  }
}

function bindActions() {
  list.querySelectorAll("[data-application]").forEach(button =>
    button.addEventListener("click", () => decideApplication(button).catch(error => notify(error.message, true))));
  list.querySelectorAll("[data-interview]").forEach(button =>
    button.addEventListener("click", () => decideInterview(button).catch(error => notify(error.message, true))));
  list.querySelectorAll("[data-claim-application]").forEach(button => button.addEventListener("click", async () => {
    try {
      await api(`/api/admin/whitelist/applications/${button.dataset.claimApplication}/claim`, { method: "POST", body: "{}" });
      notify("Žádost byla převzata."); status = "claimed"; load();
    } catch (error) { notify(error.message, true); }
  }));
  list.querySelectorAll("[data-claim]").forEach(button => button.addEventListener("click", async () => {
    try {
      await api(`/api/admin/whitelist/interviews/${button.dataset.claim}/claim`, { method: "POST", body: "{}" });
      notify("Pohovor byl převzat."); status = "claimed"; load();
    } catch (error) { notify(error.message, true); }
  }));
  list.querySelectorAll("[data-attempt]").forEach(button => button.addEventListener("click", async () => {
    try {
      await api(`/api/admin/whitelist/attempts/${button.dataset.attempt}`, {
        method: "PATCH", body: JSON.stringify({ type: button.dataset.type, amount: 1 })
      });
      notify("Hráči byl přidán jeden pokus.");
    } catch (error) { notify(error.message, true); }
  }));
  list.querySelectorAll("[data-revoke]").forEach(button => button.addEventListener("click", async () => {
    if (!confirm(`Opravdu odebrat plný přístup hráči ${button.dataset.name}? Hráč bude muset znovu projít formulářem i pohovorem.`)) return;
    try {
      await api(`/api/admin/whitelist/access/${button.dataset.revoke}/revoke`, { method: "POST", body: "{}" });
      notify("Přístup byl odebrán, pokusy resetovány a Discord role vráceny.");
      load();
    } catch (error) { notify(error.message, true); }
  }));
}

async function load() {
  renderTabs();
  list.innerHTML = "<p>Načítám úřední záznamy…</p>";
  try {
    if (section === "reputation") { await renderReputation(); return; }
    if (section === "feedback") { await renderFeedback(); return; }
    if (section === "ticket-settings") { await renderTicketSettings(); return; }
    if (section === "atlas") { await window.renderAtlasManager({ api, list, escapeHtml, notify }); return; }
    if (section === "tickets") {
      const data = await api(`/api/admin/tickets?status=${status}`);
      list.innerHTML = data.length ? data.map(ticketCard).join("") : "<p>V této části nejsou žádné tickety.</p>";
      bindTicketActions(); return;
    }
    if (["news", "towns"].includes(section)) {
      const data = await api(`/api/admin/content/${section}`);
      renderContentManager(data);
      return;
    }
    if (section === "characters") {
      const data = await api(`/api/admin/characters?status=${status}`);
      list.innerHTML = data.length ? data.map(characterCard).join("") : "<p>V této části nejsou žádné postavy.</p>";
      bindCharacterActions(data);
      return;
    }
    const path = section === "applications"
      ? `/api/admin/whitelist/applications?status=${status}`
      : section === "interviews"
        ? `/api/admin/whitelist/interviews?status=${status}`
        : "/api/admin/whitelist/access";
    const data = await api(path);
    list.innerHTML = data.length
      ? data.map(section === "applications" ? applicationCard : section === "interviews" ? interviewCard : accessCard).join("")
      : "<p>V této části nejsou žádné záznamy.</p>";
    bindActions();
  } catch (error) {
    list.innerHTML = `<div class="message error">${escapeHtml(error.message)}</div>`;
  }
}

document.querySelectorAll("[data-section]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-section]").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  section = button.dataset.section;
  status = section === "applications" ? "pending" : section === "interviews" || section === "tickets" ? "waiting" : section === "characters" ? "pending" : "active";
  load();
}));

api("/api/auth/me").then(user => {
  if (!user.admin) location.href = "index.html";
  else {
    const privileged = user.roles?.some(id => ["1531972762065829938","1531973545888841870"].includes(id));
    document.querySelectorAll(".owner-only").forEach(button => button.hidden = !privileged);
    if (user.roles?.includes("1531973545888841870")) document.querySelector('[data-section="ticket-settings"]')?.setAttribute("hidden", "");
    load();
  }
}).catch(() => location.href = `${apiBase}/api/auth/discord`);
