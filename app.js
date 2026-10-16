/* ===== Sistema Solar Interativo — lógica ===== */
"use strict";

/* ---------- Dados dos corpos celestes ----------
   periodDays: período orbital em dias terrestres (base para velocidade relativa)
   diameterKm: diâmetro real (para escala relativa e comparação)
   distanceAU / distanceKm: distância média do Sol
   orbitR: raio da órbita na tela (0..1 do raio máximo disponível)
   sizePx: tamanho "de exibição" padrão (px, quando escala relativa está desligada)
*/
const SUN = {
  id: "sun", name: "Sol", type: "Estrela", color: "#ffcf4d",
  diameterKm: 1392700, trivia: "O Sol concentra 99,86% de toda a massa do sistema solar. Sua luz leva cerca de 8 minutos para chegar à Terra.",
  sizePx: 56
};

const PLANETS = [
  { id:"mercury", name:"Mercúrio", type:"Planeta rochoso", color:"#b8aa98",
    diameterKm:4879, distanceAU:0.39, distanceKm:"57,9 milhões de km",
    periodDays:88, speedKms:47.4, moons:0, orbitR:0.16, sizePx:9,
    trivia:"É o planeta mais rápido: completa uma volta ao Sol em apenas 88 dias, mas gira sobre si mesmo bem devagar." },
  { id:"venus", name:"Vênus", type:"Planeta rochoso", color:"#e6c07a",
    diameterKm:12104, distanceAU:0.72, distanceKm:"108,2 milhões de km",
    periodDays:224.7, speedKms:35.0, moons:0, orbitR:0.25, sizePx:14,
    trivia:"Gira no sentido contrário ao da maioria dos planetas e é o mais quente do sistema solar (≈465 °C)." },
  { id:"earth", name:"Terra", type:"Planeta rochoso", color:"#5f9dd6",
    diameterKm:12756, distanceAU:1.00, distanceKm:"149,6 milhões de km",
    periodDays:365.25, speedKms:29.8, moons:1, orbitR:0.34, sizePx:15,
    trivia:"É o único lugar conhecido com vida e o planeta mais denso do sistema solar." },
  { id:"mars", name:"Marte", type:"Planeta rochoso", color:"#d1663d",
    diameterKm:6792, distanceAU:1.52, distanceKm:"227,9 milhões de km",
    periodDays:687, speedKms:24.1, moons:2, orbitR:0.43, sizePx:11,
    trivia:"Abriga o Monte Olimpo, o maior vulcão do sistema solar, com quase 3 vezes a altura do Everest." },
  { id:"jupiter", name:"Júpiter", type:"Gigante gasoso", color:"#d8a678",
    diameterKm:142984, distanceAU:5.20, distanceKm:"778,5 milhões de km",
    periodDays:4331, speedKms:13.1, moons:95, orbitR:0.58, sizePx:30,
    trivia:"O maior planeta: caberiam mais de 1.300 Terras dentro dele. A Grande Mancha Vermelha é uma tempestade maior que a Terra." },
  { id:"saturn", name:"Saturno", type:"Gigante gasoso", color:"#e3cf94", ring:true,
    diameterKm:120536, distanceAU:9.54, distanceKm:"1,43 bilhão de km",
    periodDays:10747, speedKms:9.7, moons:146, orbitR:0.72, sizePx:26,
    trivia:"Seus anéis são feitos sobretudo de gelo e rocha. Saturno é tão pouco denso que flutuaria na água." },
  { id:"uranus", name:"Urano", type:"Gigante gelado", color:"#9fd6dc",
    diameterKm:51118, distanceAU:19.19, distanceKm:"2,87 bilhões de km",
    periodDays:30589, speedKms:6.8, moons:28, orbitR:0.85, sizePx:20,
    trivia:"Gira praticamente 'deitado' (inclinação axial de ~98°), provavelmente após uma colisão gigante no passado." },
  { id:"neptune", name:"Netuno", type:"Gigante gelado", color:"#4c6fd1",
    diameterKm:49528, distanceAU:30.07, distanceKm:"4,50 bilhões de km",
    periodDays:59800, speedKms:5.4, moons:16, orbitR:0.97, sizePx:19,
    trivia:"Tem os ventos mais rápidos do sistema solar, ultrapassando 2.000 km/h. Um ano lá dura quase 165 anos terrestres." }
];

