const chapters = window.RULE_CHAPTERS;
const currentSlug = document.body.dataset.chapter || "";
const currentIndex = chapters.findIndex(chapter => chapter.slug === currentSlug);
const chapterHref = chapter => `${chapter.slug}.html`;
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[char]);
const plainText = html => String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function navigation() {
  return `
    <a class="rules-brand" href="../index.html"><img src="../obrazky/logo-transparent.png" alt="Deadstone Roleplay"></a>
    <div class="rules-search"><label for="rules-search">Hledat v pravidlech</label><input id="rules-search" type="search" placeholder="např. mikrofon…" autocomplete="off"><div id="search-results"></div></div>
    <a class="rules-home ${currentSlug ? "" : "active"}" href="index.html">Přehled pravidel</a>
    <nav aria-label="Kapitoly pravidel">${chapters.map((chapter, index) => `<a class="${chapter.slug === currentSlug ? "active" : ""}" href="${chapterHref(chapter)}"><span>${String(index + 1).padStart(2, "0")}</span>${chapter.title}</a>`).join("")}</nav>
    <p class="rules-version">Nová verze · rozpracováno</p>`;
}

function ruleSection(section, index, prefix = "") {
  const searchText = `${section.name} ${plainText(section.body)}`.toLocaleLowerCase("cs");
  return `<details class="rule-section ${section.pledge ? "player-pledge" : ""}" id="${prefix}pravidlo-${index + 1}" open data-search="${escapeHtml(searchText)}">
    <summary><span>${String(index + 1).padStart(2, "0")}</span><h2>${escapeHtml(section.name)}</h2><i aria-hidden="true"></i></summary>
    <div class="rule-body prose">${section.body}</div></details>`;
}

function renderChapter() {
  const chapter = chapters[currentIndex], prev = chapters[currentIndex - 1], next = chapters[currentIndex + 1];
  document.title = `${chapter.title} | Pravidla Deadstone`;
  document.querySelector("#rules-content").innerHTML = `
    <div class="breadcrumb"><a href="../index.html">Deadstone</a><span>›</span><a href="index.html">Pravidla</a><span>›</span><strong>${chapter.title}</strong></div>
    <header class="chapter-header"><span>Kapitola ${String(currentIndex + 1).padStart(2, "0")}</span><h1>${chapter.title}</h1><p>${chapter.summary}</p></header>
    <nav class="chapter-toc"><h2>Obsah kapitoly</h2>${chapter.sections.map((section, index) => `<a href="#pravidlo-${index + 1}"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(section.name)}</a>`).join("")}</nav>
    <div class="rules-toolbar"><button id="expand-all">Rozbalit vše</button><button id="collapse-all">Sbalit vše</button></div>
    <div class="rule-list">${chapter.sections.map(ruleSection).join("")}</div>
    <nav class="chapter-pagination">${prev ? `<a href="${chapterHref(prev)}"><small>← Předchozí</small><strong>${prev.title}</strong></a>` : `<a href="index.html"><small>← Předchozí</small><strong>Přehled pravidel</strong></a>`}${next ? `<a href="${chapterHref(next)}"><small>Další →</small><strong>${next.title}</strong></a>` : `<a href="index.html"><small>Další →</small><strong>Přehled pravidel</strong></a>`}</nav>`;
  document.querySelector("#expand-all").onclick = () => document.querySelectorAll(".rule-section").forEach(item => item.open = true);
  document.querySelector("#collapse-all").onclick = () => document.querySelectorAll(".rule-section").forEach(item => item.open = false);
}

function renderIndex() {
  document.body.classList.add("rules-overview");
  document.querySelector("#rules-content").innerHTML = `
    <div class="breadcrumb"><a href="../index.html">Deadstone</a><span>›</span><strong>Pravidla</strong></div>
    <header class="rules-index-hero"><p>Oficiální dokument</p><h1>Pravidla serveru</h1><strong>Deadstone Roleplay</strong><span>Nově sepisovaná verze</span></header>
    <aside class="warning-box"><b>Než vstoupíš do Deadstone</b><p>Pravidla právě sepisujeme od začátku. Zveřejněné kapitoly jsou součástí připravovaného závazného dokumentu.</p></aside>
    <section class="rules-control-panel"><label for="overview-search">Vyhledat v pravidlech</label><input id="overview-search" type="search" placeholder="Např. respekt, mikrofon, chyby…" autocomplete="off"><div><button id="overview-expand">Rozbalit vše</button><button id="overview-collapse">Sbalit vše</button></div></section>
    <p class="search-empty" id="search-empty">Pro zadaný výraz nebylo nalezeno žádné pravidlo.</p>
    <section class="all-rules">${chapters.map((chapter, chapterIndex) => `<details class="overview-chapter" open data-chapter-search="${escapeHtml(`${chapter.title} ${chapter.summary}`.toLocaleLowerCase("cs"))}">
      <summary><span>${String(chapterIndex + 1).padStart(2, "0")}</span><div><h2>${chapter.title}</h2><p>${chapter.summary}</p></div><i></i></summary>
      <div class="overview-chapter-body"><a class="standalone-link" href="${chapterHref(chapter)}">Otevřít kapitolu samostatně →</a>${chapter.sections.map((section, index) => ruleSection(section, index, `${chapter.slug}-`)).join("")}</div>
    </details>`).join("")}</section>`;
  const groups = [...document.querySelectorAll(".overview-chapter")], input = document.querySelector("#overview-search");
  input.oninput = () => {
    const query = input.value.trim().toLocaleLowerCase("cs"); let count = 0;
    groups.forEach(group => { let visible = 0; group.querySelectorAll(".rule-section").forEach(section => {
      const match = !query || group.dataset.chapterSearch.includes(query) || section.dataset.search.includes(query);
      section.hidden = !match; if (match) visible++;
    }); group.hidden = visible === 0; count += visible; if (query && visible) group.open = true; });
    document.querySelector("#search-empty").classList.toggle("visible", count === 0);
  };
  document.querySelector("#overview-expand").onclick = () => document.querySelectorAll(".overview-chapter,.rule-section").forEach(item => item.open = true);
  document.querySelector("#overview-collapse").onclick = () => document.querySelectorAll(".overview-chapter,.rule-section").forEach(item => item.open = false);
}

document.querySelector("#rules-sidebar").innerHTML = navigation();
if (currentIndex >= 0) renderChapter(); else renderIndex();
const sidebar = document.querySelector("#rules-sidebar");
document.querySelector("#sidebar-toggle").onclick = event => {
  const open = sidebar.classList.toggle("open"); event.currentTarget.setAttribute("aria-expanded", String(open));
};
const search = document.querySelector("#rules-search"), results = document.querySelector("#search-results");
const searchable = chapters.flatMap(chapter => chapter.sections.map(section => ({ chapter, section })));
search.oninput = () => {
  const query = search.value.trim().toLocaleLowerCase("cs");
  if (query.length < 2) { results.innerHTML = ""; results.classList.remove("open"); return; }
  const found = searchable.filter(item => `${item.section.name} ${plainText(item.section.body)}`.toLocaleLowerCase("cs").includes(query)).slice(0, 8);
  results.innerHTML = found.length ? found.map(item => `<a href="${chapterHref(item.chapter)}#pravidlo-${item.chapter.sections.indexOf(item.section) + 1}"><b>${escapeHtml(item.section.name)}</b><small>${item.chapter.title}</small></a>`).join("") : "<p>Nenalezeno. Zkus jiný výraz.</p>";
  results.classList.add("open");
};
document.addEventListener("click", event => { if (!event.target.closest(".rules-search")) results.classList.remove("open"); });
