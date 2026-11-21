/* ==========================================================================
   motor.js — motor de cálculo del Laboratorio de Circuitos (versión web).
   Traducción fiel del motor en Kotlin de la app Android: complejos, eliminación
   gaussiana, análisis nodal modificado (CD, CA fasorial, t = 0⁺ y pasos
   trapezoidales), Thévenin/superposición, segundo orden, lector de
   expresiones, revisión de sistemas, formato y planteamiento por nodos/mallas.
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function (G) {
  "use strict";
  const LAB = (G.LAB = G.LAB || {});

  // ─────────────────────────────── Complejos ───────────────────────────────
  class Complejo {
    constructor(re, im = 0) { this.re = re; this.im = im; }
    mas(o) { return new Complejo(this.re + o.re, this.im + o.im); }
    menos(o) { return new Complejo(this.re - o.re, this.im - o.im); }
    neg() { return new Complejo(-this.re, -this.im); }
    por(o) {
      if (typeof o === "number") return new Complejo(this.re * o, this.im * o);
      return new Complejo(this.re * o.re - this.im * o.im, this.re * o.im + this.im * o.re);
    }
    entre(o) {
      if (typeof o === "number") return new Complejo(this.re / o, this.im / o);
      const d = o.re * o.re + o.im * o.im;
      return new Complejo((this.re * o.re + this.im * o.im) / d, (this.im * o.re - this.re * o.im) / d);
    }
    conj() { return new Complejo(this.re, -this.im); }
    get modulo() { return Math.hypot(this.re, this.im); }
    get anguloGrados() { return Math.atan2(this.im, this.re) * 180 / Math.PI; }
    esCero(tol = 1e-300) { return this.modulo <= tol; }
    static polar(modulo, grados) {
      const r = grados * Math.PI / 180;
      return new Complejo(modulo * Math.cos(r), modulo * Math.sin(r));
    }
  }
  Complejo.CERO = new Complejo(0, 0);
  Complejo.UNO = new Complejo(1, 0);
  const cx = v => (v instanceof Complejo ? v : new Complejo(v, 0));

  // ─────────────────────────────── Álgebra ───────────────────────────────
  class SistemaSingular extends Error {
    constructor() { super("El sistema no tiene solución única."); this.name = "SistemaSingular"; }
  }

  /** Eliminación gaussiana con pivoteo parcial sobre complejos. No modifica los argumentos. */
  function resolverComplejo(aEntrada, bEntrada) {
    const n = bEntrada.length;
    if (n === 0) return [];
    const a = aEntrada.map(f => f.slice());
    const b = bEntrada.slice();
    let escala = 0;
    for (const fila of a) for (const z of fila) escala = Math.max(escala, z.modulo);
    if (escala === 0) throw new SistemaSingular();
    const tol = 1e-11 * escala;
    for (let k = 0; k < n; k++) {
      let p = k, mejor = a[k][k].modulo;
      for (let i = k + 1; i < n; i++) { const m = a[i][k].modulo; if (m > mejor) { mejor = m; p = i; } }
      if (mejor <= tol) throw new SistemaSingular();
      if (p !== k) { [a[p], a[k]] = [a[k], a[p]]; [b[p], b[k]] = [b[k], b[p]]; }
      for (let i = k + 1; i < n; i++) {
        if (a[i][k].esCero()) continue;
        const f = a[i][k].entre(a[k][k]);
        for (let j = k; j < n; j++) a[i][j] = a[i][j].menos(f.por(a[k][j]));
        b[i] = b[i].menos(f.por(b[k]));
      }
    }
    const x = new Array(n).fill(Complejo.CERO);
    for (let i = n - 1; i >= 0; i--) {
      let s = b[i];
      for (let j = i + 1; j < n; j++) s = s.menos(a[i][j].por(x[j]));
      x[i] = s.entre(a[i][i]);
    }
    return x;
  }

  /** Eliminación gaussiana con pivoteo parcial sobre reales. No modifica los argumentos. */
  function resolverReal(aEntrada, bEntrada) {
    const n = bEntrada.length;
    if (n === 0) return [];
    const a = aEntrada.map(f => Array.from(f));
    const b = Array.from(bEntrada);
    let escala = 0;
    for (const fila of a) for (const z of fila) escala = Math.max(escala, Math.abs(z));
    if (escala === 0) throw new SistemaSingular();
    const tol = 1e-11 * escala;
    for (let k = 0; k < n; k++) {
      let p = k, mejor = Math.abs(a[k][k]);
      for (let i = k + 1; i < n; i++) { const m = Math.abs(a[i][k]); if (m > mejor) { mejor = m; p = i; } }
      if (mejor <= tol) throw new SistemaSingular();
      if (p !== k) { [a[p], a[k]] = [a[k], a[p]]; [b[p], b[k]] = [b[k], b[p]]; }
      for (let i = k + 1; i < n; i++) {
        if (a[i][k] === 0) continue;
        const f = a[i][k] / a[k][k];
        for (let j = k; j < n; j++) a[i][j] -= f * a[k][j];
        b[i] -= f * b[k];
      }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = b[i];
      for (let j = i + 1; j < n; j++) s -= a[i][j] * x[j];
      x[i] = s / a[i][i];
    }
    return x;
  }

  // ─────────────────────────────── Circuito ───────────────────────────────
  // Convención en todos los elementos: el voltaje es v_a − v_b y la corriente circula de a hacia b
  // por dentro del elemento, de modo que v·i es la potencia absorbida (convención pasiva).
  const E = {
    resistor: (nombre, a, b, r) => ({ tipo: "R", nombre, a, b, r }),
    fuenteV: (nombre, a, b, valor, fase = 0) => ({ tipo: "V", nombre, a, b, valor, fase }),
    fuenteI: (nombre, a, b, valor, fase = 0) => ({ tipo: "I", nombre, a, b, valor, fase }),
    capacitor: (nombre, a, b, c, v0 = 0) => ({ tipo: "C", nombre, a, b, c, v0 }),
    inductor: (nombre, a, b, l, i0 = 0) => ({ tipo: "L", nombre, a, b, l, i0 }),
    /** salida: "VOLTAJE" | "CORRIENTE"; control: { elemento, magnitud } */
    dependiente: (nombre, a, b, salida, control, ganancia, texto = "") =>
      ({ tipo: "DEP", nombre, a, b, salida, control, ganancia, texto }),
    /** Amp. op. ideal; la salida se mide respecto a tierra (a = salida, b = 0). */
    ampOp: (nombre, mas, menos, salida) => ({ tipo: "OA", nombre, mas, menos, salida, a: salida, b: 0 }),
  };
  const nodosDe = e => (e.tipo === "OA" ? [e.mas, e.menos, e.salida] : [e.a, e.b]);
  const esIndependiente = e => e.tipo === "V" || e.tipo === "I";

  class Circuito {
    constructor(elementos) {
      this.elementos = elementos;
      let m = 0;
      for (const e of elementos) for (const n of nodosDe(e)) m = Math.max(m, n);
      this.numNodos = m + 1;
      this.porNombre = new Map(elementos.map(e => [e.nombre, e]));
    }
    elemento(nombre) {
      const e = this.porNombre.get(nombre);
      if (!e) throw new Error("No existe el elemento " + nombre);
      return e;
    }
    con(...extra) { return new Circuito(this.elementos.concat(extra)); }
    get independientes() { return this.elementos.filter(esIndependiente); }
    get tieneDependientes() { return this.elementos.some(e => e.tipo === "DEP"); }
  }

  // ─────────────────────────────── MNA ───────────────────────────────
  const Modo = {
    CD: { tipo: "CD" },
    CA: omega => ({ tipo: "CA", omega }),
    Inicial: { tipo: "Inicial" },
    /** estado: { v: Map, i: Map } */
    Paso: (h, estado, trapezoidal = true) => ({ tipo: "Paso", h, estado, trapezoidal }),
  };

  /** Combinación lineal de incógnitas más una constante. */
  class ExprLineal {
    constructor(coef = new Map(), cte = Complejo.CERO) { this.coef = coef; this.cte = cte; }
    suma(o, k = Complejo.UNO) {
      k = cx(k);
      const r = new ExprLineal(new Map(this.coef), this.cte);
      for (const [i, c] of o.coef) r.coef.set(i, (r.coef.get(i) || Complejo.CERO).mas(c.por(k)));
      r.cte = r.cte.mas(o.cte.por(k));
      return r;
    }
    resta(o) { return this.suma(o, Complejo.UNO.neg()); }
    por(k) {
      k = cx(k);
      const m = new Map();
      for (const [i, c] of this.coef) m.set(i, c.por(k));
      return new ExprLineal(m, this.cte.por(k));
    }
    evaluar(x) {
      let s = this.cte;
      for (const [i, c] of this.coef) s = s.mas(c.por(x[i]));
      return s;
    }
    static variable(i) { return new ExprLineal(new Map([[i, Complejo.UNO]])); }
    static constante(c) { return new ExprLineal(new Map(), cx(c)); }
  }

  class Mna {
    /** opciones: { apagadas: Set<string>, apagarDependientes: boolean } */
    constructor(circuito, modo, opciones = {}) {
      this.circuito = circuito;
      this.modo = modo;
      this.apagadas = opciones.apagadas || new Set();
      this.apagarDependientes = !!opciones.apagarDependientes;
      this.nNodos = circuito.numNodos - 1;
      this.indiceAux = new Map();
      let k = this.nNodos;
      for (const e of circuito.elementos) if (this.necesitaAux(e)) this.indiceAux.set(e.nombre, k++);
    }
    get nIncognitas() { return this.nNodos + this.indiceAux.size; }
    get auxiliares() { return [...this.indiceAux.keys()].map(n => this.circuito.elemento(n)); }

    necesitaAux(e) {
      switch (e.tipo) {
        case "V": case "OA": return true;
        case "DEP": return e.salida === "VOLTAJE";
        case "L": return this.modo.tipo === "CD";
        case "C": return this.modo.tipo === "Inicial";
        default: return false;
      }
    }
    apagada(e) { return this.apagadas.has(e.nombre) || (this.apagarDependientes && e.tipo === "DEP"); }
    valorFuente(valor, fase) { return this.modo.tipo === "CA" ? Complejo.polar(valor, fase) : new Complejo(valor); }

    voltajeNodo(n) { return n === 0 ? new ExprLineal() : ExprLineal.variable(n - 1); }
    voltaje(e) { return this.voltajeNodo(e.a).resta(this.voltajeNodo(e.b)); }

    /** Corriente del elemento, de a hacia b, como expresión de las incógnitas. */
    corriente(e, profundidad = 0) {
      if (profundidad >= 12) throw new Error("Control circular en fuentes dependientes");
      if (this.indiceAux.has(e.nombre)) return ExprLineal.variable(this.indiceAux.get(e.nombre));
      const m = this.modo;
      switch (e.tipo) {
        case "R": return this.voltaje(e).por(1 / e.r);
        case "I": return ExprLineal.constante(this.apagada(e) ? Complejo.CERO : this.valorFuente(e.valor, e.fase));
        case "DEP": return this.apagada(e) ? new ExprLineal() : this.control(e.control, profundidad + 1).por(e.ganancia);
        case "C":
          if (m.tipo === "CD") return new ExprLineal();
          if (m.tipo === "CA") return this.voltaje(e).por(new Complejo(0, m.omega * e.c));
          if (m.tipo === "Paso") {
            // Trapezoidal: i = (2C/h)(v − v_n) − i_n ; Euler implícito: i = (C/h)(v − v_n).
            const g = (m.trapezoidal ? 2 : 1) * e.c / m.h;
            const previa = m.trapezoidal ? m.estado.i.get(e.nombre) : 0;
            const ieq = g * m.estado.v.get(e.nombre) + previa;
            return this.voltaje(e).por(g).suma(ExprLineal.constante(-ieq));
          }
          throw new Error("El capacitor usa incógnita auxiliar en t = 0⁺");
        case "L":
          if (m.tipo === "CA") return this.voltaje(e).por(Complejo.UNO.entre(new Complejo(0, m.omega * e.l)));
          if (m.tipo === "Inicial") return ExprLineal.constante(e.i0);
          if (m.tipo === "Paso") {
            // Trapezoidal: i = i_n + (h/2L)(v_n + v) ; Euler implícito: i = i_n + (h/L)·v.
            const g = m.h / ((m.trapezoidal ? 2 : 1) * e.l);
            const previo = m.trapezoidal ? g * m.estado.v.get(e.nombre) : 0;
            const ieq = m.estado.i.get(e.nombre) + previo;
            return this.voltaje(e).por(g).suma(ExprLineal.constante(ieq));
          }
          throw new Error("El inductor usa incógnita auxiliar en CD");
        default: throw new Error("Elemento sin corriente definida: " + e.nombre);
      }
    }

    control(c, profundidad = 0) {
      const e = this.circuito.elemento(c.elemento);
      return c.magnitud === "VOLTAJE" ? this.voltaje(e) : this.corriente(e, profundidad);
    }

    /** LCK en el nodo k: suma de corrientes que salen del nodo (la ecuación es lck(k) = 0). */
    lck(nodo) {
      let s = new ExprLineal();
      for (const e of this.circuito.elementos) {
        if (e.a === nodo) s = s.suma(this.corriente(e));
        if (e.b === nodo) s = s.resta(this.corriente(e));
      }
      return s;
    }

    /** Ecuación de restricción de un elemento con incógnita auxiliar: [expr, rhs]. */
    restriccion(e) {
      switch (e.tipo) {
        case "V": return [this.voltaje(e), this.apagada(e) ? Complejo.CERO : this.valorFuente(e.valor, e.fase)];
        case "DEP":
          return this.apagada(e) ? [this.voltaje(e), Complejo.CERO]
            : [this.voltaje(e).resta(this.control(e.control).por(e.ganancia)), Complejo.CERO];
        case "OA": return [this.voltajeNodo(e.mas).resta(this.voltajeNodo(e.menos)), Complejo.CERO];
        case "L": return [this.voltaje(e), Complejo.CERO];
        case "C": return [this.voltaje(e), new Complejo(e.v0)];
        default: throw new Error(e.nombre + " no tiene restricción");
      }
    }

    filas() {
      const r = [];
      for (let k = 1; k <= this.nNodos; k++) {
        const ex = this.lck(k);
        r.push({ coef: ex.coef, rhs: ex.cte.neg() });
      }
      for (const e of this.auxiliares) {
        const [ex, rhs] = this.restriccion(e);
        r.push({ coef: ex.coef, rhs: rhs.menos(ex.cte) });
      }
      return r;
    }

    resolver() {
      const n = this.nIncognitas;
      const a = Array.from({ length: n }, () => new Array(n).fill(Complejo.CERO));
      const b = new Array(n).fill(Complejo.CERO);
      this.filas().forEach((f, i) => {
        for (const [j, c] of f.coef) a[i][j] = a[i][j].mas(c);
        b[i] = f.rhs;
      });
      return new SolucionMna(this, resolverComplejo(a, b));
    }
  }

  class SolucionMna {
    constructor(mna, x) { this.mna = mna; this.x = x; }
    v(nodo) { return nodo === 0 ? Complejo.CERO : this.x[nodo - 1]; }
    voltaje(nombre) { return this.mna.voltaje(this.mna.circuito.elemento(nombre)).evaluar(this.x); }
    corriente(nombre) { return this.mna.corriente(this.mna.circuito.elemento(nombre)).evaluar(this.x); }
    /** Potencia absorbida en CD (convención pasiva); negativa si el elemento entrega potencia. */
    potencia(nombre) { return this.voltaje(nombre).por(this.corriente(nombre)).re; }
  }

  const resolverCD = (c, opciones = {}) => new Mna(c, Modo.CD, opciones).resolver();

  // ─────────────────────────────── Thévenin ───────────────────────────────
  /** Quita el ruido numérico (p. ej., 1e-15 en lugar de 0). */
  const limpiar = x => (Math.abs(x) < 1e-12 ? 0 : x);

  class Equivalente {
    /** rth e isc son null si no existen (R_th infinita o nula). */
    constructor(voc, rth, isc) { this.voc = voc; this.rth = rth; this.isc = isc; }
    potenciaEnCarga(rl) {
      if (this.rth === null) return 0;
      const i = this.voc / (this.rth + rl);
      return i * i * rl;
    }
    /** Potencia máxima transferible; solo existe si R_th > 0. */
    get potenciaMaxima() { return this.rth !== null && this.rth > 1e-12 ? this.voc * this.voc / (4 * this.rth) : null; }
  }

  function intentarSingular(f) {
    try { return f(); } catch (ex) { if (ex instanceof SistemaSingular) return undefined; throw ex; }
  }

  /** Calcula v_oc, R_th (con fuente de prueba de 1 A) e i_sc entre los nodos a y b. */
  function thevenin(c, a, b, apagarDependientes = false) {
    if (a === b) return null;
    const voc = intentarSingular(() => {
      const s = new Mna(c, Modo.CD, { apagarDependientes }).resolver();
      return s.v(a).menos(s.v(b)).re;
    });
    if (voc === undefined) return null;
    const independientes = new Set(c.independientes.map(e => e.nombre));
    const rth = intentarSingular(() => {
      const prueba = E.fuenteI("__prueba", b, a, 1);
      const s = new Mna(c.con(prueba), Modo.CD, { apagadas: independientes, apagarDependientes }).resolver();
      return s.v(a).menos(s.v(b)).re;
    });
    const isc = intentarSingular(() => {
      const corto = E.fuenteV("__corto", a, b, 0);
      return new Mna(c.con(corto), Modo.CD, { apagarDependientes }).resolver().corriente("__corto").re;
    });
    return new Equivalente(voc, rth === undefined ? null : limpiar(rth), isc === undefined ? null : limpiar(isc));
  }

  /** Aporte de cada fuente independiente a v_oc (las demás apagadas). La suma da v_oc. */
  function superposicion(c, a, b) {
    const todas = c.independientes.map(e => e.nombre);
    return c.independientes.map(f => {
      const apagadas = new Set(todas.filter(n => n !== f.nombre));
      const s = new Mna(c, Modo.CD, { apagadas }).resolver();
      return [f, limpiar(s.v(a).menos(s.v(b)).re)];
    });
  }

  // ─────────────────────────────── Amp. op. ───────────────────────────────
  /** Resuelve con el amp. op. ideal; si la salida pasa de ±vsat, se satura. */
  function salidaAmpOp(c, nombre, vsat) {
    const am = c.elemento(nombre);
    const ideal = limpiar(resolverCD(c).v(am.salida).re);
    return Math.abs(ideal) <= vsat ? { ideal, real: ideal, saturado: false }
      : { ideal, real: Math.sign(ideal) * vsat, saturado: true };
  }

  // ─────────────────────────────── Transitorio ───────────────────────────────
  /**
   * Simula de t = 0⁺ a tFinal con la regla trapezoidal (los dos primeros pasos con Euler
   * implícito, como los simuladores tipo SPICE tras un escalón).
   */
  function simularTransitorio(c, tFinal, pasos) {
    const h = tFinal / pasos;
    const reactivos = c.elementos.filter(e => e.tipo === "C" || e.tipo === "L");
    let sol = new Mna(c, Modo.Inicial).resolver();
    const t = Float64Array.from({ length: pasos + 1 }, (_, k) => k * h);
    const soluciones = [sol];
    for (let n = 1; n <= pasos; n++) {
      const estado = {
        v: new Map(reactivos.map(e => [e.nombre, sol.voltaje(e.nombre).re])),
        i: new Map(reactivos.map(e => [e.nombre, sol.corriente(e.nombre).re])),
      };
      sol = new Mna(c, Modo.Paso(h, estado, n > 2)).resolver();
      soluciones.push(sol);
    }
    return {
      t, soluciones,
      voltaje: nombre => Float64Array.from(soluciones, s => s.voltaje(nombre).re),
      corriente: nombre => Float64Array.from(soluciones, s => s.corriente(nombre).re),
    };
  }

  // ─────────────────────────────── Segundo orden ───────────────────────────────
  // El orden importa: el cap. 9 elige el tipo con entero(3).
  const AMORTIGUAMIENTOS = ["SOBREAMORTIGUADO", "CRITICO", "SUBAMORTIGUADO"];
  const NOMBRE_AMORT = { SOBREAMORTIGUADO: "Sobreamortiguado", CRITICO: "Críticamente amortiguado", SUBAMORTIGUADO: "Subamortiguado" };

  /** Parámetros de s² + 2αs + ω0² = 0 (Dorf, cap. 9). */
  class SegundoOrden {
    constructor(alfa, omega0) { this.alfa = alfa; this.omega0 = omega0; }
    get zeta() { return this.alfa / this.omega0; }
    get tipo() {
      if (Math.abs(this.alfa - this.omega0) <= 1e-9 * this.omega0) return "CRITICO";
      return this.alfa > this.omega0 ? "SOBREAMORTIGUADO" : "SUBAMORTIGUADO";
    }
    get omegaD() { return Math.sqrt(Math.max(0, this.omega0 * this.omega0 - this.alfa * this.alfa)); }
    get raices() {
      const d = this.alfa * this.alfa - this.omega0 * this.omega0;
      const t = this.tipo;
      if (t === "SUBAMORTIGUADO") return [new Complejo(-this.alfa, this.omegaD), new Complejo(-this.alfa, -this.omegaD)];
      if (t === "CRITICO") return [new Complejo(-this.alfa), new Complejo(-this.alfa)];
      return [new Complejo(-this.alfa + Math.sqrt(d)), new Complejo(-this.alfa - Math.sqrt(d))];
    }
    static serie(r, l, c) { return new SegundoOrden(r / (2 * l), 1 / Math.sqrt(l * c)); }
    static paralelo(r, l, c) { return new SegundoOrden(1 / (2 * r * c), 1 / Math.sqrt(l * c)); }
  }

  /** x(t) = x∞ + respuesta natural, con x(0) = x0 y dx/dt(0) = dx0 (constantes como en el libro). */
  class RespuestaSegundoOrden {
    constructor(so, xInf, x0, dx0) {
      this.so = so; this.xInf = xInf; this.x0 = x0; this.dx0 = dx0;
      const b = x0 - xInf;
      switch (so.tipo) {
        case "SOBREAMORTIGUADO": {
          const [s1, s2] = so.raices;
          const a1 = (dx0 - s2.re * b) / (s1.re - s2.re);
          this.k1 = a1; this.k2 = b - a1; break;
        }
        case "CRITICO": this.k1 = b; this.k2 = dx0 + so.alfa * b; break;
        default: this.k1 = b; this.k2 = (dx0 + so.alfa * b) / so.omegaD;
      }
    }
    derivada(t) {
      const so = this.so, k1 = this.k1, k2 = this.k2;
      switch (so.tipo) {
        case "SOBREAMORTIGUADO": {
          const [s1, s2] = so.raices;
          return k1 * s1.re * Math.exp(s1.re * t) + k2 * s2.re * Math.exp(s2.re * t);
        }
        case "CRITICO": return (k2 - so.alfa * (k1 + k2 * t)) * Math.exp(-so.alfa * t);
        default: {
          const a = so.alfa, w = so.omegaD;
          return Math.exp(-a * t) * ((-a * k1 + w * k2) * Math.cos(w * t) + (-a * k2 - w * k1) * Math.sin(w * t));
        }
      }
    }
    valor(t) {
      const so = this.so;
      switch (so.tipo) {
        case "SOBREAMORTIGUADO": {
          const [s1, s2] = so.raices;
          return this.xInf + this.k1 * Math.exp(s1.re * t) + this.k2 * Math.exp(s2.re * t);
        }
        case "CRITICO": return this.xInf + (this.k1 + this.k2 * t) * Math.exp(-so.alfa * t);
        default:
          return this.xInf + Math.exp(-so.alfa * t) * (this.k1 * Math.cos(so.omegaD * t) + this.k2 * Math.sin(so.omegaD * t));
      }
    }
  }

  // ─────────────────────────────── Lector de expresiones ───────────────────────────────
  /**
   * Evalúa expresiones sencillas: números, + − * / y paréntesis, para que el alumno pueda
   * escribir «1/5 + 1/20» en lugar de 0.25. Devuelve {tipo: "vacia" | "invalida" | "numero", valor}.
   */
  function leerExpresion(texto) {
    const s = String(texto).replace(/−/g, "-").replace(/[·×]/g, "*").replace(/,/g, ".").replace(/\s+/g, "");
    if (s.length === 0) return { tipo: "vacia" };
    let pos = 0;
    const falla = () => { throw new SyntaxError("expresión"); };
    const esDigito = ch => ch >= "0" && ch <= "9";
    function expresion() {
      let v = termino();
      while (pos < s.length && (s[pos] === "+" || s[pos] === "-")) {
        const op = s[pos++];
        const t = termino();
        v = op === "+" ? v + t : v - t;
      }
      return v;
    }
    function termino() {
      let v = factor();
      while (pos < s.length && (s[pos] === "*" || s[pos] === "/")) {
        const op = s[pos++];
        const f = factor();
        v = op === "*" ? v * f : v / f;
      }
      return v;
    }
    function factor() {
      if (pos >= s.length) falla();
      const ch = s[pos];
      if (ch === "+") { pos++; return factor(); }
      if (ch === "-") { pos++; return -factor(); }
      if (ch === "(") {
        pos++;
        const v = expresion();
        if (!(pos < s.length && s[pos] === ")")) falla();
        pos++;
        return v;
      }
      const inicio = pos;
      while (pos < s.length && (esDigito(s[pos]) || s[pos] === ".")) pos++;
      if (pos === inicio) falla();
      const txt = s.substring(inicio, pos);
      if ((txt.match(/\./g) || []).length > 1 || txt === ".") falla();
      return Number(txt);
    }
    try {
      const v = expresion();
      if (pos !== s.length || !Number.isFinite(v)) return { tipo: "invalida" };
      return { tipo: "numero", valor: v };
    } catch (ex) {
      if (ex instanceof SyntaxError) return { tipo: "invalida" };
      throw ex;
    }
  }

  /** Valor numérico de una celda; vacía cuenta como 0 y null si no se entiende. */
  function valorCelda(texto) {
    const l = leerExpresion(texto);
    return l.tipo === "vacia" ? 0 : l.tipo === "invalida" ? null : l.valor;
  }

  // ─────────────────────────────── Formato ───────────────────────────────
  const MENOS = "−";
  const redondear = x => { const r = Math.round(x); return (Math.abs(x % 1) === 0.5) ? 2 * Math.round(x / 2) : r; }; // como kotlin.math.round

  /** Número con [cifras] significativas, sin ceros sobrantes y con signo menos tipográfico. */
  function fmt(x, cifras = 4) {
    if (Number.isNaN(x)) return "—";
    if (!Number.isFinite(x)) return x > 0 ? "∞" : MENOS + "∞";
    if (Math.abs(x) < 1e-12) return "0";
    const r = redondear(x);
    if (Math.abs(x - r) < 1e-9 * Math.max(1, Math.abs(x)) && Math.abs(r) < 1e12) {
      return (r < 0 ? MENOS : "") + String(Math.abs(r));
    }
    const magnitud = Math.floor(Math.log10(Math.abs(x)));
    const decimales = Math.min(12, Math.max(0, cifras - 1 - magnitud));
    let s = Math.abs(x).toFixed(decimales);
    if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return (x < 0 && s !== "0" ? MENOS : "") + s;
  }

  /** Coeficientes: decimal exacto (0.25), fracción sencilla (4/15) o 4 cifras significativas. */
  function fmtCoef(x) {
    if (Math.abs(x) < 1e-12) return "0";
    const d4 = x * 10000;
    if (Math.abs(d4 - redondear(d4)) < 1e-6 * Math.max(1, Math.abs(d4))) return fmt(x, 8);
    for (let q = 2; q <= 400; q++) {
      const p = x * q;
      if (Math.abs(p - redondear(p)) < 1e-7 * q) {
        const num = Math.abs(redondear(p));
        return (x < 0 ? MENOS : "") + num + "/" + q;
      }
    }
    return fmt(x);
  }

  const PREFIJOS = [[-12, "p"], [-9, "n"], [-6, "µ"], [-3, "m"], [0, ""], [3, "k"], [6, "M"], [9, "G"]];

  /** Valor con prefijo SI: 0.04 F → «40 mF». */
  function fmtSI(x, unidad, cifras = 3) {
    if (x === 0 || !Number.isFinite(x)) return fmt(x) + " " + unidad;
    const ex = Math.floor(Math.log10(Math.abs(x)) / 3) * 3;
    let elegido = PREFIJOS[0];
    for (const p of PREFIJOS) if (p[0] <= ex) elegido = p;
    const mantisa = x / Math.pow(10, elegido[0]);
    return fmt(mantisa, cifras) + " " + elegido[1] + unidad;
  }

  /** Ecuación legible: «(1/4)·v1 − 0.05·v2 = −1». */
  function ecuacionTexto(coef, rhs, nombres) {
    let sb = "";
    coef.forEach((c, j) => {
      if (Math.abs(c) < 1e-12) return;
      const negativo = c < 0;
      if (sb.length === 0) { if (negativo) sb += MENOS; } else sb += negativo ? " " + MENOS + " " : " + ";
      const m = Math.abs(c);
      if (Math.abs(m - 1) > 1e-12) {
        const t = fmtCoef(m);
        sb += t.includes("/") ? "(" + t + ")·" : t + "·";
      }
      sb += nombres[j];
    });
    if (sb.length === 0) sb = "0";
    return sb + " = " + fmtCoef(rhs);
  }

  /** Lista en español: «1, 2 y 3». */
  function listaTexto(xs) {
    if (xs.length === 0) return "";
    if (xs.length === 1) return xs[0];
    return xs.slice(0, -1).join(", ") + " y " + xs[xs.length - 1];
  }

  // ─────────────────────────────── Revisión ───────────────────────────────
  /** Compara con 1 % de tolerancia relativa más una pequeña tolerancia absoluta según la escala. */
  function coincide(valor, esperado, escala = Math.abs(esperado)) {
    return Math.abs(valor - esperado) <= 0.01 * Math.abs(esperado) + 1e-3 * Math.max(escala, 1e-9) + 1e-12;
  }

  function filasTxt(nums, mayuscula = false) {
    const t = (nums.length === 1 ? "la fila" : "las filas") + " " + listaTexto(nums);
    return mayuscula ? t[0].toUpperCase() + t.slice(1) : t;
  }

  /**
   * Revisa el planteamiento del alumno sin exigir orden ni escala: cada fila debe cumplirse con la
   * solución correcta y el sistema completo debe dar esa solución. Estados: BIEN, MAL, ILEGIBLE, VACIA.
   */
  function revisarSistema(celdasA, celdasB, sistema) {
    const n = sistema.n, x = sistema.solucion;
    const a = Array.from({ length: n }, () => new Array(n).fill(0));
    const b = new Array(n).fill(0);
    const estados = [];
    for (let i = 0; i < n; i++) {
      const fila = celdasA[i].map(valorCelda);
      const rhs = valorCelda(celdasB[i]);
      if (fila.some(v => v === null) || rhs === null) { estados.push("ILEGIBLE"); continue; }
      for (let j = 0; j < n; j++) a[i][j] = fila[j];
      b[i] = rhs;
      if (a[i].every(v => v === 0)) { estados.push("VACIA"); continue; }
      let residuo = -b[i], escala = Math.abs(b[i]);
      for (let j = 0; j < n; j++) { residuo += a[i][j] * x[j]; escala += Math.abs(a[i][j] * x[j]); }
      estados.push(Math.abs(residuo) <= 5e-3 * escala + 1e-9 ? "BIEN" : "MAL");
    }
    const numeros = e => estados.map((v, i) => (v === e ? String(i + 1) : null)).filter(Boolean);
    if (estados.some(e => e !== "BIEN")) {
      const partes = [];
      const il = numeros("ILEGIBLE"), va = numeros("VACIA"), ma = numeros("MAL");
      if (il.length) partes.push(`No se entiende lo escrito en ${filasTxt(il)}. Usa números, + − * / y paréntesis.`);
      if (va.length) partes.push(`${filasTxt(va, true)} no tiene${va.length > 1 ? "n" : ""} coeficientes.`);
      if (ma.length) partes.push(`${filasTxt(ma, true)} no se cumple${ma.length > 1 ? "n" : ""} con la solución correcta: revisa signos y coeficientes.`);
      return { filas: estados, correcto: false, mensaje: partes.join(" ") };
    }
    let xa = null;
    try { xa = resolverReal(a, b); } catch (ex) { if (!(ex instanceof SistemaSingular)) throw ex; }
    const escala = Math.max(...x.map(Math.abs));
    const ok = xa !== null && xa.every((v, i) => coincide(v, x[i], escala));
    return ok
      ? { filas: estados, correcto: true, mensaje: "¡Planteamiento correcto! Ahora resuelve el sistema." }
      : {
          filas: estados, correcto: false,
          mensaje: "Cada ecuación se cumple, pero no son independientes: alguna es combinación de otras. " +
            "Necesitas una ecuación por cada nodo o malla (o por cada supernodo o supermalla y su restricción).",
        };
  }

  // ─────────────────────────────── Planteamiento por nodos y mallas ───────────────────────────────
  class SistemaFormulado {
    constructor(incognitas, ecuaciones) { this.incognitas = incognitas; this.ecuaciones = ecuaciones; this._sol = null; }
    get n() { return this.incognitas.length; }
    get solucion() {
      if (!this._sol) this._sol = resolverReal(this.ecuaciones.map(e => e.coef), this.ecuaciones.map(e => e.rhs));
      return this._sol;
    }
    texto(i) { return ecuacionTexto(this.ecuaciones[i].coef, this.ecuaciones[i].rhs, this.incognitas); }
  }

  /**
   * Elimina las incógnitas auxiliares como se hace a mano: si la auxiliar aparece en dos ecuaciones
   * de región se suman (supernodo o supermalla); si aparece en una sola, esa ecuación se cambia por
   * la restricción de la fuente, que ocupa el lugar de la región eliminada.
   */
  function reducir(nPrin, regiones, restricciones) {
    const vivas = regiones.slice();
    const todas = regiones.concat(restricciones);
    const eliminadas = new Set();
    const posicion = new Array(nPrin).fill(null);
    let escala = 1;
    for (const f of todas) for (const v of f.coef) escala = Math.max(escala, Math.abs(v));
    const eps = 1e-12 * escala;
    restricciones.forEach((restr, j) => {
      const col = nPrin + j;
      const candidatas = vivas.filter(f => Math.abs(f.coef[col]) > eps);
      if (candidatas.length === 0) throw new Error("Fuentes en lazo o mal conectadas");
      let pivote = candidatas[0];
      const maxC = f => Math.max(...f.conjunto);
      for (const f of candidatas) if (maxC(f) > maxC(pivote)) pivote = f;
      for (const f of todas) {
        if (f === pivote || eliminadas.has(f)) continue;
        const c = f.coef[col];
        if (Math.abs(c) <= eps) continue;
        const k = c / pivote.coef[col];
        for (let m = 0; m < f.coef.length; m++) f.coef[m] -= k * pivote.coef[m];
        f.rhs -= k * pivote.rhs;
        f.coef[col] = 0;
        if (f.propietario >= 0) for (const q of pivote.conjunto) f.conjunto.add(q);
      }
      vivas.splice(vivas.indexOf(pivote), 1);
      eliminadas.add(pivote);
      posicion[pivote.propietario] = restr;
    });
    for (const f of vivas) posicion[f.propietario] = f;
    return posicion.map(p => { if (!p) throw new Error("Planteamiento incompleto"); return p; });
  }

  function filaDe(ex, rhs, total, propietario, conjunto, elemento) {
    const coef = new Array(total).fill(0);
    for (const [i, z] of ex.coef) coef[i] += z.re;
    return { coef, rhs, propietario, conjunto, elemento };
  }

  function limpiarFila(coef, n) {
    const r = coef.slice(0, n);
    const escala = r.length ? Math.max(...r.map(Math.abs)) : 0;
    for (let i = 0; i < r.length; i++) if (Math.abs(r[i]) < 1e-12 * Math.max(1, escala)) r[i] = 0;
    return r;
  }

  /** Planteamiento por nodos con los voltajes de nodo como únicas incógnitas. */
  function formularNodos(c, variable, nombreNodo) {
    const mna = new Mna(c, Modo.CD);
    const n = mna.nNodos, total = mna.nIncognitas;
    const regiones = [];
    for (let k = 1; k <= n; k++) {
      const ex = mna.lck(k);
      regiones.push(filaDe(ex, -ex.cte.re, total, k - 1, new Set([k - 1]), null));
    }
    const restricciones = mna.auxiliares.map(e => {
      const [ex, rhs] = mna.restriccion(e);
      return filaDe(ex, rhs.menos(ex.cte).re, total, -1, new Set(), e);
    });
    const filas = reducir(n, regiones, restricciones);
    const nodoTxt = k => (k === 0 ? "tierra" : variable(k));
    const diferencia = (a, b) => (b === 0 ? variable(a) : a === 0 ? "−" + variable(b) : `${variable(a)} − ${variable(b)}`);

    const ecuaciones = filas.map(f => {
      const e = f.elemento;
      if (!e) {
        const nodos = [...f.conjunto].map(k => k + 1).sort((p, q) => p - q);
        const descripcion = nodos.length === 1 ? `LCK en el nodo ${nombreNodo(nodos[0])}`
          : `LCK en el supernodo que forman los nodos ${listaTexto(nodos.map(nombreNodo))}`;
        const participantes = [];
        for (const el of c.elementos) {
          const dentroA = nodos.includes(el.a), dentroB = nodos.includes(el.b);
          if (dentroA === dentroB) continue;
          const sentido = dentroB ? "entra" : "sale";
          if (el.tipo === "R") participantes.push(`${fmt(el.r)} Ω entre ${nodoTxt(el.a)} y ${nodoTxt(el.b)}`);
          else if (el.tipo === "I") participantes.push(`fuente de ${fmt(el.valor)} A que ${sentido}`);
          else if (el.tipo === "DEP" && el.salida === "CORRIENTE") participantes.push(`fuente dependiente ${el.texto} que ${sentido}`);
        }
        return { coef: limpiarFila(f.coef, n), rhs: f.rhs, descripcion, participantes };
      }
      let descripcion;
      if (e.tipo === "V") descripcion = `Fuente de ${fmt(e.valor)} V: fija ${diferencia(e.a, e.b)}`;
      else if (e.tipo === "DEP") descripcion = `Fuente dependiente ${e.texto}: fija ${diferencia(e.a, e.b)}`;
      else if (e.tipo === "OA") descripcion = "Amp. op. ideal: v+ = v−";
      else descripcion = `Restricción de ${e.nombre}`;
      return { coef: limpiarFila(f.coef, n), rhs: f.rhs, descripcion, participantes: [] };
    });
    const incognitas = [];
    for (let k = 1; k <= n; k++) incognitas.push(variable(k));
    return new SistemaFormulado(incognitas, ecuaciones);
  }

  const esDeCorriente = e => e.tipo === "I" || (e.tipo === "DEP" && e.salida === "CORRIENTE");

  /** Planteamiento por mallas (corrientes horarias). mallas: [{nombre, signos: Map nombre → ±1}] */
  function formularMallas(c, mallas) {
    const m = mallas.length;
    const usados = c.elementos.filter(e => mallas.some(ma => ma.signos.has(e.nombre)));
    const auxiliares = usados.filter(esDeCorriente);
    const indiceAux = new Map(auxiliares.map((e, i) => [e.nombre, m + i]));
    const total = m + auxiliares.length;

    const rama = e => {
      let ex = new ExprLineal();
      mallas.forEach((malla, k) => {
        if (malla.signos.has(e.nombre)) ex = ex.suma(ExprLineal.variable(k), new Complejo(malla.signos.get(e.nombre)));
      });
      return ex;
    };
    const voltaje = (e, prof = 0) => {
      if (prof >= 12) throw new Error("Control circular");
      if (indiceAux.has(e.nombre)) return ExprLineal.variable(indiceAux.get(e.nombre));
      if (e.tipo === "R") return rama(e).por(e.r);
      if (e.tipo === "V") return ExprLineal.constante(e.valor);
      if (e.tipo === "DEP") {
        const ctrl = c.elemento(e.control.elemento);
        const xx = e.control.magnitud === "VOLTAJE" ? voltaje(ctrl, prof + 1) : rama(ctrl);
        return xx.por(e.ganancia);
      }
      throw new Error("Elemento no admitido en el análisis de mallas: " + e.nombre);
    };

    const regiones = mallas.map((malla, k) => {
      let ex = new ExprLineal();
      for (const [nombre, s] of malla.signos) ex = ex.suma(voltaje(c.elemento(nombre)), new Complejo(s));
      return filaDe(ex, -ex.cte.re, total, k, new Set([k]), null);
    });
    const restricciones = auxiliares.map(e => {
      let valor;
      if (e.tipo === "I") valor = ExprLineal.constante(e.valor);
      else {
        const ctrl = c.elemento(e.control.elemento);
        valor = (e.control.magnitud === "VOLTAJE" ? voltaje(ctrl) : rama(ctrl)).por(e.ganancia);
      }
      const ex = rama(e).resta(valor);
      return filaDe(ex, -ex.cte.re, total, -1, new Set(), e);
    });
    const filas = reducir(m, regiones, restricciones);
    const numero = k => mallas[k].nombre.replace(/^i/, "");

    const ecuaciones = filas.map(f => {
      const e = f.elemento;
      if (!e) {
        const conj = [...f.conjunto].sort((p, q) => p - q);
        const descripcion = conj.length === 1 ? `LVK en la malla ${numero(conj[0])}`
          : `LVK en la supermalla que forman las mallas ${listaTexto(conj.map(numero))}`;
        const participantes = [];
        for (const el of usados) {
          if (esDeCorriente(el)) continue;
          const neto = conj.reduce((s, k) => s + (mallas[k].signos.get(el.nombre) || 0), 0);
          if (neto === 0) continue;
          const otras = mallas.map((_, k) => k).filter(k => !conj.includes(k) && mallas[k].signos.has(el.nombre));
          const compartida = otras.length === 0 ? "" : ` (compartida con la malla ${listaTexto(otras.map(numero))})`;
          if (el.tipo === "R") participantes.push(`${fmt(el.r)} Ω${compartida}`);
          else if (el.tipo === "V") participantes.push(`fuente de ${fmt(el.valor)} V${compartida}`);
          else if (el.tipo === "DEP") participantes.push(`fuente dependiente ${el.texto}${compartida}`);
        }
        return { coef: limpiarFila(f.coef, m), rhs: f.rhs, descripcion, participantes };
      }
      let descripcion;
      if (e.tipo === "I") descripcion = `Fuente de ${fmt(e.valor)} A: fija la corriente de su rama`;
      else if (e.tipo === "DEP") descripcion = `Fuente dependiente ${e.texto}: fija la corriente de su rama`;
      else descripcion = `Restricción de ${e.nombre}`;
      return { coef: limpiarFila(f.coef, m), rhs: f.rhs, descripcion, participantes: [] };
    });
    return new SistemaFormulado(mallas.map(x => x.nombre), ecuaciones);
  }

  /** Corriente de rama (de a hacia b) a partir de las corrientes de malla. */
  function corrienteDeRama(nombre, mallas, corrientes) {
    return mallas.reduce((s, malla, k) => s + (malla.signos.get(nombre) || 0) * corrientes[k], 0);
  }

  Object.assign(LAB, {
    Complejo, SistemaSingular, resolverComplejo, resolverReal,
    E, Circuito, nodosDe, Modo, ExprLineal, Mna, SolucionMna, resolverCD,
    limpiar, Equivalente, thevenin, superposicion, salidaAmpOp, simularTransitorio,
    AMORTIGUAMIENTOS, NOMBRE_AMORT, SegundoOrden, RespuestaSegundoOrden,
    leerExpresion, valorCelda, fmt, fmtCoef, fmtSI, ecuacionTexto, listaTexto,
    coincide, revisarSistema, SistemaFormulado, formularNodos, formularMallas, corrienteDeRama,
  });
})(typeof window !== "undefined" ? window : globalThis);
