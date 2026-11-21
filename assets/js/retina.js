/* ==========================================================================
   retina.js — ilustración de la portada: fondo de retina (izquierda) y su
   máscara de segmentación de vasos (derecha). El divisor sigue al cursor
   o al dedo. Solo se anima mientras hay movimiento, para no gastar batería.
   © 2026 Fernando Daniel Hernandez Gutierrez
   ========================================================================== */
(function () {
  "use strict";
  const lienzo = document.getElementById("lienzo");
  const cv = document.getElementById("retina");
  if (!lienzo || !cv || !cv.getContext) return;
  const ctx = cv.getContext("2d"), W = cv.width, C = W / 2, R = W * 0.46;

  // Árbol vascular pseudoaleatorio con semilla fija (siempre el mismo dibujo)
  let semilla = 7;
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  const disco = { x: C - R * 0.38, y: C + R * 0.04 };
  const ramas = [];
  function crecer(x, y, ang, grosor, largo, nivel) {
    if (nivel > 7 || grosor < 0.9) return;
    const pasos = 7 + Math.floor(azar() * 5), pts = [[x, y]];
    for (let i = 0; i < pasos; i++) {
      ang += (azar() - 0.5) * 0.32;
      x += Math.cos(ang) * largo / pasos; y += Math.sin(ang) * largo / pasos;
      if (Math.hypot(x - C, y - C) > R * 0.98) break;
      pts.push([x, y]);
    }
    ramas.push({ pts, grosor });
    if (pts.length < 3) return;
    const [fx, fy] = pts[pts.length - 1];
    const abre = 0.35 + azar() * 0.35;
    crecer(fx, fy, ang - abre, grosor * 0.74, largo * 0.78, nivel + 1);
    crecer(fx, fy, ang + abre * 0.8, grosor * 0.66, largo * 0.70, nivel + 1);
    if (azar() < 0.35) {
      const [mx, my] = pts[Math.floor(pts.length / 2)];
      crecer(mx, my, ang + (azar() < 0.5 ? -1 : 1) * 1.1, grosor * 0.5, largo * 0.5, nivel + 2);
    }
  }
  [[-0.55, 15], [0.55, 15], [-1.2, 11], [1.2, 11], [-2.4, 8], [2.5, 8], [3.14, 7], [0.05, 7]]
    .forEach(([a, g]) => crecer(disco.x, disco.y, a, g, R * 0.42, 0));

  function trazos(color, factor) {
    ctx.strokeStyle = color; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ramas.forEach(r => {
      ctx.lineWidth = r.grosor * factor; ctx.beginPath();
      r.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    });
  }

  let corte = 0.5, objetivo = 0.5, crec = 0, animando = false;
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducido) crec = 1;

  function dibujar() {
    ctx.clearRect(0, 0, W, W);
    ctx.save(); ctx.beginPath(); ctx.arc(C, C, R, 0, 2 * Math.PI); ctx.clip();

    // Izquierda: imagen de fondo de ojo
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * corte, W); ctx.clip();
    const g = ctx.createRadialGradient(C + R * 0.1, C - R * 0.1, R * 0.1, C, C, R);
    g.addColorStop(0, "#f59a54"); g.addColorStop(0.6, "#c4502a"); g.addColorStop(1, "#5c1a0f");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
    const m = ctx.createRadialGradient(C + R * 0.25, C + R * 0.02, 0, C + R * 0.25, C + R * 0.02, R * 0.22);
    m.addColorStop(0, "rgba(70,20,10,.55)"); m.addColorStop(1, "rgba(70,20,10,0)");
    ctx.fillStyle = m; ctx.fillRect(0, 0, W, W);
    ctx.globalAlpha = Math.min(1, crec * 1.5);
    trazos("rgba(110,20,14,.85)", 1.15);
    ctx.globalAlpha = 1;
    const d = ctx.createRadialGradient(disco.x, disco.y, 0, disco.x, disco.y, R * 0.13);
    d.addColorStop(0, "#fff4d6"); d.addColorStop(0.55, "#ffd08a"); d.addColorStop(1, "rgba(255,190,110,0)");
    ctx.fillStyle = d; ctx.beginPath(); ctx.arc(disco.x, disco.y, R * 0.13, 0, 2 * Math.PI); ctx.fill();
    ctx.restore();

    // Derecha: máscara de segmentación
    ctx.save(); ctx.beginPath(); ctx.rect(W * corte, 0, W, W); ctx.clip();
    ctx.fillStyle = "#05080f"; ctx.fillRect(0, 0, W, W);
    ctx.globalAlpha = Math.min(1, crec * 1.5);
    ctx.shadowColor = "rgba(94,234,212,.6)"; ctx.shadowBlur = 10;
    trazos("#e8fffb", 1.0);
    ctx.restore();
    ctx.restore();

    // Borde y divisor
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.beginPath(); ctx.arc(C, C, R, 0, 2 * Math.PI); ctx.stroke();
    const xd = W * corte, dy = Math.sqrt(Math.max(0, R * R - (xd - C) ** 2));
    ctx.strokeStyle = "#5eead4"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(xd, C - dy); ctx.lineTo(xd, C + dy); ctx.stroke();
    ctx.fillStyle = "#5eead4"; ctx.beginPath(); ctx.arc(xd, C, 13, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = "#0a0f1e"; ctx.font = "bold 15px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("↔", xd, C + 1);
  }

  function paso() {
    crec = Math.min(1, crec + 0.012);
    corte += (objetivo - corte) * 0.12;
    dibujar();
    if (crec < 1 || Math.abs(objetivo - corte) > 0.0005) requestAnimationFrame(paso);
    else animando = false;
  }
  function animar() { if (!animando) { animando = true; requestAnimationFrame(paso); } }

  const mover = x => {
    const r = lienzo.getBoundingClientRect();
    objetivo = Math.min(0.9, Math.max(0.1, (x - r.left) / r.width));
    animar();
  };
  lienzo.addEventListener("pointermove", e => mover(e.clientX));
  lienzo.addEventListener("pointerdown", e => mover(e.clientX));
  lienzo.addEventListener("pointerleave", () => { objetivo = 0.5; animar(); });

  dibujar();
  animar();
})();
