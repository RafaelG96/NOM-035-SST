/**
 * Calcula puntajes de riesgo psicosocial basado en respuestas a 72 preguntas.
 * @param {Object} preguntas - Objeto con las respuestas (pregunta1: "Siempre", ...).
 * @param {boolean} [esJefe=false] - Indica si el encuestado es jefe.
 * @param {boolean} [servicioClientes=false] - Indica si atiende clientes.
 * @returns {Object} - { puntajeTotal, puntajesPorCategoria, puntajesPorDominio, nivelFinal, nivelesPorCategoria, nivelesPorDominio }.
 */
const calcularPuntaje = (preguntas, esJefe = false, servicioClientes = false) => {
  // Configuración de grupos
  const GRUPO_1 = new Set([1, 4, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 55, 56, 57]);
  const GRUPO_2 = new Set([2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 29, 54, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72]);

  const VALORES_RESPUESTA = {
    GRUPO_1: { "Siempre": 0, "Casi siempre": 1, "Algunas veces": 2, "Casi nunca": 3, "Nunca": 4 },
    GRUPO_2: { "Siempre": 4, "Casi siempre": 3, "Algunas veces": 2, "Casi nunca": 1, "Nunca": 0 }
  };

  // Estructura jerárquica basada en la tabla de la NOM-035-STPS-2018
  // Agrupación por Categoría > Dominio > Dimensión (items)
  const ESTRUCTURA = {
    "Ambiente de trabajo": {
      "Condiciones en el ambiente de trabajo": [1, 2, 3, 4, 5]
      // Dimensiones:
      // - Condiciones peligrosas e inseguras: [1, 3]
      // - Condiciones deficientes e insalubres: [2, 4]
      // - Trabajos peligrosos: [5]
    },
    "Factores propios de la actividad": {
      "Carga de trabajo": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 65, 66, 67, 68],
      // Dimensiones:
      // - Cargas cuantitativas: [6, 12]
      // - Ritmos de trabajo acelerado: [7, 8]
      // - Carga mental: [9, 10, 11]
      // - Cargas psicológicas emocionales: [65, 66, 67, 68] (condicional para clientes)
      // - Cargas de alta responsabilidad: [13, 14]
      // - Cargas contradictorias o inconsistentes: [15, 16]
      "Falta de control sobre el trabajo": [23, 24, 25, 26, 27, 28, 29, 30, 35, 36]
      // Dimensiones:
      // - Falta de control y autonomía: [25, 26, 27, 28]
      // - Limitada o nula posibilidad de desarrollo: [23, 24]
      // - Insuficiente participación: [29, 30]
      // - Limitada o inexistente capacitación: [35, 36]
    },
    "Organización del tiempo de trabajo": {
      "Jornada de trabajo": [17, 18],
      // Dimensión: Jornadas de trabajo extensas: [17, 18]
      "Interferencia en la relación trabajo-familia": [19, 20, 21, 22]
      // Dimensiones:
      // - Influencia del trabajo fuera del centro laboral: [19, 20]
      // - Influencia de las responsabilidades familiares: [21, 22]
    },
    "Liderazgo y relaciones en el trabajo": {
      "Liderazgo": [31, 32, 33, 34, 37, 38, 39, 40, 41],
      // Dimensiones:
      // - Escaza claridad de funciones: [31, 32, 33, 34]
      // - Características del liderazgo: [37, 38, 39, 40, 41]
      "Relaciones en el trabajo": [42, 43, 44, 45, 46, 69, 70, 71, 72],
      // Dimensiones:
      // - Relaciones sociales en el trabajo: [42, 43, 44, 45, 46]
      // - Deficiente relación con los colaboradores que supervisa: [69, 70, 71, 72] (condicional para jefes)
      "Violencia": [57, 58, 59, 60, 61, 62, 63, 64]
      // Dimensión: Violencia laboral: [57, 58, 59, 60, 61, 62, 63, 64]
    },
    "Entorno organizacional": {
      "Reconocimiento del desempeño": [47, 48, 49, 50, 51, 52],
      // Dimensiones:
      // - Escasa o nula retroalimentación del desempeño: [47, 48]
      // - Escaso o nulo reconocimiento y compensación: [49, 50, 51, 52]
      "Insuficiente sentido de pertenencia e inestabilidad": [53, 54, 55, 56]
      // Dimensiones:
      // - Limitado sentido de pertenencia: [55, 56]
      // - Inestabilidad laboral: [53, 54]
    }
  };

  // Inicialización de resultados
  let puntajeTotal = 0;
  const puntajesPorCategoria = {};
  const puntajesPorDominio = {};

  // Inicializar estructuras con ceros
  Object.keys(ESTRUCTURA).forEach(categoria => {
    puntajesPorCategoria[categoria] = 0;
    Object.keys(ESTRUCTURA[categoria]).forEach(dominio => {
      puntajesPorDominio[dominio] = 0;
    });
  });

  // Procesar cada pregunta
  for (let i = 1; i <= 72; i++) {
    const respuesta = preguntas[`pregunta${i}`];

    // Validar si la pregunta debe procesarse
    if (i >= 65 && i <= 68 && !servicioClientes) continue; // Preguntas condicionales para clientes
    if (i >= 69 && i <= 72 && !esJefe) continue; // Preguntas condicionales para jefes

    // Validar respuesta existente
    // Si llegamos aquí, significa que la pregunta debe procesarse (condiciones cumplidas)
    if (respuesta === undefined || respuesta === null) {
      // Las primeras 54 preguntas son obligatorias
      if (i <= 54) {
        throw new Error(`Pregunta ${i} no tiene respuesta pero es requerida`);
      }
      // Si es pregunta condicional (55-72) y no tiene respuesta, saltarla
      continue;
    }

    // Determinar valor según grupo
    let valor = 0;
    if (GRUPO_1.has(i)) {
      valor = VALORES_RESPUESTA.GRUPO_1[respuesta] ?? 0;
    } else if (GRUPO_2.has(i)) {
      valor = VALORES_RESPUESTA.GRUPO_2[respuesta] ?? 0;
    }

    // Acumular puntajes en todas las jerarquías
    for (const [categoria, dominios] of Object.entries(ESTRUCTURA)) {
      for (const [dominio, items] of Object.entries(dominios)) {
        if (items.includes(i)) {
          puntajeTotal += valor;
          puntajesPorCategoria[categoria] += valor;
          puntajesPorDominio[dominio] += valor;
        }
      }
    }
  }

  // Calcular niveles de riesgo
  const nivelFinal = obtenerNivelFinal(puntajeTotal);
  const nivelesPorCategoria = calcularNivelesPorCategoria(puntajesPorCategoria);
  const nivelesPorDominio = calcularNivelesPorDominio(puntajesPorDominio);

  return {
    puntajeTotal,
    puntajesPorCategoria,
    puntajesPorDominio,
    nivelFinal,
    nivelesPorCategoria,
    nivelesPorDominio
  };
};

