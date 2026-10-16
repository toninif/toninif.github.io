// Psychological sequences are separate from the illustrative neural routes in data.js.
const lessons = {
  james: {
    tag: 'El cuerpo primero', title: 'Sentimos al percibir los cambios del cuerpo.',
    takeaway: 'La percepción de la respuesta corporal constituye la experiencia emocional.',
    dimensions: ['Es constitutivo: percibir sus cambios da lugar a la emoción.', 'La explicación no exige una etiqueta cognitiva contextual.', 'La experiencia sigue a los cambios corporales.'],
    stages: [
      {title:'Percibir', kind:'stimulus', text:'Un acontecimiento del entorno desencadena el proceso.', example:'Escucho un ruido detrás de mí.', regions:['s-cortex-assoc'], view:'lateral', neuro:1},
      {title:'El cuerpo responde', kind:'body', text:'Se producen cambios corporales y tendencias de respuesta antes de la experiencia emocional.', example:'Mi corazón se acelera y mi cuerpo se tensa.', regions:['s-sna'], view:'medial', neuro:2},
      {title:'Percibir el cuerpo', kind:'body', text:'La percepción de esos cambios corporales ocupa el lugar central en esta explicación.', example:'Noto mis latidos, mi tensión y mi respiración.', regions:['s-insula','s-somato'], view:'lateral', neuro:3},
      {title:'Sentir la emoción', kind:'feeling', text:'La experiencia emocional surge al sentir la respuesta corporal. Las regiones mostradas son asociaciones didácticas posteriores.', example:'Siento miedo al percibir cómo está reaccionando mi cuerpo.', regions:['s-insula','s-somato'], view:'lateral', neuro:4}
    ]
  },
  cannon: {
    tag:'Dos respuestas en paralelo', title:'La emoción y la respuesta corporal se generan en paralelo.',
    takeaway:'El cambio corporal no necesita causar la experiencia emocional: ambos pueden resultar del procesamiento central.',
    dimensions:['Acompaña a la emoción; no es su causa necesaria.', 'El énfasis está en el procesamiento central.', 'Experiencia y respuesta corporal en paralelo.'],
    stages:[
      {title:'Percibir',kind:'stimulus',text:'El estímulo inicia el procesamiento sensorial.',example:'Escucho el ruido detrás de mí.',regions:['s-thalamus'],view:'medial',neuro:0},
      {title:'Procesamiento central',kind:'processing',text:'Cannon y Bard atribuyen un papel central a mecanismos diencefálicos, con distinto énfasis en tálamo e hipotálamo.',example:'El estímulo desencadena una respuesta central.',regions:['s-thalamus','s-hypothalamus'],view:'medial',neuro:1},
      {title:'Dos respuestas',kind:'feeling',branches:[{title:'Respuesta corporal',kind:'body'},{title:'Experiencia emocional',kind:'feeling'}],text:'Se generan en paralelo la experiencia emocional y los cambios corporales. La simultaneidad expresa la relación del modelo, no una medición exacta de tiempos.',example:'Siento miedo y mi corazón se acelera.',regions:['s-hypothalamus','s-sna','s-cortex-assoc'],view:'medial',neuro:3}
    ]
  },
  arnold: {
    tag:'Evaluar para sentir',title:'El significado del estímulo orienta la emoción y la acción.',
    takeaway:'La evaluación puede ser rápida e intuitiva: no requiere una reflexión deliberada.',
    dimensions:['Participa en la tendencia a actuar.', 'Evalúa si algo es beneficioso o perjudicial para la persona.', 'Percepción → evaluación → tendencia a la acción.'],
    stages:[
      {title:'Percibir',kind:'stimulus',text:'Percibimos un objeto o acontecimiento del entorno.',example:'Escucho un ruido y me doy vuelta.',regions:['s-cortex-assoc'],view:'lateral',neuro:1},
      {title:'Evaluar',kind:'appraisal',text:'Una evaluación intuitiva establece qué significa el estímulo para la persona, en relación con su situación y experiencia.',example:'Ese ruido parece una amenaza para mí.',regions:['s-amygdala','s-hippocampus'],view:'medial',neuro:2},
      {title:'Valorar',kind:'appraisal',text:'La valoración de algo como favorable o perjudicial orienta el acercamiento o la evitación. Aquí se descompone la evaluación para estudiarla.',example:'Me conviene alejarme de lo que produjo el ruido.',regions:['s-vmpfc'],view:'medial',neuro:3},
      {title:'Emoción y acción',kind:'feeling',text:'La emoción se vincula con una tendencia sentida a acercarse o alejarse. El cuerpo participa de esa disposición.',example:'Siento miedo y una tendencia a apartarme.',regions:['s-vmpfc','s-sna'],view:'medial',neuro:4}
    ]
  },
  schachter: {
    tag:'Una emoción, dos factores',title:'La activación y su interpretación dan forma a la emoción.',
    takeaway:'Una activación semejante puede vivirse de distintas maneras según cómo se interprete la situación.',
    dimensions:['Aporta activación fisiológica relativamente inespecífica.', 'El contexto ayuda a atribuir una etiqueta a la activación.', 'Activación + interpretación → experiencia emocional.'],
    stages:[
      {title:'Una situación',kind:'stimulus',text:'La situación ofrece estímulos y pistas para interpretar lo que ocurre.',example:'Escucho un ruido detrás de mí.',regions:['s-cortex-assoc'],view:'lateral',neuro:0},
      {title:'Dos factores',kind:'appraisal',branches:[{title:'Activación corporal',kind:'body'},{title:'Interpretación del contexto',kind:'appraisal'}],text:'La persona experimenta activación y utiliza la información disponible para darle una explicación. El modelo combina ambos factores.',example:'Mi corazón late rápido. Estoy solo, de noche: interpreto que hay peligro.',regions:['s-sna','s-insula','s-acc','s-dlpfc'],view:'lateral',neuro:4},
      {title:'Emoción etiquetada',kind:'feeling',text:'La interpretación contribuye a la cualidad de la emoción. El ejemplo ilustra el modelo; no reproduce el experimento original.',example:'Interpreto mi activación como miedo. En otro contexto podría vivirla como excitación.',regions:['s-insula','s-dlpfc'],view:'lateral',neuro:4}
    ]
  },
  zajonc: {
    tag:'La primacía del afecto',title:'Podemos reaccionar afectivamente sin una elaboración cognitiva previa.',
    takeaway:'No toda reacción afectiva necesita un reconocimiento consciente o una inferencia elaborada previa.',
    dimensions:['Puede participar en una reacción afectiva rápida.', 'La cognición elaborada no es un requisito de toda reacción afectiva.', 'El afecto puede preceder a la elaboración cognitiva.'],
    stages:[
      {title:'Un estímulo',kind:'stimulus',text:'Un estímulo puede provocar una reacción afectiva aun sin un análisis elaborado de sus características.',example:'Algo suena detrás de mí.',regions:['s-thalamus'],view:'medial',neuro:1},
      {title:'Reacción afectiva',kind:'feeling',text:'La propuesta de primacía afectiva cuestiona que toda reacción necesite una inferencia previa. La ruta tálamo-amígdala es una ilustración posterior, no una vía formulada por Zajonc.',example:'El ruido me resulta desagradable antes de saber qué lo produjo.',regions:['s-amygdala'],view:'medial',neuro:2},
      {title:'Respuesta',kind:'body',text:'La reacción puede acompañarse de una respuesta corporal o de orientación.',example:'Me sobresalto y giro la cabeza.',regions:['s-amygdala','s-sna'],view:'medial',neuro:3},
      {title:'Elaboración posterior',kind:'appraisal',text:'Puede aparecer después un procesamiento más elaborado. Esta secuencia es una posibilidad ilustrativa, no un orden obligatorio para toda emoción.',example:'Ahora reconozco que fue una puerta que se cerró.',regions:['s-cortex-assoc'],view:'lateral',neuro:4}
    ]
  },
  lazarus: {
    tag:'Lo que está en juego para mí',title:'La emoción depende de cómo evaluamos nuestra relación con la situación.',
    takeaway:'Evaluar no equivale a pensar conscientemente. El significado personal y los recursos de afrontamiento son centrales.',
    dimensions:['Forma parte de la respuesta emocional organizada.', 'La evaluación del significado es necesaria; puede ser automática.', 'La evaluación organiza la respuesta y puede revisarse.'],
    stages:[
      {title:'Una situación',kind:'stimulus',text:'El acontecimiento se considera en relación con la persona, sus metas y su bienestar.',example:'Escucho el ruido estando solo.',regions:['s-thalamus'],view:'medial',neuro:0},
      {title:'¿Qué está en juego?',kind:'appraisal',text:'La evaluación primaria se refiere a la relevancia del acontecimiento para el bienestar: daño, amenaza o desafío, entre otras posibilidades.',example:'¿Es una amenaza? ¿Puede pasarme algo?',regions:['s-amygdala','s-vmpfc'],view:'medial',neuro:2},
      {title:'¿Qué puedo hacer?',kind:'appraisal',text:'La evaluación secundaria considera opciones y recursos de afrontamiento. Primaria y secundaria se distinguen por su función, no por un orden temporal rígido.',example:'Puedo mirar, pedir ayuda o alejarme.',regions:['s-acc','s-dlpfc'],view:'lateral',neuro:4},
      {title:'Respuesta integrada',kind:'feeling',text:'El significado evaluado organiza emoción y afrontamiento. Nueva información puede modificar la evaluación.',example:'Siento miedo y busco protección. Al ver la puerta, reevalúo lo ocurrido.',regions:['s-vmpfc','s-sna'],view:'medial',neuro:5}
    ]
  }
};

