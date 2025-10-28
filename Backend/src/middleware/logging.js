const securityConfig = require('../config/security');

// Middleware de logging para monitorear actividades
const requestLogger = (req, res, next) => {
  if (!securityConfig.logging.enabled) {
    return next();
  }

  // Excluir rutas que no necesitan logging
  if (securityConfig.logging.excludePaths.includes(req.path)) {
    return next();
  }

  const start = Date.now();
  const { method, url, ip, headers } = req;
  
  // Log de la solicitud
  console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip} - User-Agent: ${headers['user-agent'] || 'N/A'}`);

  // Interceptar la respuesta para logging
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log de la respuesta
    console.log(`[${new Date().toISOString()}] ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`);
    
    // Alertar sobre respuestas de error
    if (statusCode >= 400) {
      console.warn(`[WARNING] Error response detected: ${method} ${url} - Status: ${statusCode}`);
    }
    
    // Alertar sobre respuestas lentas
    if (duration > 5000) {
      console.warn(`[WARNING] Slow response detected: ${method} ${url} - Duration: ${duration}ms`);
    }
    
    originalSend.call(this, data);
  };

  next();
};

// Middleware para detectar patrones sospechosos
const suspiciousActivityDetector = (req, res, next) => {
  const { method, url, ip, headers, body } = req;
  
  // Patrones sospechosos
  const suspiciousPatterns = [
    // SQL Injection patterns
    /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    // Path traversal
    /\.\.\//,
    // Command injection
    /[;&|`$()]/,
    // MongoDB injection
    /\$where/,
    /\$ne/,
    /\$gt/,
    /\$lt/,
    /\$regex/
  ];
  
  // Verificar URL
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    console.warn(`[SECURITY] Suspicious URL pattern detected: ${url} - IP: ${ip}`);
    return res.status(400).json({
      success: false,
      error: 'Patrón de URL no permitido'
    });
  }
  
  // Verificar User-Agent sospechoso
  const userAgent = headers['user-agent'] || '';
  if (userAgent.includes('sqlmap') || userAgent.includes('nikto') || userAgent.includes('nmap')) {
    console.warn(`[SECURITY] Suspicious User-Agent detected: ${userAgent} - IP: ${ip}`);
    return res.status(403).json({
      success: false,
      error: 'Acceso no autorizado'
    });
  }
  
  // Verificar body si existe
  if (body && typeof body === 'object') {
    const bodyString = JSON.stringify(body);
    if (suspiciousPatterns.some(pattern => pattern.test(bodyString))) {
      console.warn(`[SECURITY] Suspicious body pattern detected: ${bodyString.substring(0, 100)}... - IP: ${ip}`);
      return res.status(400).json({
        success: false,
        error: 'Contenido no permitido en el cuerpo de la solicitud'
      });
    }
  }
  
  next();
};

// Middleware para limitar el tamaño de las solicitudes
const requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    console.warn(`[SECURITY] Request too large: ${contentLength} bytes - IP: ${req.ip}`);
    return res.status(413).json({
      success: false,
      error: 'Solicitud demasiado grande'
    });
  }
  
  next();
};

// Middleware para validar tipos de contenido
const contentTypeValidator = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  
  // Solo permitir JSON para POST/PUT requests
  if ((req.method === 'POST' || req.method === 'PUT') && 
      !contentType.includes('application/json')) {
    console.warn(`[SECURITY] Invalid content type: ${contentType} - IP: ${req.ip}`);
    return res.status(400).json({
      success: false,
      error: 'Tipo de contenido no válido. Se requiere application/json'
    });
  }
  
  next();
};

module.exports = {
  requestLogger,
  suspiciousActivityDetector,
  requestSizeLimiter,
  contentTypeValidator
}; 