const apiBase = window.DEADSTONE_CONFIG?.apiBase?.replace(/\/$/, "") || location.origin;
const fallback = window.DEADSTONE_ATLAS;
let atlas = fallback;
let selectedLocation = null;

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[character]);
const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function loadAtlas() {
  try {
    const response = await fetch(`${apiBase}/api/atlas`);
    if (!response.ok) throw new Error("Atlas API není dostupné.");
    const body = await response.json();
    if (body.data?.locations?.length && body.data?.regions?.length) atlas = body.data;
  } catch (error) {
    console.info("Používám výchozí atlasová data.", error.message);
  }
  atlas.locations = atlas.locations.filter(item => item.isPublished !== false).sort((a,b)=>(a.order||0)-(b.order||0));
  atlas.regions = atlas.regions.filter(item => item.isPublished !== false).sort((a,b)=>(a.order||0)-(b.order||0));
  renderAll();
}

const frame = document.querySelector("#map-frame");
const stage = document.querySelector("#map-stage");
const markers = document.querySelector("#map-markers");
const panel = document.querySelector("#location-panel");
const detail = document.querySelector("#location-detail");
const mapStatus = document.querySelector("#map-status");
const mapState = { zoom:1, panX:0, panY:0, dragging:false, startX:0, startY:0, originX:0, originY:0 };
const activePointers = new Map();
let pinchDistance = 0;
let pinchZoom = 1;
const MAP_RATIO = 1424 / 1104;

function sizeStage() {
  const box = frame.getBoundingClientRect();
  let width = box.width, height = width / MAP_RATIO;
  if (height > box.height) { height = box.height; width = height * MAP_RATIO; }
  stage.style.width = `${width}px`; stage.style.height = `${height}px`;
  stage.style.left = `${(box.width-width)/2}px`; stage.style.top = `${(box.height-height)/2}px`;
  applyMapTransform();
}
function applyMapTransform() {
  stage.style.transform = `translate(${mapState.panX}px,${mapState.panY}px) scale(${mapState.zoom})`;
  mapStatus.textContent = `${Math.round(mapState.zoom*100)} %`;
}
function setMapView(zoom=1, panX=0, panY=0) {
  mapState.zoom=Math.min(4,Math.max(1,zoom)); mapState.panX=panX; mapState.panY=panY; applyMapTransform();
}
function zoomAt(delta) { setMapView(mapState.zoom+delta,mapState.panX,mapState.panY); }
function focusPoint(x,y,zoom=2) {
  const box=frame.getBoundingClientRect(), stageBox={w:stage.offsetWidth,h:stage.offsetHeight};
  const dx=(50-x)/100*stageBox.w*zoom, dy=(50-y)/100*stageBox.h*zoom;
  setMapView(zoom,Math.max(-box.width,Math.min(box.width,dx)),Math.max(-box.height,Math.min(box.height,dy)));
  document.querySelector("#mapa").scrollIntoView({behavior:"smooth",block:"start"});
}

function renderMarkers() {
  markers.innerHTML=atlas.locations.map(item=>`<button class="map-marker" style="left:${Number(item.mapX)}%;top:${Number(item.mapY)}%" data-location="${escapeHtml(item.id)}" aria-label="Zobrazit ${escapeHtml(item.name)}"><span class="marker-tooltip"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.type)} · ${escapeHtml(item.region)}</small></span></button>`).join("");
  markers.querySelectorAll("[data-location]").forEach(button=>button.addEventListener("click",event=>{event.stopPropagation();openLocation(button.dataset.location);}));
}
function openLocation(id) {
  const item=atlas.locations.find(entry=>entry.id===id); if(!item)return;
  selectedLocation=item;
  document.querySelectorAll(".map-marker").forEach(marker=>marker.classList.toggle("active",marker.dataset.location===id));
  detail.innerHTML=`<p class="eyebrow">Úřední zápis lokace</p><h3>${escapeHtml(item.name)}</h3><div class="location-meta"><span>${escapeHtml(item.type)}</span><span>${escapeHtml(item.region)}</span></div>${item.originalName?`<p class="location-original">Původní označení mapy: ${escapeHtml(item.originalName)}</p>`:""}<p>${escapeHtml(item.description||item.shortDescription)}</p>${item.history?`<h4>Historie</h4><p>${escapeHtml(item.history)}</p>`:""}${item.notablePlaces?.length?`<h4>Významná místa</h4><ul>${item.notablePlaces.map(place=>`<li>${escapeHtml(place)}</li>`).join("")}</ul>`:""}`;
  panel.hidden=false; panel.scrollTop=0;
}
function closeLocation(){panel.hidden=true;selectedLocation=null;document.querySelectorAll(".map-marker").forEach(marker=>marker.classList.remove("active"));}

