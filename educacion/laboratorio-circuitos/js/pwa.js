/* ==========================================================================
   pwa.js — el laboratorio como app instalable (PWA).
   - Registra el service worker (sw.js), que guarda la app para usarla sin internet.
   - Usa el manifiesto del idioma de la página: la app instalada abre en ese idioma.
   - Muestra cómo instalarla: en iPhone/iPad, los pasos de Safari; en Android y en
     computadoras con Chrome o Edge, un botón «Instalar». No aparece si la app ya
     está instalada o si el visitante la cerró.
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function () {
  "use strict";
  const es = window.IDIOMA === "es";

  const manifiesto = document.querySelector('link[rel="manifest"]');
  if (manifiesto && es) manifiesto.setAttribute("href", "manifest-es.json");
  const titulo = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (titulo && es) titulo.setAttribute("content", "Circuitos");

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { /* sin service worker: la página funciona igual, solo con internet */ }));
  }

  /* ---------------- Aviso para instalar ---------------- */
  const CLAVE = "lab-instalar-oculto";
  const instalada = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  let cerrado = false;
  try { cerrado = localStorage.getItem(CLAVE) === "1"; } catch (e) { /* modo privado */ }
  const cabecera = document.querySelector(".cabecera-pagina .ancho");
  if (instalada || cerrado || !cabecera) return;

  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  const COMPARTIR = '<svg class="lab-instalar-compartir" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16"/></svg>';
  const T = es ? {
    region: "Instalar el laboratorio",
    titulo: "Instala el laboratorio como app",
    texto: "Se abre desde su propio ícono y funciona sin internet.",
    instalar: "Instalar",
    como: "¿Cómo?",
    cerrar: "No volver a mostrar",
    pasos: [
      `Toca el botón <b>Compartir</b> ${COMPARTIR}. En Safari está en la barra de abajo o dentro del botón <b>⋯</b>; en Chrome, arriba a la derecha.`,
      "Elige <b>Agregar a inicio</b> (en algunos iPhone dice <b>Añadir a pantalla de inicio</b>) y toca <b>Agregar</b>.",
      "Abre la app una vez con internet. Después funciona sin conexión.",
    ],
  } : {
    region: "Install the lab",
    titulo: "Install the lab as an app",
    texto: "It opens from its own icon and works without internet.",
    instalar: "Install",
    como: "How?",
    cerrar: "Don't show again",
    pasos: [
      `Tap the <b>Share</b> button ${COMPARTIR}. In Safari it is in the bottom bar or inside the <b>⋯</b> button; in Chrome, at the top right.`,
      "Choose <b>Add to Home Screen</b> and tap <b>Add</b>.",
      "Open the app once while online. After that it works offline.",
    ],
  };

  let aviso = null;
  function mostrar(accion) {
    if (aviso) return;
    aviso = document.createElement("div");
    aviso.className = "lab-instalar";
    aviso.setAttribute("role", "region");
    aviso.setAttribute("aria-label", T.region);
    aviso.innerHTML =
      '<img class="lab-instalar-icono" src="iconos/icono-192.png" alt="" width="44" height="44">' +
      `<div class="lab-instalar-texto"><b>${T.titulo}</b><span>${T.texto}</span></div>` +
      `<button type="button" class="lab-instalar-accion">${ios ? T.como : T.instalar}</button>` +
      `<button type="button" class="lab-instalar-cerrar" aria-label="${T.cerrar}" title="${T.cerrar}">×</button>` +
      (ios ? `<ol class="lab-instalar-pasos" id="lab-instalar-pasos" hidden>${T.pasos.map(p => `<li>${p}</li>`).join("")}</ol>` : "");
    const boton = aviso.querySelector(".lab-instalar-accion");
    if (ios) boton.setAttribute("aria-controls", "lab-instalar-pasos"), boton.setAttribute("aria-expanded", "false");
    boton.addEventListener("click", accion);
    aviso.querySelector(".lab-instalar-cerrar").addEventListener("click", () => {
      try { localStorage.setItem(CLAVE, "1"); } catch (e) { /* modo privado: solo se oculta ahora */ }
      quitar();
    });
    cabecera.appendChild(aviso);
  }
  function quitar() { if (aviso) aviso.remove(); aviso = null; }

  if (ios) {
    // Safari no tiene botón de instalar: se explican los pasos.
    mostrar(function () {
      const pasos = aviso.querySelector(".lab-instalar-pasos");
      pasos.hidden = !pasos.hidden;
      this.setAttribute("aria-expanded", String(!pasos.hidden));
    });
  } else {
    // Chrome, Edge y Samsung Internet avisan cuando la app se puede instalar.
    let pedido = null;
    addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      pedido = e;
      mostrar(async () => {
        if (!pedido) return;
        pedido.prompt();
        await pedido.userChoice;
        pedido = null; // el aviso del navegador solo se puede abrir una vez por visita
        quitar();
      });
    });
    addEventListener("appinstalled", quitar);
  }
})();
