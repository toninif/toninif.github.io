const positions = {
  "s-stimulus":     [55, 245],
  "s-thalamus":     [395, 235],
  "s-hypothalamus": [378, 278],
  "s-amygdala":     [320, 285],
  "s-hippocampus":  [288, 308],
  "s-insula":       [237, 240],
  "s-vmpfc":        [175, 245],
  "s-acc":          [335, 158],
  "s-dlpfc":        [232, 128],
  "s-somato":       [465, 122],
  "s-cortex-assoc": [582, 158],
  "s-sna":          [610, 466]
};

const labelPositions = {
  "s-stimulus":     { lx: 55,  ly: 290, anchor: "middle", title: "Estímulo" },
  "s-thalamus":     { lx: 395, ly: 220, anchor: "middle", title: "Tálamo" },
  "s-hypothalamus": { lx: 410, ly: 305, anchor: "start",  title: "Hipotálamo" },
  "s-amygdala":     { lx: 320, ly: 325, anchor: "middle", title: "Amígdala" },
  "s-hippocampus":  { lx: 320, ly: 350, anchor: "start",  title: "Hipocampo" },
  "s-insula":       { lx: 215, ly: 285, anchor: "middle", title: "Ínsula" },
  "s-vmpfc":        { lx: 95,  ly: 310, anchor: "middle", title: "vmPFC / OFC" },
  "s-acc":          { lx: 335, ly: 195, anchor: "middle", title: "ACC" },
  "s-dlpfc":        { lx: 232, ly: 95,  anchor: "middle", title: "dlPFC" },
  "s-somato":       { lx: 465, ly: 92,  anchor: "middle", title: "Somatosensorial" },
  "s-cortex-assoc": { lx: 615, ly: 110, anchor: "middle", title: "Asociativa post." }
};

