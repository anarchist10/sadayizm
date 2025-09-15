import { trollsStorage } from '../../lib/trollsStorage';

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        const trolls = trollsStorage.getAll();
        return res.status(200).json(trolls);

      case 'POST':
        const { nick, steamId, steamId64, reason, faceitUrl } = req.body;
        
        if (!nick || !steamId) {
          return res.status(400).json({ error: 'Nick y Steam ID son requeridos' });
        }
        
        const newTroll = trollsStorage.add({ nick, steamId, steamId64, reason, faceitUrl });
        
        if (newTroll) {
          return res.status(201).json(newTroll);
        } else {
          return res.status(500).json({ error: 'Error guardando el troll' });
        }

      case 'PUT':
        const { id } = req.query;
        const updateData = req.body;
        
        if (!updateData.nick || !updateData.steamId) {
          return res.status(400).json({ error: 'Nick y Steam ID son requeridos' });
        }
        
        const updatedTroll = trollsStorage.update(id, updateData);
        
        if (updatedTroll) {
          return res.status(200).json(updatedTroll);
        } else {
          return res.status(404).json({ error: 'Troll no encontrado' });
        }

      case 'DELETE':
        const { id: deleteId } = req.query;
        
        if (!deleteId) {
          return res.status(400).json({ error: 'ID es requerido' });
        }
        
        const deleted = trollsStorage.delete(deleteId);
        
        if (deleted) {
          return res.status(200).json({ message: 'Troll eliminado' });
        } else {
          return res.status(404).json({ error: 'Troll no encontrado' });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error('Error en API trolls:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}