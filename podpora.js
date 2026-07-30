const apiBase = window.DEADSTONE_CONFIG?.apiBase?.replace(/\/$/, "") || location.origin;
const grid = document.querySelector("#category-grid");
const dialog = document.querySelector("#ticket-dialog");
const message = document.querySelector("#support-message");
let factionMembers = [];

const categories = [
  ["bug","🐞","Bug Report","Nahlášení technické chyby serveru nebo webu."],
  ["player_report","⚖","Nahlášení hráče","Nahlášení porušení pravidel."],
  ["ck","☠","CK Tickety","Všechny druhy CK se vyřizují zde."],
  ["general","✦","Obecná pomoc","Dotazy týkající se serveru nebo herních systémů."],
  ["partnership","🤝","Partnerství","Spolupráce, média a komunitní projekty."],
  ["leadership","★","Kontakt s vedením","Záležitosti určené přímo vedení serveru."],
  ["faction","♜","Žádost o frakci","Ranče, podniky a nové skupiny ve státě."],
  ["other","✉","Ostatní","Nenašel jsi správnou kategorii? Napiš nám."],
  ["feedback","✚","Zpětná vazba na vedení","Udělit členu vedení +rep nebo -rep."]
];
const fieldMap = {
  general:[["characterName","Jméno a příjmení postavy","text"]],
  leadership:[["characterName","Jméno postavy","text"]],
  other:[["characterName","Jméno postavy","text"]],
  ck:[["ckType","Druh CK","select","Travel CK|Character Kill|Self CK|Situační CK"],["characterName","Jméno postavy","text"],["reason","Důvod udělení CK","textarea"],["clues","Stopy pro sheriffy","textarea"],["target","Cíl Character Kill","text"],["executor","Kdo Character Kill provede","text"]],
  faction:[["factionName","Název frakce","text"],["characterName","Postava žadatele","text"],["lore","Lore frakce","textarea"],["benefit","Přínos pro server","textarea"],["devNeeds","Požadavky na vývojáře","textarea"]]
};
const esc = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(path,options={}){const response=await fetch(`${apiBase}${path}`,{credentials:"include",headers:{"Content-Type":"application/json"},...options});const body=await response.json();if(!response.ok)throw new Error(body.error||"Požadavek se nepodařil.");return body.data??body.user??body}
function notify(text,error=false){message.textContent=text;message.className=`message${error?" error":""}`;message.hidden=false;message.scrollIntoView({behavior:"smooth"});}
grid.innerHTML=categories.map(([key,icon,title,text])=>`<button class="category-card" data-category="${key}"><span class="category-icon">${icon}</span><h3>${title}</h3><p>${text}</p></button>`).join("");
function input([key,label,type,values]){
  if(type==="select")return `<label>${label}<select data-field="${key}"><option value="">Vyber možnost</option>${values.split("|").map(v=>`<option>${v}</option>`).join("")}</select></label>`;
  return `<label>${label}<${type==="textarea"?"textarea":"input"} data-field="${key}" ${type==="textarea"?"maxlength=\"4000\"":`type="${type}" maxlength="150"`}></${type==="textarea"?"textarea":"input"}></label>`;
}
async function openCategory(key){
  if(key==="feedback"){location.href="zpetna-vazba.html";return}
  const category=categories.find(item=>item[0]===key);
  document.querySelector("#ticket-category").value=key;document.querySelector("#ticket-title").textContent=category[2];
  let html=(fieldMap[key]||[]).map(input).join("");
  if(key==="faction"){
    html=`<div class="field-note">Smíš vlastnit pouze jednu frakci. Pro založení musíte být minimálně tři.</div>${html}<label>Členové frakce <span>pouze hráči s dokončeným whitelistem, max. 20</span><select data-field="members" multiple size="7">${factionMembers.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join("")}</select></label>`;
  }
  document.querySelector("#dynamic-fields").innerHTML=html;dialog.showModal();
}
grid.querySelectorAll("[data-category]").forEach(button=>button.onclick=()=>openCategory(button.dataset.category));
document.querySelector("#ticket-form").addEventListener("submit",async event=>{
  event.preventDefault();const button=event.currentTarget.querySelector("button[type=submit]");button.disabled=true;
  try{
    const fields={};document.querySelectorAll("[data-field]").forEach(element=>fields[element.dataset.field]=element.multiple?[...element.selectedOptions].map(o=>o.value):element.value.trim());
    fields.attachmentLinks=document.querySelector("#ticket-links").value.split(/\r?\n/).map(value=>value.trim()).filter(Boolean).slice(0,10);
    const result=await api("/api/tickets",{method:"POST",body:JSON.stringify({category:document.querySelector("#ticket-category").value,description:document.querySelector("#ticket-description").value.trim(),fields,attachments:[]})});
    dialog.close();notify(`Ticket ${result.number} byl úspěšně založen. O změnách tě upozorníme na Discordu.`);event.currentTarget.reset();
  }catch(error){notify(error.message,true)}finally{button.disabled=false}
});
api("/api/auth/me").then(()=>api("/api/support/faction-members")).then(data=>factionMembers=data).catch(()=>location.href=`${apiBase}/api/auth/discord`);
api("/api/support/faction-invitations").then(items=>{
  if(!items.length)return;const box=document.querySelector("#faction-invitations");box.hidden=false;
  box.innerHTML=`<h2>Pozvánky do frakcí</h2>${items.map(item=>`<article class="request-card"><strong>${esc(item.factionName||item.ticketNumber)}</strong><p>Pozval tě ${esc(item.invitedByName)}. Potvrzení neznamená automatické schválení frakce.</p><div class="actions"><button class="button approve" data-invite="${item.id}" data-response="accepted">Potvrdit účast</button><button class="button reject" data-invite="${item.id}" data-response="declined">Odmítnout</button></div></article>`).join("")}`;
  box.querySelectorAll("[data-invite]").forEach(button=>button.onclick=async()=>{try{await api(`/api/support/faction-invitations/${button.dataset.invite}`,{method:"PATCH",body:JSON.stringify({response:button.dataset.response})});button.closest("article").remove();notify("Tvoje odpověď byla uložena.")}catch(error){notify(error.message,true)}});
}).catch(()=>{});
