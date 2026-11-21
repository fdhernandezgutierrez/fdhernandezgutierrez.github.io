/* cap10.js — Cap. 10: análisis senoidal en estado estable (fasores que giran, potencia y práctica). */
(function (G) {
  "use strict";
  const L = G.LAB;
  const { h, Tarjeta, Texto, Chico, Mensaje, Boton, Botones, Dato, Linea, Selector, Entrada, Campo, Numero, ResultadoRevision,
    dibujarEsquema, Grafica, DiagramaFasorial, TrianguloPotencia, Deslizador, EscalaLog, Cap10, Complejo,
    revisarCampo, semillaNueva, fmt, fmtSI } = L;
  const AZUL = "#1F3A93", VERDE = "#2E7D32", NARANJA = "#E65100", TURQ = "#00838F", ROJO = "#C62828";
  const ESC_R = new EscalaLog(1, 200), ESC_L = new EscalaLog(1e-3, 1), ESC_C = new EscalaLog(1e-6, 1e-3), ESC_W = new EscalaLog(10, 10000);
  const polar = (z, u) => `${fmt(z.modulo, 4)} ∠ ${fmt(z.anguloGrados, 4)}° ${u}`;
  const rectangular = (z, u) => `${fmt(z.re, 4)} ${z.im < 0 ? "−" : "+"} j${fmt(Math.abs(z.im), 4)} ${u}`;

  (L.MODULOS = L.MODULOS || {}).cap10 = {
    titulo: "Cap. 10 · Análisis senoidal",
    montar(raiz, ctx) {
      let modo = ctx.extra === "practicar" ? 1 : 0;
      let pr = null, entrada, revision, pista, verSolucion;

      function explorador() {
        const ini = Cap10.inicial;
        let pR = ESC_R.posicion(ini.r), pL = ESC_L.posicion(ini.l), pC = ESC_C.posicion(ini.c), pW = ESC_W.posicion(ini.omega);
        let vm = ini.vm, conL = true, conC = true, animar = false, giro = 0, ultimo = null;
        const circuito = () => new L.CircuitoCA(ESC_R.valor(pR), conL ? ESC_L.valor(pL) : null, conC ? ESC_C.valor(pC) : null, vm, ESC_W.valor(pW));
        const cajaEsquema = h("div"), cajaZ = h("div", { style: { display: "grid", gap: "6px" } }), cajaFasores = h("div"), cajaOndas = h("div"), cajaPotencia = h("div", { style: { display: "grid", gap: "6px" } });
        const cajaValores = h("div", { style: { display: "grid", gap: "8px" } });

        function fasores(c) {
          // La corriente se escala para que se vea junto a los voltajes.
          const factor = Math.pow(10, Math.round(Math.log10(0.6 * c.vm / Math.max(c.i.modulo, 1e-12))));
          const nombreI = factor === 1 ? "I" : `I×${fmt(factor)}`;
          const lista = [{ nombre: "V", z: c.v, color: AZUL, origen: Complejo.CERO }, { nombre: "VR", z: c.vR, color: VERDE, origen: Complejo.CERO }];
          if (conL) lista.push({ nombre: "VL", z: c.vL, color: NARANJA, origen: c.vR });
          if (conC) lista.push({ nombre: "VC", z: c.vC, color: TURQ, origen: c.vR.mas(c.vL) });
          lista.push({ nombre: nombreI, z: c.i.por(factor), color: ROJO, origen: Complejo.CERO });
          L.poner(cajaFasores, DiagramaFasorial(lista, giro, ["V", nombreI]));
        }
        function actualizar() {
          const c = circuito();
          L.poner(cajaEsquema, dibujarEsquema(c.esquema()));
          const tipo = c.tipoFp === "atrasado" ? `inductivo: la corriente se atrasa ${fmt(Math.abs(c.z.anguloGrados), 3)}° respecto al voltaje`
            : c.tipoFp === "adelantado" ? `capacitivo: la corriente se adelanta ${fmt(Math.abs(c.z.anguloGrados), 3)}° respecto al voltaje`
            : "resistivo: corriente y voltaje en fase (resonancia)";
          L.poner(cajaZ, 
            conL ? Dato("X_L = ωL", `${fmt(c.xl, 4)} Ω`) : null, conC ? Dato("X_C = 1/(ωC)", `${fmt(c.xc, 4)} Ω`) : null,
            Dato("Z = R + j(X_L − X_C)", rectangular(c.z, "Ω")), Dato("Z (polar)", polar(c.z, "Ω")), Dato("I = V / Z", polar(c.i, "A"), ROJO),
            Mensaje(`Circuito ${tipo}.`, "info"));
          fasores(c);
          const ts = Array.from({ length: 201 }, (_, i) => i / 100), th = c.i.anguloGrados * Math.PI / 180;
          L.poner(cajaOndas, Grafica([
            { x: ts, y: ts.map(t => Math.cos(2 * Math.PI * t)), color: AZUL },
            { x: ts, y: ts.map(t => Math.cos(2 * Math.PI * t + th)), color: ROJO },
          ], "t / T", "normalizadas", { alto: 200 }));
          L.poner(cajaPotencia, 
            Dato("P = (Vm·Im/2)·cos θ", `${fmt(c.p, 4)} W`), Dato("Q = (Vm·Im/2)·sen θ", `${fmt(c.q, 4)} VAR`),
            Dato("|S| = Vm·Im/2", `${fmt(c.s.modulo, 4)} VA`), Dato("fp = cos θ", `${fmt(c.fp, 3)} (${c.tipoFp})`),
            TrianguloPotencia(c.p, c.q));
        }
        function valores() {
          L.poner(cajaValores, 
            Deslizador("R", fmtSI(ESC_R.valor(pR), "Ω"), pR, p => { pR = p; actualizar(); return fmtSI(ESC_R.valor(p), "Ω"); }),
            conL ? Deslizador("L", fmtSI(ESC_L.valor(pL), "H"), pL, p => { pL = p; actualizar(); return fmtSI(ESC_L.valor(p), "H"); }) : null,
            conC ? Deslizador("C", fmtSI(ESC_C.valor(pC), "F"), pC, p => { pC = p; actualizar(); return fmtSI(ESC_C.valor(p), "F"); }) : null,
            Deslizador("ω", `${fmt(ESC_W.valor(pW), 3)} rad/s`, pW, p => { pW = p; actualizar(); return `${fmt(ESC_W.valor(p), 3)} rad/s`; }),
            Deslizador("Vm", `${fmt(vm)} V`, vm, x => { vm = Math.round(x); actualizar(); return `${fmt(vm)} V`; }, 1, 200, 1));
        }
        const interruptor = (texto, valor, alCambiar) => {
          const caja = h("input", { type: "checkbox", role: "switch" });
          caja.checked = valor;
          caja.addEventListener("change", () => alCambiar(caja.checked, caja));
          return h("label", { style: { display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "14px" } }, caja, texto);
        };
        const swL = interruptor("Inductor", conL, (v, caja) => { conL = v; if (!conL && !conC) { conC = true; swC.querySelector("input").checked = true; } valores(); actualizar(); });
        const swC = interruptor("Capacitor", conC, (v, caja) => { conC = v; if (!conC && !conL) { conL = true; swL.querySelector("input").checked = true; } valores(); actualizar(); });
        const giroSw = interruptor("Girar los fasores (e^{jωt})", false, v => {
          animar = v; ultimo = null;
          if (animar) requestAnimationFrame(paso); else { giro = 0; fasores(circuito()); }
        });
        function paso(t) {
          if (!animar || !document.body.contains(cajaFasores)) return;
          if (ultimo !== null) giro = (giro + (t - ultimo) / 6000 * 2 * Math.PI) % (2 * Math.PI);
          ultimo = t;
          fasores(circuito());
          requestAnimationFrame(paso);
        }
        valores(); actualizar();
        return [
          Tarjeta(null, cajaEsquema, h("div", { class: "lab-botones" }, swL, swC)),
          Tarjeta("Valores", cajaValores),
          Tarjeta("Impedancia y corriente", cajaZ),
          Tarjeta("Diagrama fasorial", cajaFasores, giroSw,
            Chico("VR, VL y VC se suman punta con cola y dan V (LVK con fasores). Al girar, la proyección sobre el eje real es el valor instantáneo."),
            cajaOndas, Chico("Azul: v(t)/Vm. Rojo: i(t)/Im. El desfase entre ambas es el ángulo de Z.")),
          Tarjeta("Potencia", cajaPotencia),
        ];
      }

      function nuevaPractica(s = semillaNueva()) {
        pr = Cap10.generar(s);
        ctx.fijarSemilla(s, "practicar");
        entrada = new Entrada(["z", "th", "im", "p", "fp"], { z: "|Z| en ohms", th: "Ángulo de Z en grados", im: "Amplitud de la corriente en amperes", p: "Potencia promedio en watts", fp: "Factor de potencia" });
        revision = null; pista = false; verSolucion = false;
        pintar();
      }
      function practica() {
        const c = pr.circuito, th = c.z.anguloGrados;
        return [
          Tarjeta(null, Texto("En estado estable, calcula la impedancia Z (magnitud y ángulo), la amplitud de la corriente, la potencia promedio que entrega la fuente y el factor de potencia."),
            dibujarEsquema(c.esquema()), Numero(pr.semilla, nuevaPractica)),
          Tarjeta("Tus respuestas",
            Campo("|Z|", "z", "Ω", entrada), Campo("∠Z", "th", "°", entrada), Campo("Im", "im", "A", entrada),
            Campo("P", "p", "W", entrada), Campo("fp", "fp", "", entrada),
            Botones(
              Boton("Revisar", () => {
                const xMal = (c.l !== null ? c.omega * c.l : 0) - (c.c !== null ? c.omega * c.c : 0);
                const zMal = new Complejo(c.r, xMal);
                revision = [
                  revisarCampo(entrada, "z", "|Z|", c.z.modulo, "Z = R + j(ωL − 1/(ωC)) y |Z| = √(R² + X²).",
                    [[zMal.modulo, "la reactancia del capacitor es 1/(ωC), no ωC."], [c.r + c.xl + c.xc, "R y las reactancias no se suman como números: |Z| = √(R² + (X_L − X_C)²)."]]),
                  revisarCampo(entrada, "th", "∠Z", th, "θ = arctan((X_L − X_C)/R), en grados.",
                    [[-th, "el signo no: es positivo si domina el inductor y negativo si domina el capacitor."], [th * Math.PI / 180, "está en radianes; escríbelo en grados."]],
                    Math.max(Math.abs(th), 1)),
                  revisarCampo(entrada, "im", "Im", c.i.modulo, "Im = Vm / |Z|.", [[c.i.modulo / Math.SQRT2, "eso es el valor rms; se pide la amplitud Im = Vm/|Z|."]]),
                  revisarCampo(entrada, "p", "P", c.p, "P = (Vm·Im/2)·cos θ = Im²·R/2.",
                    [[2 * c.p, "con amplitudes falta dividir entre 2: P = (Vm·Im/2)·cos θ (o usa valores rms)."], [c.s.modulo, "eso es la potencia aparente |S|; falta multiplicar por cos θ."]]),
                  revisarCampo(entrada, "fp", "fp", c.fp, "fp = cos θ = R/|Z|.", [[Math.abs(Math.sin(th * Math.PI / 180)), "es cos θ, no sen θ."]], 1),
                ];
                pintar();
              }),
              Boton("Pista", () => { pista = true; pintar(); }, false),
              Boton("Solución", () => { verSolucion = true; pintar(); }, false),
              Boton("Otro", () => nuevaPractica(), false),
            ),
            ResultadoRevision(revision, `¡Todo correcto! El factor de potencia es ${c.tipoFp}.`),
            pista ? Mensaje(`X_L = ωL = ${c.l !== null ? fmt(c.xl, 4) : "—"} Ω y X_C = 1/(ωC) = ${c.c !== null ? fmt(c.xc, 4) : "—"} Ω. Con Z en forma polar, I = Vm∠0° / Z.`, "info") : null,
            verSolucion ? [Linea(), Dato("Z", `${rectangular(c.z, "Ω")} = ${polar(c.z, "Ω")}`), Dato("I", polar(c.i, "A")),
              Dato("P", `${fmt(c.p, 4)} W`), Dato("fp", `${fmt(c.fp, 3)} ${c.tipoFp}`)] : null,
          ),
        ];
      }

      function pintar() {
        ctx.subtitulo(modo === 0 ? "Explorar" : "Practicar");
        L.poner(raiz, 
          Selector(["Explorar", "Practicar"], modo, i => {
            if (i === modo) return;
            modo = i;
            if (modo === 1 && !pr) nuevaPractica(); else { if (modo === 0) history.replaceState(null, "", "#cap10"); pintar(); }
          }),
          ...(modo === 0 ? explorador() : practica()),
        );
      }

      if (modo === 1) nuevaPractica(ctx.semilla || semillaNueva()); else pintar();
    },
  };
})(window);
