/* cap4.js — Módulo 3: planteamiento A·x = b por nodos o mallas, revisión fila por fila y balance de potencia. */
(function (G) {
  "use strict";
  const L = G.LAB;
  const { h, Tarjeta, Texto, Chico, Mensaje, Boton, Botones, Dato, Linea, Selector, Pildoras, Entrada, Campo, Numero,
    dibujarEsquema, Cap4, revisarSistema, resolverCD, leerExpresion, coincide, listaTexto, semillaNueva, fmt } = L;

  (L.MODULOS = L.MODULOS || {}).cap4 = {
    titulo: "Nodos y mallas",
    montar(raiz, ctx) {
      // Variante en la dirección: «nodos», «mallas», «nodos-3»… (plantilla 3 = tercera de la lista).
      const [m0, p0] = (ctx.extra || "").split("-");
      let metodo = m0 === "mallas" ? "MALLAS" : "NODOS";
      let plantilla = Number(p0) || 0; // 0 = al azar; k = plantilla k−1
      let pr, entrada, revision, pista, verSolucion, valores;

      function nuevo(s = semillaNueva()) {
        pr = Cap4.generar(metodo, s, plantilla === 0 ? null : plantilla - 1);
        ctx.fijarSemilla(s, metodo.toLowerCase() + (plantilla ? "-" + plantilla : ""));
        const sis = pr.sistema, n = sis.n, unidad = metodo === "NODOS" ? "V" : "A";
        const orden = [], etiquetas = {};
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) { orden.push(`a_${i}_${j}`); etiquetas[`a_${i}_${j}`] = `Fila ${i + 1}, coeficiente de ${sis.incognitas[j]}`; }
          orden.push(`b_${i}`); etiquetas[`b_${i}`] = `Fila ${i + 1}, lado derecho`;
        }
        for (let j = 0; j < n; j++) { orden.push(`x_${j}`); etiquetas[`x_${j}`] = `Valor de ${sis.incognitas[j]} (${unidad})`; }
        entrada = new Entrada(orden, etiquetas);
        revision = null; pista = 0; verSolucion = false; valores = null;
        pintar();
      }

      function matriz() {
        const sis = pr.sistema, n = sis.n;
        const columnas = `26px repeat(${n}, minmax(54px, 1fr)) 16px minmax(54px, 1fr) 20px`;
        const filaCab = h("div", { class: "fila", style: { gridTemplateColumns: columnas } },
          h("span"), sis.incognitas.map(v => h("span", { class: "cab", text: v })), h("span"), h("span", { class: "cab", text: "b" }), h("span"));
        const filas = [];
        for (let i = 0; i < n; i++) {
          const est = revision ? revision.filas[i] : null;
          const clase = est === "BIEN" ? "bien" : est ? "mal" : "";
          const celda = id => { const c = entrada.celda(id, "0"); if (clase) c.classList.add(clase); return c; };
          filas.push(h("div", { class: "fila " + clase, style: { gridTemplateColumns: columnas } },
            h("span", { class: "num", text: "F" + (i + 1) }),
            [...Array(n).keys()].map(j => celda(`a_${i}_${j}`)),
            h("span", { class: "igual", text: "=" }),
            celda(`b_${i}`),
            h("span", { class: "num", text: est === "BIEN" ? "✓" : est ? "✗" : "" })));
          if (pista >= 1) {
            const ec = sis.ecuaciones[i];
            filas.push(h("div", { style: { paddingLeft: "30px", marginBottom: "4px" } },
              h("p", { class: "lab-chico", style: { color: "#1F3A93" }, text: ec.descripcion }),
              pista >= 2 && ec.participantes.length ? Chico("Intervienen: " + ec.participantes.join("; ")) : null));
          }
        }
        return h("div", { class: "lab-matriz", role: "group", "aria-label": "Sistema A·x = b" }, filaCab, filas);
      }

      function balance() {
        const c = pr.construido, sol = resolverCD(c.circuito);
        let entregada = 0, absorbida = 0;
        const filas = c.esquema.componentes.map(comp => {
          const p = sol.potencia(comp.nombre);
          if (p >= 0) absorbida += p; else entregada -= p;
          let donde;
          if (metodo === "NODOS") {
            const e = c.circuito.elemento(comp.nombre);
            donde = `${e.a !== 0 ? c.variable(e.a) : "tierra"}–${e.b !== 0 ? c.variable(e.b) : "tierra"}`;
          } else {
            const ms = c.mallas.filter(m => m.signos.has(comp.nombre)).map(m => m.nombre);
            donde = ms.length > 1 ? "entre " + listaTexto(ms) : "malla " + (ms[0] || "");
          }
          const accion = Math.abs(p) < 1e-9 ? "0 W" : p > 0 ? `absorbe ${fmt(p)} W` : `entrega ${fmt(-p)} W`;
          return Dato(`${comp.etiqueta}  (${donde})`, accion, p < -1e-9 ? "#E65100" : null);
        });
        const ok = Math.abs(entregada - absorbida) < 1e-6 * (1 + entregada);
        return Tarjeta("Comprobación · balance de potencia",
          Chico("Potencia de cada elemento calculada con el simulador. En todo circuito, la potencia entregada es igual a la absorbida."),
          filas, Linea(), Dato("Potencia entregada", `${fmt(entregada)} W`, "#E65100"), Dato("Potencia absorbida", `${fmt(absorbida)} W`),
          Mensaje(ok ? "El balance se cumple." : "El balance no se cumple.", ok ? "bien" : "aviso"));
      }

      function pintar() {
        const sis = pr.sistema, n = sis.n, unidad = metodo === "NODOS" ? "V" : "A";
        ctx.subtitulo(pr.titulo);
        const pasoDos = revision?.correcto || verSolucion;
        let msgValores = null;
        if (valores) {
          const mal = valores.map((ok, j) => (ok ? null : sis.incognitas[j])).filter(Boolean);
          msgValores = mal.length === 0 ? Mensaje("¡Correcto! Abajo está la comprobación con el balance de potencia.", "bien")
            : Mensaje(`Revisa ${listaTexto(mal)}. Se acepta un error de hasta 1 %.`, "mal");
        }
        L.poner(raiz, 
          Selector(["Análisis nodal", "Análisis de mallas"], metodo === "NODOS" ? 0 : 1, i => {
            const m = i === 0 ? "NODOS" : "MALLAS";
            if (m !== metodo) { metodo = m; plantilla = 0; nuevo(); }
          }),
          Pildoras(["Al azar"].concat(Cap4.plantillas(metodo).map(p => p.titulo)), plantilla, i => { plantilla = i; nuevo(); }),
          Tarjeta(null, Texto(pr.enunciado), dibujarEsquema(pr.construido, { mallas: metodo === "MALLAS" }), Numero(pr.semilla, nuevo)),
          Tarjeta("Paso 1 · Planteamiento A·x = b",
            Chico("Escribe cada coeficiente en su celda. Puedes usar fracciones (1/5 + 1/20); las celdas vacías valen 0. Las filas pueden ir en cualquier orden."),
            matriz(),
            Botones(
              Boton("Revisar", () => {
                revision = revisarSistema(
                  [...Array(n).keys()].map(i => [...Array(n).keys()].map(j => entrada.texto(`a_${i}_${j}`))),
                  [...Array(n).keys()].map(i => entrada.texto(`b_${i}`)), sis);
                pintar();
              }),
              Boton(pista === 0 ? "Pista" : "Otra pista", () => { pista = Math.min(pista + 1, 3); pintar(); }, false),
              Boton("Solución", () => { verSolucion = true; pintar(); }, false),
            ),
            revision ? Mensaje(revision.mensaje, revision.correcto ? "bien" : "mal") : null,
            pista === 1 ? Chico("Pista 1: debajo de cada fila aparece qué ecuación va en ella.") : null,
            pista === 2 ? Chico("Pista 2: también aparecen los elementos que intervienen en cada ecuación.") : null,
            pista >= 3 || verSolucion ? [Linea(), h("b", { style: { color: "#1F3A93" }, text: "Planteamiento de referencia" }),
              sis.ecuaciones.map((ec, i) => h("div", null, Chico(`${i + 1}. ${ec.descripcion}`),
                h("p", { class: "lab-texto", style: { paddingLeft: "12px" }, text: sis.texto(i) }))),
              Chico("Cualquier múltiplo de estas filas, o las mismas en otro orden, también es correcto.")] : null,
          ),
          pasoDos ? Tarjeta("Paso 2 · Resuelve el sistema",
            sis.incognitas.map((v, j) => {
              if (valores) entrada.marcar(`x_${j}`, valores[j]);
              return Campo(`${v} =`, `x_${j}`, unidad, entrada);
            }),
            Botones(Boton("Revisar valores", () => {
              const x = sis.solucion, escala = Math.max(...x.map(Math.abs));
              valores = x.map((xj, j) => { const l = leerExpresion(entrada.texto(`x_${j}`)); return l.tipo === "numero" && coincide(l.valor, xj, escala); });
              pintar();
            })),
            msgValores,
            verSolucion ? Chico("Solución: " + sis.incognitas.map((v, j) => `${v} = ${fmt(sis.solucion[j])} ${unidad}`).join("   ")) : null,
          ) : null,
          (valores && valores.every(Boolean)) || verSolucion ? balance() : null,
          Boton("Nuevo problema", () => nuevo(), true, "ancho"),
        );
      }

      nuevo(ctx.semilla || semillaNueva());
    },
  };
})(window);
