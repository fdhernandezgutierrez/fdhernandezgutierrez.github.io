/* cap78.js — Caps. 7 y 8: circuitos RC y RL (método de los tres valores y simulación). */
(function (G) {
  "use strict";
  const L = G.LAB;
  const { h, Tarjeta, Texto, Chico, Mensaje, Boton, Botones, Dato, Linea, Selector, Entrada, Campo, Numero, ResultadoRevision,
    dibujarEsquema, Grafica, Deslizador, EscalaLog, Cap78, PrimerOrden, simularTransitorio, revisarCampo, semillaNueva, fmt, fmtSI } = L;
  const AZUL = "#1F3A93", TURQ = "#00838F", GRIS = "#667085", BORDE = "#D0D5DD", COLOR_A = "#D81B60";

  const textoFuente = c => `vs = ${fmt(c.vAntes)} V para t < 0 (estado estable) y ${fmt(c.vDespues)} V para t > 0.`;
  function expresion(c) {
    const d = c.x0 - c.xInf;
    return `${c.variable}(t) = ${fmt(c.xInf, 4)} ${d < 0 ? "−" : "+"} ${fmt(Math.abs(d), 4)}·e^(−t/${fmt(c.tau * 1e3, 4)} ms) ${c.unidad},  t > 0`;
  }

  (L.MODULOS = L.MODULOS || {}).cap78 = {
    titulo: "Caps. 7 y 8 · Circuitos RC y RL",
    montar(raiz, ctx) {
      let modo = ctx.extra === "practicar" ? 1 : 0;
      let rc = true;
      let pr = null, entrada, revision, pista, verSolucion;

      function explorador() {
        const escalaR = rc ? new EscalaLog(100, 100e3) : new EscalaLog(1, 1e3);
        const escalaX = rc ? new EscalaLog(1e-7, 1e-3) : new EscalaLog(1e-4, 1);
        const ini = Cap78.inicial(rc);
        let p1 = escalaR.posicion(ini.r1), p2 = escalaR.posicion(ini.r2), px = escalaX.posicion(ini.x), antes = ini.vAntes, despues = ini.vDespues;
        const circuito = () => new PrimerOrden(rc, escalaR.valor(p1), escalaR.valor(p2), escalaX.valor(px), antes, despues);
        const cajaEsquema = h("div"), nota = Chico(""), metodo = h("div", { style: { display: "grid", gap: "6px" } }), grafica = h("div");
        function actualizar() {
          const c = circuito();
          const construido = c.esquema();
          L.poner(cajaEsquema, dibujarEsquema(construido));
          nota.textContent = textoFuente(c);
          L.poner(metodo, 
            Dato(`${c.variable}(0⁺) = ${c.variable}(0⁻)`, `${fmt(c.x0, 4)} ${c.unidad}`),
            Dato(`${c.variable}(∞)`, `${fmt(c.xInf, 4)} ${c.unidad}`),
            Dato("R_th = R1 ∥ R2", fmtSI(c.rth, "Ω")),
            Dato(rc ? "τ = R_th·C" : "τ = L / R_th", fmtSI(c.tau, "s")),
            h("p", { class: "lab-texto", style: { color: AZUL, fontSize: "14px" }, text: expresion(c) }));
          const sim = simularTransitorio(construido.circuito, 5 * c.tau, 600);
          const y = rc ? sim.voltaje("C") : sim.corriente("L");
          const t = Array.from(sim.t, v => v * 1e3);
          L.poner(grafica, Grafica([
            { x: t, y: Array.from(y), color: rc ? AZUL : TURQ },
            { x: [0, t[t.length - 1]], y: [c.xInf, c.xInf], color: GRIS, discontinua: true },
          ], "t (ms)", `${c.variable} (${c.unidad})`, {
            verticales: [1, 2, 3, 4].map(k => [k * c.tau * 1e3, BORDE]),
            puntos: [[c.tau * 1e3, c.valor(c.tau), COLOR_A]],
          }));
        }
        actualizar();
        return [
          Selector(["Circuito RC", "Circuito RL"], rc ? 0 : 1, i => { rc = i === 0; pintar(); }),
          Tarjeta(null, cajaEsquema, nota),
          Tarjeta("Valores",
            Deslizador("R1", fmtSI(escalaR.valor(p1), "Ω"), p1, p => { p1 = p; actualizar(); return fmtSI(escalaR.valor(p), "Ω"); }),
            Deslizador("R2", fmtSI(escalaR.valor(p2), "Ω"), p2, p => { p2 = p; actualizar(); return fmtSI(escalaR.valor(p), "Ω"); }),
            Deslizador(rc ? "C" : "L", fmtSI(escalaX.valor(px), rc ? "F" : "H"), px, p => { px = p; actualizar(); return fmtSI(escalaX.valor(p), rc ? "F" : "H"); }),
            Deslizador("vs para t < 0", `${fmt(antes)} V`, antes, x => { antes = Math.round(x); actualizar(); return `${fmt(antes)} V`; }, -20, 20, 1),
            Deslizador("vs para t > 0", `${fmt(despues)} V`, despues, x => { despues = Math.round(x); actualizar(); return `${fmt(despues)} V`; }, -20, 20, 1)),
          Tarjeta("Método de los tres valores", metodo),
          Tarjeta("Respuesta en el tiempo", grafica,
            Chico("Líneas verticales cada τ. En t = τ la respuesta ya recorrió el 63.2 % del camino entre el valor inicial y el final; después de 5τ se considera en estado estable. La curva sale del simulador.")),
        ];
      }

      function nuevaPractica(s = semillaNueva()) {
        pr = Cap78.generar(s);
        ctx.fijarSemilla(s, "practicar");
        const c = pr.circuito;
        entrada = new Entrada(["x0", "xinf", "tau", "xt"], {
          x0: `${c.variable}(0⁺) en ${c.unidad}`, xinf: `${c.variable}(∞) en ${c.unidad}`, tau: "τ en milisegundos", xt: `${c.variable}(t1) en ${c.unidad}`,
        });
        revision = null; pista = false; verSolucion = false;
        pintar();
      }
      function practica() {
        const c = pr.circuito, v = c.variable, u = c.unidad, t1ms = pr.t1 * 1e3;
        return [
          Tarjeta(null, Texto(`${textoFuente(c)} Encuentra ${v}(0⁺), ${v}(∞), τ y ${v} en t1 = ${fmt(t1ms, 4)} ms.`),
            dibujarEsquema(c.esquema()), Numero(pr.semilla, nuevaPractica)),
          Tarjeta("Tus respuestas",
            Campo(`${v}(0⁺)`, "x0", u, entrada), Campo(`${v}(∞)`, "xinf", u, entrada),
            Campo("τ", "tau", "ms", entrada), Campo(`${v}(t1)`, "xt", u, entrada),
            Botones(
              Boton("Revisar", () => {
                const escala = Math.max(Math.abs(c.x0), Math.abs(c.xInf));
                const tauMs = c.tau * 1e3;
                const estableAntes = c.rc ? c.vAntes : c.vAntes / (c.r1 + c.r2);
                const estableDespues = c.rc ? c.vDespues : c.vDespues / (c.r1 + c.r2);
                revision = [
                  revisarCampo(entrada, "x0", `${v}(0⁺)`, c.x0,
                    c.rc ? "en t < 0 el capacitor es un circuito abierto; usa el divisor con la fuente de antes." : "en t < 0 el inductor es un corto; R2 queda en corto.",
                    [[c.xInf, `ese es el valor final. En t = 0⁺ ${c.rc ? "el voltaje del capacitor" : "la corriente del inductor"} no cambia de golpe: vale lo mismo que en 0⁻.`],
                      [estableAntes, c.rc ? "el capacitor está en paralelo con R2: no recibe toda la fuente, usa el divisor R2/(R1 + R2)." : "en CD el inductor pone en corto a R2: i_L = vs/R1."]],
                    escala),
                  revisarCampo(entrada, "xinf", `${v}(∞)`, c.xInf, "en t → ∞ el circuito vuelve a CD con la fuente nueva.",
                    [[c.x0, "ese es el valor inicial; el final se calcula con la fuente de t > 0."],
                      [estableDespues, c.rc ? "no toda la fuente queda en el capacitor: divisor R2/(R1 + R2)." : "en CD el inductor es un corto y R2 no conduce: i_L = vs/R1."]],
                    escala),
                  revisarCampo(entrada, "tau", "τ", tauMs,
                    c.rc ? "τ = R_th·C, con R_th vista desde el capacitor y la fuente apagada." : "τ = L/R_th, con R_th vista desde el inductor y la fuente apagada.",
                    c.rc ? [[(c.r1 + c.r2) * c.x * 1e3, "R_th se calcula con la fuente apagada (corto): R1 y R2 quedan en paralelo, no en serie."]]
                      : [[c.x * c.rth * 1e3, "en un RL, τ = L/R, no L·R."], [c.x / (c.r1 + c.r2) * 1e3, "con la fuente apagada, R1 y R2 quedan en paralelo: R_th = R1∥R2."]]),
                  revisarCampo(entrada, "xt", `${v}(t1)`, c.valor(pr.t1), `${v}(t) = ${v}(∞) + [${v}(0⁺) − ${v}(∞)]·e^(−t/τ).`,
                    [[c.x0 + (c.xInf - c.x0) * Math.exp(-pr.t1 / c.tau), `intercambiaste ${v}(0⁺) y ${v}(∞) en la fórmula.`]], escala),
                ];
                pintar();
              }),
              Boton("Pista", () => { pista = true; pintar(); }, false),
              Boton("Solución", () => { verSolucion = true; pintar(); }, false),
              Boton("Otro", () => nuevaPractica(), false),
            ),
            ResultadoRevision(revision, "¡Todo correcto!"),
            pista ? Mensaje(`1) t < 0: ${c.rc ? "C abierto" : "L en corto"} con la fuente de antes. 2) t → ∞: lo mismo con la fuente nueva. ` +
              `3) R_th desde ${c.rc ? "el capacitor" : "el inductor"} con la fuente en corto. 4) ${v}(t) = ${v}(∞) + [${v}(0⁺) − ${v}(∞)]·e^(−t/τ).`, "info") : null,
            verSolucion ? [Linea(), Dato(`${v}(0⁺)`, `${fmt(c.x0, 4)} ${u}`), Dato(`${v}(∞)`, `${fmt(c.xInf, 4)} ${u}`), Dato("R_th", fmtSI(c.rth, "Ω")),
              Dato("τ", `${fmt(c.tau * 1e3, 4)} ms`), Dato(`${v}(t1)`, `${fmt(c.valor(pr.t1), 4)} ${u}`, AZUL),
              h("p", { class: "lab-texto", style: { color: AZUL, fontSize: "14px" }, text: expresion(c) })] : null,
          ),
        ];
      }

      function pintar() {
        ctx.subtitulo(modo === 0 ? "Explorar" : "Practicar");
        L.poner(raiz, 
          Selector(["Explorar", "Practicar"], modo, i => {
            if (i === modo) return;
            modo = i;
            if (modo === 1 && !pr) nuevaPractica(); else { if (modo === 0) history.replaceState(null, "", "#cap78"); pintar(); }
          }),
          ...(modo === 0 ? explorador() : practica()),
        );
      }

      if (modo === 1) nuevaPractica(ctx.semilla || semillaNueva()); else pintar();
    },
  };
})(window);
