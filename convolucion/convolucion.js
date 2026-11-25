// Filtros convolucionales — © 2026 Fernando Daniel Hernández Gutiérrez
(function () {
  "use strict";
  const es = window.IDIOMA === "es";
  const L = 256;

  const filtros3 = [
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

  const kernel5 = f => { const k = []; for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) k.push(f(x, y)); return k; };
  const exterior = (a, b) => kernel5((x, y) => a[y] * b[x]);
  const g5 = [1, 4, 6, 4, 1], d5 = [-1, -2, 0, 2, 1], u5 = [1, 1, 1, 1, 1], p5 = [-2, -1, 0, 1, 2];
  const gauss5 = exterior(g5, g5).map(v => v / 256);

  const filtros5 = [
    { es: "Identidad", en: "Identity", k: kernel5((x, y) => (x === 2 && y === 2 ? 1 : 0)), d: ["Copia la imagen tal cual.", "Copies the image as it is."] },
    { es: "Promedio", en: "Box blur", k: kernel5(() => 1 / 25), d: ["Promedia 25 vecinos: suaviza más que el de 3×3.", "Averages 25 neighbors: smooths more than the 3×3 one."] },
    { es: "Gaussiano", en: "Gaussian blur", k: gauss5, d: ["Suavizado gaussiano más amplio.", "Wider Gaussian smoothing."] },
    { es: "Enfoque", en: "Sharpen", k: gauss5.map((v, i) => (i === 12 ? 2 : 0) - v), d: ["Imagen menos su versión suavizada: realza bordes y texturas.", "Image minus its smoothed version: boosts edges and textures."] },
    { es: "Sobel X", en: "Sobel X", k: exterior(g5, d5), d: ["Bordes verticales, con menos ruido que el de 3×3.", "Vertical edges, with less noise than the 3×3 one."] },
    { es: "Sobel Y", en: "Sobel Y", k: exterior(d5, g5), d: ["Bordes horizontales, con menos ruido que el de 3×3.", "Horizontal edges, with less noise than the 3×3 one."] },
    { es: "Prewitt X", en: "Prewitt X", k: exterior(u5, p5), d: ["Bordes verticales en una franja más ancha.", "Vertical edges over a wider band."] },
    { es: "Prewitt Y", en: "Prewitt Y", k: exterior(p5, u5), d: ["Bordes horizontales en una franja más ancha.", "Horizontal edges over a wider band."] },
    { es: "Diagonal 45°", en: "Diagonal 45°", k: kernel5((x, y) => x - y), d: ["Bordes en diagonal ↗.", "Diagonal edges ↗."] },
    { es: "Diagonal 135°", en: "Diagonal 135°", k: kernel5((x, y) => 4 - x - y), d: ["Bordes en diagonal ↖.", "Diagonal edges ↖."] },
    { es: "Laplaciano", en: "Laplacian", k: kernel5((x, y) => (x === 2 && y === 2 ? 24 : -1)), d: ["Bordes en todas direcciones.", "Edges in every direction."] },
    { es: "Sombrero mexicano (LoG)", en: "Mexican hat (LoG)", k: [0, 0, -1, 0, 0, 0, -1, -2, -1, 0, -1, -2, 16, -2, -1, 0, -1, -2, -1, 0, 0, 0, -1, 0, 0], d: ["Laplaciano de gaussiana: bordes y manchas, con menos ruido.", "Laplacian of Gaussian: edges and blobs, with less noise."] },
    { es: "Líneas horizontales", en: "Horizontal lines", k: kernel5((x, y) => (y === 2 ? 4 : -1)), d: ["Responde a líneas horizontales.", "Responds to horizontal lines."] },
    { es: "Líneas verticales", en: "Vertical lines", k: kernel5(x => (x === 2 ? 4 : -1)), d: ["Responde a líneas verticales.", "Responds to vertical lines."] },
    { es: "Relieve", en: "Emboss", k: kernel5((x, y) => (x === 2 && y === 2 ? 1 : 0) + (x + y - 4) / 2), d: ["Relieve iluminado desde una esquina.", "Relief lit from one corner."] },
    { es: "Movimiento", en: "Motion blur", k: kernel5((x, y) => (x === y ? 1 / 5 : 0)), d: ["Desenfoque en diagonal, como una foto movida.", "Diagonal blur, like a shaken photo."] }
  ];

  const activaciones = {
    ninguna: v => v,
    relu: v => Math.max(0, v),
    gelu: v => 0.5 * v * (1 + Math.tanh(0.7978845608 * (v + 0.044715 * v * v * v)))
  };

  const $ = id => document.getElementById(id);
  let gris = null, ancho = 0, alto = 0, salidas = [], n = 3;
  const filtros = () => (n === 3 ? filtros3 : filtros5);
  const activacion = () => document.querySelector("input[name=activacion]:checked").value;

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
    const r = (n - 1) / 2;
    const out = new Float32Array(ancho * alto);
    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        let s = 0;
        for (let j = -r; j <= r; j++) {
          const yy = y + j;
          if (yy < 0 || yy >= alto) continue;
          for (let i = -r; i <= r; i++) {
            const xx = x + i;
            if (xx < 0 || xx >= ancho) continue;
            s += k[(j + r) * n + i + r] * gris[yy * ancho + xx];
          }
        }
        out[y * ancho + x] = s;
      }
    }
    return out;
  }

  // Ninguna: gris medio = 0. ReLU y GELU: negro = el valor más bajo.
  function pintar(canvas, mapa) {
    const tipo = activacion();
    const act = activaciones[tipo];
    const v = Float32Array.from(mapa, act);
    let lo, hi;
    if (tipo === "ninguna") {
      const orden = Float32Array.from(v, Math.abs).sort();
      hi = Math.max(orden[Math.floor(orden.length * 0.99)], 1e-6);
      lo = -hi;
    } else {
      const orden = Float32Array.from(v).sort();
      lo = Math.min(0, orden[0]);
      hi = Math.max(orden[Math.floor(orden.length * 0.99)], lo + 1e-6);
    }
    canvas.width = ancho; canvas.height = alto;
    const ctx = canvas.getContext("2d");
    const px = ctx.createImageData(ancho, alto);
    for (let i = 0; i < v.length; i++) {
      const g = Math.min(255, Math.max(0, (v[i] - lo) / (hi - lo) * 255));
      px.data[4 * i] = px.data[4 * i + 1] = px.data[4 * i + 2] = g;
      px.data[4 * i + 3] = 255;
    }
    ctx.putImageData(px, 0, 0);
  }

  const numero = v => (Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, "").replace(/^0\./, ".").replace(/^-0\./, "-."));
  const kernel = k => k.map(v => `<span class="${v > 0 ? "pos" : v < 0 ? "neg" : ""}">${numero(v)}</span>`).join("");

  function calcular() {
    if (!gris) return;
    $("capa").textContent = `Conv2D · 1 → 16 · ${n}×${n} · stride 1 · padding ${(n - 1) / 2} · ${{ ninguna: es ? "sin activación" : "no activation", relu: "ReLU", gelu: "GELU" }[activacion()]}`;
    salidas = filtros().map(f => convolucion(f.k));
    const cont = $("mapas");
    cont.innerHTML = "";
    filtros().forEach((f, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "conv-mapa";
      const c = document.createElement("canvas");
      pintar(c, salidas[i]);
      b.append(c);
      const pie = document.createElement("span");
      pie.innerHTML = `<b>${i + 1}. ${es ? f.es : f.en}</b><span class="conv-kernel k${n}">${kernel(f.k)}</span>`;
      b.append(pie);
      b.addEventListener("click", () => detalle(i));
      cont.append(b);
    });
  }

  function detalle(i) {
    const f = filtros()[i];
    $("detalle-titulo").textContent = `${i + 1}. ${es ? f.es : f.en} · ${n}×${n}`;
    pintar($("detalle-mapa"), salidas[i]);
    $("detalle-kernel").className = `conv-kernel grande k${n}`;
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
  document.querySelectorAll("input[name=activacion]").forEach(r => r.addEventListener("change", calcular));
  document.querySelectorAll("input[name=tamano]").forEach(r => r.addEventListener("change", () => { n = +r.value; calcular(); }));
  $("detalle").addEventListener("click", e => { if (e.target === $("detalle")) $("detalle").close(); });
  cargar("../assets/img/foto.jpg");
})();
