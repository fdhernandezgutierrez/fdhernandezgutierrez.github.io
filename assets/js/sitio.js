/* ==========================================================================
   sitio.js — menú, pie de página y contenido de cada página.
   El contenido se toma de datos.js; aquí no hace falta editar nada,
   salvo para agregar o quitar páginas del menú (lista MENU).
   © 2026 Fernando Daniel Hernandez Gutierrez
   ========================================================================== */
(function () {
  "use strict";
  const P = window.PERFIL;
  // Los elementos con la palabra EDITAR son datos pendientes: no se publican.
  ["intereses", "enlaces", "cifras", "noticias", "lineas", "publicaciones", "proyectos", "docencia", "servicio", "formacion",
   "premios", "proyectosInvestigacion", "direccion", "revision", "divulgacion", "habilidades"]
    .forEach(k => { P[k] = Array.isArray(P[k]) ? P[k].filter(x => !/EDITAR/.test(JSON.stringify(x))) : []; });
  const $ = (sel, raiz) => (raiz || document).querySelector(sel);
  const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));
  const pagina = document.body.dataset.pagina;
  // Páginas dentro de subcarpetas (educacion/, juegos/) indican cuánto subir: data-raiz="../"
  const raiz = document.body.dataset.raiz || "";

  /* ---------------- Menú principal ---------------- */
  const MENU = [
    { id: "inicio",        texto: "Inicio",         url: "index.html" },
    { id: "sobre",         texto: "Sobre mí",       url: "sobre-mi.html" },
    { id: "investigacion", texto: "Investigación",  url: "investigacion.html" },
    { id: "publicaciones", texto: "Publicaciones",  url: "publicaciones.html" },
    { id: "proyectos",     texto: "Proyectos",      url: "proyectos.html" },
    { id: "educacion",     texto: "Educación",      url: "educacion/index.html" },
    { id: "juegos",        texto: "Juegos",         url: "juegos/index.html" },
    { id: "contacto",      texto: "Contacto",       url: "contacto.html" }
  ];

  // El orden de esta lista es el de las pestañas y el de las publicaciones de un mismo año
  const TIPOS = {
    revista:     { texto: "Artículo de revista", corto: "Revistas" },
    congreso:    { texto: "Congreso",            corto: "Congresos" },
    otra:        { texto: "Otra publicación",    corto: "Otras" },
    preparacion: { texto: "En preparación",      corto: "En preparación" },
    tesis:       { texto: "Tesis",               corto: "Tesis" }
  };
  const ORDEN_TIPOS = Object.keys(TIPOS);

  const ICONOS = {
    orcid:    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><text x="12" y="16" font-size="10" text-anchor="middle" style="fill:var(--icono-fondo,#0a0f1e)" font-family="Arial" font-weight="700">iD</text></svg>',
    scholar:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3zm-6 9.2V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8l-6 3.3-6-3.3z"/></svg>',
    github:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z"/></svg>',
    rg:       '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="3" fill="currentColor"/><text x="12" y="16" font-size="9" text-anchor="middle" style="fill:var(--icono-fondo,#0a0f1e)" font-family="Arial" font-weight="700">RG</text></svg>',
    cv:       '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 2h8l6 6v14H6zM13 3.5V9h5.5z"/></svg>',
    correo:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5h18v14H3zm2 2v.5l7 4.5 7-4.5V7z"/></svg>',
    lugar:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
    grupo:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 2 8l10 5 8-4v6h2V8L12 3zM6 12.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.5l-6 3-6-3z"/></svg>'
  };

  const ILUS = {
    retina: '<svg viewBox="0 0 50 50" aria-hidden="true"><circle cx="25" cy="25" r="21" fill="none" stroke="#f97362" stroke-width="2"/><circle cx="17" cy="25" r="4" fill="#fbbf9b"/><path d="M17 25C24 20 30 12 38 10M17 25c8-1 14 3 24 2M17 25c6 5 12 11 19 15M27 18c2 4 6 5 9 4M27 30c4-1 6 1 8-2" fill="none" stroke="#5eead4" stroke-width="1.8" stroke-linecap="round"/></svg>',
    rd:     '<svg viewBox="0 0 50 50" aria-hidden="true"><g fill="#5eead4"><rect x="5" y="34" width="6" height="10" rx="1.5"/><rect x="14" y="28" width="6" height="16" rx="1.5" opacity=".85"/><rect x="23" y="21" width="6" height="23" rx="1.5" opacity=".7"/><rect x="32" y="14" width="6" height="30" rx="1.5" fill="#f97362"/><rect x="41" y="7" width="6" height="37" rx="1.5" fill="#f97362" opacity=".7"/></g></svg>',
    motor:  '<svg viewBox="0 0 50 50" aria-hidden="true"><path d="M3 25c4-12 8-12 12 0s8 12 12 0" fill="none" stroke="#5eead4" stroke-width="2.2" stroke-linecap="round"/><path d="M27 25c2-8 3-14 5-2s3 10 5-6 3 2 4 6 3 4 5-1" fill="none" stroke="#f97362" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    nas:    '<svg viewBox="0 0 50 50" aria-hidden="true"><g stroke="#5eead4" stroke-width="1.6"><line x1="10" y1="12" x2="25" y2="25"/><line x1="10" y1="38" x2="25" y2="25"/><line x1="25" y1="25" x2="40" y2="12"/><line x1="25" y1="25" x2="40" y2="38"/><line x1="10" y1="12" x2="40" y2="12" stroke-dasharray="2 3"/></g><g fill="#0a0f1e" stroke="#5eead4" stroke-width="2"><circle cx="10" cy="12" r="4"/><circle cx="10" cy="38" r="4"/><circle cx="40" cy="12" r="4"/><circle cx="40" cy="38" r="4"/></g><circle cx="25" cy="25" r="5.5" fill="#f97362"/></svg>',
    cerebro:'<svg viewBox="0 0 50 50" aria-hidden="true"><path d="M25 8c-4-3-11-2-13 3-5 0-8 5-6 9-3 3-2 9 2 11 0 5 5 8 10 7 2 3 5 4 7 3V8z" fill="none" stroke="#5eead4" stroke-width="2" stroke-linejoin="round"/><path d="M25 8c4-3 11-2 13 3 5 0 8 5 6 9 3 3 2 9-2 11 0 5-5 8-10 7-2 3-5 4-7 3" fill="none" stroke="#5eead4" stroke-width="2" stroke-linejoin="round"/><path d="M13 20c3 0 5 2 5 5M37 18c-3 1-4 3-4 6M15 32c3-1 6 0 7 2" fill="none" stroke="#5eead4" stroke-width="1.5" stroke-linecap="round" opacity=".6"/><circle cx="33" cy="29" r="5" fill="#f97362" opacity=".9"/><circle cx="33" cy="29" r="8" fill="none" stroke="#f97362" stroke-width="1.2" stroke-dasharray="2 2"/></svg>',
    luz:    '<svg viewBox="0 0 50 50" aria-hidden="true"><rect x="5" y="9" width="40" height="32" rx="4" fill="none" stroke="#5eead4" stroke-width="2"/><path d="M25 9v32" stroke="#5eead4" stroke-width="1.5" stroke-dasharray="2 2"/><path d="M8 37l7-9 5 6 5-6" fill="none" stroke="#3b4b6b" stroke-width="2" stroke-linejoin="round"/><path d="M25 28l4-4 5 6 4-5 4 6" fill="none" stroke="#5eead4" stroke-width="2" stroke-linejoin="round"/><circle cx="36" cy="17" r="3.5" fill="#f97362"/><g stroke="#f97362" stroke-width="1.4" stroke-linecap="round"><path d="M36 10.5v2M36 21.5v2M29.5 17h2M40.5 17h2"/></g><circle cx="14" cy="17" r="3" fill="#3b4b6b"/></svg>'
  };

  /* ---------------- Utilidades ---------------- */
  const enlacesValidos = () => P.enlaces.filter(e => e.url);
  const autores = lista => lista.map(a => /Hernandez-Gutierrez/.test(a) ? `<strong class="yo">${a}</strong>` : a).join(", ");
  const ordenarPubs = lista => lista.slice().sort((a, b) => (b.anio - a.anio) || (ORDEN_TIPOS.indexOf(a.tipo) - ORDEN_TIPOS.indexOf(b.tipo)));
  const cronologia = (lista, campoAnio) => lista.map(x =>
    `<li><time>${x[campoAnio || "anio"]}</time><b>${x.titulo}</b>${x.detalle ? `<span>${x.detalle}</span>` : ""}</li>`).join("");
  const lineaPorId = id => P.lineas.find(l => l.id === id);
  const poner = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

  function redes(conCorreo) {
    return (conCorreo ? `<a href="mailto:${P.correo}" title="Correo" aria-label="Correo">${ICONOS.correo}</a>` : "") +
      enlacesValidos().map(e => `<a href="${e.url}" target="_blank" rel="noopener" title="${e.etiqueta}" aria-label="${e.etiqueta}">${ICONOS[e.tipo] || ""}</a>`).join("");
  }

  function copiar(texto, boton) {
    const listo = () => { const t = boton.textContent; boton.textContent = "¡Copiado!"; setTimeout(() => { boton.textContent = t; }, 1400); };
    const alterno = () => {
      const ta = document.createElement("textarea");
      ta.value = texto; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { if (document.execCommand("copy")) listo(); } catch (e) { /* el BibTeX queda visible para copiarlo a mano */ }
      ta.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texto).then(listo, alterno);
    else alterno();
  }

  function tarjetaPub(p) {
    return `
    <article class="pub" id="pub-${p.id}">
      <div class="anio">${p.anio}</div>
      <div>
        <span class="tipo ${p.tipo}">${TIPOS[p.tipo].texto}</span>
        <h3>${p.titulo}</h3>
        ${p.autores && p.autores.length ? `<p class="a">${autores(p.autores)}</p>` : ""}
        <p class="v"><em>${p.revista}</em>${p.detalle ? ", " + p.detalle : ""}</p>
      </div>
      <div class="acc">
        ${p.doi ? `<a href="https://doi.org/${p.doi}" target="_blank" rel="noopener">Leer artículo</a>` : ""}
        ${p.pdf ? `<a href="${p.pdf}" target="_blank" rel="noopener">PDF</a>` : ""}
        ${p.codigo ? `<a href="${p.codigo}" target="_blank" rel="noopener">Código</a>` : ""}
        ${p.bibtex ? `<button type="button" data-cita="${p.id}" aria-expanded="false">Citar</button>` : ""}
      </div>
      ${p.bibtex ? `<pre id="bib-${p.id}">${p.bibtex}</pre>` : ""}
    </article>`;
  }

  function activarCitas(raiz) {
    $$("button[data-cita]", raiz).forEach(b => {
      b.addEventListener("click", () => {
        const pre = $("#bib-" + b.dataset.cita);
        const ver = pre.classList.toggle("ver");
        b.setAttribute("aria-expanded", String(ver));
        if (ver) copiar(pre.textContent, b);
      });
    });
  }

  function tarjetaLinea(l, conRelacionadas) {
    let rel = "";
    if (conRelacionadas) {
      const pubs = ordenarPubs(P.publicaciones.filter(p => p.linea === l.id));
      if (pubs.length) {
        rel = `<div class="relacionadas"><h4>Publicaciones relacionadas</h4><ul>${pubs.map(p =>
          `<li><a href="publicaciones.html#pub-${p.id}">${p.titulo}</a> <span class="estado" style="color:var(--suave)">· ${TIPOS[p.tipo].corto}, ${p.anio}</span></li>`).join("")}</ul></div>`;
      }
    }
    return `
    <article class="linea" id="${l.id}">
      <div class="ilus">${ILUS[l.id] || ""}</div>
      <div>
        <span class="estado">${l.estado}</span>
        <h3>${l.titulo}</h3>
        <p>${l.resumen}</p>
        <div class="tags">${l.etiquetas.map(t => `<span>${t}</span>`).join("")}</div>
        ${rel}
      </div>
    </article>`;
  }

  /* ---------------- Barra de navegación ---------------- */
  function pintarBarra() {
    const lugar = $("#barra");
    if (!lugar) return;
    const nav = document.createElement("nav");
    nav.className = "barra";
    nav.setAttribute("aria-label", "Principal");
    nav.innerHTML = `
      <div class="ancho">
        <a class="logo" href="${raiz}index.html" aria-label="Inicio"><span class="sello">${P.iniciales}</span><span class="logo-nombre">${P.nombreCorto}</span></a>
        <button class="hamburguesa" type="button" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menú"><span></span></button>
        <ul class="menu" id="menu-principal">
          ${MENU.map(m => `<li><a href="${raiz}${m.url}"${m.id === pagina ? ' aria-current="page"' : ""}>${m.texto}</a></li>`).join("")}
        </ul>
      </div>`;
    lugar.replaceWith(nav);

    const boton = $(".hamburguesa", nav);
    const fijar = abierta => {
      nav.classList.toggle("abierta", abierta);
      boton.setAttribute("aria-expanded", String(abierta));
      boton.setAttribute("aria-label", abierta ? "Cerrar menú" : "Abrir menú");
    };
    boton.addEventListener("click", () => fijar(!nav.classList.contains("abierta")));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("abierta")) { fijar(false); boton.focus(); } });
    document.addEventListener("click", e => { if (!nav.contains(e.target)) fijar(false); });
    $$(".menu a", nav).forEach(a => a.addEventListener("click", () => fijar(false)));
    window.matchMedia("(min-width: 1101px)").addEventListener("change", () => fijar(false));
    const sombra = () => nav.classList.toggle("con-sombra", window.scrollY > 8);
    window.addEventListener("scroll", sombra, { passive: true }); sombra();
  }

  /* ---------------- Pie de página ---------------- */
  function pintarPie() {
    const lugar = $("#pie");
    if (!lugar) return;
    const pie = document.createElement("footer");
    pie.className = "final";
    pie.innerHTML = `
      <div class="ancho">
        <div class="pie-cols">
          <div>
            <span class="pie-nombre">${P.nombre}</span>
            <p>${P.cargo}<br>${P.institucion}<br>${P.unidad}</p>
            <div class="redes">${redes(true)}</div>
          </div>
          <div><h4>Secciones</h4><ul>${MENU.map(m => `<li><a href="${raiz}${m.url}">${m.texto}</a></li>`).join("")}</ul></div>
          <div><h4>Contacto</h4><p><a href="mailto:${P.correo}">${P.correo}</a></p><p>${P.ciudad}</p></div>
        </div>
        <div class="pie-final"><span>© ${new Date().getFullYear()} ${P.nombre}</span><span>Última actualización: ${P.actualizado}</span></div>
      </div>`;
    lugar.replaceWith(pie);
  }

  /* ---------------- Páginas ---------------- */
  const PAGINAS = {
    inicio() {
      poner("#sobretitulo", `${P.cargo} · ${P.institucion}`);
      poner("#nombre", P.nombre);
      poner("#lema", P.lema);
      poner("#redes", redes(true));
      poner("#cifras", P.cifras.map(c => `<div class="cifra"><b>${c.valor}</b><span>${c.texto}</span></div>`).join(""));
      poner("#resumen", `<p>${P.bio[0]}</p>`);
      poner("#foto", P.foto ? `<img src="${P.foto}" alt="Fotografía de ${P.nombre}">` : P.iniciales);
      poner("#intereses", P.intereses.map(i => `<span>${i}</span>`).join(""));
      poner("#lineas-mini", P.lineas.map(l =>
        `<a href="investigacion.html#${l.id}"><div class="ilus">${ILUS[l.id] || ""}</div><span class="estado">${l.estado}</span><b>${l.titulo}</b></a>`).join(""));
      const recientes = $("#recientes");
      if (recientes) {
        const revistas = ordenarPubs(P.publicaciones.filter(p => p.tipo === "revista"));
        recientes.innerHTML = (revistas.length ? revistas : ordenarPubs(P.publicaciones)).slice(0, 3).map(tarjetaPub).join("");
        activarCitas(recientes);
      }
      poner("#cronologia", P.noticias.slice(0, 6).map(n => `<li><time>${n.fecha}</time><span>${n.texto}</span></li>`).join(""));
    },

    sobre() {
      poner("#foto", P.foto ? `<img src="${P.foto}" alt="Fotografía de ${P.nombre}">` : P.iniciales);
      poner("#bio", P.bio.map(p => `<p>${p}</p>`).join(""));
      poner("#formacion", P.formacion.map(f =>
        `<li><time>${f.periodo}</time><b>${f.grado}</b><span>${f.lugar}${f.detalle ? `<br><small>${f.detalle}</small>` : ""}</span></li>`).join(""));
      poner("#premios", cronologia(P.premios));
      poner("#habilidades", P.habilidades.map(h => `<dt>${h.area}</dt><dd>${h.texto}</dd>`).join(""));
      poner("#intereses", P.intereses.map(i => `<span>${i}</span>`).join(""));
      poner("#servicio", P.revision.map(s => `<li>${s.titulo}<small>${s.texto}</small></li>`).join(""));
      poner("#redes", redes(true));
      const cv = P.enlaces.find(e => e.tipo === "cv" && e.url);
      poner("#boton-cv", cv ? `<a class="btn prim" href="${cv.url}" target="_blank" rel="noopener">Descargar CV</a>` : "");
    },

    investigacion() {
      poner("#lineas", P.lineas.map(l => tarjetaLinea(l, true)).join(""));
    },

    publicaciones() {
      const tipos = ["todas"].concat(ORDEN_TIPOS.filter(t => P.publicaciones.some(p => p.tipo === t)));
      let tipoSel = "todas", texto = "";
      const pintarPestanas = () => {
        poner("#pestanas", tipos.map(t =>
          `<button type="button" class="${t === tipoSel ? "activo" : ""}" data-t="${t}" aria-pressed="${t === tipoSel}">${t === "todas" ? "Todas" : TIPOS[t].corto}</button>`).join(""));
        $$("#pestanas button").forEach(b => b.addEventListener("click", () => { tipoSel = b.dataset.t; pintarPestanas(); pintarLista(); }));
      };
      const pintarLista = () => {
        const q = texto.trim().toLowerCase();
        const lista = ordenarPubs(P.publicaciones)
          .filter(p => tipoSel === "todas" || p.tipo === tipoSel)
          .filter(p => !q || [p.titulo, p.revista, p.autores.join(" "), (lineaPorId(p.linea) || {}).titulo || ""].join(" ").toLowerCase().includes(q));
        const caja = $("#pubs");
        caja.innerHTML = lista.length ? lista.map(tarjetaPub).join("") : `<p class="vacio">No hay resultados para esa búsqueda.</p>`;
        poner("#conteo", `${lista.length} de ${P.publicaciones.length} ${P.publicaciones.length === 1 ? "trabajo" : "trabajos"}`);
        activarCitas(caja);
      };
      $("#buscar").addEventListener("input", e => { texto = e.target.value; pintarLista(); });
      pintarPestanas(); pintarLista();
      const perfiles = enlacesValidos().filter(e => ["scholar", "orcid", "rg"].includes(e.tipo));
      poner("#perfiles", perfiles.length ? `Lista completa y actualizada en ${perfiles.map(e => `<a href="${e.url}" target="_blank" rel="noopener">${e.etiqueta}</a>`).join(" · ")}.` : "");
      // Si se llega con #pub-ID desde otra página, resalta esa publicación
      if (location.hash) { const el = $(location.hash); if (el) { el.style.borderColor = "var(--turquesa)"; el.scrollIntoView(); } }
    },

    proyectos() {
      poner("#lista-investigacion", cronologia(P.proyectosInvestigacion));
      poner("#lista-direccion", cronologia(P.direccion));
      poner("#lista-docencia", P.docencia.map(d => `
        <div class="proy claro"><small>${d.periodo}</small><b>${d.curso}</b><p>${d.lugar}</p></div>`).join(""));
      poner("#lista-proyectos", P.proyectos.map(p => `
        <div class="proy"><small>${p.etiqueta}</small><b>${p.titulo}</b><p>${p.texto}</p>
          ${p.enlace ? `<a href="${p.enlace}" target="_blank" rel="noopener">Ver proyecto →</a>` : ""}</div>`).join(""));
      poner("#lista-revision", P.revision.map(s => `<li><time>Revisión</time><b>${s.titulo}</b><span>${s.texto}</span></li>`).join("") + cronologia(P.servicio));
      poner("#lista-divulgacion", cronologia(P.divulgacion));
      // Oculta las secciones que quedaron sin contenido
      $$("section[data-seccion]").forEach(s => { const lista = $("[id^=lista-]", s); if (lista && !lista.innerHTML.trim()) s.hidden = true; });
    },

    contacto() {
      poner("#datos-contacto", `
        <div class="dato"><div class="icono">${ICONOS.correo}</div><div><b>Correo</b><a href="mailto:${P.correo}">${P.correo}</a></div></div>
        <div class="dato"><div class="icono">${ICONOS.grupo}</div><div><b>Adscripción</b><span>${P.grupo}<br>${P.unidad}<br>${P.institucion}</span></div></div>
        <div class="dato"><div class="icono">${ICONOS.lugar}</div><div><b>Ubicación</b><span>${P.ciudad}</span></div></div>
        <div class="redes oscuras">${redes(false)}</div>`);
      poner("#asunto", P.asuntosContacto.map(a => `<option>${a}</option>`).join(""));
      activarFormulario();
    }
  };

  /* ---------------- Formulario de contacto ----------------
     Sin servicio configurado (GitHub Pages): abre el programa de correo del
     visitante con el mensaje ya escrito. Con servicio (Formspree o enviar.php):
     lo envía directamente y, si falla, recurre al programa de correo para
     que el mensaje nunca se pierda.                                       */
  function activarFormulario() {
    const form = $("#formulario");
    if (!form) return;
    const aviso = $("#aviso-form");
    const boton = $("button[type=submit]", form);
    const servicio = (P.formularioServicio || "").trim();
    const mostrar = (clase, texto) => { aviso.className = "aviso-form " + clase; aviso.textContent = texto; aviso.focus(); };
    const asuntoDe = datos => `[Página web] ${datos.get("asunto")} — ${datos.get("nombre")}`;
    const abrirCorreo = datos => {
      const cuerpo = `${datos.get("mensaje")}\n\n${datos.get("nombre")}\n${datos.get("email")}`;
      window.location.href = `mailto:${P.correo}?subject=${encodeURIComponent(asuntoDe(datos))}&body=${encodeURIComponent(cuerpo)}`;
    };

    if (servicio) {
      poner("#privacidad", /^https?:\/\//i.test(servicio)
        ? `Los mensajes se entregan mediante ${P.formularioProveedor || "un servicio externo"}. Sus datos solo se usan para responderle.`
        : "Sus datos solo se usan para responder a su mensaje y no se comparten con terceros.");
      boton.textContent = "Enviar mensaje";
    } else {
      poner("#privacidad", "Al enviar se abrirá su programa de correo con el mensaje listo. Esta página no guarda ningún dato.");
      boton.textContent = "Abrir mi correo para enviar";
    }

    // Resultado cuando enviar.php redirige aquí (envío sin JavaScript)
    const estado = new URLSearchParams(location.search).get("estado");
    if (estado === "ok") mostrar("ok", "¡Gracias! Su mensaje fue enviado. Le responderé a la brevedad.");
    if (estado === "error") mostrar("error", "No se pudo enviar el mensaje. Escríbame directamente a " + P.correo + ".");

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const datos = new FormData(form);
      if (datos.get("_gotcha")) return;                         // campo trampa lleno: robot
      datos.set("_subject", asuntoDe(datos));                    // asunto del correo en Formspree

      if (!servicio) {
        mostrar("info", "Se abrió su programa de correo con el mensaje listo; solo falta enviarlo. Si no se abrió, escriba a " + P.correo + ".");
        abrirCorreo(datos);
        return;
      }

      boton.disabled = true;
      mostrar("info", "Enviando…");
      let resp = null, r = null;
      try {
        resp = await fetch(servicio, { method: "POST", body: datos, headers: { Accept: "application/json" } });
        r = await resp.json();
      } catch (err) { r = null; }
      boton.disabled = false;

      if (resp && resp.ok && r && r.ok !== false) {
        form.reset();
        mostrar("ok", r.mensaje || "¡Gracias! Su mensaje fue enviado. Le responderé a la brevedad.");
        return;
      }
      const error = r && (r.mensaje || (Array.isArray(r.errors) && r.errors.map(x => x.message).join(" ")) || r.error);
      if (error && !r.respaldo) { mostrar("error", error); return; }

      mostrar("info", "No fue posible enviarlo desde la página, así que se abrió su programa de correo con el mensaje listo. Si no se abrió, escriba a " + P.correo + ".");
      abrirCorreo(datos);
    });
  }

  /* ---------------- Arranque ---------------- */
  pintarBarra();
  pintarPie();
  if (PAGINAS[pagina]) PAGINAS[pagina]();
})();
