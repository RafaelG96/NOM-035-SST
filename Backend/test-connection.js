// Script para probar la conexión a MongoDB Atlas
require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

console.log('🔍 Probando conexión a MongoDB Atlas...\n');
console.log('URI configurada:', mongoURI ? `${mongoURI.substring(0, 30)}...` : 'NO CONFIGURADA');

if (!mongoURI) {
  console.error('❌ ERROR: MONGO_URI no está configurada en .env');
  process.exit(1);
}

// Configuración de conexión
const connectionOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority'
};

console.log('\n📡 Intentando conectar...');

mongoose.connect(mongoURI, connectionOptions)
  .then(async () => {
    console.log('✅ Conexión exitosa a MongoDB Atlas!\n');
    
    // Verificar que la base de datos existe
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📦 Base de datos conectada: ${dbName}`);
    
    // Listar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📚 Colecciones encontradas (${collections.length}):`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Verificar colección de empresas
    const Empresa = mongoose.connection.collection('empresas');
    const countEmpresas = await Empresa.countDocuments();
    console.log(`\n🏢 Empresas en la base de datos: ${countEmpresas}`);
    
    if (countEmpresas > 0) {
      console.log('\n📋 Últimas 5 empresas registradas:');
      const empresas = await Empresa.find({}).limit(5).sort({ createdAt: -1 }).toArray();
      empresas.forEach((emp, index) => {
        console.log(`   ${index + 1}. ${emp.nombreEmpresa} (ID: ${emp._id}, Empleados: ${emp.cantidadEmpleados})`);
      });
    } else {
      console.log('⚠️  No hay empresas registradas en la base de datos');
    }
    
    // Verificar colección de respuestas
    const Respuesta = mongoose.connection.collection('respuestas');
    const countRespuestas = await Respuesta.countDocuments();
    console.log(`\n📝 Respuestas en la base de datos: ${countRespuestas}`);
    
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ ERROR al conectar a MongoDB Atlas:');
    console.error('   Tipo:', error.name);
    console.error('   Mensaje:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Posible solución: Verifica usuario y contraseña en .env');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 Posible solución: Verifica que la URI del cluster sea correcta');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Posible solución: Verifica que tu IP esté en la whitelist de MongoDB Atlas');
      console.error('   Ve a MongoDB Atlas → Network Access → Add IP Address');
    }
    
    process.exit(1);
  });

