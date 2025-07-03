// API para manejar la lista de trolls compartida con persistencia en archivo
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'pages', 'api', 'trolls.json');

function loadTrolls() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error leyendo trolls.json:', e);
  }
  return [];
}

function saveTrolls(trolls) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(trolls, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error guardando trolls.json:', e);
  }
}

function getNextId(trolls) {
  return trolls.length > 0 ? Math.max(...trolls.map(t => t.id)) + 1 : 1;
}

export default function handler(req, res) {
  let trollList = loadTrolls();

  if (req.method === 'GET') {
    // Obtener lista de trolls
    res.status(200).json(trollList);
  } else if (req.method === 'POST') {
    // Agregar nuevo troll
    const { nick, steamId, steamId64, reason, faceitUrl } = req.body;
    if (!nick || !steamId) {
      return res.status(400).json({ error: 'Nick y Steam ID son requeridos' });
    }
    const newTroll = {
      id: getNextId(trollList),
      nick,
      steamId,
      steamId64: steamId64 || 'No resuelto',
      reason: reason || 'Sin razón especificada',
      faceitUrl: faceitUrl || '',
      dateAdded: new Date().toISOString()
    };
    trollList.push(newTroll);
    saveTrolls(trollList);
    res.status(201).json(newTroll);
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
      nick,
      steamId,
      steamId64: steamId64 || 'No resuelto',
      reason: reason || 'Sin razón especificada',
      faceitUrl: faceitUrl || '',
      lastModified: new Date().toISOString()
    };
    saveTrolls(trollList);
    res.status(200).json(trollList[trollIndex]);
  } else if (req.method === 'DELETE') {
    // Eliminar troll
    const { id } = req.query;
    const trollId = parseInt(id);
    const initialLength = trollList.length;
    trollList = trollList.filter(troll => troll.id !== trollId);
    if (trollList.length < initialLength) {
      saveTrolls(trollList);
      res.status(200).json({ message: 'Troll eliminado' });
    } else {
      res.status(404).json({ error: 'Troll no encontrado' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}