const BODIES = [SUN, ...PLANETS];

/* ---------- Estado da simulação ---------- */
const state = {
  playing: true,
  speed: 1,               // multiplicador (0.1 .. 20)
  angles: {},             // id -> ângulo atual (rad)
  selectedId: null,
  showOrbits: true,
  showLabels: true,
  relativeScale: false,
  lastTs: null
};

// Ângulos iniciais variados para um visual interessante
PLANETS.forEach((p, i) => { state.angles[p.id] = (i * 1.1 + 0.6) % (Math.PI * 2); });

/* ---------- Referências DOM ---------- */
const stage      = document.getElementById("stage");
const canvas     = document.getElementById("orbitCanvas");
const ctx        = canvas.getContext("2d");
const bodiesWrap = document.getElementById("bodies");
const btnPlay    = document.getElementById("btnPlayPause");
const btnReset   = document.getElementById("btnReset");
const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");
const chkOrbits  = document.getElementById("chkOrbits");
const chkLabels  = document.getElementById("chkLabels");
const chkReal    = document.getElementById("chkRealistic");

const infoPanel = {
  empty:   document.querySelector(".info-empty"),
  content: document.querySelector(".info-content"),
  swatch:  document.getElementById("infoSwatch"),
  name:    document.getElementById("infoName"),
  type:    document.getElementById("infoType"),
  size:    document.getElementById("infoSize"),
  dist:    document.getElementById("infoDistance"),
  period:  document.getElementById("infoPeriod"),
  speed:   document.getElementById("infoSpeed"),
  moons:   document.getElementById("infoMoons"),
  trivia:  document.getElementById("infoTrivia"),
  scaleBar:document.getElementById("scaleBar")
};

/* ---------- Elementos visuais dos planetas ---------- */
const els = {}; // id -> div

function createBodyElements() {
  bodiesWrap.innerHTML = "";

  const sunEl = document.createElement("div");
  sunEl.className = "body sun";
  sunEl.dataset.id = SUN.id;
  sunEl.setAttribute("role", "button");
  sunEl.setAttribute("tabindex", "0");
  sunEl.setAttribute("aria-label", SUN.name);
  sunEl.innerHTML = `<span class="label">${SUN.name}</span>`;
  bodiesWrap.appendChild(sunEl);
  els[SUN.id] = sunEl;

  PLANETS.forEach(p => {
    const el = document.createElement("div");
    el.className = "body planet" + (p.ring ? " ring" : "");
    el.dataset.id = p.id;
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", p.name);
    el.style.background = `radial-gradient(circle at 35% 32%, #ffffffbb 0%, ${p.color} 35%, ${shade(p.color,-45)} 100%)`;
    el.innerHTML = `<span class="label">${p.name}</span>`;
    bodiesWrap.appendChild(el);
    els[p.id] = el;
  });

  Object.values(els).forEach(el => {
    el.addEventListener("click", () => selectBody(el.dataset.id));
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectBody(el.dataset.id); }
    });
  });
}

