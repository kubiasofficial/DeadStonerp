const serverData = {
  status: "Online",
  players: "47 / 128",
  version: "1.0.3",
  restart: "Dnes v 04:00"
};

const news = [
  { date: "24. 07. 1899", title: "Nová verze webu 2.0", text: "Spouštíme novou verzi webu s mnoha vylepšeními.", position: "71% 60%" },
  { date: "21. 07. 1899", title: "Aktualizace pravidel", text: "Byla provedena menší úprava pravidel týkající se roleplaye.", position: "37% 43%" },
  { date: "18. 07. 1899", title: "Nové město – Silver Ridge", text: "Do světa přichází nové město plné příležitostí.", position: "57% 64%" }
];

const towns = [
  { name: "Deadstone", text: "Hlavní město státu Deadstone.", position: "61% 63%" },
  { name: "Silver Ridge", text: "Horské město s bohatou historií.", position: "42% 43%" },
  { name: "Redwater", text: "Průmyslové město na řece.", position: "70% 72%" },
  { name: "Fort Echo", text: "Vojenská pevnost na hranicích.", position: "31% 55%" }
];

const icon = (symbol, label, value, className = "") => `
  <div class="status-item ${className}">
    <span class="status-icon" aria-hidden="true">${symbol}</span>
    <span><small>${label}</small><strong>${value}</strong></span>
  </div>`;

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[character]);

const statusPanel = document.querySelector("#server-status");
if (statusPanel) {
  statusPanel.innerHTML =
    icon("●", "Status serveru", serverData.status, "online") +
    icon("♟", "Hráčů online", serverData.players) +
    icon("⚙", "Verze serveru", serverData.version) +
    icon("◷", "Poslední restart", serverData.restart) +
    `<a class="button button-small status-button" href="#"><span aria-hidden="true">♞</span> Připojit se</a>`;
}

const newsList = document.querySelector("#news-list");
if (newsList) {
  newsList.innerHTML = news.map(item => `
    <article class="list-item">
      <div class="thumb" style="--position:${item.position}"></div>
      <div><time>${item.date}</time><h3>${item.title}</h3><p>${item.text}</p></div>
    </article>`).join("");
}

const townList = document.querySelector("#town-list");
if (townList) {
  townList.innerHTML = towns.map(item => `
    <article class="list-item town">
      <div class="thumb" style="--position:${item.position}"></div>
      <div><h3>${item.name}</h3><p>${item.text}</p></div>
    </article>`).join("");
}

async function loadLiveData() {
  const apiBase = window.DEADSTONE_CONFIG?.apiBase?.replace(/\/$/, "");
  if (!apiBase) return;
  try {
    const [siteResponse, newsResponse, townsResponse] = await Promise.all([
      fetch(`${apiBase}/api/site`),
      fetch(`${apiBase}/api/news?limit=3`),
      fetch(`${apiBase}/api/towns?limit=4`)
    ]);
    if (!siteResponse.ok || !newsResponse.ok || !townsResponse.ok) {
      throw new Error("API není dostupné.");
    }
    const [{ data: site }, { data: liveNews }, { data: liveTowns }] = await Promise.all([
      siteResponse.json(),
      newsResponse.json(),
      townsResponse.json()
    ]);

    if (site && statusPanel) {
      const online = site.status === "online";
      const statusLabel = online ? "Online" : site.status === "maintenance" ? "Údržba" : "Offline";
      statusPanel.innerHTML =
        icon("●", "Status serveru", statusLabel, online ? "online" : "") +
        icon("♟", "Hráčů online", `${site.playersOnline ?? 0} / ${site.playersMax ?? 128}`) +
        icon("⚙", "Verze serveru", site.version || serverData.version) +
        icon("◷", "Poslední restart", site.lastRestart || serverData.restart) +
        `<a class="button button-small status-button" href="${site.connectUrl || "#"}"><span aria-hidden="true">♞</span> Připojit se</a>`;
    }

    if (liveNews?.length && newsList) {
      newsList.innerHTML = liveNews.map((item, index) => `
        <article class="list-item">
          <div class="thumb" style="--position:${news[index % news.length].position}"></div>
          <div><time>${item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("cs-CZ") : ""}</time><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></div>
        </article>`).join("");
    }

    if (liveTowns?.length && townList) {
      townList.innerHTML = liveTowns.map((item, index) => `
        <article class="list-item town">
          <div class="thumb" style="--position:${towns[index % towns.length].position}"></div>
          <div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.text)}</p></div>
        </article>`).join("");
    }
    document.documentElement.dataset.live = "true";
  } catch (error) {
    console.info("Deadstone API není dostupné, používám lokální obsah.", error.message);
  }
}

loadLiveData();

async function loadDiscordSession() {
  const apiBase = window.DEADSTONE_CONFIG?.apiBase?.replace(/\/$/, "");
  if (!apiBase) return;
  document.querySelectorAll(".discord-login").forEach(link => {
    link.href = `${apiBase}/auth/discord`;
  });
  try {
    const response = await fetch(`${apiBase}/api/auth/me`, { credentials: "include" });
    if (!response.ok) return;
    const { user } = await response.json();
    const profile = document.querySelector(".discord-profile");
    const whitelist = document.querySelector(".whitelist-link");
    if (!profile || !user) return;
    document.querySelector(".nav-join")?.setAttribute("hidden", "");
    profile.hidden = false;
    profile.querySelector("img").src = user.avatar;
    profile.querySelector("img").alt = `Profilový obrázek ${user.username}`;
    profile.querySelector("span").textContent = user.username;
    profile.querySelector("small").hidden = !user.owner;
    if (whitelist) whitelist.hidden = false;
    document.documentElement.dataset.authenticated = "true";
    if (user.owner) document.documentElement.dataset.owner = "true";
  } catch (error) {
    console.info("Discord relaci se nepodařilo načíst.", error.message);
  }
}

loadDiscordSession();

const toggle = document.querySelector(".menu-toggle");
const menu = document.querySelector(".nav-menu");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  menu.classList.toggle("open", !open);
  document.body.classList.toggle("menu-open", !open);
});
menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  toggle.setAttribute("aria-expanded", "false");
  menu.classList.remove("open");
  document.body.classList.remove("menu-open");
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
