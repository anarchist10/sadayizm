// API para manejar la lista de trolls con libsql
import { trollsDB } from '../../lib/database';

export default async function handler(req, res) {
  console.log('\n=== 🚀 NUEVA REQUEST API TROLLS (libsql) ===');
  console.log('📋 Método:', req.method);
  console.log('🌐 URL:', req.url);
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Inicializar la base de datos si es necesario
    await trollsDB.init();
    
    if (req.method === 'GET') {
      console.log('📖 Procesando GET request');
      
      const trolls = await trollsDB.getAll();
      
      console.log('📤 Enviando', trolls?.length || 0, 'trolls');
      res.status(200).json(trolls || []);
      
    } else if (req.method === 'POST') {
      console.log('➕ Procesando POST request');
      console.log('📥 Body recibido:', JSON.stringify(req.body, null, 2));
      
      const { nick, steamId, steamId64, reason, faceitUrl } = req.body || {};
      
      console.log('🔍 Datos extraídos:', { nick, steamId, steamId64, reason, faceitUrl });
      
      if (!nick || !steamId) {
        console.log('❌ Error: Datos faltantes - nick:', !!nick, 'steamId:', !!steamId);
        return res.status(400).json({ 
          error: 'Nick y Steam ID son requeridos',
          received: { nick: !!nick, steamId: !!steamId }
        });
      }
      
      const newTroll = {
        nick: String(nick).trim(),
        steamId: String(steamId).trim(),
        steamId64: String(steamId64 || 'No resuelto').trim(),
        reason: String(reason || 'Sin razón especificada').trim(),
        faceitUrl: String(faceitUrl || '').trim(),
      };
      
      console.log('🆕 Nuevo troll a insertar:', JSON.stringify(newTroll, null, 2));
      
      const insertedTroll = await trollsDB.add(newTroll);
      
      console.log('✅ Troll insertado exitosamente:', insertedTroll);
      res.status(201).json(insertedTroll);
      
    } else if (req.method === 'PUT') {
      console.log('✏️ Procesando PUT request');
      const { id } = req.query;
      const { nick, steamId, steamId64, reason, faceitUrl } = req.body || {};
      
      console.log('🔄 Actualizando troll ID:', id);
      
      if (!nick || !steamId) {
        return res.status(400).json({ error: 'Nick y Steam ID son requeridos' });
      }
      
      const updateData = {
        nick: String(nick).trim(),
        steamId: String(steamId).trim(),
        steamId64: String(steamId64 || 'No resuelto').trim(),
        reason: String(reason || 'Sin razón especificada').trim(),
        faceitUrl: String(faceitUrl || '').trim(),
      };
      
      console.log('✏️ Datos de actualización:', JSON.stringify(updateData, null, 2));
      
      const updatedTroll = await trollsDB.update(id, updateData);
      
      if (!updatedTroll) {
        console.log('❌ Troll no encontrado con ID:', id);
        return res.status(404).json({ error: 'Troll no encontrado' });
      }
      
      console.log('✅ Troll actualizado exitosamente:', updatedTroll);
      res.status(200).json(updatedTroll);
      
    } else if (req.method === 'DELETE') {
      console.log('🗑️ Procesando DELETE request');
      const { id } = req.query;
      
      console.log('🗑️ Eliminando troll ID:', id);
      
      const deleted = await trollsDB.delete(id);
      
      if (!deleted) {
        console.log('❌ Troll no encontrado con ID:', id);
        return res.status(404).json({ error: 'Troll no encontrado' });
      }
      
      console.log('✅ Troll eliminado exitosamente');
      res.status(200).json({ message: 'Troll eliminado' });
      
    } else {
      console.log('❌ Método no permitido:', req.method);
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    
  } catch (error) {
    console.error('💥 ERROR CRÍTICO en API trolls:', error);
    console.error('Stack trace completo:', error.stack);
    console.error('Request method:', req.method);
    console.error('Request body:', req.body);
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  console.log('=== ✅ FIN REQUEST ===\n');
}