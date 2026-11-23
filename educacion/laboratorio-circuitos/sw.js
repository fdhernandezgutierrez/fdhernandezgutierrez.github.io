/* ==========================================================================
   sw.js — service worker del Laboratorio de Circuitos instalable (PWA).
   Guarda una copia de la app en el dispositivo para que funcione sin internet.

   - Solo controla esta carpeta (/educacion/laboratorio-circuitos/): el resto del sitio no se ve afectado.
   - Primero la red: con conexión siempre se usa la versión publicada más reciente (y se actualiza la copia);
     sin conexión, o si la red tarda más de ESPERA_MS, se usa la copia guardada.
     Por eso no hace falta cambiar nada al publicar una versión nueva de la app.
   - Si la página empieza a cargar un archivo nuevo, agréguelo a ARCHIVOS.
   - VERSION solo se cambia para descartar por completo la copia guardada en los dispositivos.
   - Borra únicamente sus propias copias (prefijo "lab-circuitos-"); no toca las de otras páginas del sitio.

   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
"use strict";

const VERSION = "1";
const PREFIJO = "lab-circuitos-";
const CACHE = PREFIJO + VERSION;
const ESPERA_MS = 5000;
const FUENTES = ["fonts.googleapis.com", "fonts.gstatic.com"];

// Todo lo que carga index.html (rutas relativas a esta carpeta).
const ARCHIVOS = [
  "./",
  "css/lab.css",
  "js/motor.js", "js/esquema.js", "js/problemas.js", "js/dibujo.js", "js/ui.js", "js/graficas.js",
  "js/cap12.js", "js/cap3.js", "js/cap4.js", "js/cap5.js", "js/cap6.js", "js/cap78.js", "js/cap9.js", "js/cap10.js",
  "js/app.js", "js/pwa.js",
  "manifest-en.json", "manifest-es.json",
  "iconos/apple-touch-icon.png", "iconos/icono-192.png", "iconos/icono-512.png", "iconos/icono-maskable-512.png",
  "../../assets/css/estilos.css", "../../assets/img/favicon.svg",
  "../../assets/js/datos.js", "../../assets/js/datos-en.js", "../../assets/js/sitio.js",
];

// La página del laboratorio se guarda siempre como "./": así "?lang=es", "index.html" y "#cap4/…" abren lo mismo sin conexión.
const RAIZ = new URL("./", self.location).pathname;

/** Respuesta sin la marca de redirección (Safari no acepta respuestas redirigidas para abrir una página). */
async function limpia(res) {
  if (!res.redirected) return res;
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
}

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ARCHIVOS.map(async ruta => {
      const res = await fetch(new Request(ruta, { cache: "reload" }));
      if (!res.ok) throw new Error(`No se pudo guardar ${ruta}: ${res.status}`);
      await cache.put(ruta, await limpia(res));
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter(n => n.startsWith(PREFIJO) && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !FUENTES.includes(url.hostname)) return; // otros sitios: sin intervenir

  const inicio = req.mode === "navigate" && (url.pathname === RAIZ || url.pathname === RAIZ + "index.html");
  const clave = inicio ? "./" : req;

  const red = fetch(req);
  // Con conexión, la copia guardada se actualiza con lo que llegó de la red.
  e.waitUntil(red.then(res => {
    if (!(res.ok || res.type === "opaque")) return;
    const copia = res.clone();
    return caches.open(CACHE).then(async c => c.put(clave, await limpia(copia)));
  }).catch(() => { /* sin conexión: nada que actualizar */ }));

  e.respondWith((async () => {
    const guardada = await (await caches.open(CACHE)).match(clave);
    if (!guardada) return red; // nunca guardado: solo la red
    const util = red.then(res => (res.ok || res.type === "opaque" ? res : guardada), () => guardada);
    const espera = new Promise(r => setTimeout(() => r(guardada), ESPERA_MS));
    return Promise.race([util, espera]);
  })());
});
