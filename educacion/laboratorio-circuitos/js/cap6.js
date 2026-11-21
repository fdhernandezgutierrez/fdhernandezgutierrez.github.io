/* cap6.js — Cap. 6: amplificador operacional (explorar configuraciones con saturación y practicar vo). */
(function (G) {
  "use strict";
  const L = G.LAB;
  const { h, Tarjeta, Texto, Chico, Mensaje, Boton, Botones, Dato, Linea, Selector, Pildoras, Entrada, Campo, Numero,
    dibujarEsquema, Grafica, Deslizador, EscalaLog, CONFIGURACIONES, Cap6, salidaAmpOp, revisarCampo, semillaNueva, fmt, fmtSI } = L;
  const AZUL = "#1F3A93", GRIS = "#667085", BORDE = "#D0D5DD", VERDE = "#2E7D32", ROJO = "#C62828", MORADO = "#6A1B9A";
  const ESCALA_R = new EscalaLog(1e3, 100e3);
  const recortar = (x, vsat) => Math.min(vsat, Math.max(-vsat, x));

  (L.MODULOS = L.MODULOS || {}).cap6 = {
    titulo: "Cap. 6 · Amplificador operacional",
    montar(raiz, ctx) {
      let modo = ctx.extra === "practicar" ? 1 : 0;
      let conf = CONFIGURACIONES[0];
      let pr = null, entrada, revision, pista, verSolucion;

      // ───────── Explorar ─────────
      function explorador() {
        const ini = Cap6.inicial(conf.id);
        const pos = { r1: ESCALA_R.posicion(ini.r1), rf: ESCALA_R.posicion(ini.rf), r3: ESCALA_R.posicion(ini.r3), r4: ESCALA_R.posicion(ini.r4) };
        let v1 = ini.v1, v2 = ini.v2, vsat = ini.vsat;
        const circuito = () => ini.con({ r1: ESCALA_R.valor(pos.r1), rf: ESCALA_R.valor(pos.rf), r3: ESCALA_R.valor(pos.r3), r4: ESCALA_R.valor(pos.r4), v1, v2, vsat });
        const dosEntradas = conf.entradas === 2;
        const nombreR3 = conf.id === "SUMADOR" ? "R2" : "R3";

        const cajaEsquema = h("div"), cajaSalida = h("div", { style: { display: "grid", gap: "8px" } });
        const cajaTransf = h("div"), cajaSeno = h("div");
        const notaTransf = Chico(""), notaSeno = Chico(""), notaAlim = Chico("");
        function actualizar() {
          const c = circuito();
          const construido = c.esquema();
          const sal = salidaAmpOp(construido.circuito, "OA", c.vsat);
          // El circuito es lineal mientras no se sature: vo = g1·v1 + g2·v2.
          const g1 = c.con({ v1: 1, v2: 0, vsat: 1e9 }).salida().ideal;
          const g2 = c.con({ v1: 0, v2: 1, vsat: 1e9 }).salida().ideal;
          L.poner(cajaEsquema, dibujarEsquema(construido));
          notaAlim.textContent = `Amp. op. ideal (v+ = v− y sin corriente de entrada) alimentado con ±${fmt(c.vsat)} V.`;
          L.poner(cajaSalida, 
            h("p", { class: "lab-texto", style: { color: AZUL }, text: c.formulaTexto }),
            Dato("vo con el modelo ideal", `${fmt(sal.ideal, 4)} V`),
            Dato("vo real", `${fmt(sal.real, 4)} V`, sal.saturado ? ROJO : VERDE),
            sal.saturado ? Mensaje(`Saturado: el modelo ideal pide ${fmt(sal.ideal, 3)} V, pero la salida no puede pasar de ±${fmt(c.vsat)} V. Ya no se cumple v+ = v−.`, "aviso")
              : Mensaje(`Zona lineal: la salida está dentro de ±${fmt(c.vsat)} V.`, "bien"));
          const xs = Array.from({ length: 101 }, (_, i) => -5 + i * 0.1);
          const ideal = xs.map(x => g1 * x + g2 * c.v2);
          L.poner(cajaTransf, Grafica([
            { x: xs, y: xs.map(() => c.vsat), color: BORDE, discontinua: true },
            { x: xs, y: xs.map(() => -c.vsat), color: BORDE, discontinua: true },
            { x: xs, y: ideal, color: GRIS, discontinua: true },
            { x: xs, y: ideal.map(v => recortar(v, c.vsat)), color: AZUL },
          ], "v1 (V)", "vo (V)", { puntos: [[c.v1, sal.real, sal.saturado ? ROJO : VERDE]] }));
          notaTransf.textContent = "Azul: salida real. Gris punteado: modelo ideal sin límite. " + (dosEntradas ? `v2 se mantiene en ${fmt(c.v2, 3)} V.` : "");
          const amp = Math.abs(c.v1) < 0.05 ? 1 : Math.abs(c.v1);
          const ts = Array.from({ length: 241 }, (_, i) => i / 120);
          const vin = ts.map(t => amp * Math.sin(2 * Math.PI * t));
          L.poner(cajaSeno, Grafica([{ x: ts, y: vin, color: GRIS }, { x: ts, y: vin.map(v => recortar(g1 * v + g2 * c.v2, c.vsat)), color: MORADO }], "t / T", "v (V)"));
          notaSeno.textContent = `Gris: v1(t) = ${fmt(amp, 3)}·sen(ωt) V. Morado: vo(t). Si la salida pide más de ±Vsat, la onda se recorta.`;
        }
        const resistencia = (nombre, clave) => Deslizador(nombre, fmtSI(ESCALA_R.valor(pos[clave]), "Ω"), pos[clave], p => {
          pos[clave] = p; actualizar(); return fmtSI(ESCALA_R.valor(p), "Ω");
        });
        const deslizadores = [];
        if (conf.id !== "SEGUIDOR") deslizadores.push(resistencia("R1", "r1"), resistencia("Rf", "rf"));
        if (dosEntradas) deslizadores.push(resistencia(nombreR3, "r3"));
        if (conf.id === "DIFERENCIAL") deslizadores.push(resistencia("R4", "r4"));
        deslizadores.push(Deslizador("v1", `${fmt(v1, 3)} V`, v1, x => { v1 = Math.round(x * 10) / 10; actualizar(); return `${fmt(v1, 3)} V`; }, -5, 5, 0.1));
        if (dosEntradas) deslizadores.push(Deslizador("v2", `${fmt(v2, 3)} V`, v2, x => { v2 = Math.round(x * 10) / 10; actualizar(); return `${fmt(v2, 3)} V`; }, -5, 5, 0.1));
        deslizadores.push(Deslizador("±Vsat", `${fmt(vsat)} V`, vsat, x => { vsat = Math.round(x); actualizar(); return `${fmt(vsat)} V`; }, 5, 15, 1));
        actualizar();
        return [
          Pildoras(CONFIGURACIONES.map(x => x.titulo), CONFIGURACIONES.indexOf(conf), i => { conf = CONFIGURACIONES[i]; pintar(); }),
          Tarjeta(null, cajaEsquema, notaAlim),
          Tarjeta("Valores", deslizadores),
          Tarjeta("Salida", cajaSalida),
          Tarjeta("Característica de transferencia", cajaTransf, notaTransf),
          Tarjeta("Entrada senoidal", cajaSeno, notaSeno),
        ];
      }

      // ───────── Practicar ─────────
      function nuevaPractica(s = semillaNueva()) {
        pr = Cap6.generar(s);
        ctx.fijarSemilla(s, "practicar");
        entrada = new Entrada(["vo"], { vo: "Voltaje de salida vo en volts" });
        revision = null; pista = false; verSolucion = false;
        pintar();
      }
      function practica() {
        const c = pr.circuito, sal = c.salida();
        let msg = null;
        if (revision) {
          if (revision.ok === true) msg = Mensaje(sal.saturado ? "¡Correcto! El amplificador está saturado." : "¡Correcto!", "bien");
          else if (revision.ok === false) msg = Mensaje(revision.mensaje || "", "mal");
          else msg = Mensaje("Escribe vo.", "info");
        }
        return [
          Tarjeta(null, Texto(`Configuración: ${c.conf.titulo}. El amp. op. es ideal y se alimenta con ±${fmt(c.vsat)} V. Calcula vo.`),
            dibujarEsquema(c.esquema()), Numero(pr.semilla, nuevaPractica)),
          Tarjeta("Tu respuesta",
            Campo("vo", "vo", "V", entrada),
            Botones(
              Boton("Revisar", () => {
                const errores = [[-sal.real, "revisa el signo; en las entradas por la terminal − la salida se invierte."]];
                if (sal.saturado) errores.push([sal.ideal, `el amplificador se satura. La salida no puede pasar de ±${fmt(c.vsat)} V, así que vo = ${fmt(sal.real)} V.`]);
                if (c.conf.id === "NO_INVERSOR") errores.push([recortar(c.rf / c.r1 * c.v1, c.vsat), "falta el 1. En el no inversor, vo = (1 + Rf/R1)·v1."]);
                if (c.conf.id === "DIFERENCIAL") errores.push([recortar(c.rf / c.r1 * (c.v2 - c.v1), c.vsat), "vo = (Rf/R1)(v2 − v1) solo vale si R4/R3 = Rf/R1. Aquí usa superposición."]);
                if (c.conf.id === "SUMADOR") errores.push([recortar(-c.rf / c.r1 * (c.v1 + c.v2), c.vsat), "cada entrada tiene su propia resistencia: vo = −Rf·(v1/R1 + v2/R2)."]);
                revision = revisarCampo(entrada, "vo", "vo", sal.real, "no coincide. Usa v+ = v− y la LCK en la entrada inversora.", errores);
                pintar();
              }),
              Boton("Pista", () => { pista = true; pintar(); }, false),
              Boton("Solución", () => { verSolucion = true; pintar(); }, false),
              Boton("Otro", () => nuevaPractica(), false),
            ),
            msg,
            pista ? Mensaje(`${c.formulaTexto}. Después compara con ±${fmt(c.vsat)} V.`, "info") : null,
            verSolucion ? [Linea(), Dato("Modelo ideal", `${fmt(sal.ideal, 4)} V`), Dato("vo", `${fmt(sal.real, 4)} V`, AZUL),
              sal.saturado ? Texto(`Como |${fmt(sal.ideal, 4)}| > ${fmt(c.vsat)}, la salida se queda en ${fmt(sal.real)} V.`) : null] : null,
          ),
        ];
      }

      function pintar() {
        ctx.subtitulo(modo === 0 ? "Explorar" : "Practicar");
        L.poner(raiz, 
          Selector(["Explorar", "Practicar"], modo, i => {
            if (i === modo) return;
            modo = i;
            if (modo === 1 && !pr) nuevaPractica(); else { if (modo === 0) history.replaceState(null, "", "#cap6"); pintar(); }
          }),
          ...(modo === 0 ? explorador() : practica()),
        );
      }

      if (modo === 1) nuevaPractica(ctx.semilla || semillaNueva()); else pintar();
    },
  };
})(window);
