// API para manejar la lista de trolls con Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Verificando configuración de Supabase:');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
console.log('Anon Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Faltante');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('URL:', supabaseUrl)
  console.error('Key:', supabaseAnonKey ? 'Present' : 'Missing')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  console.log('\n=== 🚀 NUEVA REQUEST API TROLLS (SUPABASE) ===');
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
    // Verificar conexión a Supabase
    console.log('🔗 Verificando conexión a Supabase...');
    
    if (req.method === 'GET') {
      console.log('📖 Procesando GET request');
      
      const { data: trolls, error } = await supabase
        .from('trolls')
        .select('*')
        .order('date_added', { ascending: false });
      
      if (error) {
        console.error('❌ Error al obtener trolls:', error);
        return res.status(500).json({ 
          error: 'Error al obtener la lista de trolls',
          details: error.message,
          supabaseError: error
        });
      }
      
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
        steam_id: String(steamId).trim(),
        steam_id64: String(steamId64 || 'No resuelto').trim(),
        reason: String(reason || 'Sin razón especificada').trim(),
        faceit_url: String(faceitUrl || '').trim(),
      };
      
      console.log('🆕 Nuevo troll a insertar:', JSON.stringify(newTroll, null, 2));
      
      // Test de conexión antes de insertar
      const { data: testConnection, error: connectionError } = await supabase
        .from('trolls')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        console.error('❌ Error de conexión a Supabase:', connectionError);
        return res.status(500).json({ 
          error: 'Error de conexión a la base de datos',
          details: connectionError.message,
          supabaseError: connectionError
        });
      }
      
      console.log('✅ Conexión a Supabase exitosa');
      
      const { data: insertedTroll, error } = await supabase
        .from('trolls')
        .insert([newTroll])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error al insertar troll:', error);
        return res.status(500).json({ 
          error: 'Error al guardar el troll en la base de datos',
          details: error.message,
          supabaseError: error
        });
      }
      
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
        steam_id: String(steamId).trim(),
        steam_id64: String(steamId64 || 'No resuelto').trim(),
        reason: String(reason || 'Sin razón especificada').trim(),
        faceit_url: String(faceitUrl || '').trim(),
        last_modified: new Date().toISOString()
      };
      
      console.log('✏️ Datos de actualización:', JSON.stringify(updateData, null, 2));
      
      const { data: updatedTroll, error } = await supabase
        .from('trolls')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error al actualizar troll:', error);
        return res.status(500).json({ 
          error: 'Error al actualizar el troll',
          details: error.message,
          supabaseError: error
        });
      }
      
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
      
      const { error } = await supabase
        .from('trolls')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error al eliminar troll:', error);
        return res.status(500).json({ 
          error: 'Error al eliminar el troll',
          details: error.message,
          supabaseError: error
        });
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