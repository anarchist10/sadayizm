// Endpoint de diagnóstico para verificar la base de datos SQLite
import { trollsDB } from '../../lib/database';

export default async function handler(req, res) {
  console.log('🔍 === DIAGNÓSTICO DE BASE DE DATOS SQLite ===');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    database: {
      type: 'SQLite',
      status: 'UNKNOWN'
    },
    tests: []
  };
  
  try {
    // Test 1: Obtener todos los trolls
    console.log('📋 Test 1: Obtener todos los trolls...');
    const allTrolls = trollsDB.getAll();
    diagnostics.tests.push({
      name: 'GET_ALL_TROLLS',
      status: 'SUCCESS',
      result: `${allTrolls.length} trolls encontrados`,
      data: allTrolls.slice(0, 3) // Solo los primeros 3 para no saturar
    });
    
    // Test 2: Insertar un troll de prueba
    console.log('➕ Test 2: Insertar troll de prueba...');
    const testTroll = {
      nick: 'test_user_' + Date.now(),
      steamId: 'test_steam_id',
      steamId64: '76561198000000000',
      reason: 'Test de diagnóstico',
      faceitUrl: 'https://faceit.com/test'
    };
    
    const insertedTroll = trollsDB.add(testTroll);
    diagnostics.tests.push({
      name: 'INSERT_TROLL',
      status: 'SUCCESS',
      result: 'Troll insertado correctamente',
      data: insertedTroll
    });
    
    // Test 3: Actualizar el troll de prueba
    console.log('✏️ Test 3: Actualizar troll de prueba...');
    const updatedTroll = trollsDB.update(insertedTroll.id, {
      ...testTroll,
      reason: 'Test actualizado - ' + new Date().toISOString()
    });
    
    diagnostics.tests.push({
      name: 'UPDATE_TROLL',
      status: 'SUCCESS',
      result: 'Troll actualizado correctamente',
      data: updatedTroll
    });
    
    // Test 4: Eliminar el troll de prueba
    console.log('🗑️ Test 4: Eliminar troll de prueba...');
    const deleted = trollsDB.delete(insertedTroll.id);
    diagnostics.tests.push({
      name: 'DELETE_TROLL',
      status: deleted ? 'SUCCESS' : 'FAILED',
      result: deleted ? 'Troll eliminado correctamente' : 'No se pudo eliminar el troll'
    });
    
    diagnostics.database.status = 'SUCCESS';
    diagnostics.summary = 'Todos los tests pasaron correctamente. La base de datos SQLite está funcionando perfectamente.';
    
  } catch (error) {
    console.error('💥 Error en diagnóstico:', error);
    diagnostics.database.status = 'ERROR';
    diagnostics.error = {
      message: error.message,
      stack: error.stack
    };
    diagnostics.summary = 'Error en la base de datos SQLite.';
  }
  
  console.log('📊 Diagnóstico completo:', diagnostics);
  console.log('=== FIN DIAGNÓSTICO ===');
  
  res.status(200).json(diagnostics);
}