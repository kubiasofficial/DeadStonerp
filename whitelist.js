const apiBase = window.DEADSTONE_CONFIG?.apiBase?.replace(/\/$/, "") || location.origin;
const content = document.querySelector("#wl-content");
const message = document.querySelector("#wl-message");

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[character]);

function showMessage(text, error = false) {
  message.textContent = text;
  message.className = `message${error ? " error" : ""}`;
  message.hidden = false;
  scrollTo({ top: 0, behavior: "smooth" });
}

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const body = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new Error(body.error || "Požadavek se nepodařil.");
  return body.data;
}

function attempts(element, remaining) {
  element.innerHTML = [1, 2, 3].map((number, index) =>
    `<span class="attempt ${index >= remaining ? "used" : ""}">${number}</span>`).join("");
}

const labels = {
  pending: "Čeká na vyhodnocení", approved: "Schváleno", rejected: "Zamítnuto",
  waiting: "Čeká na převzetí", claimed: "Převzato administrátorem", expired: "Žádost vypršela"
};

function renderForm(data) {
  content.innerHTML = `
    <h2>Žádost o vstup do státu</h2>
    <p>Odpovídej vlastními slovy. Administrátor posuzuje znalost pravidel i schopnost vysvětlit své rozhodnutí.</p>
    <form class="portal-form" id="application-form">
      <div class="field"><label for="discovery">Jak ses o nás dozvěděl?</label><textarea id="discovery" required></textarea></div>
      <div class="field"><label for="roleplayPlan">Co bys chtěl RPit?</label><textarea id="roleplayPlan" required></textarea></div>
      <div class="field"><label for="serverYear">V jakém roce se odehrává náš server?</label><input id="serverYear" required></div>
      <h2>Otázky z pravidel</h2>
      ${data.questions.map((item, index) => `
        <article class="question-card">
          <h3>${index + 1}. ${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.question)}</p>
          <div class="field"><textarea data-rule-id="${escapeHtml(item.id)}" data-question="${escapeHtml(item.question)}" minlength="20" required></textarea></div>
        </article>`).join("")}
      <button class="button" type="submit">Odeslat žádost</button>
    </form>`;
  document.querySelector("#application-form").addEventListener("submit", submitForm);
}

async function submitForm(event) {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  try {
    const ruleAnswers = [...event.currentTarget.querySelectorAll("[data-rule-id]")].map(field => ({
      id: field.dataset.ruleId, question: field.dataset.question, answer: field.value
    }));
    await api("/api/whitelist/applications", {
      method: "POST",
      body: JSON.stringify({
        discovery: document.querySelector("#discovery").value,
        roleplayPlan: document.querySelector("#roleplayPlan").value,
        serverYear: document.querySelector("#serverYear").value,
        ruleAnswers
      })
    });
    showMessage("Žádost byla úspěšně odeslána a čeká na vyhodnocení.");
    await load();
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function requestInterview() {
  try {
    await api("/api/whitelist/interviews", { method: "POST", body: "{}" });
    showMessage("Úspěšně sis požádal o pohovor. Dostav se do čekárny na Discordu!");
    await load();
  } catch (error) {
    showMessage(error.message, true);
  }
}

function renderContent(data) {
  const latest = data.latestApplication;
  const activeInterview = data.interviews.find(item => ["waiting", "claimed"].includes(item.status));
  if (data.profile.completed) {
    content.innerHTML = `<h2>Vstupní list je platný</h2><p>Whitelist je dokončen. Vítej ve státě Deadstone.</p><span class="status-badge approved">Schváleno</span>`;
  } else if (activeInterview) {
    const expired = activeInterview.status === "waiting" &&
      Date.now() - new Date(activeInterview.requestedAt).getTime() >= 60 * 60 * 1000;
    content.innerHTML = `<h2>Pohovor</h2><p>${expired ? "Na žádost déle než hodinu nikdo nereagoval. Můžeš ji poslat znovu bez ztráty pokusu." : "Žádost o pohovor byla zaznamenána. Dostav se do čekárny na Discordu."}</p>
      <span class="status-badge">${escapeHtml(labels[activeInterview.status])}</span>
      ${expired ? `<div class="actions"><button class="button" id="request-interview">Požádat znovu · pokus ${activeInterview.attempt}/3</button></div>` : ""}`;
  } else if (latest?.status === "approved") {
    content.innerHTML = `<h2>Formulář schválen</h2><p>Nyní můžeš požádat o pohovor s administrátorem.</p>
      <button class="button" id="request-interview">Požádat o pohovor</button>`;
  } else if (["pending", "claimed"].includes(latest?.status)) {
    content.innerHTML = `<h2>${latest.status === "claimed" ? "Žádost převzal administrátor" : "Žádost čeká na vyhodnocení"}</h2><p>Administrace nyní kontroluje tvé odpovědi. Výsledek se zde objeví automaticky.</p>`;
  } else if (latest?.status === "rejected" && data.nextFormAt && Date.now() < new Date(data.nextFormAt).getTime()) {
    content.innerHTML = `<h2>Žádost byla zamítnuta</h2><div class="reason">${escapeHtml(latest.reason || "Důvod nebyl uveden.")}</div>
      <p>Další žádost lze podat: <strong>${new Date(data.nextFormAt).toLocaleString("cs-CZ")}</strong></p>`;
  } else if ((data.profile.formAttemptsRemaining ?? 3) <= 0) {
    content.innerHTML = `<h2>Pokusy byly vyčerpány</h2><p>Pro další postup kontaktuj administraci.</p>`;
  } else {
    renderForm(data);
  }
  document.querySelector("#request-interview")?.addEventListener("click", requestInterview);
}

async function load() {
  try {
    const data = await api("/api/whitelist/me");
    attempts(document.querySelector("#form-attempts"), data.profile.formAttemptsRemaining ?? 3);
    attempts(document.querySelector("#interview-attempts"), data.profile.interviewAttemptsRemaining ?? 3);
    const latest = data.latestApplication;
    document.querySelector("#wl-status").innerHTML = latest
      ? `<span class="status-badge ${latest.status}">${escapeHtml(labels[latest.status] || latest.status)}</span>${latest.reason ? `<p class="reason">${escapeHtml(latest.reason)}</p>` : ""}`
      : `<span class="status-badge">Bez žádosti</span>`;
    document.querySelector("#wl-history").innerHTML = data.applications.map(item =>
      `<div class="history-item">Pokus ${item.attempt}/3 · ${escapeHtml(labels[item.status] || item.status)}</div>`).join("");
    renderContent(data);
  } catch (error) {
    if (/přihlaste/i.test(error.message)) {
      location.href = `${apiBase}/api/auth/discord`;
      return;
    }
    showMessage(error.message, true);
    content.innerHTML = `<h2>Úřad není dostupný</h2><p>Zkus stránku načíst znovu.</p>`;
  }
}

load();
