// Script para verificar empresas en MongoDB Atlas
require('dotenv').config();
const mongoose = require('mongoose');
const Empresa = require('./src/models/empresa');

const mongoURI = process.env.MONGO_URI;

console.log('🔍 Verificando empresas en MongoDB Atlas...\n');

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority'
})
  .then(async () => {
    console.log('✅ Conectado a MongoDB Atlas\n');
    
    // Buscar todas las empresas
    const empresas = await Empresa.find({}).lean();
    
    console.log(`📊 Total de empresas: ${empresas.length}\n`);
    
    if (empresas.length > 0) {
      console.log('📋 Empresas encontradas:');
      empresas.forEach((emp, index) => {
        console.log(`\n${index + 1}. ${emp.nombreEmpresa}`);
        console.log(`   ID: ${emp._id}`);
        console.log(`   Empleados: ${emp.cantidadEmpleados}`);
        console.log(`   Tipo Formulario: ${emp.tipoFormulario}`);
        console.log(`   Creada: ${emp.createdAt}`);
        console.log(`   Actualizada: ${emp.updatedAt}`);
      });
    } else {
      console.log('⚠️  No hay empresas en la base de datos');
    }
    
    // Verificar endpoint del backend
    console.log('\n🔗 Para obtener estas empresas, usa el endpoint:');
    console.log('   GET http://localhost:3000/api/empresas');
    console.log('   GET http://localhost:3000/api/empresas/con-formulario-completo');
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

