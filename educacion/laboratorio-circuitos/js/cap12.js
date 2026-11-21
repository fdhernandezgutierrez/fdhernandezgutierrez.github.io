/* cap12.js — Módulo 1: convención pasiva y balance de potencia. */
(function (G) {
  "use strict";
  const L = G.LAB;
  const { h, Tarjeta, Texto, Chico, Mensaje, Boton, Botones, Dato, Linea, Selector, Entrada, Campo, revisarCampo,
    ResultadoRevision, Numero, dibujarEsquema, EjercicioElemento, EjercicioBalance, semillaNueva, fmt } = L;

  (L.MODULOS = L.MODULOS || {}).cap12 = {
    titulo: "Potencia",
    subtitulo: "Convención pasiva",
    montar(raiz, ctx) {
      let modo = 0, racha = 0, semilla, el, bal, entrada, revision, verSolucion, pista;

      function nuevo(s = semillaNueva()) {
        semilla = s;
        ctx.fijarSemilla(s);
        el = EjercicioElemento.generar(s);
        bal = null;
        revision = null; verSolucion = false; pista = false;
        if (modo === 0) {
          entrada = new Entrada(["p"], { p: "Potencia absorbida en watts" });
        } else {
          bal = EjercicioBalance.generar(s);
          const comps = bal.construido.esquema.componentes;
          entrada = new Entrada(comps.map(c => "p_" + c.nombre),
            Object.fromEntries(comps.map(c => ["p_" + c.nombre, `Potencia absorbida por ${c.etiqueta} (${bal.donde(c.nombre)})`])));
        }
        pintar();
      }

      function unElemento() {
        const entra = el.pasiva ? "entra" : "sale";
        const enunciado = {
          GENERICO: "Calcula la potencia que absorbe el elemento con el voltaje y la corriente indicados.",
          FUENTE_V: "Calcula la potencia que absorbe la fuente de voltaje con la corriente indicada.",
          FUENTE_I: "Calcula la potencia que absorbe la fuente de corriente con el voltaje indicado.",
        }[el.tipo];
        let msg = null;
        if (revision) {
          if (revision.ok === true) msg = Mensaje(`¡Correcto! El elemento ${el.absorbida >= 0 ? "absorbe" : "entrega"} ${fmt(Math.abs(el.absorbida))} W.`, "bien");
          else if (revision.ok === false) msg = Mensaje(revision.mensaje || "", "mal");
          else msg = Mensaje("Escribe la potencia.", "info");
        }
        return [
          Tarjeta(null, Texto(enunciado), dibujarEsquema(el.esquema()),
            Chico("Un valor negativo significa que la potencia se entrega."), Numero(semilla, nuevo)),
          Tarjeta("Tu respuesta",
            Campo("p absorbida", "p", "W", entrada),
            Botones(
              Boton("Revisar", () => {
                revision = revisarCampo(entrada, "p", "p", el.absorbida,
                  "con la convención pasiva, p = v·i si la corriente entra por la terminal +, y p = −v·i si sale.",
                  [[-el.absorbida, `el signo no. Aquí la corriente ${entra} por la terminal +, así que p = ${el.pasiva ? "v·i" : "−v·i"}.`]]);
                if (revision.ok === true) racha++; else if (revision.ok === false) racha = 0;
                pintar();
              }),
              Boton("Solución", () => { verSolucion = true; pintar(); }, false),
              Boton("Otro", () => nuevo(), false),
            ),
            msg,
            racha >= 2 ? Chico(`Aciertos seguidos: ${racha}`, "verde") : null,
            verSolucion ? [Linea(), Texto(`La corriente ${entra} por la terminal +, así que p = ${el.pasiva ? "v·i" : "−v·i"} = ` +
              `${el.pasiva ? "" : "−"}(${fmt(el.v)})(${fmt(el.i)}) = ${fmt(el.absorbida)} W.`)] : null,
          ),
        ];
      }

      function balance() {
        const comps = bal.construido.esquema.componentes;
        const escala = Math.max(...[...bal.potencias.values()].map(Math.abs));
        return [
          Tarjeta(null,
            Texto("Ya se conocen los voltajes de nodo. Calcula la potencia que absorbe cada elemento (negativa si la entrega) y comprueba que la suma es cero."),
            dibujarEsquema(bal.construido), Numero(semilla, nuevo)),
          Tarjeta("Potencia absorbida por elemento",
            comps.map(c => Campo(`${c.etiqueta}  (${bal.donde(c.nombre)})`, "p_" + c.nombre, "W", entrada)),
            Botones(
              Boton("Revisar", () => {
                revision = comps.map(c => {
                  const p = bal.potencias.get(c.nombre);
                  return revisarCampo(entrada, "p_" + c.nombre, c.etiqueta, p, "no coincide.",
                    [[-p, "revisa el signo: ¿la corriente entra o sale por la terminal +?"]], escala);
                });
                pintar();
              }),
              Boton("Pista", () => { pista = true; pintar(); }, false),
              Boton("Solución", () => { verSolucion = true; pintar(); }, false),
            ),
            ResultadoRevision(revision, "¡Todo correcto! La suma de potencias absorbidas es cero: el balance se cumple."),
            pista ? Mensaje("Resistencia: p = (v_a − v_b)²/R. Fuente de corriente: p = (v_a − v_b)·I, con I entrando por a. " +
              "Fuente de voltaje: su corriente sale de la LCK en uno de sus nodos.", "info") : null,
            verSolucion ? [Linea(), comps.map(c => {
              const p = bal.potencias.get(c.nombre);
              return Dato(`${c.etiqueta} (${bal.donde(c.nombre)})`, `${fmt(p)} W`, p < 0 ? "#E65100" : null);
            }), Dato("Suma", `${fmt([...bal.potencias.values()].reduce((s, x) => s + x, 0))} W`, "#2E7D32")] : null,
          ),
          Boton("Nuevo circuito", () => nuevo(), true, "ancho"),
        ];
      }

      function pintar() {
        ctx.subtitulo(modo === 0 ? "Convención pasiva" : "Balance de potencia");
        L.poner(raiz, 
          Selector(["Un elemento", "Balance en un circuito"], modo, i => { if (i !== modo) { modo = i; nuevo(); } }),
          ...(modo === 0 ? unElemento() : balance()),
        );
      }

      nuevo(ctx.semilla || semillaNueva());
    },
  };
})(window);
