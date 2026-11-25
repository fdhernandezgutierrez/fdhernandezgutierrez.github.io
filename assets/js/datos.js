/* ==========================================================================
   CONTENIDO DEL SITIO — edite solo este archivo para actualizar la página.
   Puede usar <em>cursiva</em> y <strong>negritas</strong> dentro de los textos.
   Cualquier elemento de una lista cuyo texto contenga la palabra EDITAR
   no se muestra; así los datos pendientes no se publican por error.
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */

window.PERFIL = {
  nombre: "Fernando Daniel Hernández Gutiérrez",
  nombreCorto: "Fernando D. Hernández",
  iniciales: "FH",
  foto: "assets/img/foto.jpg",
  cargo: "Candidato a Doctor en Ingeniería Eléctrica",
  institucion: "Universidad de Guanajuato",
  unidad: "División de Ingeniería, Campus Irapuato-Salamanca",
  grupo: "Grupos de Investigación en Telemática y Procesamiento Digital de Señales",
  ciudad: "Salamanca, Guanajuato, México",
  correo: "fd.hernandezgutierrez@ugto.mx",
  actualizado: "noviembre de 2026",

  lema: "Aprendizaje profundo eficiente para el análisis de imágenes médicas.",

  bio: [
    "Soy candidato a Doctor en Ingeniería Eléctrica por la Universidad de Guanajuato e investigo aprendizaje profundo para el análisis de imágenes médicas. Diseño modelos ligeros y precisos, capaces de funcionar en tiempo real y en equipos con recursos limitados: segmentación de vasos retinales, clasificación de la retinopatía diabética y segmentación de tumores cerebrales en resonancia magnética.",
    "En mi tesis doctoral desarrollé RA-UNet, una U-Net ligera con atención inversa (1.94 millones de parámetros y 208 imágenes por segundo), y SABER-DR, un marco ordinal con expertos en las fronteras entre grados de severidad de la retinopatía diabética. En la Maestría en Ingeniería Eléctrica (Instrumentación y Sistemas Digitales) trabajé en la identificación y clasificación de tumores cerebrales, y egresé con el mejor promedio del programa.",
    "Me interesa que los resultados sean reproducibles: validación cruzada, comparaciones en igualdad de condiciones y pruebas estadísticas (Friedman, Nemenyi y Wilcoxon). Además, codirijo estudiantes de licenciatura y maestría, imparto cursos propedéuticos en la Universidad de Guanajuato y soy revisor de <em>Expert Systems with Applications</em> y <em>Frontiers in Artificial Intelligence</em>."
  ],

  intereses: [
    "Segmentación de imágenes médicas",
    "Retinopatía diabética",
    "Tumores cerebrales en resonancia magnética",
    "Arquitecturas ligeras",
    "Mecanismos de atención",
    "Redes generativas (GAN)",
    "Clasificación ordinal",
    "Cálculo fraccionario en visión",
    "Aprendizaje automático cuántico"
  ],

  // Las URL vacías no se muestran.
  enlaces: [
    { tipo: "scholar",  etiqueta: "Google Scholar", url: "https://scholar.google.com/citations?user=Qr4X01QAAAAJ" },
    { tipo: "orcid",    etiqueta: "ORCID",          url: "https://orcid.org/0000-0001-9807-4048" },
    { tipo: "rg",       etiqueta: "ResearchGate",   url: "https://www.researchgate.net/profile/Fernando-Hernandez-Gutierrez" },
    { tipo: "github",   etiqueta: "GitHub",         url: "" },
    { tipo: "linkedin", etiqueta: "LinkedIn",       url: "" },
    { tipo: "cv",       etiqueta: "CV (PDF)",       url: "" }     // p. ej. "assets/docs/cv.pdf"
  ],

  cifras: [
    { valor: "4",  texto: "artículos en revistas internacionales (2024–2026)" },
    { valor: "5",  texto: "proyectos de investigación con financiamiento de la UG" },
    { valor: "28", texto: "revisiones para Expert Systems with Applications y Frontiers in AI" },
    { valor: "3",  texto: "reconocimientos al mejor promedio de posgrado" }
  ],

  // En la página de inicio se muestran las 6 más recientes.
  noticias: [
    { fecha: "2026-11", texto: "Examen de grado de Doctorado en Ingeniería Eléctrica, Universidad de Guanajuato." },
    { fecha: "2026-10", texto: "Ponencia oral de FAR-UNet en el 7th Mexican Workshop on Fractional Calculus (7MWFC-2026), Cancún." },
    { fecha: "2026",    texto: "Codirector de la tesis de maestría de Simon Tshibengabu Kalonji sobre la localización automática de puntos cefalométricos con aprendizaje profundo (Maestría en Ingeniería Eléctrica, UG)." },
    { fecha: "2026",    texto: "Instructor del curso propedéutico de Electrónica Digital para aspirantes a la Maestría en Ingeniería Eléctrica, UG." },
    { fecha: "2026-07", texto: "Publicado en <em>Mathematics</em>: ResGASP-GAN, mejora de imágenes con poca iluminación." },
    { fecha: "2026-01", texto: "Publicado en <em>Technologies</em>: ConvNeXt multiescala para segmentar tumores cerebrales en resonancia magnética." },
    { fecha: "2025-11", texto: "Publicado en <em>Jóvenes en la Ciencia</em>: segmentación y clasificación de imágenes de resonancia magnética (Verano de la Ciencia UG)." },
    { fecha: "2025-07", texto: "Publicado en <em>Mathematics</em>: segmentación de vasos retinales con una U-Net ligera y atención inversa." },
    { fecha: "2025",    texto: "Tercer lugar en el concurso institucional Tesis en 3 Minutos (3MT), Universidad de Guanajuato." },
    { fecha: "2024-10", texto: "Publicado en <em>Technologies</em>: segmentación de tumores cerebrales con una U-Net ligera." }
  ],

  // id: también define la ilustración de la tarjeta (retina, rd, cerebro, luz, nas, motor)
  lineas: [
    {
      id: "retina",
      titulo: "Segmentación de vasos retinales",
      resumen: "U-Net ligera con atención inversa: 1.94 millones de parámetros, 208 imágenes por segundo y coeficiente Dice de 0.7871 en DRIVE y 0.8036 en CHASE_DB1, con mejor delimitación de los vasos delgados y periféricos. Trabajo actual: atención de orden fraccionario en las conexiones de salto (FAR-UNet).",
      etiquetas: ["U-Net", "Atención inversa", "Cálculo fraccionario", "DRIVE", "CHASE_DB1", "HRF"],
      estado: "Publicado"
    },
    {
      id: "rd",
      titulo: "Clasificación de retinopatía diabética",
      resumen: "SABER-DR combina predicción multiclase global, aprendizaje ordinal y expertos especializados en las fronteras entre grados adyacentes. En APTOS 2019 alcanzó Macro-F1 de 0.6330 y kappa ponderado cuadrático de 0.8371; en validación cruzada superó a EfficientNet-B0 y B1 entrenadas en las mismas condiciones.",
      etiquetas: ["EfficientNet", "Clasificación ordinal", "APTOS 2019", "Mezcla de expertos", "DCGAN"],
      estado: "Tesis doctoral",
      enlace: "saber-dr/index.html",
      textoEnlace: "Pruebe SABER-DR en su navegador"
    },
    {
      id: "cerebro",
      titulo: "Segmentación de tumores cerebrales en resonancia magnética",
      resumen: "Selección automática de los cortes de resonancia más informativos y una U-Net de 2 millones de parámetros (Dice de 0.860 en BraTS 2021). Después, una U-Net multiescala con ConvNeXt y atención inversa que alcanza Dice de 0.9235 en BraTS 2023 y 0.9225 en BraTS 2024.",
      etiquetas: ["BraTS", "ConvNeXt", "U-Net ligera", "Resonancia multimodal"],
      estado: "Publicado"
    },
    {
      id: "luz",
      titulo: "Mejora de imágenes con poca iluminación",
      resumen: "ResGASP-GAN: generador residual con normalización por grupos, ASPP y recalibración por canal (SE), con discriminador PatchGAN. Logra el menor BRISQUE (10.45) y el menor tiempo de inferencia entre los métodos comparados, útil para navegación robótica en tiempo real.",
      etiquetas: ["GAN", "PatchGAN", "ASPP", "LOL-v1", "LOL-v2"],
      estado: "Publicado"
    },
    {
      id: "nas",
      titulo: "Búsqueda automática y modelos cuánticos híbridos",
      resumen: "Búsqueda de arquitecturas neuronales robusta para obtener una sola red que generalice entre bases de datos, y circuitos cuánticos variacionales y transformadores visuales cuánticos integrados en redes de análisis de imágenes de retina.",
      etiquetas: ["NAS", "Evolución regularizada", "Circuitos variacionales"],
      estado: "En curso"
    },
    {
      id: "motor",
      titulo: "Diagnóstico de fallas en motores de inducción",
      resumen: "Redes residuales profundas para detectar cortocircuitos entre espiras del estator a partir de la corriente del motor (análisis de la firma de corriente).",
      etiquetas: ["ResNet", "MCSA", "Corriente del estator"],
      estado: "En preparación"
    }
  ],

  // tipo: "revista" | "congreso" | "otra" | "preparacion" | "tesis"
  // linea: id de la línea de investigación a la que pertenece
  // autores: puede quedar vacío (p. ej. en ponencias)
  publicaciones: [
    {
      id: "RESGASP2026", tipo: "revista", anio: 2026,
      titulo: "ResGASP-GAN: A Residual Group-Normalized ASPP-SE GAN with a PatchGAN Discriminator for Low-Light Image Enhancement",
      autores: ["F. D. Hernandez-Gutierrez", "P. D. Bravo-Aguilar", "E. Ovalle-Magallanes", "M. A. Ibarra-Manzano", "J. Ruiz-Pinales", "J. G. Avina-Cervantes"],
      revista: "Mathematics", detalle: "vol. 14, núm. 14, art. 2582",
      doi: "10.3390/math14142582", pdf: "", codigo: "", linea: "luz",
      bibtex: "@article{HernandezGutierrez2026ResGASP,\n  author  = {Hernandez-Gutierrez, Fernando Daniel and Bravo-Aguilar, Paula Dalida and Ovalle-Magallanes, Emmanuel and Ibarra-Manzano, Mario Alberto and Ruiz-Pinales, Jose and Avina-Cervantes, Juan Gabriel},\n  title   = {{ResGASP-GAN}: A Residual Group-Normalized {ASPP-SE} {GAN} with a {PatchGAN} Discriminator for Low-Light Image Enhancement},\n  journal = {Mathematics},\n  volume  = {14},\n  number  = {14},\n  pages   = {2582},\n  year    = {2026},\n  doi     = {10.3390/math14142582}\n}"
    },
    {
      id: "CONVNEXT2026", tipo: "revista", anio: 2026,
      titulo: "Multi-Scale ConvNeXt for Robust Brain Tumor Segmentation in Multimodal MRI",
      autores: ["J. L. Lopez-Ramirez", "F. D. Hernandez-Gutierrez", "J. R. Avina-Ortiz", "P. D. Bravo-Aguilar", "E. G. Avina-Bravo", "J. Ruiz-Pinales", "J. G. Avina-Cervantes"],
      revista: "Technologies", detalle: "vol. 14, núm. 1, art. 34",
      doi: "10.3390/technologies14010034", pdf: "", codigo: "", linea: "cerebro",
      bibtex: "@article{LopezRamirez2026ConvNeXt,\n  author  = {Lopez-Ramirez, Jose Luis and Hernandez-Gutierrez, Fernando Daniel and Avina-Ortiz, Jose Ramon and Bravo-Aguilar, Paula Dalida and Avina-Bravo, Eli Gabriel and Ruiz-Pinales, Jose and Avina-Cervantes, Juan Gabriel},\n  title   = {Multi-Scale {ConvNeXt} for Robust Brain Tumor Segmentation in Multimodal {MRI}},\n  journal = {Technologies},\n  volume  = {14},\n  number  = {1},\n  pages   = {34},\n  year    = {2026},\n  doi     = {10.3390/technologies14010034}\n}"
    },
    {
      id: "HERNANDEZ2025", tipo: "revista", anio: 2025,
      titulo: "Retinal Vessel Segmentation Based on a Lightweight U-Net and Reverse Attention",
      autores: ["F. D. Hernandez-Gutierrez", "E. G. Avina-Bravo", "M. A. Ibarra-Manzano", "J. Ruiz-Pinales", "E. Ovalle-Magallanes", "J. G. Avina-Cervantes"],
      revista: "Mathematics", detalle: "vol. 13, núm. 13, art. 2203",
      doi: "10.3390/math13132203", pdf: "", codigo: "", linea: "retina",
      bibtex: "@article{HernandezGutierrez2025Retinal,\n  author  = {Hernandez-Gutierrez, Fernando Daniel and Avina-Bravo, Eli Gabriel and Ibarra-Manzano, Mario Alberto and Ruiz-Pinales, Jose and Ovalle-Magallanes, Emmanuel and Avina-Cervantes, Juan Gabriel},\n  title   = {Retinal Vessel Segmentation Based on a Lightweight {U-Net} and Reverse Attention},\n  journal = {Mathematics},\n  volume  = {13},\n  number  = {13},\n  pages   = {2203},\n  year    = {2025},\n  doi     = {10.3390/math13132203}\n}"
    },
    {
      id: "BRAIN2024", tipo: "revista", anio: 2024,
      titulo: "Brain Tumor Segmentation from Optimal MRI Slices Using a Lightweight U-Net",
      autores: ["F. D. Hernandez-Gutierrez", "E. G. Avina-Bravo", "D. F. Zambrano-Gutierrez", "O. Almanza-Conejo", "M. A. Ibarra-Manzano", "J. Ruiz-Pinales", "E. Ovalle-Magallanes", "J. G. Avina-Cervantes"],
      revista: "Technologies", detalle: "vol. 12, núm. 10, art. 183",
      doi: "10.3390/technologies12100183", pdf: "", codigo: "", linea: "cerebro",
      bibtex: "@article{HernandezGutierrez2024Brain,\n  author  = {Hernandez-Gutierrez, Fernando Daniel and Avina-Bravo, Eli Gabriel and Zambrano-Gutierrez, Daniel F. and Almanza-Conejo, Oscar and Ibarra-Manzano, Mario Alberto and Ruiz-Pinales, Jose and Ovalle-Magallanes, Emmanuel and Avina-Cervantes, Juan Gabriel},\n  title   = {Brain Tumor Segmentation from Optimal {MRI} Slices Using a Lightweight {U-Net}},\n  journal = {Technologies},\n  volume  = {12},\n  number  = {10},\n  pages   = {183},\n  year    = {2024},\n  doi     = {10.3390/technologies12100183}\n}"
    },
    {
      id: "JC2025", tipo: "otra", anio: 2025,
      titulo: "Segmentación y clasificación de imágenes de resonancia magnética",
      autores: ["A. Alfaro Flores", "L. V. Montoya Agudelo", "L. F. Morales Zambrano", "F. D. Hernandez-Gutierrez", "J. G. Avina-Cervantes"],
      revista: "Jóvenes en la Ciencia", detalle: "vol. 37, pp. 1–12",
      doi: "10.15174/jc.2025.4996", pdf: "", codigo: "", linea: "cerebro",
      bibtex: "@article{AlfaroFlores2025,\n  author  = {Alfaro Flores, Alejandra and Montoya Agudelo, Laura Vanessa and Morales Zambrano, Luisa Fernanda and Hernandez-Gutierrez, Fernando Daniel and Avina-Cervantes, Juan Gabriel},\n  title   = {Segmentaci{\\'o}n y clasificaci{\\'o}n de im{\\'a}genes de resonancia magn{\\'e}tica},\n  journal = {J{\\'o}venes en la Ciencia},\n  volume  = {37},\n  pages   = {1--12},\n  year    = {2025},\n  doi     = {10.15174/jc.2025.4996}\n}"
    },
    {
      id: "FARUNET2026", tipo: "congreso", anio: 2026,
      titulo: "FAR-UNet: A Fractional-Order Skip-Attention U-Net for Retinal Vessel Segmentation",
      autores: [],
      revista: "7th Mexican Workshop on Fractional Calculus (7MWFC-2026)", detalle: "ponencia oral, Cancún, Quintana Roo, 9 de octubre de 2026",
      doi: "", pdf: "", codigo: "", linea: "retina", bibtex: ""
    },
    {
      id: "MUJER2026", tipo: "congreso", anio: 2026,
      titulo: "Brain Tumor Segmentation in Magnetic Resonance Imaging using an Optimized U-Net",
      autores: [],
      revista: "23.er Encuentro de la Participación de la Mujer en la Ciencia", detalle: "contribución en coautoría, León, Guanajuato",
      doi: "", pdf: "", codigo: "", linea: "cerebro", bibtex: ""
    },
    {
      id: "TURNGUARD", tipo: "preparacion", anio: 2026,
      titulo: "TurnGuard-ResNet: Residual Deep Learning for Inter-Turn Short-Circuit Fault Diagnosis in Induction Motors",
      autores: ["F. D. Hernandez-Gutierrez", "A. Ortega-Gonzalez", "M. A. Ibarra-Manzano", "J. Ruiz-Pinales", "J. G. Avina-Cervantes"],
      revista: "Manuscrito en preparación", detalle: "",
      doi: "", pdf: "", codigo: "", linea: "motor", bibtex: ""
    },
    {
      id: "TESIS2026", tipo: "tesis", anio: 2026,
      titulo: "Identificación automática de retinopatías utilizando imágenes del fondo de la retina y aprendizaje profundo",
      autores: ["F. D. Hernandez-Gutierrez"],
      revista: "Tesis doctoral, Universidad de Guanajuato",
      detalle: "director: Dr. Juan Gabriel Aviña Cervantes; codirector: Dr. José Ruiz Pinales",
      doi: "", pdf: "", codigo: "", linea: "rd", bibtex: ""
    },
    {
      id: "TESISM2022", tipo: "tesis", anio: 2022,
      titulo: "Identificación y clasificación de tumores cerebrales en imágenes biomédicas",
      autores: ["F. D. Hernandez-Gutierrez"],
      revista: "Tesis de maestría, Universidad de Guanajuato",
      detalle: "Maestría en Ingeniería Eléctrica (Instrumentación y Sistemas Digitales)",
      doi: "", pdf: "", codigo: "", linea: "cerebro", bibtex: ""
    }
  ],

  formacion: [
    { grado: "Doctorado en Ingeniería Eléctrica", lugar: "Universidad de Guanajuato", periodo: "2022–2026",
      detalle: "Tesis: «Identificación automática de retinopatías utilizando imágenes del fondo de la retina y aprendizaje profundo». Director: Dr. Juan Gabriel Aviña Cervantes; codirector: Dr. José Ruiz Pinales." },
    { grado: "Maestría en Ingeniería Eléctrica (Instrumentación y Sistemas Digitales)", lugar: "Universidad de Guanajuato", periodo: "2020–2022",
      detalle: "Tesis: «Identificación y clasificación de tumores cerebrales en imágenes biomédicas». Egresó con el mejor promedio del programa." }
  ],

  premios: [
    { anio: "2025", titulo: "Tercer lugar, concurso institucional Tesis en 3 Minutos (3MT)", detalle: "Universidad de Guanajuato." },
    { anio: "2025", titulo: "Reconocimiento al logro académico", detalle: "Mejor promedio del Doctorado en Ingeniería Eléctrica, ciclo 2024–2025. Campus Irapuato-Salamanca, Universidad de Guanajuato." },
    { anio: "2023", titulo: "Reconocimiento al desempeño académico", detalle: "Mejor promedio del Doctorado en Ingeniería Eléctrica, ciclo 2022–2023. Campus Irapuato-Salamanca, Universidad de Guanajuato." },
    { anio: "2022", titulo: "Reconocimiento al desempeño académico", detalle: "Mejor promedio de egreso de la Maestría en Ingeniería Eléctrica (Instrumentación y Sistemas Digitales), Universidad de Guanajuato." }
  ],

  // Proyectos de investigación con financiamiento (Convocatoria Institucional de Investigación Científica, UG)
  proyectosInvestigacion: [
    { anio: "2026", titulo: "Detección y clasificación de células en frotis sanguíneos para apoyar el tamizaje de leucemia linfoblástica aguda", detalle: "Estudiante investigador · CIIC 318/2026 · financiamiento de $100,000 MXN" },
    { anio: "2025", titulo: "Detección y segmentación de tumores cerebrales con la arquitectura ConvNeXt", detalle: "Estudiante investigador · CIIC 163/2025 · financiamiento de $100,000 MXN" },
    { anio: "2024", titulo: "Identificación automática de retinopatías con imágenes de retina y aprendizaje profundo con redes generativas antagónicas (DCGAN)", detalle: "Estudiante investigador · CIIC 243/2024 · financiamiento de $30,000 MXN" },
    { anio: "2023", titulo: "Modelos de ensamble profundo para la clasificación de lesiones en imágenes médicas", detalle: "Estudiante investigador · CIIC 94/2023 · financiamiento de $30,000 MXN" },
    { anio: "2022", titulo: "Transformadores visuales cuánticos para detectar retinopatía diabética y calcificación de arterias coronarias en imágenes de fondo de retina", detalle: "Estudiante investigador · CIIC 171/2022 · financiamiento de $30,000 MXN" }
  ],

  direccion: [
    { anio: "2026", titulo: "Codirector de tesis de maestría", detalle: "Simon Tshibengabu Kalonji: «A Deep Learning Framework for Automatic Cephalometric Landmark Localization through Gaussian Heatmap Regression». Maestría en Ingeniería Eléctrica (Instrumentación y Sistemas Digitales), UG." },
    { anio: "2026", titulo: "Cosupervisor de investigación (en curso)", detalle: "Arquitectura basada en ResMamba para segmentar vasos sanguíneos en imágenes de fondo de retina. Beca interna de investigación para licenciatura, agosto–diciembre de 2026, UG." },
    { anio: "2026", titulo: "Cosupervisor de investigación", detalle: "Segmentación de imágenes biomédicas en dispositivos de recursos limitados mediante algoritmos optimizados. Beca interna de investigación para licenciatura, enero–junio de 2026, UG." },
    { anio: "2026", titulo: "Cosupervisor de investigación", detalle: "Análisis automático de retinopatía diabética con visión por computadora y aprendizaje profundo. 31.º Verano de la Ciencia, UG." },
    { anio: "2025", titulo: "Cosupervisor de investigación", detalle: "Segmentación y clasificación de imágenes de resonancia magnética. 30.º Verano de la Ciencia, UG." }
  ],

  docencia: [
    { curso: "Curso propedéutico de Electrónica Digital", lugar: "Aspirantes a la Maestría en Ingeniería Eléctrica, UG", periodo: "2026–actual" },
    { curso: "Curso propedéutico de licenciatura", lugar: "Universidad de Guanajuato", periodo: "2026" },
    { curso: "Curso propedéutico de Programación en C/C++", lugar: "Aspirantes a la Maestría en Ingeniería Eléctrica, UG", periodo: "2024–2026" },
    { curso: "Álgebra Lineal", lugar: "Universidad de Guanajuato", periodo: "2025" }
  ],

  // enlace: URL opcional (repositorio, tienda de apps, demostración)
  proyectos: [
    { titulo: "SABER-DR Web", texto: "Gradúa la retinopatía diabética en cinco grados. Pruébela en el navegador: la imagen no sale de su equipo.", etiqueta: "Software", enlace: "saber-dr/index.html" },
    { titulo: "SABER-DR Android", texto: "Clasificación en el teléfono con ONNX, sin conexión a internet.", etiqueta: "Software", enlace: "saber-dr/index.html#versiones" },
    { titulo: "Filtros convolucionales", texto: "Suba una imagen y vea los 16 mapas de características que produce una capa convolucional con filtros de 3×3.", etiqueta: "Demostración", enlace: "convolucion/index.html" },
    { titulo: "Laboratorio de Circuitos", texto: "Práctica guiada de circuitos eléctricos, de la potencia y los nodos y mallas a los circuitos RLC y los fasores, para Android y en el navegador.", etiqueta: "Docencia", enlace: "educacion/laboratorio-circuitos/index.html" }
  ],

  revision: [
    { titulo: "Revisor ad hoc de Expert Systems with Applications", texto: "Elsevier · 26 revisiones · 2024–actual" },
    { titulo: "Revisor ad hoc de Frontiers in Artificial Intelligence", texto: "Frontiers · 2 revisiones" }
  ],

  servicio: [
    { anio: "2026", titulo: "Evaluador de proyectos, Cardinal Academic Week (primavera de 2026)", detalle: "Proyectos de ingeniería mecánica, mecatrónica e industrial. Universidad Incarnate Word, Campus Bajío, Irapuato." },
    { anio: "2025–2026", titulo: "Comité organizador, Encuentro de Jóvenes Investigadores", detalle: "Ediciones 2025 y 2026, Universidad de Colima." },
    { anio: "2025", titulo: "Organizador, 1.ª Jornada de Visitas Técnicas para PrepaTEC", detalle: "Universidad de Guanajuato." },
    { anio: "2024", titulo: "Integrante de ocho comisiones del Consejo Divisional de Ingeniería", detalle: "Como estudiante de doctorado, Campus Irapuato-Salamanca: Honor y Justicia; Becas; Seguimiento de Políticas Institucionales y Violencia de Género; Comisión Especial de Seguridad (sede Yuriria); y procesos de designación de directivos y elección de consejeros (periodos 2024–2028 y 2024–2026)." }
  ],

  divulgacion: [
    { anio: "2024", titulo: "Conferencista invitado: «Redes neuronales convolucionales»", detalle: "Semana Tecnológica 2024, Instituto Tecnológico Superior de Purísima del Rincón." },
    { anio: "2023", titulo: "Instructor del taller «Niñas en la ciencia soñando con ser ingenieras»", detalle: "Programa de divulgación eUGreka, Universidad de Guanajuato." },
    { anio: "2023", titulo: "Voluntario de divulgación científica", detalle: "USAER 51 y Escuela Primaria Ma. Guadalupe Arroyo." },
    { anio: "2023", titulo: "Expositor en Hannover Messe", detalle: "Proyectos «Robot Nao» y «Leap Motion Sensor» en el pabellón de la Universidad de Guanajuato, León." }
  ],

  habilidades: [
    { area: "Idiomas", texto: "Español (nativo), inglés (intermedio)." },
    { area: "Programación", texto: "Python, MATLAB/Simulink, LaTeX (TikZ, Beamer), Git/GitHub." },
    { area: "IA y visión", texto: "PyTorch; segmentación y clasificación de imágenes médicas; redes convolucionales, mecanismos de atención y GAN; comparación estadística de modelos (pruebas de Friedman, Nemenyi y Wilcoxon)." }
  ],

  // Formulario de contacto.
  //  - Vacío (""): al enviar se abre el programa de correo del visitante con el mensaje listo.
  //    Funciona en GitHub Pages sin configurar nada.
  //  - Para recibir los mensajes directamente, cree un formulario gratuito en https://formspree.io
  //    y pegue aquí su dirección, p. ej. "https://formspree.io/f/abcdwxyz".
  //  - En un servidor con PHP, copie extras/enviar.php a la raíz y escriba "enviar.php".
  formularioServicio: "",
  formularioProveedor: "Formspree",   // nombre que se muestra en el aviso de privacidad

  // Temas del formulario de contacto (si usa enviar.php, deben coincidir con $ASUNTOS)
  asuntosContacto: ["Colaboración de investigación", "Estudiantes y tesis", "Revisión o actividad editorial", "Otro"]
};
