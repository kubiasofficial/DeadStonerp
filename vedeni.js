const apiBase = window.DEADSTONE_CONFIG?.apiBase?.replace(/\/$/, "") || location.origin;
const tree = document.querySelector("#leadership-tree");
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[character]);

async function loadLeadership() {
  try {
    const response = await fetch(`${apiBase}/api/leadership`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Vedení se nepodařilo načíst.");
    tree.innerHTML = body.data.length ? body.data.map(role => `
      <article class="leadership-role" style="--role-color:${escapeHtml(role.color)}">
        <header class="role-heading"><h2>${escapeHtml(role.name)}</h2><span>${role.members.length} ${role.members.length === 1 ? "člen" : role.members.length > 1 && role.members.length < 5 ? "členové" : "členů"}</span></header>
        ${role.members.length ? `<div class="leadership-members">${role.members.map(member => `
          <div class="leader-card"><img src="${escapeHtml(member.avatar)}" alt=""><div><strong>${escapeHtml(member.displayName)}</strong><small>@${escapeHtml(member.username)}</small></div></div>`).join("")}</div>`
          : `<p class="empty-role">Tato pozice momentálně není obsazena.</p>`}
      </article>`).join("") : `<div class="leadership-error">Na Discordu nebyly nalezeny role vedení.</div>`;
  } catch (error) {
    tree.innerHTML = `<div class="leadership-error">${escapeHtml(error.message)}</div>`;
  }
}

const toggle = document.querySelector(".menu-toggle");
const menu = document.querySelector(".nav-menu");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  menu.classList.toggle("open", !open);
});

loadLeadership();
