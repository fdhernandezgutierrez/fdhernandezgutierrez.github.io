/* ==========================================================================
   preprocesamiento.js — preprocesamiento de SABER-DR en el navegador.

   recorte de bordes negros -> RGB->LAB -> CLAHE en L -> LAB->RGB -> resize bilineal 224
   -> normalización ImageNet

   Reproduce bit a bit el preprocesamiento con el que se entrenó el modelo (cvtColor y
   createCLAHE de OpenCV 4.13, Image.resize de Pillow), igual que la app para Android.
   Math.fround reproduce las operaciones en precisión simple donde el original las usa.
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function (G) {
  "use strict";
  const f = Math.fround;

  /** Redondeo al par más cercano (Math.rint de Java, np.rint). */
  function rint(v) {
    const r = Math.round(v);
    return (Math.abs(v % 1) === 0.5 && r % 2 !== 0) ? r - 1 : r;
  }
  const clip8 = v => (v < 0 ? 0 : v > 255 ? 255 : v);

  /** Imagen RGB de 8 bits con los canales entrelazados. */
  function imagen(ancho, alto, datos) {
    return { ancho, alto, datos: datos || new Uint8Array(ancho * alto * 3) };
  }

  // ------------------------------------------------------------------ recorte
  function recortarBordes(img, umbral = 7, margen = 4) {
    const d = img.datos, w = img.ancho, h = img.alto;
    let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1, p = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++, p += 3) {
        const r = d[p], g = d[p + 1], b = d[p + 2];
        const m = r > g ? (r > b ? r : b) : (g > b ? g : b);
        if (m > umbral) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          y1 = y;
        }
      }
    }
    if (x1 < 0) return img;
    x0 = Math.max(0, x0 - margen); y0 = Math.max(0, y0 - margen);
    x1 = Math.min(w - 1, x1 + margen); y1 = Math.min(h - 1, y1 + margen);
    const out = imagen(x1 - x0 + 1, y1 - y0 + 1);
    const fila = out.ancho * 3;
    for (let y = 0; y < out.alto; y++) {
      const ini = ((y0 + y) * w + x0) * 3;
      out.datos.set(d.subarray(ini, ini + fila), y * fila);
    }
    return out;
  }

  // ------------------------------------------------------------------ LAB (OpenCV, 8 bits)
  const LAB_SHIFT = 12, GAMMA_SHIFT = 3, LAB_SHIFT2 = LAB_SHIFT + GAMMA_SHIFT;
  const LSCALE = 841.0 / 108.0, LBIAS = 16.0 / 116.0, LTHRESH = 216.0 / 24389.0;
  const SRGB2XYZ = [0.412453, 0.357580, 0.180423, 0.212671, 0.715160, 0.072169, 0.019334, 0.119193, 0.950227];
  const XYZ2SRGB = [3.240479, -1.53715, -0.498535, -0.969256, 1.875991, 0.041556, 0.055648, -0.204043, 1.057311];
  const BLANCO = [0.950456, 1.0, 1.088754];

  const GAMMA = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = f(i / 255);
    const g = x <= f(0.04045) ? f(x / f(12.92)) : f(Math.pow((x + 0.055) / 1.055, 2.4));
    GAMMA[i] = rint(f(2040 * g));
  }
  const CBRT = new Int32Array(256 * 3 / 2 * (1 << GAMMA_SHIFT));
  for (let i = 0; i < CBRT.length; i++) {
    const x = i / (255.0 * (1 << GAMMA_SHIFT));
    CBRT[i] = rint((1 << LAB_SHIFT2) * (x < LTHRESH ? x * LSCALE + LBIAS : Math.cbrt(x)));
  }
  const C_FWD = SRGB2XYZ.map((v, k) => rint((1 << LAB_SHIFT) * v / BLANCO[Math.floor(k / 3)]));

  const BASE = 1 << 14, MIN_AB = -8145, INV_GAMMA_SIZE = 4096;
  const YF = new Int32Array(512);
  for (let i = 0; i < 256; i++) {
    const li = i * 100.0 / 255.0;
    let yy, fy;
    if (i <= 20) { yy = li / 903.3; fy = yy * LSCALE + LBIAS; }
    else { fy = (li + 16.0) / 116.0; yy = Math.pow(fy, 3); }
    YF[2 * i] = rint(yy * BASE);
    YF[2 * i + 1] = rint(fy * BASE);
  }
  const AB_TO_XZ = new Int32Array(BASE * 9 / 4);
  const DESPL = Math.trunc(Math.trunc(Math.trunc(BASE * 16 / 116) * 108) / 841);
  for (let k = 0; k < AB_TO_XZ.length; k++) {
    const i = k + MIN_AB;
    AB_TO_XZ[k] = i <= 3390 ? Math.trunc(i * 108 / 841) - DESPL
                            : Math.trunc(Math.trunc(i * i / BASE) * i / BASE);
  }
  const C_INV = XYZ2SRGB.map((v, k) => rint((1 << LAB_SHIFT) * v * BLANCO[k % 3]));
  const INV_GAMMA = new Uint8Array(INV_GAMMA_SIZE);
  for (let i = 0; i < INV_GAMMA_SIZE; i++) {
    const x = i / INV_GAMMA_SIZE;
    INV_GAMMA[i] = rint(255.0 * (x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055));
  }

  function rgbALab(img) {
    const n = img.ancho * img.alto, d = img.datos, c = C_FWD;
    const L = new Uint8Array(n), A = new Uint8Array(n), B = new Uint8Array(n);
    const lScale = Math.trunc((116 * 255 + 50) / 100);
    const lShift = -Math.trunc((16 * 255 * (1 << LAB_SHIFT2) + 50) / 100);
    const r12 = 1 << (LAB_SHIFT - 1), r15 = 1 << (LAB_SHIFT2 - 1), off = 128 * (1 << LAB_SHIFT2);
    for (let i = 0, p = 0; i < n; i++, p += 3) {
      const r = GAMMA[d[p]], g = GAMMA[d[p + 1]], b = GAMMA[d[p + 2]];
      const fx = CBRT[(r * c[0] + g * c[1] + b * c[2] + r12) >> LAB_SHIFT];
      const fy = CBRT[(r * c[3] + g * c[4] + b * c[5] + r12) >> LAB_SHIFT];
      const fz = CBRT[(r * c[6] + g * c[7] + b * c[8] + r12) >> LAB_SHIFT];
      L[i] = clip8((lScale * fy + lShift + r15) >> LAB_SHIFT2);
      A[i] = clip8((500 * (fx - fy) + off + r15) >> LAB_SHIFT2);
      B[i] = clip8((200 * (fy - fz) + off + r15) >> LAB_SHIFT2);
    }
    return [L, A, B];
  }

  function labARgb(L, A, B, ancho, alto) {
    const out = imagen(ancho, alto), d = out.datos, c = C_INV;
    const aOff = Math.trunc(128 * BASE / 500), bOff = Math.trunc(128 * BASE / 200);
    for (let i = 0, p = 0; i < ancho * alto; i++, p += 3) {
      const li = L[i], ai = A[i], bi = B[i];
      const y = YF[2 * li], ify = YF[2 * li + 1];
      const adiv = ((5 * ai * 53687 + (1 << 7)) >> 13) - aOff;
      const bdiv = ((bi * 41943 + (1 << 4)) >> 9) - bOff + 1;
      const x = AB_TO_XZ[ify + adiv - MIN_AB];
      const z = AB_TO_XZ[ify - bdiv - MIN_AB];
      for (let k = 0; k < 3; k++) {
        // Puede pasar de 32 bits: división entera por 2^14 hacia -∞, como el desplazamiento del original
        const v = Math.floor((c[3 * k] * x + c[3 * k + 1] * y + c[3 * k + 2] * z + (1 << 13)) / 16384);
        d[p + k] = INV_GAMMA[v < 0 ? 0 : v > INV_GAMMA_SIZE - 1 ? INV_GAMMA_SIZE - 1 : v];
      }
    }
    return out;
  }

  // ------------------------------------------------------------------ CLAHE (OpenCV)
  function reflect101(p, n) {
    if (n === 1) return 0;
    let q = p;
    while (q < 0 || q >= n) q = q < 0 ? -q : 2 * (n - 1) - q;
    return q;
  }

  function clahe(src, w, h, clipLimit, tilesX, tilesY) {
    // OpenCV rellena ambos ejes con BORDER_REFLECT_101 si alguno no es divisible.
    const relleno = !(w % tilesX === 0 && h % tilesY === 0);
    const extW = relleno ? w + tilesX - w % tilesX : w;
    const extH = relleno ? h + tilesY - h % tilesY : h;
    const tw = extW / tilesX, th = extH / tilesY, total = tw * th;
    const lutScale = f(255 / f(total));
    const limite = clipLimit > 0 ? Math.max(Math.trunc(clipLimit * total / 256), 1) : 0;
    const colMap = new Int32Array(extW);
    for (let x = 0; x < extW; x++) colMap[x] = reflect101(x, w);

    const luts = new Uint8Array(tilesX * tilesY * 256);
    const hist = new Int32Array(256);
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        hist.fill(0);
        for (let yy = ty * th; yy < (ty + 1) * th; yy++) {
          const fila = reflect101(yy, h) * w;
          for (let xx = tx * tw; xx < (tx + 1) * tw; xx++) hist[src[fila + colMap[xx]]]++;
        }
        if (limite > 0) {
          let recortado = 0;
          for (let i = 0; i < 256; i++) {
            if (hist[i] > limite) { recortado += hist[i] - limite; hist[i] = limite; }
          }
          const lote = Math.trunc(recortado / 256);
          let residuo = recortado - lote * 256;
          for (let i = 0; i < 256; i++) hist[i] += lote;
          if (residuo !== 0) {
            const paso = Math.max(Math.trunc(256 / residuo), 1);
            for (let i = 0; i < 256 && residuo > 0; i += paso, residuo--) hist[i]++;
          }
        }
        const base = (ty * tilesX + tx) * 256;
        let suma = 0;
        for (let i = 0; i < 256; i++) {
          suma += hist[i];
          luts[base + i] = clip8(rint(f(f(suma) * lutScale)));
        }
      }
    }

    const invTw = f(1 / f(tw)), invTh = f(1 / f(th));
    const ind1 = new Int32Array(w), ind2 = new Int32Array(w);
    const xa = new Float32Array(w), xa1 = new Float32Array(w);
    for (let x = 0; x < w; x++) {
      const txf = f(f(x * invTw) - 0.5);
      const tx1 = Math.floor(txf);
      xa[x] = f(txf - tx1);
      xa1[x] = f(1 - xa[x]);
      ind1[x] = Math.max(tx1, 0) * 256;
      ind2[x] = Math.min(tx1 + 1, tilesX - 1) * 256;
    }
    const dst = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const tyf = f(f(y * invTh) - 0.5);
      const ty1 = Math.floor(tyf);
      const ya = f(tyf - ty1), ya1 = f(1 - ya);
      const plano1 = Math.max(ty1, 0) * tilesX * 256;
      const plano2 = Math.min(ty1 + 1, tilesY - 1) * tilesX * 256;
      for (let x = 0; x < w; x++) {
        const v = src[y * w + x];
        const l11 = luts[plano1 + ind1[x] + v], l12 = luts[plano1 + ind2[x] + v];
        const l21 = luts[plano2 + ind1[x] + v], l22 = luts[plano2 + ind2[x] + v];
        const arriba = f(f(f(l11 * xa1[x]) + f(l12 * xa[x])) * ya1);
        const abajo = f(f(f(l21 * xa1[x]) + f(l22 * xa[x])) * ya);
        dst[y * w + x] = clip8(rint(f(arriba + abajo)));
      }
    }
    return dst;
  }

  function claheLab(img, clipLimit, tilesX, tilesY) {
    const [L, A, B] = rgbALab(img);
    return labARgb(clahe(L, img.ancho, img.alto, clipLimit, tilesX, tilesY), A, B, img.ancho, img.alto);
  }

  // ------------------------------------------------------------------ resize (Pillow)
  const PRECISION_BITS = 32 - 8 - 2;
  const bilineal = x => { const t = Math.abs(x); return t < 1 ? 1 - t : 0; };
  const bicubico = x => {
    const a = -0.5, t = Math.abs(x);
    return t < 1 ? ((a + 2) * t - (a + 3)) * t * t + 1 : t < 2 ? (((t - 5) * t + 8) * t - 4) * a : 0;
  };

  function coeficientes(entrada, salida, cubico) {
    const escala = entrada / salida, fEscala = Math.max(escala, 1);
    const soporte = (cubico ? 2 : 1) * fEscala;
    const ksize = Math.ceil(soporte) * 2 + 1;
    const xmins = new Int32Array(salida), cuentas = new Int32Array(salida), kk = new Int32Array(salida * ksize);
    const w = new Float64Array(ksize), filtro = cubico ? bicubico : bilineal;
    for (let xx = 0; xx < salida; xx++) {
      const centro = (xx + 0.5) * escala, ss = 1 / fEscala;
      const xmin = Math.max(Math.trunc(centro - soporte + 0.5), 0);
      const xmax = Math.min(Math.trunc(centro + soporte + 0.5), entrada) - xmin;
      let ww = 0;
      for (let x = 0; x < xmax; x++) { const v = filtro((x + xmin - centro + 0.5) * ss); w[x] = v; ww += v; }
      for (let x = 0; x < xmax; x++) {
        if (ww !== 0) w[x] /= ww;
        const s = w[x] * (1 << PRECISION_BITS);
        kk[xx * ksize + x] = w[x] < 0 ? Math.trunc(-0.5 + s) : Math.trunc(0.5 + s);
      }
      xmins[xx] = xmin;
      cuentas[xx] = xmax;
    }
    return { ksize, xmin: xmins, cuenta: cuentas, k: kk };
  }

  const clipPrecision = ss => (ss >= (1 << PRECISION_BITS) * 256 ? 255 : ss <= 0 ? 0 : ss >> PRECISION_BITS);

  /** Image.resize((anchoS, altoS), BILINEAR o BICUBIC) de Pillow, con su aritmética de punto fijo. */
  function redimensionar(img, anchoS, altoS, cubico = false) {
    const cx = coeficientes(img.ancho, anchoS, cubico), cy = coeficientes(img.alto, altoS, cubico);
    const primero = cy.xmin[0], ultimo = cy.xmin[altoS - 1] + cy.cuenta[altoS - 1];
    const tmpH = ultimo - primero, tmp = new Uint8Array(anchoS * tmpH * 3), src = img.datos;
    const mitad = 1 << (PRECISION_BITS - 1);
    for (let y = 0; y < tmpH; y++) {
      const fila = (y + primero) * img.ancho;
      for (let xx = 0; xx < anchoS; xx++) {
        let s0 = mitad, s1 = mitad, s2 = mitad;
        const k0 = xx * cx.ksize, xmin = cx.xmin[xx];
        for (let x = 0; x < cx.cuenta[xx]; x++) {
          const p = (fila + xmin + x) * 3, k = cx.k[k0 + x];
          s0 += src[p] * k; s1 += src[p + 1] * k; s2 += src[p + 2] * k;
        }
        const o = (y * anchoS + xx) * 3;
        tmp[o] = clipPrecision(s0); tmp[o + 1] = clipPrecision(s1); tmp[o + 2] = clipPrecision(s2);
      }
    }
    const out = imagen(anchoS, altoS);
    for (let yy = 0; yy < altoS; yy++) {
      const k0 = yy * cy.ksize, ymin = cy.xmin[yy] - primero;
      for (let x = 0; x < anchoS; x++) {
        let s0 = mitad, s1 = mitad, s2 = mitad;
        for (let y = 0; y < cy.cuenta[yy]; y++) {
          const p = ((ymin + y) * anchoS + x) * 3, k = cy.k[k0 + y];
          s0 += tmp[p] * k; s1 += tmp[p + 1] * k; s2 += tmp[p + 2] * k;
        }
        const o = (yy * anchoS + x) * 3;
        out.datos[o] = clipPrecision(s0); out.datos[o + 1] = clipPrecision(s1); out.datos[o + 2] = clipPrecision(s2);
      }
    }
    return out;
  }

  // ------------------------------------------------------------------ tensor
  /** ToTensor + Normalize de torchvision, en orden NCHW (precisión simple). */
  function aTensor(img, media, desv) {
    const n = img.ancho * img.alto, out = new Float32Array(3 * n);
    const m = media.map(f), s = desv.map(f);
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < 3; c++) out[c * n + i] = f(f(f(img.datos[3 * i + c] / 255) - m[c]) / s[c]);
    }
    return out;
  }

  // ------------------------------------------------------------------ calidad de imagen
  /**
   * Mismas revisiones que la aplicación web y la app Android. Devuelve códigos
   * ({ codigo: "pequena" | "oscura" | "color" | "forma", ancho, alto }); demo.js los pone en palabras.
   */
  function avisosCalidad(anchoOriginal, altoOriginal, recortada) {
    const avisos = [];
    if (Math.min(anchoOriginal, altoOriginal) < 224) avisos.push({ codigo: "pequena", ancho: anchoOriginal, alto: altoOriginal });
    const chica = redimensionar(recortada, 256, 256, true);
    let dentro = 0, r = 0, g = 0, b = 0;
    for (let i = 0; i < 256 * 256; i++) {
      const ri = chica.datos[3 * i], gi = chica.datos[3 * i + 1], bi = chica.datos[3 * i + 2];
      if (Math.max(ri, gi, bi) > 20) { dentro++; r += ri; g += gi; b += bi; }
    }
    if (dentro < 0.25 * 256 * 256) avisos.push({ codigo: "oscura" });
    else if (!(r > g && r > b)) avisos.push({ codigo: "color" });
    const razon = Math.max(recortada.ancho, recortada.alto) / Math.max(1, Math.min(recortada.ancho, recortada.alto));
    if (razon > 1.6) avisos.push({ codigo: "forma" });
    return avisos;
  }

  // ------------------------------------------------------------------ mapas de atención
  /** F.interpolate(mode='bicubic', align_corners=False) de PyTorch para un mapa pequeño. */
  function ampliarBicubico(src, inW, inH, outW, outH) {
    const a = -0.75;
    const cc1 = x => ((a + 2) * x - (a + 3)) * x * x + 1;
    const cc2 = x => ((a * x - 5 * a) * x + 8 * a) * x - 4 * a;
    const pesos = t => [cc2(t + 1), cc1(t), cc1(1 - t), cc2(2 - t)];
    const lim = (v, n) => (v < 0 ? 0 : v > n - 1 ? n - 1 : v);
    const tmp = new Float32Array(outW * inH), sx = inW / outW;
    for (let x = 0; x < outW; x++) {
      const real = sx * (x + 0.5) - 0.5, i0 = Math.floor(real), w = pesos(real - i0);
      for (let y = 0; y < inH; y++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += w[k] * src[y * inW + lim(i0 - 1 + k, inW)];
        tmp[y * outW + x] = s;
      }
    }
    const out = new Float32Array(outW * outH), sy = inH / outH;
    for (let y = 0; y < outH; y++) {
      const real = sy * (y + 0.5) - 0.5, i0 = Math.floor(real), w = pesos(real - i0);
      for (let x = 0; x < outW; x++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += w[k] * tmp[lim(i0 - 1 + k, inH) * outW + x];
        out[y * outW + x] = s;
      }
    }
    return out;
  }

  /** Superpone un mapa (normalizado a [0, 1]) con la paleta inferno, como la aplicación web. */
  function superponer(base, calor, inferno, alfa = 0.5) {
    let lo = Infinity, hi = -Infinity;
    for (const v of calor) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const rango = Math.max(1e-8, hi - lo), out = imagen(base.ancho, base.alto);
    for (let i = 0; i < base.ancho * base.alto; i++) {
      const hv = Math.min(1, Math.max(0, (calor[i] - lo) / rango));
      const idx = Math.trunc(hv * 255), peso = alfa * Math.pow(hv, 0.7);
      for (let c = 0; c < 3; c++) {
        const v = base.datos[3 * i + c] * (1 - peso) + inferno[idx * 3 + c] * peso;
        out.datos[3 * i + c] = clip8(Math.trunc(v));
      }
    }
    return out;
  }

  /** Tubería completa: devuelve el tensor del modelo y las imágenes intermedias. */
  function preprocesar(original, cfg) {
    const recortada = recortarBordes(original, cfg.crop_threshold, cfg.crop_margin);
    const mejorada = claheLab(recortada, cfg.clahe_clip_limit, cfg.clahe_tiles[0], cfg.clahe_tiles[1]);
    const entrada = redimensionar(mejorada, cfg.image_size, cfg.image_size);
    return {
      recortada, mejorada, entrada,
      tensor: aTensor(entrada, cfg.mean, cfg.std),
      avisos: avisosCalidad(original.ancho, original.alto, recortada),
    };
  }

  G.SABER_PRE = { imagen, recortarBordes, claheLab, redimensionar, aTensor, avisosCalidad, ampliarBicubico, superponer, preprocesar, rint };
})(typeof window !== "undefined" ? window : globalThis);
