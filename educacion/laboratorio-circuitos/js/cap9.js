/* cap9.js — Cap. 9: circuitos RLC (plano s, lugar de las raíces, respuesta y práctica). */
(function (G) {
  "use strict";
  const L = G.LAB;
  const { h, Tarjeta, Texto, Chico, Mensaje, Boton, Botones, Dato, Linea, Selector, Entrada, Campo, Numero,
    dibujarEsquema, Grafica, PlanoS, Deslizador, EscalaLog, Cap9, Rlc, SegundoOrden, AMORTIGUAMIENTOS, NOMBRE_AMORT,
    simularTransitorio, leerExpresion, coincide, semillaNueva, fmt, fmtSI } = L;
  const AZUL = "#1F3A93", NARANJA = "#E65100", MORADO = "#6A1B9A", GRIS = "#667085", VERDE = "#2E7D32", ROJO = "#C62828", BORDE = "#D0D5DD";
  const COLOR_TIPO = { SOBREAMORTIGUADO: AZUL, CRITICO: NARANJA, SUBAMORTIGUADO: MORADO };
  const RANGO_R = new EscalaLog(0.5, 500), RANGO_L = new EscalaLog(0.01, 10), RANGO_C = new EscalaLog(1e-5, 1);
  const signo = x => (x < 0 ? "−" : "+");
  const textoComplejo = z => (Math.abs(z.im) < 1e-9 ? fmt(z.re, 4) : `${fmt(z.re, 4)} ${z.im < 0 ? "−" : "+"} j${fmt(Math.abs(z.im), 4)}`);
  const formaNatural = t => ({
    SOBREAMORTIGUADO: "A1·e^(s1 t) + A2·e^(s2 t)", CRITICO: "(B1 + B2·t)·e^(−αt)", SUBAMORTIGUADO: "e^(−αt)·[B1·cos(ωd t) + B2·sen(ωd t)]",
  }[t]);

  /** Expresión de la respuesta completa con las constantes ya calculadas. */
  function expresion(rlc) {
    const r = rlc.respuesta, so = rlc.so;
    const nombre = rlc.serie ? "v_C(t)" : "i_L(t)", u = rlc.serie ? "V" : "A", xinf = fmt(r.xInf, 4);
    let cuerpo;
    if (so.tipo === "SOBREAMORTIGUADO") {
      const [s1, s2] = so.raices;
      cuerpo = `${xinf} ${signo(r.k1)} ${fmt(Math.abs(r.k1), 4)}·e^(${fmt(s1.re, 4)}t) ${signo(r.k2)} ${fmt(Math.abs(r.k2), 4)}·e^(${fmt(s2.re, 4)}t)`;
    } else if (so.tipo === "CRITICO") {
      cuerpo = `${xinf} + (${fmt(r.k1, 4)} ${signo(r.k2)} ${fmt(Math.abs(r.k2), 4)}·t)·e^(−${fmt(so.alfa, 4)}t)`;
    } else {
      cuerpo = `${xinf} + e^(−${fmt(so.alfa, 4)}t)·[${fmt(r.k1, 4)}·cos(${fmt(so.omegaD, 4)}t) ${signo(r.k2)} ${fmt(Math.abs(r.k2), 4)}·sen(${fmt(so.omegaD, 4)}t)]`;
    }
    return `${nombre} = ${cuerpo} ${u},  t > 0`;
  }

  function revisarRlc(rlc, tipo, entrada) {
    const so = rlc.so;
    const leer = id => { const l = leerExpresion(entrada.texto(id)); return l.tipo === "numero" ? l.valor : null; };
    const vacio = id => !entrada.texto(id).trim();
    const r = {};
    const alfaOtro = rlc.serie ? 1 / (2 * rlc.r * rlc.c) : rlc.r / (2 * rlc.l);
    let x = leer("alfa");
    r.alfa = vacio("alfa") ? { ok: null } : x === null ? { ok: false, mensaje: "No se entiende lo escrito en α." }
      : coincide(x, so.alfa) ? { ok: true }
      : coincide(x, alfaOtro) ? { ok: false, mensaje: rlc.serie ? "α: ese valor es 1/(2RC), que corresponde al RLC en paralelo. En serie, α = R/(2L)." : "α: ese valor es R/(2L), que corresponde al RLC en serie. En paralelo, α = 1/(2RC)." }
      : { ok: false, mensaje: rlc.serie ? "α no coincide. En serie, α = R/(2L)." : "α no coincide. En paralelo, α = 1/(2RC)." };
    x = leer("w0");
    r.w0 = vacio("w0") ? { ok: null } : x === null ? { ok: false, mensaje: "No se entiende lo escrito en ω0." }
      : coincide(x, so.omega0) ? { ok: true }
      : coincide(x, 1 / (rlc.l * rlc.c)) ? { ok: false, mensaje: "ω0: ese valor es ω0². Falta la raíz: ω0 = 1/√(LC)." }
      : { ok: false, mensaje: "ω0 no coincide. ω0 = 1/√(LC)." };
    r.tipo = tipo === null ? { ok: null } : tipo === so.tipo ? { ok: true } : { ok: false, mensaje: `El tipo no es ${NOMBRE_AMORT[tipo].toLowerCase()}. Compara α con ω0.` };
    const [s1, s2] = so.raices;
    if (tipo === null || tipo !== so.tipo) r.raices = { ok: null };
    else if (so.tipo === "SOBREAMORTIGUADO") {
      const a = leer("s1"), b = leer("s2"), escala = Math.abs(s2.re);
      r.raices = vacio("s1") && vacio("s2") ? { ok: null }
        : a === null || b === null ? { ok: false, mensaje: "Escribe las dos raíces s1 y s2." }
        : (coincide(a, s1.re, escala) && coincide(b, s2.re, escala)) || (coincide(a, s2.re, escala) && coincide(b, s1.re, escala)) ? { ok: true }
        : (coincide(-a, s1.re, escala) || coincide(-a, s2.re, escala)) && a > 0 ? { ok: false, mensaje: "Raíces: en un circuito pasivo son negativas. s = −α ± √(α² − ω0²)." }
        : { ok: false, mensaje: "Raíces: no coinciden. s = −α ± √(α² − ω0²)." };
    } else if (so.tipo === "CRITICO") {
      const a = leer("s1");
      r.raices = vacio("s1") ? { ok: null } : a === null ? { ok: false, mensaje: "No se entiende lo escrito en la raíz." }
        : coincide(a, -so.alfa) ? { ok: true } : coincide(a, so.alfa) ? { ok: false, mensaje: "Raíz: revisa el signo; s = −α." }
        : { ok: false, mensaje: "Raíz: en el caso crítico, s1 = s2 = −α." };
    } else {
      const w = leer("wd");
      r.raices = vacio("wd") ? { ok: null } : w === null ? { ok: false, mensaje: "No se entiende lo escrito en ωd." }
        : coincide(w, so.omegaD) ? { ok: true }
        : coincide(w, Math.sqrt(so.omega0 ** 2 + so.alfa ** 2)) ? { ok: false, mensaje: "ωd: es ω0² − α², no ω0² + α²." }
        : { ok: false, mensaje: "ωd no coincide. ωd = √(ω0² − α²)." };
    }
    for (const id of ["alfa", "w0"]) entrada.marcar(id, r[id].ok);
    for (const id of ["s1", "s2", "wd"]) entrada.marcar(id, r.raices.ok);
    return r;
  }

  (L.MODULOS = L.MODULOS || {}).cap9 = {
    titulo: "Cap. 9 · Circuitos RLC",
    montar(raiz, ctx) {
      let modo = ctx.extra === "practicar" ? 1 : 0;
      let serie = true;
      let pr = null, entrada, tipo, revision, verSolucion;

      function explorador() {
        let pR = RANGO_R.posicion(serie ? 6 : 5), pL = RANGO_L.posicion(1), pC = RANGO_C.posicion(0.04);
        let fuente = serie ? 10 : 2, v0 = 0, i0 = 0, verCorriente = false;
        const rlc = () => new Rlc(serie, RANGO_R.valor(pR), RANGO_L.valor(pL), RANGO_C.valor(pC), fuente, v0, i0);
        const cajaEsquema = h("div"), cajaEcuacion = h("div", { style: { display: "grid", gap: "6px" } }), cajaPlano = h("div"), cajaTiempo = h("div", { style: { display: "grid", gap: "8px" } });
        function tiempo(c, so) {
          const [s1, s2] = so.raices;
          let sigma = Math.min(Math.abs(s1.re), Math.abs(s2.re));
          if (!(sigma > 1e-12)) sigma = so.alfa;
          let tf = 5 / sigma;
          if (so.tipo === "SUBAMORTIGUADO" && tf * so.omegaD / (2 * Math.PI) > 6) tf = 6 * 2 * Math.PI / so.omegaD;
          const sim = simularTransitorio(c.esquema().construir().circuito, tf, 1200);
          const nombres = serie ? ["v_C(t)", "i(t)"] : ["i_L(t)", "v(t)"];
          const y = serie ? (verCorriente ? sim.corriente("L") : sim.voltaje("C")) : (verCorriente ? sim.voltaje("C") : sim.corriente("L"));
          const unidad = serie === !verCorriente ? "V" : "A";
          const final = verCorriente ? 0 : c.fuente;
          L.poner(cajaTiempo, 
            Selector(nombres, verCorriente ? 1 : 0, i => { verCorriente = i === 1; tiempo(rlc(), rlc().so); }),
            Grafica([{ x: Array.from(sim.t), y: Array.from(y), color: COLOR_TIPO[so.tipo] }, { x: [0, tf], y: [final, final], color: GRIS, discontinua: true }],
              "t (s)", `${nombres[verCorriente ? 1 : 0]} (${unidad})`),
            Texto(expresion(c)),
            Chico("La curva se calcula con el simulador del circuito; la expresión es la solución analítica del libro. La línea punteada es el valor final."));
        }
        function actualizar(cambioLC = true) {
          const c = rlc(), so = c.so, [s1, s2] = so.raices;
          L.poner(cajaEsquema, dibujarEsquema(c.esquema().construir()));
          L.poner(cajaEcuacion, 
            Dato(serie ? "α = R / (2L)" : "α = 1 / (2RC)", `${fmt(so.alfa, 4)} 1/s`),
            Dato("ω0 = 1 / √(LC)", `${fmt(so.omega0, 4)} rad/s`),
            Dato("ζ = α / ω0", fmt(so.zeta, 3)),
            so.tipo === "SUBAMORTIGUADO" ? Dato("ωd = √(ω0² − α²)", `${fmt(so.omegaD, 4)} rad/s`) : null,
            Dato("s1", textoComplejo(s1)), Dato("s2", textoComplejo(s2)),
            h("div", { style: { borderRadius: "10px", padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "16px", color: COLOR_TIPO[so.tipo], background: COLOR_TIPO[so.tipo] + "1F" }, text: NOMBRE_AMORT[so.tipo] }));
          const l = RANGO_L.valor(pL), cc = RANGO_C.valor(pC);
          const lugar = [];
          for (let k = 0; k <= 180; k++) {
            const r = RANGO_R.min * Math.pow(RANGO_R.max / RANGO_R.min, k / 180);
            lugar.push(...(serie ? SegundoOrden.serie(r, l, cc) : SegundoOrden.paralelo(r, l, cc)).raices);
          }
          L.poner(cajaPlano, PlanoS([s1, s2], so.omega0, lugar));
          tiempo(c, so);
        }
        actualizar();
        const d = [
          Deslizador("R", `${fmt(RANGO_R.valor(pR), 3)} Ω`, pR, p => { pR = p; actualizar(); return `${fmt(RANGO_R.valor(p), 3)} Ω`; }),
          Deslizador("L", fmtSI(RANGO_L.valor(pL), "H"), pL, p => { pL = p; actualizar(); return fmtSI(RANGO_L.valor(p), "H"); }),
          Deslizador("C", fmtSI(RANGO_C.valor(pC), "F"), pC, p => { pC = p; actualizar(); return fmtSI(RANGO_C.valor(p), "F"); }),
          serie ? Deslizador("Vs (escalón)", `${fmt(fuente, 3)} V`, fuente, x => { fuente = Math.round(x); actualizar(); return `${fmt(fuente, 3)} V`; }, -20, 20, 1)
            : Deslizador("Is (escalón)", `${fmt(fuente, 3)} A`, fuente, x => { fuente = Math.round(x * 2) / 2; actualizar(); return `${fmt(fuente, 3)} A`; }, -5, 5, 0.5),
          Deslizador(serie ? "v_C(0)" : "v(0)", `${fmt(v0, 3)} V`, v0, x => { v0 = Math.round(x); actualizar(); return `${fmt(v0, 3)} V`; }, -20, 20, 1),
          Deslizador(serie ? "i(0)" : "i_L(0)", `${fmt(i0, 3)} A`, i0, x => { i0 = Math.round(x * 2) / 2; actualizar(); return `${fmt(i0, 3)} A`; }, -5, 5, 0.5),
        ];
        return [
          Selector(["RLC en serie", "RLC en paralelo"], serie ? 0 : 1, i => { const n = i === 0; if (n !== serie) { serie = n; pintar(); } }),
          Tarjeta(null, cajaEsquema, Chico(serie ? "Para t > 0 la fuente vale Vs; v_C(0) e i(0) son las condiciones iniciales." : "Para t > 0 la fuente vale Is; v(0) e i_L(0) son las condiciones iniciales.")),
          Tarjeta("Valores", d),
          Tarjeta("Ecuación característica: s² + 2αs + ω0² = 0", cajaEcuacion, cajaPlano,
            Chico("× raíces actuales. Los puntos tenues muestran cómo se mueven al variar R con L y C fijos; la línea punteada es la circunferencia de radio ω0.")),
          Tarjeta("Respuesta en el tiempo", cajaTiempo),
        ];
      }

      function nuevaPractica(s = semillaNueva()) {
        pr = Cap9.generarPractica(s);
        ctx.fijarSemilla(s, "practicar");
        entrada = new Entrada(["alfa", "w0", "s1", "s2", "wd"], { alfa: "α en 1/s", w0: "ω0 en rad/s", s1: "Raíz s1 en 1/s", s2: "Raíz s2 en 1/s", wd: "ωd en rad/s" });
        tipo = null; revision = null; verSolucion = false;
        pintar();
      }
      function practica() {
        const rlc = pr.rlc, so = rlc.so;
        const tipoOk = revision ? revision.tipo.ok : null;
        let mensajes = null;
        if (revision) {
          const todos = Object.values(revision).filter(x => x.ok !== null);
          if (todos.length && todos.every(x => x.ok) && revision.raices.ok === true) mensajes = Mensaje(`¡Todo correcto! La respuesta natural tiene la forma ${formaNatural(so.tipo)}.`, "bien");
          else if (!todos.length) mensajes = Mensaje("Escribe al menos una respuesta.", "info");
          else mensajes = Object.values(revision).filter(x => x.ok === false && x.mensaje).map(x => Mensaje(x.mensaje, "mal"));
        }
        let raices = null;
        if (tipo === "SOBREAMORTIGUADO") raices = [Chico("Dos raíces reales distintas: s = −α ± √(α² − ω0²)."), Campo("s1", "s1", "1/s", entrada), Campo("s2", "s2", "1/s", entrada)];
        else if (tipo === "CRITICO") raices = [Chico("Una raíz real repetida: s1 = s2 = −α."), Campo("s1 = s2", "s1", "1/s", entrada)];
        else if (tipo === "SUBAMORTIGUADO") raices = [Chico("Raíces complejas conjugadas: s = −α ± jωd. Escribe ωd = √(ω0² − α²)."), Campo("ωd", "wd", "rad/s", entrada)];
        const [s1, s2] = so.raices;
        return [
          Tarjeta(null, Texto(`Circuito RLC en ${rlc.serie ? "serie" : "paralelo"}. Calcula α y ω0, clasifica la respuesta y encuentra las raíces de la ecuación característica.`),
            dibujarEsquema(rlc.esquema().construir()), Numero(pr.semilla, nuevaPractica)),
          Tarjeta("Paso 1 · Parámetros", Campo("α", "alfa", "1/s", entrada), Campo("ω0", "w0", "rad/s", entrada)),
          Tarjeta("Paso 2 · Tipo de respuesta", AMORTIGUAMIENTOS.map(t => {
            const sel = tipo === t;
            const borde = sel && tipoOk === true ? VERDE : sel && tipoOk === false ? ROJO : sel ? COLOR_TIPO[t] : BORDE;
            return h("button", {
              type: "button", "aria-pressed": String(sel),
              style: { textAlign: "left", font: "inherit", fontSize: "15px", padding: "12px", borderRadius: "10px", cursor: "pointer",
                border: `${sel ? 2 : 1}px solid ${borde}`, background: sel ? COLOR_TIPO[t] + "1F" : "#fff", color: sel ? COLOR_TIPO[t] : "#1B2333", fontWeight: sel ? "600" : "400" },
              onclick: () => { tipo = t; if (revision) revision.tipo = { ok: null }; pintar(); },
            }, `${NOMBRE_AMORT[t]}  ${{ SOBREAMORTIGUADO: "(α > ω0)", CRITICO: "(α = ω0)", SUBAMORTIGUADO: "(α < ω0)" }[t]}`);
          })),
          raices ? Tarjeta("Paso 3 · Raíces", raices) : null,
          Botones(
            Boton("Revisar", () => { revision = revisarRlc(rlc, tipo, entrada); pintar(); }),
            Boton("Solución", () => { verSolucion = true; pintar(); }, false),
            Boton("Nuevo", () => nuevaPractica(), false),
          ),
          mensajes,
          verSolucion ? Tarjeta("Solución",
            Dato(rlc.serie ? "α = R / (2L)" : "α = 1 / (2RC)", `${fmt(so.alfa, 4)} 1/s`),
            Dato("ω0 = 1 / √(LC)", `${fmt(so.omega0, 4)} rad/s`),
            Dato("Tipo", NOMBRE_AMORT[so.tipo], COLOR_TIPO[so.tipo]),
            Dato("s1", textoComplejo(s1)), Dato("s2", textoComplejo(s2)),
            so.tipo === "SUBAMORTIGUADO" ? Dato("ωd", `${fmt(so.omegaD, 4)} rad/s`) : null,
            Linea(), Texto(`Respuesta natural: ${formaNatural(so.tipo)}`)) : null,
        ];
      }

      function pintar() {
        ctx.subtitulo(modo === 0 ? "Explorar" : "Practicar");
        L.poner(raiz, 
          Selector(["Explorar", "Practicar"], modo, i => {
            if (i === modo) return;
            modo = i;
            if (modo === 1 && !pr) nuevaPractica(); else { if (modo === 0) history.replaceState(null, "", "#cap9"); pintar(); }
          }),
          ...(modo === 0 ? explorador() : practica()),
        );
      }

      if (modo === 1) nuevaPractica(ctx.semilla || semillaNueva()); else pintar();
    },
  };
})(window);
