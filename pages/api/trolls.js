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
    console.log('Directorio de trabajo actual:', process.cwd());
    
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      console.log('Archivo leído correctamente, contenido:', data);
      const parsed = JSON.parse(data);
      const result = Array.isArray(parsed) ? parsed : [];
      console.log('Trolls cargados:', result.length);
      return result;
    } else {
      console.log('Archivo no existe, creando uno nuevo');
      // Crear archivo vacío
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
    console.log('Datos a guardar:', trolls);
    
    const dataToSave = Array.isArray(trolls) ? trolls : [];
    const jsonString = JSON.stringify(dataToSave, null, 2);
    
    // Verificar permisos antes de escribir
    try {
      fs.accessSync(path.dirname(DATA_FILE), fs.constants.W_OK);
      console.log('Permisos de escritura verificados');
    } catch (permError) {
      console.error('Error de permisos:', permError);
      return false;
    }
    
    fs.writeFileSync(DATA_FILE, jsonString, 'utf-8');
    console.log('Archivo guardado correctamente');
    
    // Verificar que se guardó correctamente
    if (fs.existsSync(DATA_FILE)) {
      const savedData = fs.readFileSync(DATA_FILE, 'utf-8');
      console.log('Verificación: archivo guardado contiene:', savedData);
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
  console.log('=== INICIO DE REQUEST ===');
  console.log('Método:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  try {
    let trollList = loadTrolls();
    console.log('Trolls cargados en handler:', trollList.length);

    if (req.method === 'GET') {
      console.log('Procesando GET request');
      res.status(200).json(trollList);
    } else if (req.method === 'POST') {
      console.log('Procesando POST request');
      const { nick, steamId, steamId64, reason, faceitUrl } = req.body;
      
      console.log('Datos extraídos del body:', { nick, steamId, steamId64, reason, faceitUrl });
      
      if (!nick || !steamId) {
        console.log('Error: Nick o Steam ID faltantes');
        return res.status(400).json({ error: 'Nick y Steam ID son requeridos' });
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
      
      console.log('Nuevo troll creado:', newTroll);
      trollList.push(newTroll);
      console.log('Lista actualizada, total trolls:', trollList.length);
      
      console.log('Intentando guardar...');
      const saveResult = saveTrolls(trollList);
      console.log('Resultado del guardado:', saveResult);
      
      if (saveResult) {
        console.log('Troll guardado exitosamente, enviando respuesta');
        res.status(201).json(newTroll);
      } else {
        console.log('Error al guardar trolls, enviando error');
        res.status(500).json({ error: 'Error al guardar en el servidor - no se pudo escribir el archivo' });
      }
    } else if (req.method === 'PUT') {
      console.log('Procesando PUT request');
      const { id } = req.query;
      const { nick, steamId, steamId64, reason, faceitUrl } = req.body;
      const trollId = parseInt(id);
      
      const trollIndex = trollList.findIndex(troll => troll.id === trollId);
      
      if (trollIndex === -1) {
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
      
      if (saveTrolls(trollList)) {
        res.status(200).json(trollList[trollIndex]);
      } else {
        res.status(500).json({ error: 'Error al guardar en el servidor' });
      }
    } else if (req.method === 'DELETE') {
      console.log('Procesando DELETE request');
      const { id } = req.query;
      const trollId = parseInt(id);
      
      const initialLength = trollList.length;
      trollList = trollList.filter(troll => troll.id !== trollId);
      
      if (trollList.length < initialLength) {
        if (saveTrolls(trollList)) {
          res.status(200).json({ message: 'Troll eliminado' });
        } else {
          res.status(500).json({ error: 'Error al guardar en el servidor' });
        }
      } else {
        res.status(404).json({ error: 'Troll no encontrado' });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error en API trolls:', error);
    console.error('Stack trace completo:', error.stack);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      stack: error.stack
    });
  }
  
  console.log('=== FIN DE REQUEST ===');
}