// API para manejar la lista de trolls compartida
let trollList = [];
let nextId = 1;

export default function handler(req, res) {
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
      id: nextId++,
      nick,
      steamId,
      steamId64: steamId64 || 'No resuelto',
      reason: reason || 'Sin razón especificada',
      faceitUrl: faceitUrl || '',
      dateAdded: new Date().toISOString()
    };
    
    trollList.push(newTroll);
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
    
    // Actualizar el troll manteniendo la fecha original
    trollList[trollIndex] = {
      ...trollList[trollIndex],
      nick,
      steamId,
      steamId64: steamId64 || 'No resuelto',
      reason: reason || 'Sin razón especificada',
      faceitUrl: faceitUrl || '',
      lastModified: new Date().toISOString()
    };
    
    res.status(200).json(trollList[trollIndex]);
  } else if (req.method === 'DELETE') {
    // Eliminar troll
    const { id } = req.query;
    const trollId = parseInt(id);
    
    const initialLength = trollList.length;
    trollList = trollList.filter(troll => troll.id !== trollId);
    
    if (trollList.length < initialLength) {
      res.status(200).json({ message: 'Troll eliminado' });
    } else {
      res.status(404).json({ error: 'Troll no encontrado' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}