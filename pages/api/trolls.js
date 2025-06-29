// API para manejar la lista de trolls compartida
let trollList = [];
let nextId = 1;

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Obtener lista de trolls
    res.status(200).json(trollList);
  } else if (req.method === 'POST') {
    // Agregar nuevo troll
    const { nick, steamId, reason, steamUrl, faceitFinderUrl } = req.body;
    
    if (!nick || !steamId) {
      return res.status(400).json({ error: 'Nick y Steam ID son requeridos' });
    }
    
    const newTroll = {
      id: nextId++,
      nick,
      steamId,
      reason: reason || 'Sin razón especificada',
      steamUrl: steamUrl || `https://steamcommunity.com/profiles/${steamId}`,
      faceitFinderUrl: faceitFinderUrl || `https://faceitfinder.com/profile/${steamId}`,
      dateAdded: new Date().toISOString()
    };
    
    trollList.push(newTroll);
    res.status(201).json(newTroll);
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
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}