const express = require('express');
const router = express.Router();
const traumaController = require('../controllers/traumaController');
const { 
  validateTrauma, 
  handleValidationErrors, 
  sanitizeInput, 
  preventInjection 
} = require('../middleware/validation');

// Middleware de seguridad aplicado a todas las rutas
router.use(sanitizeInput);
router.use(preventInjection);

// Ruta para guardar cuestionario de trauma
router.post('/', validateTrauma, handleValidationErrors, traumaController.guardarCuestionario);

// Ruta para obtener resultados
router.get('/', traumaController.obtenerResultados);

// Ruta para obtener empresas
router.get('/empresas', traumaController.obtenerEmpresas);

module.exports = router;