function renderRegions(){
  const counts=Object.fromEntries(atlas.regions.map(region=>[region.name,atlas.locations.filter(item=>item.region===region.name).length]));
  document.querySelector("#region-grid").innerHTML=atlas.regions.map((region,index)=>`<article class="region-card reveal" data-index="${String(index+1).padStart(2,"0")}"><h3>${escapeHtml(region.name)}</h3><p>${escapeHtml(region.description)}</p><footer><span>${counts[region.name]||0} evidovaných lokací</span><button type="button" data-region="${escapeHtml(region.id)}">Zobrazit na mapě →</button></footer></article>`).join("");
  document.querySelectorAll("[data-region]").forEach(button=>button.addEventListener("click",()=>{const region=atlas.regions.find(item=>item.id===button.dataset.region);if(region)focusPoint(region.focus?.x||50,region.focus?.y||50,region.focus?.zoom||1.7);}));
}
function renderFilters(){document.querySelector("#region-filter").insertAdjacentHTML("beforeend",atlas.regions.map(region=>`<option value="${escapeHtml(region.name)}">${escapeHtml(region.name)}</option>`).join(""));const typeFilter=document.querySelector("#type-filter");if(!typeFilter.querySelector('[value="landmark"]'))typeFilter.insertAdjacentHTML("beforeend",'<option value="landmark">Významná místa</option>');}
function renderLocations(){
  const query=normalize(document.querySelector("#location-search").value), region=document.querySelector("#region-filter").value, type=document.querySelector("#type-filter").value, sort=document.querySelector("#sort-filter").value;
  const items=atlas.locations.filter(item=>(!query||normalize([item.name,item.region,item.type,item.originalName].join(" ")).includes(query))&&(!region||item.region===region)&&(!type||item.category===type)).sort((a,b)=>String(a[sort]||"").localeCompare(String(b[sort]||""),"cs"));
  document.querySelector("#location-list").innerHTML=`<div class="location-row list-head"><strong>Název</strong><strong>Region</strong><strong>Typ</strong><strong>Krátký popis</strong></div>${items.map(item=>`<article class="location-row" tabindex="0" data-list-location="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.region)}</span><span>${escapeHtml(item.type)}</span><p>${escapeHtml(item.shortDescription)}</p></article>`).join("")}`;
  document.querySelector("#atlas-empty").hidden=Boolean(items.length);
  document.querySelectorAll("[data-list-location]").forEach(row=>{const activate=()=>{const item=atlas.locations.find(entry=>entry.id===row.dataset.listLocation);focusPoint(item.mapX,item.mapY,2.2);openLocation(item.id)};row.addEventListener("click",activate);row.addEventListener("keydown",event=>{if(event.key==="Enter")activate()})});
}
function renderConverter(){
  const items=atlas.locations.filter(item=>item.originalName&&item.originalName!==item.name);
  document.querySelector("#name-converter").innerHTML=`<div class="converter-row"><span>Původní název</span><span>Deadstone</span></div>${items.map(item=>`<div class="converter-row"><span>${escapeHtml(item.originalName)}</span><span>${escapeHtml(item.name)}</span></div>`).join("")}`;
}
function renderAll(){renderMarkers();renderRegions();renderFilters();renderLocations();renderConverter();observeReveals();sizeStage();}

