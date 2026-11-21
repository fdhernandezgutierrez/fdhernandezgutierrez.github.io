/* ==========================================================================
   esquema.js — esquemáticos sobre rejilla y generador reproducible.
   Los nodos se deducen solos de los cables, como en la app Android, y el
   generador replica java.util.Random para que el mismo número de problema
   dé el mismo circuito en la app y en la web.
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function (G) {
  "use strict";
  const LAB = (G.LAB = G.LAB || {});
  const { E, Circuito, fmt, fmtSI } = LAB;

  // ─────────────────────────── Generador (java.util.Random) ───────────────────────────
  const MULT = 0x5DEECE66Dn, SUMA = 0xBn, MASCARA = (1n << 48n) - 1n;

  class JavaRandom {
    constructor(semilla) { this.s = (BigInt(semilla) ^ MULT) & MASCARA; }
    siguiente(bits) {
      this.s = (this.s * MULT + SUMA) & MASCARA;
      return Number(BigInt.asIntN(32, this.s >> BigInt(48 - bits)));
    }
    nextInt(n) {
      if ((n & -n) === n) return Number((BigInt(n) * BigInt(this.siguiente(31))) >> 31n);
      let bits, val;
      do {
        bits = this.siguiente(31);
        val = bits % n;
      } while (bits - val + (n - 1) > 2147483647);
      return val;
    }
    nextBoolean() { return this.siguiente(1) !== 0; }
    nextDouble() { return (this.siguiente(26) * 134217728 + this.siguiente(27)) / 9007199254740992; }
  }

  const RESISTENCIAS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40];
  const VOLTAJES = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30];
  const CORRIENTES = [0.5, 1, 1.5, 2, 3, 4, 5, 6];

  /** Generador reproducible: la misma semilla da siempre el mismo problema. */
  class Azar {
    constructor(semilla) { this.r = new JavaRandom(semilla); }
    de(xs) { return xs[this.r.nextInt(xs.length)]; }
    moneda() { return this.r.nextBoolean(); }
    entero(n) { return this.r.nextInt(n); }
    resistencia() { return this.de(RESISTENCIAS); }
    voltaje() { return this.de(VOLTAJES); }
    corriente() { return this.de(CORRIENTES); }
  }

  /** Siguiente semilla al reintentar un problema mal condicionado (aritmética de Long). */
  const siguienteSemilla = s => BigInt.asIntN(64, BigInt(s) * 6364136223846793005n + 1442695040888963407n);
  /** Semilla de 6 cifras, fácil de dictar en clase. */
  const semillaNueva = () => 100000 + Math.floor(Math.random() * 900000);

  // ─────────────────────────── Esquemático ───────────────────────────
  const P = (x, y) => ({ x, y });
  const k = p => p.x + "," + p.y;

  /**
   * Esquemático sobre una rejilla (x a la derecha, y hacia abajo). Todo lo unido por cables es el
   * mismo nodo: cada plantilla se escribe una sola vez y sirve para dibujar y para calcular.
   * Los parámetros opcionales van en un objeto: { lado, etiqueta }.
   */
  class Esquema {
    constructor() {
      this.componentes = []; this.cables = []; this.etiquetas = []; this.terminales = [];
      this.mallas = []; this.marcasV = []; this.marcasI = []; this.tierras = []; this.amps = [];
    }
    _comp(nombre, a, b, simbolo, etiqueta, lado, crear, visible = true) {
      const vertical = a.x === b.x;
      this.componentes.push({
        nombre, a, b, simbolo, etiqueta, lado: lado || null, visible, crear, vertical,
        ladoEtiqueta: lado || (vertical ? "DERECHA" : "ARRIBA"),
      });
    }
    cable(...puntos) { this.cables.push({ puntos }); }
    /** Amp. op. con la entrada − en (x, y), la + en (x, y + 2) y la salida en (x + 4, y + 1). */
    ampOp(nombre, x, y, menosArriba = true) {
      const arriba = P(x, y), abajo = P(x, y + 2), salida = P(x + 4, y + 1);
      this.amps.push(menosArriba ? { nombre, menos: arriba, mas: abajo, salida } : { nombre, menos: abajo, mas: arriba, salida });
    }
    /** Terminal de entrada con voltaje fijo respecto a [tierra] (la fuente no se dibuja). */
    entrada(nombre, p, v, tierra, texto, lado = "IZQUIERDA") {
      this.terminal(p, texto, lado);
      this._comp(nombre, p, tierra, "FUENTE_V", texto, null, (na, nb) => E.fuenteV(nombre, na, nb, v), false);
    }
    resistor(nombre, a, b, r, o = {}) {
      this._comp(nombre, a, b, "RESISTOR", o.etiqueta ?? `${fmt(r)} Ω`, o.lado, (na, nb) => E.resistor(nombre, na, nb, r));
    }
    /** Fuente de voltaje con + en [a]. */
    fuenteV(nombre, a, b, v, o = {}) {
      this._comp(nombre, a, b, "FUENTE_V", o.etiqueta ?? `${fmt(v)} V`, o.lado, (na, nb) => E.fuenteV(nombre, na, nb, v));
    }
    /** Fuente de corriente con la flecha apuntando hacia [b]. */
    fuenteI(nombre, a, b, i, o = {}) {
      this._comp(nombre, a, b, "FUENTE_I", o.etiqueta ?? `${fmt(i)} A`, o.lado, (na, nb) => E.fuenteI(nombre, na, nb, i));
    }
    dependienteV(nombre, a, b, control, ganancia, etiqueta, o = {}) {
      this._comp(nombre, a, b, "DEP_V", etiqueta, o.lado, (na, nb) => E.dependiente(nombre, na, nb, "VOLTAJE", control, ganancia, etiqueta));
    }
    dependienteI(nombre, a, b, control, ganancia, etiqueta, o = {}) {
      this._comp(nombre, a, b, "DEP_I", etiqueta, o.lado, (na, nb) => E.dependiente(nombre, na, nb, "CORRIENTE", control, ganancia, etiqueta));
    }
    capacitor(nombre, a, b, c, o = {}) {
      this._comp(nombre, a, b, "CAPACITOR", o.etiqueta ?? fmtSI(c, "F"), o.lado, (na, nb) => E.capacitor(nombre, na, nb, c, o.v0 || 0));
    }
    inductor(nombre, a, b, l, o = {}) {
      this._comp(nombre, a, b, "INDUCTOR", o.etiqueta ?? fmtSI(l, "H"), o.lado, (na, nb) => E.inductor(nombre, na, nb, l, o.i0 || 0));
    }
    /** Elemento genérico (caja): solo se dibuja; eléctricamente es una resistencia de 1 Ω. */
    caja(nombre, a, b, etiqueta, o = {}) {
      this._comp(nombre, a, b, "CAJA", etiqueta, o.lado, (na, nb) => E.resistor(nombre, na, nb, 1));
    }
    tierra(p) { this.tierras.push(p); }
    nodo(p, texto, numero = null, lado = "ARRIBA") { this.etiquetas.push({ p, texto, numero, lado }); }
    terminal(p, texto, lado = "DERECHA") { this.terminales.push({ p, texto, lado }); }
    malla(cx, cy, nombre, ...elementos) { this.mallas.push({ cx, cy, nombre, elementos }); }
    marcaVoltaje(elemento, texto, o = {}) { this.marcasV.push({ elemento, texto, invertida: !!o.invertida, lado: o.lado || null }); }
    marcaCorriente(elemento, texto, o = {}) { this.marcasI.push({ elemento, texto, invertida: !!o.invertida, lado: o.lado || null }); }
    construir() { return construirEsquema(this); }
  }

  function enInterior(p, s, t) {
    return (s.x === t.x && p.x === s.x && p.y > Math.min(s.y, t.y) && p.y < Math.max(s.y, t.y)) ||
      (s.y === t.y && p.y === s.y && p.x > Math.min(s.x, t.x) && p.x < Math.max(s.x, t.x));
  }

  function construirEsquema(e) {
    const padre = new Map();     // clave → clave (en orden de registro, como LinkedHashMap)
    const punto = new Map();     // clave → P
    const registrar = p => { const kk = k(p); if (!padre.has(kk)) { padre.set(kk, kk); punto.set(kk, p); } };
    const raiz = kk => { let r = kk; while (padre.get(r) !== r) r = padre.get(r); return r; };
    const unir = (p, q) => {
      registrar(p); registrar(q);
      const rp = raiz(k(p)), rq = raiz(k(q));
      if (rp !== rq) padre.set(rp, rq);
    };

    const conexiones = [];
    for (const c of e.componentes) { registrar(c.a); registrar(c.b); conexiones.push(c.a, c.b); }
    for (const c of e.cables) {
      c.puntos.forEach(registrar);
      for (let i = 1; i < c.puntos.length; i++) unir(c.puntos[i - 1], c.puntos[i]);
      conexiones.push(...c.puntos);
    }
    for (const am of e.amps) for (const p of [am.menos, am.mas, am.salida]) { registrar(p); conexiones.push(p); }
    for (const et of e.etiquetas) { registrar(et.p); conexiones.push(et.p); }
    for (const t of e.terminales) { registrar(t.p); conexiones.push(t.p); }
    for (const t of e.tierras) { registrar(t); conexiones.push(t); }

    // Un punto sobre el tramo interior de un cable queda conectado a ese cable (unión en «T»).
    const pasoInterior = new Map();
    const vistos = new Set();
    for (const p of conexiones) {
      if (vistos.has(k(p))) continue;
      vistos.add(k(p));
      for (const c of e.cables) for (let i = 1; i < c.puntos.length; i++) {
        if (enInterior(p, c.puntos[i - 1], c.puntos[i])) {
          unir(p, c.puntos[i - 1]);
          pasoInterior.set(k(p), (pasoInterior.get(k(p)) || 0) + 2);
        }
      }
    }

    const tierraVisible = e.tierras.length > 0;
    for (const t of e.tierras) unir(t, e.tierras[0]);
    const raizTierra = raiz(k(tierraVisible ? e.tierras[0] : e.componentes[0].b));

    const numero = new Map();
    numero.set(raizTierra, 0);
    for (const et of e.etiquetas) {
      if (et.numero === null || et.numero === undefined) continue;
      const r = raiz(k(et.p));
      const previo = numero.get(r);
      if (previo !== undefined && previo !== et.numero) throw new Error(`El nodo ${et.texto} tiene dos números`);
      numero.set(r, et.numero);
    }
    let siguiente = Math.max(...numero.values()) + 1;
    for (const kk of padre.keys()) {
      const r = raiz(kk);
      if (!numero.has(r)) numero.set(r, siguiente++);
    }
    const usados = new Set(numero.values());
    for (let i = 0; i < siguiente; i++) if (!usados.has(i)) throw new Error("Numeración de nodos con huecos");

    const nodoDe = new Map();
    for (const kk of padre.keys()) nodoDe.set(kk, numero.get(raiz(kk)));
    const nodoP = p => {
      const n = nodoDe.get(k(p));
      if (n === undefined) throw new Error("Punto sin nodo " + k(p));
      return n;
    };
    const nombres = new Map();
    for (const t of e.terminales) nombres.set(nodoP(t.p), t.texto);
    for (const et of e.etiquetas) nombres.set(nodoP(et.p), et.texto);

    const circuito = new Circuito(
      e.componentes.map(c => c.crear(nodoP(c.a), nodoP(c.b)))
        .concat(e.amps.map(am => E.ampOp(am.nombre, nodoP(am.mas), nodoP(am.menos), nodoP(am.salida)))),
    );

    // Puntos de unión: tres o más conductores llegan al mismo punto.
    const cuenta = new Map();
    const sumar = (p, n) => cuenta.set(k(p), (cuenta.get(k(p)) || 0) + n);
    for (const c of e.cables) c.puntos.forEach((p, i) => sumar(p, i === 0 || i === c.puntos.length - 1 ? 1 : 2));
    for (const c of e.componentes) if (c.visible) { sumar(c.a, 1); sumar(c.b, 1); }
    for (const am of e.amps) { sumar(am.menos, 1); sumar(am.mas, 1); sumar(am.salida, 1); }
    for (const [kk, n] of pasoInterior) cuenta.set(kk, (cuenta.get(kk) || 0) + n);
    const uniones = [...cuenta].filter(([, n]) => n >= 3).map(([kk]) => punto.get(kk));

    // Signo de cada elemento en su malla: +1 si la corriente horaria lo recorre de a hacia b.
    const porNombre = new Map(e.componentes.map(c => [c.nombre, c]));
    const mallas = e.mallas.map(m => {
      const signos = new Map();
      for (const nombre of m.elementos) {
        const c = porNombre.get(nombre);
        const mx = (c.a.x + c.b.x) / 2, my = (c.a.y + c.b.y) / 2;
        const tx = -(my - m.cy), ty = mx - m.cx;
        const producto = tx * (c.b.x - c.a.x) + ty * (c.b.y - c.a.y);
        if (Math.abs(producto) <= 1e-6) throw new Error(`No se puede orientar ${nombre} en ${m.nombre}`);
        signos.set(nombre, producto > 0 ? 1 : -1);
      }
      return { nombre: m.nombre, signos };
    });

    const todos = [...punto.values()];
    const construido = {
      esquema: e, circuito, nodoDe, nombres, uniones, mallas, tierraVisible,
      nodoP,
      nodoDeTerminal: texto => nodoP(e.terminales.find(t => t.texto === texto).p),
      variable: nodo => nombres.get(nodo) ?? "v" + nodo,
      nombreNodo: nodo => (nodo === 0 ? "tierra" : (nombres.get(nodo) ?? "v" + nodo).replace(/^v/, "")),
      minX: Math.min(...todos.map(p => p.x)), maxX: Math.max(...todos.map(p => p.x)),
      minY: Math.min(...todos.map(p => p.y)), maxY: Math.max(...todos.map(p => p.y)),
    };
    return construido;
  }

  // ─────────────────────────── Geometría (unidades de rejilla) ───────────────────────────
  const CHAR = 0.27, ALTO_TXT = 0.62;
  const anchoTxt = t => t.length * CHAR + 0.1;
  const OPUESTO = { ARRIBA: "ABAJO", ABAJO: "ARRIBA", IZQUIERDA: "DERECHA", DERECHA: "IZQUIERDA" };

  /** Esquina superior izquierda de un texto de w×h colocado a [off] del punto (cx, cy) hacia [lado]. */
  function esquina(cx, cy, lado, off, w, h) {
    switch (lado) {
      case "DERECHA": return [cx + off, cy - h / 2];
      case "IZQUIERDA": return [cx - off - w, cy - h / 2];
      case "ARRIBA": return [cx - w / 2, cy - off - h];
      default: return [cx - w / 2, cy + off];
    }
  }
  const ANCHO_MEDIO = { RESISTOR: 0.2, INDUCTOR: 0.15, CAJA: 0.32, CAPACITOR: 0.38, FUENTE_V: 0.42, FUENTE_I: 0.42, DEP_V: 0.47, DEP_I: 0.47 };
  const offEtiqueta = s => Math.max(0.45, ANCHO_MEDIO[s] + 0.18);
  const offMarcaV = s => Math.max(0.3, ANCHO_MEDIO[s] + 0.14);
  const offMarcaI = s => Math.max(0.42, ANCHO_MEDIO[s] + 0.22);
  const centro = c => [(c.a.x + c.b.x) / 2, (c.a.y + c.b.y) / 2];

  /** Caja que ocupa el dibujo, incluidas las etiquetas, para que nada se recorte. */
  function limites(c) {
    let x0 = c.minX, x1 = c.maxX, y0 = c.minY, y1 = c.maxY;
    const incluir = (l, t, w, h) => { x0 = Math.min(x0, l); y0 = Math.min(y0, t); x1 = Math.max(x1, l + w); y1 = Math.max(y1, t + h); };
    const e = c.esquema;
    const porNombre = new Map(e.componentes.map(x => [x.nombre, x]));
    for (const am of e.amps) {
      const ya = Math.min(am.menos.y, am.mas.y) - 0.8, yb = Math.max(am.menos.y, am.mas.y) + 0.8;
      incluir(am.menos.x, ya, am.salida.x - am.menos.x, yb - ya);
    }
    for (const comp of e.componentes) {
      if (!comp.visible) continue;
      const [cx, cy] = centro(comp);
      const w = anchoTxt(comp.etiqueta);
      const [l, t] = esquina(cx, cy, comp.ladoEtiqueta, offEtiqueta(comp.simbolo), w, ALTO_TXT);
      incluir(l, t, w, ALTO_TXT);
      incluir(cx - 0.55, cy - 0.55, 1.1, 1.1);
    }
    for (const m of e.marcasV.concat(e.marcasI)) {
      const comp = porNombre.get(m.elemento);
      if (!comp) continue;
      const [cx, cy] = centro(comp);
      const lado = m.lado || OPUESTO[comp.ladoEtiqueta];
      const w = anchoTxt(m.texto) + 0.3;
      const [l, t] = esquina(cx, cy, lado, offMarcaI(comp.simbolo), w, ALTO_TXT);
      if (comp.vertical) incluir(l, cy - 0.95, w, 1.9); else incluir(cx - Math.max(0.95, w / 2), t, Math.max(1.9, w), ALTO_TXT);
    }
    for (const p of e.tierras) incluir(p.x - 0.35, p.y, 0.7, 0.75);
    for (const t of e.terminales) {
      const w = anchoTxt(t.texto);
      const [l, tp] = esquina(t.p.x, t.p.y, t.lado, 0.25, w, ALTO_TXT);
      incluir(l, tp, w, ALTO_TXT);
    }
    for (const et of e.etiquetas) {
      const w = anchoTxt(et.texto);
      const [l, tp] = esquina(et.p.x, et.p.y, et.lado, 0.2, w, ALTO_TXT);
      incluir(l, tp, w, ALTO_TXT);
    }
    const pad = 0.3;
    return { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad, ancho: x1 - x0 + 2 * pad, alto: y1 - y0 + 2 * pad };
  }

  Object.assign(LAB, {
    JavaRandom, Azar, siguienteSemilla, semillaNueva, RESISTENCIAS, VOLTAJES, CORRIENTES,
    P, clave: k, Esquema, construirEsquema,
    CHAR, ALTO_TXT, anchoTxt, OPUESTO, esquina, ANCHO_MEDIO, offEtiqueta, offMarcaV, offMarcaI, centro, limites,
  });
})(typeof window !== "undefined" ? window : globalThis);
