import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

// Crear directorio de datos si no existe
const dataDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'trolls.db');
const lockPath = path.join(dataDir, 'trolls.lock');

let SQL = null;
let db = null;
let isInitialized = false;

// Función para crear un lock simple
function acquireLock() {
  try {
    if (fs.existsSync(lockPath)) {
      // Verificar si el lock es muy viejo (más de 30 segundos)
      const lockStats = fs.statSync(lockPath);
      const lockAge = Date.now() - lockStats.mtime.getTime();
      if (lockAge > 30000) {
        console.log('🔓 Removiendo lock viejo');
        fs.unlinkSync(lockPath);
      } else {
        return false; // Lock activo
      }
    }
    fs.writeFileSync(lockPath, process.pid.toString());
    return true;
  } catch (error) {
    console.warn('⚠️ Error adquiriendo lock:', error.message);
    return false;
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  } catch (error) {
    console.warn('⚠️ Error liberando lock:', error.message);
  }
}

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
  if (isInitialized && db) {
    return db;
  }

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
    // Intentar adquirir lock con reintentos
    let lockAcquired = false;
    for (let i = 0; i < 10; i++) {
      lockAcquired = acquireLock();
      if (lockAcquired) break;
      console.log(`🔒 Esperando lock... intento ${i + 1}/10`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!lockAcquired) {
      console.warn('⚠️ No se pudo adquirir lock, continuando sin él');
    }

    try {
      console.log('🗄️ Inicializando base de datos en:', dbPath);
      
      // Try to load existing database file
      let data = null;
      if (fs.existsSync(dbPath)) {
        try {
          // Verificar que el archivo no esté corrupto
          const fileStats = fs.statSync(dbPath);
          if (fileStats.size > 0) {
            data = fs.readFileSync(dbPath);
            console.log('📖 Base de datos existente cargada, tamaño:', fileStats.size, 'bytes');
          } else {
            console.warn('⚠️ Archivo de base de datos vacío, creando nuevo');
          }
        } catch (error) {
          console.warn('⚠️ No se pudo cargar la base de datos existente, creando nueva:', error.message);
        }
      }
      
      // Create database instance
      db = new SQL.Database(data);
      console.log('✅ Base de datos SQL.js inicializada correctamente');
      isInitialized = true;
      
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      throw error;
    } finally {
      if (lockAcquired) {
        releaseLock();
      }
    }
  }
  
  return db;
}

// Save database to file
async function saveDatabase() {
  if (!db) return;

  const lockAcquired = acquireLock();
  if (!lockAcquired) {
    console.warn('⚠️ No se pudo adquirir lock para guardar, saltando...');
    return;
  }

  try {
    const data = db.export();
    
    // Escribir a un archivo temporal primero
    const tempPath = dbPath + '.tmp';
    fs.writeFileSync(tempPath, data);
    
    // Verificar que el archivo temporal se escribió correctamente
    const tempStats = fs.statSync(tempPath);
    if (tempStats.size > 0) {
      // Mover el archivo temporal al archivo final (operación atómica)
      fs.renameSync(tempPath, dbPath);
      fs.writeFileSync(dbPath, data);
      console.log('💾 Base de datos guardada en:', dbPath);
    } else {
      console.error('❌ Error: archivo temporal vacío');
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  } catch (error) {
    console.error('❌ Error guardando base de datos:', error);
    // Limpiar archivo temporal si existe
    const tempPath = dbPath + '.tmp';
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (cleanupError) {
        console.error('❌ Error limpiando archivo temporal:', cleanupError);
      }
    }
  } finally {
    releaseLock();
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
    console.log('📋 Obtenidos', results.length, 'trolls de la base de datos');
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
    await saveDatabase();
    
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
    await saveDatabase();
    
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
    await saveDatabase();
    
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
    releaseLock();
    db.close();
  }
});

process.on('SIGINT', () => {
  if (db) {
    releaseLock();
    db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (db) {
    releaseLock();
    db.close();
  }
  process.exit(0);
});