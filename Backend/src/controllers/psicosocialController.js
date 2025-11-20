const mongoose = require('mongoose');
const Respuesta = require('../models/resultadoPsicosocial');
const calcularPuntaje = require('../utils/calcularPuntajeTrabajo');

// Función para determinar nivel de riesgo (ajustada a tu escala original)
function determinarNivelRiesgo(puntajeTotal) {
  if (puntajeTotal >= 80) return "Muy alto";
  if (puntajeTotal >= 70) return "Alto";
  if (puntajeTotal >= 45) return "Medio";
  if (puntajeTotal >= 20) return "Bajo";
  return "Nulo o despreciable";
}

// Función para guardar respuesta (adaptada a 46 preguntas)
const guardarRespuesta = async (req, res) => {
  console.log('Datos recibidos en el backend:', req.body);

  const { preguntas, servicioClientes, esJefe, empresaId } = req.body;

  // Validación básica
  if (!empresaId || !preguntas || typeof preguntas !== 'object') {
    return res.status(400).json({ 
      success: false,
      error: 'empresaId y preguntas son requeridos' 
    });
  }

  try {
    // Verificar que la empresa existe y obtener información
    const Empresa = mongoose.model('Empresa');
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

    // Validar preguntas obligatorias (1-40)
    const obligatorias = Array.from({ length: 40 }, (_, i) => `pregunta${i + 1}`);
    const faltantes = obligatorias.filter(p => !(p in preguntas));
    
    if (faltantes.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Faltan respuestas obligatorias',
        preguntasFaltantes: faltantes.map(p => parseInt(p.replace('pregunta', '')))
      });
    }

    // Calcular resultados
    const resultado = calcularPuntaje(preguntas, esJefe, servicioClientes);
    
    // Crear registro anónimo
    const nuevaRespuesta = await Respuesta.create({
      empresaId,
      preguntas, // Cambiado de "respuestas" a "preguntas"
      esJefe: Boolean(esJefe),
      servicioClientes: Boolean(servicioClientes),
      puntajeTotal: resultado.puntajeTotal,
      nivelRiesgo: determinarNivelRiesgo(resultado.puntajeTotal),
      categorias: Object.entries(resultado.categorias).map(([nombre, datos]) => ({
        nombre,
        puntaje: datos.puntaje,
        nivel: datos.nivel
      })),
      dominios: Object.entries(resultado.dominios).map(([nombre, datos]) => ({
        nombre,
        puntaje: datos.puntaje,
        nivel: datos.nivel
      })),
      recomendaciones: resultado.recomendaciones
    });

    // Incrementar contador de la empresa después de guardar exitosamente (operación atómica)
    await Empresa.findByIdAndUpdate(
      empresaId,
      { $inc: { contador: 1 } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      data: {
        id: nuevaRespuesta._id,
        puntajeTotal: nuevaRespuesta.puntajeTotal,
        nivelRiesgo: nuevaRespuesta.nivelRiesgo,
        createdAt: nuevaRespuesta.createdAt
      }
    });

  } catch (error) {
    console.error('Error al guardar respuesta:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el cuestionario',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener resultados por empresa (sin datos sensibles)
const obtenerResultados = async (req, res) => {
  try {
    const { empresaId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(empresaId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de empresa no válido'
      });
    }

    // Obtener la empresa para verificar su existencia y cantidad de empleados
    const empresa = await mongoose.model('Empresa').findById(empresaId).select('nombreEmpresa cantidadEmpleados').lean();

    if (!empresa) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    // Buscar las respuestas en la base de datos
    const resultados = await Respuesta.find({ empresaId }).lean();

    // Calcular progreso
    const totalEmpleados = empresa.cantidadEmpleados;
    const encuestasCompletadas = resultados.length;
    const progreso = `${encuestasCompletadas}/${totalEmpleados}`;

    res.status(200).json({
      success: true,
      data: {
        empresa, // Incluye la información de la empresa
        resultados, // Arreglo de respuestas
        resumen: {
          totalEncuestas: encuestasCompletadas,
          progreso,
          ultimaActualizacion: resultados.length > 0
            ? new Date(Math.max(...resultados.map(r => new Date(r.updatedAt || r.createdAt)))).toISOString()
            : null
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resultados'
    });
  }
};

// Obtener estadísticas agregadas
const obtenerEstadisticas = async (req, res) => {
  try {
    const { empresaId } = req.params;
    
    if (!empresaId) {
      return res.status(400).json({
        success: false,
        error: 'empresaId es requerido'
      });
    }

    const stats = await Respuesta.aggregate([
      { $match: { empresaId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          promedioPuntaje: { $avg: '$puntajeTotal' },
          niveles: {
            $push: '$nivelRiesgo'
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          promedioPuntaje: { $round: ['$promedioPuntaje', 2] },
          distribucion: {
            $arrayToObject: {
              $map: {
                input: ['Nulo o despreciable', 'Bajo', 'Medio', 'Alto', 'Muy alto'],
                as: 'nivel',
                in: {
                  k: '$$nivel',
                  v: { $size: { $filter: { input: '$niveles', as: 'n', cond: { $eq: ['$$n', '$$nivel'] } } } }
                }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        total: 0,
        promedioPuntaje: 0,
        distribucion: {
          'Nulo o despreciable': 0,
          'Bajo': 0,
          'Medio': 0,
          'Alto': 0,
          'Muy alto': 0
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al calcular estadísticas'
    });
  }
};

module.exports = {
  guardarRespuesta,
  obtenerResultados,
  obtenerEstadisticas,
  determinarNivelRiesgo
};