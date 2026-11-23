/* ==========================================================================
   demo.js — demostración de SABER-DR en el navegador: carga de la imagen,
   descarga del modelo con permiso del visitante, análisis y resultados.
   Textos en inglés (por defecto) y español, según window.IDIOMA (sitio.js).
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function () {
  "use strict";
  const PRE = window.SABER_PRE, MOD = window.SABER_MODELO;
  const BASE_MODELO = "modelo/";
  const ES = window.IDIOMA === "es";
  // Escala ordinal de un solo tono (claro -> oscuro) para los grados 0-4; texto legible sobre cada uno
  const COLORES = ["#86b6ef", "#3987e5", "#256abf", "#184f95", "#0d366b"];
  const TINTA = ["#0d366b", "#fff", "#fff", "#fff", "#fff"];
  const EXPERTOS = [["E01", 0, 1], ["E12", 1, 2], ["E23", 2, 3], ["E34", 3, 4]];
  const LADO_VISTA = 320;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (v, d = 1) => (v * 100).toFixed(d) + (ES ? " %" : "%");

  /* ---------------- Textos ---------------- */
  const TEXTOS = {
    en: {
      nombres: ["No diabetic retinopathy", "Mild non-proliferative DR", "Moderate non-proliferative DR", "Severe non-proliferative DR", "Proliferative DR"],
      cortos: ["No DR", "Mild", "Moderate", "Severe", "Proliferative"],
      sinAnalisis: "No analysis yet", sinAnalisisTexto: "Upload a fundus image or choose an example.", escala: "ICDR scale",
      descargar: "Download the model",
      descargarTexto: mb => `To analyze the image, your browser will download the model (${mb} MB) once. After that it stays saved and the analysis no longer uses the network.`,
      descargarBoton: "Download the model and analyze", wifi: "A Wi-Fi connection is recommended. The image is never sent to any server.",
      progresoAria: "Model download", descargando: "Downloading the model…", cargandoGuardado: "Loading the saved model…",
      preparando: "Preparing the model…", analizando: "Analyzing…", deMB: (a, b) => `${a} of ${b} MB`,
      errorInesperado: "An unexpected error occurred.",
      sinMemoria: "The browser ran out of memory while loading the model. Close other tabs or try on a computer.",
      noSePudo: "The analysis could not be completed", reintentar: "Try again",
      cribado: "Screening", referible: "Referable DR", noReferible: "Not referable", moderadaOMas: "≥ moderate", menosModerada: "< moderate",
      calidad: "Image quality", revisar: "Check", adecuada: "Adequate", gradoReal: "True grade", coincide: "matches", noCoincide: "does not match",
      gradoICDR: "ICDR grade", grado: "Grade", probabilidad: "probability", probPorGrado: "Probability by grade",
      escalaSeveridad: "Severity scale", gradoEsperado: "Expected grade", aviso: "Research tool: not a medical diagnosis.",
      otra: "Analyze another image", verMapas: "Attention maps ↓", tiempos: (a, b) => `${a} s + ${b} s · in your browser`,
      entrada: "Input", recorte: "Crop + CLAHE", preprocesada: "Preprocessed fundus image",
      mapaDe: (e, s) => `Attention map of expert ${e} (${s})`, mayor: "Highest", intervencion: "Gate",
      notaGuardado: mb => `The demo uses one of the five models in the ensemble. The model (${mb} MB) is saved in this browser, so the analysis does not download it again.`,
      notaNuevo: mb => `The demo uses one of the five models in the ensemble. The first time, it downloads the model (${mb} MB) and keeps it in this browser for later visits.`,
      ejemploAria: (g, n) => `Example with true grade ${g}: ${n}`, noEjemplo: "The example could not be loaded.",
      noImagen: "The file is not an image (use JPG, PNG, WebP, or BMP).", noConfig: "The model configuration could not be loaded.",
      sinWasm: "This browser does not support WebAssembly, which is needed to run the model.",
      avisos: {
        pequena: a => `The image is small (${a.ancho}×${a.alto} px); the model was trained on higher-resolution fundus images.`,
        oscura: () => "The image is very dark; check the exposure of the fundus photograph.",
        color: () => "Unusual coloring for a color fundus photograph (not reddish): the result is less reliable and, if the image is not a fundus photograph, it is not valid.",
        forma: () => "After cropping the black borders, the image is not roughly circular (is it really a fundus photograph?)."
      }
    },
    es: {
      nombres: null, cortos: null, // se usan los de modelo/info.json
      sinAnalisis: "Sin análisis", sinAnalisisTexto: "Suba una retinografía o elija un ejemplo.", escala: "Escala ICDR",
      descargar: "Descargar el modelo",
      descargarTexto: mb => `Para analizar la imagen, su navegador descargará el modelo (${mb} MB) una sola vez. Después queda guardado y el análisis ya no usa la red.`,
      descargarBoton: "Descargar el modelo y analizar", wifi: "Se recomienda una conexión wifi. La imagen no se envía a ningún servidor.",
      progresoAria: "Descarga del modelo", descargando: "Descargando el modelo…", cargandoGuardado: "Cargando el modelo guardado…",
      preparando: "Preparando el modelo…", analizando: "Analizando…", deMB: (a, b) => `${a} de ${b} MB`,
      errorInesperado: "Ocurrió un error inesperado.",
      sinMemoria: "El navegador se quedó sin memoria al cargar el modelo. Cierre otras pestañas o pruebe en una computadora.",
      noSePudo: "No se pudo completar el análisis", reintentar: "Intentar de nuevo",
      cribado: "Cribado", referible: "RD referible", noReferible: "No referible", moderadaOMas: "≥ moderada", menosModerada: "< moderada",
      calidad: "Calidad de imagen", revisar: "Revisar", adecuada: "Adecuada", gradoReal: "Grado real", coincide: "coincide", noCoincide: "no coincide",
      gradoICDR: "Grado ICDR", grado: "Grado", probabilidad: "probabilidad", probPorGrado: "Probabilidad por grado",
      escalaSeveridad: "Escala de severidad", gradoEsperado: "Grado esperado", aviso: "Herramienta de investigación: no es un diagnóstico médico.",
      otra: "Analizar otra imagen", verMapas: "Mapas de atención ↓", tiempos: (a, b) => `${a} s + ${b} s · en su navegador`,
      entrada: "Entrada", recorte: "Recorte + CLAHE", preprocesada: "Retinografía preprocesada",
      mapaDe: (e, s) => `Mapa de atención del experto ${e} (${s})`, mayor: "Mayor", intervencion: "Intervención",
      notaGuardado: mb => `La demostración usa uno de los cinco modelos del ensamble. El modelo (${mb} MB) está guardado en este navegador, así que el análisis no vuelve a descargarlo.`,
      notaNuevo: mb => `La demostración usa uno de los cinco modelos del ensamble. La primera vez descarga el modelo (${mb} MB) y lo guarda en este navegador para las siguientes visitas.`,
      ejemploAria: (g, n) => `Ejemplo con grado real ${g}: ${n}`, noEjemplo: "No se pudo cargar el ejemplo.",
      noImagen: "El archivo no es una imagen (use JPG, PNG, WebP o BMP).", noConfig: "No se pudo cargar la configuración del modelo.",
      sinWasm: "Este navegador no admite WebAssembly, necesario para ejecutar el modelo.",
      avisos: {
        pequena: a => `La imagen es pequeña (${a.ancho}×${a.alto} px); el modelo se entrenó con retinografías de mayor resolución.`,
        oscura: () => "La imagen es muy oscura; revise la exposición de la retinografía.",
        color: () => "Coloración atípica para una retinografía en color (poco rojiza): el resultado es menos fiable y, si la imagen no es un fondo de ojo, no es válido.",
        forma: () => "Tras recortar los bordes negros la imagen no es aproximadamente circular (¿es realmente un fondo de ojo?)."
      }
    }
  };
  const T = TEXTOS[ES ? "es" : "en"];
  const nombres = () => T.nombres || cfg.class_names;
  const cortos = () => T.cortos || cfg.class_short;
  const textoAviso = a => (T.avisos[a.codigo] ? T.avisos[a.codigo](a) : String(a.codigo || a));

  // En pantallas angostas el resultado queda debajo de la imagen: se lleva a la vista
  const mostrarPanel = () => {
    if (window.matchMedia("(max-width: 960px)").matches) $("resultado").closest(".demo-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  };

  let cfg = null, sesion = null, cargando = null, permitido = false, guardado = false;
  let turno = 0, pendiente = null, urlVista = null, tamMB = 268;
  let cola = Promise.resolve();
  const enCola = fn => { const p = cola.then(fn, fn); cola = p.catch(() => {}); return p; };

  const insignia = (g, clase = "") =>
    `<span class="grado ${clase}" style="--c:${COLORES[g]};--t:${TINTA[g]}">${g}</span>`;

  // ------------------------------------------------------------------ estados del panel de resultado
  function pintarInicio() {
    $("resultado").innerHTML = `
      <div class="demo-estado"><b>${T.sinAnalisis}</b><p>${T.sinAnalisisTexto}</p></div>
      <h4 class="demo-sub">${T.escala}</h4>
      <ul class="escala-lista">${nombres().map((n, g) => `<li>${insignia(g)}<span>${esc(n)}</span></li>`).join("")}</ul>`;
  }

  function pintarPedir() {
    $("resultado").innerHTML = `
      <div class="demo-estado">
        <b>${T.descargar}</b>
        <p>${T.descargarTexto(tamMB)}</p>
        <button type="button" class="btn prim" id="descargar">${T.descargarBoton}</button>
        <small>${T.wifi}</small>
      </div>`;
    $("descargar").addEventListener("click", () => { permitido = true; if (pendiente) analizar(pendiente); });
    mostrarPanel();
  }

  function pintarProgreso(titulo, conBarra) {
    $("resultado").innerHTML = `
      <div class="demo-estado">
        <b id="progreso-titulo">${titulo}</b>
        ${conBarra
          ? `<div class="progreso" role="progressbar" aria-label="${T.progresoAria}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="progreso-barra"></i></div><small id="progreso-texto">&nbsp;</small>`
          : `<div class="girando" aria-hidden="true"></div>`}
      </div>`;
  }

  let ultimoPct = -1;
  function actualizarProgreso(hecho, total, red) {
    const barra = $("progreso-barra");
    if (!barra) return;
    const p = Math.floor(100 * hecho / total);
    if (p === ultimoPct) return;
    ultimoPct = p;
    barra.style.width = p + "%";
    barra.parentElement.setAttribute("aria-valuenow", p);
    $("progreso-titulo").textContent = red ? T.descargando : T.cargandoGuardado;
    $("progreso-texto").textContent = T.deMB(Math.round(hecho / 1e6), Math.round(total / 1e6));
  }

  function pintarError(e) {
    console.error(e);
    let texto = (e && e.message) || T.errorInesperado;
    if (/memory|memoria|allocation|RangeError/i.test(String(e))) texto = T.sinMemoria;
    $("resultado").innerHTML = `
      <div class="demo-estado error"><b>${T.noSePudo}</b><p>${esc(texto)}</p>
        <button type="button" class="btn claro" id="reintentar">${T.reintentar}</button></div>`;
    $("reintentar").addEventListener("click", () => (pendiente ? analizar(pendiente) : pintarInicio()));
  }

  function pintarResultado(res, pre, sel, tPre, tInf) {
    const p = res.p, N = nombres(), C = cortos();
    const g = p.indexOf(Math.max(...p));
    const referible = p[2] + p[3] + p[4];
    const esperado = p.reduce((s, v, k) => s + k * v, 0);
    const icono = (tipo, s) => `<span class="icono ${tipo}" aria-hidden="true">${s}</span>`;
    const filas = [
      [T.cribado, referible >= 0.5
        ? `${icono("grave", "!")}<b>${T.referible}</b><small>${T.moderadaOMas} · ${pct(referible, 0)}</small>`
        : `${icono("bien", "✓")}<b>${T.noReferible}</b><small>${esc(T.menosModerada)} · ${pct(1 - referible, 0)}</small>`],
      [T.calidad, pre.avisos.length ? `${icono("aviso", "!")}<b>${T.revisar}</b>` : `${icono("bien", "✓")}<b>${T.adecuada}</b>`],
    ];
    if (sel.grado != null) {
      const ok = sel.grado === g;
      filas.push([T.gradoReal, `${icono(ok ? "bien" : "mal", ok ? "✓" : "✕")}<b>${sel.grado} · ${esc(C[sel.grado])}</b><small>${ok ? T.coincide : T.noCoincide}</small>`]);
    }
    $("resultado").innerHTML = `
      <div class="grado-tarjeta">${insignia(g, "grande")}
        <div><small>${T.gradoICDR}</small><b>${esc(N[g])}</b><span>${T.grado} ${g} · ${T.probabilidad} ${pct(p[g])}</span></div></div>
      <dl class="filas">${filas.map(([t, v]) => `<div><dt>${t}</dt><dd>${v}</dd></div>`).join("")}</dl>
      ${pre.avisos.length ? `<ul class="avisos">${pre.avisos.map(a => `<li>${esc(textoAviso(a))}</li>`).join("")}</ul>` : ""}
      <h4 class="demo-sub">${T.probPorGrado}</h4>
      <ul class="barras">${p.map((v, k) => `
        <li class="${k === g ? "elegido" : ""}" title="${esc(N[k])}: ${pct(v)}">
          ${insignia(k)}<span class="nombre">${esc(C[k])}</span>
          <span class="pista"><i style="width:${Math.max(v * 100, 0.8)}%;background:${COLORES[k]}"></i></span>
          <span class="valor">${pct(v)}</span></li>`).join("")}</ul>
      <h4 class="demo-sub">${T.escalaSeveridad}</h4>
      <div class="severidad" title="${T.gradoEsperado}: ${esperado.toFixed(2)}">
        <div class="segmentos">${COLORES.map(c => `<i style="background:${c}"></i>`).join("")}</div>
        <span class="marca" style="left:${((esperado + 0.5) / 5) * 100}%"><b>${esperado.toFixed(2)}</b></span>
        <div class="rotulos">${C.map((s, k) => `<span>${k} · ${esc(s)}</span>`).join("")}</div>
      </div>
      <p class="demo-aviso">${T.aviso}</p>
      <div class="demo-acciones"><label class="btn prim" for="archivo">${T.otra}</label>
        <a class="btn claro" href="#mapas">${T.verMapas}</a></div>`;
    $("tiempos").textContent = T.tiempos(tPre.toFixed(1), tInf.toFixed(1));
  }

  // ------------------------------------------------------------------ mapas de atención
  function lienzo(img, etiqueta) {
    const c = document.createElement("canvas");
    c.width = img.ancho; c.height = img.alto;
    c.setAttribute("role", "img");
    c.setAttribute("aria-label", etiqueta);
    const ctx = c.getContext("2d"), datos = ctx.createImageData(img.ancho, img.alto);
    for (let i = 0, j = 0; i < img.ancho * img.alto; i++, j += 3) {
      datos.data[4 * i] = img.datos[j]; datos.data[4 * i + 1] = img.datos[j + 1];
      datos.data[4 * i + 2] = img.datos[j + 2]; datos.data[4 * i + 3] = 255;
    }
    ctx.putImageData(datos, 0, 0);
    return c;
  }

  function mapa(img, titulo, sub, compuerta, mayor) {
    const fig = document.createElement("figure");
    fig.className = "mapa" + (mayor ? " mayor" : "");
    fig.append(lienzo(img, compuerta == null ? T.preprocesada : T.mapaDe(titulo, sub)));
    const pie = document.createElement("figcaption");
    pie.innerHTML = `<div><b>${titulo}</b>${mayor ? `<span class="sello-mayor">${T.mayor}</span>` : ""}</div><small>${esc(sub)}</small>` +
      (compuerta == null ? "" : `<span class="compuerta"><i style="width:${(compuerta * 100).toFixed(1)}%"></i></span><small>${T.intervencion} ${compuerta.toFixed(2)}</small>`);
    fig.append(pie);
    return fig;
  }

  function pintarMapas(res, pre) {
    const vista = PRE.redimensionar(pre.mejorada, LADO_VISTA, LADO_VISTA, true);
    const lado = res.ladoMapa, n = lado * lado, max = Math.max(...res.compuertas), C = cortos();
    const lista = $("mapas-lista");
    lista.replaceChildren(mapa(vista, T.entrada, T.recorte, null, false));
    EXPERTOS.forEach(([clave, a, b], k) => {
      const calor = PRE.ampliarBicubico(res.atencion.subarray(k * n, (k + 1) * n), lado, lado, LADO_VISTA, LADO_VISTA);
      const sub = `${C[a]} ↔ ${C[b]}`;
      lista.append(mapa(PRE.superponer(vista, calor, cfg.inferno), clave, sub, res.compuertas[k], res.compuertas[k] === max));
    });
    $("mapas").hidden = false;
  }

  // ------------------------------------------------------------------ imagen seleccionada
  function mostrarVista(sel) {
    if (urlVista) URL.revokeObjectURL(urlVista);
    urlVista = URL.createObjectURL(sel.blob);
    $("vista-img").src = urlVista;
    $("vista-nombre").textContent = sel.nombre;
    $("vista-datos").textContent = `${(sel.blob.size / 1048576).toFixed(1)} MB`;
    $("zona").hidden = true;
    $("vista").hidden = false;
    document.querySelectorAll("#ejemplos button").forEach(b => b.classList.toggle("activo", b.dataset.archivo === sel.archivo));
  }

  // ------------------------------------------------------------------ modelo
  function asegurarModelo() {
    if (sesion) return Promise.resolve(sesion);
    if (!cargando) {
      ultimoPct = -1;
      pintarProgreso(guardado ? T.cargandoGuardado : T.descargando, true);
      cargando = MOD.cargarModelo(BASE_MODELO, actualizarProgreso, () => pintarProgreso(T.preparando, false))
        .then(async r => {
          sesion = r.sesion;
          guardado = await MOD.modeloGuardado(BASE_MODELO);
          actualizarNota();
          return sesion;
        })
        .catch(e => { cargando = null; throw e; });
    }
    return cargando;
  }

  async function analizar(sel) {
    const mio = ++turno;
    pendiente = sel;
    mostrarVista(sel);
    $("mapas").hidden = true;
    $("tiempos").textContent = "";
    try {
      if (typeof WebAssembly !== "object") throw new Error(T.sinWasm);
      if (!sesion && !guardado && !permitido) { pintarPedir(); return; }
      await asegurarModelo();
      if (mio !== turno) return;
      pintarProgreso(T.analizando, false);
      await new Promise(r => setTimeout(r, 40));
      await enCola(async () => {
        if (mio !== turno) return;
        const t0 = performance.now();
        const img = await MOD.decodificar(sel.blob);
        $("vista-datos").textContent = `${img.ancho} × ${img.alto} px · ${(sel.blob.size / 1048576).toFixed(1)} MB`;
        const pre = PRE.preprocesar(img, cfg);
        const t1 = performance.now();
        const res = await MOD.ejecutar(sesion, pre.tensor, cfg.image_size);
        const t2 = performance.now();
        if (mio !== turno) return;
        pintarResultado(res, pre, sel, (t1 - t0) / 1000, (t2 - t1) / 1000);
        pintarMapas(res, pre);
        mostrarPanel();
      });
    } catch (e) {
      if (mio === turno) pintarError(e);
    }
  }

  // ------------------------------------------------------------------ nota y ejemplos
  function actualizarNota() {
    $("nota-modelo").textContent = guardado ? T.notaGuardado(tamMB) : T.notaNuevo(tamMB);
    $("borrar").hidden = !guardado;
  }

  function pintarEjemplos() {
    $("ejemplos").innerHTML = cfg.ejemplos.map(e => `
      <button type="button" data-archivo="${esc(e.archivo)}" data-grado="${e.grado}" aria-label="${esc(T.ejemploAria(e.grado, nombres()[e.grado]))}">
        <img src="${esc(e.miniatura)}" alt="" width="200" height="200" loading="lazy">${insignia(e.grado, "chica")}</button>`).join("");
    $("ejemplos").addEventListener("click", async ev => {
      const b = ev.target.closest("button");
      if (!b) return;
      try {
        const r = await fetch(b.dataset.archivo);
        if (!r.ok) throw new Error(T.noEjemplo);
        analizar({ blob: await r.blob(), nombre: b.dataset.archivo.split("/").pop(), archivo: b.dataset.archivo, grado: +b.dataset.grado });
      } catch (e) { pintarError(e); }
    });
  }

  function elegirArchivo(archivo) {
    if (!archivo) return;
    if (!/^image\//.test(archivo.type) && !/\.(png|jpe?g|webp|bmp)$/i.test(archivo.name)) {
      pintarError(new Error(T.noImagen));
      return;
    }
    analizar({ blob: archivo, nombre: archivo.name, archivo: null, grado: null });
  }

  // ------------------------------------------------------------------ inicio
  async function iniciar() {
    try {
      cfg = await (await fetch(BASE_MODELO + "info.json")).json();
    } catch (e) {
      pintarError(new Error(T.noConfig));
      return;
    }
    fetch(BASE_MODELO + "modelo.json").then(r => r.json()).then(m => { tamMB = Math.round(m.bytes / 1e6); actualizarNota(); }).catch(() => {});
    pintarEjemplos();
    pintarInicio();
    $("archivo").addEventListener("change", e => { elegirArchivo(e.target.files[0]); e.target.value = ""; });
    $("cambiar").addEventListener("click", () => $("archivo").click());
    const zona = $("zona").closest(".demo-panel");
    ["dragenter", "dragover"].forEach(t => zona.addEventListener(t, e => { e.preventDefault(); zona.classList.add("arrastrando"); }));
    ["dragleave", "drop"].forEach(t => zona.addEventListener(t, e => { e.preventDefault(); zona.classList.remove("arrastrando"); }));
    zona.addEventListener("drop", e => elegirArchivo(e.dataTransfer.files[0]));
    $("borrar").addEventListener("click", async () => {
      await MOD.borrarModelo();
      guardado = false;
      actualizarNota();
    });
    guardado = await MOD.modeloGuardado(BASE_MODELO);
    actualizarNota();
  }
  iniciar();
})();
