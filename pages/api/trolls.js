// API para manejar la lista de trolls usando SQLite
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'pages', 'api', 'trolls.db');
const db = new Database(DB_PATH);

// Crear tabla si no existe
const createTable = `CREATE TABLE IF NOT EXISTS trolls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nick TEXT NOT NULL,
  steamId TEXT NOT NULL,
  steamId64 TEXT,
  reason TEXT,
  faceitUrl TEXT,
  dateAdded TEXT,
  lastModified TEXT
);`;
db.prepare(createTable).run();

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Obtener lista de trolls
    const trolls = db.prepare('SELECT * FROM trolls').all();
    res.status(200).json(trolls);
  } else if (req.method === 'POST') {
    // Agregar nuevo troll
    const { nick, steamId, steamId64, reason, faceitUrl } = req.body;
    if (!nick || !steamId) {
      return res.status(400).json({ error: 'Nick y Steam ID son requeridos' });
    }
    const now = new Date().toISOString();
    const stmt = db.prepare(`INSERT INTO trolls (nick, steamId, steamId64, reason, faceitUrl, dateAdded) VALUES (?, ?, ?, ?, ?, ?)`);
    const result = stmt.run(
      nick,
      steamId,
      steamId64 || 'No resuelto',
      reason || 'Sin razón especificada',
      faceitUrl || '',
      now
    );
    const newTroll = db.prepare('SELECT * FROM trolls WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newTroll);
  } else if (req.method === 'PUT') {
    // Actualizar troll existente
    const { id } = req.query;
    const { nick, steamId, steamId64, reason, faceitUrl } = req.body;
    const trollId = parseInt(id);
    if (!nick || !steamId) {
      return res.status(400).json({ error: 'Nick y Steam ID son requeridos' });
    }
    const now = new Date().toISOString();
    const stmt = db.prepare(`UPDATE trolls SET nick = ?, steamId = ?, steamId64 = ?, reason = ?, faceitUrl = ?, lastModified = ? WHERE id = ?`);
    const result = stmt.run(
      nick,
      steamId,
      steamId64 || 'No resuelto',
      reason || 'Sin razón especificada',
      faceitUrl || '',
      now,
      trollId
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Troll no encontrado' });
    }
    const updatedTroll = db.prepare('SELECT * FROM trolls WHERE id = ?').get(trollId);
    res.status(200).json(updatedTroll);
  } else if (req.method === 'DELETE') {
    // Eliminar troll
    const { id } = req.query;
    const trollId = parseInt(id);
    const stmt = db.prepare('DELETE FROM trolls WHERE id = ?');
    const result = stmt.run(trollId);
    if (result.changes > 0) {
      res.status(200).json({ message: 'Troll eliminado' });
    } else {
      res.status(404).json({ error: 'Troll no encontrado' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}