// Coordinates are schematic anchors, not measurements or exact anatomical boundaries.
const mapRegions = {
  's-stimulus': {short:'Estímulo', point:[55,74], label:[55,47], views:['medial','lateral']},
  's-thalamus': {short:'Tálamo', point:[282,185], label:[328,164], views:['medial']},
  's-hypothalamus': {short:'Hipotálamo', point:[278,221], label:[350,235], views:['medial']},
  's-amygdala': {short:'Amígdala', point:[224,242], label:[156,276], views:['medial']},
  's-hippocampus': {short:'Hipocampo', point:[270,260], label:[318,296], views:['medial']},
  's-insula': {short:'Ínsula (profunda)', point:[247,210], label:[225,293], views:['lateral']},
  's-vmpfc': {short:'vmPFC / OFC', point:[139,207], label:[90,252], views:['medial']},
  's-acc': {short:'Cingulada anterior', point:[219,137], label:[163,93], views:['medial']},
  's-dlpfc': {short:'Prefrontal dorsolateral', point:[151,142], label:[124,84], views:['lateral']},
  's-somato': {short:'Somatosensorial', point:[285,119], label:[308,68], views:['lateral']},
  's-cortex-assoc': {short:'Asociativa posterior', point:[378,157], label:[420,104], views:['lateral']},
  's-sna': {short:'Cuerpo · SNA y vísceras', point:[420,329], label:[410,358], views:['medial','lateral']}
};
