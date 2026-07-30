const apiBase = window.DEADSTONE_CONFIG?.apiBase?.replace(/\/$/, "") || location.origin;
const list = document.querySelector("#citizen-list");
const detail = document.querySelector("#citizen-detail");
const dialog = document.querySelector("#character-dialog");
const message = document.querySelector("#character-message");
let approved = [];
let mine = [];

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[character]);

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Požadavek se nepodařil.");
  return body.data;
}

function notify(text, error = false) {
  message.textContent = text;
  message.className = `message${error ? " error" : ""}`;
  message.hidden = false;
}

function selectCharacter(id) {
  const item = approved.find(character => character.id === id);
  if (!item) return;
  document.querySelectorAll(".citizen-entry").forEach(button =>
    button.classList.toggle("active", button.dataset.id === id));
  const own = mine.some(character => character.id === id);
  detail.innerHTML = `
    <p class="eyebrow">Občan státu Deadstone</p>
    <h2>${escapeHtml(item.name)}</h2>
    <div class="citizen-facts"><span>Rok narození<strong>${item.birthYear}</strong></span><span>Původ<strong>${escapeHtml(item.origin)}</strong></span></div>
    <div class="citizen-lore">${escapeHtml(item.lore)}</div>
    ${own ? `<div class="actions"><button class="button button-ghost" id="edit-selected">Upravit mou postavu</button></div>` : ""}`;
  document.querySelector("#edit-selected")?.addEventListener("click", () => openForm(id));
}

function render() {
  list.innerHTML = approved.length
    ? approved.map(item => `<button class="citizen-entry" data-id="${item.id}">${escapeHtml(item.name)}</button>`).join("")
    : "<p>Zatím nebyla schválena žádná postava.</p>";
  list.querySelectorAll("button").forEach(button =>
    button.addEventListener("click", () => selectCharacter(button.dataset.id)));
  const choice = document.querySelector("#character-choice");
  choice.innerHTML = `<option value="">＋ Nová postava</option>${mine.map(item =>
    `<option value="${item.id}">${escapeHtml(item.name)} · ${item.status === "approved" ? "schválená" : item.status === "rejected" ? "zamítnutá" : "čekající"}</option>`).join("")}`;
  if (approved[0]) selectCharacter(approved[0].id);
}

function fillForm(id = "") {
  const item = mine.find(character => character.id === id);
  document.querySelector("#character-choice").value = id;
  document.querySelector("#character-name").value = item?.name || "";
  document.querySelector("#character-year").value = item?.birthYear || "";
  document.querySelector("#character-origin").value = item?.origin || "";
  document.querySelector("#character-lore").value = item?.lore || "";
}

function openForm(id = "") {
  fillForm(id);
  dialog.showModal();
}

async function load() {
  try {
    [approved, mine] = await Promise.all([api("/api/characters"), api("/api/characters/mine")]);
    render();
  } catch (error) {
    if (/přihlaste/i.test(error.message)) return location.href = `${apiBase}/api/auth/discord`;
    notify(error.message, true);
  }
}

document.querySelector("#open-character-form").addEventListener("click", () => openForm());
document.querySelector("#character-choice").addEventListener("change", event => fillForm(event.target.value));
document.querySelector("#character-form").addEventListener("submit", async event => {
  event.preventDefault();
  const id = document.querySelector("#character-choice").value;
  const button = event.currentTarget.querySelector("[type=submit]");
  button.disabled = true;
  try {
    await api(id ? `/api/characters/${id}` : "/api/characters", {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify({
        name: document.querySelector("#character-name").value,
        birthYear: Number(document.querySelector("#character-year").value),
        origin: document.querySelector("#character-origin").value,
        lore: document.querySelector("#character-lore").value
      })
    });
    dialog.close();
    notify(id ? "Úpravy postavy byly uloženy." : "Postava byla odeslána administraci ke schválení.");
    await load();
  } catch (error) {
    notify(error.message, true);
  } finally {
    button.disabled = false;
  }
});

load();
