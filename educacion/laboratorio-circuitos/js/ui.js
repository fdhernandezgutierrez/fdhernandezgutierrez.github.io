/* ==========================================================================
   ui.js — componentes de la interfaz del laboratorio (equivalentes a los de
   la app): tarjetas, mensajes, selectores, celdas de respuesta con teclado
   propio en pantallas táctiles, revisión de respuestas y deslizadores.
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function (G) {
  "use strict";
  const LAB = (G.LAB = G.LAB || {});
  const { leerExpresion, coincide, fmt } = LAB;

  /** Crea un elemento: h("div", {class, text, onclick, ...}, ...hijos). */
  function h(tag, props, ...hijos) {
    const el = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of hijos.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : String(c));
    return el;
  }

  /** Reemplaza el contenido de [raiz] aplanando listas y omitiendo los vacíos (null, false). */
  const poner = (raiz, ...hijos) => raiz.replaceChildren(...hijos.flat(Infinity).filter(x => x !== null && x !== undefined && x !== false));

  const Tarjeta = (titulo, ...hijos) => h("section", { class: "lab-tarjeta" }, titulo ? h("h3", { text: titulo }) : null, ...hijos);
  const Texto = t => h("p", { class: "lab-texto", text: t });
  const Chico = (t, clase = "") => h("p", { class: "lab-chico " + clase, text: t });
  const ICONO = { bien: "✓", mal: "✗", info: "i", aviso: "!" };
  const Mensaje = (texto, tipo = "info") => h("div", { class: "lab-mensaje " + tipo, role: tipo === "mal" ? "alert" : "status" }, h("i", { text: ICONO[tipo] }), h("span", { text: texto }));
  const Boton = (texto, onclick, principal = true, extra = "") => h("button", { type: "button", class: "lab-boton " + (principal ? "" : "sec ") + extra, onclick }, texto);
  const Botones = (...b) => h("div", { class: "lab-botones" }, ...b);
  const Dato = (etiqueta, valor, color) => h("div", { class: "lab-dato" }, h("span", { text: etiqueta }), h("b", { text: valor, style: color ? { color } : null }));
  const Linea = () => h("hr", { class: "lab-linea" });

  function Selector(opciones, seleccion, alElegir) {
    return h("div", { class: "lab-selector", role: "tablist" },
      opciones.map((t, i) => h("button", { type: "button", role: "tab", "aria-selected": String(i === seleccion), class: i === seleccion ? "sel" : "", onclick: () => alElegir(i) }, t)));
  }
  function Pildoras(opciones, seleccion, alElegir) {
    return h("div", { class: "lab-pildoras" },
      opciones.map((t, i) => h("button", { type: "button", class: i === seleccion ? "sel" : "", onclick: () => alElegir(i) }, t)));
  }

  // ───────────────────────── Celdas de respuesta ─────────────────────────
  const TACTIL = G.matchMedia && G.matchMedia("(pointer: coarse)").matches;

  /** Estado de las celdas de un ejercicio: textos, orden de navegación y etiquetas para el teclado. */
  class Entrada {
    constructor(orden = [], etiquetas = {}) { this.textos = {}; this.orden = orden; this.etiquetas = etiquetas; this.estados = {}; }
    texto(id) { return this.textos[id] || ""; }
    borrar(id) { delete this.textos[id]; delete this.estados[id]; }
    /** Celda <input>; con [estado] "bien" o "mal" se pinta el borde. */
    celda(id, marcador = "0") {
      const el = h("input", {
        class: "celda " + (this.estados[id] || ""), type: "text", value: this.texto(id), placeholder: marcador,
        autocomplete: "off", spellcheck: "false", "data-id": id, "data-etiqueta": this.etiquetas[id] || "",
        "aria-label": this.etiquetas[id] || id, inputmode: TACTIL ? "none" : "text", maxlength: "28",
      });
      el.addEventListener("input", () => { this.textos[id] = el.value; });
      el.addEventListener("focus", () => Teclado.mostrar(this, id, el));
      el._entrada = this;
      return el;
    }
    marcar(id, ok) { this.estados[id] = ok === true ? "bien" : ok === false ? "mal" : ""; }
  }

  /** «etiqueta [celda] unidad». */
  const Campo = (etiqueta, id, unidad, entrada, marcador = "") =>
    h("label", { class: "lab-campo" }, h("span", { text: etiqueta }), entrada.celda(id, marcador), h("span", { class: "unidad", text: unidad }));

  // Teclado propio: solo en pantallas táctiles (en computadora se escribe directo).
  const Teclado = {
    el: null, entrada: null, id: null, input: null,
    crear() {
      if (this.el) return;
      const teclas = ["7", "8", "9", "/", "⌫", "4", "5", "6", "*", "(", "1", "2", "3", "+", ")", "-", "0", ".", "◀", "▶"];
      this.vista = h("em");
      this.etiqueta = h("span");
      this.el = h("div", { class: "lab-teclado", "aria-hidden": "true" },
        h("div", { class: "cab" }, this.etiqueta, this.vista, h("button", { type: "button", onclick: () => this.ocultar() }, "Listo ▾")),
        h("div", { class: "filas" }, teclas.map(t => h("button", {
          type: "button", class: /[0-9.]/.test(t) ? "num" : "",
          onpointerdown: ev => ev.preventDefault(), onclick: () => this.tecla(t),
        }, t === "*" ? "×" : t === "-" ? "−" : t))));
      document.body.append(this.el);
    },
    mostrar(entrada, id, input) {
      if (!TACTIL) return;
      this.crear();
      this.entrada = entrada; this.id = id; this.input = input;
      this.etiqueta.textContent = entrada.etiquetas[id] || "";
      this.actualizarVista();
      this.el.classList.add("ver");
      document.body.style.paddingBottom = this.el.offsetHeight + "px";
      setTimeout(() => input.scrollIntoView({ block: "nearest", behavior: "smooth" }), 50);
    },
    ocultar() {
      if (!this.el) return;
      this.el.classList.remove("ver");
      document.body.style.paddingBottom = "";
      if (this.input) this.input.blur();
      this.input = null;
    },
    actualizarVista() {
      const l = leerExpresion(this.input ? this.input.value : "");
      this.vista.textContent = l.tipo === "numero" ? "= " + fmt(l.valor, 6) : l.tipo === "invalida" ? "…" : "";
    },
    tecla(t) {
      const input = this.input;
      if (!input || !document.body.contains(input)) return this.ocultar();
      if (t === "◀" || t === "▶") {
        const orden = this.entrada.orden.filter(id => document.querySelector(`.celda[data-id="${id}"]`));
        const i = orden.indexOf(this.id);
        if (i >= 0 && orden.length) {
          const sig = orden[(i + (t === "▶" ? 1 : -1) + orden.length) % orden.length];
          document.querySelector(`.celda[data-id="${sig}"]`).focus();
        }
        return;
      }
      if (t === "⌫") input.value = input.value.slice(0, -1);
      else if (input.value.length < 28) input.value += t;
      input.dispatchEvent(new Event("input"));
      this.actualizarVista();
    },
  };
  document.addEventListener("focusout", () => setTimeout(() => {
    if (Teclado.el && !document.activeElement?.classList?.contains("celda")) Teclado.ocultar();
  }, 120));

  // ───────────────────────── Revisión ─────────────────────────
  /**
   * Revisa una respuesta numérica. [errores] = [[valor, explicación]]: si la respuesta coincide con
   * un error típico se explica ese error en lugar de la ayuda general. Devuelve {ok: true|false|null, mensaje}.
   */
  function revisarCampo(entrada, id, nombre, esperado, ayuda, errores = [], escala = Math.abs(esperado)) {
    const t = entrada.texto(id);
    if (!t.trim()) { entrada.marcar(id, null); return { ok: null, mensaje: null }; }
    const l = leerExpresion(t);
    let r;
    if (l.tipo !== "numero") r = { ok: false, mensaje: `No se entiende lo escrito en ${nombre}.` };
    else if (coincide(l.valor, esperado, escala)) r = { ok: true, mensaje: null };
    else {
      r = { ok: false, mensaje: `${nombre}: ${ayuda}` };
      for (const [valor, msg] of errores) {
        if (!coincide(valor, esperado, escala) && coincide(l.valor, valor, escala)) { r = { ok: false, mensaje: `${nombre}: ${msg}` }; break; }
      }
    }
    entrada.marcar(id, r.ok);
    return r;
  }

  /** Mensajes de una revisión de varias celdas. */
  function ResultadoRevision(revisiones, mensajeBien) {
    if (!revisiones) return null;
    const llenas = revisiones.filter(r => r.ok !== null);
    if (llenas.length === 0) return Mensaje("Escribe al menos una respuesta.", "info");
    if (llenas.length === revisiones.length && llenas.every(r => r.ok)) return Mensaje(mensajeBien, "bien");
    const out = llenas.filter(r => r.ok === false && r.mensaje).map(r => Mensaje(r.mensaje, "mal"));
    if (llenas.every(r => r.ok)) out.push(Mensaje("Lo que llevas está bien; faltan respuestas.", "info"));
    return h("div", { style: { display: "grid", gap: "8px" } }, out);
  }

  // ───────────────────────── Deslizadores ─────────────────────────
  /** Redondea a 2 cifras significativas, para que los valores parezcan de componentes reales. */
  function redondearDos(x) {
    if (x === 0) return 0;
    const f = Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 1);
    return Math.round(x / f) * f;
  }
  class EscalaLog {
    constructor(min, max) { this.min = min; this.max = max; }
    valor(p) { return redondearDos(this.min * Math.pow(this.max / this.min, p)); }
    posicion(v) { return Math.min(1, Math.max(0, Math.log(v / this.min) / Math.log(this.max / this.min))); }
  }
  /** Deslizador con etiqueta y valor; alCambiar(pos) debe devolver el texto del valor nuevo. */
  function Deslizador(etiqueta, valorTexto, posicion, alCambiar, min = 0, max = 1, paso = 0.001) {
    const b = h("b", { text: valorTexto });
    const input = h("input", { type: "range", min, max, step: paso, value: posicion, "aria-label": etiqueta });
    input.addEventListener("input", () => { const t = alCambiar(Number(input.value)); if (t !== undefined) b.textContent = t; });
    return h("div", { class: "lab-deslizador" }, h("div", { class: "cab" }, h("span", { text: etiqueta }), b), input);
  }

  // ───────────────────────── Número de problema ─────────────────────────
  /** «Problema n.º 123456 · Ir a otro número» para repetir un problema dictado en clase. */
  function Numero(semilla, alIr) {
    const input = h("input", { type: "text", inputmode: "numeric", value: "", placeholder: "n.º", "aria-label": "Número de problema" });
    const ir = () => {
      const n = parseInt(input.value.replace(/\D/g, ""), 10);
      if (Number.isFinite(n) && n > 0) alIr(n);
    };
    input.addEventListener("keydown", ev => { if (ev.key === "Enter") ir(); });
    return h("div", { class: "lab-numero" }, h("span", { text: `Problema n.º ${semilla}` }), h("span", { text: "·" }),
      h("span", { text: "Ir al problema" }), input, h("button", { type: "button", onclick: ir }, "Ir"));
  }

  Object.assign(LAB, {
    h, poner, Tarjeta, Texto, Chico, Mensaje, Boton, Botones, Dato, Linea, Selector, Pildoras,
    Entrada, Campo, Teclado, revisarCampo, ResultadoRevision, redondearDos, EscalaLog, Deslizador, Numero, TACTIL,
  });
})(window);
