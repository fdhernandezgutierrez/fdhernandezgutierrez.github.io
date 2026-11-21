/* cap5.js — Cap. 5: Thévenin y Norton (practicar y explorar terminales, superposición y máxima potencia). */
(function (G) {
  "use strict";
  const L = G.LAB;
  const { h, Tarjeta, Texto, Chico, Mensaje, Boton, Botones, Dato, Linea, Selector, Pildoras, Entrada, Campo, Numero,
    dibujarEsquema, Grafica, Cap5, thevenin, superposicion, leerExpresion, coincide, Esquema, P, semillaNueva, fmt } = L;
  const AZUL = "#1F3A93", TURQ = "#00838F", COLOR_A = "#D81B60", COLOR_B = "#1E88E5";

  function esquemaThevenin(eq) {
    const e = new Esquema(), v = eq.voc, r = eq.rth ?? 0;
    if (v >= 0) e.fuenteV("Vth", P(0, 0), P(0, 3), v, { lado: "IZQUIERDA", etiqueta: `${fmt(v)} V` });
    else e.fuenteV("Vth", P(0, 3), P(0, 0), -v, { lado: "IZQUIERDA", etiqueta: `${fmt(-v)} V` });
    e.resistor("Rth", P(0, 0), P(3, 0), r, { etiqueta: `${fmt(r)} Ω` });
    e.cable(P(3, 0), P(4, 0)); e.cable(P(0, 3), P(4, 3));
    e.terminal(P(4, 0), "a"); e.terminal(P(4, 3), "b");
    return e.construir();
  }
  function esquemaNorton(eq) {
    const e = new Esquema(), i = eq.isc ?? 0, r = eq.rth ?? 0;
    if (i >= 0) e.fuenteI("In", P(0, 3), P(0, 0), i, { lado: "IZQUIERDA", etiqueta: `${fmt(i)} A` });
    else e.fuenteI("In", P(0, 0), P(0, 3), -i, { lado: "IZQUIERDA", etiqueta: `${fmt(-i)} A` });
    e.cable(P(0, 0), P(5, 0)); e.cable(P(0, 3), P(5, 3));
    e.resistor("Rth", P(3, 0), P(3, 3), r, { etiqueta: `${fmt(r)} Ω` });
    e.terminal(P(5, 0), "a"); e.terminal(P(5, 3), "b");
    return e.construir();
  }

  /** Revisión con retroalimentación específica de cada error típico. */
  function revisar(pr, entrada) {
    const eq = pr.equivalente, rth = eq.rth, isc = eq.isc, pmax = eq.potenciaMaxima;
    const leer = id => { const l = leerExpresion(entrada.texto(id)); return l.tipo === "numero" ? l.valor : null; };
    const vacio = id => !entrada.texto(id).trim();
    const r = {};
    const fijar = (id, ok, mensaje) => { r[id] = { ok, mensaje }; entrada.marcar(id, ok); };
    let x = leer("voc");
    if (vacio("voc")) fijar("voc", null, null);
    else if (x === null) fijar("voc", false, "No se entiende lo escrito en v_oc.");
    else if (coincide(x, eq.voc)) fijar("voc", true, "v_oc correcto.");
    else if (Math.abs(eq.voc) > 1e-9 && coincide(x, -eq.voc)) fijar("voc", false, "v_oc: la magnitud es correcta, pero el signo no. Recuerda que v_oc = v_a − v_b.");
    else fijar("voc", false, "v_oc no coincide. Deja a–b abiertas y calcula v_a − v_b.");

    x = leer("rth");
    const sinDep = pr.rthSinDependientes;
    if (vacio("rth")) fijar("rth", null, null);
    else if (x === null) fijar("rth", false, "No se entiende lo escrito en R_th.");
    else if (coincide(x, rth)) fijar("rth", true, "R_th correcta.");
    else if (sinDep !== null && coincide(x, sinDep) && !coincide(sinDep, rth)) fijar("rth", false,
      "R_th: parece que apagaste también la fuente dependiente. Solo se apagan las independientes; con dependientes usa una fuente de prueba en a–b (o R_th = v_oc / i_sc).");
    else if (coincide(x, -rth)) fijar("rth", false, "R_th: revisa el signo.");
    else if (pr.tieneDependientes) fijar("rth", false, "R_th no coincide. Apaga solo las fuentes independientes, conecta una fuente de prueba de 1 A en a–b y calcula v_ab.");
    else fijar("rth", false, "R_th no coincide. Apaga las fuentes independientes (voltaje → corto, corriente → abierto) y reduce lo que se ve desde a–b.");

    x = leer("in");
    if (vacio("in")) fijar("in", null, null);
    else if (x === null) fijar("in", false, "No se entiende lo escrito en I_N.");
    else if (coincide(x, isc)) fijar("in", true, "I_N correcta.");
    else if (Math.abs(isc) > 1e-9 && coincide(x, -isc)) fijar("in", false, "I_N: el signo no. Toma la corriente que va de a hacia b por el corto.");
    else fijar("in", false, "I_N no coincide. I_N = v_oc / R_th, o la corriente de a a b con las terminales en corto.");

    x = leer("pmax");
    if (vacio("pmax")) fijar("pmax", null, null);
    else if (x === null) fijar("pmax", false, "No se entiende lo escrito en P_máx.");
    else if (coincide(x, pmax)) fijar("pmax", true, "P_máx correcta (con R_L = R_th).");
    else if (coincide(x, eq.voc * eq.voc / rth)) fijar("pmax", false, "P_máx: te faltó el 4. P_máx = v_oc² / (4 R_th).");
    else fijar("pmax", false, "P_máx no coincide. Se obtiene con R_L = R_th: P_máx = v_oc² / (4 R_th).");
    return r;
  }

  (L.MODULOS = L.MODULOS || {}).cap5 = {
    titulo: "Cap. 5 · Thévenin y Norton",
    montar(raiz, ctx) {
      let modo = (ctx.extra || "").startsWith("explorar") ? 1 : 0;
      let plantilla = Number((ctx.extra || "").replace(/\D/g, "")) || 0;
      // Práctica
      let pr, entrada, revision, pista, verSolucion;
      // Explorador
      let ex = null;

      function nuevaPractica(s = semillaNueva()) {
        pr = Cap5.generar(s, plantilla === 0 ? null : plantilla - 1);
        ctx.fijarSemilla(s, plantilla ? String(plantilla) : "");
        entrada = new Entrada(["voc", "rth", "in", "pmax"], { voc: "v_oc = V_th en volts", rth: "R_th en ohms", in: "I_N en amperes", pmax: "P_máx en watts" });
        revision = null; pista = 0; verSolucion = false;
        pintar();
      }
      function nuevoExplorador(s = semillaNueva(), pl = ex ? ex.plantilla : 0) {
        const p = Cap5.generar(s, pl);
        ex = { plantilla: pl, pr: p, a: p.a, b: p.b, turnoA: true, activas: {}, rl: null };
        ctx.fijarSemilla(s, "explorar-" + (pl + 1));
        pintar();
      }

      function practica() {
        const eq = pr.equivalente, rth = eq.rth;
        let msgs = null;
        if (revision) {
          const ids = ["voc", "rth", "in", "pmax"];
          if (ids.every(id => revision[id].ok === true)) msgs = Mensaje("¡Equivalente completo y correcto!", "bien");
          else if (ids.every(id => revision[id].ok === null)) msgs = Mensaje("Escribe al menos una respuesta.", "info");
          else msgs = ids.filter(id => revision[id].mensaje).map(id => Mensaje(revision[id].mensaje, revision[id].ok ? "bien" : "mal"));
        }
        return [
          Pildoras(["Al azar"].concat(Cap5.plantillas.map(p => p.titulo)), plantilla, i => { plantilla = i; nuevaPractica(); }),
          Tarjeta(null,
            Texto("Encuentra el equivalente de Thévenin visto desde las terminales a y b, la corriente de Norton y la potencia máxima que el circuito puede entregar a una carga R_L."),
            dibujarEsquema(pr.construido), Chico(pr.titulo), Numero(pr.semilla, nuevaPractica)),
          Tarjeta("Tus respuestas",
            Campo("v_oc = V_th", "voc", "V", entrada), Campo("R_th", "rth", "Ω", entrada),
            Campo("I_N (de a a b)", "in", "A", entrada), Campo("P_máx en R_L", "pmax", "W", entrada),
            Botones(
              Boton("Revisar", () => { revision = revisar(pr, entrada); pintar(); }),
              Boton(pista === 0 ? "Pista" : "Otra pista", () => { pista = Math.min(pista + 1, 2); pintar(); }, false),
              Boton("Solución", () => { verSolucion = true; pintar(); }, false),
            ),
            msgs,
            pista >= 1 ? Mensaje("v_oc: con a–b abiertas, calcula v_a − v_b por nodos o mallas. " + (pr.tieneDependientes
              ? "R_th: hay una fuente dependiente, así que no se apaga; apaga solo las independientes y usa una fuente de prueba de 1 A en a–b."
              : "R_th: apaga las fuentes independientes (voltaje → corto, corriente → abierto) y reduce desde a–b."), "info") : null,
            pista >= 2 ? Mensaje(`Dato: con a–b en corto circulan ${fmt(eq.isc)} A de a hacia b. Con eso, R_th = v_oc / i_sc.`, "info") : null,
            verSolucion ? [Linea(), h("b", { style: { color: AZUL }, text: "Solución" }),
              Dato("1. v_oc = v_a − v_b (a–b abiertas)", `${fmt(eq.voc)} V`),
              Dato(pr.tieneDependientes ? "2. R_th (fuente de prueba de 1 A)" : "2. R_th (fuentes apagadas)", `${fmt(rth)} Ω`),
              Dato("3. I_N = v_oc / R_th", `${fmt(eq.isc)} A`),
              Dato("4. P_máx = v_oc² / (4 R_th)", `${fmt(eq.potenciaMaxima)} W`),
              Chico(`La potencia máxima se obtiene con R_L = R_th = ${fmt(rth)} Ω.`)] : null,
          ),
          Boton("Nuevo problema", () => nuevaPractica(), true, "ancho"),
        ];
      }

      function explorador() {
        const { pr: p, a, b } = ex;
        const circuito = p.construido.circuito;
        const partes = [
          Pildoras(Cap5.plantillas.map(x => x.titulo), ex.plantilla, i => nuevoExplorador(semillaNueva(), i)),
          Tarjeta(null,
            Texto(`Toca un nodo para ponerle la terminal ${ex.turnoA ? "a" : "b"}. Los toques se alternan entre a y b.`),
            dibujarEsquema(p.construido, {
              nodoA: a, nodoB: b, titulo: "Circuito: toca un nodo para elegir las terminales",
              alTocarNodo: n => { if (ex.turnoA) ex.a = n; else ex.b = n; ex.turnoA = !ex.turnoA; ex.rl = null; pintar(); },
            }),
            h("div", { class: "lab-botones", style: { alignItems: "center" } },
              h("b", { style: { color: COLOR_A }, text: "● a" }), h("b", { style: { color: COLOR_B, flex: 1 }, text: "● b" }),
              Boton("Valores nuevos", () => nuevoExplorador(), false))),
        ];
        if (a === b) return partes.concat(Mensaje("Elige dos nodos distintos para a y b.", "aviso"));
        const eq = thevenin(circuito, a, b);
        if (!eq) return partes.concat(Mensaje("Con estas terminales no se puede calcular el equivalente.", "aviso"));
        const rth = eq.rth;
        partes.push(Tarjeta("Equivalentes vistos desde a–b",
          Dato("V_th = v_oc", `${fmt(eq.voc)} V`),
          Dato("R_th", rth === null ? "∞ (no hay Thévenin)" : `${fmt(rth)} Ω`),
          Dato("I_N = i_sc (de a a b)", eq.isc !== null ? `${fmt(eq.isc)} A` : "— (R_th = 0)"),
          rth !== null && eq.isc !== null ? h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" } },
            h("div", null, Chico("Thévenin"), dibujarEsquema(esquemaThevenin(eq))),
            h("div", null, Chico("Norton"), dibujarEsquema(esquemaNorton(eq)))) : null));

        // Superposición
        const aportes = superposicion(circuito, a, b);
        const etiquetas = new Map(p.construido.esquema.componentes.map(c => [c.nombre, c.etiqueta]));
        const sumaTxt = h("b", { style: { color: AZUL } });
        const recalcular = () => {
          const suma = aportes.reduce((s, [f, ap]) => s + (ex.activas[f.nombre] !== false ? ap : 0), 0);
          sumaTxt.textContent = `${fmt(suma)} V`;
        };
        recalcular();
        partes.push(Tarjeta("Superposición",
          Chico("Apaga fuentes independientes (voltaje → corto, corriente → abierto) y mira cuánto aporta cada una a v_oc. Las dependientes nunca se apagan."),
          aportes.map(([f, ap]) => {
            const activa = ex.activas[f.nombre] !== false;
            const aporte = h("small", { style: { color: activa ? AZUL : "#667085" }, text: `aporta ${fmt(ap)} V` });
            const caja = h("input", { type: "checkbox", role: "switch", "aria-label": "Encender la fuente " + (etiquetas.get(f.nombre) || "") });
            caja.checked = activa;
            caja.addEventListener("change", () => { ex.activas[f.nombre] = caja.checked; aporte.style.color = caja.checked ? AZUL : "#667085"; recalcular(); });
            return h("label", { style: { display: "flex", gap: "10px", alignItems: "center", cursor: "pointer" } }, caja,
              h("span", { style: { display: "grid" } }, h("span", { text: `${f.tipo === "V" ? "Fuente de voltaje" : "Fuente de corriente"} de ${etiquetas.get(f.nombre) || ""}` }), aporte));
          }),
          Linea(), h("div", { class: "lab-dato" }, h("span", { text: "v_oc con las fuentes encendidas" }), sumaTxt)));

        // Máxima transferencia de potencia
        if (rth !== null && rth > 1e-9) {
          if (ex.rl === null) ex.rl = rth;
          const datos = h("div", { style: { display: "grid", gap: "6px" } });
          const grafica = h("div");
          const xs = Array.from({ length: 161 }, (_, i) => 4 * rth * i / 160);
          const ys = xs.map(x => eq.potenciaEnCarga(x));
          const actualizar = () => {
            const rl = ex.rl, il = eq.voc / (rth + rl);
            L.poner(datos, 
              Dato("R_L", `${fmt(rl, 3)} Ω`), Dato("i_L = V_th / (R_th + R_L)", `${fmt(il, 3)} A`),
              Dato("P_L = i_L² R_L", `${fmt(il * il * rl, 3)} W`, AZUL), Dato("P_máx (R_L = R_th)", `${fmt(eq.potenciaMaxima, 3)} W`));
            L.poner(grafica, Grafica([{ x: xs, y: ys, color: AZUL }], "R_L (Ω)", "P_L (W)",
              { verticales: [[rth, TURQ]], puntos: [[rl, eq.potenciaEnCarga(rl), COLOR_A]] }));
          };
          const deslizador = h("input", { type: "range", min: 0, max: 4 * rth, step: rth / 200, value: ex.rl, "aria-label": "Resistencia de carga R_L", style: { width: "100%", accentColor: AZUL } });
          deslizador.addEventListener("input", () => { ex.rl = Number(deslizador.value); actualizar(); });
          actualizar();
          partes.push(Tarjeta("Máxima transferencia de potencia",
            Chico("Mueve la carga R_L conectada entre a y b. La potencia es máxima cuando R_L = R_th."), deslizador, datos, grafica));
        } else if (rth !== null) {
          partes.push(Mensaje("R_th ≤ 0: con una fuente dependiente el circuito puede entregar potencia sin un máximo finito.", "aviso"));
        }
        return partes;
      }

      function pintar() {
        ctx.subtitulo(modo === 0 ? "Practicar" : "Explorar");
        L.poner(raiz, 
          Selector(["Practicar", "Explorar"], modo, i => {
            if (i === modo) return;
            modo = i;
            if (modo === 1 && !ex) nuevoExplorador(); else if (modo === 0 && !pr) nuevaPractica(); else pintar();
          }),
          ...(modo === 0 ? practica() : explorador()),
        );
      }

      if (modo === 1) { const pl = Math.max(0, plantilla - 1); nuevoExplorador(ctx.semilla || semillaNueva(), Math.min(pl, Cap5.plantillas.length - 1)); }
      else nuevaPractica(ctx.semilla || semillaNueva());
    },
  };
})(window);
