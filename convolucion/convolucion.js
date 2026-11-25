// Filtros convolucionales — © 2026 Fernando Daniel Hernández Gutiérrez
(function () {
  "use strict";
  const es = window.IDIOMA === "es";
  const L = 256;

  const filtros = [
    { es: "Identidad", en: "Identity", k: [0, 0, 0, 0, 1, 0, 0, 0, 0], d: ["Copia la imagen tal cual.", "Copies the image as it is."] },
    { es: "Promedio", en: "Box blur", k: [1, 1, 1, 1, 1, 1, 1, 1, 1].map(v => v / 9), d: ["Promedia los vecinos: suaviza.", "Averages the neighbors: smooths."] },
    { es: "Gaussiano", en: "Gaussian blur", k: [1, 2, 1, 2, 4, 2, 1, 2, 1].map(v => v / 16), d: ["Suaviza dando más peso al centro.", "Smooths with more weight at the center."] },
    { es: "Enfoque", en: "Sharpen", k: [0, -1, 0, -1, 5, -1, 0, -1, 0], d: ["Resalta los detalles finos.", "Enhances fine details."] },
    { es: "Sobel X", en: "Sobel X", k: [-1, 0, 1, -2, 0, 2, -1, 0, 1], d: ["Bordes verticales (cambios de izquierda a derecha).", "Vertical edges (changes from left to right)."] },
    { es: "Sobel Y", en: "Sobel Y", k: [-1, -2, -1, 0, 0, 0, 1, 2, 1], d: ["Bordes horizontales (cambios de arriba a abajo).", "Horizontal edges (changes from top to bottom)."] },
    { es: "Prewitt X", en: "Prewitt X", k: [-1, 0, 1, -1, 0, 1, -1, 0, 1], d: ["Bordes verticales, sin peso extra al centro.", "Vertical edges, without extra weight at the center."] },
    { es: "Prewitt Y", en: "Prewitt Y", k: [-1, -1, -1, 0, 0, 0, 1, 1, 1], d: ["Bordes horizontales, sin peso extra al centro.", "Horizontal edges, without extra weight at the center."] },
    { es: "Scharr X", en: "Scharr X", k: [-3, 0, 3, -10, 0, 10, -3, 0, 3], d: ["Bordes verticales con más precisión en la dirección.", "Vertical edges with more accurate direction."] },
    { es: "Diagonal 45°", en: "Diagonal 45°", k: [0, 1, 2, -1, 0, 1, -2, -1, 0], d: ["Bordes en diagonal ↗.", "Diagonal edges ↗."] },
    { es: "Diagonal 135°", en: "Diagonal 135°", k: [2, 1, 0, 1, 0, -1, 0, -1, -2], d: ["Bordes en diagonal ↖.", "Diagonal edges ↖."] },
    { es: "Laplaciano", en: "Laplacian", k: [0, 1, 0, 1, -4, 1, 0, 1, 0], d: ["Bordes en todas direcciones.", "Edges in every direction."] },
    { es: "Laplaciano 8", en: "Laplacian 8", k: [1, 1, 1, 1, -8, 1, 1, 1, 1], d: ["Bordes en todas direcciones, incluidas las diagonales.", "Edges in every direction, diagonals included."] },
    { es: "Líneas horizontales", en: "Horizontal lines", k: [-1, -1, -1, 2, 2, 2, -1, -1, -1], d: ["Responde a líneas delgadas horizontales.", "Responds to thin horizontal lines."] },
    { es: "Líneas verticales", en: "Vertical lines", k: [-1, 2, -1, -1, 2, -1, -1, 2, -1], d: ["Responde a líneas delgadas verticales.", "Responds to thin vertical lines."] },
    { es: "Relieve", en: "Emboss", k: [-2, -1, 0, -1, 1, 1, 0, 1, 2], d: ["Da efecto de relieve iluminado desde una esquina.", "Gives a relief effect lit from one corner."] }
  ];

  const $ = id => document.getElementById(id);
  let gris = null, ancho = 0, alto = 0, salidas = [];

  function cargar(src) {
    const img = new Image();
    img.onload = () => {
      const f = Math.min(1, L / Math.max(img.width, img.height));
      ancho = Math.max(1, Math.round(img.width * f));
      alto = Math.max(1, Math.round(img.height * f));
      const c = $("entrada");
      c.width = ancho; c.height = alto;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, ancho, alto);
      const px = ctx.getImageData(0, 0, ancho, alto);
      gris = new Float32Array(ancho * alto);
      for (let i = 0; i < gris.length; i++) {
        gris[i] = (0.299 * px.data[4 * i] + 0.587 * px.data[4 * i + 1] + 0.114 * px.data[4 * i + 2]) / 255;
        const g = gris[i] * 255;
        px.data[4 * i] = px.data[4 * i + 1] = px.data[4 * i + 2] = g;
      }
      ctx.putImageData(px, 0, 0);
      $("dato").textContent = `${ancho} × ${alto} px`;
      calcular();
    };
    img.onerror = () => { $("dato").textContent = es ? "No se pudo abrir la imagen." : "The image could not be opened."; };
    img.src = src;
  }

  function convolucion(k) {
    const out = new Float32Array(ancho * alto);
    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        let s = 0;
        for (let j = -1; j <= 1; j++) {
          const yy = y + j;
          if (yy < 0 || yy >= alto) continue;
          for (let i = -1; i <= 1; i++) {
            const xx = x + i;
            if (xx < 0 || xx >= ancho) continue;
            s += k[(j + 1) * 3 + i + 1] * gris[yy * ancho + xx];
          }
        }
        out[y * ancho + x] = s;
      }
    }
    return out;
  }

  function pintar(canvas, mapa) {
    const relu = $("relu").checked;
    const orden = Float32Array.from(mapa, v => (relu ? Math.max(0, v) : Math.abs(v))).sort();
    const lim = Math.max(orden[Math.floor(orden.length * 0.99)], 1e-6);
    canvas.width = ancho; canvas.height = alto;
    const ctx = canvas.getContext("2d");
    const px = ctx.createImageData(ancho, alto);
    for (let i = 0; i < mapa.length; i++) {
      let g;
      if (relu) g = Math.max(0, mapa[i]) / lim * 255;
      else g = (mapa[i] / lim * 0.5 + 0.5) * 255;
      g = Math.min(255, Math.max(0, g));
      px.data[4 * i] = px.data[4 * i + 1] = px.data[4 * i + 2] = g;
      px.data[4 * i + 3] = 255;
    }
    ctx.putImageData(px, 0, 0);
  }

  const numero = v => (Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, "").replace(/^0\./, ".").replace(/^-0\./, "-."));
  const kernel = k => k.map(v => `<span class="${v > 0 ? "pos" : v < 0 ? "neg" : ""}">${numero(v)}</span>`).join("");

  function calcular() {
    if (!gris) return;
    salidas = filtros.map(f => convolucion(f.k));
    const cont = $("mapas");
    cont.innerHTML = "";
    filtros.forEach((f, n) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "conv-mapa";
      const c = document.createElement("canvas");
      pintar(c, salidas[n]);
      b.append(c);
      const pie = document.createElement("span");
      pie.innerHTML = `<b>${n + 1}. ${es ? f.es : f.en}</b><span class="conv-kernel">${kernel(f.k)}</span>`;
      b.append(pie);
      b.addEventListener("click", () => detalle(n));
      cont.append(b);
    });
  }

  function detalle(n) {
    const f = filtros[n];
    $("detalle-titulo").textContent = `${n + 1}. ${es ? f.es : f.en}`;
    pintar($("detalle-mapa"), salidas[n]);
    $("detalle-kernel").innerHTML = kernel(f.k);
    $("detalle-texto").textContent = f.d[es ? 0 : 1];
    $("detalle").showModal();
  }

  $("archivo").addEventListener("change", e => {
    const a = e.target.files[0];
    if (a) cargar(URL.createObjectURL(a));
    e.target.value = "";
  });
  $("ejemplo").addEventListener("click", () => cargar("../assets/img/foto.jpg"));
  $("relu").addEventListener("change", calcular);
  $("detalle").addEventListener("click", e => { if (e.target === $("detalle")) $("detalle").close(); });
  cargar("../assets/img/foto.jpg");
})();
