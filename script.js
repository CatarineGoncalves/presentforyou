// CONFIG
const tracks = [
   { title: "Mistletoe", file: "mistletoe.mp3" },
  { title: "Fa La La", file: "fa-la-la.mp3" },
  { title: "All I Wanted", file: "aliwanted.mp3" },
  { title: "Dandelions", file: "dandelions.mp3" },
  { title: "Good Enough", file: "goodenough.mpeg" },
  { title: "I Wanna Be Yours", file: "iwannabeyours.mp3" },
  { title: "Nothing Else Matters", file: "nothingelsematter.mp3" },
  { title: "Presente", file: "presente.mpeg" },
  { title: "The Only Exception", file: "theonlyexception.mp3" },
  { title: "Those Eyes", file: "thoseeyes.mp3" }
];

let currentTrack = 0;
let audio, progress, titleEl, playBtn;

const ticketTypes = [
  { id: "tq",  name: "Tempo de qualidade à sua escolha", count: 10 },
  { id: "ne",  name: "Não te estressar por 2 dias", count: 8 },
  { id: "mb",  name: "Ouvir que eu te amo", count: Infinity },
  { id: "fil", name: "Ver um filme", count: 4 },
  { id: "ser", name: "Assistir uma série", count: 4 },
  { id: "rea", name: "Assistir um Reality que você quer", count: 4 },
  { id: "rso", name: "Reclamação sobre qualquer coisa sem ter opinião", count: 4 },
  { id: "fmc", name: "Fazer merda sem consequência por 2 horas", count: 2 },
];

let selectedTicketId = ticketTypes[0].id;

const relationshipStartISO = "2025-07-04T00:00:00-03:00";


// HELPERS
function pad2(n){ return String(n).padStart(2,"0"); }
function formatCount(n){ return n === Infinity ? "∞" : n; }
function serial(){
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const now = new Date();
  return `LILA-${pad2(now.getDate())}${pad2(now.getMonth()+1)}-${chars[Math.random()*chars.length|0]}${chars[Math.random()*chars.length|0]}`;
}


// AUDIO PLAYER (load / controls / navigation)
function initAudioPlayer(){
  audio = document.getElementById("audio");
  progress = document.getElementById("progress");
  titleEl = document.getElementById("songTitle");
  playBtn = document.getElementById("playBtn");
  if (!audio) return;

  loadTrack(currentTrack);

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    progress.value = (audio.currentTime / audio.duration) * 100;
  });

  progress.addEventListener("input", () => {
    audio.currentTime = (progress.value / 100) * audio.duration;
  });
}

function loadTrack(i){
  const t = tracks[i];
  titleEl.textContent = t.title;
  audio.src = `./music/${t.file}`;
}

function togglePlay(){
  if (audio.paused){
    audio.play();
    playBtn.textContent = "⏸";
  } else {
    audio.pause();
    playBtn.textContent = "▶";
  }
}

function nextSong(){
  currentTrack = (currentTrack + 1) % tracks.length;
  loadTrack(currentTrack);
  audio.play();
  playBtn.textContent = "⏸";
}

function prevSong(){
  currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
  loadTrack(currentTrack);
  audio.play();
  playBtn.textContent = "⏸";
}


// TICKETS (picker, generate, download)
function renderTicketPicker(){
  const wrap = document.getElementById("ticketPicker");
  if (!wrap) return;

  wrap.innerHTML = "";

  ticketTypes.forEach((t) => {
    const item = document.createElement("div");
    item.className = "pickerItem";
    item.dataset.id = t.id;

    if (t.id === selectedTicketId) {
      item.classList.add("is-selected");
    }

    item.innerHTML = `
      <div class="pickerItem__left">
        <div class="pickerItem__name">${t.name}</div>
        <div class="pickerItem__count">
          disponível: <strong>${formatCount(t.count)}</strong>
        </div>
      </div>
      <div class="pickerItem__radio"></div>
    `;

    item.addEventListener("click", () => {
      // 1️⃣ salva seleção
      selectedTicketId = t.id;

      // 2️⃣ remove seleção visual de todos
      document.querySelectorAll(".pickerItem").forEach(el => {
        el.classList.remove("is-selected");
      });

      // 3️⃣ adiciona no clicado
      item.classList.add("is-selected");

      // 4️⃣ anima feedback
      gsap.fromTo(item,
        { scale: 0.97 },
        { scale: 1, duration: 0.2, ease: "power2.out" }
      );
    });

    wrap.appendChild(item);
  });
}


function initTickets(){
  renderTicketPicker();

  document.getElementById("genTicket")?.addEventListener("click",()=>{
    const t = ticketTypes.find(x=>x.id===selectedTicketId);
    if(!t || (t.count!==Infinity && t.count<=0)) return;
    if(t.count!==Infinity) t.count--;
    renderTicketPicker();
    gerarPreviewTicket(t);
  });
}

