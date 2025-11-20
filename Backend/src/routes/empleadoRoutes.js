const express = require('express');
const router = express.Router();
const Empresa = require('../models/empresa');

// Autenticación simplificada - solo verifica credenciales
router.post('/login', async (req, res) => {
    try {
        const { nombreEmpresa, claveAcceso } = req.body;

        // Validación básica de entrada
        if (!nombreEmpresa || !claveAcceso) {
            return res.status(400).json({
                success: false,
                error: 'Nombre de empresa y clave son requeridos'
            });
        }

        // Buscar la empresa con los campos necesarios para validación
        const empresa = await Empresa.findOne({ 
            nombreEmpresa: nombreEmpresa.trim(),
            clave: claveAcceso.trim()
        }).select('tipoFormulario cantidadEmpleados muestraRepresentativa contador _id nombreEmpresa');

        if (!empresa) {
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciales inválidas' 
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

        // NO incrementar el contador aquí - solo se incrementa cuando se guarda exitosamente la respuesta

        // Respuesta exitosa con datos necesarios para la redirección
        res.json({
            success: true,
            empresa: {
                id: empresa._id, // Agregar el ID de la empresa
                nombre: empresa.nombreEmpresa,
                cantidadEmpleados: empresa.cantidadEmpleados,
                tipoFormulario: empresa.tipoFormulario
            }
        });

    } catch (error) {
        console.error('Error en login de empleado:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;