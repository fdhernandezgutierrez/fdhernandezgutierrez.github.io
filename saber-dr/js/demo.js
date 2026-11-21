/* ==========================================================================
   demo.js — demostración de SABER-DR en el navegador: carga de la imagen,
   descarga del modelo con permiso del visitante, análisis y resultados.
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function () {
  "use strict";
  const PRE = window.SABER_PRE, MOD = window.SABER_MODELO;
  const BASE_MODELO = "modelo/";
  // Escala ordinal de un solo tono (claro -> oscuro) para los grados 0-4; texto legible sobre cada uno
  const COLORES = ["#86b6ef", "#3987e5", "#256abf", "#184f95", "#0d366b"];
  const TINTA = ["#0d366b", "#fff", "#fff", "#fff", "#fff"];
  const EXPERTOS = [["E01", 0, 1], ["E12", 1, 2], ["E23", 2, 3], ["E34", 3, 4]];
  const LADO_VISTA = 320;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (v, d = 1) => (v * 100).toFixed(d) + " %";
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
      <div class="demo-estado"><b>Sin análisis</b><p>Suba una retinografía o elija un ejemplo.</p></div>
      <h4 class="demo-sub">Escala ICDR</h4>
      <ul class="escala-lista">${cfg.class_names.map((n, g) => `<li>${insignia(g)}<span>${esc(n)}</span></li>`).join("")}</ul>`;
  }

  function pintarPedir() {
    $("resultado").innerHTML = `
      <div class="demo-estado">
        <b>Descargar el modelo</b>
        <p>Para analizar la imagen, su navegador descargará el modelo (${tamMB} MB) una sola vez. Después queda guardado y el análisis ya no usa la red.</p>
        <button type="button" class="btn prim" id="descargar">Descargar el modelo y analizar</button>
        <small>Se recomienda una conexión wifi. La imagen no se envía a ningún servidor.</small>
      </div>`;
    $("descargar").addEventListener("click", () => { permitido = true; if (pendiente) analizar(pendiente); });
    mostrarPanel();
  }

  function pintarProgreso(titulo, conBarra) {
    $("resultado").innerHTML = `
      <div class="demo-estado">
        <b id="progreso-titulo">${titulo}</b>
        ${conBarra
          ? `<div class="progreso" role="progressbar" aria-label="Descarga del modelo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="progreso-barra"></i></div><small id="progreso-texto">&nbsp;</small>`
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
    $("progreso-titulo").textContent = red ? "Descargando el modelo…" : "Cargando el modelo guardado…";
    $("progreso-texto").textContent = `${Math.round(hecho / 1e6)} de ${Math.round(total / 1e6)} MB`;
  }

  function pintarError(e) {
    console.error(e);
    let texto = (e && e.message) || "Ocurrió un error inesperado.";
    if (/memory|memoria|allocation|RangeError/i.test(String(e))) {
      texto = "El navegador se quedó sin memoria al cargar el modelo. Cierre otras pestañas o pruebe en una computadora.";
    }
    $("resultado").innerHTML = `
      <div class="demo-estado error"><b>No se pudo completar el análisis</b><p>${esc(texto)}</p>
        <button type="button" class="btn claro" id="reintentar">Intentar de nuevo</button></div>`;
    $("reintentar").addEventListener("click", () => (pendiente ? analizar(pendiente) : pintarInicio()));
  }

  function pintarResultado(res, pre, sel, tPre, tInf) {
    const p = res.p, nombres = cfg.class_names, cortos = cfg.class_short;
    const g = p.indexOf(Math.max(...p));
    const referible = p[2] + p[3] + p[4];
    const esperado = p.reduce((s, v, k) => s + k * v, 0);
    const icono = (tipo, s) => `<span class="icono ${tipo}" aria-hidden="true">${s}</span>`;
    const filas = [
      ["Cribado", referible >= 0.5
        ? `${icono("grave", "!")}<b>RD referible</b><small>≥ moderada · ${pct(referible, 0)}</small>`
        : `${icono("bien", "✓")}<b>No referible</b><small>&lt; moderada · ${pct(1 - referible, 0)}</small>`],
      ["Calidad de imagen", pre.avisos.length ? `${icono("aviso", "!")}<b>Revisar</b>` : `${icono("bien", "✓")}<b>Adecuada</b>`],
    ];
    if (sel.grado != null) {
      const ok = sel.grado === g;
      filas.push(["Grado real", `${icono(ok ? "bien" : "mal", ok ? "✓" : "✕")}<b>${sel.grado} · ${esc(cortos[sel.grado])}</b><small>${ok ? "coincide" : "no coincide"}</small>`]);
    }
    $("resultado").innerHTML = `
      <div class="grado-tarjeta">${insignia(g, "grande")}
        <div><small>Grado ICDR</small><b>${esc(nombres[g])}</b><span>Grado ${g} · probabilidad ${pct(p[g])}</span></div></div>
      <dl class="filas">${filas.map(([t, v]) => `<div><dt>${t}</dt><dd>${v}</dd></div>`).join("")}</dl>
      ${pre.avisos.length ? `<ul class="avisos">${pre.avisos.map(a => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
      <h4 class="demo-sub">Probabilidad por grado</h4>
      <ul class="barras">${p.map((v, k) => `
        <li class="${k === g ? "elegido" : ""}" title="${esc(nombres[k])}: ${pct(v)}">
          ${insignia(k)}<span class="nombre">${esc(cortos[k])}</span>
          <span class="pista"><i style="width:${Math.max(v * 100, 0.8)}%;background:${COLORES[k]}"></i></span>
          <span class="valor">${pct(v)}</span></li>`).join("")}</ul>
      <h4 class="demo-sub">Escala de severidad</h4>
      <div class="severidad" title="Grado esperado: ${esperado.toFixed(2)}">
        <div class="segmentos">${COLORES.map(c => `<i style="background:${c}"></i>`).join("")}</div>
        <span class="marca" style="left:${((esperado + 0.5) / 5) * 100}%"><b>${esperado.toFixed(2)}</b></span>
        <div class="rotulos">${cortos.map((s, k) => `<span>${k} · ${esc(s)}</span>`).join("")}</div>
      </div>
      <p class="demo-aviso">Herramienta de investigación: no es un diagnóstico médico.</p>
      <div class="demo-acciones"><label class="btn prim" for="archivo">Analizar otra imagen</label>
        <a class="btn claro" href="#mapas">Mapas de atención ↓</a></div>`;
    $("tiempos").textContent = `${tPre.toFixed(1)} s + ${tInf.toFixed(1)} s · en su navegador`;
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
    fig.append(lienzo(img, compuerta == null ? "Retinografía preprocesada" : `Mapa de atención del experto ${titulo} (${sub})`));
    const pie = document.createElement("figcaption");
    pie.innerHTML = `<div><b>${titulo}</b>${mayor ? '<span class="sello-mayor">Mayor</span>' : ""}</div><small>${esc(sub)}</small>` +
      (compuerta == null ? "" : `<span class="compuerta"><i style="width:${(compuerta * 100).toFixed(1)}%"></i></span><small>Intervención ${compuerta.toFixed(2)}</small>`);
    fig.append(pie);
    return fig;
  }

  function pintarMapas(res, pre) {
    const vista = PRE.redimensionar(pre.mejorada, LADO_VISTA, LADO_VISTA, true);
    const lado = res.ladoMapa, n = lado * lado, max = Math.max(...res.compuertas);
    const lista = $("mapas-lista");
    lista.replaceChildren(mapa(vista, "Entrada", "Recorte + CLAHE", null, false));
    EXPERTOS.forEach(([clave, a, b], k) => {
      const calor = PRE.ampliarBicubico(res.atencion.subarray(k * n, (k + 1) * n), lado, lado, LADO_VISTA, LADO_VISTA);
      const sub = `${cfg.class_short[a]} ↔ ${cfg.class_short[b]}`;
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
      pintarProgreso(guardado ? "Cargando el modelo guardado…" : "Descargando el modelo…", true);
      cargando = MOD.cargarModelo(BASE_MODELO, actualizarProgreso, () => pintarProgreso("Preparando el modelo…", false))
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
      if (typeof WebAssembly !== "object") throw new Error("Este navegador no admite WebAssembly, necesario para ejecutar el modelo.");
      if (!sesion && !guardado && !permitido) { pintarPedir(); return; }
      await asegurarModelo();
      if (mio !== turno) return;
      pintarProgreso("Analizando…", false);
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
    $("nota-modelo").textContent = guardado
      ? `La demostración usa uno de los cinco modelos del ensamble. El modelo (${tamMB} MB) está guardado en este navegador, así que el análisis no vuelve a descargarlo.`
      : `La demostración usa uno de los cinco modelos del ensamble. La primera vez descarga el modelo (${tamMB} MB) y lo guarda en este navegador para las siguientes visitas.`;
    $("borrar").hidden = !guardado;
  }

  function pintarEjemplos() {
    $("ejemplos").innerHTML = cfg.ejemplos.map(e => `
      <button type="button" data-archivo="${esc(e.archivo)}" data-grado="${e.grado}" aria-label="Ejemplo con grado real ${e.grado}: ${esc(cfg.class_names[e.grado])}">
        <img src="${esc(e.miniatura)}" alt="" width="200" height="200" loading="lazy">${insignia(e.grado, "chica")}</button>`).join("");
    $("ejemplos").addEventListener("click", async ev => {
      const b = ev.target.closest("button");
      if (!b) return;
      try {
        const r = await fetch(b.dataset.archivo);
        if (!r.ok) throw new Error("No se pudo cargar el ejemplo.");
        analizar({ blob: await r.blob(), nombre: b.dataset.archivo.split("/").pop(), archivo: b.dataset.archivo, grado: +b.dataset.grado });
      } catch (e) { pintarError(e); }
    });
  }

  function elegirArchivo(archivo) {
    if (!archivo) return;
    if (!/^image\//.test(archivo.type) && !/\.(png|jpe?g|webp|bmp)$/i.test(archivo.name)) {
      pintarError(new Error("El archivo no es una imagen (use JPG, PNG, WebP o BMP)."));
      return;
    }
    analizar({ blob: archivo, nombre: archivo.name, archivo: null, grado: null });
  }

  // ------------------------------------------------------------------ inicio
  async function iniciar() {
    try {
      cfg = await (await fetch(BASE_MODELO + "info.json")).json();
    } catch (e) {
      pintarError(new Error("No se pudo cargar la configuración del modelo."));
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