function gerarPreviewTicket(ticket){
  if (!ticket || !ticket.name) return;

  const out = document.getElementById("ticketsOut");
  if (!out) return;

  out.innerHTML = "";

  const code = serial();
  const now = new Date();
  const date = now.toLocaleDateString("pt-BR");
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const wrapper = document.createElement("div");
  wrapper.className = "ticket ticket--preview";

  wrapper.innerHTML = `
    <div class="ticketPreview">

      <!-- LADO ESQUERDO -->
      <div class="ticketPreview__side">
        <span class="ticketPreview__vale">VALE</span>
      </div>

      <!-- CONTEÚDO -->
      <div class="ticketPreview__main">
        <span class="ticketPreview__label">Você resgatou o ticket</span>

        <h3 class="ticketPreview__title">${ticket.name}</h3>

        <span class="ticketPreview__date">
          ${date} às ${time}
        </span>

        <span class="ticketPreview__badge">SELECIONADO</span>
      </div>

    </div>

  `;

  out.appendChild(wrapper);

  // QR CODE
  const qrEl = wrapper.querySelector(".ticketPreview__qr");
  new QRCode(qrEl, {
    text: code,
    width: 56,
    height: 56
  });

  // Download
  wrapper.querySelector("button").addEventListener("click", () => {
    baixarTicketFinal(ticket.name, code, `${date} ${time}`);
  });

  gsap.from(wrapper, {
    opacity: 0,
    y: 18,
    duration: 0.5,
    ease: "power2.out"
  });
}



function baixarTicketFinal(nome, code, date){
  document.getElementById("ticketName").innerText = nome;
  document.querySelector(".ticket__code").innerText = code;
  document.getElementById("ticketDate").innerText = date;

  html2canvas(document.getElementById("ticketCanvas"), {
    scale: 2
  }).then(canvas=>{
    const a = document.createElement("a");
    a.download = `vale-${nome.replace(/\s+/g,"-")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  });
}




// HERO CAROUSEL
function initHeroCarousel(){
  const slides = document.querySelectorAll(".hero__slide");
  if (!slides.length) return;
  let index = 0;
  slides.forEach((s,i)=>s.style.opacity=i?0:1);

  setInterval(()=>{
    const prev = index;
    index = (index+1)%slides.length;
    gsap.to(slides[prev], {opacity:0, duration:0.6});
    gsap.to(slides[index], {opacity:1, duration:0.8});
  },4500);
}


// TIMER (relationship elapsed)


function updateWithAnim(el, value) {
  if (el.textContent === String(value)) return;

  gsap.to(el, {
    opacity: 0,
    y: -6,
    duration: 0.2,
    ease: "power2.out",
    onComplete: () => {
      el.textContent = value;
      gsap.fromTo(
        el,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
      );
    }
  });
}

function initTimer(){
  const elD = document.getElementById("tDays");
  const elH = document.getElementById("tHours");
  const elM = document.getElementById("tMins");
  const elS = document.getElementById("tSecs");
  if (!elD || !elH || !elM || !elS) return;

  const start = new Date(relationshipStartISO).getTime();

  function tick(){
    let diff = Date.now() - start;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    const mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);

    const secs = Math.floor(diff / 1000);

    updateWithAnim(elD, days);
    updateWithAnim(elH, pad2(hours));
    updateWithAnim(elM, pad2(mins));
    updateWithAnim(elS, pad2(secs));
  }

  tick();                 // primeira execução imediata
  setInterval(tick, 1000);
}


// ACCORDION (details reveal)
function initAccordion(){
  document.querySelectorAll("details").forEach(d=>{
    d.addEventListener("toggle",()=>{
      if(d.open){
        gsap.from(d.querySelector("p"),{opacity:0,y:10,duration:0.4});
      }
    });
  });
}


// SNOW (canvas)
function initSnow(){
  const c=document.getElementById("snow");
  if(!c) return;
  const ctx=c.getContext("2d");
  let w,h,flakes=[];
  function resize(){
    w=c.width=innerWidth;
    h=c.height=innerHeight;
    flakes=[...Array(80)].map(()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*2+1,s:Math.random()+0.5}));
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    flakes.forEach(f=>{
      f.y+=f.s;
      if(f.y>h)f.y=0;
      ctx.beginPath();
      ctx.arc(f.x,f.y,f.r,0,Math.PI*2);
      ctx.fillStyle="rgba(255,255,255,.6)";
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize(); draw();
  window.onresize=resize;
}


// GSAP ANIMATIONS (scroll reveal)
function initAnimations(){
  gsap.utils.toArray(".reveal").forEach(el=>{
    gsap.from(el,{
      opacity:0,y:16,filter:"blur(6px)",
      scrollTrigger:{trigger:el,start:"top 85%"},
      duration:.7,ease:"power2.out"
    });
  });


  gsap.from(".timeline__item", {
  opacity: 0,
  y: 20,
  stagger: 0.25,
  duration: 0.8,
  ease: "power2.out",
  scrollTrigger: {
    trigger: "#timeline",
    start: "top 80%"
  }
});

}

function initTypewriter() {
  const el = document.getElementById("typewriter");
  if (!el) return;

  const text = "Você precisa fazer tudo o que puder para chegar à única mulher que fará tudo isso valer a pena - Jim Halpert";
  let i = 0;

  ScrollTrigger.create({
    trigger: el,
    start: "top 80%",
    once: true,
    onEnter: () => {
      const interval = setInterval(() => {
        el.textContent += text.charAt(i);
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 55); // velocidade da digitação
    }
  });
}


// INIT
document.addEventListener("DOMContentLoaded",()=>{
  initSnow();
  initHeroCarousel();
  initAudioPlayer();
  initTimer();
  initAccordion();
  initTickets();
  initAnimations();
   initTypewriter();
});