const theories = {
  james: {
    name: "James-Lange",
    year: "1884-1885",
    claim: "La emoción surge de la percepción de cambios corporales. La vía es esencialmente aferente: del cuerpo al cerebro. No lloramos porque estamos tristes. Estamos tristes porque lloramos.",
    flowDuration: 2.4,
    steps: [
      { structs: ["s-stimulus"], paths: [], label: "Estímulo" },
      { structs: ["s-stimulus", "s-somato"], paths: [["s-stimulus", "s-somato"]], label: "Percepción sensorial" },
      { structs: ["s-stimulus", "s-somato", "s-sna"], paths: [["s-stimulus", "s-somato"], ["s-somato", "s-sna"]], label: "Respuesta corporal" },
      { structs: ["s-stimulus", "s-somato", "s-sna", "s-insula"], paths: [["s-stimulus", "s-somato"], ["s-somato", "s-sna"], ["s-sna", "s-insula"]], label: "Aferencias viscerales a ínsula" },
      { structs: ["s-stimulus", "s-somato", "s-sna", "s-insula", "s-cortex-assoc"], paths: [["s-stimulus", "s-somato"], ["s-somato", "s-sna"], ["s-sna", "s-insula"], ["s-insula", "s-cortex-assoc"]], label: "Experiencia emocional" }
    ]
  },
  cannon: {
    name: "Cannon-Bard",
    year: "1927-1928",
    claim: "Procesamiento central en tálamo (e hipotálamo según Bard). Dos vías paralelas e independientes: experiencia consciente y respuesta corporal se generan al mismo tiempo, no una como causa de la otra.",
    flowDuration: 2.4,
    steps: [
      { structs: ["s-stimulus"], paths: [], label: "Estímulo" },
      { structs: ["s-stimulus", "s-thalamus"], paths: [["s-stimulus", "s-thalamus"]], label: "Tálamo recibe y distribuye" },
      { structs: ["s-stimulus", "s-thalamus", "s-cortex-assoc", "s-hypothalamus"], paths: [["s-stimulus", "s-thalamus"], ["s-thalamus", "s-cortex-assoc"], ["s-thalamus", "s-hypothalamus"]], label: "Vías paralelas" },
      { structs: ["s-stimulus", "s-thalamus", "s-cortex-assoc", "s-hypothalamus", "s-sna"], paths: [["s-stimulus", "s-thalamus"], ["s-thalamus", "s-cortex-assoc"], ["s-thalamus", "s-hypothalamus"], ["s-hypothalamus", "s-sna"]], label: "Experiencia + respuesta simultáneas" }
    ]
  },
  arnold: {
    name: "Arnold",
    year: "1960",
    claim: "Sin appraisal no hay emoción. Una evaluación rápida e intuitiva del significado del estímulo determina qué emoción se genera. La evaluación produce una tendencia a la acción, que es la emoción misma.",
    flowDuration: 2.6,
    steps: [
      { structs: ["s-stimulus"], paths: [], label: "Estímulo" },
      { structs: ["s-stimulus", "s-cortex-assoc"], paths: [["s-stimulus", "s-cortex-assoc"]], label: "Percepción del objeto" },
      { structs: ["s-stimulus", "s-cortex-assoc", "s-amygdala", "s-hippocampus"], paths: [["s-stimulus", "s-cortex-assoc"], ["s-cortex-assoc", "s-amygdala"], ["s-amygdala", "s-hippocampus"]], label: "Appraisal" },
      { structs: ["s-stimulus", "s-cortex-assoc", "s-amygdala", "s-hippocampus", "s-vmpfc"], paths: [["s-stimulus", "s-cortex-assoc"], ["s-cortex-assoc", "s-amygdala"], ["s-amygdala", "s-hippocampus"], ["s-amygdala", "s-vmpfc"]], label: "Evaluación de valor" },
      { structs: ["s-stimulus", "s-cortex-assoc", "s-amygdala", "s-hippocampus", "s-vmpfc", "s-sna"], paths: [["s-stimulus", "s-cortex-assoc"], ["s-cortex-assoc", "s-amygdala"], ["s-amygdala", "s-hippocampus"], ["s-amygdala", "s-vmpfc"], ["s-vmpfc", "s-sna"]], label: "Tendencia a la acción + emoción" }
    ]
  },
  schachter: {
    name: "Schachter-Singer",
    year: "1962",
    claim: "Activación fisiológica inespecífica más etiqueta cognitiva. La activación da intensidad. La interpretación contextual da cualidad. La misma activación puede generar distintas emociones según cómo se interprete.",
    flowDuration: 2.6,
    steps: [
      { structs: ["s-stimulus"], paths: [], label: "Estímulo" },
      { structs: ["s-stimulus", "s-hypothalamus", "s-sna"], paths: [["s-stimulus", "s-hypothalamus"], ["s-hypothalamus", "s-sna"]], label: "Activación fisiológica" },
      { structs: ["s-stimulus", "s-hypothalamus", "s-sna", "s-insula"], paths: [["s-stimulus", "s-hypothalamus"], ["s-hypothalamus", "s-sna"], ["s-sna", "s-insula"]], label: "Percepción del arousal" },
      { structs: ["s-stimulus", "s-hypothalamus", "s-sna", "s-insula", "s-acc"], paths: [["s-stimulus", "s-hypothalamus"], ["s-hypothalamus", "s-sna"], ["s-sna", "s-insula"], ["s-insula", "s-acc"]], label: "Búsqueda de explicación" },
      { structs: ["s-stimulus", "s-hypothalamus", "s-sna", "s-insula", "s-acc", "s-dlpfc"], paths: [["s-stimulus", "s-hypothalamus"], ["s-hypothalamus", "s-sna"], ["s-sna", "s-insula"], ["s-insula", "s-acc"], ["s-acc", "s-dlpfc"]], label: "Etiqueta cognitiva" }
    ]
  },
  zajonc: {
    name: "Zajonc",
    year: "1980",
    claim: "Primacía afectiva. La vía rápida tálamo-amígdala procesa la emoción antes (o sin) cognición elaborada. Sentimos antes de pensar. Las preferencias no requieren inferencias.",
    flowDuration: 1.4,
    steps: [
      { structs: ["s-stimulus"], paths: [], label: "Estímulo" },
      { structs: ["s-stimulus", "s-thalamus"], paths: [["s-stimulus", "s-thalamus"]], label: "Tálamo" },
      { structs: ["s-stimulus", "s-thalamus", "s-amygdala"], paths: [["s-stimulus", "s-thalamus"], ["s-thalamus", "s-amygdala"]], label: "Vía baja: tálamo-amígdala" },
      { structs: ["s-stimulus", "s-thalamus", "s-amygdala", "s-sna"], paths: [["s-stimulus", "s-thalamus"], ["s-thalamus", "s-amygdala"], ["s-amygdala", "s-sna"]], label: "Respuesta afectiva inmediata" },
      { structs: ["s-stimulus", "s-thalamus", "s-amygdala", "s-sna", "s-cortex-assoc"], paths: [["s-stimulus", "s-thalamus"], ["s-thalamus", "s-amygdala"], ["s-amygdala", "s-sna"], ["s-thalamus", "s-cortex-assoc"]], label: "Vía alta (cognición posterior)" }
    ]
  },
  lazarus: {
    name: "Lazarus",
    year: "1982",
    claim: "Toda emoción requiere appraisal, aunque sea automática y no consciente. La evaluación opera en múltiples niveles. Primero relevancia y valencia. Después significado y recursos de afrontamiento.",
    flowDuration: 2.8,
    steps: [
      { structs: ["s-stimulus"], paths: [], label: "Estímulo" },
      { structs: ["s-stimulus", "s-thalamus", "s-amygdala"], paths: [["s-stimulus", "s-thalamus"], ["s-thalamus", "s-amygdala"]], label: "Appraisal primaria automática" },
      { structs: ["s-stimulus", "s-thalamus", "s-amygdala", "s-vmpfc"], paths: [["s-stimulus", "s-thalamus"], ["s-thalamus", "s-amygdala"], ["s-amygdala", "s-vmpfc"]], label: "Significado y valor" },
      { structs: ["s-stimulus", "s-thalamus", "s-amygdala", "s-vmpfc", "s-acc"], paths: [["s-stimulus", "s-thalamus"], ["s-thalamus", "s-amygdala"], ["s-amygdala", "s-vmpfc"], ["s-vmpfc", "s-acc"]], label: "Integración afectivo-cognitiva" },
      { structs: ["s-stimulus", "s-thalamus", "s-amygdala", "s-vmpfc", "s-acc", "s-dlpfc"], paths: [["s-stimulus", "s-thalamus"], ["s-thalamus", "s-amygdala"], ["s-amygdala", "s-vmpfc"], ["s-vmpfc", "s-acc"], ["s-acc", "s-dlpfc"]], label: "Appraisal secundaria" },
      { structs: ["s-stimulus", "s-thalamus", "s-amygdala", "s-vmpfc", "s-acc", "s-dlpfc", "s-sna"], paths: [["s-stimulus", "s-thalamus"], ["s-thalamus", "s-amygdala"], ["s-amygdala", "s-vmpfc"], ["s-vmpfc", "s-acc"], ["s-acc", "s-dlpfc"], ["s-dlpfc", "s-sna"]], label: "Respuesta integrada" }
    ]
  }
};

