const mongoose = require('mongoose');
const Respuesta = require('../models/respuesta');
const Empresa = require('../models/empresa');
const calcularPuntaje = require('../utils/calcularPuntajeEntorno');

// Función para determinar nivel de riesgo con el nivel "Nulo" incluido
function determinarNivelRiesgo(puntaje) {
  if (puntaje >= 200) return "Muy alto";
  if (puntaje >= 150) return "Alto";
  if (puntaje >= 100) return "Medio";
  if (puntaje >= 50) return "Bajo";
  return "Nulo";
}

// Función para obtener recomendaciones basadas en el nivel de riesgo
function obtenerRecomendaciones(nivelRiesgo) {
  const recomendaciones = {
    'Muy alto': 'Se requiere realizar el análisis de cada categoría y dominio para establecer las acciones de intervención apropiadas, mediante un Programa de intervención que deberá incluir evaluaciones específicas. Y contemplar campañas de sensibilización, revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral, así como reforzar su aplicación y difusión.',
    'Alto': 'Se requiere realizar un análisis de cada categoría y dominio, de manera que se puedan determinar las acciones de intervención apropiadas a través de un Programa de intervención, que podrá incluir una evaluación específica y deberá incluir una campaña de sensibilización, revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral, así como reforzar su aplicación y difusión.',
    'Medio': 'Se requiere revisar la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral, así como reforzar su aplicación y difusión, mediante un Programa de intervención.',
    'Bajo': 'Es necesario una mayor difusión de la política de prevención de riesgos psicosociales y programas para la prevención de los factores de riesgo psicosocial, la promoción de un entorno organizacional favorable y la prevención de la violencia laboral.',
    'Nulo': 'El riesgo resulta despreciable por lo que no se requiere medidas adicionales.'
  };
  
  return {
    nivel: nivelRiesgo,
    recomendacion: recomendaciones[nivelRiesgo] || 'No se pudo determinar una recomendación para este nivel de riesgo'
  };
}

