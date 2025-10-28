const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Función para hacer requests y mostrar resultados
async function testEndpoint(method, endpoint, data = null, description) {
  try {
    console.log(`\n Probando: ${description}`);
    console.log(`${method.toUpperCase()} ${endpoint}`);
    
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // No lanzar error para códigos de estado HTTP
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));
    
    return response;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return null;
  }
}

// Función para probar rate limiting
async function testRateLimiting() {
  console.log('\n🚀 Probando Rate Limiting...');
  
  const promises = [];
  for (let i = 0; i < 6; i++) {
    promises.push(testEndpoint('POST', '/empresas/verify-clave', {
      nombreEmpresa: 'Test Company',
      clave: 'test123'
    }, `Intento ${i + 1} de autenticación`));
  }
  
  const results = await Promise.all(promises);
  const blockedRequests = results.filter(r => r && r.status === 429);
  
  console.log(`\n Resultados Rate Limiting:`);
  console.log(`- Total requests: ${results.length}`);
  console.log(`- Requests bloqueados: ${blockedRequests.length}`);
  console.log(`- Rate limiting funcionando: ${blockedRequests.length > 0 ? '✅' : '❌'}`);
}

// Función para probar validaciones
async function testValidations() {
  console.log('\n Probando Validaciones...');
  
  // Test 1: Datos inválidos en creación de empresa
  await testEndpoint('POST', '/empresas', {
    nombreEmpresa: 'A', // Muy corto
    cantidadEmpleados: -1, // Inválido
    clave: '123' // Muy corto
  }, 'Validación de datos de empresa inválidos');
  
  // Test 2: Datos válidos en creación de empresa
  await testEndpoint('POST', '/empresas', {
    nombreEmpresa: 'Empresa Test Seguridad',
    cantidadEmpleados: 50,
    clave: 'test123456'
  }, 'Validación de datos de empresa válidos');
  
  // Test 3: Respuestas de formulario inválidas
  await testEndpoint('POST', '/psicosocial/trabajo', {
    empresaId: 'invalid-id',
    preguntas: 'not-an-object',
    servicioClientes: 'not-boolean'
  }, 'Validación de respuestas de formulario inválidas');
}

// Función para probar detección de patrones maliciosos
async function testMaliciousPatterns() {
  console.log('\n Probando Detección de Patrones Maliciosos...');
  
  // Test 1: SQL Injection attempt
  await testEndpoint('GET', '/empresas?q=1%27%20OR%201%3D1', null, 'Detección de SQL Injection');
  
  // Test 2: XSS attempt
  await testEndpoint('POST', '/empresas', {
    nombreEmpresa: '<script>alert("xss")</script>',
    cantidadEmpleados: 10,
    clave: 'test123'
  }, 'Detección de XSS');
  
  // Test 3: Path traversal attempt
  await testEndpoint('GET', '/empresas/../../../etc/passwd', null, 'Detección de Path Traversal');
  
  // Test 4: MongoDB injection attempt
  await testEndpoint('POST', '/empresas', {
    nombreEmpresa: 'Test',
    cantidadEmpleados: 10,
    clave: 'test123',
    $where: '1==1'
  }, 'Detección de MongoDB Injection');
}

// Función para probar límites de tamaño
async function testSizeLimits() {
  console.log('\n Probando Límites de Tamaño...');
  
  // Crear un objeto muy grande
  const largeData = {
    empresaId: '507f1f77bcf86cd799439011',
    preguntas: {}
  };
  
  // Llenar con muchas preguntas
  for (let i = 1; i <= 1000; i++) {
    largeData.preguntas[`pregunta${i}`] = 'Siempre'.repeat(1000); // Hacer cada respuesta muy larga
  }
  
  await testEndpoint('POST', '/psicosocial/trabajo', largeData, 'Límite de tamaño de request');
}

// Función principal
async function runSecurityTests() {
  console.log(' Iniciando Pruebas de Seguridad...\n');
  
  try {
    // Probar health check
    await testEndpoint('GET', '/health', null, 'Health Check');
    
    // Probar validaciones
    await testValidations();
    
    // Probar detección de patrones maliciosos
    await testMaliciousPatterns();
    
    // Probar límites de tamaño
    await testSizeLimits();
    
    // Probar rate limiting (al final para no afectar otras pruebas)
    await testRateLimiting();
    
    console.log('\n Pruebas de seguridad completadas');
    console.log('\n Resumen:');
    console.log('- Validaciones de entrada: ');
    console.log('- Detección de patrones maliciosos: ');
    console.log('- Rate limiting: ');
    console.log('- Límites de tamaño: ');
    console.log('- Headers de seguridad: ');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas si el archivo se ejecuta directamente
if (require.main === module) {
  runSecurityTests();
}

module.exports = {
  testEndpoint,
  testRateLimiting,
  testValidations,
  testMaliciousPatterns,
  testSizeLimits,
  runSecurityTests
}; 