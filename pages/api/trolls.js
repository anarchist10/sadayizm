// API para manejar la lista de trolls con persistencia en archivo JSON
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'trolls.json');

// Asegurar que el directorio data existe
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadTrolls() {
  try {
    ensureDataDirectory();
    console.log('Intentando cargar trolls desde:', DATA_FILE);
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      console.log('Archivo leído correctamente');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } else {
      console.log('Archivo no existe, creando uno nuevo');
      // Crear archivo vacío
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Error leyendo trolls.json:', e);
  }
  return [];
}

function saveTrolls(trolls) {
  try {
    ensureDataDirectory();
    console.log('Intentando guardar trolls en:', DATA_FILE);
    const dataToSave = Array.isArray(trolls) ? trolls : [];
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    console.log('Archivo guardado correctamente');
    return true;
  } catch (e) {
    console.error('Error guardando trolls.json:', e);
    return false;
  }
}

function getNextId(trolls) {
  if (!Array.isArray(trolls) || trolls.length === 0) return 1;
  return Math.max(...trolls.map(t => t.id || 0)) + 1;
}

export default function handler(req, res) {
  try {
    console.log('API llamada:', req.method, req.url);
    let trollList = loadTrolls();
    console.log('Trolls cargados:', trollList.length);

    if (req.method === 'GET') {
      // Obtener lista de trolls
      res.status(200).json(trollList);
    } else if (req.method === 'POST') {
      // Agregar nuevo troll
      console.log('Datos recibidos:', req.body);
      const { nick, steamId, steamId64, reason, faceitUrl } = req.body;
      
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
      
      console.log('Nuevo troll a agregar:', newTroll);
      trollList.push(newTroll);
      
      console.log('Intentando guardar...');
      if (saveTrolls(trollList)) {
        console.log('Troll guardado exitosamente');
        res.status(201).json(newTroll);
      } else {
        console.log('Error al guardar trolls');
        res.status(500).json({ error: 'Error al guardar en el servidor' });
      }
    } else if (req.method === 'PUT') {
      // Actualizar troll existente
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
      // Eliminar troll
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
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}