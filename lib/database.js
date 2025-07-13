import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear directorio de datos si no existe
const dataDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'trolls.db');

let SQL = null;
let db = null;

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
    console.log('📁 Directorio de datos creado:', dataDir);
  } catch (error) {
    console.error('❌ Error creando directorio de datos:', error);
  }
}

async function getDatabase() {
  if (!SQL) {
    try {
      console.log('🔧 Inicializando SQL.js...');
      SQL = await initSqlJs();
      console.log('✅ SQL.js inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando SQL.js:', error);
      throw error;
    }
  }

  if (!db) {
    try {
      console.log('🗄️ Inicializando base de datos en:', dbPath);
      
      // Try to load existing database file
      let data = null;
      if (fs.existsSync(dbPath)) {
        try {
          data = fs.readFileSync(dbPath);
          console.log('📖 Base de datos existente cargada');
        } catch (error) {
          console.warn('⚠️ No se pudo cargar la base de datos existente, creando nueva:', error.message);
        }
      }
      
      // Create database instance
      db = new SQL.Database(data);
      console.log('✅ Base de datos SQL.js inicializada correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      throw error;
    }
  }
  
  return db;
}

// Save database to file
function saveDatabase() {
  try {
    if (db) {
      const data = db.export();
      fs.writeFileSync(dbPath, data);
      console.log('💾 Base de datos guardada en:', dbPath);
    }
  } catch (error) {
    console.error('❌ Error guardando base de datos:', error);
  }
}

// Inicializar la base de datos y crear tablas
async function initializeDatabase() {
  try {
    const database = await getDatabase();
    
    console.log('🔧 Creando tablas de base de datos...');
    
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
    
    database.run(createTable);
    console.log('✅ Tabla trolls creada/verificada');
    
    // Crear índices para mejor performance
    const createIndexes = [
      `CREATE INDEX IF NOT EXISTS idx_trolls_nick ON trolls(nick)`,
      `CREATE INDEX IF NOT EXISTS idx_trolls_steam_id ON trolls(steam_id)`,
      `CREATE INDEX IF NOT EXISTS idx_trolls_date_added ON trolls(date_added DESC)`
    ];
    
    for (const indexQuery of createIndexes) {
      database.run(indexQuery);
    }
    
    console.log('✅ Índices creados/verificados');
    
    // Save the database after initialization
    saveDatabase();
    console.log('✅ Base de datos inicializada completamente');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}

// Funciones para manejar trolls
export const trollsDB = {
  // Inicializar la base de datos
  async init() {
    await initializeDatabase();
  },

  // Obtener todos los trolls
  async getAll() {
    const database = await getDatabase();
    const stmt = database.prepare('SELECT * FROM trolls ORDER BY date_added DESC');
    const results = [];
    
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    
    stmt.free();
    return results;
  },

  // Agregar un nuevo troll
  async add(troll) {
    const database = await getDatabase();
    
    const stmt = database.prepare(`
      INSERT INTO trolls (nick, steam_id, steam_id64, reason, faceit_url)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      troll.nick,
      troll.steamId,
      troll.steamId64 || 'No resuelto',
      troll.reason || 'Sin razón especificada',
      troll.faceitUrl || ''
    ]);
    
    const insertId = database.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
    stmt.free();
    
    // Save database after insert
    saveDatabase();
    
    // Get the inserted troll
    const getStmt = database.prepare('SELECT * FROM trolls WHERE id = ?');
    getStmt.bind([insertId]);
    
    let result = null;
    if (getStmt.step()) {
      result = getStmt.getAsObject();
    }
    
    getStmt.free();
    return result;
  },

  // Actualizar un troll existente
  async update(id, troll) {
    const database = await getDatabase();
    
    const stmt = database.prepare(`
      UPDATE trolls 
      SET nick = ?, steam_id = ?, steam_id64 = ?, reason = ?, faceit_url = ?, last_modified = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run([
      troll.nick,
      troll.steamId,
      troll.steamId64 || 'No resuelto',
      troll.reason || 'Sin razón especificada',
      troll.faceitUrl || '',
      id
    ]);
    
    const changes = database.getRowsModified();
    stmt.free();
    
    if (changes === 0) {
      return null; // No se encontró el troll
    }
    
    // Save database after update
    saveDatabase();
    
    // Get the updated troll
    const getStmt = database.prepare('SELECT * FROM trolls WHERE id = ?');
    getStmt.bind([id]);
    
    let result = null;
    if (getStmt.step()) {
      result = getStmt.getAsObject();
    }
    
    getStmt.free();
    return result;
  },

  // Eliminar un troll
  async delete(id) {
    const database = await getDatabase();
    
    const stmt = database.prepare('DELETE FROM trolls WHERE id = ?');
    stmt.run([id]);
    
    const changes = database.getRowsModified();
    stmt.free();
    
    // Save database after delete
    saveDatabase();
    
    return changes > 0;
  },

  // Obtener un troll por ID
  async getById(id) {
    const database = await getDatabase();
    
    const stmt = database.prepare('SELECT * FROM trolls WHERE id = ?');
    stmt.bind([id]);
    
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    
    stmt.free();
    return result;
  },

  // Buscar trolls por nick o steam_id
  async search(query) {
    const database = await getDatabase();
    
    const stmt = database.prepare(`
      SELECT * FROM trolls 
      WHERE nick LIKE ? OR steam_id LIKE ? 
      ORDER BY date_added DESC
    `);
    
    const searchTerm = `%${query}%`;
    stmt.bind([searchTerm, searchTerm]);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    
    stmt.free();
    return results;
  }
};

// Cerrar la base de datos cuando el proceso termine
process.on('exit', () => {
  if (db) {
    saveDatabase();
    db.close();
  }
});

process.on('SIGINT', () => {
  if (db) {
    saveDatabase();
    db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (db) {
    saveDatabase();
    db.close();
  }
  process.exit(0);
});