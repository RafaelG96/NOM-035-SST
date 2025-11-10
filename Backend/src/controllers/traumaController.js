const TraumaCuestionario = require('../models/traumaModel');

exports.guardarCuestionario = async (req, res) => {
  try {
    console.log('📥 Datos recibidos en el backend:', {
      body: req.body,
      empresa: req.body.empresa,
      tipoEmpresa: typeof req.body.empresa,
      respuestasCount: req.body.respuestas?.length
    });

    const { empresa, respuestas } = req.body;
    
    // Validaciones mejoradas - el nombre de empresa es opcional pero recomendado
    let empresaTrimmed = '';
    
    if (empresa) {
      empresaTrimmed = typeof empresa === 'string' ? empresa.trim() : String(empresa).trim();
      
      // Si se proporciona un nombre, debe tener al menos 1 carácter
      if (empresaTrimmed.length === 0) {
        console.warn('⚠️ Advertencia: empresa proporcionado pero está vacío, se usará "Sin especificar"');
        empresaTrimmed = 'Sin especificar';
      } else if (empresaTrimmed.length > 200) {
        // Truncar si es muy largo
        empresaTrimmed = empresaTrimmed.substring(0, 200);
        console.warn('⚠️ Advertencia: nombre de empresa truncado a 200 caracteres');
      }
    } else {
      // Si no se proporciona nombre, usar un valor por defecto
      console.warn('⚠️ Advertencia: empresa no proporcionado, se usará "Sin especificar"');
      empresaTrimmed = 'Sin especificar';
    }

    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      console.error('❌ Error: respuestas no válidas');
      return res.status(400).json({
        success: false,
        error: 'Las respuestas son requeridas',
        received: { respuestas: req.body.respuestas, type: typeof req.body.respuestas }
      });
    }

    // Generar identificador anónimo único
    const identificadorAnonimo = `anon-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Lógica de evaluación (sin cambios)
    const seccionI = respuestas.filter(r => r.pregunta.match(/^q[1-6]$/));
    const seccionII = respuestas.filter(r => r.pregunta.match(/^q[7-8]$/));
    const seccionIII = respuestas.filter(r => r.pregunta.match(/^q(9|1[0-5])$/));
    const seccionIV = respuestas.filter(r => r.pregunta.match(/^q(1[6-9]|20)$/));
    
    const anyYesInSectionI = seccionI.some(r => r.respuesta === 'si');
    const yesInSectionII = seccionII.filter(r => r.respuesta === 'si').length;
    const yesInSectionIII = seccionIII.filter(r => r.respuesta === 'si').length;
    const yesInSectionIV = seccionIV.filter(r => r.respuesta === 'si').length;
    
    let requiereEvaluacion = false;
    const razonesEvaluacion = [];
    
    if (anyYesInSectionI) {
      if (yesInSectionII > 0) {
        requiereEvaluacion = true;
        razonesEvaluacion.push(`Sección II: ${yesInSectionII} respuestas positivas`);
      }
      
      if (yesInSectionIII >= 3) {
        requiereEvaluacion = true;
        razonesEvaluacion.push(`Sección III: ${yesInSectionIII} respuestas positivas`);
      }
      
      if (yesInSectionIV >= 2) {
        requiereEvaluacion = true;
        razonesEvaluacion.push(`Sección IV: ${yesInSectionIV} respuestas positivas`);
      }
    }

    // Usar el nombre de empresa ya validado y recortado
    const cuestionario = new TraumaCuestionario({
      empresa: empresaTrimmed,
      respuestas,
      requiereEvaluacion,
      razonesEvaluacion,
      identificadorAnonimo,
      recomendaciones: generarRecomendaciones(respuestas, requiereEvaluacion)
    });

    await cuestionario.save();

    console.log('✅ Cuestionario guardado exitosamente:', {
      id: cuestionario._id,
      empresa: cuestionario.empresa,
      identificadorAnonimo: cuestionario.identificadorAnonimo,
      requiereEvaluacion: cuestionario.requiereEvaluacion
    });

    res.status(201).json({
      success: true,
      identificadorAnonimo: cuestionario.identificadorAnonimo,
      requiereEvaluacion: cuestionario.requiereEvaluacion,
      razonesEvaluacion: cuestionario.razonesEvaluacion,
      empresa: cuestionario.empresa,
      cuestionarioId: cuestionario._id,
      recomendaciones: cuestionario.recomendaciones
    });

  } catch (error) {
    console.error('Error al guardar cuestionario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el cuestionario'
    });
  }
};

exports.obtenerResultados = async (req, res) => {
  try {
    const { empresa, identificadorAnonimo, requiereEvaluacion, fechaInicio, fechaFin } = req.query;
    
    const query = {};
    if (empresa) query.empresa = new RegExp(empresa, 'i'); // Búsqueda case-insensitive
    if (identificadorAnonimo) query.identificadorAnonimo = identificadorAnonimo;
    if (requiereEvaluacion) query.requiereEvaluacion = requiereEvaluacion === 'true';
    if (fechaInicio && fechaFin) {
      query.createdAt = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const resultados = await TraumaCuestionario.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: resultados
    });

  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener resultados'
    });
  }
};

function generarRecomendaciones(respuestas, requiereEvaluacion) {
  const recomendaciones = [];

  const preguntasSi = new Set(
    respuestas.filter(r => r.respuesta === 'si').map(r => r.pregunta)
  );

  const seccionII = preguntasSi.has('q7') || preguntasSi.has('q8');
  const seccionIII = ['q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15'].some(p => preguntasSi.has(p));
  const seccionIV = ['q16', 'q17', 'q18', 'q19', 'q20'].some(p => preguntasSi.has(p));

  if (preguntasSi.has('q1')) {
    recomendaciones.push('Buscar apoyo médico y psicológico debido a la gravedad del accidente experimentado.');
  }
  if (preguntasSi.has('q2')) {
    recomendaciones.push('Notificar al área de seguridad y recibir acompañamiento especializado por el asalto sufrido.');
  }
  if (preguntasSi.has('q3')) {
    recomendaciones.push('El colaborador debe recibir atención psicológica inmediata por actos violentos con lesiones.');
  }
  if (preguntasSi.has('q4')) {
    recomendaciones.push('Ofrecer un plan de apoyo integral y seguimiento profesional tras el secuestro vivido.');
  }
  if (preguntasSi.has('q5')) {
    recomendaciones.push('Fortalecer la seguridad y brindar contención psicológica ante amenazas recibidas.');
  }
  if (preguntasSi.has('q6')) {
    recomendaciones.push('Investigar el evento y activar protocolos de acompañamiento por riesgo a la vida o salud.');
  }

  if (seccionII) {
    recomendaciones.push('Derivar a evaluación clínica por recuerdos o sueños recurrentes del evento traumático.');
  }

  if (seccionIII) {
    recomendaciones.push('Recomendar terapia para trabajar esfuerzos por evitar situaciones que rememoran el evento.');
  }

  if (seccionIV) {
    recomendaciones.push('Sugerir intervención psicológica para atender alteraciones de sueño, irritabilidad o alerta constante.');
  }

  if (requiereEvaluacion) {
    recomendaciones.push('El colaborador cumple criterios para evaluación especializada; coordinar canalización con el área de salud ocupacional.');
  } else if (recomendaciones.length === 0) {
    recomendaciones.push('No se detectaron indicadores críticos. Mantener monitoreo y ofrecer información de apoyo.');
  }

  return recomendaciones;
}

exports.obtenerEmpresas = async (req, res) => {
  try {
    // Obtener empresas únicas del campo "empresa"
    const empresas = await TraumaCuestionario.distinct('empresa');
    res.status(200).json({
      success: true,
      data: empresas
    });
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener empresas'
    });
  }
};