frame.addEventListener("wheel",event=>{event.preventDefault();zoomAt(event.deltaY<0?.2:-.2)},{passive:false});
frame.addEventListener("pointerdown",event=>{if(event.target.closest("button"))return;activePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});frame.setPointerCapture(event.pointerId);if(activePointers.size===2){const points=[...activePointers.values()];pinchDistance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);pinchZoom=mapState.zoom;mapState.dragging=false;return}mapState.dragging=true;frame.classList.add("dragging");mapState.startX=event.clientX;mapState.startY=event.clientY;mapState.originX=mapState.panX;mapState.originY=mapState.panY});
frame.addEventListener("pointermove",event=>{if(!activePointers.has(event.pointerId))return;activePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(activePointers.size===2){const points=[...activePointers.values()],distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);mapState.zoom=Math.min(4,Math.max(1,pinchZoom*(distance/pinchDistance)));applyMapTransform();return}if(!mapState.dragging)return;mapState.panX=mapState.originX+event.clientX-mapState.startX;mapState.panY=mapState.originY+event.clientY-mapState.startY;applyMapTransform()});
function releasePointer(event){activePointers.delete(event.pointerId);mapState.dragging=false;frame.classList.remove("dragging")}
frame.addEventListener("pointerup",releasePointer);frame.addEventListener("pointercancel",releasePointer);
frame.addEventListener("keydown",event=>{const step=30;if(event.key==="+")zoomAt(.2);else if(event.key==="-")zoomAt(-.2);else if(event.key==="ArrowLeft")mapState.panX+=step;else if(event.key==="ArrowRight")mapState.panX-=step;else if(event.key==="ArrowUp")mapState.panY+=step;else if(event.key==="ArrowDown")mapState.panY-=step;else return;event.preventDefault();applyMapTransform()});
document.querySelectorAll("[data-map-action]").forEach(button=>button.addEventListener("click",async()=>{const action=button.dataset.mapAction;if(action==="in")zoomAt(.25);if(action==="out")zoomAt(-.25);if(action==="reset")setMapView();if(action==="fullscreen"){if(!document.fullscreenElement)await frame.requestFullscreen?.();else await document.exitFullscreen?.();setTimeout(sizeStage,150)}}));
document.querySelector(".panel-close").addEventListener("click",closeLocation);
["location-search","region-filter","type-filter","sort-filter"].forEach(id=>document.querySelector(`#${id}`).addEventListener(id==="location-search"?"input":"change",renderLocations));
window.addEventListener("resize",sizeStage);

const toggle=document.querySelector(".menu-toggle"),menu=document.querySelector(".nav-menu");toggle.addEventListener("click",()=>{const open=toggle.getAttribute("aria-expanded")==="true";toggle.setAttribute("aria-expanded",String(!open));menu.classList.toggle("open",!open)});
function observeReveals(){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.08});document.querySelectorAll(".reveal:not(.visible)").forEach(element=>observer.observe(element));}
async function loadSession(){try{document.querySelectorAll(".discord-login").forEach(link=>link.href=`${apiBase}/api/auth/discord`);const response=await fetch(`${apiBase}/api/auth/me`,{credentials:"include"});if(!response.ok)return;const {user}=await response.json();if(!user)return;document.querySelectorAll(".discord-login").forEach(link=>link.hidden=true);const profile=document.querySelector(".discord-profile");profile.hidden=false;profile.querySelector("img").src=user.avatar;profile.querySelector("span").textContent=user.username;profile.querySelector("small").hidden=!user.admin;document.querySelector(".whitelist-link").hidden=false;document.querySelector(".admin-link").hidden=!user.admin;document.querySelector(".character-link").hidden=!user.fullAccess}catch(error){console.info("Relaci nelze načíst.")}}
loadSession();loadAtlas();
