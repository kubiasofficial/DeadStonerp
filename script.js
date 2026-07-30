const fallbackPositions = ["61% 63%", "42% 43%", "70% 72%", "31% 55%"];

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[character]);

const statusPanel = document.querySelector("#server-status");
if (statusPanel) {
  statusPanel.innerHTML = `<div class="development-message"><span class="typewriter-text" aria-label="Server je stále ve vývoji, ale už teď se na tebe těšíme."></span><i aria-hidden="true"></i></div>`;
}

const newsList = document.querySelector("#news-list");
if (newsList) {
  newsList.innerHTML = `<p class="empty-content">Zatím nebyly vydány žádné novinky.</p>`;
}

const townList = document.querySelector("#town-list");
if (townList) {
  townList.innerHTML = `<p class="empty-content">Městské kroniky jsou zatím prázdné.</p>`;
}

async function loadLiveData() {
  const apiBase = window.DEADSTONE_CONFIG?.apiBase?.replace(/\/$/, "");
  if (!apiBase) return;
  try {
    const [newsResponse, townsResponse] = await Promise.all([
      fetch(`${apiBase}/api/news?limit=3`),
      fetch(`${apiBase}/api/towns?limit=4`)
    ]);
    if (!newsResponse.ok || !townsResponse.ok) {
      throw new Error("API není dostupné.");
    }
    const [{ data: liveNews }, { data: liveTowns }] = await Promise.all([
      newsResponse.json(),
      townsResponse.json()
    ]);

    if (liveNews?.length && newsList) {
      newsList.innerHTML = liveNews.map((item, index) => `
        <article class="list-item">
          <div class="thumb" style="--position:${fallbackPositions[index % fallbackPositions.length]};background-image:linear-gradient(rgba(68,42,18,.05),rgba(10,8,6,.25)),url('${escapeHtml(item.imageUrl || "obrazky/hero-deadstone.webp")}')"></div>
          <div><time>${item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("cs-CZ") : ""}</time><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></div>
        </article>`).join("");
    }

    if (liveTowns?.length && townList) {
      townList.innerHTML = liveTowns.map((item, index) => `
        <article class="list-item town">
          <div class="thumb" style="--position:${fallbackPositions[index % fallbackPositions.length]};background-image:linear-gradient(rgba(68,42,18,.05),rgba(10,8,6,.25)),url('${escapeHtml(item.imageUrl || "obrazky/hero-deadstone.webp")}')"></div>
          <div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.text)}</p></div>
        </article>`).join("");
    }
    document.documentElement.dataset.live = "true";
  } catch (error) {
    console.info("Deadstone API není dostupné, používám lokální obsah.", error.message);
  }
}

loadLiveData();

function startTypewriter() {
  const target = document.querySelector(".typewriter-text");
  if (!target) return;
  const text = target.getAttribute("aria-label");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    target.textContent = text;
    return;
  }
  let index = 0;
  const write = () => {
    target.textContent = text.slice(0, index++);
    if (index <= text.length) setTimeout(write, 55 + Math.random() * 45);
    else setTimeout(() => {
      target.textContent = "";
      index = 0;
      setTimeout(write, 500);
    }, 4200);
  };
  write();
}

startTypewriter();

async function loadDiscordSession() {
  const apiBase = window.DEADSTONE_CONFIG?.apiBase?.replace(/\/$/, "");
  if (!apiBase) return;
  document.querySelectorAll(".discord-login").forEach(link => {
    link.href = `${apiBase}/api/auth/discord`;
  });
  try {
    const response = await fetch(`${apiBase}/api/auth/me`, { credentials: "include" });
    if (!response.ok) return;
    const { user } = await response.json();
    const profile = document.querySelector(".discord-profile");
    const whitelist = document.querySelector(".whitelist-link");
    const adminLink = document.querySelector(".admin-link");
    if (!profile || !user) return;
    document.querySelectorAll(".discord-login").forEach(link => {
      link.setAttribute("hidden", "");
    });
    profile.hidden = false;
    profile.querySelector("img").src = user.avatar;
    profile.querySelector("img").alt = `Profilový obrázek ${user.username}`;
    profile.querySelector("span").textContent = user.username;
    profile.querySelector("small").hidden = !user.admin;
    profile.querySelector("small").textContent = user.admin ? "Admin" : "";
    if (whitelist) whitelist.hidden = false;
    if (adminLink) adminLink.hidden = !user.admin;
    document.documentElement.dataset.authenticated = "true";
    if (user.admin) document.documentElement.dataset.admin = "true";
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
