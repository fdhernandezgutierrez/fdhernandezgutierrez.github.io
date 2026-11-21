/* ==========================================================================
   app.js — menú de módulos y navegación (#cap4/123456 abre el problema 123456).
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function (G) {
  "use strict";
  const LAB = G.LAB;
  const { h, Chico } = LAB;
  const MODULOS = (LAB.MODULOS = LAB.MODULOS || {});

  // Orden y presentación, como en la pantalla de inicio de la app.
  const LISTA = [
    { id: "cap12", nombre: "Potencia", color: "#E65100",
      descripcion: "Convención pasiva: decide si un elemento absorbe o entrega potencia, y comprueba el balance de potencia de un circuito." },
    { id: "cap3", nombre: "Circuitos resistivos", color: "#2E7D32",
      descripcion: "Reduce redes serie-paralelo tocando pares de resistencias y aplica divisores de voltaje y de corriente." },
    { id: "cap4", nombre: "Nodos y mallas", color: "#1F3A93",
      descripcion: "Plantea A·x = b con supernodos, supermallas y fuentes dependientes. El laboratorio te dice qué fila está mal y por qué." },
    { id: "cap5", nombre: "Thévenin y Norton", color: "#00838F",
      descripcion: "Calcula v_oc, R_th e I_N, elige las terminales, apaga fuentes para ver la superposición y encuentra la potencia máxima." },
    { id: "cap6", nombre: "Amplificador operacional", color: "#D81B60",
      descripcion: "Inversor, no inversor, sumador, diferencial y seguidor, con la saturación a ±Vsat a la vista." },
    { id: "cap78", nombre: "Circuitos RC y RL", color: "#1E88E5",
      descripcion: "Aplica el método v(0⁺), v(∞) y τ, y observa la respuesta después de un cambio de la fuente." },
    { id: "cap9", nombre: "Circuitos RLC", color: "#6A1B9A",
      descripcion: "Mueve R, L y C y observa cómo se mueven las raíces en el plano s y cómo cambia la respuesta en el tiempo." },
    { id: "cap10", nombre: "Análisis senoidal", color: "#14286B",
      descripcion: "Impedancias y fasores que giran, desfase entre voltaje y corriente, triángulo de potencia y factor de potencia." },
  ];

  const raiz = document.getElementById("lab");

  function inicio() {
    document.title = "Laboratorio de Circuitos · Fernando D. Hernández";
    raiz.replaceChildren(
      h("div", { class: "lab-modulos" }, LISTA.map((m, i) => {
        const listo = !!MODULOS[m.id];
        return h(listo ? "a" : "div", { class: "lab-modulo", href: listo ? "#" + m.id : null, style: listo ? null : { opacity: 0.55 } },
          h("div", { class: "cap", style: { background: m.color } }, h("small", { text: "Módulo" }), h("b", { text: String(i + 1) })),
          h("div", null, h("h3", { text: m.nombre }), h("p", { text: listo ? m.descripcion : "En preparación." })),
          listo ? h("span", { class: "ir", style: { color: m.color }, text: "›" }) : null);
      })),
      Chico("Los circuitos son originales y sus valores cambian en cada intento; cada problema tiene un número para repetirlo. Es el mismo número que en la app para Android."),
      Chico("Funciona en el navegador, sin instalar nada, y no recopila datos."),
    );
  }

  function abrir(id, semilla, extra) {
    const m = LISTA.find(x => x.id === id);
    const mod = MODULOS[id];
    if (!m || !mod) return inicio();
    const titulo = h("b", { text: mod.titulo });
    const subtitulo = h("small", { text: mod.subtitulo || "" });
    const contenido = h("div", { class: "lab-contenido" });
    raiz.replaceChildren(
      h("div", { class: "lab-barra" }, h("a", { href: "#", "aria-label": "Volver a los módulos", text: "←" }), h("div", null, titulo, subtitulo)),
      contenido,
    );
    document.title = `${m.nombre} · Laboratorio de Circuitos`;
    mod.montar(contenido, {
      semilla,
      extra: extra || "",
      subtitulo: t => { subtitulo.textContent = t; },
      /** Deja el número del problema (y la variante) en la dirección, para recargar o compartir el mismo problema. */
      fijarSemilla: (s, variante = "") => history.replaceState(null, "", `#${id}/${s}${variante ? "/" + variante : ""}`),
    });
  }

  function navegar() {
    LAB.Teclado.ocultar();
    const [id, n, extra] = location.hash.replace(/^#/, "").split("/");
    const semilla = n && /^\d+$/.test(n) ? Number(n) : null;
    if (!id) inicio(); else abrir(id, semilla, extra);
    window.scrollTo({ top: 0 });
  }

  addEventListener("hashchange", navegar);
  navegar();
})(window);
