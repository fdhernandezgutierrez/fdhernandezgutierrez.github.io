/* cap3.js — Cap. 3: reducción serie-paralelo tocando resistencias, y divisores. */
(function (G) {
  "use strict";
  const L = G.LAB;
  const { h, Tarjeta, Texto, Chico, Mensaje, Boton, Botones, Dato, Linea, Entrada, Campo, revisarCampo, Numero,
    dibujarEsquema, Cap3, esquemaRed, combinar, hojas, equivalente, leerExpresion, coincide, semillaNueva, fmt } = L;
  const NARANJA = "#E65100", COLOR_A = "#D81B60";

  (L.MODULOS = L.MODULOS || {}).cap3 = {
    titulo: "Cap. 3 · Circuitos resistivos",
    subtitulo: "Reducción serie-paralelo y divisores",
    montar(raiz, ctx) {
      let pr, red, contador, seleccion, pendiente, aviso, pasos, revision, pista, verSolucion, entrada;

      function nuevo(s = semillaNueva()) {
        ctx.fijarSemilla(s);
        pr = Cap3.generar(s);
        reiniciar();
        revision = null; pista = false; verSolucion = false;
        entrada = new Entrada(["rc", "resp"], { rc: "Resistencia equivalente del par en ohms", resp: "Respuesta del paso 2" });
        pintar();
      }
      function reiniciar() { red = pr.red; contador = 0; seleccion = []; pendiente = null; aviso = null; pasos = []; }
      const valores = () => new Map(hojas(red).map(x => [x.nombre, x.valor]));

      function aplicar(r) {
        const v = valores();
        const a = v.get(seleccion[0]), b = v.get(seleccion[1]);
        pasos.push(r.tipo === "SERIE" ? `${fmt(a, 4)} + ${fmt(b, 4)} = ${fmt(r.valor, 4)} Ω (serie)`
          : `${fmt(a, 4)} ∥ ${fmt(b, 4)} = ${fmt(r.valor, 4)} Ω (paralelo)`);
        red = r.red; seleccion = []; pendiente = null;
        entrada.borrar("rc");
        aviso = red.t === "R" ? [`¡Listo! R_eq = ${fmt(equivalente(pr.red), 4)} Ω.`, "bien"] : null;
      }

      function tocar(nombre) {
        if (red.t === "R") return;
        aviso = null;
        if (seleccion.includes(nombre)) seleccion = seleccion.filter(x => x !== nombre);
        else if (seleccion.length >= 2) seleccion = [nombre];
        else seleccion = seleccion.concat(nombre);
        pendiente = null;
        if (seleccion.length === 2) {
          const r = combinar(red, seleccion[0], seleccion[1], "Rx" + (contador + 1));
          if (!r) {
            aviso = ["Esas dos no están en serie ni en paralelo. En serie no debe salir ninguna otra rama del punto que las une; en paralelo deben unirse por sus dos extremos.", "mal"];
            seleccion = [];
          } else { contador++; pendiente = r; }
        }
        pintar();
        if (pendiente) setTimeout(() => raiz.querySelector('.celda[data-id="rc"]')?.focus(), 30);
      }

      function paso1() {
        const resaltados = Object.fromEntries(seleccion.map(n => [n, NARANJA]));
        let bloquePendiente = null;
        if (pendiente) {
          const v = valores();
          const a = v.get(seleccion[0]), b = v.get(seleccion[1]), p = pendiente;
          bloquePendiente = [
            Mensaje(`${fmt(a, 4)} Ω y ${fmt(b, 4)} Ω están en ${p.tipo === "SERIE" ? "serie" : "paralelo"}. ¿Cuánto vale su equivalente?`, "info"),
            Campo("R equivalente", "rc", "Ω", entrada),
            Botones(
              Boton("Combinar", () => {
                const l = leerExpresion(entrada.texto("rc"));
                const x = l.tipo === "numero" ? l.valor : null;
                const otro = p.tipo === "SERIE" ? a * b / (a + b) : a + b;
                if (x === null) aviso = ["Escribe el valor del equivalente.", "info"];
                else if (coincide(x, p.valor)) aplicar(p);
                else if (coincide(x, otro)) aviso = [p.tipo === "SERIE" ? "Están en serie: se suman, R = R1 + R2." : "Están en paralelo: R = R1·R2/(R1 + R2).", "mal"];
                else aviso = [`No coincide. ${p.tipo === "SERIE" ? "En serie, R = R1 + R2." : "En paralelo, R = R1·R2/(R1 + R2)."}`, "mal"];
                pintar();
              }),
              Boton("Ver valor", () => { aplicar(p); pintar(); }, false),
            ),
          ];
        }
        return Tarjeta("Paso 1 · Reduce la red hasta R_eq entre a y b",
          Chico("Toca dos resistencias que estén en serie (misma corriente, nada se conecta entre ellas) o en paralelo (comparten sus dos nodos)."),
          dibujarEsquema(esquemaRed(red), { resaltados, alTocarComponente: tocar, titulo: "Red de resistencias: toca dos para combinarlas" }),
          bloquePendiente,
          aviso ? Mensaje(aviso[0], aviso[1]) : null,
          pasos.length ? [Linea(), pasos.map((s, i) => Texto(`${i + 1}. ${s}`))] : null,
          Botones(Boton("Reiniciar", () => { reiniciar(); pintar(); }, false)),
        );
      }

      function paso2() {
        const esI = pr.pregunta === "CORRIENTE";
        const req = equivalente(pr.red);
        let msg = null;
        if (revision) {
          if (revision.ok === true) msg = Mensaje("¡Correcto!", "bien");
          else if (revision.ok === false) msg = Mensaje(revision.mensaje || "", "mal");
          else msg = Mensaje("Escribe tu respuesta.", "info");
        }
        return Tarjeta("Paso 2 · Divisores de voltaje y corriente",
          Texto(`Se conecta una fuente de ${fmt(pr.fuente)} V. ¿Cuánto vale ${esI ? "la corriente (de izquierda a derecha)" : "el voltaje (+ a la izquierda)"} en la resistencia resaltada?`),
          dibujarEsquema(pr.conFuente, { resaltados: { [pr.objetivo]: COLOR_A } }),
          Campo(esI ? "i" : "v", "resp", esI ? "A" : "V", entrada),
          Botones(
            Boton("Revisar", () => {
              revision = revisarCampo(entrada, "resp", esI ? "La corriente" : "El voltaje", pr.respuesta,
                "no coincide. Calcula la corriente total con R_eq y repártela con divisores de corriente y de voltaje rama por rama.",
                [[-pr.respuesta, "revisa el signo."]]);
              pintar();
            }),
            Boton("Pista", () => { pista = true; pintar(); }, false),
            Boton("Solución", () => { verSolucion = true; pintar(); }, false),
          ),
          msg,
          pista ? Mensaje(`R_eq = ${fmt(req, 4)} Ω, así que la fuente entrega i = ${fmt(pr.fuente)}/${fmt(req, 4)} = ${fmt(pr.corrienteTotal, 4)} A.`, "info") : null,
          verSolucion ? Dato(esI ? "i" : "v", `${fmt(pr.respuesta, 4)} ${esI ? "A" : "V"}`, "#1F3A93") : null,
        );
      }

      function pintar() {
        L.poner(raiz, paso1(), paso2(), Boton("Nueva red", () => nuevo(), true, "ancho"), Numero(pr.semilla, nuevo));
      }

      nuevo(ctx.semilla || semillaNueva());
    },
  };
})(window);
