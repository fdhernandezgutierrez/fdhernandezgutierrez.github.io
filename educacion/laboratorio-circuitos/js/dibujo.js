/* ==========================================================================
   dibujo.js — dibuja un esquemático como SVG (misma geometría que la app).
   Opcional: tocar nodos o componentes, resaltar terminales y elementos.
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function (G) {
  "use strict";
  const LAB = (G.LAB = G.LAB || {});
  const { limites, centro, offEtiqueta, offMarcaV, offMarcaI, OPUESTO, clave } = LAB;

  const COL = { cable: "#2B3445", elemento: "#14286B", tinta: "#1B2333", nodo: "#1F3A93", malla: "#00838F", marcaV: "#6A1B9A", marcaI: "#E65100", A: "#D81B60", B: "#1E88E5" };
  const U = 40;
  const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const f = x => (Math.round(x * 100) / 100).toString();

  function distanciaSegmento(px, py, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - a.x) * dx + (py - a.y) * dy) / l2));
    return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
  }
  /** Nodo más cercano a un toque (unidades de rejilla). */
  function nodoCercano(c, gx, gy) {
    let mejor = null, dmin = 0.8;
    for (const [k, n] of c.nodoDe) {
      const [x, y] = k.split(",").map(Number);
      const d = Math.hypot(x - gx, y - gy);
      if (d < dmin) { dmin = d; mejor = n; }
    }
    for (const cab of c.esquema.cables) for (let i = 1; i < cab.puntos.length; i++) {
      const d = distanciaSegmento(gx, gy, cab.puntos[i - 1], cab.puntos[i]);
      if (d < dmin) { dmin = d; mejor = c.nodoP(cab.puntos[0]); }
    }
    return mejor;
  }
  /** Componente visible más cercano a un toque. */
  function componenteCercano(c, gx, gy) {
    let mejor = null, dmin = 0.75;
    for (const comp of c.esquema.componentes) {
      if (!comp.visible) continue;
      const d = distanciaSegmento(gx, gy, comp.a, comp.b);
      if (d < dmin) { dmin = d; mejor = comp.nombre; }
    }
    return mejor;
  }

  /**
   * Devuelve un <div class="esquema"> con el SVG.
   * opciones: { mallas = true, nodoA, nodoB, resaltados: {nombre: color}, alTocarNodo(n), alTocarComponente(nombre), titulo }
   */
  function dibujarEsquema(c, opciones = {}) {
    const { mallas = true, nodoA = null, nodoB = null, resaltados = {}, alTocarNodo = null, alTocarComponente = null } = opciones;
    const lim = limites(c);
    const fs = 0.48 * U;
    const e = c.esquema;
    const X = v => f((v - lim.x0) * U), Y = v => f((v - lim.y0) * U);
    let s = "";
    const linea = (x1, y1, x2, y2, color = COL.elemento, w = 2.6) =>
      (s += `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${color}" stroke-width="${f(w)}" stroke-linecap="round"/>`);
    const texto = (t, lado, cx, cy, off, color = COL.tinta, extra = "") => {
      let ax = cx, ay = cy, ancla = "middle", base = "central";
      if (lado === "DERECHA") { ax = cx + off; ancla = "start"; }
      else if (lado === "IZQUIERDA") { ax = cx - off; ancla = "end"; }
      else if (lado === "ARRIBA") { ay = cy - off; base = "text-after-edge"; }
      else { ay = cy + off; base = "text-before-edge"; }
      s += `<text x="${X(ax)}" y="${Y(ay)}" text-anchor="${ancla}" dominant-baseline="${base}" font-size="${f(fs)}" fill="${color}" ${extra}>${esc(t)}</text>`;
    };
    const colorNodo = n => (n === null || n === undefined ? null : n === nodoA ? COL.A : n === nodoB ? COL.B : null);
    const pts = arr => arr.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ");

    // Cables (los de las terminales elegidas, resaltados).
    for (const cab of e.cables) {
      const res = colorNodo(c.nodoP(cab.puntos[0]));
      for (let i = 1; i < cab.puntos.length; i++) {
        const a = cab.puntos[i - 1], b = cab.puntos[i];
        linea(a.x, a.y, b.x, b.y, res || COL.cable, res ? 2.6 * 1.9 : 2.6);
      }
    }
    for (const comp of e.componentes) {
      if (!comp.visible) continue;
      const color = resaltados[comp.nombre] || COL.elemento;
      const gr = resaltados[comp.nombre] ? 2.6 * 1.7 : 2.6;
      const ax = comp.a.x, ay = comp.a.y, bx = comp.b.x, by = comp.b.y;
      const l = Math.hypot(bx - ax, by - ay);
      const dx = (bx - ax) / l, dy = (by - ay) / l, nx = -dy, ny = dx;
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const medio = { RESISTOR: 0.5, INDUCTOR: 0.5, CAJA: 0.5, CAPACITOR: 0.12, FUENTE_V: 0.42, FUENTE_I: 0.42, DEP_V: 0.47, DEP_I: 0.47 }[comp.simbolo];
      const s1x = mx - dx * medio, s1y = my - dy * medio, s2x = mx + dx * medio, s2y = my + dy * medio;
      const cabA = colorNodo(c.nodoP(comp.a)), cabB = colorNodo(c.nodoP(comp.b));
      linea(ax, ay, s1x, s1y, cabA || COL.elemento, cabA ? 2.6 * 1.9 : gr);
      linea(s2x, s2y, bx, by, cabB || COL.elemento, cabB ? 2.6 * 1.9 : gr);
      s += `<g data-elemento="${esc(comp.nombre)}">`;
      if (comp.simbolo === "RESISTOR") {
        const p = [[s1x, s1y]];
        for (let k = 1; k <= 6; k++) {
          const t = (k - 0.5) / 6 * 2 * medio, sg = k % 2 === 1 ? 0.2 : -0.2;
          p.push([s1x + dx * t + nx * sg, s1y + dy * t + ny * sg]);
        }
        p.push([s2x, s2y]);
        s += `<polyline fill="none" stroke="${color}" stroke-width="${f(gr)}" stroke-linejoin="round" points="${pts(p)}"/>`;
      } else if (comp.simbolo === "INDUCTOR") {
        const r = 2 * medio / 8, p = [];
        for (let k = 0; k < 4; k++) {
          const cx = s1x + dx * r * (2 * k + 1), cy = s1y + dy * r * (2 * k + 1);
          for (let j = 0; j <= 12; j++) {
            const phi = Math.PI * j / 12;
            p.push([cx - dx * r * Math.cos(phi) - nx * r * Math.sin(phi), cy - dy * r * Math.cos(phi) - ny * r * Math.sin(phi)]);
          }
        }
        s += `<polyline fill="none" stroke="${color}" stroke-width="${f(gr)}" points="${pts(p)}"/>`;
      } else if (comp.simbolo === "CAPACITOR") {
        for (const [px, py] of [[s1x, s1y], [s2x, s2y]]) linea(px - nx * 0.38, py - ny * 0.38, px + nx * 0.38, py + ny * 0.38, color, gr * 1.3);
      } else if (comp.simbolo === "CAJA") {
        const hh = 0.32;
        s += `<polygon fill="#F1F4FB" stroke="${color}" stroke-width="${f(gr)}" points="${pts([[s1x + nx * hh, s1y + ny * hh], [s2x + nx * hh, s2y + ny * hh], [s2x - nx * hh, s2y - ny * hh], [s1x - nx * hh, s1y - ny * hh]])}"/>`;
      } else if (comp.simbolo === "FUENTE_V" || comp.simbolo === "FUENTE_I") {
        s += `<circle cx="${X(mx)}" cy="${Y(my)}" r="${f(medio * U)}" fill="#fff" stroke="${color}" stroke-width="${f(gr)}"/>`;
      } else {
        s += `<polygon fill="#fff" stroke="${color}" stroke-width="${f(gr)}" points="${pts([[mx + dx * medio, my + dy * medio], [mx + nx * medio, my + ny * medio], [mx - dx * medio, my - dy * medio], [mx - nx * medio, my - ny * medio]])}"/>`;
      }
      if (comp.simbolo === "FUENTE_V" || comp.simbolo === "DEP_V") {
        const h = 0.09;
        const px = mx - dx * 0.45 * medio, py = my - dy * 0.45 * medio, qx = mx + dx * 0.45 * medio, qy = my + dy * 0.45 * medio;
        linea(px - h, py, px + h, py, color, 2); linea(px, py - h, px, py + h, color, 2); linea(qx - h, qy, qx + h, qy, color, 2);
      }
      if (comp.simbolo === "FUENTE_I" || comp.simbolo === "DEP_I") {
        const ix = mx - dx * 0.55 * medio, iy = my - dy * 0.55 * medio, fx = mx + dx * 0.55 * medio, fy = my + dy * 0.55 * medio;
        linea(ix, iy, fx, fy, color);
        linea(fx, fy, fx - dx * 0.16 + nx * 0.11, fy - dy * 0.16 + ny * 0.11, color);
        linea(fx, fy, fx - dx * 0.16 - nx * 0.11, fy - dy * 0.16 - ny * 0.11, color);
      }
      s += "</g>";
      const [cx, cy] = centro(comp);
      texto(comp.etiqueta, comp.ladoEtiqueta, cx, cy, offEtiqueta(comp.simbolo), resaltados[comp.nombre] || COL.tinta,
        resaltados[comp.nombre] ? 'font-weight="700"' : "");
    }
    for (const am of e.amps) {
      const xi = am.menos.x + 0.6;
      const ya = Math.min(am.menos.y, am.mas.y) - 0.7, yb = Math.max(am.menos.y, am.mas.y) + 0.7;
      const px = am.salida.x - 0.6, py = am.salida.y;
      s += `<polygon fill="#fff" stroke="${COL.elemento}" stroke-width="2.6" points="${pts([[xi, ya], [xi, yb], [px, py]])}"/>`;
      for (const p of [am.menos, am.mas]) linea(p.x, p.y, xi, p.y);
      linea(px, py, am.salida.x, py);
      linea(xi + 0.21, am.menos.y, xi + 0.43, am.menos.y);
      linea(xi + 0.21, am.mas.y, xi + 0.43, am.mas.y);
      linea(xi + 0.32, am.mas.y - 0.11, xi + 0.32, am.mas.y + 0.11);
    }
    for (const p of c.uniones) s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${f(0.09 * U)}" fill="${colorNodo(c.nodoP(p)) || COL.cable}"/>`;
    for (const p of e.tierras) {
      linea(p.x, p.y, p.x, p.y + 0.35, COL.cable);
      [0.28, 0.18, 0.08].forEach((w, i) => linea(p.x - w, p.y + 0.35 + 0.12 * i, p.x + w, p.y + 0.35 + 0.12 * i, COL.cable));
    }
    for (const t of e.terminales) {
      const col = colorNodo(c.nodoP(t.p)) || COL.cable;
      s += `<circle cx="${X(t.p.x)}" cy="${Y(t.p.y)}" r="${f(0.14 * U)}" fill="#fff" stroke="${col}" stroke-width="2.6"/>`;
      texto(t.texto, t.lado, t.p.x, t.p.y, 0.25, colorNodo(c.nodoP(t.p)) || COL.tinta, 'font-style="italic" font-weight="700"');
    }
    for (const et of e.etiquetas) {
      const col = colorNodo(c.nodoP(et.p)) || COL.nodo;
      s += `<circle cx="${X(et.p.x)}" cy="${Y(et.p.y)}" r="${f((colorNodo(c.nodoP(et.p)) ? 0.13 : 0.08) * U)}" fill="${col}"/>`;
      texto(et.texto, et.lado, et.p.x, et.p.y, 0.2, col, 'font-style="italic" font-weight="700"');
    }
    if (mallas) for (const m of e.mallas) {
      const r = 0.42;
      const pt = gr => [m.cx + r * Math.cos(gr * Math.PI / 180), m.cy + r * Math.sin(gr * Math.PI / 180)];
      const [x1, y1] = pt(-60), [x2, y2] = pt(240);
      s += `<path d="M ${X(x1)} ${Y(y1)} A ${f(r * U)} ${f(r * U)} 0 1 1 ${X(x2)} ${Y(y2)}" fill="none" stroke="${COL.malla}" stroke-width="2.6"/>`;
      const th = 240 * Math.PI / 180, tx = -Math.sin(th), ty = Math.cos(th), rx = Math.cos(th), ry = Math.sin(th);
      linea(x2, y2, x2 - tx * 0.18 + rx * 0.12, y2 - ty * 0.18 + ry * 0.12, COL.malla);
      linea(x2, y2, x2 - tx * 0.18 - rx * 0.12, y2 - ty * 0.18 - ry * 0.12, COL.malla);
      s += `<text x="${X(m.cx)}" y="${Y(m.cy)}" text-anchor="middle" dominant-baseline="central" font-size="${f(fs)}" fill="${COL.malla}" font-style="italic" font-weight="700">${esc(m.nombre)}</text>`;
    }
    const porNombre = new Map(e.componentes.map(x => [x.nombre, x]));
    for (const mv of e.marcasV) {
      const comp = porNombre.get(mv.elemento);
      if (!comp) continue;
      const [cx, cy] = centro(comp);
      const lado = mv.lado || OPUESTO[comp.ladoEtiqueta];
      const dxg = comp.b.x - comp.a.x, dyg = comp.b.y - comp.a.y, lg = Math.hypot(dxg, dyg);
      const sg = mv.invertida ? -1 : 1, sep = Math.max(0.62, lg / 2 - 0.35), off = offMarcaV(comp.simbolo);
      texto("+", lado, cx - sg * dxg / lg * sep, cy - sg * dyg / lg * sep, off, COL.marcaV, 'font-weight="700"');
      texto("−", lado, cx + sg * dxg / lg * sep, cy + sg * dyg / lg * sep, off, COL.marcaV, 'font-weight="700"');
      texto(mv.texto, lado, cx, cy, off, COL.marcaV, 'font-style="italic" font-weight="700"');
    }
    for (const mi of e.marcasI) {
      const comp = porNombre.get(mi.elemento);
      if (!comp) continue;
      const [cx, cy] = centro(comp);
      const lado = mi.lado || OPUESTO[comp.ladoEtiqueta];
      const [ox, oy] = { IZQUIERDA: [-1, 0], DERECHA: [1, 0], ARRIBA: [0, -1], ABAJO: [0, 1] }[lado];
      const dxg = comp.b.x - comp.a.x, dyg = comp.b.y - comp.a.y, lg = Math.hypot(dxg, dyg);
      const sgi = mi.invertida ? -1 : 1, dx = sgi * dxg / lg, dy = sgi * dyg / lg, nx = -dy, ny = dx;
      const om = offMarcaI(comp.simbolo), bx = cx + ox * om, by = cy + oy * om;
      linea(bx - dx * 0.35, by - dy * 0.35, bx + dx * 0.35, by + dy * 0.35, COL.marcaI);
      const fx = bx + dx * 0.35, fy = by + dy * 0.35;
      linea(fx, fy, fx - dx * 0.16 + nx * 0.11, fy - dy * 0.16 + ny * 0.11, COL.marcaI);
      linea(fx, fy, fx - dx * 0.16 - nx * 0.11, fy - dy * 0.16 - ny * 0.11, COL.marcaI);
      texto(mi.texto, lado, bx, by, 0.18, COL.marcaI, 'font-style="italic" font-weight="700"');
    }

    const ancho = lim.ancho * U, alto = lim.alto * U;
    const cont = document.createElement("div");
    cont.className = "esquema" + (alTocarNodo || alTocarComponente ? " tocable" : "");
    cont.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(ancho)} ${f(alto)}" font-family="Inter, Roboto, Arial, sans-serif" role="img" aria-label="${esc(opciones.titulo || "Diagrama del circuito")}">${s}</svg>`;
    if (alTocarNodo || alTocarComponente) {
      const svg = cont.firstChild;
      svg.addEventListener("click", ev => {
        const caja = svg.getBoundingClientRect();
        const gx = (ev.clientX - caja.left) / caja.width * lim.ancho + lim.x0;
        const gy = (ev.clientY - caja.top) / caja.height * lim.alto + lim.y0;
        if (alTocarComponente) { const n = componenteCercano(c, gx, gy); if (n) { alTocarComponente(n); return; } }
        if (alTocarNodo) { const n = nodoCercano(c, gx, gy); if (n !== null) alTocarNodo(n); }
      });
    }
    return cont;
  }

  Object.assign(LAB, { dibujarEsquema, COLORES_ESQUEMA: COL });
})(window);