/* ---------- Estrelas de fundo ---------- */
function createStars(count = 90) {
  stage.querySelectorAll(".star").forEach(s => s.remove());
  for (let i = 0; i < count; i++) {
    const s = document.createElement("div");
    s.className = "star";
    const size = Math.random() * 2 + 0.5;
    s.style.width = s.style.height = `${size}px`;
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 100}%`;
    s.style.animationDelay = `${Math.random() * 3}s`;
    s.style.animationDuration = `${2 + Math.random() * 4}s`;
    stage.appendChild(s);
  }
}

/* ---------- Canvas (órbitas) ---------- */
function resizeCanvas() {
  const rect = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawOrbits(w, h) {
  ctx.clearRect(0, 0, w, h);
  if (!state.showOrbits) return;
  const cx = w / 2, cy = h / 2;
  const maxR = Math.min(w, h) / 2 - 24;
  ctx.save();
  ctx.strokeStyle = "rgba(150,170,255,0.22)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  PLANETS.forEach(p => {
    ctx.beginPath();
    ctx.arc(cx, cy, p.orbitR * maxR, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

/* ---------- Escalas de exibição ---------- */
function displaySize(body) {
  if (!state.relativeScale) return body.sizePx;
  // escala relativa pelo diâmetro real, com raiz para manter visibilidade
  const maxDia = SUN.diameterKm;
  const ratio = body.diameterKm / maxDia;
  const px = 6 + Math.pow(ratio, 0.55) * 70;
  return Math.max(6, Math.min(px, 110));
}

/* ---------- Loop principal ---------- */
function tick(ts) {
  if (state.lastTs == null) state.lastTs = ts;
  const dt = Math.min((ts - state.lastTs) / 1000, 0.1); // segundos, limitado
  state.lastTs = ts;

  if (state.playing && state.speed > 0) {
    PLANETS.forEach(p => {
      // velocidade angular proporcional a 1/período → planetas externos mais lentos
      const omega = (2 * Math.PI) / (p.periodDays / 365.25) * 0.05; // rad/s por unidade de velocidade
      state.angles[p.id] = (state.angles[p.id] + omega * state.speed * dt) % (Math.PI * 2);
    });
  }

  render();
  requestAnimationFrame(tick);
}

function render() {
  const rect = stage.getBoundingClientRect();
  const w = rect.width, h = rect.height;
  const cx = w / 2, cy = h / 2;
  const maxR = Math.min(w, h) / 2 - 24;

  drawOrbits(w, h);

  // Sol
  const sunSize = displaySize(SUN);
  const sunEl = els[SUN.id];
  sunEl.style.width = sunEl.style.height = `${sunSize}px`;
  sunEl.style.left = `${cx}px`;
  sunEl.style.top = `${cy}px`;

  // Planetas
  PLANETS.forEach(p => {
    const el = els[p.id];
    const r = p.orbitR * maxR;
    const a = state.angles[p.id];
    el.style.width = el.style.height = `${displaySize(p)}px`;
    el.style.left = `${cx + r * Math.cos(a)}px`;
    el.style.top  = `${cy + r * Math.sin(a)}px`;
    el.classList.toggle("no-label", !state.showLabels);
  });

  sunEl.classList.toggle("no-label", !state.showLabels);
}

/* ---------- Seleção e painel de informações ---------- */
function fmtNumber(n) { return n.toLocaleString("pt-BR"); }

function formatPeriod(days) {
  if (days >= 365.25) {
    const years = days / 365.25;
    return `${years.toFixed(years >= 10 ? 0 : 1)} anos terrestres (${fmtNumber(Math.round(days))} dias)`;
  }
  return `${days.toLocaleString("pt-BR")} dias terrestres`;
}

function selectBody(id) {
  state.selectedId = id;
  Object.entries(els).forEach(([eid, el]) => el.classList.toggle("selected", eid === id));

  const body = BODIES.find(b => b.id === id);
  if (!body) return;

  infoPanel.empty.hidden = true;
  infoPanel.content.hidden = false;

  infoPanel.swatch.style.background =
    body.id === "sun"
      ? "radial-gradient(circle at 38% 35%, #fff7cf, #ffd75e 45%, #ff8c1a)"
      : `radial-gradient(circle at 35% 32%, #ffffffbb, ${body.color} 45%, ${shade(body.color, -45)})`;
  infoPanel.name.textContent = body.name;
  infoPanel.type.textContent = body.type;
  infoPanel.size.textContent = `${fmtNumber(body.diameterKm)} km`;

  if (body.id === "sun") {
    infoPanel.dist.textContent = "— (centro do sistema)";
    infoPanel.period.textContent = "— (não orbita outro corpo)";
    infoPanel.speed.textContent = "≈ 0 km/s (em repouso relativo)";
    infoPanel.moons.textContent = "8 planetas orbitam o Sol";
  } else {
    infoPanel.dist.textContent = `${body.distanceAU.toLocaleString("pt-BR")} UA · ${body.distanceKm}`;
    infoPanel.period.textContent = formatPeriod(body.periodDays);
    infoPanel.speed.textContent = `${body.speedKms.toLocaleString("pt-BR")} km/s`;
    infoPanel.moons.textContent = `${body.moons}`;
  }

  infoPanel.trivia.textContent = body.trivia;
  buildScaleBar(body);
}

/* Barra comparativa de tamanhos (planetas + Sol destacado) */
function buildScaleBar(current) {
  const items = [SUN, ...PLANETS];
  const maxDia = SUN.diameterKm;
  infoPanel.scaleBar.innerHTML = "";
  items.forEach(b => {
    const wrap = document.createElement("div");
    wrap.className = "scale-item" + (b.id === current.id ? " current" : "");
    const chip = document.createElement("div");
    chip.className = "scale-chip";
    const pct = Math.pow(b.diameterKm / maxDia, 0.5) * 100; // raiz p/ legibilidade
    chip.style.height = `${Math.max(4, pct * 0.58)}px`;
    chip.style.background = b.id === "sun" ? "#ffcf4d" : b.color;
    chip.title = `${b.name}: ${fmtNumber(b.diameterKm)} km`;
    const name = document.createElement("span");
    name.className = "scale-name";
    name.textContent = b.id === "sun" ? "Sol" : b.name.slice(0, 3);
    wrap.append(chip, name);
    wrap.addEventListener("click", () => selectBody(b.id));
    wrap.style.cursor = "pointer";
    infoPanel.scaleBar.appendChild(wrap);
  });
}

/* ---------- Controles ---------- */
function sliderToSpeed(v) {
  // 0..100 → 0.1×..20× (curva exponencial suave); v=35 ≈ 1×
  return +(0.1 * Math.pow(200, v / 100)).toFixed(2);
}

function updatePlayButton() {
  btnPlay.textContent = state.playing ? "⏸ Pausar" : "▶ Reproduzir";
  btnPlay.setAttribute("aria-pressed", String(state.playing));
}

btnPlay.addEventListener("click", () => { state.playing = !state.playing; updatePlayButton(); });

btnReset.addEventListener("click", () => {
  PLANETS.forEach((p, i) => { state.angles[p.id] = (i * 1.1 + 0.6) % (Math.PI * 2); });
  state.speed = 1; speedRange.value = 35; speedValue.textContent = "1×";
  state.playing = true; updatePlayButton();
});

speedRange.addEventListener("input", () => {
  state.speed = sliderToSpeed(+speedRange.value);
  speedValue.textContent = `${state.speed}×`;
});

chkOrbits.addEventListener("change", () => { state.showOrbits = chkOrbits.checked; });
chkLabels.addEventListener("change", () => { state.showLabels = chkLabels.checked; });
chkReal.addEventListener("change", () => { state.relativeScale = chkReal.checked; });

// Atalhos de teclado: espaço = play/pause, ←/→ = velocidade
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
  if (e.code === "Space") { e.preventDefault(); state.playing = !state.playing; updatePlayButton(); }
  if (e.key === "ArrowRight") { speedRange.value = Math.min(100, +speedRange.value + 5); speedRange.dispatchEvent(new Event("input")); }
  if (e.key === "ArrowLeft")  { speedRange.value = Math.max(0, +speedRange.value - 5);   speedRange.dispatchEvent(new Event("input")); }
});

/* ---------- Utilitários ---------- */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

/* ---------- Inicialização ---------- */
window.addEventListener("resize", resizeCanvas);

createBodyElements();
createStars();
resizeCanvas();
state.speed = sliderToSpeed(+speedRange.value);
speedValue.textContent = `${state.speed}×`;
updatePlayButton();
requestAnimationFrame(tick);