const glossary = [
  {
    id: "s-thalamus",
    name: "Tálamo",
    color: "#D85A30",
    role: "Centro de relevo sensorial. Distribuye información a corteza y subcorteza. Cannon le asignó el rol central en su teoría.",
    ref: "Sherman, S. M. (2007). The thalamus is more than just a relay. Current Opinion in Neurobiology, 17(4), 417-422."
  },
  {
    id: "s-hypothalamus",
    name: "Hipotálamo",
    color: "#F0997B",
    role: "Controla el sistema nervioso autónomo y el eje endocrino. Bard demostró su papel en la respuesta de rabia simulada en gatos descerebrados.",
    ref: "Bard, P. (1928). A diencephalic mechanism for the expression of rage. American Journal of Physiology, 84, 490-515."
  },
  {
    id: "s-amygdala",
    name: "Amígdala",
    color: "#D4537E",
    role: "Núcleo del procesamiento afectivo rápido. Detecta relevancia emocional, valencia y amenaza. LeDoux describió la vía baja tálamo-amígdala que opera sin pasar por la corteza.",
    ref: "LeDoux, J. E. (1996). The emotional brain. Simon & Schuster."
  },
  {
    id: "s-hippocampus",
    name: "Hipocampo",
    color: "#ED93B1",
    role: "Memoria contextual y declarativa. Integra el estímulo presente con experiencias previas. Arnold le dio un rol importante en la appraisal.",
    ref: "Eichenbaum, H. (2017). Memory: Organization and control. Annual Review of Psychology, 68, 19-45."
  },
  {
    id: "s-insula",
    name: "Ínsula",
    color: "#1D9E75",
    role: "Sustrato neural de la interocepción. Percibe estados corporales internos. Es la actualización contemporánea de las intuiciones de James sobre el rol de las aferencias viscerales.",
    ref: "Craig, A. D. (2009). How do you feel — now? Nature Reviews Neuroscience, 10(1), 59-70."
  },
  {
    id: "s-vmpfc",
    name: "Corteza ventromedial y orbitofrontal",
    color: "#7F77DD",
    role: "Evaluación de valor y significado afectivo. Toma de decisiones con carga emocional. Damasio la integró en su hipótesis del marcador somático.",
    ref: "Damasio, A. R. (1996). The somatic marker hypothesis. Philosophical Transactions of the Royal Society B, 351, 1413-1420."
  },
  {
    id: "s-acc",
    name: "Corteza cingulada anterior (ACC)",
    color: "#AFA9EC",
    role: "Integración afectivo-cognitiva. Monitoreo de conflicto y regulación emocional. Punto de encuentro entre procesamiento afectivo y control cognitivo.",
    ref: "Etkin, A., Egner, T., & Kalisch, R. (2011). Emotional processing in anterior cingulate and medial prefrontal cortex. Trends in Cognitive Sciences, 15(2), 85-93."
  },
  {
    id: "s-dlpfc",
    name: "Corteza prefrontal dorsolateral (dlPFC)",
    color: "#378ADD",
    role: "Appraisal secundaria. Evaluación de recursos de afrontamiento y control cognitivo. Central en los modelos de Lazarus y en la regulación emocional.",
    ref: "Ochsner, K. N., & Gross, J. J. (2005). The cognitive control of emotion. Trends in Cognitive Sciences, 9(5), 242-249."
  },
  {
    id: "s-somato",
    name: "Corteza somatosensorial",
    color: "#5DCAA5",
    role: "Recibe aferencias propioceptivas e interoceptivas del cuerpo. James la consideraría parte del sustrato de la experiencia emocional vía retroalimentación corporal.",
    ref: "Adolphs, R. (2002). Recognizing emotion from facial expressions. Behavioral and Cognitive Neuroscience Reviews, 1(1), 21-62."
  },
  {
    id: "s-cortex-assoc",
    name: "Corteza asociativa posterior",
    color: "#CECBF6",
    role: "Procesamiento perceptivo elaborado. Reconocimiento e integración multimodal del estímulo.",
    ref: "Mesulam, M. M. (1998). From sensation to cognition. Brain, 121(6), 1013-1052."
  },
  {
    id: "s-sna",
    name: "Sistema nervioso autónomo y vísceras",
    color: "#D85A30",
    role: "Sustrato de la respuesta fisiológica. Cannon describió el patrón simpático-adrenomedular de lucha o huida. Vasoconstricción periférica en miedo, vasodilatación en ira.",
    ref: "Cannon, W. B. (1929). Bodily changes in pain, hunger, fear and rage. Appleton."
  }
];
