/* ==========================================================================
   ENGLISH CONTENT — English version of datos.js (the site opens in English).
   Edit this file together with datos.js:
     - Lists of text (bio, news, awards…) are complete here, in English.
     - Research lines and publications are matched by their "id": only the
       fields that change in English are written here; authors, DOI and BibTeX
       come from datos.js. If an id is missing here, the Spanish text is shown.
   You can use <em>italics</em> and <strong>bold</strong> inside the texts.
   © 2026 Fernando Daniel Hernández Gutiérrez
   ========================================================================== */
(function () {
  "use strict";
  const ES = window.PERFIL;

  // Research lines: by id (see "lineas" in datos.js)
  const LINEAS = {
    retina: {
      titulo: "Retinal vessel segmentation",
      resumen: "A lightweight U-Net with reverse attention: 1.94 million parameters, 208 images per second, and Dice coefficients of 0.7871 on DRIVE and 0.8036 on CHASE_DB1, with better delineation of thin and peripheral vessels. Current work: fractional-order attention in the skip connections (FAR-UNet).",
      etiquetas: ["U-Net", "Reverse attention", "Fractional calculus", "DRIVE", "CHASE_DB1", "HRF"],
      estado: "Published"
    },
    rd: {
      titulo: "Diabetic retinopathy grading",
      resumen: "SABER-DR combines global multiclass prediction, ordinal learning, and experts specialized in the boundaries between adjacent grades. On APTOS 2019 it reached a macro-F1 of 0.6330 and a quadratic weighted kappa of 0.8371; in cross-validation it outperformed EfficientNet-B0 and B1 trained under the same conditions.",
      etiquetas: ["EfficientNet", "Ordinal classification", "APTOS 2019", "Mixture of experts", "DCGAN"],
      estado: "PhD thesis",
      textoEnlace: "Try SABER-DR in your browser"
    },
    cerebro: {
      titulo: "Brain tumor segmentation in MRI",
      resumen: "Automatic selection of the most informative MRI slices and a 2-million-parameter U-Net (Dice of 0.860 on BraTS 2021), followed by a multi-scale U-Net with ConvNeXt and reverse attention that reaches Dice scores of 0.9235 on BraTS 2023 and 0.9225 on BraTS 2024.",
      etiquetas: ["BraTS", "ConvNeXt", "Lightweight U-Net", "Multimodal MRI"],
      estado: "Published"
    },
    luz: {
      titulo: "Low-light image enhancement",
      resumen: "ResGASP-GAN: a residual generator with group normalization, ASPP, and channel recalibration (SE), paired with a PatchGAN discriminator. It achieves the lowest BRISQUE (10.45) and the shortest inference time among the compared methods, which makes it suitable for real-time robot navigation.",
      etiquetas: ["GAN", "PatchGAN", "ASPP", "LOL-v1", "LOL-v2"],
      estado: "Published"
    },
    nas: {
      titulo: "Architecture search and hybrid quantum models",
      resumen: "Robust neural architecture search to obtain a single network that generalizes across datasets, and variational quantum circuits and quantum vision transformers integrated into retinal image analysis networks.",
      etiquetas: ["NAS", "Regularized evolution", "Variational circuits"],
      estado: "Ongoing"
    },
    motor: {
      titulo: "Fault diagnosis in induction motors",
      resumen: "Deep residual networks that detect inter-turn short circuits in the stator from the motor current (motor current signature analysis).",
      etiquetas: ["ResNet", "MCSA", "Stator current"],
      estado: "In preparation"
    }
  };

  // Publications: by id (see "publicaciones" in datos.js). Titles of English papers need no change.
  const PUBLICACIONES = {
    RESGASP2026: { detalle: "vol. 14, no. 14, art. 2582" },
    CONVNEXT2026: { detalle: "vol. 14, no. 1, art. 34" },
    HERNANDEZ2025: { detalle: "vol. 13, no. 13, art. 2203" },
    BRAIN2024: { detalle: "vol. 12, no. 10, art. 183" },
    JC2025: { detalle: "vol. 37, pp. 1–12 (in Spanish)" },
    FARUNET2026: { detalle: "oral presentation, Cancún, Quintana Roo, Mexico, October 9, 2026" },
    MUJER2026: { revista: "23rd Meeting on the Participation of Women in Science", detalle: "co-authored contribution, León, Guanajuato, Mexico" },
    TURNGUARD: { revista: "Manuscript in preparation" },
    TESIS2026: {
      titulo: "Automatic Identification of Retinopathies Using Fundus Images and Deep Learning",
      revista: "PhD thesis, Universidad de Guanajuato",
      detalle: "advisor: Dr. Juan Gabriel Aviña Cervantes; co-advisor: Dr. José Ruiz Pinales"
    },
    TESISM2022: {
      titulo: "Identification and Classification of Brain Tumors in Biomedical Images",
      revista: "Master's thesis, Universidad de Guanajuato",
      detalle: "Master's in Electrical Engineering (Instrumentation and Digital Systems)"
    }
  };

  window.PERFIL_EN = Object.assign({}, ES, {
    cargo: "PhD Candidate in Electrical Engineering",
    unidad: "Division of Engineering, Campus Irapuato-Salamanca",
    grupo: "Telematics and Digital Signal Processing Research Groups",
    ciudad: "Salamanca, Guanajuato, Mexico",
    actualizado: "November 2026",

    lema: "Efficient deep learning for medical image analysis.",

    bio: [
      "I am a PhD candidate in Electrical Engineering at the Universidad de Guanajuato, where I research deep learning for medical image analysis. I design lightweight, accurate models that can run in real time and on resource-constrained devices: retinal vessel segmentation, diabetic retinopathy grading, and brain tumor segmentation in magnetic resonance imaging.",
      "In my doctoral thesis I developed RA-UNet, a lightweight U-Net with reverse attention (1.94 million parameters and 208 images per second), and SABER-DR, an ordinal framework with experts at the boundaries between diabetic retinopathy severity grades. During my Master's in Electrical Engineering (Instrumentation and Digital Systems) I worked on the identification and classification of brain tumors, and I graduated with the highest grade point average in the program.",
      "I care about reproducible results: cross-validation, comparisons under equal conditions, and statistical tests (Friedman, Nemenyi, and Wilcoxon). I also co-supervise undergraduate and master's students, teach preparatory courses at the Universidad de Guanajuato, and review for <em>Expert Systems with Applications</em> and <em>Frontiers in Artificial Intelligence</em>."
    ],

    intereses: [
      "Medical image segmentation",
      "Diabetic retinopathy",
      "Brain tumors in MRI",
      "Lightweight architectures",
      "Attention mechanisms",
      "Generative adversarial networks (GANs)",
      "Ordinal classification",
      "Fractional calculus in vision",
      "Quantum machine learning"
    ],

    cifras: [
      { valor: "4",  texto: "articles in international journals (2024–2026)" },
      { valor: "5",  texto: "research projects funded by the Universidad de Guanajuato" },
      { valor: "28", texto: "reviews for Expert Systems with Applications and Frontiers in AI" },
      { valor: "3",  texto: "awards for the highest graduate grade point average" }
    ],

    // The home page shows the 6 most recent.
    noticias: [
      { fecha: "2026-11", texto: "PhD thesis defense in Electrical Engineering, Universidad de Guanajuato." },
      { fecha: "2026-10", texto: "Oral presentation of FAR-UNet at the 7th Mexican Workshop on Fractional Calculus (7MWFC-2026), Cancún." },
      { fecha: "2026",    texto: "Co-advisor of Simon Tshibengabu Kalonji's master's thesis on automatic cephalometric landmark localization with deep learning (Master's in Electrical Engineering, UG)." },
      { fecha: "2026",    texto: "Instructor of the preparatory course on Digital Electronics for applicants to the Master's in Electrical Engineering, UG." },
      { fecha: "2026-07", texto: "Published in <em>Mathematics</em>: ResGASP-GAN for low-light image enhancement." },
      { fecha: "2026-01", texto: "Published in <em>Technologies</em>: multi-scale ConvNeXt for brain tumor segmentation in multimodal MRI." },
      { fecha: "2025-11", texto: "Published in <em>Jóvenes en la Ciencia</em>: segmentation and classification of magnetic resonance images (UG Summer of Science)." },
      { fecha: "2025-07", texto: "Published in <em>Mathematics</em>: retinal vessel segmentation with a lightweight U-Net and reverse attention." },
      { fecha: "2025",    texto: "Third place in the institutional Three Minute Thesis (3MT) contest, Universidad de Guanajuato." },
      { fecha: "2024-10", texto: "Published in <em>Technologies</em>: brain tumor segmentation with a lightweight U-Net." }
    ],

    lineas: ES.lineas.map(l => Object.assign({}, l, LINEAS[l.id] || {})),
    publicaciones: ES.publicaciones.map(p => Object.assign({}, p, PUBLICACIONES[p.id] || {})),

    formacion: [
      { grado: "Ph.D. in Electrical Engineering", lugar: "Universidad de Guanajuato", periodo: "2022–2026",
        detalle: "Thesis: “Automatic Identification of Retinopathies Using Fundus Images and Deep Learning.” Advisor: Dr. Juan Gabriel Aviña Cervantes; co-advisor: Dr. José Ruiz Pinales." },
      { grado: "M.Eng. in Electrical Engineering (Instrumentation and Digital Systems)", lugar: "Universidad de Guanajuato", periodo: "2020–2022",
        detalle: "Thesis: “Identification and Classification of Brain Tumors in Biomedical Images.” Graduated with the highest grade point average in the program." }
    ],

    premios: [
      { anio: "2025", titulo: "3rd Place, Three Minute Thesis (3MT) Institutional Contest", detalle: "Universidad de Guanajuato." },
      { anio: "2025", titulo: "Academic Achievement Award", detalle: "Highest grade point average in the PhD Program in Electrical Engineering, academic year 2024–2025. Campus Irapuato-Salamanca, Universidad de Guanajuato." },
      { anio: "2023", titulo: "Academic Performance Award", detalle: "Highest grade point average in the PhD Program in Electrical Engineering, academic year 2022–2023. Campus Irapuato-Salamanca, Universidad de Guanajuato." },
      { anio: "2022", titulo: "Academic Performance Award", detalle: "Graduated with the highest grade point average in the Master's Program in Electrical Engineering (Instrumentation and Digital Systems), Universidad de Guanajuato." }
    ],

    // Funded research projects (Institutional Scientific Research Call, UG)
    proyectosInvestigacion: [
      { anio: "2026", titulo: "Cell Detection and Classification in Blood Smears to Support Acute Lymphoblastic Leukemia Screening", detalle: "Student researcher · CIIC 318/2026 · funding: $100,000 MXN" },
      { anio: "2025", titulo: "Brain Tumor Detection and Segmentation Using the ConvNeXt Architecture", detalle: "Student researcher · CIIC 163/2025 · funding: $100,000 MXN" },
      { anio: "2024", titulo: "Automatic Identification of Retinopathies Using Retinal Images and Deep Learning with Deep Convolutional Generative Adversarial Networks (DCGANs)", detalle: "Student researcher · CIIC 243/2024 · funding: $30,000 MXN" },
      { anio: "2023", titulo: "Deep Ensemble Models for Lesion Classification in Medical Images", detalle: "Student researcher · CIIC 94/2023 · funding: $30,000 MXN" },
      { anio: "2022", titulo: "Visual Quantum Transformers for the Detection of Diabetic Retinopathy and Coronary Artery Calcification from Retinal Fundus Images", detalle: "Student researcher · CIIC 171/2022 · funding: $30,000 MXN" }
    ],

    direccion: [
      { anio: "2026", titulo: "Master's thesis co-advisor", detalle: "Simon Tshibengabu Kalonji: “A Deep Learning Framework for Automatic Cephalometric Landmark Localization through Gaussian Heatmap Regression.” Master's in Electrical Engineering (Instrumentation and Digital Systems), UG." },
      { anio: "2026", titulo: "Research co-supervisor (in progress)", detalle: "Development of a ResMamba-based architecture for retinal blood vessel segmentation in fundus images. Internal Research Scholarship (undergraduate student), August–December 2026, UG." },
      { anio: "2026", titulo: "Research co-supervisor", detalle: "Biomedical image segmentation on resource-constrained devices through optimized algorithms. Internal Research Scholarship (undergraduate student), January–June 2026, UG." },
      { anio: "2026", titulo: "Research co-supervisor", detalle: "Automatic analysis of diabetic retinopathy using computer vision and deep learning. 31st Summer of Science, UG." },
      { anio: "2025", titulo: "Research co-supervisor", detalle: "Segmentation and classification of magnetic resonance images. 30th Summer of Science, UG." }
    ],

    docencia: [
      { curso: "Preparatory Course on Digital Electronics", lugar: "Applicants to the Master's in Electrical Engineering, UG", periodo: "2026–present" },
      { curso: "Undergraduate Preparatory Course", lugar: "Universidad de Guanajuato", periodo: "2026" },
      { curso: "Preparatory Course on C/C++ Programming", lugar: "Applicants to the Master's in Electrical Engineering, UG", periodo: "2024–2026" },
      { curso: "Linear Algebra", lugar: "Universidad de Guanajuato", periodo: "2025" }
    ],

    proyectos: [
      { titulo: "SABER-DR Web", texto: "Grades diabetic retinopathy on a five-level scale. Try it in your browser: the image never leaves your device.", etiqueta: "Software", enlace: "saber-dr/index.html" },
      { titulo: "SABER-DR Android", texto: "On-device classification with ONNX, with no internet connection needed.", etiqueta: "Software", enlace: "saber-dr/index.html#versiones" },
      { titulo: "Convolutional filters", texto: "Upload an image and see the 16 feature maps produced by a convolutional layer with 3×3 or 5×5 filters and ReLU or GELU activation.", etiqueta: "Demo", enlace: "convolucion/index.html" },
      { titulo: "Circuits Lab", texto: "Guided practice in electric circuits, from power and nodal/mesh analysis to RLC circuits and phasors, for Android and the web (in Spanish).", etiqueta: "Teaching", enlace: "educacion/laboratorio-circuitos/index.html" }
    ],

    revision: [
      { titulo: "Ad hoc reviewer, Expert Systems with Applications", texto: "Elsevier · 26 reviews · 2024–present" },
      { titulo: "Ad hoc reviewer, Frontiers in Artificial Intelligence", texto: "Frontiers · 2 reviews" }
    ],

    servicio: [
      { anio: "2026", titulo: "Project evaluator, Cardinal Academic Week (Spring 2026)", detalle: "Mechanical, mechatronics, and industrial engineering projects. Universidad Incarnate Word, Campus Bajío, Irapuato." },
      { anio: "2025–2026", titulo: "Organizing committee member, Young Researchers Meeting", detalle: "2025 and 2026 editions, Universidad de Colima." },
      { anio: "2025", titulo: "Organizer, 1st Technical Visits Day for PrepaTEC", detalle: "Universidad de Guanajuato." },
      { anio: "2024", titulo: "Member of eight committees of the Divisional Council of Engineering", detalle: "As a PhD student, Campus Irapuato-Salamanca: Honor and Justice; Scholarships; Monitoring of Institutional Policies and Gender-Based Violence; Special Security Committee (Yuriria site); and appointment and election processes for directors and council representatives (2024–2028 and 2024–2026 terms)." }
    ],

    divulgacion: [
      { anio: "2024", titulo: "Guest speaker: “Convolutional Neural Networks”", detalle: "Technological Week 2024, Instituto Tecnológico Superior de Purísima del Rincón." },
      { anio: "2023", titulo: "Workshop instructor, “Girls in Science Dreaming of Being Engineers”", detalle: "eUGreka Science Communication Program, Universidad de Guanajuato." },
      { anio: "2023", titulo: "Scientific outreach volunteer", detalle: "USAER 51 and Ma. Guadalupe Arroyo Primary School." },
      { anio: "2023", titulo: "Exhibitor at Hannover Messe", detalle: "Projects “Robot Nao” and “Leap Motion Sensor” at the Universidad de Guanajuato stand, León." }
    ],

    habilidades: [
      { area: "Languages", texto: "Spanish (native), English (intermediate)." },
      { area: "Programming", texto: "Python, MATLAB/Simulink, LaTeX (TikZ, Beamer), Git/GitHub." },
      { area: "AI & vision", texto: "PyTorch; medical image segmentation and classification; CNNs, attention mechanisms, and GANs; statistical model comparison (Friedman, Nemenyi, and Wilcoxon tests)." }
    ],

    // Contact form topics
    asuntosContacto: ["Research collaboration", "Students and theses", "Peer review or editorial work", "Other"]
  });
})();
