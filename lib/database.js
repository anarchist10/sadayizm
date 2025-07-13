import { createClient } from '@libsql/client';
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
    console.log('🗄️ Inicializando base de datos libsql en:', dbPath);
    db = createClient({
      url: `file:${dbPath}`
    });
    
    console.log('✅ Base de datos libsql inicializada correctamente');
  }
  
  return db;
}

// Inicializar la base de datos y crear tablas
async function initializeDatabase() {
  const db = getDatabase();
  
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
  
  await db.execute(createTable);
  
  // Crear índices para mejor performance
  const createIndexes = [
    `CREATE INDEX IF NOT EXISTS idx_trolls_nick ON trolls(nick)`,
    `CREATE INDEX IF NOT EXISTS idx_trolls_steam_id ON trolls(steam_id)`,
    `CREATE INDEX IF NOT EXISTS idx_trolls_date_added ON trolls(date_added DESC)`
  ];
  
  for (const indexQuery of createIndexes) {
    await db.execute(indexQuery);
  }
  
  console.log('✅ Tablas e índices creados correctamente');
}

// Funciones para manejar trolls
export const trollsDB = {
  // Inicializar la base de datos
  async init() {
    await initializeDatabase();
  },

  // Obtener todos los trolls
  async getAll() {
    const db = getDatabase();
    const result = await db.execute('SELECT * FROM trolls ORDER BY date_added DESC');
    return result.rows;
  },

  // Agregar un nuevo troll
  async add(troll) {
    const db = getDatabase();
    const result = await db.execute({
      sql: `INSERT INTO trolls (nick, steam_id, steam_id64, reason, faceit_url)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        troll.nick,
        troll.steamId,
        troll.steamId64 || 'No resuelto',
        troll.reason || 'Sin razón especificada',
        troll.faceitUrl || ''
      ]
    });
    
    // Obtener el troll insertado
    const getResult = await db.execute({
      sql: 'SELECT * FROM trolls WHERE id = ?',
      args: [result.lastInsertRowid]
    });
    
    return getResult.rows[0];
  },

  // Actualizar un troll existente
  async update(id, troll) {
    const db = getDatabase();
    const result = await db.execute({
      sql: `UPDATE trolls 
            SET nick = ?, steam_id = ?, steam_id64 = ?, reason = ?, faceit_url = ?, last_modified = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        troll.nick,
        troll.steamId,
        troll.steamId64 || 'No resuelto',
        troll.reason || 'Sin razón especificada',
        troll.faceitUrl || '',
        id
      ]
    });
    
    if (result.rowsAffected === 0) {
      return null; // No se encontró el troll
    }
    
    // Obtener el troll actualizado
    const getResult = await db.execute({
      sql: 'SELECT * FROM trolls WHERE id = ?',
      args: [id]
    });
    
    return getResult.rows[0];
  },

  // Eliminar un troll
  async delete(id) {
    const db = getDatabase();
    const result = await db.execute({
      sql: 'DELETE FROM trolls WHERE id = ?',
      args: [id]
    });
    return result.rowsAffected > 0;
  },

  // Obtener un troll por ID
  async getById(id) {
    const db = getDatabase();
    const result = await db.execute({
      sql: 'SELECT * FROM trolls WHERE id = ?',
      args: [id]
    });
    return result.rows[0];
  },

  // Buscar trolls por nick o steam_id
  async search(query) {
    const db = getDatabase();
    const result = await db.execute({
      sql: `SELECT * FROM trolls 
            WHERE nick LIKE ? OR steam_id LIKE ? 
            ORDER BY date_added DESC`,
      args: [`%${query}%`, `%${query}%`]
    });
    return result.rows;
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