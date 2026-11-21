/* ==========================================================================
   problemas.js — generadores de problemas por capítulo (Dorf, caps. 1 a 10).
   Mismo orden de sorteos que la app Android: el mismo número de problema
   produce el mismo circuito en ambas versiones.
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function (G) {
  "use strict";
  const LAB = (G.LAB = G.LAB || {});
  const {
    E, Circuito, Complejo, resolverCD, thevenin, salidaAmpOp, formularNodos, formularMallas,
    SegundoOrden, RespuestaSegundoOrden, AMORTIGUAMIENTOS, fmt, fmtSI, listaTexto,
    Azar, siguienteSemilla, P, Esquema,
  } = LAB;

  // ───────────────────────────── Caps. 1–2 ─────────────────────────────
  const TIPOS_ELEMENTO = ["GENERICO", "FUENTE_V", "FUENTE_I"];

  /** Un elemento aislado con su voltaje y su corriente de referencia (cap. 1). */
  class EjercicioElemento {
    constructor(tipo, v, i, masIzquierda, corrienteDerecha, semilla) {
      Object.assign(this, { tipo, v, i, masIzquierda, corrienteDerecha, semilla });
    }
    /** La corriente entra por la terminal +: se cumple la convención pasiva. */
    get pasiva() { return this.masIzquierda === this.corrienteDerecha; }
    get absorbida() { return this.pasiva ? this.v * this.i : -this.v * this.i; }
    esquema() {
      const e = new Esquema();
      e.cable(P(-1, 0), P(0, 0)); e.cable(P(4, 0), P(5, 0));
      e.terminal(P(-1, 0), "a", "IZQUIERDA"); e.terminal(P(5, 0), "b", "DERECHA");
      const tv = `v = ${fmt(this.v)} V`, ti = `i = ${fmt(this.i)} A`;
      if (this.tipo === "GENERICO") {
        e.caja("X", P(0, 0), P(4, 0), "");
        e.marcaVoltaje("X", tv, { invertida: !this.masIzquierda, lado: "ABAJO" });
        e.marcaCorriente("X", ti, { invertida: !this.corrienteDerecha, lado: "ARRIBA" });
      } else if (this.tipo === "FUENTE_V") {
        if (this.masIzquierda) e.fuenteV("X", P(0, 0), P(4, 0), this.v, { etiqueta: tv });
        else e.fuenteV("X", P(4, 0), P(0, 0), this.v, { etiqueta: tv });
        e.marcaCorriente("X", ti, { invertida: this.masIzquierda !== this.corrienteDerecha });
      } else {
        if (this.corrienteDerecha) e.fuenteI("X", P(0, 0), P(4, 0), this.i, { etiqueta: ti });
        else e.fuenteI("X", P(4, 0), P(0, 0), this.i, { etiqueta: ti });
        e.marcaVoltaje("X", tv, { invertida: this.masIzquierda !== this.corrienteDerecha });
      }
      return e.construir();
    }
    static generar(semilla) {
      const z = new Azar(semilla);
      const tipo = TIPOS_ELEMENTO[z.entero(3)];
      const v = z.de([2, 3, 4, 5, 6, 8, 10, 12, 15, 20]) * (z.entero(3) === 0 ? -1 : 1);
      const i = z.de([0.5, 1, 1.5, 2, 3, 4, 5]) * (z.entero(3) === 0 ? -1 : 1);
      const masIzq = z.moneda();
      const derecha = z.moneda();
      return new EjercicioElemento(tipo, v, i, masIzq, derecha, semilla);
    }
  }

  /** Balance de potencia en un circuito del cap. 4 con los voltajes de nodo ya conocidos. */
  class EjercicioBalance {
    constructor(construido, semilla) {
      this.construido = construido;
      this.semilla = semilla;
      const s = resolverCD(construido.circuito);
      /** Potencia absorbida por cada componente (convención pasiva). */
      this.potencias = new Map(construido.esquema.componentes.map(c => [c.nombre, s.potencia(c.nombre)]));
    }
    donde(nombre) {
      const e = this.construido.circuito.elemento(nombre);
      const n = k => (k === 0 ? "tierra" : this.construido.variable(k).split(" ")[0]);
      return `${n(e.a)}–${n(e.b)}`;
    }
    static generar(semilla) {
      const base = Cap4.generar("NODOS", semilla);
      const esquema = Cap4.nodos[base.indice].construir(new Azar(base.semillaReal));
      const v = resolverCD(base.construido.circuito);
      esquema.etiquetas = esquema.etiquetas.map(et => ({
        ...et, texto: `${et.texto} = ${fmt(v.v(base.construido.nodoP(et.p)).re)} V`,
      }));
      return new EjercicioBalance(esquema.construir(), semilla);
    }
  }

  // ───────────────────────────── Cap. 3 ─────────────────────────────
  // Red serie-paralelo como árbol: {t:"R", nombre, valor} | {t:"S", hijos} | {t:"P", hijos}
  const Red = {
    R: (nombre, valor) => ({ t: "R", nombre, valor }),
    S: hijos => ({ t: "S", hijos }),
    P: hijos => ({ t: "P", hijos }),
  };
  function equivalente(r) {
    if (r.t === "R") return r.valor;
    if (r.t === "S") return r.hijos.reduce((s, h) => s + equivalente(h), 0);
    return 1 / r.hijos.reduce((s, h) => s + 1 / equivalente(h), 0);
  }
  const hojas = r => (r.t === "R" ? [r] : r.hijos.flatMap(hojas));

  /** Combina las resistencias a y b si son hermanas en un nodo serie o paralelo; null si no. */
  function combinar(red, a, b, nuevo) {
    let resultado = null;
    function visitar(n) {
      if (resultado || n.t === "R") return n;
      const hijos = n.hijos;
      const ia = hijos.findIndex(h => h.t === "R" && h.nombre === a);
      const ib = hijos.findIndex(h => h.t === "R" && h.nombre === b);
      if (ia >= 0 && ib >= 0 && ia !== ib) {
        const ra = hijos[ia].valor, rb = hijos[ib].valor;
        const tipo = n.t === "S" ? "SERIE" : "PARALELO";
        const valor = tipo === "SERIE" ? ra + rb : ra * rb / (ra + rb);
        const nuevos = hijos.slice();
        nuevos[Math.min(ia, ib)] = Red.R(nuevo, valor);
        nuevos.splice(Math.max(ia, ib), 1);
        const red2 = nuevos.length === 1 ? nuevos[0] : tipo === "SERIE" ? Red.S(nuevos) : Red.P(nuevos);
        resultado = { tipo, valor };
        return red2;
      }
      const nuevos = hijos.map(visitar);
      // Un hijo que se volvió del mismo tipo que el padre se aplana.
      const planos = nuevos.flatMap(h => (h.t === n.t && h.t !== "R" ? h.hijos : [h]));
      return n.t === "S" ? Red.S(planos) : Red.P(planos);
    }
    const nueva = visitar(red);
    return resultado ? { red: nueva, tipo: resultado.tipo, valor: resultado.valor } : null;
  }

  function anchoRed(r) {
    if (r.t === "R") return 3;
    if (r.t === "S") return r.hijos.reduce((s, h) => s + anchoRed(h), 0);
    return Math.max(...r.hijos.map(anchoRed)) + 2;
  }
  function altoRed(r) {
    if (r.t === "R") return 0;
    if (r.t === "S") return Math.max(...r.hijos.map(altoRed));
    return r.hijos.reduce((s, h) => s + altoRed(h), 0) + 2 * (r.hijos.length - 1);
  }
  function dibujarRed(e, r, x, y, valores) {
    if (r.t === "R") {
      e.resistor(r.nombre, P(x, y), P(x + 3, y), r.valor, { etiqueta: valores ? `${fmt(r.valor, 4)} Ω` : r.nombre });
    } else if (r.t === "S") {
      let cx = x;
      for (const h of r.hijos) { dibujarRed(e, h, cx, y, valores); cx += anchoRed(h); }
    } else {
      const w = anchoRed(r);
      let yy = y;
      for (const h of r.hijos) {
        e.cable(P(x, yy), P(x + 1, yy));
        dibujarRed(e, h, x + 1, yy, valores);
        e.cable(P(x + 1 + anchoRed(h), yy), P(x + w, yy));
        yy += altoRed(h) + 2;
      }
      const ultimo = yy - altoRed(r.hijos[r.hijos.length - 1]) - 2;
      e.cable(P(x, y), P(x, ultimo));
      e.cable(P(x + w, y), P(x + w, ultimo));
    }
  }
  /** Red sola entre las terminales a y b, para reducirla. */
  function esquemaRed(r) {
    const e = new Esquema();
    const w = anchoRed(r);
    e.cable(P(0, 0), P(1, 0));
    dibujarRed(e, r, 1, 0, true);
    e.cable(P(1 + w, 0), P(2 + w, 0));
    e.terminal(P(0, 0), "a", "IZQUIERDA");
    e.terminal(P(2 + w, 0), "b", "DERECHA");
    return e.construir();
  }
  /** La misma red alimentada por una fuente de v volts. */
  function esquemaRedConFuente(r, v) {
    const e = new Esquema();
    const w = anchoRed(r), h = altoRed(r) + 2;
    e.fuenteV("Vs", P(0, 0), P(0, h), v, { lado: "IZQUIERDA" });
    e.cable(P(0, 0), P(1, 0));
    dibujarRed(e, r, 1, 0, true);
    e.cable(P(1 + w, 0), P(2 + w, 0), P(2 + w, h), P(0, h));
    return e.construir();
  }

  class ProblemaCap3 {
    constructor(red, fuente, objetivo, pregunta, semilla) {
      Object.assign(this, { red, fuente, objetivo, pregunta, semilla });
      this._cf = null; this._resp = null;
    }
    get conFuente() { return this._cf || (this._cf = esquemaRedConFuente(this.red, this.fuente)); }
    /** Corriente de izquierda a derecha o voltaje (+ a la izquierda) en la resistencia objetivo. */
    get respuesta() {
      if (this._resp === null) {
        const s = resolverCD(this.conFuente.circuito);
        this._resp = this.pregunta === "CORRIENTE" ? s.corriente(this.objetivo).re : s.voltaje(this.objetivo).re;
      }
      return this._resp;
    }
    get corrienteTotal() { return this.fuente / equivalente(this.red); }
  }

  const Cap3 = {
    VALORES: [2, 3, 4, 6, 8, 10, 12, 15, 20, 30, 40, 60],
    generarRed(z, n, serie, contador) {
      if (n === 1) { contador[0]++; return Red.R("R" + contador[0], z.de(this.VALORES)); }
      const k = n >= 3 && z.entero(3) === 0 ? 3 : 2;
      const partes = new Array(k).fill(1);
      for (let i = 0; i < n - k; i++) partes[z.entero(k)]++;
      const hijos = partes.map(p => this.generarRed(z, p, !serie, contador));
      return serie ? Red.S(hijos) : Red.P(hijos);
    },
    generar(semilla) {
      const z = new Azar(semilla);
      const n = 4 + z.entero(3);
      // Se descartan redes muy anchas o altas: en un teléfono las etiquetas quedarían diminutas.
      let red;
      do { red = this.generarRed(z, n, true, [0]); } while (anchoRed(red) > 15 || altoRed(red) > 6);
      const hs = hojas(red);
      const fuente = z.de([6, 9, 10, 12, 18, 20, 24, 30]);
      const objetivo = z.de(hs).nombre;
      const pregunta = z.moneda() ? "CORRIENTE" : "VOLTAJE";
      return new ProblemaCap3(red, fuente, objetivo, pregunta, semilla);
    },
  };

  // ───────────────────────────── Cap. 4 ─────────────────────────────
  const fuenteVAleatoria = (e, z, nombre, arriba, abajo, v, lado) => {
    if (z.moneda()) e.fuenteV(nombre, arriba, abajo, v, { lado }); else e.fuenteV(nombre, abajo, arriba, v, { lado });
  };
  const fuenteIAleatoria = (e, z, nombre, p, q, i, lado) => {
    if (z.moneda()) e.fuenteI(nombre, p, q, i, { lado }); else e.fuenteI(nombre, q, p, i, { lado });
  };
  const ctrl = (elemento, magnitud) => ({ elemento, magnitud });
  const plantilla = (titulo, construir) => ({ titulo, construir });

  class ProblemaCap4 {
    constructor(metodo, titulo, construido, sistema, semilla, semillaReal, indice) {
      Object.assign(this, { metodo, titulo, construido, sistema, semilla, semillaReal, indice });
    }
    get enunciado() {
      const inc = listaTexto(this.sistema.incognitas);
      return this.metodo === "NODOS"
        ? `Plantea las ecuaciones de nodos en la forma A·x = b con las incógnitas ${inc} (voltajes respecto a tierra). Después resuelve el sistema.`
        : `Plantea las ecuaciones de mallas en la forma A·x = b con las corrientes de malla ${inc} (en sentido horario). Después resuelve el sistema.`;
    }
  }

  const Cap4 = {
    nodos: [
      plantilla("Dos nodos y dos fuentes de corriente", z => {
        const e = new Esquema();
        e.cable(P(0, 0), P(3, 0)); e.cable(P(6, 0), P(9, 0)); e.cable(P(0, 3), P(9, 3));
        e.fuenteI("I1", P(0, 3), P(0, 0), z.corriente(), { lado: "IZQUIERDA" });
        e.resistor("R1", P(3, 0), P(3, 3), z.resistencia());
        e.resistor("R2", P(3, 0), P(6, 0), z.resistencia());
        e.resistor("R3", P(6, 0), P(6, 3), z.resistencia());
        fuenteIAleatoria(e, z, "I2", P(9, 3), P(9, 0), z.corriente(), "DERECHA");
        e.tierra(P(5, 3));
        e.nodo(P(0, 0), "v1", 1); e.nodo(P(9, 0), "v2", 2);
        return e;
      }),
      plantilla("Tres nodos con resistencia de puente", z => {
        const e = new Esquema();
        e.cable(P(0, 0), P(3, 0)); e.cable(P(9, 0), P(12, 0)); e.cable(P(0, 3), P(12, 3));
        e.cable(P(3, 0), P(3, -2)); e.cable(P(9, -2), P(9, 0));
        fuenteIAleatoria(e, z, "I1", P(0, 3), P(0, 0), z.corriente(), "IZQUIERDA");
        e.resistor("R1", P(3, 0), P(3, 3), z.resistencia());
        e.resistor("R2", P(3, 0), P(6, 0), z.resistencia());
        e.resistor("R3", P(6, 0), P(6, 3), z.resistencia());
        e.resistor("R4", P(6, 0), P(9, 0), z.resistencia());
        e.resistor("R5", P(9, 0), P(9, 3), z.resistencia());
        e.resistor("R6", P(3, -2), P(9, -2), z.resistencia());
        fuenteIAleatoria(e, z, "I2", P(12, 3), P(12, 0), z.corriente(), "DERECHA");
        e.tierra(P(10, 3));
        e.nodo(P(0, 0), "v1", 1); e.nodo(P(6, 0), "v2", 2); e.nodo(P(12, 0), "v3", 3);
        return e;
      }),
      plantilla("Fuente de voltaje conectada a tierra", z => {
        const e = new Esquema();
        e.cable(P(6, 0), P(9, 0)); e.cable(P(0, 3), P(9, 3));
        fuenteVAleatoria(e, z, "V1", P(0, 0), P(0, 3), z.voltaje(), "IZQUIERDA");
        e.resistor("R1", P(0, 0), P(3, 0), z.resistencia());
        e.resistor("R2", P(3, 0), P(3, 3), z.resistencia());
        e.resistor("R3", P(3, 0), P(6, 0), z.resistencia());
        e.resistor("R4", P(6, 0), P(6, 3), z.resistencia());
        fuenteIAleatoria(e, z, "I1", P(9, 3), P(9, 0), z.corriente(), "DERECHA");
        e.tierra(P(4, 3));
        e.nodo(P(0, 0), "v1", 1); e.nodo(P(3, 0), "v2", 2); e.nodo(P(9, 0), "v3", 3);
        return e;
      }),
      plantilla("Supernodo", z => {
        const e = new Esquema();
        e.cable(P(6, 0), P(9, 0)); e.cable(P(0, 3), P(9, 3));
        fuenteVAleatoria(e, z, "V1", P(0, 0), P(0, 3), z.voltaje(), "IZQUIERDA");
        e.resistor("R1", P(0, 0), P(3, 0), z.resistencia());
        e.resistor("R2", P(3, 0), P(3, 3), z.resistencia());
        if (z.moneda()) e.fuenteV("V2", P(3, 0), P(6, 0), z.voltaje()); else e.fuenteV("V2", P(6, 0), P(3, 0), z.voltaje());
        e.resistor("R3", P(6, 0), P(6, 3), z.resistencia());
        fuenteIAleatoria(e, z, "I1", P(9, 3), P(9, 0), z.corriente(), "DERECHA");
        e.tierra(P(4, 3));
        e.nodo(P(0, 0), "v1", 1); e.nodo(P(3, 0), "v2", 2); e.nodo(P(9, 0), "v3", 3);
        return e;
      }),
      plantilla("Fuente de corriente controlada por voltaje", z => {
        const e = new Esquema();
        e.cable(P(6, 0), P(9, 0)); e.cable(P(0, 3), P(9, 3));
        fuenteIAleatoria(e, z, "I1", P(0, 3), P(0, 0), z.corriente(), "IZQUIERDA");
        e.resistor("R1", P(0, 0), P(3, 0), z.resistencia());
        e.marcaVoltaje("R1", "vx");
        e.resistor("R2", P(3, 0), P(3, 3), z.resistencia());
        e.resistor("R3", P(3, 0), P(6, 0), z.resistencia());
        const g = z.de([0.1, 0.2, 0.25, 0.5]);
        const texto = `${fmt(g)} vx`;
        if (z.moneda()) e.dependienteI("G1", P(6, 3), P(6, 0), ctrl("R1", "VOLTAJE"), g, texto);
        else e.dependienteI("G1", P(6, 0), P(6, 3), ctrl("R1", "VOLTAJE"), g, texto);
        e.resistor("R4", P(9, 0), P(9, 3), z.resistencia());
        e.tierra(P(4, 3));
        e.nodo(P(0, 0), "v1", 1); e.nodo(P(3, 0), "v2", 2); e.nodo(P(9, 0), "v3", 3);
        return e;
      }),
      plantilla("Fuente de voltaje controlada por corriente", z => {
        const e = new Esquema();
        e.cable(P(0, 3), P(6, 3));
        fuenteVAleatoria(e, z, "V1", P(0, 0), P(0, 3), z.voltaje(), "IZQUIERDA");
        e.resistor("R1", P(0, 0), P(3, 0), z.resistencia());
        e.resistor("R2", P(3, 0), P(3, 3), z.resistencia());
        e.resistor("R3", P(3, 0), P(6, 0), z.resistencia());
        e.marcaCorriente("R3", "ix");
        const r = z.de([2, 3, 4, 5, 6, 10]);
        const texto = `${fmt(r)} ix`;
        if (z.moneda()) e.dependienteV("H1", P(6, 0), P(6, 3), ctrl("R3", "CORRIENTE"), r, texto);
        else e.dependienteV("H1", P(6, 3), P(6, 0), ctrl("R3", "CORRIENTE"), r, texto);
        e.tierra(P(4, 3));
        e.nodo(P(0, 0), "v1", 1); e.nodo(P(3, 0), "v2", 2); e.nodo(P(6, 0), "v3", 3);
        return e;
      }),
    ],
    mallas: [
      plantilla("Dos mallas con dos fuentes de voltaje", z => {
        const e = new Esquema();
        e.cable(P(5, 3), P(10, 3));
        fuenteVAleatoria(e, z, "V1", P(0, 0), P(0, 3), z.voltaje(), "IZQUIERDA");
        e.resistor("R1", P(0, 0), P(5, 0), z.resistencia());
        e.resistor("R2", P(5, 0), P(5, 3), z.resistencia());
        e.resistor("R3", P(5, 0), P(10, 0), z.resistencia());
        fuenteVAleatoria(e, z, "V2", P(10, 0), P(10, 3), z.voltaje(), "DERECHA");
        e.resistor("R4", P(0, 3), P(5, 3), z.resistencia(), { lado: "ABAJO" });
        e.malla(2.5, 1.5, "i1", "V1", "R1", "R2", "R4");
        e.malla(7.5, 1.5, "i2", "R2", "R3", "V2");
        return e;
      }),
      plantilla("Tres mallas", z => {
        const e = new Esquema();
        e.cable(P(0, 3), P(12, 3));
        fuenteVAleatoria(e, z, "V1", P(0, 0), P(0, 3), z.voltaje(), "IZQUIERDA");
        e.resistor("R1", P(0, 0), P(4, 0), z.resistencia());
        e.resistor("R2", P(4, 0), P(4, 3), z.resistencia());
        e.resistor("R3", P(4, 0), P(8, 0), z.resistencia());
        e.resistor("R4", P(8, 0), P(8, 3), z.resistencia());
        e.resistor("R5", P(8, 0), P(12, 0), z.resistencia());
        fuenteVAleatoria(e, z, "V2", P(12, 0), P(12, 3), z.voltaje(), "DERECHA");
        e.malla(2, 1.5, "i1", "V1", "R1", "R2");
        e.malla(6, 1.5, "i2", "R2", "R3", "R4");
        e.malla(10, 1.5, "i3", "R4", "R5", "V2");
        return e;
      }),
      plantilla("Fuente de corriente en una rama externa", z => {
        const e = new Esquema();
        e.cable(P(5, 3), P(10, 3));
        fuenteVAleatoria(e, z, "V1", P(0, 0), P(0, 3), z.voltaje(), "IZQUIERDA");
        e.resistor("R1", P(0, 0), P(5, 0), z.resistencia());
        e.resistor("R2", P(5, 0), P(5, 3), z.resistencia());
        e.resistor("R3", P(5, 0), P(10, 0), z.resistencia());
        fuenteIAleatoria(e, z, "I1", P(10, 0), P(10, 3), z.corriente(), "DERECHA");
        e.resistor("R4", P(0, 3), P(5, 3), z.resistencia(), { lado: "ABAJO" });
        e.malla(2.5, 1.5, "i1", "V1", "R1", "R2", "R4");
        e.malla(7.5, 1.5, "i2", "R2", "R3", "I1");
        return e;
      }),
      plantilla("Supermalla", z => {
        const e = new Esquema();
        e.cable(P(5, 3), P(10, 3));
        fuenteVAleatoria(e, z, "V1", P(0, 0), P(0, 3), z.voltaje(), "IZQUIERDA");
        e.resistor("R1", P(0, 0), P(5, 0), z.resistencia());
        fuenteIAleatoria(e, z, "I1", P(5, 0), P(5, 3), z.corriente(), "DERECHA");
        e.resistor("R2", P(5, 0), P(10, 0), z.resistencia());
        e.resistor("R3", P(10, 0), P(10, 3), z.resistencia());
        e.resistor("R4", P(0, 3), P(5, 3), z.resistencia(), { lado: "ABAJO" });
        e.malla(2.5, 1.5, "i1", "V1", "R1", "I1", "R4");
        e.malla(7.5, 1.5, "i2", "I1", "R2", "R3");
        return e;
      }),
      plantilla("Fuente de voltaje controlada por corriente", z => {
        const e = new Esquema();
        e.cable(P(0, 3), P(10, 3));
        fuenteVAleatoria(e, z, "V1", P(0, 0), P(0, 3), z.voltaje(), "IZQUIERDA");
        e.resistor("R1", P(0, 0), P(5, 0), z.resistencia());
        e.resistor("R2", P(5, 0), P(5, 3), z.resistencia());
        e.marcaCorriente("R2", "ix");
        e.resistor("R3", P(5, 0), P(10, 0), z.resistencia());
        const r = z.de([2, 3, 4, 5, 6]);
        const texto = `${fmt(r)} ix`;
        if (z.moneda()) e.dependienteV("H1", P(10, 0), P(10, 3), ctrl("R2", "CORRIENTE"), r, texto);
        else e.dependienteV("H1", P(10, 3), P(10, 0), ctrl("R2", "CORRIENTE"), r, texto);
        e.malla(2.5, 1.5, "i1", "V1", "R1", "R2");
        e.malla(7.5, 1.5, "i2", "R2", "R3", "H1");
        return e;
      }),
    ],
    plantillas(metodo) { return metodo === "NODOS" ? this.nodos : this.mallas; },
    /** Construye y formula; null si los números salieron feos o el sistema es singular. */
    intentar(metodo, indice, semilla, semillaVisible = semilla) {
      const pl = this.plantillas(metodo)[indice];
      try {
        const construido = pl.construir(new Azar(semilla)).construir();
        const sistema = metodo === "NODOS"
          ? formularNodos(construido.circuito, construido.variable, construido.nombreNodo)
          : formularMallas(construido.circuito, construido.mallas);
        const x = sistema.solucion;
        const maximo = Math.max(...x.map(Math.abs));
        if (x.some(v => !Number.isFinite(v)) || maximo > 200 || maximo < 0.05) return null;
        return new ProblemaCap4(metodo, pl.titulo, construido, sistema, semillaVisible, semilla, indice);
      } catch (ex) {
        return null;
      }
    },
    /** Problema reproducible a partir de una semilla: elige la plantilla y los valores. */
    generar(metodo, semilla, indice = null) {
      const i = indice ?? new Azar(semilla).entero(this.plantillas(metodo).length);
      let s = semilla;
      for (let n = 0; n < 200; n++) {
        const p = this.intentar(metodo, i, s, semilla);
        if (p) return p;
        s = siguienteSemilla(s);
      }
      throw new Error("No se pudo generar un problema");
    },
  };

  // ───────────────────────────── Cap. 5 ─────────────────────────────
  class ProblemaCap5 {
    constructor(titulo, indice, construido, a, b, equivalente, rthSinDependientes, semilla) {
      Object.assign(this, { titulo, indice, construido, a, b, equivalente, rthSinDependientes, semilla });
    }
    get tieneDependientes() { return this.construido.circuito.tieneDependientes; }
  }

  const Cap5 = {
    plantillas: [
      plantilla("Fuente de voltaje y fuente de corriente", z => {
        const e = new Esquema();
        e.cable(P(3, 0), P(6, 0)); e.cable(P(9, 0), P(10, 0)); e.cable(P(0, 3), P(10, 3));
        if (z.moneda()) e.fuenteV("V1", P(0, 0), P(0, 3), z.voltaje(), { lado: "IZQUIERDA" });
        else e.fuenteV("V1", P(0, 3), P(0, 0), z.voltaje(), { lado: "IZQUIERDA" });
        e.resistor("R1", P(0, 0), P(3, 0), z.resistencia());
        e.resistor("R2", P(3, 0), P(3, 3), z.resistencia());
        if (z.moneda()) e.fuenteI("I1", P(6, 3), P(6, 0), z.corriente()); else e.fuenteI("I1", P(6, 0), P(6, 3), z.corriente());
        e.resistor("R3", P(6, 0), P(9, 0), z.resistencia());
        e.terminal(P(10, 0), "a"); e.terminal(P(10, 3), "b");
        return e;
      }),
      plantilla("Fuente de voltaje flotante", z => {
        const e = new Esquema();
        e.cable(P(0, 0), P(3, 0)); e.cable(P(9, 0), P(10, 0)); e.cable(P(0, 3), P(10, 3));
        if (z.moneda()) e.fuenteI("I1", P(0, 3), P(0, 0), z.corriente(), { lado: "IZQUIERDA" });
        else e.fuenteI("I1", P(0, 0), P(0, 3), z.corriente(), { lado: "IZQUIERDA" });
        e.resistor("R1", P(3, 0), P(3, 3), z.resistencia());
        if (z.moneda()) e.fuenteV("V1", P(3, 0), P(6, 0), z.voltaje()); else e.fuenteV("V1", P(6, 0), P(3, 0), z.voltaje());
        e.resistor("R2", P(6, 0), P(6, 3), z.resistencia());
        e.resistor("R3", P(6, 0), P(9, 0), z.resistencia());
        e.terminal(P(10, 0), "a"); e.terminal(P(10, 3), "b");
        return e;
      }),
      plantilla("Fuente de corriente controlada por voltaje", z => {
        const e = new Esquema();
        e.cable(P(3, 0), P(6, 0)); e.cable(P(9, 0), P(10, 0)); e.cable(P(0, 3), P(10, 3));
        if (z.moneda()) e.fuenteI("I1", P(0, 3), P(0, 0), z.corriente(), { lado: "IZQUIERDA" });
        else e.fuenteI("I1", P(0, 0), P(0, 3), z.corriente(), { lado: "IZQUIERDA" });
        e.resistor("R1", P(0, 0), P(3, 0), z.resistencia());
        e.resistor("R2", P(3, 0), P(3, 3), z.resistencia());
        e.marcaVoltaje("R2", "vx");
        const g = z.de([0.1, 0.2, 0.25, 0.5]);
        const texto = `${fmt(g)} vx`;
        if (z.moneda()) e.dependienteI("G1", P(6, 0), P(6, 3), ctrl("R2", "VOLTAJE"), g, texto);
        else e.dependienteI("G1", P(6, 3), P(6, 0), ctrl("R2", "VOLTAJE"), g, texto);
        e.resistor("R3", P(6, 0), P(9, 0), z.resistencia());
        e.terminal(P(10, 0), "a"); e.terminal(P(10, 3), "b");
        return e;
      }),
      plantilla("Fuente de voltaje controlada por corriente", z => {
        const e = new Esquema();
        e.cable(P(6, 0), P(7, 0)); e.cable(P(0, 3), P(7, 3));
        if (z.moneda()) e.fuenteV("V1", P(0, 0), P(0, 3), z.voltaje(), { lado: "IZQUIERDA" });
        else e.fuenteV("V1", P(0, 3), P(0, 0), z.voltaje(), { lado: "IZQUIERDA" });
        e.resistor("R1", P(0, 0), P(3, 0), z.resistencia());
        e.marcaCorriente("R1", "ix");
        e.resistor("R2", P(3, 0), P(3, 3), z.resistencia());
        const r = z.de([2, 3, 4, 5, 6]);
        const texto = `${fmt(r)} ix`;
        if (z.moneda()) e.dependienteV("H1", P(3, 0), P(6, 0), ctrl("R1", "CORRIENTE"), r, texto);
        else e.dependienteV("H1", P(6, 0), P(3, 0), ctrl("R1", "CORRIENTE"), r, texto);
        e.terminal(P(7, 0), "a"); e.terminal(P(7, 3), "b");
        return e;
      }),
      plantilla("Puente de Wheatstone", z => {
        const e = new Esquema();
        e.cable(P(0, 0), P(9, 0)); e.cable(P(0, 6), P(9, 6));
        e.cable(P(3, 3), P(5, 3)); e.cable(P(9, 3), P(7, 3));
        if (z.moneda()) e.fuenteV("V1", P(0, 0), P(0, 6), z.voltaje(), { lado: "IZQUIERDA" });
        else e.fuenteV("V1", P(0, 6), P(0, 0), z.voltaje(), { lado: "IZQUIERDA" });
        e.resistor("R1", P(3, 0), P(3, 3), z.resistencia(), { lado: "IZQUIERDA" });
        e.resistor("R2", P(3, 3), P(3, 6), z.resistencia(), { lado: "IZQUIERDA" });
        e.resistor("R3", P(9, 0), P(9, 3), z.resistencia());
        e.resistor("R4", P(9, 3), P(9, 6), z.resistencia());
        e.terminal(P(5, 3), "a", "ABAJO"); e.terminal(P(7, 3), "b", "ABAJO");
        return e;
      }),
    ],
    intentar(indice, semilla, semillaVisible = semilla, exigente = true) {
      try {
        const pl = this.plantillas[indice];
        const construido = pl.construir(new Azar(semilla)).construir();
        const a = construido.nodoDeTerminal("a"), b = construido.nodoDeTerminal("b");
        const eq = thevenin(construido.circuito, a, b);
        const rth = eq ? eq.rth : null;
        const valido = eq && rth !== null && Number.isFinite(rth) &&
          (!exigente || (rth > 0.2 && rth < 500 && Math.abs(eq.voc) > 0.05 && Math.abs(eq.voc) < 500));
        if (!valido) return null;
        const sinDep = construido.circuito.tieneDependientes
          ? (thevenin(construido.circuito, a, b, true) || {}).rth ?? null : null;
        return new ProblemaCap5(pl.titulo, indice, construido, a, b, eq, sinDep, semillaVisible);
      } catch (ex) {
        return null;
      }
    },
    generar(semilla, indice = null) {
      const i = indice ?? new Azar(semilla).entero(this.plantillas.length);
      let s = semilla;
      for (let n = 0; n < 200; n++) {
        const p = this.intentar(i, s, semilla);
        if (p) return p;
        s = siguienteSemilla(s);
      }
      throw new Error("No se pudo generar un problema");
    },
  };

  // ───────────────────────────── Cap. 6 ─────────────────────────────
  const CONFIGURACIONES = [
    { id: "INVERSOR", titulo: "Inversor", entradas: 1 },
    { id: "NO_INVERSOR", titulo: "No inversor", entradas: 1 },
    { id: "SUMADOR", titulo: "Sumador inversor", entradas: 2 },
    { id: "DIFERENCIAL", titulo: "Diferencial", entradas: 2 },
    { id: "SEGUIDOR", titulo: "Seguidor de voltaje", entradas: 1 },
  ];
  const conf = id => CONFIGURACIONES.find(c => c.id === id);

  /** Circuito con un amp. op. ideal: r1 (entrada v1), rf (realimentación), r3 (entrada v2), r4 (+ a tierra). */
  class CircuitoAmpOp {
    constructor(conf, r1, rf, r3, r4, v1, v2, vsat) { Object.assign(this, { conf, r1, rf, r3, r4, v1, v2, vsat }); }
    con(cambios) { return Object.assign(new CircuitoAmpOp(), this, cambios); }
    /** Fórmula del libro para la salida ideal. */
    get formula() {
      const { r1, rf, r3, r4, v1, v2 } = this;
      switch (this.conf.id) {
        case "INVERSOR": return -rf / r1 * v1;
        case "NO_INVERSOR": return (1 + rf / r1) * v1;
        case "SUMADOR": return -rf * (v1 / r1 + v2 / r3);
        case "DIFERENCIAL": return -rf / r1 * v1 + (1 + rf / r1) * r4 / (r3 + r4) * v2;
        default: return v1;
      }
    }
    get formulaTexto() {
      switch (this.conf.id) {
        case "INVERSOR": return "vo = −(Rf / R1)·v1";
        case "NO_INVERSOR": return "vo = (1 + Rf / R1)·v1";
        case "SUMADOR": return "vo = −Rf·(v1 / R1 + v2 / R2)";
        case "DIFERENCIAL": return "vo = −(Rf / R1)·v1 + (1 + Rf / R1)·R4 / (R3 + R4)·v2";
        default: return "vo = v1";
      }
    }
    esquema() {
      const e = new Esquema();
      const r = (nombre, a, b, valor, lado) => e.resistor(nombre, a, b, valor, { lado, etiqueta: `${nombre} = ${fmtSI(valor, "Ω")}` });
      const t1 = `v1 = ${fmt(this.v1)} V`, t2 = `v2 = ${fmt(this.v2)} V`;
      switch (this.conf.id) {
        case "INVERSOR":
          e.entrada("V1", P(1, 2), this.v1, P(6, 5), t1);
          r("R1", P(1, 2), P(5, 2), this.r1);
          e.cable(P(5, 2), P(7, 2));
          e.cable(P(5, 2), P(5, 0)); r("Rf", P(5, 0), P(11, 0), this.rf); e.cable(P(11, 0), P(11, 3));
          e.cable(P(7, 4), P(6, 4), P(6, 5)); e.tierra(P(6, 5));
          e.ampOp("OA", 7, 2);
          e.cable(P(11, 3), P(12, 3)); e.terminal(P(12, 3), "vo");
          break;
        case "NO_INVERSOR":
          e.entrada("V1", P(2, 4), this.v1, P(2, 2), t1);
          e.cable(P(2, 4), P(7, 4));
          r("R1", P(2, 2), P(5, 2), this.r1); e.tierra(P(2, 2));
          e.cable(P(5, 2), P(7, 2));
          e.cable(P(5, 2), P(5, 0)); r("Rf", P(5, 0), P(11, 0), this.rf); e.cable(P(11, 0), P(11, 3));
          e.ampOp("OA", 7, 2);
          e.cable(P(11, 3), P(12, 3)); e.terminal(P(12, 3), "vo");
          break;
        case "SUMADOR":
          e.entrada("V1", P(2, 2), this.v1, P(8, 5), t1);
          r("R1", P(2, 2), P(6, 2), this.r1);
          e.entrada("V2", P(2, 5), this.v2, P(8, 5), t2);
          r("R2", P(2, 5), P(6, 5), this.r3);
          e.cable(P(6, 5), P(6, 2)); e.cable(P(6, 2), P(8, 2));
          e.cable(P(6, 2), P(6, 0)); r("Rf", P(6, 0), P(12, 0), this.rf); e.cable(P(12, 0), P(12, 3));
          e.cable(P(8, 4), P(8, 5)); e.tierra(P(8, 5));
          e.ampOp("OA", 8, 2);
          e.cable(P(12, 3), P(13, 3)); e.terminal(P(13, 3), "vo");
          break;
        case "DIFERENCIAL":
          e.entrada("V1", P(2, 2), this.v1, P(6, 7), t1);
          r("R1", P(2, 2), P(6, 2), this.r1);
          e.cable(P(6, 2), P(8, 2));
          e.cable(P(6, 2), P(6, 0)); r("Rf", P(6, 0), P(12, 0), this.rf); e.cable(P(12, 0), P(12, 3));
          e.entrada("V2", P(2, 4), this.v2, P(6, 7), t2);
          r("R3", P(2, 4), P(6, 4), this.r3);
          e.cable(P(6, 4), P(8, 4));
          r("R4", P(6, 4), P(6, 7), this.r4); e.tierra(P(6, 7));
          e.ampOp("OA", 8, 2);
          e.cable(P(12, 3), P(13, 3)); e.terminal(P(13, 3), "vo");
          break;
        default:
          e.entrada("V1", P(2, 4), this.v1, P(2, 7), t1);
          e.cable(P(2, 4), P(6, 4));
          e.cable(P(6, 2), P(5, 2), P(5, 0), P(11, 0), P(11, 3));
          e.ampOp("OA", 6, 2);
          e.cable(P(10, 3), P(12, 3)); e.terminal(P(12, 3), "vo");
      }
      return e.construir();
    }
    salida() { return salidaAmpOp(this.esquema().circuito, "OA", this.vsat); }
  }

  const Cap6 = {
    R: [1e3, 2e3, 4e3, 5e3, 10e3, 20e3, 40e3, 50e3, 100e3],
    V: [-3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3],
    generar(semilla) {
      const z = new Azar(semilla);
      const c = z.de(CONFIGURACIONES.filter(x => x.id !== "SEGUIDOR"));
      const r1 = z.de(this.R), rf = z.de(this.R), r3 = z.de(this.R), r4 = z.de(this.R);
      const v1 = z.de(this.V), v2 = z.de(this.V), vsat = z.de([10, 12, 15]);
      return { circuito: new CircuitoAmpOp(c, r1, rf, r3, r4, v1, v2, vsat), semilla };
    },
    /** Valores iniciales del explorador para cada configuración. */
    inicial(id) {
      const c = conf(id);
      switch (id) {
        case "INVERSOR": return new CircuitoAmpOp(c, 10e3, 40e3, 10e3, 10e3, 1, 0, 12);
        case "NO_INVERSOR": return new CircuitoAmpOp(c, 10e3, 30e3, 10e3, 10e3, 1, 0, 12);
        case "SUMADOR": return new CircuitoAmpOp(c, 10e3, 20e3, 20e3, 10e3, 1, 2, 12);
        case "DIFERENCIAL": return new CircuitoAmpOp(c, 10e3, 20e3, 10e3, 20e3, 1, 2, 12);
        default: return new CircuitoAmpOp(c, 10e3, 10e3, 10e3, 10e3, 2, 0, 12);
      }
    },
  };

  // ───────────────────────────── Caps. 7–8 ─────────────────────────────
  /** Fuente vs — R1 — nodo — (R2 ∥ C) o (R2 ∥ L); la fuente vale vAntes para t < 0 y vDespues para t > 0. */
  class PrimerOrden {
    constructor(rc, r1, r2, x, vAntes, vDespues) { Object.assign(this, { rc, r1, r2, x, vAntes, vDespues }); }
    con(cambios) { return Object.assign(new PrimerOrden(), this, cambios); }
    get rth() { return this.r1 * this.r2 / (this.r1 + this.r2); }
    get tau() { return this.rc ? this.rth * this.x : this.x / this.rth; }
    estable(v) { return this.rc ? v * this.r2 / (this.r1 + this.r2) : v / this.r1; }
    get x0() { return this.estable(this.vAntes); }
    get xInf() { return this.estable(this.vDespues); }
    valor(t) { return this.xInf + (this.x0 - this.xInf) * Math.exp(-t / this.tau); }
    get variable() { return this.rc ? "v_C" : "i_L"; }
    get unidad() { return this.rc ? "V" : "A"; }
    esquema() {
      const e = new Esquema();
      e.cable(P(3, 0), P(6, 0)); e.cable(P(0, 3), P(6, 3));
      e.fuenteV("Vs", P(0, 0), P(0, 3), this.vDespues, { lado: "IZQUIERDA", etiqueta: "vs(t)" });
      e.resistor("R1", P(0, 0), P(3, 0), this.r1, { etiqueta: fmtSI(this.r1, "Ω") });
      e.resistor("R2", P(3, 0), P(3, 3), this.r2, { etiqueta: fmtSI(this.r2, "Ω") });
      if (this.rc) { e.capacitor("C", P(6, 0), P(6, 3), this.x, { v0: this.x0 }); e.marcaVoltaje("C", "vC"); }
      else { e.inductor("L", P(6, 0), P(6, 3), this.x, { i0: this.x0 }); e.marcaCorriente("L", "iL"); }
      return e.construir();
    }
    /** Comprobación con el simulador: estado estable para t < 0 con la fuente en vAntes. */
    x0Simulado() {
      const c = this.esquema().circuito;
      const antes = new Circuito(c.elementos.map(el => (el.tipo === "V" ? { ...el, valor: this.vAntes } : el)));
      const s = resolverCD(antes);
      return this.rc ? s.voltaje("C").re : s.corriente("L").re;
    }
  }

  const Cap78 = {
    generar(semilla) {
      const z = new Azar(semilla);
      const rc = z.moneda();
      // RC en kΩ y µF; RL en Ω y mH (valores de laboratorio).
      const escalaR = rc ? 1e3 : 1;
      const r1 = z.de([2, 4, 5, 6, 10, 12, 20]) * escalaR;
      const r2 = z.de([2, 3, 4, 5, 6, 10, 20]) * escalaR;
      const x = z.de([1, 2, 5, 10, 20, 50]) * (rc ? 1e-6 : 1e-3);
      let antes = z.de([0, 4, 6, 10, 12, 20, -6, -10]);
      const despues = z.de([5, 8, 10, 12, 15, 24, -5, -12]);
      if (antes === despues) antes = 0;
      const c = new PrimerOrden(rc, r1, r2, x, antes, despues);
      const t1 = c.tau * z.de([0.5, 1, 2, 3]);
      return { circuito: c, t1, semilla };
    },
    inicial(rc) { return rc ? new PrimerOrden(true, 4e3, 4e3, 10e-6, 0, 12) : new PrimerOrden(false, 4, 4, 10e-3, 0, 12); },
  };

  // ───────────────────────────── Cap. 9 ─────────────────────────────
  class Rlc {
    constructor(serie, r, l, c, fuente, v0, i0) { Object.assign(this, { serie, r, l, c, fuente, v0, i0 }); }
    con(cambios) { return Object.assign(new Rlc(), this, cambios); }
    get so() { return this.serie ? SegundoOrden.serie(this.r, this.l, this.c) : SegundoOrden.paralelo(this.r, this.l, this.c); }
    /** v_C(t) en serie (dv/dt(0) = i_L(0)/C) o i_L(t) en paralelo (di/dt(0) = v_C(0)/L). */
    get respuesta() {
      return this.serie ? new RespuestaSegundoOrden(this.so, this.fuente, this.v0, this.i0 / this.c)
        : new RespuestaSegundoOrden(this.so, this.fuente, this.i0, this.v0 / this.l);
    }
    esquema(mostrarValores = true) {
      const e = new Esquema();
      const et = (valor, simbolo) => (mostrarValores ? valor : simbolo);
      if (this.serie) {
        e.cable(P(0, 3), P(6, 3));
        e.fuenteV("V", P(0, 0), P(0, 3), this.fuente, { lado: "IZQUIERDA", etiqueta: et(`${fmt(this.fuente)} V`, "Vs") + "·u(t)" });
        e.resistor("R", P(0, 0), P(3, 0), this.r, { etiqueta: et(`${fmt(this.r, 3)} Ω`, "R") });
        e.inductor("L", P(3, 0), P(6, 0), this.l, { i0: this.i0, etiqueta: et(fmtSI(this.l, "H"), "L") });
        e.marcaCorriente("L", "i");
        e.capacitor("C", P(6, 0), P(6, 3), this.c, { v0: this.v0, etiqueta: et(fmtSI(this.c, "F"), "C") });
        e.marcaVoltaje("C", "vC");
      } else {
        e.cable(P(0, 0), P(12, 0)); e.cable(P(0, 3), P(12, 3));
        e.fuenteI("I", P(0, 3), P(0, 0), this.fuente, { lado: "IZQUIERDA", etiqueta: et(`${fmt(this.fuente)} A`, "Is") + "·u(t)" });
        e.resistor("R", P(4, 0), P(4, 3), this.r, { etiqueta: et(`${fmt(this.r, 3)} Ω`, "R") });
        e.inductor("L", P(8, 0), P(8, 3), this.l, { i0: this.i0, etiqueta: et(fmtSI(this.l, "H"), "L") });
        e.marcaCorriente("L", "iL");
        e.capacitor("C", P(12, 0), P(12, 3), this.c, { v0: this.v0, etiqueta: et(fmtSI(this.c, "F"), "C") });
        e.marcaVoltaje("C", "v");
      }
      return e;
    }
  }

  const Cap9 = {
    generarPractica(semilla) {
      const z = new Azar(semilla);
      const serie = z.moneda();
      const w0 = z.de([2, 4, 5, 10, 20]);
      const l = z.de([0.5, 1, 2]);
      const c = 1 / (w0 * w0 * l);
      const tipo = AMORTIGUAMIENTOS[z.entero(3)];
      let f;
      if (tipo === "CRITICO") f = 1;
      else if (tipo === "SUBAMORTIGUADO") f = z.de(serie ? [0.2, 0.3, 0.4, 0.5, 0.6, 0.8] : [0.25, 0.5]);
      else f = z.de(serie ? [1.25, 1.5, 2, 2.5] : [1.25, 2, 2.5]);
      const alfa = f * w0;
      const r = serie ? 2 * l * alfa : 1 / (2 * alfa * c);
      const fuente = serie ? z.voltaje() : z.corriente();
      return { rlc: new Rlc(serie, r, l, c, fuente, 0, 0), semilla };
    },
  };

  // ───────────────────────────── Cap. 10 ─────────────────────────────
  /** RLC serie en estado estable senoidal: vs(t) = Vm·cos(ωt). l o c en null: ese elemento no está. */
  class CircuitoCA {
    constructor(r, l, c, vm, omega) { Object.assign(this, { r, l, c, vm, omega }); }
    con(cambios) { return Object.assign(new CircuitoCA(), this, cambios); }
    get xl() { return this.l !== null ? this.omega * this.l : 0; }
    get xc() { return this.c !== null ? 1 / (this.omega * this.c) : 0; }
    get z() { return new Complejo(this.r, this.xl - this.xc); }
    get v() { return new Complejo(this.vm); }
    get i() { return this.v.entre(this.z); }
    get vR() { return this.i.por(this.r); }
    get vL() { return this.i.por(new Complejo(0, this.xl)); }
    get vC() { return this.i.por(new Complejo(0, -this.xc)); }
    /** Potencia compleja con amplitudes: S = V·conj(I)/2. */
    get s() { return this.v.por(this.i.conj()).entre(2); }
    get p() { return this.s.re; }
    get q() { return this.s.im; }
    get fp() { return Math.cos(this.z.anguloGrados * Math.PI / 180); }
    get tipoFp() {
      if (Math.abs(this.xl - this.xc) < 1e-12 * (this.xl + this.xc + this.r)) return "unitario";
      return this.xl > this.xc ? "atrasado" : "adelantado";
    }
    esquema() {
      const e = new Esquema();
      e.cable(P(0, 3), P(6, 3));
      e.fuenteV("Vs", P(0, 0), P(0, 3), this.vm, { lado: "IZQUIERDA", etiqueta: `${fmt(this.vm)} cos(${fmt(this.omega)}t) V` });
      e.resistor("R", P(0, 0), P(3, 0), this.r);
      if (this.l !== null) e.inductor("L", P(3, 0), P(6, 0), this.l, { etiqueta: fmtSI(this.l, "H") }); else e.cable(P(3, 0), P(6, 0));
      if (this.c !== null) e.capacitor("C", P(6, 0), P(6, 3), this.c, { etiqueta: fmtSI(this.c, "F") }); else e.cable(P(6, 0), P(6, 3));
      e.marcaCorriente("R", "i");
      return e.construir();
    }
  }

  const Cap10 = {
    generar(semilla) {
      const z = new Azar(semilla);
      const omega = z.de([100, 200, 250, 500, 1000]);
      const tipo = z.entero(3); // 0: RL, 1: RC, 2: RLC
      const l = tipo !== 1 ? z.de([20, 40, 50, 80, 100, 200]) * 1e-3 : null;
      const c = tipo !== 0 ? z.de([10, 20, 25, 50, 100, 200]) * 1e-6 : null;
      const r = z.de([5, 10, 15, 20, 30, 40, 50]);
      const vm = z.de([10, 12, 20, 50, 100, 120]);
      return { circuito: new CircuitoCA(r, l, c, vm, omega), semilla };
    },
    inicial: new CircuitoCA(30, 0.1, 50e-6, 100, 500),
  };

  Object.assign(LAB, {
    TIPOS_ELEMENTO, EjercicioElemento, EjercicioBalance,
    Red, equivalente, hojas, combinar, anchoRed, altoRed, esquemaRed, esquemaRedConFuente, ProblemaCap3, Cap3,
    ProblemaCap4, Cap4, ProblemaCap5, Cap5,
    CONFIGURACIONES, CircuitoAmpOp, Cap6, PrimerOrden, Cap78, Rlc, Cap9, CircuitoCA, Cap10,
  });
})(typeof window !== "undefined" ? window : globalThis);
