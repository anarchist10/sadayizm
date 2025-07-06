import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Crear directorio de datos si no existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'trolls.db');

// Crear conexión a la base de datos
let db;

function getDatabase() {
  if (!db) {
    console.log('🗄️ Inicializando base de datos SQLite en:', dbPath);
    db = new Database(dbPath);
    
    // Habilitar WAL mode para mejor concurrencia
    db.pragma('journal_mode = WAL');
    
    // Crear tabla si no existe
    const createTable = `
      CREATE TABLE IF NOT EXISTS trolls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nick TEXT NOT NULL,
        steam_id TEXT NOT NULL,
        steam_id64 TEXT DEFAULT 'No resuelto',
        reason TEXT DEFAULT 'Sin razón especificada',
        faceit_url TEXT DEFAULT '',
        date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.exec(createTable);
    
    // Crear índices para mejor performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_trolls_nick ON trolls(nick);
      CREATE INDEX IF NOT EXISTS idx_trolls_steam_id ON trolls(steam_id);
      CREATE INDEX IF NOT EXISTS idx_trolls_date_added ON trolls(date_added DESC);
    `;
    
    db.exec(createIndexes);
    
    console.log('✅ Base de datos SQLite inicializada correctamente');
  }
  
  return db;
}

// Funciones para manejar trolls
export const trollsDB = {
  // Obtener todos los trolls
  getAll() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM trolls ORDER BY date_added DESC');
    return stmt.all();
  },

  // Agregar un nuevo troll
  add(troll) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO trolls (nick, steam_id, steam_id64, reason, faceit_url)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      troll.nick,
      troll.steamId,
      troll.steamId64 || 'No resuelto',
      troll.reason || 'Sin razón especificada',
      troll.faceitUrl || ''
    );
    
    // Obtener el troll insertado
    const getStmt = db.prepare('SELECT * FROM trolls WHERE id = ?');
    return getStmt.get(result.lastInsertRowid);
  },

  // Actualizar un troll existente
  update(id, troll) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE trolls 
      SET nick = ?, steam_id = ?, steam_id64 = ?, reason = ?, faceit_url = ?, last_modified = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      troll.nick,
      troll.steamId,
      troll.steamId64 || 'No resuelto',
      troll.reason || 'Sin razón especificada',
      troll.faceitUrl || '',
      id
    );
    
    if (result.changes === 0) {
      return null; // No se encontró el troll
    }
    
    // Obtener el troll actualizado
    const getStmt = db.prepare('SELECT * FROM trolls WHERE id = ?');
    return getStmt.get(id);
  },

  // Eliminar un troll
  delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM trolls WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // Obtener un troll por ID
  getById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM trolls WHERE id = ?');
    return stmt.get(id);
  },

  // Buscar trolls por nick o steam_id
  search(query) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM trolls 
      WHERE nick LIKE ? OR steam_id LIKE ? 
      ORDER BY date_added DESC
    `);
    return stmt.all(`%${query}%`, `%${query}%`);
  }
};

// Cerrar la base de datos cuando el proceso termine
process.on('exit', () => {
  if (db) {
    db.close();
  }
});

process.on('SIGINT', () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});