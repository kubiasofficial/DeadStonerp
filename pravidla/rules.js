const chapters = window.RULE_CHAPTERS;
const currentSlug = document.body.dataset.chapter || "";
const currentIndex = chapters.findIndex(chapter => chapter.slug === currentSlug);

const chapterHref = chapter => `${chapter.slug}.html`;
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);

function navigation() {
  return `
    <a class="rules-brand" href="../index.html"><img src="../obrazky/logo-transparent.png" alt="Deadstone Roleplay"></a>
    <div class="rules-search"><label for="rules-search">Hledat v pravidlech</label><input id="rules-search" type="search" placeholder="např. metagaming…" autocomplete="off"><div id="search-results"></div></div>
    <a class="rules-home ${currentSlug ? "" : "active"}" href="index.html">Přehled pravidel</a>
    <nav aria-label="Kapitoly pravidel">${chapters.map((chapter, index) => `<a class="${chapter.slug === currentSlug ? "active" : ""}" href="${chapterHref(chapter)}"><span>${String(index + 1).padStart(2, "0")}</span>${chapter.title}</a>`).join("")}</nav>
    <p class="rules-version">Verze 1.0 · účinná od 29. 7. 2026</p>`;
}

function ruleSection(section, index, prefix = "") {
  return `
    <details class="rule-section" id="${prefix}pravidlo-${index + 1}" open data-search="${escapeHtml(`${section.name} ${section.definition}`.toLocaleLowerCase("cs"))}">
      <summary><span>${String(index + 1).padStart(2, "0")}</span><h2>${section.name}</h2><i aria-hidden="true"></i></summary>
      <div class="rule-body">
        <div class="definition"><b>Definice</b><p>${section.definition}</p></div>
        <section><h3>Detailní vysvětlení</h3><p>${section.detail}</p></section>
        <aside class="info-box"><b>Proč pravidlo existuje</b><p>${section.why}</p></aside>
        <div class="examples">
          <section class="example good"><b>Správný příklad</b><p>${section.correct}</p></section>
          <section class="example bad"><b>Špatný příklad</b><p>${section.wrong}</p></section>
        </div>
        <aside class="note-box"><b>Poznámka a výjimky</b><p>${section.notes}</p></aside>
      </div>
    </details>`;
}

function renderChapter() {
  const chapter = chapters[currentIndex];
  document.title = `${chapter.title} | Pravidla Deadstone`;
  const prev = chapters[currentIndex - 1];
  const next = chapters[currentIndex + 1];
  document.querySelector("#rules-content").innerHTML = `
    <div class="breadcrumb"><a href="../index.html">Deadstone</a><span>›</span><a href="index.html">Pravidla</a><span>›</span><strong>${chapter.title}</strong></div>
    <header class="chapter-header"><span>Kapitola ${String(currentIndex + 1).padStart(2, "0")}</span><h1>${chapter.title}</h1><p>${chapter.summary}</p></header>
    <aside class="warning-box"><b>Důležité</b><p>Pravidla se posuzují podle jejich smyslu a celého kontextu scény. Neznalost pravidel nezbavuje hráče odpovědnosti.</p></aside>
    <nav class="chapter-toc" aria-label="Obsah kapitoly"><h2>Obsah kapitoly</h2>${chapter.sections.map((section, index) => `<a href="#pravidlo-${index + 1}"><span>${String(index + 1).padStart(2, "0")}</span>${section.name}</a>`).join("")}</nav>
    <div class="rules-toolbar"><button id="expand-all">Rozbalit vše</button><button id="collapse-all">Sbalit vše</button></div>
    <div class="rule-list">${chapter.sections.map(ruleSection).join("")}</div>
    <nav class="chapter-pagination">${prev ? `<a href="${chapterHref(prev)}"><small>← Předchozí</small><strong>${prev.title}</strong></a>` : `<a href="index.html"><small>← Předchozí</small><strong>Přehled pravidel</strong></a>`}${next ? `<a href="${chapterHref(next)}"><small>Další →</small><strong>${next.title}</strong></a>` : `<a href="index.html"><small>Další →</small><strong>Přehled pravidel</strong></a>`}</nav>`;

  document.querySelector("#expand-all").addEventListener("click", () => document.querySelectorAll(".rule-section").forEach(item => item.open = true));
  document.querySelector("#collapse-all").addEventListener("click", () => document.querySelectorAll(".rule-section").forEach(item => item.open = false));
}