// Función para guardar respuesta
const guardarRespuesta = async (req, res) => {
  const { preguntas, servicioClientes, esJefe, empresaId } = req.body;

  // Validación del cuerpo de la solicitud
  if (!preguntas || typeof preguntas !== 'object' || Object.keys(preguntas).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'El objeto de preguntas es requerido y debe contener respuestas'
    });
  }

  try {
    // Validación de empresaId
    if (!empresaId || !mongoose.Types.ObjectId.isValid(empresaId)) {
      return res.status(400).json({ 
        success: false,
        error: 'ID de empresa no válido o faltante' 
      });
    }

    // Verificar que la empresa existe y obtener información
    const empresa = await Empresa.findById(empresaId).select('tipoFormulario cantidadEmpleados muestraRepresentativa contador');
    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: 'La empresa especificada no existe'
      });
    }

    // Verificar límite de encuestas según el tipo de formulario
    if (empresa.tipoFormulario === 'completo') {
      // Para empresas grandes: verificar contra muestra representativa
      if (empresa.contador >= empresa.muestraRepresentativa) {
        return res.status(403).json({
          success: false,
          error: `Límite de encuestas alcanzado. Se han completado ${empresa.muestraRepresentativa} de ${empresa.muestraRepresentativa} encuestas requeridas.`,
          limiteAlcanzado: true,
          completadas: empresa.contador,
          limite: empresa.muestraRepresentativa
        });
      }
    } else {
      // Para empresas pequeñas: verificar contra cantidad de empleados
      if (empresa.contador >= empresa.cantidadEmpleados) {
        return res.status(403).json({
          success: false,
          error: `Límite de encuestas alcanzado. Se han completado ${empresa.contador} de ${empresa.cantidadEmpleados} encuestas requeridas.`,
          limiteAlcanzado: true,
          completadas: empresa.contador,
          limite: empresa.cantidadEmpleados
        });
      }
    }

    // Conversión a booleanos
    const servicioClientesBool = ['true', 'sí', 'si', 'yes', '1'].includes(String(servicioClientes).toLowerCase()) || servicioClientes === true;
    const esJefeBool = ['true', 'sí', 'si', 'yes', '1'].includes(String(esJefe).toLowerCase()) || esJefe === true;

    // Clonar preguntas para no modificar el objeto original
    const preguntasProcesadas = {...preguntas};

    // Eliminar preguntas condicionales no aplicables
    if (!esJefeBool) {
      [69, 70, 71, 72].forEach(p => delete preguntasProcesadas[`pregunta${p}`]);
    }
    
    if (!servicioClientesBool) {
      [65, 66, 67, 68].forEach(p => delete preguntasProcesadas[`pregunta${p}`]);
    }

    // Validar preguntas obligatorias (1-64 siempre obligatorias)
    // Las preguntas 1-54 son obligatorias siempre
    // Las preguntas 55-64 son obligatorias siempre (Violencia)
    // Las preguntas 65-68 son condicionales (solo si servicioClientes)
    // Las preguntas 69-72 son condicionales (solo si esJefe)
    const preguntasObligatorias = Array.from({length: 64}, (_, i) => `pregunta${i+1}`);
    const faltantes = preguntasObligatorias.filter(p => {
      const preguntaNumero = parseInt(p.replace('pregunta', ''));
      // Las preguntas 1-64 son obligatorias siempre
      return preguntaNumero <= 64 && !(p in preguntasProcesadas);
    });
    
    if (faltantes.length > 0) {
      console.log('Preguntas faltantes:', faltantes);
      console.log('Preguntas procesadas:', Object.keys(preguntasProcesadas));
      return res.status(400).json({
        success: false,
        error: 'Faltan respuestas obligatorias',
        preguntasFaltantes: faltantes.map(p => parseInt(p.replace('pregunta', ''))),
        totalPreguntasEnviadas: Object.keys(preguntasProcesadas).length,
        preguntasEnviadas: Object.keys(preguntasProcesadas).sort()
      });
    }

    // Calcular puntajes
    const { puntajeTotal, puntajesPorCategoria, puntajesPorDominio } = 
      calcularPuntaje(preguntasProcesadas, esJefeBool, servicioClientesBool);
    
    // Validación de los cálculos
    if (typeof puntajeTotal !== 'number' || isNaN(puntajeTotal) ||
        !puntajesPorCategoria || typeof puntajesPorCategoria !== 'object' ||
        !puntajesPorDominio || typeof puntajesPorDominio !== 'object') {
      throw new Error('Los resultados del cálculo de puntajes no son válidos');
    }

    // Determinar nivel de riesgo y recomendaciones
    const { nivel, recomendacion } = obtenerRecomendaciones(determinarNivelRiesgo(puntajeTotal));

    // Convertir empresaId a ObjectId si viene como string
    const empresaObjectId = mongoose.Types.ObjectId.isValid(empresaId) 
      ? new mongoose.Types.ObjectId(empresaId) 
      : empresaId;

    // Crear y guardar respuesta
    const nuevaRespuesta = new Respuesta({
      empresaId: empresaObjectId,
      preguntas: preguntasProcesadas,
      puntajeTotal,
      puntajesPorCategoria,
      puntajesPorDominio,
      servicioClientes: servicioClientesBool,
      esJefe: esJefeBool,
      nivelRiesgo: nivel,
      recomendacion
    });

    console.log('Guardando respuesta:', {
      empresaIdOriginal: empresaId,
      empresaIdConvertido: empresaObjectId,
      empresaIdString: String(empresaObjectId),
      puntajeTotal,
      categorias: Object.keys(puntajesPorCategoria),
      dominios: Object.keys(puntajesPorDominio),
      servicioClientes: servicioClientesBool,
      esJefe: esJefeBool
    });

    await nuevaRespuesta.save();
    
    // Incrementar contador de la empresa después de guardar exitosamente (operación atómica)
    await Empresa.findByIdAndUpdate(
      empresaId,
      { $inc: { contador: 1 } },
      { new: true }
    );
    
    console.log('Respuesta guardada exitosamente:', {
      respuestaId: nuevaRespuesta._id,
      empresaId: String(nuevaRespuesta.empresaId),
      puntajeTotal: nuevaRespuesta.puntajeTotal,
      nivelRiesgo: nuevaRespuesta.nivelRiesgo
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: nuevaRespuesta._id,
        puntajeTotal,
        nivelRiesgo: nivel,
        recomendacion,
        categorias: puntajesPorCategoria,
        dominios: puntajesPorDominio,
        esJefe: esJefeBool,
        servicioClientes: servicioClientesBool
      }
    });

  } catch (error) {
    console.error('Error al guardar respuesta:', error);
    
    const errorMap = {
      'ValidationError': { status: 400, message: 'Error de validación de datos' },
      'CastError': { status: 400, message: 'Tipo de dato incorrecto' },
      'MongoError': { status: 500, message: 'Error de base de datos' },
      'default': { status: 500, message: 'Error interno del servidor' }
    };

    const errorInfo = errorMap[error.name] || errorMap.default;
    
    res.status(errorInfo.status).json({
      success: false,
      error: errorInfo.message,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

// Función para obtener respuestas por empresa
const getRespuestasByEmpresa = async (req, res) => {
  try {
    const empresaId = req.params.empresaId;

    if (!mongoose.Types.ObjectId.isValid(empresaId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de empresa no válido'
      });
    }

    // Obtener la empresa para verificar su existencia y obtener la muestra representativa
    const empresa = await Empresa.findById(empresaId)
      .select('nombreEmpresa cantidadEmpleados muestraRepresentativa')
      .lean();

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    // Determinar el objetivo de encuestas (muestra representativa o cantidad total de empleados)
    const objetivoEncuestas = empresa.muestraRepresentativa || empresa.cantidadEmpleados;

    // Convertir empresaId a ObjectId para la búsqueda
    const empresaObjectId = new mongoose.Types.ObjectId(empresaId);
    
    // Verificar el nombre de la colección que está usando el modelo
    console.log(`Modelo Respuesta usando colección: ${Respuesta.collection.name}`);
    console.log(`Buscando en colección: ${Respuesta.collection.name}`);
    
    // Intentar búsqueda con ObjectId
    let respuestas = await Respuesta.find({ empresaId: empresaObjectId })
      .sort({ createdAt: -1 })
      .lean();
    
    // Si no encuentra, intentar también buscar directamente en la colección usando el driver nativo
    if (respuestas.length === 0) {
      console.log('Intentando búsqueda directa en la colección "respuestas"...');
      const db = mongoose.connection.db;
      const respuestasCollection = db.collection('respuestas');
      const respuestasDirectas = await respuestasCollection.find({ 
        empresaId: empresaObjectId 
      }).toArray();
      console.log(`Respuestas encontradas en búsqueda directa: ${respuestasDirectas.length}`);
      
      if (respuestasDirectas.length > 0) {
        // Convertir ObjectId de MongoDB a string para comparar
        respuestasDirectas.forEach((r, idx) => {
          console.log(`  Respuesta ${idx + 1}: empresaId=${String(r.empresaId)}, tipo=${typeof r.empresaId}`);
        });
      }
    }
    
    // Si no se encuentran respuestas, intentar búsqueda adicional como string
    if (respuestas.length === 0) {
      console.log(`No se encontraron respuestas con ObjectId, intentando búsqueda como string...`);
      respuestas = await Respuesta.find({ empresaId: empresaId })
        .sort({ createdAt: -1 })
        .lean();
      
      // Buscar todas las respuestas para ver qué empresas tienen respuestas
      const todasLasRespuestas = await Respuesta.find({})
        .select('empresaId createdAt puntajeTotal')
        .lean();
      
      console.log(`Total de respuestas en la BD: ${todasLasRespuestas.length}`);
      console.log('Empresas con respuestas guardadas:');
      
      // Obtener información de empresas para cada respuesta
      const empresasIds = [...new Set(todasLasRespuestas.map(r => String(r.empresaId)))];
      const empresas = await Empresa.find({ _id: { $in: empresasIds.map(id => new mongoose.Types.ObjectId(id)) } })
        .select('nombreEmpresa cantidadEmpleados')
        .lean();
      
      const empresasMap = {};
      empresas.forEach(emp => {
        empresasMap[String(emp._id)] = emp;
      });
      
      todasLasRespuestas.forEach((r, idx) => {
        const empresaIdStr = String(r.empresaId);
        const empresaInfo = empresasMap[empresaIdStr] || { nombreEmpresa: 'Empresa no encontrada' };
        console.log(`  ${idx + 1}. empresaId: ${empresaIdStr}, Empresa: ${empresaInfo.nombreEmpresa}, Puntaje: ${r.puntajeTotal}, Fecha: ${r.createdAt}`);
      });
      
      // Agrupar por empresaId para ver cuántas respuestas tiene cada empresa
      const respuestasPorEmpresa = {};
      todasLasRespuestas.forEach(r => {
        const empresaIdStr = String(r.empresaId);
        if (!respuestasPorEmpresa[empresaIdStr]) {
          respuestasPorEmpresa[empresaIdStr] = {
            count: 0,
            nombre: empresasMap[empresaIdStr]?.nombreEmpresa || 'Desconocida'
          };
        }
        respuestasPorEmpresa[empresaIdStr].count++;
      });
      console.log('Resumen de respuestas por empresa:', JSON.stringify(respuestasPorEmpresa, null, 2));
      
      // Mostrar qué ID se está buscando vs qué IDs hay en la BD
      console.log(`\n=== COMPARACIÓN DE IDs ===`);
      console.log(`ID buscado: ${empresaId} (${empresaObjectId})`);
      console.log(`IDs encontrados en BD: ${empresasIds.join(', ')}`);
      const matchEncontrado = empresasIds.find(id => id === empresaId || id === String(empresaObjectId));
      if (matchEncontrado) {
        console.log(`✅ MATCH ENCONTRADO: ${matchEncontrado}`);
      } else {
        console.log(`❌ NO HAY MATCH - El ID buscado no coincide con ningún ID en la BD`);
      }
    }
    
    console.log(`Buscando respuestas para empresaId: ${empresaId} (ObjectId: ${empresaObjectId})`);
    console.log(`Respuestas encontradas: ${respuestas.length}`);
    if (respuestas.length > 0) {
      console.log('Primera respuesta encontrada:', {
        _id: respuestas[0]._id,
        empresaId: respuestas[0].empresaId,
        empresaIdType: typeof respuestas[0].empresaId,
        empresaIdString: String(respuestas[0].empresaId),
        puntajeTotal: respuestas[0].puntajeTotal,
        tienePuntajesPorCategoria: !!respuestas[0].puntajesPorCategoria,
        tienePuntajesPorDominio: !!respuestas[0].puntajesPorDominio,
        keysPuntajesPorCategoria: respuestas[0].puntajesPorCategoria ? Object.keys(respuestas[0].puntajesPorCategoria) : [],
        keysPuntajesPorDominio: respuestas[0].puntajesPorDominio ? Object.keys(respuestas[0].puntajesPorDominio) : []
      });
    } else {
      console.log(`No se encontraron respuestas para la empresa ${empresaId}`);
    }

    // Calcular datos resumidos
    const sumaPuntajes = respuestas.reduce((sum, res) => sum + (res.puntajeTotal || 0), 0);
    const puntajePromedio = respuestas.length > 0 ? Math.round(sumaPuntajes / respuestas.length) : 0;
    const ultimaActualizacion = respuestas.length > 0
      ? new Date(Math.max(...respuestas.map(r => new Date(r.updatedAt || r.createdAt))))
      : null;

    // Calcular progreso
    const progreso = `${respuestas.length}/${objetivoEncuestas}`;

    // Enviar la respuesta al cliente
    res.json({
      success: true,
      data: {
        empresa, // Información de la empresa
        respuestas, // Respuestas obtenidas
        resumen: {
          totalEncuestas: respuestas.length,
          progreso, // Progreso basado en la muestra representativa
          puntajePromedio,
          nivelRiesgo: determinarNivelRiesgo(puntajePromedio),
          ultimaActualizacion: ultimaActualizacion?.toISOString() || null
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  }
};

// Función para obtener una respuesta específica
const getRespuestaById = async (req, res) => {
  try {
    const respuestaId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(respuestaId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de respuesta no válido'
      });
    }

    const respuesta = await Respuesta.findById(respuestaId)
      .populate('empresaId', 'nombreEmpresa cantidadEmpleados')
      .lean();

    if (!respuesta) {
      return res.status(404).json({
        success: false,
        message: 'Respuesta no encontrada'
      });
    }

    // Obtener recomendación actualizada por si hubo cambios
    const { recomendacion } = obtenerRecomendaciones(respuesta.nivelRiesgo);

    res.json({
      success: true,
      data: {
        id: respuesta._id,
        fecha: respuesta.createdAt,
        puntajeTotal: respuesta.puntajeTotal,
        nivelRiesgo: respuesta.nivelRiesgo,
        recomendacion: respuesta.recomendacion || recomendacion,
        empresa: respuesta.empresaId,
        detalles: {
          categorias: respuesta.puntajesPorCategoria,
          dominios: respuesta.puntajesPorDominio
        },
        contexto: {
          esJefe: respuesta.esJefe,
          servicioClientes: respuesta.servicioClientes
        },
        totalPreguntas: Object.keys(respuesta.preguntas).length
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la respuesta',
      error: error.message
    });
  }
};

const obtenerResultadosEntorno = async (req, res) => {
  try {
    const { empresaId } = req.params;

    // Busca las respuestas del formulario largo en la base de datos
    const resultados = await Respuesta.find({ empresaId, tipoFormulario: 'entorno' });

    res.status(200).json({
      success: true,
      data: resultados || [] // Devuelve un arreglo vacío si no hay resultados
    });
  } catch (error) {
    console.error('Error al obtener resultados del formulario largo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resultados del formulario largo'
    });
  }
};

module.exports = {
  guardarRespuesta,
  getRespuestasByEmpresa,
  getRespuestaById,
  determinarNivelRiesgo,
  obtenerRecomendaciones,
  obtenerResultadosEntorno
};