/* ==========================================================================
   modelo.js — descarga, guarda y ejecuta el modelo SABER-DR en el navegador
   (ONNX Runtime Web, WebAssembly). La imagen nunca sale del equipo.
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function (G) {
  "use strict";
  const ORT_VERSION = "1.22.0";
  const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
  const CACHE_PREFIJO = "saber-dr-modelo-";
  const MAX_PIXELES = 25e6;
  const MAX_BYTES = 25 * 1024 * 1024;

  const hayCache = () => typeof caches !== "undefined" && G.isSecureContext;
  // Mensajes en el idioma de la página (sitio.js define window.IDIOMA; inglés por defecto)
  const m = (es, en) => (G.IDIOMA === "es" ? es : en);

  async function sha256(bytes) {
    const h = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, "0")).join("");
  }

  let promesaORT = null;
  function cargarORT() {
    if (G.ort) return Promise.resolve(G.ort);
    if (!promesaORT) {
      promesaORT = new Promise((ok, mal) => {
        const s = document.createElement("script");
        s.src = ORT_BASE + "ort.wasm.min.js";
        s.crossOrigin = "anonymous";
        s.onload = () => {
          G.ort.env.wasm.wasmPaths = ORT_BASE;
          G.ort.env.wasm.numThreads = 1;
          ok(G.ort);
        };
        s.onerror = () => { promesaORT = null; mal(new Error(m("No se pudo cargar ONNX Runtime Web. Revise su conexión a internet.", "ONNX Runtime Web could not be loaded. Check your internet connection."))); };
        document.head.append(s);
      });
    }
    return promesaORT;
  }

  async function leerManifiesto(base) {
    const r = await fetch(base + "modelo.json", { cache: "no-cache" });
    if (!r.ok) throw new Error(m("No se encontró el modelo en el servidor.", "The model was not found on the server."));
    return r.json();
  }

  /** ¿Están ya todas las partes del modelo guardadas en este navegador? */
  async function modeloGuardado(base) {
    if (!hayCache()) return false;
    try {
      const man = await leerManifiesto(base);
      if (!(await caches.has(CACHE_PREFIJO + man.version))) return false;
      const cache = await caches.open(CACHE_PREFIJO + man.version);
      for (const p of man.partes) {
        if (!(await cache.match(new URL(base + p.archivo, location.href).href))) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Borra todas las copias guardadas del modelo. */
  async function borrarModelo() {
    if (!hayCache()) return;
    for (const k of await caches.keys()) if (k.startsWith(CACHE_PREFIJO)) await caches.delete(k);
  }

  /** Reúne las partes del modelo (de la caché o de la red) y verifica cada descarga. */
  async function obtenerBytes(base, alProgreso) {
    const man = await leerManifiesto(base);
    const nombre = CACHE_PREFIJO + man.version;
    let cache = null;
    if (hayCache()) {
      try {
        for (const k of await caches.keys()) if (k.startsWith(CACHE_PREFIJO) && k !== nombre) await caches.delete(k);
        cache = await caches.open(nombre);
      } catch (e) { cache = null; }
    }
    const todo = new Uint8Array(man.bytes);
    let hecho = 0, desdeRed = 0, offset = 0;
    for (const parte of man.partes) {
      const url = new URL(base + parte.archivo, location.href).href;
      const destino = todo.subarray(offset, offset + parte.bytes);
      let listo = false;
      if (cache) {
        const r = await cache.match(url).catch(() => null);
        if (r) {
          const datos = new Uint8Array(await r.arrayBuffer());
          if (datos.length === parte.bytes) {
            destino.set(datos);
            hecho += parte.bytes;
            alProgreso && alProgreso(hecho, man.bytes, desdeRed > 0);
            listo = true;
          } else {
            await cache.delete(url);
          }
        }
      }
      if (!listo) {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(m("No se pudo descargar el modelo (error ", "The model could not be downloaded (error ") + r.status + ").");
        const lector = r.body.getReader();
        let pos = 0;
        for (;;) {
          const { done, value } = await lector.read();
          if (done) break;
          if (pos + value.length > parte.bytes) throw new Error(m("La descarga del modelo llegó dañada. Inténtelo de nuevo.", "The model download arrived damaged. Please try again."));
          destino.set(value, pos);
          pos += value.length;
          hecho += value.length;
          desdeRed += value.length;
          alProgreso && alProgreso(hecho, man.bytes, true);
        }
        if (pos !== parte.bytes || (await sha256(destino)) !== parte.sha256) {
          throw new Error(m("La descarga del modelo llegó incompleta o dañada. Inténtelo de nuevo.", "The model download arrived incomplete or damaged. Please try again."));
        }
        if (cache) await cache.put(url, new Response(destino.slice())).catch(() => {});
      }
      offset += parte.bytes;
    }
    return { bytes: todo, version: man.version, desdeRed };
  }

  /** Crea la sesión de ONNX Runtime. */
  async function cargarModelo(base, alProgreso, alPreparar) {
    const ort = await cargarORT();
    const { bytes, desdeRed } = await obtenerBytes(base, alProgreso);
    alPreparar && alPreparar();
    await new Promise(r => setTimeout(r, 30));
    const sesion = await ort.InferenceSession.create(bytes, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    return { sesion, desdeRed };
  }

  /** Ejecuta el modelo con un tensor 1x3xSxS. */
  async function ejecutar(sesion, tensor, lado) {
    const ort = G.ort;
    const x = new ort.Tensor("float32", tensor, [1, 3, lado, lado]);
    const out = await sesion.run({ input: x });
    const atencion = out.attention;
    return {
      p: Array.from(out.probabilities.data),
      compuertas: Array.from(out.gates.data),
      atencion: atencion.data,
      ladoMapa: atencion.dims[atencion.dims.length - 1],
    };
  }

  /** Decodifica la imagen como Pillow: sin conversión de color y con la orientación EXIF aplicada. */
  async function decodificar(blob) {
    if (blob.size > MAX_BYTES) throw new Error(m("El archivo pasa de 25 MB.", "The file is larger than 25 MB."));
    let bmp;
    try {
      bmp = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none", imageOrientation: "from-image" });
    } catch (e) {
      try { bmp = await createImageBitmap(blob); } catch (e2) { bmp = null; }
    }
    if (!bmp) {
      bmp = await new Promise((ok, mal) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = () => mal(new Error(m("No se pudo leer el archivo como imagen (use JPG, PNG, WebP o BMP).", "The file could not be read as an image (use JPG, PNG, WebP, or BMP).")));
        img.src = URL.createObjectURL(blob);
      });
    }
    const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
    if (!w || !h) throw new Error(m("No se pudo leer el archivo como imagen (use JPG, PNG, WebP o BMP).", "The file could not be read as an image (use JPG, PNG, WebP, or BMP)."));
    if (w * h > MAX_PIXELES) throw new Error(m(`La imagen es demasiado grande (${w}×${h} px; máximo 25 megapíxeles).`, `The image is too large (${w}×${h} px; maximum 25 megapixels).`));
    if (w < 16 || h < 16) throw new Error(m("La imagen es demasiado pequeña.", "The image is too small."));
    const lienzo = document.createElement("canvas");
    lienzo.width = w; lienzo.height = h;
    const ctx = lienzo.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);
    if (bmp.close) bmp.close();
    const rgba = ctx.getImageData(0, 0, w, h).data;
    const rgb = new Uint8Array(w * h * 3);
    for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) { rgb[j] = rgba[i]; rgb[j + 1] = rgba[i + 1]; rgb[j + 2] = rgba[i + 2]; }
    lienzo.width = lienzo.height = 0;
    return { ancho: w, alto: h, datos: rgb };
  }

  G.SABER_MODELO = { cargarORT, modeloGuardado, borrarModelo, cargarModelo, ejecutar, decodificar, sha256 };
})(window);