// Funciones auxiliares para calcular niveles
function obtenerNivelFinal(puntaje) {
  if (puntaje < 50) return 'Nulo';
  if (puntaje < 75) return 'Bajo';
  if (puntaje < 99) return 'Medio';
  if (puntaje < 140) return 'Alto';
  return 'Muy alto';
}

function calcularNivelesPorCategoria(puntajes) {
  const rangos = {
    "Ambiente de trabajo": [5, 9, 11, 14],
    "Factores propios de la actividad": [15, 30, 45, 80],
    "Organización del tiempo de trabajo": [5, 9, 11, 14],
    "Liderazgo y relaciones en el trabajo": [14, 29, 42, 58],
    "Entorno organizacional": [10, 14, 18, 23]
  };

  return Object.entries(puntajes).reduce((niveles, [categoria, puntaje]) => {
    niveles[categoria] = obtenerNivelPorRango(puntaje, rangos[categoria]);
    return niveles;
  }, {});
}

function calcularNivelesPorDominio(puntajes) {
  const rangos = {
    "Condiciones en el ambiente de trabajo": [5, 9, 11, 14],
    "Carga de trabajo": [15, 21, 27, 37],
    "Falta de control sobre el trabajo": [11, 16, 21, 25],
    "Jornada de trabajo": [1, 4, 6, 9],
    "Interferencia en la relación trabajo-familia": [4, 8, 11, 14],
    "Liderazgo": [9, 12, 16, 21],
    "Relaciones en el trabajo": [10, 13, 17, 21],
    "Violencia": [7, 10, 13, 16],
    "Reconocimiento del desempeño": [10, 14, 18, 23],
    "Insuficiente sentido de pertenencia e inestabilidad": [4, 8, 10, 12]
  };

  return Object.entries(puntajes).reduce((niveles, [dominio, puntaje]) => {
    niveles[dominio] = obtenerNivelPorRango(puntaje, rangos[dominio]);
    return niveles;
  }, {});
}

function obtenerNivelPorRango(puntaje, limites) {
  if (puntaje < limites[0]) return 'Nulo';
  if (puntaje < limites[1]) return 'Bajo';
  if (puntaje < limites[2]) return 'Medio';
  if (puntaje < limites[3]) return 'Alto';
  return 'Muy alto';
}

module.exports = calcularPuntaje;