// API para manejar la lista de trolls con persistencia en archivo JSON
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'trolls.json');

// Asegurar que el directorio data existe
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(dataDir)) {
      console.log('Creando directorio data...');
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Directorio data creado exitosamente');
    }
    
    // Verificar permisos del directorio
    try {
      fs.accessSync(dataDir, fs.constants.R_OK | fs.constants.W_OK);
      console.log('Permisos del directorio data verificados correctamente');
    } catch (permError) {
      console.error('Error de permisos en directorio data:', permError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error creando directorio data:', error);
    return false;
  }
}

function loadTrolls() {
  try {
    if (!ensureDataDirectory()) {
      console.error('No se pudo crear el directorio data');
      return [];
    }
    
    console.log('Intentando cargar trolls desde:', DATA_FILE);
    
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      console.log('Archivo leído correctamente');
      
      if (!data.trim()) {
        console.log('Archivo vacío, inicializando con array vacío');
        const emptyArray = [];
        fs.writeFileSync(DATA_FILE, JSON.stringify(emptyArray, null, 2), 'utf-8');
        return emptyArray;
      }
      
      const parsed = JSON.parse(data);
      const result = Array.isArray(parsed) ? parsed : [];
      console.log('Trolls cargados:', result.length);
      return result;
    } else {
      console.log('Archivo no existe, creando uno nuevo');
      const emptyArray = [];
      fs.writeFileSync(DATA_FILE, JSON.stringify(emptyArray, null, 2), 'utf-8');
      console.log('Archivo vacío creado');
      return emptyArray;
    }
  } catch (e) {
    console.error('Error leyendo trolls.json:', e);
    console.error('Stack trace:', e.stack);
    return [];
  }
}

function saveTrolls(trolls) {
  try {
    if (!ensureDataDirectory()) {
      console.error('No se pudo crear el directorio data');
      return false;
    }
    
    console.log('Intentando guardar trolls en:', DATA_FILE);
    console.log('Número de trolls a guardar:', trolls.length);
    
    const dataToSave = Array.isArray(trolls) ? trolls : [];
    const jsonString = JSON.stringify(dataToSave, null, 2);
    
    // Escribir el archivo
    fs.writeFileSync(DATA_FILE, jsonString, 'utf-8');
    console.log('Archivo guardado correctamente');
    
    // Verificar que se guardó correctamente
    if (fs.existsSync(DATA_FILE)) {
      const savedData = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsedSaved = JSON.parse(savedData);
      console.log('Verificación: archivo contiene', parsedSaved.length, 'trolls');
      return true;
    } else {
      console.error('Error: el archivo no existe después de guardarlo');
      return false;
    }
  } catch (e) {
    console.error('Error guardando trolls.json:', e);
    console.error('Stack trace:', e.stack);
    return false;
  }
}

function getNextId(trolls) {
  if (!Array.isArray(trolls) || trolls.length === 0) return 1;
  return Math.max(...trolls.map(t => t.id || 0)) + 1;
}

export default function handler(req, res) {
  console.log('\n=== NUEVA REQUEST API TROLLS ===');
  console.log('Método:', req.method);
  console.log('URL:', req.url);
  console.log('Timestamp:', new Date().toISOString());
  
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    let trollList = loadTrolls();
    console.log('Trolls cargados en handler:', trollList.length);

    if (req.method === 'GET') {
      console.log('Procesando GET request');
      console.log('Enviando', trollList.length, 'trolls');
      res.status(200).json(trollList);
      
    } else if (req.method === 'POST') {
      console.log('Procesando POST request');
      console.log('Body recibido:', JSON.stringify(req.body, null, 2));
      
      const { nick, steamId, steamId64, reason, faceitUrl } = req.body || {};
      
      console.log('Datos extraídos:', { nick, steamId, steamId64, reason, faceitUrl });
      
      if (!nick || !steamId) {
        console.log('Error: Datos faltantes - nick:', !!nick, 'steamId:', !!steamId);
        return res.status(400).json({ 
          error: 'Nick y Steam ID son requeridos',
          received: { nick: !!nick, steamId: !!steamId }
        });
      }
      
      const newTroll = {
        id: getNextId(trollList),
        nick: String(nick).trim(),
        steamId: String(steamId).trim(),
        steamId64: String(steamId64 || 'No resuelto').trim(),
        reason: String(reason || 'Sin razón especificada').trim(),
        faceitUrl: String(faceitUrl || '').trim(),
        dateAdded: new Date().toISOString()
      };
      
      console.log('Nuevo troll creado:', JSON.stringify(newTroll, null, 2));
      
      trollList.push(newTroll);
      console.log('Lista actualizada, total trolls:', trollList.length);
      
      console.log('Intentando guardar...');
      const saveResult = saveTrolls(trollList);
      console.log('Resultado del guardado:', saveResult);
      
      if (saveResult) {
        console.log('✅ Troll guardado exitosamente');
        res.status(201).json(newTroll);
      } else {
        console.log('❌ Error al guardar trolls');
        res.status(500).json({ 
          error: 'Error al guardar en el servidor - no se pudo escribir el archivo',
          details: 'Revisa los permisos del directorio data/'
        });
      }
      
    } else if (req.method === 'PUT') {
      console.log('Procesando PUT request');
      const { id } = req.query;
      const { nick, steamId, steamId64, reason, faceitUrl } = req.body || {};
      const trollId = parseInt(id);
      
      console.log('Actualizando troll ID:', trollId);
      
      const trollIndex = trollList.findIndex(troll => troll.id === trollId);
      
      if (trollIndex === -1) {
        console.log('Troll no encontrado con ID:', trollId);
        return res.status(404).json({ error: 'Troll no encontrado' });
      }
      
      if (!nick || !steamId) {
        return res.status(400).json({ error: 'Nick y Steam ID son requeridos' });
      }
      
      trollList[trollIndex] = {
        ...trollList[trollIndex],
        nick: String(nick).trim(),
        steamId: String(steamId).trim(),
        steamId64: String(steamId64 || 'No resuelto').trim(),
        reason: String(reason || 'Sin razón especificada').trim(),
        faceitUrl: String(faceitUrl || '').trim(),
        lastModified: new Date().toISOString()
      };
      
      console.log('Troll actualizado:', JSON.stringify(trollList[trollIndex], null, 2));
      
      if (saveTrolls(trollList)) {
        console.log('✅ Troll actualizado exitosamente');
        res.status(200).json(trollList[trollIndex]);
      } else {
        console.log('❌ Error al guardar actualización');
        res.status(500).json({ error: 'Error al guardar en el servidor' });
      }
      
    } else if (req.method === 'DELETE') {
      console.log('Procesando DELETE request');
      const { id } = req.query;
      const trollId = parseInt(id);
      
      console.log('Eliminando troll ID:', trollId);
      
      const initialLength = trollList.length;
      trollList = trollList.filter(troll => troll.id !== trollId);
      
      if (trollList.length < initialLength) {
        console.log('Troll eliminado, guardando lista actualizada');
        if (saveTrolls(trollList)) {
          console.log('✅ Troll eliminado exitosamente');
          res.status(200).json({ message: 'Troll eliminado' });
        } else {
          console.log('❌ Error al guardar después de eliminar');
          res.status(500).json({ error: 'Error al guardar en el servidor' });
        }
      } else {
        console.log('Troll no encontrado para eliminar');
        res.status(404).json({ error: 'Troll no encontrado' });
      }
      
    } else {
      console.log('Método no permitido:', req.method);
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
  
  console.log('=== FIN REQUEST ===\n');
}