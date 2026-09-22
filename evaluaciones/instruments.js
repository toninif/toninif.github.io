// Las versiones se conservan en cada evaluación. No modificar protocolos históricos.
(function (root) {
  const intakeFields = [
    ['reason', '¿Qué te trae a consulta en este momento?', true],
    ['onset', '¿Desde cuándo te pasa y cómo fue cambiando?', false],
    ['impact', '¿Cómo afecta tu vida cotidiana, tus vínculos o tu trabajo/estudio?', false],
    ['expectations', '¿Qué te gustaría lograr con este espacio?', false],
    ['previous_care', '¿Hiciste tratamientos psicológicos o psiquiátricos antes? ¿Cómo fue la experiencia?', false],
    ['medication', '¿Tomás medicación actualmente? Si querés, indicá cuál.', false],
    ['health', '¿Hay antecedentes de salud que consideres importante compartir?', false],
    ['support', '¿Con qué personas o recursos contás cuando necesitás apoyo?', false],
    ['other', '¿Hay algo más que quieras que tu profesional sepa?', false]
  ].map(([key, label, required]) => ({ key, label, required }));
  const instruments = {
    INTAKE: {
      instrument: 'INTAKE', version: 'intake-1', name: 'Formulario inicial', minutes: 8,
      description: 'Motivo de consulta, expectativas, antecedentes y apoyos. Sin puntaje.',
      instructions: 'Contá lo que te resulte importante compartir. Solo el motivo de consulta es obligatorio; el resto podés conversarlo en sesión.',
      fields: intakeFields, citation: 'Formulario clínico propio, versión 1. No es un test psicométrico.'
    },
    PHQ9: {
      instrument: 'PHQ9', version: 'phq9-msal-2025', name: 'Síntomas depresivos (PHQ-9)', minutes: 4,
      description: '9 ítems sobre las últimas dos semanas y una pregunta sobre dificultad cotidiana. Adultos.',
      instructions: 'Durante las últimas 2 semanas, ¿con qué frecuencia sintió molestias por los siguientes problemas?',
      questions: [
        'Poco interés o placer en hacer cosas',
        'Sentirse decaído, deprimido, o desesperanzado',
        'Dificultad para dormir o permanecer dormido o dormir demasiado',
        'Sentirse cansado, o con poca energía',
        'Con poco apetito o comer demasiado',
        'Sentirse mal consigo mismo o sentir que uno es un fracaso o que le ha fallado a su familia o a sí mismo',
        'Dificultad para concentrarse en cosas, tales como leer el diario o ver la televisión',
        '¿Se ha movido o hablado más lentamente que otras personas lo notaron? O por el contrario ¿ha estado más inquieto, intranquilo, moviéndose más de lo habitual?',
        'Pensamientos de que usted estaría mejor muerto, o de hacerse daño a sí mismo de alguna manera'
      ],
      options: ['Ningún día', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'],
      response_min: 0, response_max: 3,
      difficulty_question: 'Si marcó alguno de los problemas antes indicados en este cuestionario, ¿cuánto le han dificultado al realizar su trabajo, atender su casa o compartir con los demás?',
      difficulty_options: ['Nada difícil', 'Poco difícil', 'Muy difícil', 'Extremadamente difícil'],
      citation: 'PHQ-9: Spitzer, Williams y Kroenke. Texto: Ministerio de Salud de la Nación, Manual para el cuidado de personas con enfermedades no transmisibles (2025), p. 152. Evidencia argentina: Urtasun et al. (2019), doi:10.1186/s12888-019-2262-9.',
      source: 'https://www.argentina.gob.ar/sites/default/files/manualcuidadoent4_-1-.pdf',
      evidence_note: 'Se conserva el texto publicado por el Ministerio. El estudio de Urtasun incluyó 169 adultos de 21 años o más en atención ambulatoria; no se atribuye una nueva validación a esta aplicación digital.'
    },
    SWLS: {
      instrument: 'SWLS', version: 'swls-legacy-1', name: 'Satisfacción con la vida (SWLS)', minutes: 2,
      description: '5 ítems, puntaje 5–35. Versión lingüística previa: pendiente de cotejo para uso clínico.',
      instructions: 'Indicá cuánto estás de acuerdo con cada afirmación.',
      questions: [
        'En la mayoría de los aspectos, mi vida se acerca a mi ideal.',
        'Las condiciones de mi vida son excelentes.',
        'Estoy satisfecho/a con mi vida.',
        'Hasta ahora he conseguido las cosas importantes que quiero en la vida.',
        'Si pudiera vivir mi vida de nuevo, no cambiaría casi nada.'
      ],
      options: ['Muy en desacuerdo', 'En desacuerdo', 'Algo en desacuerdo', 'Ni de acuerdo ni en desacuerdo', 'Algo de acuerdo', 'De acuerdo', 'Muy de acuerdo'],
      response_min: 1, response_max: 7,
      citation: 'Diener, Emmons, Larsen y Griffin (1985). Texto previo de la plataforma: no identificado como adaptación argentina validada.',
      evidence_note: 'Mikulic, Crespi y Caballero (2019) publicaron una adaptación en adultos de Buenos Aires con diferencias de redacción. Uso de SWLS: revisar condiciones vigentes para fines comerciales.',
      source: 'https://eddiener.com/satisfaction-with-life-scale-swls/'
    }
  };
  function validateAnswers(config, answers) {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw new Error('Respuestas inválidas.');
    if (config.instrument === 'INTAKE') {
      const allowed = new Set(config.fields.map(f => f.key));
      if (Object.keys(answers).some(key => !allowed.has(key))) throw new Error('Campo desconocido.');
      for (const field of config.fields) {
        const value = answers[field.key];
        if (value !== undefined && (typeof value !== 'string' || value.length > 3000)) throw new Error('Cada respuesta admite hasta 3000 caracteres.');
        if (field.required && !value?.trim()) throw new Error('Completá el motivo de consulta.');
      }
      return null;
    }
    const count = config.instrument === 'PHQ9' ? 9 : 5;
    const allowed = new Set(Array.from({length: count}, (_, i) => `item_${i + 1}`));
    if (config.instrument === 'PHQ9') allowed.add('difficulty');
    if (Object.keys(answers).some(key => !allowed.has(key))) throw new Error('Respuesta desconocida.');
    let total = 0;
    for (let i = 1; i <= count; i++) {
      const value = answers[`item_${i}`];
      if (!Number.isInteger(value) || value < config.response_min || value > config.response_max) throw new Error('Respondé todos los ítems con una opción válida.');
      total += value;
    }
    if (config.instrument === 'PHQ9' && (total > 0 || answers.difficulty !== undefined)) {
      if (!Number.isInteger(answers.difficulty) || answers.difficulty < 0 || answers.difficulty > 3) throw new Error('Indicá cuánto dificultaron estos problemas tu vida cotidiana.');
    }
    return { total, min: count * config.response_min, max: count * config.response_max, instrument: config.instrument, version: config.version, attention_required: config.instrument === 'PHQ9' && answers.item_9 > 0 };
  }
  root.EvaluationInstruments = { instruments, validateAnswers };
  if (typeof module !== 'undefined') module.exports = root.EvaluationInstruments;
})(typeof window !== 'undefined' ? window : globalThis);