function renderIndex() {
  document.body.classList.add("rules-overview");
  document.querySelector("#rules-content").innerHTML = `
    <div class="breadcrumb"><a href="../index.html">Deadstone</a><span>›</span><strong>Pravidla</strong></div>
    <header class="rules-index-hero"><p>Oficiální dokument</p><h1>Pravidla serveru</h1><strong>Deadstone Roleplay</strong><span>Platná verze · 2026</span></header>
    <aside class="warning-box"><b>Než vstoupíte do Deadstone</b><p>Vstupem na server potvrzujete, že jste pravidla přečetli, rozumíte jim a přijímáte odpovědnost za své jednání. Začněte úvodem a pokračujte v uvedeném pořadí.</p></aside>
    <section class="rules-control-panel">
      <label for="overview-search">Vyhledat v pravidlech</label>
      <input id="overview-search" type="search" placeholder="Např. metagaming, zranění, CK…" autocomplete="off">
      <p>Začněte psát a dokument automaticky zobrazí pouze odpovídající pravidla.</p>
      <div><span>Poslední aktualizace: <strong>29. 7. 2026</strong></span><button id="overview-expand">Rozbalit vše</button><button id="overview-collapse">Sbalit vše</button></div>
    </section>
    <p class="search-empty" id="search-empty">Pro zadaný výraz nebylo nalezeno žádné pravidlo.</p>
    <section class="all-rules">${chapters.map((chapter, chapterIndex) => `
      <details class="overview-chapter" open data-chapter-search="${escapeHtml(`${chapter.title} ${chapter.summary}`.toLocaleLowerCase("cs"))}">
        <summary><span>${String(chapterIndex + 1).padStart(2, "0")}</span><div><h2>${chapter.title}</h2><p>${chapter.summary}</p></div><i></i></summary>
        <div class="overview-chapter-body">
          <a class="standalone-link" href="${chapterHref(chapter)}">Otevřít kapitolu samostatně →</a>
          ${chapter.sections.map((section, index) => ruleSection(section, index, `${chapter.slug}-`)).join("")}
        </div>
      </details>`).join("")}</section>`;

  const overviewChapters = [...document.querySelectorAll(".overview-chapter")];
  const overviewSearch = document.querySelector("#overview-search");
  const empty = document.querySelector("#search-empty");
  const filterOverview = () => {
    const query = overviewSearch.value.trim().toLocaleLowerCase("cs");
    let visibleCount = 0;
    overviewChapters.forEach(chapter => {
      const chapterMatch = chapter.dataset.chapterSearch.includes(query);
      let sectionCount = 0;
      chapter.querySelectorAll(".rule-section").forEach(section => {
        const match = !query || chapterMatch || section.dataset.search.includes(query);
        section.hidden = !match;
        if (match) sectionCount++;
      });
      chapter.hidden = sectionCount === 0;
      if (sectionCount) {
        visibleCount += sectionCount;
        if (query) chapter.open = true;
      }
    });
    empty.classList.toggle("visible", visibleCount === 0);
  };
  overviewSearch.addEventListener("input", filterOverview);
  document.querySelector("#overview-expand").addEventListener("click", () => document.querySelectorAll(".overview-chapter,.rule-section").forEach(item => item.open = true));
  document.querySelector("#overview-collapse").addEventListener("click", () => document.querySelectorAll(".overview-chapter,.rule-section").forEach(item => item.open = false));
}

document.querySelector("#rules-sidebar").innerHTML = navigation();
if (currentIndex >= 0) renderChapter(); else renderIndex();

const sidebar = document.querySelector("#rules-sidebar");
const sidebarToggle = document.querySelector("#sidebar-toggle");
sidebarToggle.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  sidebarToggle.setAttribute("aria-expanded", String(open));
});

const search = document.querySelector("#rules-search");
const results = document.querySelector("#search-results");
const searchable = chapters.flatMap(chapter => chapter.sections.map(section => ({ chapter, section })));
search.addEventListener("input", () => {
  const query = search.value.trim().toLocaleLowerCase("cs");
  if (query.length < 2) { results.innerHTML = ""; results.classList.remove("open"); return; }
  const found = searchable.filter(item => `${item.section.name} ${item.section.definition}`.toLocaleLowerCase("cs").includes(query)).slice(0, 8);
  results.innerHTML = found.length ? found.map(item => {
    const index = item.chapter.sections.indexOf(item.section) + 1;
    return `<a href="${chapterHref(item.chapter)}#pravidlo-${index}"><b>${escapeHtml(item.section.name)}</b><small>${item.chapter.title}</small></a>`;
  }).join("") : `<p>Nenalezeno. Zkuste jiný výraz.</p>`;
  results.classList.add("open");
});
document.addEventListener("click", event => {
  if (!event.target.closest(".rules-search")) results.classList.remove("open");
});
