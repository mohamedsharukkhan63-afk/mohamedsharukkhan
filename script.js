let map, markers = {}, currentFilter = "all";
const REMOVE_EVENT_PASSWORD = "sharukkhan63@";
const DELETED_EVENTS_KEY = "valinokkamDeletedEvents";

const places = {
  beach:{name:"Valinokkam Beach",desc:"A coastal viewpoint and local gathering place along the Gulf of Mannar.",lat:9.1646,lng:78.6452,type:"coast"},
  peninsula:{name:"Valinokkam Peninsular Beach",desc:"A quieter stretch of the peninsula with broad coastal views.",lat:9.158264,lng:78.656195,type:"coast"},
  harbour:{name:"Valinokkam Old Harbour",desc:"A working coastal area associated with fishing and boat activity.",lat:9.183736,lng:78.647351,type:"life"},
  ervadi:{name:"Ervadi",desc:"Ervadi Boating,Pichaimoopanvalasai, A best place for boating with family, couple, friends.",lat:9.191754,lng:78.703032,type:"nearby"}
};

const defaultEvents = [
  {id:1,name:"Valinokkam Coastal Clean-up",date:"2026-10-04",category:"nature",location:"Valinokkam Beach",description:"A community morning to keep the coast clean and raise awareness about marine habitats."},
  {id:2,name:"Village Sports Day",date:"2026-10-18",category:"sports",location:"Valinokkam",description:"A community sports day with local games and activities for young people."},
  {id:3,name:"Community Cultural Evening",date:"2026-11-07",category:"culture",location:"Valinokkam",description:"Music, food, stories and local culture shared by the community."}
];

document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>document.querySelector(".preloader")?.classList.add("hide"),700);
  setupNav(); setupReveal(); setupEvents(); setupMap(); setupGallery();
});

function setupNav(){
  const nav=document.querySelector(".nav"), btn=document.querySelector(".menu-btn");
  window.addEventListener("scroll",()=>nav.classList.toggle("scrolled",scrollY>40));
  btn.addEventListener("click",()=>nav.classList.toggle("open"));
  document.querySelectorAll(".nav-links a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
}

function setupReveal(){
  const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.12});
  document.querySelectorAll(".reveal").forEach(x=>obs.observe(x));
}

function setupMap(){
  map=L.map("mapCanvas",{scrollWheelZoom:false,zoomControl:false}).setView([9.1665,78.462],13);
  L.control.zoom({position:"topright"}).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'© OpenStreetMap contributors'}).addTo(map);
  Object.entries(places).forEach(([key,p])=>{
    const marker=L.marker([p.lat,p.lng]).addTo(map).bindPopup(`<b>${p.name}</b><br>${p.desc}`);
    marker.on("click",()=>selectPlace(key));
    markers[key]=marker;
  });
  selectPlace("beach");
  document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
    currentFilter=btn.dataset.filter;
    Object.entries(markers).forEach(([k,m])=>m.setOpacity(currentFilter==="all"||places[k].type===currentFilter?1:0.2));
  }));
}
function selectPlace(key){
  const p=places[key]; if(!p||!map)return;
  map.flyTo([p.lat,p.lng],14,{duration:1});
  document.getElementById("mapTitle").textContent=p.name;
  document.getElementById("mapDesc").textContent=p.desc;
  document.getElementById("mapCoord").textContent=`${p.lat.toFixed(4)}° N · ${p.lng.toFixed(4)}° E`;
  document.getElementById("directions").href=`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  markers[key]?.openPopup();
}
function focusPlace(key){document.querySelector("#map").scrollIntoView({behavior:"smooth"});setTimeout(()=>selectPlace(key),500)}

function safeStoredEvents(){
  try{
    const value=JSON.parse(localStorage.getItem("valinokkamEvents")||"[]");
    return Array.isArray(value)?value:[];
  }catch{return []}
}
function setupEvents(){
  const grid=document.getElementById("eventGrid");
  renderEvents();
  document.querySelectorAll(".event-tab").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".event-tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    renderEvents(btn.dataset.cat);
  }));

  // Event delegation: the cards are re-rendered after every change, so the
  // click listener lives on the permanent eventGrid container.
  grid.addEventListener("click",e=>{
    const button=e.target.closest(".event-remove");
    if(!button || !grid.contains(button)) return;
    e.preventDefault();
    e.stopPropagation();
    removeEvent(button.dataset.eventId);
  });

  document.getElementById("eventForm").addEventListener("submit",e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.target).entries());
    const stored=safeStoredEvents();
    stored.push({...data,id:String(Date.now())});
    localStorage.setItem("valinokkamEvents",JSON.stringify(stored));
    e.target.reset();
    closeEventModal();
    renderEvents();
    toast("Event added to this browser.");
  });
}
function getDeletedEventIds(){
  try{
    const value=JSON.parse(localStorage.getItem(DELETED_EVENTS_KEY)||"[]");
    return Array.isArray(value)?value:[];
  }catch{return []}
}
function allEvents(){
  const deleted=new Set(getDeletedEventIds().map(String));
  return [...defaultEvents,...safeStoredEvents()]
    .filter(e=>!deleted.has(String(e.id)))
    .sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function renderEvents(cat="all"){
  const grid=document.getElementById("eventGrid"),empty=document.getElementById("emptyEvents");
  const list=allEvents().filter(e=>cat==="all"||e.category===cat);
  grid.innerHTML=list.map(e=>`<article class="event-card">
    <div class="event-date-row"><div class="event-date">${formatDate(e.date)} · ${escapeHtml(e.category)}</div><button class="event-remove" type="button" data-event-id="${escapeHtml(String(e.id))}" aria-label="Remove ${escapeHtml(e.name)}">Remove</button></div>
    <h3>${escapeHtml(e.name)}</h3><p>${escapeHtml(e.description||"Community event in Valinokkam.")}</p>
    <div class="event-meta"><span>📍 ${escapeHtml(e.location)}</span><span>VALINOKKAM</span></div>
  </article>`).join("");
  empty.style.display=list.length?"none":"block";
}
function removeEvent(id){
  const target=String(id||"");
  if(!target){toast("Could not identify this event.");return;}

  const password=window.prompt("Enter the admin password to remove this event:");
  if(password===null)return;
  if(password.trim()!==REMOVE_EVENT_PASSWORD){
    toast("Incorrect password. Event was not removed.");
    return;
  }

  const defaultIds=new Set(defaultEvents.map(e=>String(e.id)));
  if(defaultIds.has(target)){
    const deleted=getDeletedEventIds();
    if(!deleted.map(String).includes(target)) deleted.push(target);
    localStorage.setItem(DELETED_EVENTS_KEY,JSON.stringify(deleted));
  }else{
    const stored=safeStoredEvents().filter(e=>String(e.id)!==target);
    localStorage.setItem("valinokkamEvents",JSON.stringify(stored));
  }

  const active=document.querySelector(".event-tab.active")?.dataset.cat||"all";
  renderEvents(active);
  toast("Event removed successfully.");
}
function formatDate(s){return new Date(s+"T12:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase()}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function openEventModal(){document.getElementById("eventModal").classList.add("open");document.getElementById("eventModal").setAttribute("aria-hidden","false")}
function closeEventModal(){document.getElementById("eventModal").classList.remove("open");document.getElementById("eventModal").setAttribute("aria-hidden","true")}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function setupGallery(){document.querySelectorAll(".gallery-item").forEach(i=>i.addEventListener("click",()=>window.open(i.querySelector("img").src,"_blank")))}
