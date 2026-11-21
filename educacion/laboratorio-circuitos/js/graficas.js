/* ==========================================================================
   graficas.js — gráficas en SVG: x–y con cuadrícula, plano s, diagrama
   fasorial y triángulo de potencia (equivalentes a los de la app).
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function (G) {
  "use strict";
  const LAB = (G.LAB = G.LAB || {});
  const { fmt, Complejo } = LAB;
  const C = { azul: "#1F3A93", gris: "#667085", borde: "#D0D5DD", tinta: "#1B2333", morado: "#6A1B9A", rojo: "#C62828", naranja: "#E65100" };
  const r2 = x => Math.round(x * 100) / 100;
  const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  function contenedor(svg, etiqueta) {
    const d = document.createElement("div");
    d.className = "lab-grafica";
    d.innerHTML = svg.replace("<svg ", `<svg role="img" aria-label="${esc(etiqueta)}" `);
    return d;
  }

  /** Marcas «redondas» (1, 2 o 5 × 10ⁿ) entre min y max. */
  function marcas(min, max, objetivo = 5) {
    const rango = max - min;
    if (!(rango > 0) || !Number.isFinite(rango)) return [min];
    const crudo = rango / objetivo;
    const mag = Math.pow(10, Math.floor(Math.log10(crudo)));
    const n = crudo / mag;
    const paso = mag * (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10);
    const r = [];
    for (let v = Math.ceil(min / paso - 1e-9) * paso; v <= max + paso * 1e-9; v += paso) r.push(Math.abs(v) < paso * 1e-9 ? 0 : v);
    return r;
  }

  /**
   * Gráfica x–y. series: [{x, y, color, discontinua}]; o.verticales: [[x, color]]; o.puntos: [[x, y, color]].
   */
  function Grafica(series, etiquetaX, etiquetaY, o = {}) {
    const W = 600, H = o.alto || 260, izq = 64, abajo = 30, arriba = 26, der = 14;
    const w = W - izq - der, h = H - abajo - arriba;
    const xs = series.flatMap(s => Array.from(s.x));
    const ys = series.flatMap(s => Array.from(s.y)).concat((o.puntos || []).map(p => p[1]), [0]);
    let s = "";
    if (xs.length) {
      const x0 = Math.min(...xs), x1 = Math.max(Math.max(...xs), x0 + 1e-12);
      let y0 = Math.min(...ys), y1 = Math.max(...ys);
      if (o.yMin !== undefined) y0 = Math.min(y0, o.yMin);
      if (o.yMax !== undefined) y1 = Math.max(y1, o.yMax);
      if (y1 - y0 < 1e-12) { y0 -= 1; y1 += 1; }
      const m = (y1 - y0) * 0.08; y0 -= m; y1 += m;
      const px = x => r2(izq + (x - x0) / (x1 - x0) * w), py = y => r2(arriba + (y1 - y) / (y1 - y0) * h);
      for (const t of marcas(y0, y1)) {
        const y = py(t);
        s += `<line x1="${izq}" y1="${y}" x2="${izq + w}" y2="${y}" stroke="${t === 0 ? C.gris : C.borde}" stroke-width="${t === 0 ? 1.5 : 1}"/>`;
        s += `<text x="${izq - 5}" y="${y}" text-anchor="end" dominant-baseline="central" font-size="15" fill="${C.gris}">${esc(fmt(t, 3))}</text>`;
      }
      for (const t of marcas(x0, x1)) {
        const x = px(t);
        s += `<line x1="${x}" y1="${arriba}" x2="${x}" y2="${arriba + h}" stroke="${C.borde}"/>`;
        s += `<text x="${x}" y="${arriba + h + 19}" text-anchor="middle" font-size="15" fill="${C.gris}">${esc(fmt(t, 3))}</text>`;
      }
      s += `<line x1="${izq}" y1="${arriba}" x2="${izq}" y2="${arriba + h}" stroke="${C.gris}" stroke-width="1.5"/>`;
      for (const [xv, color] of o.verticales || []) {
        if (xv < x0 || xv > x1) continue;
        s += `<line x1="${px(xv)}" y1="${arriba}" x2="${px(xv)}" y2="${arriba + h}" stroke="${color}" stroke-width="2" stroke-dasharray="7 6"/>`;
      }
      for (const [yv, color] of o.horizontales || []) {
        if (yv < y0 || yv > y1) continue;
        s += `<line x1="${izq}" y1="${py(yv)}" x2="${izq + w}" y2="${py(yv)}" stroke="${color}" stroke-width="1.6" stroke-dasharray="7 6"/>`;
      }
      for (const se of series) {
        let d = "";
        for (let i = 0; i < se.x.length; i++) d += (i ? "L" : "M") + px(se.x[i]) + " " + py(se.y[i]);
        s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="2.6" stroke-linejoin="round"${se.discontinua ? ' stroke-dasharray="9 7"' : ""}/>`;
      }
      for (const [xv, yv, color] of o.puntos || []) s += `<circle cx="${px(xv)}" cy="${py(yv)}" r="6" fill="#fff" stroke="${color}" stroke-width="2.6"/>`;
      s += `<text x="${izq + 5}" y="17" font-size="16" font-style="italic" fill="${C.tinta}">${esc(etiquetaY)}</text>`;
      s += `<text x="${izq + w}" y="${arriba + h - 5}" text-anchor="end" font-size="16" font-style="italic" fill="${C.tinta}">${esc(etiquetaX)}</text>`;
    }
    return contenedor(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Inter, Roboto, Arial, sans-serif">${s}</svg>`,
      o.titulo || `Gráfica de ${etiquetaY} contra ${etiquetaX}`);
  }

  /** Plano s: ejes σ y jω, circunferencia de radio ω0, lugar de las raíces (puntos tenues) y raíces actuales (×). */
  function PlanoS(raices, omega0, lugar) {
    const W = 600, H = 290;
    const alcX = Math.max(omega0, ...raices.map(z => Math.abs(z.re))) * 1.2;
    const alcY = Math.max(omega0, ...raices.map(z => Math.abs(z.im))) * 1.2;
    const k = Math.min(W / (alcX * 1.3), H / (2 * alcY));
    const ox = (W - alcX * 1.3 * k) / 2 + alcX * k, oy = H / 2;
    const p = z => [r2(ox + z.re * k), r2(oy - z.im * k)];
    let s = `<line x1="0" y1="${oy}" x2="${W}" y2="${oy}" stroke="${C.gris}" stroke-width="1.5"/><line x1="${r2(ox)}" y1="0" x2="${r2(ox)}" y2="${H}" stroke="${C.gris}" stroke-width="1.5"/>`;
    s += `<text x="${W - 4}" y="${oy + 16}" text-anchor="end" font-size="17" font-style="italic" fill="${C.gris}">σ</text><text x="${r2(ox) + 5}" y="14" font-size="17" font-style="italic" fill="${C.gris}">jω</text>`;
    s += `<circle cx="${r2(ox)}" cy="${oy}" r="${r2(omega0 * k)}" fill="none" stroke="${C.borde}" stroke-width="1.6" stroke-dasharray="7 7"/>`;
    s += `<text x="${r2(ox + omega0 * k * 0.71) + 6}" y="${r2(oy - omega0 * k * 0.71) - 6}" font-size="16" font-style="italic" fill="${C.gris}">ω0 = ${esc(fmt(omega0, 3))}</text>`;
    for (const z of lugar) { const [x, y] = p(z); if (x >= 0 && x <= W && y >= 0 && y <= H) s += `<circle cx="${x}" cy="${y}" r="2.4" fill="${C.morado}" fill-opacity=".22"/>`; }
    for (const z of raices) {
      const [x, y] = p(z), t = 7;
      s += `<path d="M${x - t} ${y - t}L${x + t} ${y + t}M${x - t} ${y + t}L${x + t} ${y - t}" stroke="${C.rojo}" stroke-width="3.4" stroke-linecap="round"/>`;
    }
    return contenedor(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Inter, Roboto, Arial, sans-serif">${s}</svg>`, "Plano s con las raíces de la ecuación característica");
  }

  /**
   * Diagrama fasorial; fasores: [{nombre, z, color, origen}]. Con giro ≠ 0 todos giran juntos (e^{jωt});
   * la proyección sobre el eje real (línea punteada) es el valor instantáneo.
   */
  function DiagramaFasorial(fasores, giro = 0, proyectar = []) {
    const W = 600, H = 330;
    const alcance = Math.max(...fasores.map(f => Math.max(f.origen.mas(f.z).modulo, f.origen.modulo, f.z.modulo))) || 1;
    const k = Math.min(W, H) / 2 * 0.85 / alcance;
    const cx = W / 2, cy = H / 2;
    const rot = new Complejo(Math.cos(giro), Math.sin(giro));
    const p = z => { const r = z.por(rot); return [cx + r.re * k, cy - r.im * k]; };
    let s = `<line x1="0" y1="${cy}" x2="${W}" y2="${cy}" stroke="${C.borde}" stroke-width="1.5"/><line x1="${cx}" y1="0" x2="${cx}" y2="${H}" stroke="${C.borde}" stroke-width="1.5"/>`;
    s += `<text x="${W - 6}" y="${cy + 16}" text-anchor="end" font-size="17" font-style="italic" fill="${C.gris}">Re</text><text x="${cx + 5}" y="14" font-size="17" font-style="italic" fill="${C.gris}">Im</text>`;
    for (const f of fasores) {
      const [ax, ay] = p(f.origen), [bx, by] = p(f.origen.mas(f.z));
      const largo = Math.hypot(bx - ax, by - ay);
      if (largo < 1) continue;
      const dx = (bx - ax) / largo, dy = (by - ay) / largo, nx = -dy, ny = dx, cab = Math.min(13, largo * 0.4);
      if (proyectar.includes(f.nombre)) {
        s += `<line x1="${r2(bx)}" y1="${r2(by)}" x2="${r2(bx)}" y2="${cy}" stroke="${f.color}" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="7 5"/>`;
        s += `<circle cx="${r2(bx)}" cy="${cy}" r="5" fill="${f.color}"/>`;
      }
      s += `<path d="M${r2(ax)} ${r2(ay)}L${r2(bx)} ${r2(by)}M${r2(bx)} ${r2(by)}L${r2(bx - dx * cab + nx * cab * 0.55)} ${r2(by - dy * cab + ny * cab * 0.55)}M${r2(bx)} ${r2(by)}L${r2(bx - dx * cab - nx * cab * 0.55)} ${r2(by - dy * cab - ny * cab * 0.55)}" stroke="${f.color}" stroke-width="3.2" stroke-linecap="round" fill="none"/>`;
      s += `<text x="${r2(bx + dx * 12 + nx * 6)}" y="${r2(by + dy * 12 + ny * 6)}" text-anchor="middle" dominant-baseline="central" font-size="17" font-style="italic" font-weight="700" fill="${f.color}">${esc(f.nombre)}</text>`;
    }
    return contenedor(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Inter, Roboto, Arial, sans-serif">${s}</svg>`, "Diagrama fasorial");
  }

  /** Triángulo de potencia: P horizontal, Q vertical (hacia arriba si es inductivo) y |S| la hipotenusa. */
  function TrianguloPotencia(p, q) {
    const W = 600, H = 210, margen = 40;
    const k = Math.min((W - 2 * margen - 260) / Math.max(Math.abs(p), 1e-12), (H - 2 * margen) / Math.max(Math.abs(q), 1e-12));
    const ancho = Math.abs(p) * k, alto = Math.abs(q) * k;
    const ox = (W - ancho) / 2, oy = q >= 0 ? (H + alto) / 2 : (H - alto) / 2;
    const fx = ox + ancho, fy = q >= 0 ? oy - alto : oy + alto;
    let s = `<path d="M${r2(ox)} ${r2(oy)}L${r2(fx)} ${r2(oy)}" stroke="${C.azul}" stroke-width="3.4"/>`;
    s += `<path d="M${r2(fx)} ${r2(oy)}L${r2(fx)} ${r2(fy)}" stroke="${C.naranja}" stroke-width="3.4"/>`;
    s += `<path d="M${r2(ox)} ${r2(oy)}L${r2(fx)} ${r2(fy)}" stroke="${C.morado}" stroke-width="3.4"/>`;
    s += `<text x="${r2(ox + ancho / 2)}" y="${r2(oy + (q >= 0 ? 18 : -8))}" text-anchor="middle" font-size="17" font-style="italic" fill="${C.azul}">P = ${esc(fmt(p, 3))} W</text>`;
    s += `<text x="${r2(fx + 8)}" y="${r2((oy + fy) / 2)}" dominant-baseline="central" font-size="17" font-style="italic" fill="${C.naranja}">Q = ${esc(fmt(q, 3))} VAR</text>`;
    s += `<text x="${r2((ox + fx) / 2 - 8)}" y="${r2((oy + fy) / 2)}" text-anchor="end" dominant-baseline="central" font-size="17" font-style="italic" fill="${C.morado}">|S| = ${esc(fmt(Math.hypot(p, q), 3))} VA</text>`;
    return contenedor(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Inter, Roboto, Arial, sans-serif">${s}</svg>`, "Triángulo de potencia");
  }

  /** Leyenda de colores bajo una gráfica: [[texto, color, discontinua]]. */
  function Leyenda(items) {
    const d = document.createElement("div");
    d.className = "lab-leyenda";
    d.innerHTML = items.map(([t, c, disc]) => `<span><i style="background:${disc ? `repeating-linear-gradient(90deg, ${c} 0 5px, transparent 5px 8px)` : c}"></i>${esc(t)}</span>`).join("");
    return d;
  }

  Object.assign(LAB, { marcas, Grafica, PlanoS, DiagramaFasorial, TrianguloPotencia, Leyenda, COLORES: C });
})(window);
